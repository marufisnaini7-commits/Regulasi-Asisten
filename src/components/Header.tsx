import React from 'react';
import { Scale, RefreshCw, CheckCircle2, AlertCircle, HardDrive, ShieldCheck, FolderSync } from 'lucide-react';
import { DriveSyncConfig } from '../types';

interface HeaderProps {
  activeTab: 'chat' | 'database';
  setActiveTab: (tab: 'chat' | 'database') => void;
  syncConfig: DriveSyncConfig;
  isSyncing: boolean;
  onOpenSyncModal: () => void;
  regulationCount: number;
  userEmail?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncConfig,
  isSyncing,
  onOpenSyncModal,
  regulationCount,
  userEmail,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shrink-0 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand matching Geometric Balance */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded-sm text-white shrink-0 shadow-xs">
              <Scale className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center min-w-0">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                LEX-ASSIST
              </span>
              <span className="text-indigo-600 font-semibold text-xs sm:text-sm border-l border-slate-300 ml-2 pl-2 truncate hidden sm:inline">
                REKAP & REGULASI KARANTINA - ASN
              </span>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                id="btn-nav-chat"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-indigo-600 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Konsultasi & Rangkuman
              </button>
              <button
                id="btn-nav-database"
                onClick={() => setActiveTab('database')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'database'
                    ? 'bg-white text-indigo-600 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Basis Data Regulasi</span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.2 rounded font-mono font-medium border border-indigo-100">
                  {regulationCount}
                </span>
              </button>
            </div>

            {/* Google Drive Status Pill matching Geometric Balance */}
            {(() => {
              const isLinked = Boolean(syncConfig.targetFolderUrl || syncConfig.targetFolderId || userEmail);
              const folderLabel = syncConfig.targetFolderName || 'database regulasi karantina ASN';
              return (
                <button
                  id="btn-open-sync-modal"
                  onClick={onOpenSyncModal}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isLinked
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70'
                      : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/70'
                  }`}
                  title="Tautkan Link Google Drive Folder 'database regulasi karantina ASN' (Tanpa Login)"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLinked ? 'bg-emerald-500' : 'bg-indigo-500'
                      } ${isSyncing ? 'animate-ping' : ''}`}
                    />
                    <span className="hidden md:inline font-semibold">
                      {isSyncing
                        ? 'Menyinkronkan Link...'
                        : isLinked
                        ? `Link: 📁 ${folderLabel}`
                        : 'Tautkan Link Folder Drive'}
                    </span>
                    <span className="inline md:hidden font-semibold">
                      {isLinked ? '📁 Link Aktif' : 'Tautkan Link'}
                    </span>
                  </div>
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 ml-1" />
                  ) : (
                    <HardDrive className="w-3.5 h-3.5 text-slate-500 ml-1" />
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </header>
  );
};
