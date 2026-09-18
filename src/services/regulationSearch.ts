import { RegulationDocument, ArticleItem } from '../types';

interface ScoredArticle {
  docCategory: string;
  docNumber: string;
  docTitle: string;
  pasal: string;
  content: string;
  score: number;
}

export interface PreparedRegulationContext {
  catalogText: string;
  articlesText: string;
  selectedCount: number;
  totalDocsCount: number;
}

// Indonesian legal stop words to filter out for keyword search
const STOP_WORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'adalah', 'ini', 'itu',
  'atau', 'dengan', 'oleh', 'sebagai', 'dalam', 'bisa', 'dapat', 'akan',
  'apakah', 'bagaimana', 'apa', 'mengapa', 'kenapa', 'kapan', 'siapa',
  'tolong', 'jelaskan', 'sebutkan', 'uraikan', 'tuliskan', 'mohon', 'kami',
  'saya', 'anda', 'tersebut', 'tentang', 'atas', 'mengenai', 'secara', 'harus',
  'jika', 'bila', 'karena', 'maka', 'namun', 'tetapi', 'bahwa', 'setiap', 'orang'
]);

/**
 * Extract meaningful keywords from prompt
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s\d]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Build a compact catalog of all loaded regulations
 * Takes very few tokens (~80-100 characters per document)
 */
export function buildRegulationCatalog(regulations: RegulationDocument[]): string {
  if (!regulations || regulations.length === 0) {
    return 'Belum ada dokumen regulasi yang dimuat.';
  }

  const lines = regulations.map((doc, i) => {
    const desc = (doc.description || '').replace(/\s+/g, ' ').trim().slice(0, 110);
    return `${i + 1}. [${doc.category}] ${doc.number} - "${doc.title}" (${doc.year})${desc ? ` : ${desc}` : ''}`;
  });

  return lines.join('\n');
}

/**
 * Select the most relevant articles matching the query within a strict character/token budget
 * This prevents hitting the Gemini Free-tier limit of 250,000 input tokens per minute.
 */
export function selectRelevantRegulationContext(
  query: string,
  regulations: RegulationDocument[],
  mode: 'chat' | 'summarize' | 'compare' = 'chat',
  maxArticleChars: number = 18000
): PreparedRegulationContext {
  if (!regulations || regulations.length === 0) {
    return {
      catalogText: 'TIDAK ADA DOKUMEN REGULASI.',
      articlesText: '',
      selectedCount: 0,
      totalDocsCount: 0,
    };
  }

  const catalogText = buildRegulationCatalog(regulations);
  const qLower = query.toLowerCase();
  const keywords = extractKeywords(query);

  // Check if a specific document number is mentioned in the query (e.g. "21", "94", "2019", "2021", "2023", "2024")
  const numbersInQuery = query.match(/\b\d+\b/g) || [];
  const categoriesInQuery = ['uu', 'pp', 'perba', 'kepka', 'kpt'].filter((cat) =>
    new RegExp(`\\b${cat}\\b`, 'i').test(query)
  );

  const scoredArticles: ScoredArticle[] = [];

  for (const doc of regulations) {
    const docNumLower = doc.number.toLowerCase();
    const docTitleLower = doc.title.toLowerCase();
    const docCategoryLower = doc.category.toLowerCase();

    // Check if document is specifically targeted
    let docTargetScore = 0;
    if (categoriesInQuery.includes(docCategoryLower)) {
      docTargetScore += 6;
    }
    for (const num of numbersInQuery) {
      if (docNumLower.includes(num)) {
        docTargetScore += 15;
      }
    }
    if (qLower.includes(docTitleLower) || docTitleLower.includes(qLower)) {
      docTargetScore += 12;
    }

    // Score individual articles
    const articles = doc.articles || [];
    for (const art of articles) {
      let score = docTargetScore;
      const pasalLower = art.pasal.toLowerCase();
      const contentLower = art.content.toLowerCase();

      // Exact pasal match (e.g. "pasal 16", "pasal 33", "pasal 8")
      for (const num of numbersInQuery) {
        if (pasalLower.includes(num)) {
          score += 20;
        }
      }

      // Keyword matches
      for (const kw of keywords) {
        if (pasalLower.includes(kw)) {
          score += 8;
        }
        if (contentLower.includes(kw)) {
          score += 3;
        }
      }

      // Exact phrase match bonus
      if (keywords.length >= 2) {
        const fullPhrase = keywords.slice(0, 3).join(' ');
        if (contentLower.includes(fullPhrase)) {
          score += 15;
        }
      }

      scoredArticles.push({
        docCategory: doc.category,
        docNumber: doc.number,
        docTitle: doc.title,
        pasal: art.pasal,
        content: art.content.trim(),
        score,
      });
    }
  }

  // Sort by score descending
  scoredArticles.sort((a, b) => b.score - a.score);

  // Take top scored articles, ensuring we don't exceed maxArticleChars
  const chosenArticles: ScoredArticle[] = [];
  let currentChars = 0;

  // Filter top matches
  const topMatches = scoredArticles.filter((a) => a.score > 0);
  const candidatePool = topMatches.length > 0 ? topMatches : scoredArticles.slice(0, 8);

  for (const item of candidatePool) {
    // Truncate individual article if excessively long (e.g. max 1,800 chars per article)
    const truncatedContent = item.content.length > 1800 ? item.content.slice(0, 1800) + '... [teks berlanjut]' : item.content;
    const itemCharLength = truncatedContent.length + 100;

    if (currentChars + itemCharLength > maxArticleChars) {
      // If we already have at least 3 articles, stop
      if (chosenArticles.length >= 3) {
        break;
      }
    }

    chosenArticles.push({
      ...item,
      content: truncatedContent,
    });
    currentChars += itemCharLength;

    if (chosenArticles.length >= 15) {
      break;
    }
  }

  // Format articles
  const articlesText = chosenArticles
    .map(
      (a, i) =>
        `[RUJUKAN ${i + 1}] ${a.docNumber} (${a.docTitle}) - ${a.pasal}:\n${a.content}`
    )
    .join('\n\n---------------------------------\n\n');

  return {
    catalogText,
    articlesText,
    selectedCount: chosenArticles.length,
    totalDocsCount: regulations.length,
  };
}

export interface ClientSideSearchResult {
  answer: string;
  citations: string[];
  isNotFoundNotice?: boolean;
}

/**
 * Intelligent client-side fallback search when backend (/api/gemini/analyze)
 * is not available (e.g. static hosting on GitHub Pages).
 */
export function performClientSideRegulationSearch(
  query: string,
  regulations: RegulationDocument[],
  mode: 'chat' | 'summarize' | 'compare' = 'chat'
): ClientSideSearchResult {
  if (!regulations || regulations.length === 0) {
    return {
      answer:
        '⚠️ **Belum Ada Basis Data Regulasi yang Dimuat**\n\nSilakan muat dokumen regulasi melalui menu **Sinkronisasi / Impor Database** di bilah navigasi atas (pilih tab "Impor / Ekspor JSON" atau "Input Teks Manual").',
      citations: [],
      isNotFoundNotice: true,
    };
  }

  const qLower = query.toLowerCase();
  const keywords = extractKeywords(query);
  const numbersInQuery = query.match(/\b\d+\b/g) || [];
  const categoriesInQuery = ['uu', 'pp', 'perba', 'kepka', 'kpt'].filter((cat) =>
    new RegExp(`\\b${cat}\\b`, 'i').test(query)
  );

  const scoredArticles: ScoredArticle[] = [];

  for (const doc of regulations) {
    const docNumLower = doc.number.toLowerCase();
    const docTitleLower = doc.title.toLowerCase();
    const docCategoryLower = doc.category.toLowerCase();

    let docTargetScore = 0;
    if (categoriesInQuery.includes(docCategoryLower)) {
      docTargetScore += 8;
    }
    for (const num of numbersInQuery) {
      if (docNumLower.includes(num)) {
        docTargetScore += 18;
      }
    }
    if (qLower.includes(docTitleLower) || docTitleLower.includes(qLower)) {
      docTargetScore += 15;
    }

    const articles = doc.articles || [];
    for (const art of articles) {
      let score = docTargetScore;
      const pasalLower = art.pasal.toLowerCase();
      const contentLower = art.content.toLowerCase();

      for (const num of numbersInQuery) {
        if (pasalLower.includes(num)) {
          score += 25;
        }
      }

      for (const kw of keywords) {
        if (pasalLower.includes(kw)) {
          score += 10;
        }
        if (contentLower.includes(kw)) {
          score += 4;
        }
      }

      if (keywords.length >= 2) {
        const fullPhrase = keywords.slice(0, 3).join(' ');
        if (contentLower.includes(fullPhrase)) {
          score += 20;
        }
      }

      if (score > 0) {
        scoredArticles.push({
          docCategory: doc.category,
          docNumber: doc.number,
          docTitle: doc.title,
          pasal: art.pasal,
          content: art.content.trim(),
          score,
        });
      }
    }
  }

  scoredArticles.sort((a, b) => b.score - a.score);

  const topMatches = scoredArticles.slice(0, 5);

  if (topMatches.length === 0) {
    return {
      answer: `Informasi mengenai **"${query}"** tidak ditemukan secara spesifik dalam pasal-pasal regulasi yang saat ini tersimpan.\n\n💡 **Saran Pencarian:**\n- Gunakan kata kunci pokok (contoh: *persyaratan karantina*, *tindakan 8T*, *kawasan karantina*, *sertifikat kesehatan*, *pidana karantina*).\n- Cantumkan nomor pasal atau undang-undang (contoh: *Pasal 16 UU 21 2019* atau *PP 29 2023*).\n\n*(Catatan: Anda sedang menggunakan penelusuran regulasi lokal di GitHub Pages. Untuk analisis naratif AI otomatis, hubungkan repositori ke Render.com gratis).*`,
      citations: [],
      isNotFoundNotice: true,
    };
  }

  const citations: string[] = [];
  const articleBlocks = topMatches.map((art, idx) => {
    const citation = `${art.docNumber} - ${art.pasal}`;
    if (!citations.includes(citation)) {
      citations.push(citation);
    }

    const cleanContent =
      art.content.length > 700 ? art.content.slice(0, 700) + '... *(buka rujukan di bawah untuk teks lengkap)*' : art.content;

    return `#### ${idx + 1}. **${art.docNumber} - ${art.pasal}**\n*${art.docTitle}*\n\n> ${cleanContent.replace(/\n/g, '\n> ')}`;
  });

  const modeBadge =
    mode === 'summarize'
      ? 'Ringkasan Ketentuan Pokok'
      : mode === 'compare'
      ? 'Komparasi Dasar Regulasi'
      : 'Penelusuran Ketentuan Regulasi';

  const answer = `### 📋 ${modeBadge}

> ℹ️ **Mode Penelusuran Langsung (GitHub Pages):**  
> Pertanyaan Anda dijawab langsung dari basis data naskah regulasi yang tersimpan di browser Anda (tanpa backend server).

Berdasarkan penelusuran kata kunci terhadap basis data peraturan perundangan karantina, ditemukan ketentuan berikut:

${articleBlocks.join('\n\n---\n\n')}

---
🔍 *Klik tombol rujukan di bawah untuk membaca pasal selengkapnya, menyalin isi pasal, atau membandingkannya.*`;

  return {
    answer,
    citations,
  };
}
