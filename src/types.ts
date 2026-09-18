export type RegulationCategory = 'UU' | 'PP' | 'PERBA' | 'KEPKA' | 'KPT';

export interface ArticleItem {
  id: string;
  bab?: string;
  pasal: string; // e.g. "Pasal 16"
  content: string;
  explanation?: string;
}

export interface RegulationDocument {
  id: string;
  category: RegulationCategory;
  number: string; // e.g. "UU No. 21 Tahun 2019"
  title: string; // e.g. "Karantina Hewan, Ikan, dan Tumbuhan"
  year: number;
  description: string;
  source: 'google_drive' | 'sistem_bawaan' | 'unggah_manual';
  driveFileId?: string;
  driveModifiedTime?: string;
  subfolderName?: string; // e.g. "UU", "PP", "PERBA", "KEPKA"
  lastSyncedAt: string;
  articles: ArticleItem[];
  fullText: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: string[];
  isNotFoundNotice?: boolean;
  isQuotaError?: boolean;
  retryPrompt?: string;
  retryAfterSeconds?: number;
  mode?: 'chat' | 'summarize' | 'compare';
}

export interface DriveSyncConfig {
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  targetFolderId: string | null;
  targetFolderName: string | null;
  targetFolderUrl?: string; // URL tautan folder Google Drive (tanpa login akun Google)
  subfolderUrls?: {
    UU?: string;
    PP?: string;
    PERBA?: string;
    KEPKA?: string;
  };
  lastSyncTime: string | null;
  syncedFilesCount: number;
  onlyTargetFolder?: boolean;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  categoryGuessed?: RegulationCategory;
  subfolderId?: string;
  subfolderName?: string;
  parentName?: string;
}

export interface SubfolderSummary {
  id: string;
  name: string;
  category: RegulationCategory;
  count: number;
}
