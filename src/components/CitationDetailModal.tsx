import React from 'react';
import { X, BookOpen, Copy, Check, Scale, ExternalLink } from 'lucide-react';
import { RegulationDocument } from '../types';

interface CitationDetailModalProps {
  citation: string | null;
  onClose: () => void;
  regulations: RegulationDocument[];
}

export const CitationDetailModal: React.FC<CitationDetailModalProps> = ({
  citation,
  onClose,
  regulations,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  // Clean citation text
  const cleanCitation = citation.replace(/^\[|\]$/g, '').trim();

  // Find matching regulation
  let matchedDoc: RegulationDocument | undefined;
  let matchedArticleContent: string | undefined;
  let matchedPasalTitle: string = cleanCitation;

  for (const doc of regulations) {
    if (
      cleanCitation.toLowerCase().includes(doc.number.toLowerCase()) ||
      cleanCitation.toLowerCase().includes(doc.category.toLowerCase()) ||
      doc.title.toLowerCase().includes(cleanCitation.toLowerCase())
    ) {
      matchedDoc = doc;
      // Find matching pasal
      const pasalMatch = cleanCitation.match(/Pasal\s+\d+|Diktum\s+[A-Za-z0-9]+/i);
      if (pasalMatch) {
        const pSearch = pasalMatch[0].toLowerCase();
        const art = doc.articles.find((a) => a.pasal.toLowerCase().includes(pSearch));
        if (art) {
          matchedArticleContent = art.content;
          matchedPasalTitle = `${doc.number} - ${art.pasal}`;
        }
      }
      break;
    }
  }

  // Fallback: if not found by exact number, check if any pasal contains the term
  if (!matchedDoc) {
    for (const doc of regulations) {
      const pasalMatch = cleanCitation.match(/Pasal\s+\d+/i);
      if (pasalMatch) {
        const art = doc.articles.find((a) => a.pasal.toLowerCase().includes(pasalMatch[0].toLowerCase()));
        if (art) {
          matchedDoc = doc;
          matchedArticleContent = art.content;
          matchedPasalTitle = `${doc.number} - ${art.pasal}`;
          break;
        }
      }
    }
  }

  const handleCopy = () => {
    const textToCopy = `${cleanCitation}\n\n${matchedArticleContent || matchedDoc?.description || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-800 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rujukan Yuridis Spesifik</h3>
              <p className="text-[11px] text-slate-500">Verifikasi dasar hukum dan pasal otentik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Badge & Title */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-indigo-700 font-bold">{cleanCitation}</span>
              {matchedDoc && (
                <span className="bg-white text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200 shadow-2xs">
                  {matchedDoc.category}
                </span>
              )}
            </div>
            {matchedDoc && (
              <p className="text-slate-700 text-xs font-semibold">{matchedDoc.title}</p>
            )}
          </div>

          {/* Authentic Text */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              Naskah Ketentuan Resmi:
            </label>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans text-slate-800 leading-relaxed whitespace-pre-wrap text-xs shadow-inner">
              {matchedArticleContent ? (
                matchedArticleContent
              ) : matchedDoc ? (
                <div className="space-y-2">
                  <p>{matchedDoc.description}</p>
                  <p className="text-slate-500 text-[11px] italic">
                    (Kutipan ringkas dokumen: {matchedDoc.fullText.slice(0, 400)}...)
                  </p>
                </div>
              ) : (
                <p className="text-amber-700 italic">
                  Teks pasal spesifik untuk kutipan ini terangkum dalam respon AI. Pastikan dokumen terkait telah disinkronkan dari Google Drive.
                </p>
              )}
            </div>
          </div>

          {/* Legal Compliance Guarantee Note */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
              ✓
            </div>
            <p>
              Asisten diwajibkan secara ketat hanya mengutip aturan yang terdapat dalam basis data dokumen hukum perkarantinaan dan ASN.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition font-semibold shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Kutipan'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
