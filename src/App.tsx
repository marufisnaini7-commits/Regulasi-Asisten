import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { RegulationBrowser } from './components/RegulationBrowser';
import { DriveSyncModal } from './components/DriveSyncModal';
import { CitationDetailModal } from './components/CitationDetailModal';
import { DEFAULT_REGULATIONS } from './data/defaultRegulations';
import { ChatMessage, DriveSyncConfig, RegulationDocument } from './types';
import { initAuth, getAccessToken } from './services/firebaseAuth';
import {
  selectRelevantRegulationContext,
  performClientSideRegulationSearch,
} from './services/regulationSearch';
import {
  fetchDriveFiles,
  fetchFileContent,
  parseRegulationContent,
  findDedicatedFolder,
  syncFromPublicFolderLink,
  DEDICATED_REGULATION_FOLDER_NAME,
} from './services/googleDrive';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'database'>('chat');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCitation, setActiveCitation] = useState<string | null>(null);

  // Regulations state: start with authentic default legal corpus, load from localStorage if present
  const [regulations, setRegulations] = useState<RegulationDocument[]>(() => {
    const saved = localStorage.getItem('asisten_hukum_regulations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading saved regulations:', e);
      }
    }
    return DEFAULT_REGULATIONS;
  });

  // Sync Configuration state: defaults to dedicated folder 'database regulasi karantina ASN'
  const [syncConfig, setSyncConfig] = useState<DriveSyncConfig>(() => {
    const saved = localStorage.getItem('asisten_hukum_sync_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          targetFolderName: parsed.targetFolderName || DEDICATED_REGULATION_FOLDER_NAME,
          onlyTargetFolder: parsed.onlyTargetFolder ?? true,
        };
      } catch (e) {
        console.error('Error loading sync config:', e);
      }
    }
    return {
      autoSyncEnabled: false,
      syncIntervalMinutes: 15,
      targetFolderId: null,
      targetFolderName: DEDICATED_REGULATION_FOLDER_NAME,
      onlyTargetFolder: true,
      lastSyncTime: null,
      syncedFilesCount: 0,
    };
  });

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('asisten_hukum_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('asisten_hukum_regulations', JSON.stringify(regulations));
  }, [regulations]);

  useEffect(() => {
    localStorage.setItem('asisten_hukum_sync_config', JSON.stringify(syncConfig));
  }, [syncConfig]);

  useEffect(() => {
    localStorage.setItem('asisten_hukum_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Initialize Firebase Auth listener and auto-detect dedicated folder
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUserEmail(user.email);
        setAccessToken(token);

        // Auto-locate dedicated folder 'database regulasi karantina ASN'
        if (token) {
          findDedicatedFolder(token, DEDICATED_REGULATION_FOLDER_NAME).then((found) => {
            if (found) {
              setSyncConfig((prev) => ({
                ...prev,
                targetFolderId: found.id,
                targetFolderName: found.name,
                onlyTargetFolder: true,
              }));
            }
          });
        }
      },
      () => {
        // Not authenticated
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Background Automatic Sync Functionality (supports public link without login & token fallback)
  const runBackgroundSync = useCallback(async () => {
    if (!syncConfig.autoSyncEnabled || isSyncing) return;

    // 1. If public folder link or folder ID is configured, sync via public link (No login needed!)
    const publicLink = syncConfig.targetFolderUrl || syncConfig.targetFolderId;
    if (publicLink) {
      setIsSyncing(true);
      try {
        const result = await syncFromPublicFolderLink(publicLink);
        if (result.documents && result.documents.length > 0) {
          setRegulations((prev) => {
            const map = new Map<string, RegulationDocument>();
            prev.forEach((d) => map.set(d.id, d));
            result.documents.forEach((d) => map.set(d.id, d));
            return Array.from(map.values());
          });

          setSyncConfig((prev) => ({
            ...prev,
            lastSyncTime: new Date().toISOString(),
            syncedFilesCount: result.documents.length,
            targetFolderName: result.folderName,
          }));
        }
      } catch (linkErr) {
        console.warn('Auto sync public link error:', linkErr);
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // 2. Fallback: Authenticated token sync if available
    const token = accessToken || (await getAccessToken());
    if (!token) return;

    setIsSyncing(true);
    try {
      const files = await fetchDriveFiles(token, syncConfig.targetFolderId, {
        onlyTargetFolder: syncConfig.onlyTargetFolder ?? true,
        targetFolderName: syncConfig.targetFolderName || DEDICATED_REGULATION_FOLDER_NAME,
      });
      if (files && files.length > 0) {
        const syncedDocs: RegulationDocument[] = [];
        for (const file of files) {
          try {
            const rawText = await fetchFileContent(token, file.id, file.mimeType);
            if (rawText && rawText.trim().length > 20) {
              const parsed = parseRegulationContent(
                file.name,
                rawText,
                file.id,
                file.modifiedTime,
                file.categoryGuessed,
                file.subfolderName
              );
              syncedDocs.push(parsed);
            }
          } catch (fileErr) {
            console.warn('Sync error on file', file.name, fileErr);
          }
        }

        if (syncedDocs.length > 0) {
          setRegulations((prev) => {
            const map = new Map<string, RegulationDocument>();
            prev.forEach((d) => map.set(d.id, d));
            syncedDocs.forEach((d) => map.set(d.id, d));
            return Array.from(map.values());
          });

          setSyncConfig((prev) => ({
            ...prev,
            lastSyncTime: new Date().toISOString(),
            syncedFilesCount: syncedDocs.length,
          }));
        }
      }
    } catch (err) {
      console.error('Auto sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, syncConfig.autoSyncEnabled, syncConfig.targetFolderUrl, syncConfig.targetFolderId, syncConfig.targetFolderName, syncConfig.onlyTargetFolder, isSyncing]);

  // Set up periodic auto-sync timer
  useEffect(() => {
    if (!syncConfig.autoSyncEnabled) return;
    const hasSyncSource = Boolean(syncConfig.targetFolderUrl || syncConfig.targetFolderId || accessToken);
    if (!hasSyncSource) return;

    const intervalMs = Math.max(1, syncConfig.syncIntervalMinutes) * 60 * 1000;
    const intervalId = setInterval(() => {
      runBackgroundSync();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [syncConfig.autoSyncEnabled, syncConfig.syncIntervalMinutes, syncConfig.targetFolderUrl, syncConfig.targetFolderId, accessToken, runBackgroundSync]);

  // Handle Chat message sending
  const handleSendMessage = async (text: string, mode: 'chat' | 'summarize' | 'compare') => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      mode,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Smart retrieval: extract compact catalog and top relevant articles only
      // Keeps input token count very low (<5,000 tokens) to prevent exceeding the 250,000/min quota
      const { catalogText, articlesText } = selectRelevantRegulationContext(
        text,
        regulations,
        mode,
        16000
      );

      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: text,
          history: newHistory.slice(-4).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.content.slice(0, 300),
          })),
          catalogText,
          articlesText,
          mode,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          // GitHub Pages is static and rejects POST with 405 or 404. Fall back to smart client-side search!
          const fallbackResult = performClientSideRegulationSearch(text, regulations, mode);
          const assistantMsg: ChatMessage = {
            id: `ast-${Date.now()}`,
            role: 'assistant',
            content: fallbackResult.answer,
            timestamp: new Date().toISOString(),
            citations: fallbackResult.citations,
            isNotFoundNotice: fallbackResult.isNotFoundNotice,
            mode,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          return;
        }

        const isQuota = res.status === 429 || data.isQuotaExceeded;
        const err: any = new Error(data.error || `Server error: ${res.status}`);
        err.isQuota = isQuota;
        err.retryAfter = data.retryAfter || 12;
        throw err;
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'Informasi tersebut tidak ditemukan dalam dokumen regulasi yang tersedia.',
        timestamp: new Date().toISOString(),
        citations: data.citations || [],
        mode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);

      // If network failure on static hosting (e.g. CORS/blocked POST)
      const isStaticOrNetworkFail =
        err.name === 'TypeError' &&
        (err.message?.includes('fetch') || err.message?.includes('Failed') || err.message?.includes('Network'));

      if (isStaticOrNetworkFail) {
        const fallbackResult = performClientSideRegulationSearch(text, regulations, mode);
        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: fallbackResult.answer,
          timestamp: new Date().toISOString(),
          citations: fallbackResult.citations,
          isNotFoundNotice: fallbackResult.isNotFoundNotice,
          mode,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      const isQuota =
        err.isQuota ||
        err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('Quota exceeded') ||
        err.message?.includes('RESOURCE_EXHAUSTED');

      const retryAfter = err.retryAfter || 12;

      const errorMsg: ChatMessage = {
        id: `ast-err-${Date.now()}`,
        role: 'assistant',
        content: isQuota
          ? `⚠️ **Batas Laju Permintaan (Rate Limit / Quota Gemini API)**\n\nSistem mendeteksi batas kuota token per menit pada model AI gratis (250.000 token/menit) telah tercapai.\n\nKonteks basis data regulasi kini telah dioptimalkan secara otomatis agar lebih hemat token. Silakan tunggu sekitar **${retryAfter} detik** lalu klik tombol **Coba Lagi Sekarang** di bawah.`
          : `Terjadi kendala saat memproses permintaan: ${err.message || 'Silakan coba beberapa saat lagi.'}`,
        timestamp: new Date().toISOString(),
        isQuotaError: isQuota,
        retryPrompt: text,
        retryAfterSeconds: retryAfter,
        mode,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRegulation = (newDoc: RegulationDocument) => {
    setRegulations((prev) => [newDoc, ...prev]);
  };

  const handleBulkUpdateRegulations = (newDocs: RegulationDocument[]) => {
    setRegulations((prev) => {
      const map = new Map<string, RegulationDocument>();
      prev.forEach((d) => map.set(d.id, d));
      newDocs.forEach((d) => map.set(d.id, d));
      return Array.from(map.values());
    });
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('asisten_hukum_chat_history');
  };

  const handleAskAboutRegulation = (prompt: string) => {
    setActiveTab('chat');
    handleSendMessage(prompt, 'chat');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-800">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncConfig={syncConfig}
        isSyncing={isSyncing}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        regulationCount={regulations.length}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' ? (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onClearHistory={handleClearHistory}
            onSelectCitation={(cite) => setActiveCitation(cite)}
            regulations={regulations}
          />
        ) : (
          <RegulationBrowser
            regulations={regulations}
            onAskAboutRegulation={handleAskAboutRegulation}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}
      </main>

      {/* Google Drive Synchronization Modal */}
      <DriveSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncConfig={syncConfig}
        onUpdateSyncConfig={setSyncConfig}
        onAddRegulation={handleAddRegulation}
        onBulkUpdateRegulations={handleBulkUpdateRegulations}
        allRegulations={regulations}
        userEmail={userEmail}
        setUserEmail={setUserEmail}
        accessToken={accessToken}
        setAccessToken={setAccessToken}
      />

      {/* Citation Detail Inspector Modal */}
      <CitationDetailModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
        regulations={regulations}
      />
    </div>
  );
}
