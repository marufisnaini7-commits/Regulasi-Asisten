import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy GoogleGenAI client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Helper to extract Google Drive folder ID from URL or raw ID
function extractFolderId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const folderMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]{15,})/);
  if (folderMatch) return folderMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (idMatch) return idMatch[1];
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  if (dMatch) return dMatch[1];
  return trimmed;
}

// Decode HTML entities in scraped Google Drive names
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Classify regulation category from subfolder name or file name
function classifyCategory(name: string, subfolderName?: string): 'UU' | 'PP' | 'PERBA' | 'KEPKA' | 'KPT' {
  const normSub = (subfolderName || '').trim().toLowerCase();
  if (normSub === 'uu' || normSub.startsWith('uu ') || normSub.includes('undang')) return 'UU';
  if (normSub === 'pp' || normSub.startsWith('pp ') || normSub.includes('pemerintah')) return 'PP';
  if (normSub === 'perba' || normSub.startsWith('perba ') || normSub.includes('badan')) return 'PERBA';
  if (normSub === 'kepka' || normSub.startsWith('kepka ') || normSub === 'kpt' || normSub.includes('kepala') || normSub.includes('keputusan')) return 'KEPKA';

  const normFile = name.trim().toLowerCase();
  if (normFile.includes('perba') || normFile.includes('peraturan badan') || normFile.includes('perka')) return 'PERBA';
  if (normFile.includes('kepka') || normFile.includes('keputusan kepala') || normFile.includes('kpt') || normFile.includes('juknis')) return 'KEPKA';
  if (normFile.includes('pp ') || normFile.includes('peraturan pemerintah')) return 'PP';
  return 'UU';
}

interface ScrapedDriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
}

const DRIVE_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36';

async function fetchFolderListing(folderId: string): Promise<{ title: string; items: ScrapedDriveItem[] }> {
  const url = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': DRIVE_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`Google Drive merespons status ${res.status}. Pastikan tautan folder disetel 'Siapa saja yang memiliki link dapat melihat' (Anyone with link can view).`);
  }

  const text = await res.text();
  const titleMatch = text.match(/<title>(.*?)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1] : 'Google Drive Folder';
  const title = decodeHtmlEntities(rawTitle).replace(/ - Google Drive$/, '');

  const items: ScrapedDriveItem[] = [];
  const seenIds = new Set<string>();

  // Match <a> tags in the HTML
  const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match;
  while ((match = aRegex.exec(text)) !== null) {
    const href = match[1];
    const rawName = match[2].replace(/<[^>]+>/g, '').trim();
    const name = decodeHtmlEntities(rawName);

    // Subfolder link
    const folderMatch = href.match(/https:\/\/drive\.google\.com\/drive\/folders\/([-\w]{25,})/);
    if (folderMatch) {
      const childId = folderMatch[1];
      if (!seenIds.has(childId)) {
        seenIds.add(childId);
        items.push({
          id: childId,
          name: name || 'Subfolder',
          mimeType: 'application/vnd.google-apps.folder',
          isFolder: true,
        });
      }
      continue;
    }

    // Google Drive File link
    const fileMatch = href.match(/https:\/\/drive\.google\.com\/file\/d\/([-\w]{25,})\//);
    if (fileMatch) {
      const childId = fileMatch[1];
      if (!seenIds.has(childId)) {
        seenIds.add(childId);
        const isPdf = name.toLowerCase().endsWith('.pdf');
        items.push({
          id: childId,
          name: name || 'Berkas Regulasi',
          mimeType: isPdf ? 'application/pdf' : 'application/octet-stream',
          isFolder: false,
        });
      }
      continue;
    }

    // Google Docs link
    const docsMatch = href.match(/https:\/\/docs\.google\.com\/(\w+)\/d\/([-\w]{25,})\//);
    if (docsMatch) {
      const childId = docsMatch[2];
      if (!seenIds.has(childId)) {
        seenIds.add(childId);
        items.push({
          id: childId,
          name: name || 'Dokumen Regulasi',
          mimeType: 'application/vnd.google-apps.document',
          isFolder: false,
        });
      }
      continue;
    }
  }

  return { title, items };
}

// Endpoint: Parse public Google Drive folder without login (including subfolders UU, PP, PERBA, KEPKA)
app.post('/api/drive/parse-public-folder', async (req: Request, res: Response) => {
  try {
    const { url, folderId: rawFolderId } = req.body;
    const folderId = extractFolderId(rawFolderId || url || '');

    if (!folderId || folderId.length < 10) {
      return res.status(400).json({
        error: 'Link atau ID Folder Google Drive tidak valid. Format contoh: https://drive.google.com/drive/folders/1aBc...',
      });
    }

    // 1. Fetch main folder listing
    const mainListing = await fetchFolderListing(folderId);

    const subfolders: Array<{ id: string; name: string; category: string; count: number }> = [];
    const allFiles: Array<{
      id: string;
      name: string;
      mimeType: string;
      category: string;
      subfolderId?: string;
      subfolderName?: string;
    }> = [];

    // Separate folders and files in main folder
    const childFolders = mainListing.items.filter((item) => item.isFolder);
    const directFiles = mainListing.items.filter((item) => !item.isFolder);

    // Direct files in root
    for (const f of directFiles) {
      allFiles.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        category: classifyCategory(f.name),
      });
    }

    // 2. Fetch subfolders contents (e.g. UU, PP, PERBA, KEPKA)
    for (const sf of childFolders) {
      const category = classifyCategory(sf.name, sf.name);
      try {
        const subListing = await fetchFolderListing(sf.id);
        const subFiles = subListing.items.filter((item) => !item.isFolder);

        subfolders.push({
          id: sf.id,
          name: sf.name,
          category,
          count: subFiles.length,
        });

        for (const subFile of subFiles) {
          allFiles.push({
            id: subFile.id,
            name: subFile.name,
            mimeType: subFile.mimeType,
            category: classifyCategory(subFile.name, sf.name),
            subfolderId: sf.id,
            subfolderName: sf.name,
          });
        }
      } catch (subErr) {
        console.warn(`Gagal membaca subfolder ${sf.name}:`, subErr);
        subfolders.push({
          id: sf.id,
          name: sf.name,
          category,
          count: 0,
        });
      }
    }

    res.json({
      success: true,
      folderId,
      folderName: mainListing.title,
      subfolders,
      totalFiles: allFiles.length,
      files: allFiles,
    });
  } catch (error: any) {
    console.error('Error parsing public Google Drive folder:', error);
    res.status(500).json({
      error: error.message || 'Gagal memproses folder Google Drive publik.',
    });
  }
});

// Endpoint: Fetch public Google Drive file text without login (Google Docs, PDF, TXT)
app.post('/api/drive/fetch-public-file', async (req: Request, res: Response) => {
  try {
    const { fileId, mimeType, fileName } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    const isPdf = (mimeType === 'application/pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'));
    const isDoc = (mimeType === 'application/vnd.google-apps.document');

    // 1. If Google Doc, export as plain text
    if (isDoc) {
      const docUrl = `https://docs.google.com/document/d/${encodeURIComponent(fileId)}/export?format=txt`;
      const docRes = await fetch(docUrl, {
        headers: { 'User-Agent': DRIVE_USER_AGENT },
        redirect: 'follow',
      });
      if (docRes.ok) {
        const text = await docRes.text();
        if (text && text.trim().length > 0) {
          return res.json({ content: text });
        }
      }
    }

    // 2. Direct download from drive.usercontent.google.com or uc?export=download
    const downloadUrls = [
      `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download`,
      `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
    ];

    let buffer: Buffer | null = null;
    let contentType = '';

    for (const dlUrl of downloadUrls) {
      try {
        const dlRes = await fetch(dlUrl, {
          headers: { 'User-Agent': DRIVE_USER_AGENT },
          redirect: 'follow',
        });
        if (dlRes.ok) {
          contentType = dlRes.headers.get('content-type') || '';
          const ab = await dlRes.arrayBuffer();
          buffer = Buffer.from(ab);
          break;
        }
      } catch (dlErr) {
        console.warn('Download attempt failed for', dlUrl, dlErr);
      }
    }

    if (!buffer || buffer.length === 0) {
      // Last try with export=txt
      const fallbackUrl = `https://docs.google.com/document/d/${encodeURIComponent(fileId)}/export?format=txt`;
      const fbRes = await fetch(fallbackUrl, { headers: { 'User-Agent': DRIVE_USER_AGENT } });
      if (fbRes.ok) {
        const fbText = await fbRes.text();
        return res.json({ content: fbText });
      }
      return res.status(404).json({ error: 'Tidak dapat mengunduh berkas. Pastikan file berstatus publik (Anyone with link can view).' });
    }

    // 3. If PDF, parse text with pdf-parse
    if (isPdf || buffer.subarray(0, 5).toString() === '%PDF-') {
      try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return res.json({ content: result.text || '' });
      } catch (pdfErr) {
        console.warn('PDFParse error, fallback to ascii extraction:', pdfErr);
        // Fallback: extract readable strings
        const raw = buffer.toString('utf-8');
        const clean = raw.replace(/[^\x20-\x7E\r\n\t]/g, ' ').replace(/\s{2,}/g, ' ');
        return res.json({ content: clean.slice(0, 50000) });
      }
    }

    // 4. Plain text / CSV / Markdown
    const textContent = buffer.toString('utf-8');
    return res.json({ content: textContent });
  } catch (error: any) {
    console.error('Error fetching public Drive file:', error);
    res.status(500).json({ error: error.message || 'Gagal mengunduh teks berkas regulasi.' });
  }
});

// Proxy for Google Drive file export / download to avoid CORS issues if needed
app.post('/api/drive/fetch-file', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const { fileId, mimeType } = req.body;
  if (!fileId) {
    return res.status(400).json({ error: 'fileId is required' });
  }

  try {
    let url: string;
    if (mimeType === 'application/vnd.google-apps.document') {
      // Export Google Doc to text
      url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
    } else {
      // Download file media
      url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
    }

    const driveRes = await fetch(url, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      return res.status(driveRes.status).json({ error: errText || 'Failed to fetch Drive file' });
    }

    const text = await driveRes.text();
    return res.json({ content: text });
  } catch (error: any) {
    console.error('Error fetching file from Drive:', error);
    return res.status(500).json({ error: error.message || 'Internal error fetching file' });
  }
});

// AI Regulatory Analysis & Summary Endpoint
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt, history, regulationContext, catalogText, articlesText, mode } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGenAI();

    const systemInstruction = `Kamu adalah asisten analisis hukum dan regulasi perkarantinaan serta Aparatur Sipil Negara (ASN).
Tugas utamamu adalah:
1. Menjawab pertanyaan pengguna HANYA berdasarkan dokumen UU, PP, PERBA, dan KEPKA (Keputusan Kepala Badan) yang disediakan dalam basis data regulasi di bawah ini.
2. Setiap kali memberikan jawaban, interpretasi, atau rangkuman, kamu WAJIB menyebutkan nama dokumen rujukan beserta nomor pasal, ayat, atau nomor ketentuannya secara spesifik dan eksplisit (contoh format sitasi: **[UU No. 21 Tahun 2019 Pasal 16 ayat (1)]**, **[PP No. 94 Tahun 2021 Pasal 8 ayat (4)]**, **[PERBA No. 1 Tahun 2024 Pasal 15]**, **[KEPKA No. 45/2024 Diktum KEDUA]**, dsb).
3. Jika informasi atau jawaban dari pertanyaan pengguna TIDAK terdapat dalam dokumen regulasi yang disediakan, kamu WAJIB mengatakan secara jujur dan tegas:
"Informasi tersebut tidak ditemukan dalam dokumen regulasi (UU, PP, PERBA, KEPKA) yang tersedia."
4. DILARANG KERAS mengasumsikan, mengarang, atau menambahkan aturan di luar teks regulasi yang dilampirkan.
5. Gunakan Bahasa Indonesia yang baku, formal, jelas, dan berorientasi pada kepatuhan hukum serta asas legalitas.
6. Buat struktur jawaban rapi dengan poin-poin analisis, dasar hukum yang jelas, dan kutipan inti ketentuan.`;

    // Assemble compact, token-efficient context
    let formattedContext = '';

    if (catalogText || articlesText) {
      formattedContext = `--- KATALOG SELURUH REGULASI DALAM BASIS DATA ---
${catalogText || 'Semua regulasi resmi'}
--------------------------------------------------

--- KUTIPAN PASAL & KETENTUAN TERKAIT PERTANYAAN ---
${articlesText || 'Gunakan katalog dokumen di atas.'}
----------------------------------------------------`;
    } else if (Array.isArray(regulationContext) && regulationContext.length > 0) {
      formattedContext = regulationContext
        .slice(0, 10)
        .map((doc: any, index: number) => {
          const trimmedContent = (doc.content || '').slice(0, 3000);
          return `--- DOKUMEN ${index + 1}: ${doc.category} - ${doc.title} (${doc.number || ''}) ---
Sumber: ${doc.source || 'Database Regulasi'}
Ringkasan: ${doc.description || ''}
Kandungan Pasal:
${trimmedContent}`;
        })
        .join('\n\n');
    } else {
      formattedContext = 'TIDAK ADA DOKUMEN REGULASI YANG DIMUAT.';
    }

    // Strict safety cap to ensure requests stay well within Free Tier 250,000 token/minute limits
    const safeContextText = formattedContext.length > 22000
      ? formattedContext.slice(0, 22000) + '\n... [konteks dipadatkan demi efisiensi kuota]'
      : formattedContext;

    const userPromptWithContext = `=== BASIS DATA DOKUMEN REGULASI TERSEDIA ===
${safeContextText}
==============================================

${mode === 'summarize' ? '[PERMINTAAN RANGKUMAN ATURAN]' : mode === 'compare' ? '[PERMINTAAN KOMPARASI REGULASI]' : '[KONSULTASI & ANALISIS ATURAN]'}
Pertanyaan Pengguna:
${prompt}

Ingat instruksi:
- Jawab HANYA berdasarkan dokumen di atas.
- WAJIB sebutkan nama dokumen dan nomor pasal/ketentuan secara spesifik.
- Jika tidak ada di dokumen, nyatakan secara jujur bahwa informasi tidak ditemukan.`;

    // Prepare contents including conversation history (limited to last 4 turns, with truncated text)
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-4)) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: (msg.text || '').slice(0, 400) }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: userPromptWithContext }],
    });

    // Modern supported Gemini models as recommended by Google API
    // Primary: gemini-3.6-flash (recommended by API message), Fallback: gemini-3.1-flash-lite, gemini-3.8-flash
    const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.15, // Low temperature for high factual accuracy and legal adherence
          },
        });
        if (response && (response.text !== undefined && response.text !== null)) {
          console.log(`Successfully generated response using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} error (${err?.status}):`, err?.message || err);
      }
    }

    if (!response) {
      throw lastError || new Error('Gagal mendapatkan respons dari model AI Gemini.');
    }

    const replyText = response.text || '';

    // Extract potential citations for structured UI rendering
    const citationRegex = /\[(UU|PP|PERBA|KEPKA|KPT|Keputusan Kepala|Peraturan Pemerintah|Undang-Undang)[^\]]+\]/gi;
    const matchedCitations = replyText.match(citationRegex) || [];
    const uniqueCitations = Array.from(new Set(matchedCitations));

    res.json({
      answer: replyText,
      citations: uniqueCitations,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error?.message || error);

    const errorMsg = String(error?.message || '');
    const isQuotaError =
      error?.status === 429 ||
      errorMsg.includes('429') ||
      errorMsg.includes('Quota exceeded') ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('rate-limit');

    if (isQuotaError) {
      const retryMatch = errorMsg.match(/retry in ([0-9.]+)s/i) || errorMsg.match(/retryDelay["\s:]+([0-9]+)/i);
      const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 12;

      return res.status(429).json({
        error: `Batas kuota token per menit (Rate Limit 250.000 token/menit) tercapai pada model AI. Silakan tunggu sekitar ${retrySeconds} detik sebelum mengirim pertanyaan lagi.`,
        isQuotaExceeded: true,
        retryAfter: retrySeconds,
      });
    }

    res.status(500).json({
      error: error.message || 'Terjadi kesalahan saat memproses analisis hukum dengan AI.',
    });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite();
