import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  FileText,
  Copy,
  Check,
  HardDrive,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { RegulationCategory, RegulationDocument, ArticleItem } from '../types';

interface RegulationBrowserProps {
  regulations: RegulationDocument[];
  onAskAboutRegulation: (prompt: string) => void;
  onOpenSyncModal: () => void;
}

export const RegulationBrowser: React.FC<RegulationBrowserProps> = ({
  regulations,
  onAskAboutRegulation,
  onOpenSyncModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(regulations[0]?.id || null);
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);

  const categories: { label: string; value: string; desc: string }[] = [
    { label: 'Semua Regulasi', value: 'ALL', desc: 'Seluruh arsip' },
    { label: 'UU (Undang-Undang)', value: 'UU', desc: 'UU Karantina & UU ASN' },
    { label: 'PP (Peraturan Pemerintah)', value: 'PP', desc: 'PP Pelaksana Karantina & PP Disiplin PNS' },
    { label: 'PERBA (Peraturan Badan)', value: 'PERBA', desc: 'Standar Prosedur Barantin' },
    { label: 'KEPKA (Keputusan Kepala)', value: 'KEPKA', desc: 'Keputusan Kepala Barantin' },
    { label: 'KPT (Keputusan Pimpinan)', value: 'KPT', desc: 'Juknis & Ketetapan Khusus' },
  ];

  const filteredRegulations = useMemo(() => {
    return regulations.filter((doc) => {
      const matchCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchMeta =
        doc.number.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q);

      const matchArticles = doc.articles.some(
        (a) => a.pasal.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
      );

      return matchMeta || matchArticles;
    });
  }, [regulations, selectedCategory, searchQuery]);

  const handleCopyArticle = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedArticleId(id);
    setTimeout(() => setCopiedArticleId(null), 2000);
  };

  const getCategoryBadgeClass = (category: RegulationCategory) => {
    switch (category) {
      case 'UU':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PP':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PERBA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'KEPKA':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'KPT':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controls: Search & Category Chips */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <div className="w-6 h-6 rounded-sm bg-indigo-600 text-white flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              Katalog Regulasi Perkarantinaan & ASN
            </h2>
            <p className="text-xs text-slate-500">
              Dokumen dasar rujukan yuridis yang terverifikasi dan disinkronkan khusus dari folder Google Drive <span className="font-semibold text-indigo-700">"database regulasi karantina ASN"</span>.
            </p>
          </div>
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-2 self-start md:self-auto bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-2xs"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span>Folder: database regulasi karantina ASN</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor aturan, judul, kata kunci (misal: tindakan karantina, disiplin, sanksi pidana), atau nomor pasal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-inner"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>Menampilkan {filteredRegulations.length} dokumen regulasi aktif</span>
        <span className="hidden sm:inline">Asisten AI hanya menjawab berdasarkan ketentuan yuridis terverifikasi</span>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {filteredRegulations.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-2xs">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Dokumen yang Cocok</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ditemukan dokumen atau pasal yang sesuai dengan kueri pencarian. Silakan sinkronkan dokumen baru melalui Google Drive.
            </p>
            <button
              onClick={onOpenSyncModal}
              className="mt-2 bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-xs"
            >
              Sinkronkan Dokumen Drive
            </button>
          </div>
        ) : (
          filteredRegulations.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-2xs hover:border-slate-300"
              >
                {/* Document Header Card */}
                <div
                  onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition select-none"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getCategoryBadgeClass(doc.category)}`}>
                        {doc.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-700">
                        {doc.number}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        Tahun {doc.year}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-mono">
                        {doc.source === 'google_drive' ? 'Google Drive' : doc.source === 'unggah_manual' ? 'Manual' : 'Sistem'}
                      </span>
                      {doc.subfolderName && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-mono font-medium">
                          📁 {doc.subfolderName}/
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {doc.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <span className="text-[11px] font-mono font-medium text-slate-500 hidden sm:inline-block">
                      {doc.articles.length} Ketentuan
                    </span>
                    <div className="p-1.5 rounded-md bg-slate-100 text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Articles List */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        Daftar Pasal & Ketentuan Yuridis ({doc.articles.length}):
                      </h4>
                      <button
                        onClick={() =>
                          onAskAboutRegulation(
                            `Tolong berikan rangkuman komprehensif tentang pokok-pokok penting dan pasal-pasal kunci dalam ${doc.number} (${doc.title}).`
                          )
                        }
                        className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Rangkum Dokumen Ini dengan AI</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {doc.articles.map((art) => {
                        const isCopied = copiedArticleId === art.id;
                        return (
                          <div
                            key={art.id}
                            className="p-4 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-2 transition hover:border-slate-300"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-indigo-700 font-mono">
                                  {art.pasal}
                                </span>
                                {art.bab && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">
                                    {art.bab}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    onAskAboutRegulation(
                                      `Tolong jelaskan maksud, tafsir hukum, dan konsekuensi praktis dari ${doc.number} ${art.pasal}.`
                                    )
                                  }
                                  className="text-[11px] text-indigo-700 hover:text-indigo-800 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 transition flex items-center gap-1 font-semibold"
                                  title="Analisis pasal ini"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Tanya AI</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleCopyArticle(
                                      `${doc.number} ${art.pasal}\n${art.content}`,
                                      art.id
                                    )
                                  }
                                  className="text-[11px] text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition"
                                  title="Salin teks pasal"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                              {art.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
