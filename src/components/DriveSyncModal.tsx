import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  RefreshCw,
  Folder,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Layers,
  Info,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Trash2,
  Check,
  FolderTree
} from 'lucide-react';
import { DriveSyncConfig, RegulationCategory, RegulationDocument } from '../types';
import {
  parseRegulationContent,
  parsePublicDriveFolder,
  syncFromPublicFolderLink,
  PublicDriveFolderResult,
} from '../services/googleDrive';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: DriveSyncConfig;
  onUpdateSyncConfig: (config: DriveSyncConfig) => void;
  onAddRegulation: (doc: RegulationDocument) => void;
  onBulkUpdateRegulations: (docs: RegulationDocument[]) => void;
  userEmail?: string | null;
  setUserEmail?: (email: string | null) => void;
  accessToken?: string | null;
  setAccessToken?: (token: string | null) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateSyncConfig,
  onAddRegulation,
  onBulkUpdateRegulations,
}) => {
  const [folderUrlInput, setFolderUrlInput] = useState(syncConfig.targetFolderUrl || '');
  const [activeTab, setActiveTab] = useState<'link' | 'subfolders' | 'manual'>('link');
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [folderScanResult, setFolderScanResult] = useState<PublicDriveFolderResult | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  // Specific Subfolder links (UU, PP, PERBA, KEPKA)
  const [uuFolderUrl, setUuFolderUrl] = useState(syncConfig.subfolderUrls?.UU || '');
  const [ppFolderUrl, setPpFolderUrl] = useState(syncConfig.subfolderUrls?.PP || '');
  const [perbaFolderUrl, setPerbaFolderUrl] = useState(syncConfig.subfolderUrls?.PERBA || '');
  const [kepkaFolderUrl, setKepkaFolderUrl] = useState(syncConfig.subfolderUrls?.KEPKA || '');

  // Manual document upload state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<RegulationCategory>('PERBA');
  const [manualYear, setManualYear] = useState(new Date().getFullYear());
  const [manualText, setManualText] = useState('');

  // Synchronize input with syncConfig when modal opens
  useEffect(() => {
    if (isOpen) {
      if (syncConfig.targetFolderUrl) {
        setFolderUrlInput(syncConfig.targetFolderUrl);
      }
      if (syncConfig.subfolderUrls) {
        setUuFolderUrl(syncConfig.subfolderUrls.UU || '');
        setPpFolderUrl(syncConfig.subfolderUrls.PP || '');
        setPerbaFolderUrl(syncConfig.subfolderUrls.PERBA || '');
        setKepkaFolderUrl(syncConfig.subfolderUrls.KEPKA || '');
      }
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, syncConfig]);

  if (!isOpen) return null;

  // Scan and inspect Google Drive folder from link (without login)
  const handleScanFolder = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : folderUrlInput).trim();
    if (!targetUrl) {
      setError('Harap masukkan link atau ID folder Google Drive terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await parsePublicDriveFolder(targetUrl);
      setFolderScanResult(result);

      onUpdateSyncConfig({
        ...syncConfig,
        targetFolderUrl: targetUrl,
        targetFolderId: result.folderId,
        targetFolderName: result.folderName,
        onlyTargetFolder: true,
      });

      setSuccessMessage(
        `Folder "${result.folderName}" berhasil terbaca! Ditemukan ${result.subfolders.length} subfolder dan ${result.totalFiles} berkas regulasi.`
      );
    } catch (err: any) {
      console.error('Scan folder error:', err);
      setError(
        err.message ||
          'Gagal membaca link folder Google Drive. Pastikan folder disetel ke "Siapa saja yang memiliki link dapat melihat".'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Sync all documents from public folder link
  const handleSyncFromLink = async () => {
    const targetUrl = folderUrlInput.trim() || syncConfig.targetFolderUrl;
    if (!targetUrl) {
      setError('Harap masukkan link folder Google Drive.');
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await syncFromPublicFolderLink(targetUrl, (msg, current, total) => {
        setSyncProgress({ current, total, message: msg });
      });

      if (result.documents.length === 0) {
        setError(
          `Tidak ditemukan dokumen berformat teks/PDF di folder "${result.folderName}". Pastikan berkas tersimpan di folder utama atau subfolder UU, PP, PERBA, KEPKA.`
        );
      } else {
        onBulkUpdateRegulations(result.documents);

        onUpdateSyncConfig({
          ...syncConfig,
          targetFolderUrl: targetUrl,
          targetFolderId: result.folderId,
          targetFolderName: result.folderName,
          lastSyncTime: new Date().toISOString(),
          syncedFilesCount: result.documents.length,
          onlyTargetFolder: true,
        });

        setSuccessMessage(
          `Sukses! ${result.documents.length} dokumen regulasi dari folder "${result.folderName}" berhasil disinkronkan ke basis data.`
        );
      }
    } catch (err: any) {
      console.error('Sync from link error:', err);
      setError(err.message || 'Gagal menyinkronkan dokumen dari link Google Drive.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Sync specific subfolder links individually
  const handleSyncSpecificSubfolders = async () => {
    const subfolderEntries: Array<{ category: RegulationCategory; url: string }> = [
      { category: 'UU' as RegulationCategory, url: uuFolderUrl.trim() },
      { category: 'PP' as RegulationCategory, url: ppFolderUrl.trim() },
      { category: 'PERBA' as RegulationCategory, url: perbaFolderUrl.trim() },
      { category: 'KEPKA' as RegulationCategory, url: kepkaFolderUrl.trim() },
    ].filter((entry) => Boolean(entry.url));

    if (subfolderEntries.length === 0) {
      setError('Harap masukkan minimal satu tautan subfolder (UU, PP, PERBA, atau KEPKA).');
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const allSyncedDocs: RegulationDocument[] = [];

      for (let i = 0; i < subfolderEntries.length; i++) {
        const entry = subfolderEntries[i];
        setSyncProgress({
          current: i + 1,
          total: subfolderEntries.length,
          message: `Membaca subfolder [${entry.category}]...`,
        });

        try {
          const res = await syncFromPublicFolderLink(entry.url, (msg) => {
            setSyncProgress({
              current: i + 1,
              total: subfolderEntries.length,
              message: `[${entry.category}] ${msg}`,
            });
          });

          // Tag with exact category
          const mapped = res.documents.map((d) => ({
            ...d,
            category: entry.category,
            subfolderName: entry.category,
          }));

          allSyncedDocs.push(...mapped);
        } catch (subErr) {
          console.warn(`Gagal sinkron subfolder ${entry.category}:`, subErr);
        }
      }

      if (allSyncedDocs.length > 0) {
        onBulkUpdateRegulations(allSyncedDocs);

        onUpdateSyncConfig({
          ...syncConfig,
          subfolderUrls: {
            UU: uuFolderUrl.trim(),
            PP: ppFolderUrl.trim(),
            PERBA: perbaFolderUrl.trim(),
            KEPKA: kepkaFolderUrl.trim(),
          },
          lastSyncTime: new Date().toISOString(),
          syncedFilesCount: allSyncedDocs.length,
        });

        setSuccessMessage(
          `Berhasil menyinkronkan ${allSyncedDocs.length} dokumen dari subfolder spesifik!`
        );
      } else {
        setError('Tidak ada berkas regulasi yang berhasil dimuat dari tautan subfolder.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyinkronkan subfolder.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Reset or disconnect link
  const handleClearLink = () => {
    if (window.confirm('Apakah Anda ingin memutuskan tautan folder Google Drive ini?')) {
      setFolderUrlInput('');
      setFolderScanResult(null);
      setError(null);
      setSuccessMessage(null);
      onUpdateSyncConfig({
        ...syncConfig,
        targetFolderUrl: '',
        targetFolderId: null,
        targetFolderName: null,
        lastSyncTime: null,
        syncedFilesCount: 0,
      });
    }
  };

  // Manual document upload submission
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualText) return;

    const doc = parseRegulationContent(
      manualTitle,
      manualText,
      undefined,
      undefined,
      manualCategory
    );
    doc.source = 'unggah_manual';
    onAddRegulation(doc);

    setManualTitle('');
    setManualText('');
    setSuccessMessage(`Dokumen "${doc.title}" berhasil ditambahkan secara manual!`);
  };

  const isConnected = Boolean(syncConfig.targetFolderUrl || syncConfig.targetFolderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Tautkan Folder Google Drive via Link
              </h3>
              <p className="text-xs text-slate-500">
                Folder utama & subfolder (UU, PP, PERBA, KEPKA) terbaca langsung tanpa login akun Google
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'link'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Folder Utama & Subfolder</span>
          </button>
          <button
            onClick={() => setActiveTab('subfolders')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'subfolders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Tautan 4 Subfolder Terpisah</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Unggah Teks Manual</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <p className="font-semibold">Perhatian:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* Sync Progress Bar */}
          {syncProgress && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  {syncProgress.message}
                </span>
                {syncProgress.total > 0 && (
                  <span>
                    {syncProgress.current} / {syncProgress.total}
                  </span>
                )}
              </div>
              {syncProgress.total > 0 && (
                <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (syncProgress.current / syncProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Link Folder Utama (Auto-reads subfolders UU, PP, PERBA, KEPKA) */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              {/* Access instruction card */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Petunjuk Akses Link Folder (Tanpa Login):</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-blue-800">
                  1. Buka folder <strong>"database regulasi karantina ASN"</strong> di Google Drive Anda.
                  <br />
                  2. Klik kanan folder &rarr; pilih <strong>Bagikan (Share)</strong> &rarr; ubah Akses Umum menjadi{' '}
                  <span className="font-bold underline">"Siapa saja yang memiliki link"</span> (sebagai Pelihat / Viewer).
                  <br />
                  3. Salin tautan folder tersebut dan tempelkan pada kolom di bawah.
                </p>
              </div>

              {/* URL Input Form */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                    Tautan Folder Google Drive:
                  </span>
                  {isConnected && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Tersambung via Link
                    </span>
                  )}
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/1w... atau ID Folder"
                    value={folderUrlInput}
                    onChange={(e) => setFolderUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScanFolder();
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => handleScanFolder()}
                    disabled={isScanning || !folderUrlInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Memeriksa...' : 'Periksa Folder'}</span>
                  </button>
                </div>
              </div>

              {/* Current Connected Folder Status */}
              {syncConfig.targetFolderName && (
                <div className="p-4 rounded-xl border bg-slate-50/90 border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {syncConfig.targetFolderName}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                            Aktif
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {syncConfig.syncedFilesCount} dokumen tersimpan •{' '}
                          {syncConfig.lastSyncTime
                            ? `Terakhir sinkron: ${new Date(syncConfig.lastSyncTime).toLocaleTimeString('id-ID')}`
                            : 'Belum disinkronkan'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleClearLink}
                      className="text-xs text-slate-400 hover:text-rose-600 p-1 rounded transition"
                      title="Putuskan Link Folder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Sync Action Button */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Unduh teks otomatis dari berkas GDoc, PDF, atau TXT
                    </span>
                    <button
                      onClick={handleSyncFromLink}
                      disabled={isSyncing || isScanning}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Subfolder Architecture Preview (UU, PP, PERBA, KEPKA) */}
              <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Subfolder yang Terdeteksi di Folder Utama:
                  </span>
                  {folderScanResult && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Total {folderScanResult.totalFiles} berkas
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* UU */}
                  <div className="p-2.5 rounded-lg border bg-indigo-50/50 border-indigo-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 font-mono">📁 UU</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                        {folderScanResult
                          ? folderScanResult.files.filter(
                              (f) => f.category === 'UU' || f.subfolderName?.toUpperCase().includes('UU')
                            ).length
                          : 'Otomatis'}{' '}
                        file
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Undang-Undang</p>
                  </div>

                  {/* PP */}
                  <div className="p-2.5 rounded-lg border bg-blue-50/50 border-blue-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 font-mono">📁 PP</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {folderScanResult
                          ? folderScanResult.files.filter(
                              (f) => f.category === 'PP' || f.subfolderName?.toUpperCase().includes('PP')
                            ).length
                          : 'Otomatis'}{' '}
                        file
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Peraturan Pemerintah</p>
                  </div>

                  {/* PERBA */}
                  <div className="p-2.5 rounded-lg border bg-emerald-50/50 border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 font-mono">📁 PERBA</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        {folderScanResult
                          ? folderScanResult.files.filter(
                              (f) =>
                                f.category === 'PERBA' ||
                                f.subfolderName?.toUpperCase().includes('PERBA')
                            ).length
                          : 'Otomatis'}{' '}
                        file
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Peraturan Badan</p>
                  </div>

                  {/* KEPKA */}
                  <div className="p-2.5 rounded-lg border bg-amber-50/50 border-amber-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 font-mono">📁 KEPKA</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                        {folderScanResult
                          ? folderScanResult.files.filter(
                              (f) =>
                                f.category === 'KEPKA' ||
                                f.subfolderName?.toUpperCase().includes('KEPKA') ||
                                f.subfolderName?.toUpperCase().includes('KPT')
                            ).length
                          : 'Otomatis'}{' '}
                        file
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Keputusan Kepala</p>
                  </div>
                </div>
              </div>

              {/* Scanned Files List */}
              {folderScanResult && folderScanResult.files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Daftar Dokumen Ditemukan ({folderScanResult.files.length})</span>
                    <button
                      onClick={handleSyncFromLink}
                      disabled={isSyncing}
                      className="text-indigo-600 hover:text-indigo-800 underline font-semibold"
                    >
                      Sinkronkan Semua Sekarang &rarr;
                    </button>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {folderScanResult.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {file.category}
                          </span>
                          {file.subfolderName && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0 flex items-center gap-1">
                              <Folder className="w-2.5 h-2.5 text-slate-400" />
                              {file.subfolderName}/
                            </span>
                          )}
                          <span className="truncate text-slate-800 font-medium">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          {file.mimeType.includes('pdf')
                            ? 'PDF'
                            : file.mimeType.includes('document')
                            ? 'Google Doc'
                            : 'Berkas'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Periodic Auto-Sync Settings */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Sinkronisasi Otomatis Berkala
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Memeriksa pembaruan draf dokumen hukum via link secara otomatis di latar belakang
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncConfig.autoSyncEnabled}
                      onChange={(e) =>
                        onUpdateSyncConfig({
                          ...syncConfig,
                          autoSyncEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {syncConfig.autoSyncEnabled && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-600 font-medium">Interval Pemeriksaan:</span>
                    <select
                      value={syncConfig.syncIntervalMinutes}
                      onChange={(e) =>
                        onUpdateSyncConfig({
                          ...syncConfig,
                          syncIntervalMinutes: parseInt(e.target.value, 10),
                        })
                      }
                      className="bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 text-xs font-medium"
                    >
                      <option value={5}>Setiap 5 Menit</option>
                      <option value={10}>Setiap 10 Menit</option>
                      <option value={15}>Setiap 15 Menit</option>
                      <option value={30}>Setiap 30 Menit</option>
                      <option value={60}>Setiap 1 Jam</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Specific Subfolder Links (UU, PP, PERBA, KEPKA) */}
          {activeTab === 'subfolders' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-indigo-600" />
                  Opsi Tautan Subfolder Spesifik:
                </p>
                <p className="text-[11px] text-slate-600">
                  Gunakan opsi ini jika Anda memiliki tautan terpisah untuk masing-masing folder (UU, PP, PERBA, KEPKA) di Google Drive.
                </p>
              </div>

              {/* UU Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px]">
                    UU
                  </span>
                  Link Folder Undang-Undang:
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={uuFolderUrl}
                  onChange={(e) => setUuFolderUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* PP Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono text-[10px]">
                    PP
                  </span>
                  Link Folder Peraturan Pemerintah:
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={ppFolderUrl}
                  onChange={(e) => setPpFolderUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* PERBA Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                    PERBA
                  </span>
                  Link Folder Peraturan Badan:
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={perbaFolderUrl}
                  onChange={(e) => setPerbaFolderUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* KEPKA Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono text-[10px]">
                    KEPKA
                  </span>
                  Link Folder Keputusan Kepala / KPT:
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={kepkaFolderUrl}
                  onChange={(e) => setKepkaFolderUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSyncSpecificSubfolders}
                  disabled={isSyncing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan 4 Subfolder Ini'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Manual Text Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2 font-medium">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Tambahkan teks aturan UU, PP, PERBA, atau KEPKA secara langsung ke basis data lokal jika Anda sedang tidak menghubungkan Google Drive.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Kategori Aturan:
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as RegulationCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="UU">UU (Undang-Undang)</option>
                    <option value="PP">PP (Peraturan Pemerintah)</option>
                    <option value="PERBA">PERBA (Peraturan Badan)</option>
                    <option value="KEPKA">KEPKA (Keputusan Kepala)</option>
                    <option value="KPT">KPT (Keputusan Pimpinan)</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tahun:
                  </label>
                  <input
                    type="number"
                    value={manualYear}
                    onChange={(e) => setManualYear(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Format Penomoran:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PERBA No. 2 Tahun 2024"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Isi Teks Regulasi (Termasuk Bab, Pasal, Ayat, atau Diktum):
                </label>
                <textarea
                  rows={8}
                  placeholder="Tempelkan isi aturan di sini (misal: Pasal 1 Ketentuan Umum..., Pasal 2...)"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-2xs transition"
                >
                  Simpan ke Basis Data
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Akses publik tanpa login akun Google • Mendukung GDoc, PDF, TXT
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
