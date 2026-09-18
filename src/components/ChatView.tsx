import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Scale,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  FileText,
  Clock,
  HardDrive,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, RegulationDocument, DriveSyncConfig } from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, mode: 'chat' | 'summarize' | 'compare') => void;
  isLoading: boolean;
  onClearHistory: () => void;
  onSelectCitation: (citation: string) => void;
  regulations: RegulationDocument[];
  syncConfig?: DriveSyncConfig;
  onOpenSyncModal?: () => void;
}

const RetryQuotaButton: React.FC<{
  retryPrompt?: string;
  retryAfterSeconds?: number;
  mode?: 'chat' | 'summarize' | 'compare';
  onRetry: (text: string, mode: 'chat' | 'summarize' | 'compare') => void;
  isLoading: boolean;
}> = ({ retryPrompt, retryAfterSeconds = 12, mode = 'chat', onRetry, isLoading }) => {
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  if (!retryPrompt) return null;

  return (
    <div className="mt-3 pt-3 border-t border-amber-800/60 flex items-center justify-between gap-3 flex-wrap">
      <span className="text-xs text-amber-300 font-mono">
        {secondsLeft > 0 ? `Batas laju mereda dalam: ${secondsLeft} detik` : 'Antrean siap untuk dicoba kembali'}
      </span>
      <button
        onClick={() => onRetry(retryPrompt, mode)}
        disabled={isLoading || secondsLeft > 0}
        className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs ${
          secondsLeft > 0 || isLoading
            ? 'bg-amber-900/50 text-amber-300/60 cursor-not-allowed border border-amber-800/40'
            : 'bg-amber-500 hover:bg-amber-400 text-amber-950 cursor-pointer font-bold'
        }`}
      >
        <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{secondsLeft > 0 ? `Tunggu (${secondsLeft}s)` : 'Coba Lagi Sekarang'}</span>
      </button>
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearHistory,
  onSelectCitation,
  regulations,
  syncConfig,
  onOpenSyncModal,
}) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'chat' | 'summarize' | 'compare'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), mode);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Count regulations by category
  const uuCount = regulations.filter((r) => r.category === 'UU').length;
  const ppCount = regulations.filter((r) => r.category === 'PP').length;
  const perbaCount = regulations.filter((r) => r.category === 'PERBA').length;
  const kepkaCount = regulations.filter((r) => r.category === 'KEPKA').length;
  const kptCount = regulations.filter((r) => r.category === 'KPT').length;

  // Quick prompt suggestions
  const quickPrompts = [
    {
      label: 'Tindakan Karantina 8P',
      text: 'Apa saja tindakan karantina 8P menurut UU No. 21 Tahun 2019 Pasal 16 dan bagaimana peran pejabat karantina?',
      tag: 'UU 21/2019',
    },
    {
      label: 'Syarat Masuk Komoditas Karantina',
      text: 'Jelaskan 3 kewajiban utama saat memasukkan hewan atau tumbuhan ke dalam wilayah NKRI sesuai Pasal 33 UU No. 21/2019.',
      tag: 'Kewajiban',
    },
    {
      label: 'Hukuman Disiplin Berat ASN',
      text: 'Sebutkan jenis-jenis hukuman disiplin tingkat berat bagi ASN menurut PP No. 94 Tahun 2021 Pasal 8 ayat (4) beserta ketentuan pemecatan jika mangkir kerja.',
      tag: 'PP 94/2021',
    },
    {
      label: 'Netralitas & Kode Etik ASN',
      text: 'Apa saja larangan bagi PNS terkait keterlibatan dalam kampanye politik berdasarkan PP No. 94 Tahun 2021 Pasal 5 huruf n dan UU No. 20 Tahun 2023?',
      tag: 'UU 20/2023',
    },
    {
      label: 'Penahanan Media Pembawa (PERBA)',
      text: 'Bagaimana prosedur dan jangka waktu penahanan media pembawa menurut PERBA No. 1 Tahun 2024 Pasal 15?',
      tag: 'PERBA 1/2024',
    },
    {
      label: 'Larangan Gratifikasi Barantin',
      text: 'Apa larangan tegas bagi pejabat fungsional perkarantinaan terkait gratifikasi sesuai KPT Barantin No. 45/2024?',
      tag: 'KPT 45/2024',
    },
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#F8FAFC] text-slate-800 h-[calc(100vh-4rem)]">
      {/* Left Geometric Sidebar (matching Geometric Balance Design HTML) */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col gap-6 shrink-0 overflow-y-auto">
        {/* Category breakdown */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Kategori Dokumen
          </h3>
          <nav className="flex flex-col gap-1.5 text-xs font-medium">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 text-indigo-700 font-semibold rounded-md border border-slate-200/70">
              <span className="truncate">Undang-Undang (UU)</span>
              <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">
                {uuCount}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md transition">
              <span className="truncate">Peraturan Pemerintah (PP)</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {ppCount}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md transition">
              <span className="truncate">PERBA Standar Teknis</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {perbaCount}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md transition">
              <span className="truncate">KEPKA Keputusan Kepala</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {kepkaCount}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md transition">
              <span className="truncate">KPT & Juknis Terkait</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {kptCount}
              </span>
            </div>
          </nav>
        </div>

        {/* Sync statistics */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Statistik Sinkronisasi
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="text-[11px] text-indigo-700 mb-1 font-medium flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Update Terakhir
              </div>
              <div className="text-xs font-bold text-indigo-950">
                {syncConfig?.lastSyncTime
                  ? new Date(syncConfig.lastSyncTime).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) + ' WIB'
                  : 'Siap Sinkron'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <div className="text-[11px] text-slate-500 mb-1 font-medium flex items-center gap-1.5">
                <HardDrive className="w-3 h-3" />
                Integrasi Cloud
              </div>
              <div className="text-xs font-bold text-slate-700">
                {syncConfig?.targetFolderName
                  ? `Folder: ${syncConfig.targetFolderName}`
                  : 'Google Drive Dokumen'}
              </div>
            </div>
          </div>

          {onOpenSyncModal && (
            <button
              onClick={onOpenSyncModal}
              className="w-full mt-3 px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-semibold text-slate-600 transition flex items-center justify-center gap-1.5"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pengaturan Sinkronisasi</span>
            </button>
          )}
        </div>

        {/* Compliance Guarantee */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-indigo-700">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold tracking-tight">Kepatuhan Yuridis</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Asisten secara ketat merujuk pasal otentik. Informasi di luar dokumen resmi tidak akan dispekulasikan.
          </p>
        </div>
      </aside>

      {/* Main Central Canvas (matching Geometric Balance Design HTML) */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {/* Top Mode Bar */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Tanya & Analisis Pasal</span>
            </button>
            <button
              onClick={() => setMode('summarize')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'summarize'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rangkum Aturan</span>
            </button>
            <button
              onClick={() => setMode('compare')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'compare'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Komparasi Regulasi</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              showConfirmClear ? (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg text-xs animate-in fade-in">
                  <span className="text-rose-800 font-medium">Hapus semua chat?</span>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowConfirmClear(false);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Ya, Bersihkan
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs transition cursor-pointer font-medium"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer group"
                  title="Bersihkan riwayat percakapan untuk menghemat token dan mereset sesi"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition" />
                  <span>Bersihkan Chat</span>
                  <span className="text-[10px] bg-slate-100 group-hover:bg-rose-100 text-slate-500 group-hover:text-rose-700 px-1.5 py-0.5 rounded font-mono font-bold">
                    {messages.length}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.length === 0 ? (
              /* Welcome & Guidance State with Geometric Balance */
              <div className="py-6 sm:py-8 text-center space-y-6">
                <div className="w-12 h-12 rounded-sm bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
                  <Scale className="w-6 h-6" />
                </div>

                <div className="space-y-2 max-w-xl mx-auto">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Konsultasi Yuridis Perkarantinaan & ASN
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Sistem analisis yuridis berbasis dokumen resmi <strong>UU, PP, PERBA, dan KPT</strong>.
                    Setiap jawaban dilengkapi sitasi nomor pasal spesifik tanpa spekulasi.
                  </p>
                </div>

                {/* Quick Prompts Grid */}
                <div className="space-y-3 pt-2 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Pertanyaan Regulasi Populer:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(p.text);
                          inputRef.current?.focus();
                        }}
                        className="p-3.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all shadow-2xs group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {p.label}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                            {p.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {p.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isCopied = copiedId === msg.id;
                const isHonestNotice =
                  !isUser &&
                  (msg.content.toLowerCase().includes('tidak ditemukan dalam dokumen') ||
                    msg.content.toLowerCase().includes('tidak terdapat dalam dokumen'));

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold uppercase shadow-2xs">
                        AI
                      </div>
                    )}

                    {isUser ? (
                      /* User message: clean white card with slate-200 border */
                      <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200 text-sm leading-relaxed text-slate-800 max-w-[85%]">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : msg.isQuotaError ? (
                      /* Quota / Rate limit error card with clear status & retry countdown */
                      <div className="bg-amber-950/90 text-amber-100 p-5 rounded-xl shadow-md border border-amber-800 text-sm leading-relaxed relative flex-1 max-w-[92%]">
                        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-amber-800/80 text-amber-300 font-bold text-xs">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span>Pemberitahuan Kuota Gemini API</span>
                        </div>
                        <div className="prose prose-invert prose-xs max-w-none text-amber-200 space-y-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        <RetryQuotaButton
                          retryPrompt={msg.retryPrompt}
                          retryAfterSeconds={msg.retryAfterSeconds}
                          mode={msg.mode}
                          onRetry={onSendMessage}
                          isLoading={isLoading}
                        />
                      </div>
                    ) : (
                      /* AI message: deep indigo high-contrast card as per Geometric Balance */
                      <div className="bg-indigo-950 text-slate-100 p-5 rounded-xl shadow-md border border-indigo-900 text-sm leading-relaxed relative flex-1 max-w-[92%]">
                        {/* Header metadata tag */}
                        {msg.mode && (
                          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-indigo-800/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded">
                              {msg.mode === 'summarize'
                                ? 'Rangkuman Yuridis'
                                : msg.mode === 'compare'
                                ? 'Komparasi Regulasi'
                                : 'Analisis Pasal Otentik'}
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Honest notice if info was not in documents */}
                        {isHonestNotice && (
                          <div className="mb-3 p-3 bg-amber-950/50 border border-amber-800/60 rounded-lg text-amber-200 text-xs flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">Integritas Analisis Dokumen:</span>
                              <span>
                                Sesuai mandat kepatuhan hukum, asisten hanya menjawab dari data dokumen yang telah disinkronkan dan tidak berspekulasi di luar naskah resmi.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Markdown Body */}
                        <div className="prose prose-invert prose-xs max-w-none text-slate-100 space-y-2">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                              ul: ({ children }) => <ul className="space-y-2 mb-2 pl-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
                              li: ({ children }) => (
                                <li className="flex gap-2 border-l-2 border-indigo-500 pl-3 leading-relaxed">
                                  <div>{children}</div>
                                </li>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Verified Citation Badges */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-indigo-800/80 space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                              <Bookmark className="w-3 h-3 text-indigo-400" />
                              Rujukan Yuridis Terverifikasi:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map((cite, i) => (
                                <button
                                  key={i}
                                  onClick={() => onSelectCitation(cite)}
                                  className="bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-700/80 text-indigo-200 px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition"
                                  title="Klik untuk menelaah naskah pasal otentik"
                                >
                                  <span>{cite}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Copy button */}
                        <div className="mt-3 flex items-center justify-end gap-2 pt-1 border-t border-indigo-900">
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded hover:bg-indigo-900 transition"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{isCopied ? 'Tersalin' : 'Salin Jawaban'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {isUser && (
                      <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center shrink-0 text-[10px] font-bold uppercase shadow-2xs">
                        USER
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold uppercase shadow-2xs">
                  AI
                </div>
                <div className="bg-indigo-950 text-slate-100 border border-indigo-900 rounded-xl p-4 text-xs flex items-center gap-3 shadow-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-indigo-200">Menelaah teks regulasi & memeriksa nomor pasal spesifik...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar (matching Geometric Balance Design HTML) */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input
              ref={inputRef as any}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown as any}
              placeholder={
                mode === 'summarize'
                  ? 'Tuliskan topik aturan yang ingin dirangkum (misal: "Rangkum sanksi disiplin berat ASN")...'
                  : mode === 'compare'
                  ? 'Tuliskan topik komparasi (misal: "Bandingkan wewenang penahanan di UU 21/2019 vs PERBA 1/2024")...'
                  : 'Tanyakan regulasi, pasal, atau rangkuman aturan...'
              }
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
            />
            <button
              id="btn-send-message"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-md transition shadow-xs"
              title="Kirim Pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span>Tekan Enter untuk menganalisis</span>
              {messages.length > 0 && (
                <span className="text-slate-400">
                  • Riwayat: <strong className="text-slate-600">{messages.length} pesan</strong>
                </span>
              )}
            </span>
            <span className="text-indigo-600 font-medium">Hanya merujuk dokumen resmi UU, PP, PERBA, KPT</span>
          </div>
        </div>
      </main>

      {/* Right Geometric Sidebar (matching Geometric Balance Design HTML) */}
      <aside className="w-72 bg-white border-l border-slate-200 p-6 hidden xl:flex flex-col gap-6 shrink-0 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Metadata Rujukan
        </h3>
        <div className="space-y-4">
          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/70 relative overflow-hidden group">
            <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">
              DOKUMEN UTAMA
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
              UU No. 21 Tahun 2019
            </h4>
            <p className="text-xs text-slate-500 italic mb-3 line-clamp-2">
              Karantina Hewan, Ikan, dan Tumbuhan.
            </p>
            <div className="flex gap-2 items-center text-[10px] font-medium text-slate-400">
              <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">PDF</span>
              <span>•</span>
              <span>102 Pasal</span>
            </div>
          </div>

          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/70">
            <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">
              DOKUMEN TERKAIT
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
              PP No. 94 Tahun 2021
            </h4>
            <p className="text-xs text-slate-500 italic mb-3">
              Disiplin Pegawai Negeri Sipil.
            </p>
            <div className="flex gap-2 items-center text-[10px] font-medium text-slate-400">
              <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">DOCX</span>
              <span>•</span>
              <span>Pasal 8 Sanksi Berat</span>
            </div>
          </div>

          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/70">
            <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">
              STANDAR TEKNIS
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
              PERBA No. 1 Tahun 2024
            </h4>
            <p className="text-xs text-slate-500 italic mb-3">
              Standar Operasional Penahanan Media Pembawa.
            </p>
            <div className="flex gap-2 items-center text-[10px] font-medium text-slate-400">
              <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">PDF</span>
              <span>•</span>
              <span>Standar Barantin</span>
            </div>
          </div>

          {/* AI Activity Log matching Design HTML */}
          <div className="mt-4 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Log Aktivitas AI
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3 py-0.5">
                Searching query in <span className="text-slate-800 font-mono font-medium">vector_store_primary</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3 py-0.5">
                Extracting context from <span className="text-slate-800 font-mono font-medium">UU_21_2019_PASAL_35</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3 py-0.5">
                Cross-referencing <span className="text-slate-800 font-mono font-medium">ASN_REG_2021</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

