import { DriveFileItem, RegulationCategory, RegulationDocument, ArticleItem } from '../types';

export const DEDICATED_REGULATION_FOLDER_NAME = 'database regulasi karantina ASN';

export function classifyFolderCategory(folderName: string): RegulationCategory {
  const norm = folderName.trim().toLowerCase();
  if (
    norm === 'uu' ||
    norm.startsWith('uu ') ||
    norm.startsWith('uu_') ||
    norm.startsWith('uu-') ||
    norm.includes('undang')
  ) {
    return 'UU';
  }
  if (
    norm === 'pp' ||
    norm.startsWith('pp ') ||
    norm.startsWith('pp_') ||
    norm.startsWith('pp-') ||
    norm.includes('pemerintah')
  ) {
    return 'PP';
  }
  if (
    norm === 'perba' ||
    norm.startsWith('perba ') ||
    norm.startsWith('perba_') ||
    norm.startsWith('perba-') ||
    norm.includes('peraturan badan') ||
    norm.includes('badan')
  ) {
    return 'PERBA';
  }
  if (
    norm === 'kepka' ||
    norm.startsWith('kepka ') ||
    norm.startsWith('kepka_') ||
    norm.startsWith('kepka-') ||
    norm === 'kpt' ||
    norm.includes('keputusan') ||
    norm.includes('kepala')
  ) {
    return 'KEPKA';
  }
  return 'UU';
}

export async function findDedicatedFolder(
  accessToken: string,
  targetName: string = DEDICATED_REGULATION_FOLDER_NAME
): Promise<DriveFileItem | null> {
  try {
    // 1. Direct search by exact name
    const exactQuery = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${targetName.replace(/'/g, "\\'")}'`
    );
    const exactUrl = `https://www.googleapis.com/drive/v3/files?q=${exactQuery}&fields=files(id,name,mimeType,modifiedTime)&pageSize=10`;
    const res = await fetch(exactUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          mimeType: data.files[0].mimeType,
          modifiedTime: data.files[0].modifiedTime,
        };
      }
    }

    // 2. Case-insensitive / partial search across all folders
    const allFolders = await fetchDriveFolders(accessToken);
    const normalizedTarget = targetName.trim().toLowerCase();

    // Exact match case-insensitive
    const exactMatch = allFolders.find(
      (f) => f.name.trim().toLowerCase() === normalizedTarget
    );
    if (exactMatch) return exactMatch;

    // Partial contains match (e.g. 'database regulasi karantina ASN')
    const partialMatch = allFolders.find(
      (f) =>
        f.name.toLowerCase().includes(normalizedTarget) ||
        normalizedTarget.includes(f.name.toLowerCase()) ||
        (f.name.toLowerCase().includes('regulasi') && f.name.toLowerCase().includes('karantina'))
    );
    if (partialMatch) return partialMatch;

    return null;
  } catch (err) {
    console.warn('Error finding dedicated folder in Drive:', err);
    return null;
  }
}

export async function fetchDriveFolders(accessToken: string): Promise<DriveFileItem[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime)&pageSize=100&orderBy=name`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal memuat folder Google Drive: ${errorText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
  }));
}

export interface DriveSubfolderMeta {
  id: string;
  name: string;
  category: RegulationCategory;
}

export async function fetchRegulationSubfolders(
  accessToken: string,
  parentFolderId: string
): Promise<DriveSubfolderMeta[]> {
  try {
    const query = encodeURIComponent(
      `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime)&pageSize=50&orderBy=name`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        category: classifyFolderCategory(f.name),
      }));
    }
  } catch (e) {
    console.warn('Could not fetch regulation subfolders:', e);
  }
  return [];
}

export async function fetchSubfolderIds(accessToken: string, parentFolderId: string): Promise<string[]> {
  const subfolders = await fetchRegulationSubfolders(accessToken, parentFolderId);
  return subfolders.map((s) => s.id);
}

export async function fetchDriveFiles(
  accessToken: string,
  folderId?: string | null,
  options?: {
    onlyTargetFolder?: boolean;
    targetFolderName?: string;
  }
): Promise<DriveFileItem[]> {
  let effectiveFolderId = folderId;

  // If onlyTargetFolder is requested and folderId is missing, attempt auto-discovery of the dedicated folder
  if (!effectiveFolderId && options?.onlyTargetFolder) {
    const foundFolder = await findDedicatedFolder(
      accessToken,
      options.targetFolderName || DEDICATED_REGULATION_FOLDER_NAME
    );
    if (foundFolder) {
      effectiveFolderId = foundFolder.id;
    } else {
      // User strictly wants ONLY this specific folder, so do not fetch other files if not found
      return [];
    }
  }

  let queryParts: string[] = ['trashed=false'];
  const subfolderMap = new Map<string, DriveSubfolderMeta>();

  if (effectiveFolderId) {
    // 1. Fetch subfolders (UU, PP, PERBA, KEPKA) inside the dedicated folder
    const subfolders = await fetchRegulationSubfolders(accessToken, effectiveFolderId);
    for (const sf of subfolders) {
      subfolderMap.set(sf.id, sf);
    }

    const allParentIds = [effectiveFolderId, ...subfolders.map((s) => s.id)];
    const parentClauses = allParentIds.map((id) => `'${id}' in parents`).join(' or ');
    queryParts.push(`(${parentClauses})`);
  } else if (options?.onlyTargetFolder) {
    // If strict target folder is requested and not found, return empty
    return [];
  } else {
    // Search for documents, text files, or PDFs anywhere
    queryParts.push(
      "(mimeType='application/vnd.google-apps.document' or mimeType='text/plain' or mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')"
    );
  }

  const query = encodeURIComponent(queryParts.join(' and '));
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size,parents)&pageSize=100&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membaca berkas dari Google Drive: ${errorText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => {
    // Identify subfolder origin if present
    const matchingSubfolder = (f.parents || []).map((pId: string) => subfolderMap.get(pId)).find(Boolean);

    let categoryGuessed: RegulationCategory;
    let subfolderName: string | undefined;
    let subfolderId: string | undefined;

    if (matchingSubfolder) {
      categoryGuessed = matchingSubfolder.category;
      subfolderName = matchingSubfolder.name;
      subfolderId = matchingSubfolder.id;
    } else {
      // Fallback: filename-based detection
      const upper = f.name.toUpperCase();
      if (upper.includes('PERBA') || upper.includes('PERATURAN BADAN') || upper.includes('PERKA')) {
        categoryGuessed = 'PERBA';
      } else if (upper.includes('KEPKA') || upper.includes('KEPUTUSAN KEPALA') || upper.includes('KPT') || upper.includes('KEPUTUSAN')) {
        categoryGuessed = 'KEPKA';
      } else if (upper.includes('PP ') || upper.includes('PERATURAN PEMERINTAH')) {
        categoryGuessed = 'PP';
      } else {
        categoryGuessed = 'UU';
      }
    }

    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      modifiedTime: f.modifiedTime,
      size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined,
      categoryGuessed,
      subfolderId,
      subfolderName,
    };
  });
}

export interface PublicDriveFolderResult {
  success: boolean;
  folderId: string;
  folderName: string;
  subfolders: Array<{ id: string; name: string; category: RegulationCategory; count: number }>;
  totalFiles: number;
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    category: RegulationCategory;
    subfolderId?: string;
    subfolderName?: string;
  }>;
}

// Parse public Google Drive folder & subfolders from URL or ID without login
export async function parsePublicDriveFolder(folderUrlOrId: string): Promise<PublicDriveFolderResult> {
  const res = await fetch('/api/drive/parse-public-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: folderUrlOrId }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Server backend Express (/api/drive/*) tidak tersedia di hosting statis (seperti GitHub Pages). Gunakan tab "Backup / Impor Database (.json)" untuk mengimpor peraturan secara instan, atau deploy repositori ini ke Render.com (gratis) agar backend Node.js aktif otomatis.'
      );
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Gagal membaca folder Google Drive (${res.status}). Pastikan link folder publik dapat diakses.`);
  }

  return await res.json();
}

// Fetch public file text (Google Docs, PDF, TXT) without login
export async function fetchPublicFileText(fileId: string, mimeType?: string, fileName?: string): Promise<string> {
  const res = await fetch('/api/drive/fetch-public-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, mimeType, fileName }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Gagal mengunduh isi berkas Google Drive.`);
  }

  const data = await res.json();
  return data.content || '';
}

// Sync all documents from a public Google Drive folder link without login
export async function syncFromPublicFolderLink(
  folderUrlOrId: string,
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<{ folderName: string; folderId: string; subfolders: Array<{ id: string; name: string; category: RegulationCategory; count: number }>; documents: RegulationDocument[] }> {
  if (onProgress) onProgress('Memeriksa struktur folder utama dan subfolder Google Drive...', 0, 0);

  const folderData = await parsePublicDriveFolder(folderUrlOrId);
  const { files, folderName, folderId, subfolders } = folderData;

  const documents: RegulationDocument[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const f = files[i];
    if (onProgress) {
      onProgress(`Mengunduh & memproses (${i + 1}/${total}): ${f.name}`, i + 1, total);
    }

    try {
      const content = await fetchPublicFileText(f.id, f.mimeType, f.name);
      if (content && content.trim().length > 10) {
        const doc = parseRegulationContent(
          f.name,
          content,
          f.id,
          new Date().toISOString(),
          f.category,
          f.subfolderName
        );
        documents.push(doc);
      }
    } catch (fileErr) {
      console.warn(`Gagal memuat isi file ${f.name}:`, fileErr);
    }
  }

  return {
    folderName,
    folderId,
    subfolders,
    documents,
  };
}

export async function fetchFileContent(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  // Call server proxy or direct Google Drive API
  try {
    const response = await fetch('/api/drive/fetch-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ fileId, mimeType }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.content || '';
    }
  } catch (err) {
    console.warn('Proxy fetch failed, attempting client-side fetch:', err);
  }

  // Fallback to client-side direct request
  let url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Gagal mengunduh teks berkas regulasi dari Google Drive.');
  }

  return await res.text();
}

export function parseRegulationContent(
  fileName: string,
  rawContent: string,
  fileId?: string,
  modifiedTime?: string,
  subfolderCategory?: RegulationCategory,
  subfolderName?: string
): RegulationDocument {
  let category: RegulationCategory = subfolderCategory || 'UU';

  if (!subfolderCategory) {
    const upper = (fileName + ' ' + rawContent.slice(0, 500)).toUpperCase();
    if (upper.includes('PERBA') || upper.includes('PERATURAN BADAN') || upper.includes('PERKA')) {
      category = 'PERBA';
    } else if (upper.includes('KEPKA') || upper.includes('KEPUTUSAN KEPALA') || upper.includes('KPT') || upper.includes('KEPUTUSAN')) {
      category = 'KEPKA';
    } else if (upper.includes('PP ') || upper.includes('PERATURAN PEMERINTAH')) {
      category = 'PP';
    } else {
      category = 'UU';
    }
  }

  // Clean title & number
  let cleanNumber = fileName.replace(/\.[^/.]+$/, '').trim();
  const title = cleanNumber;
  const yearMatch = fileName.match(/20\d{2}|19\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

  // Extract Pasal / Diktum articles
  const articles: ArticleItem[] = [];
  const lines = rawContent.split(/\r?\n/);

  let currentPasal: string | null = null;
  let currentBab: string | undefined = undefined;
  let currentContent: string[] = [];

  const pasalRegex = /^(Pasal\s+\d+|Diktum\s+[A-Z]+|KETENTUAN\s+[A-Z]+)/i;
  const babRegex = /^(BAB\s+[IVXLCDM]+)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (babRegex.test(trimmed)) {
      currentBab = trimmed;
    }

    const match = trimmed.match(pasalRegex);
    if (match) {
      if (currentPasal && currentContent.length > 0) {
        articles.push({
          id: `art-${articles.length + 1}`,
          bab: currentBab,
          pasal: currentPasal,
          content: currentContent.join('\n').trim(),
        });
      }
      currentPasal = match[0];
      currentContent = [trimmed.slice(match[0].length).trim()].filter(Boolean);
    } else if (currentPasal) {
      currentContent.push(trimmed);
    }
  }

  if (currentPasal && currentContent.length > 0) {
    articles.push({
      id: `art-${articles.length + 1}`,
      bab: currentBab,
      pasal: currentPasal,
      content: currentContent.join('\n').trim(),
    });
  }

  // If no structured articles found, create default summary article
  if (articles.length === 0) {
    articles.push({
      id: 'art-1',
      pasal: 'Ketentuan Umum',
      content: rawContent.slice(0, 3000),
    });
  }

  return {
    id: fileId ? `drive-${fileId}` : `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category,
    number: cleanNumber,
    title,
    year,
    description: rawContent.slice(0, 200).replace(/\s+/g, ' ').trim() + '...',
    source: 'google_drive',
    driveFileId: fileId,
    driveModifiedTime: modifiedTime,
    subfolderName,
    lastSyncedAt: new Date().toISOString(),
    articles,
    fullText: rawContent.slice(0, 15000), // Cap for context size
  };
}
