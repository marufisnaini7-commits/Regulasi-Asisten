# Asisten Hukum & Regulasi Karantina Indonesia

Aplikasi web berbasis AI untuk pencarian, komparasi, telaah pasal, dan analisis kepatuhan hukum regulasi perkarantinaan Indonesia (Badan Karantina Indonesia - Barantin), merujuk langsung pada dokumen resmi seperti **UU No. 21 Tahun 2019**, **PP No. 29 Tahun 2023**, Peraturan Badan (PERBA), dan Keputusan Kepala (KEPKA/KPT).

---

## 🌟 Fitur Utama

- **Pencarian Regulasi & Pasal Terstruktur**: Indeks pasal lengkap dengan pencarian teks, nomor pasal, dan klasifikasi jenis dokumen (UU, PP, PERBA, KEPKA).
- **Asisten AI Analisis Hukum**: Konsultasi regulasi berbasis Gemini API dengan sistem *Smart Retrieval / RAG* hemat token dan akurasi tinggi berdasar rujukan pasal resmi.
- **Komparasi Antar Regulasi**: Membandingkan hierarki dan ketentuan antar undang-undang dan peraturan pelaksana.
- **Sinkronisasi Berkas Google Drive / Cloud**: Mendukung integrasi katalog peraturan terpusat.
- **Manajemen Riwayat & Kuota Aman**: Dukungan pembersihan riwayat percakapan untuk reset token serta penanganan rate-limit cerdas.

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Prasyarat
- **Node.js**: Versi 18 atau lebih baru.
- **npm** atau **yarn / pnpm**.
- **Gemini API Key**: Dapatkan gratis melalui [Google AI Studio](https://aistudio.google.com/).

### 2. Instalasi Dependensi
```bash
git clone https://github.com/<username>/<nama-repo>.git
cd <nama-repo>
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Salin contoh berkas `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Lalu isi kredensial API Gemini Anda di dalam berkas `.env`:
```env
GEMINI_API_KEY=AIzaSy...
PORT=3000
```

### 4. Jalankan Aplikasi (Mode Pengembangan)
```bash
npm run dev
```
Aplikasi akan berjalan di: `http://localhost:3000`

### 5. Build untuk Produksi
```bash
npm run build
npm start
```

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.
- **Backend**: Express.js (Node.js server dengan integrasi Vite middleware).
- **AI Engine**: Google Gemini API (`@google/genai` dengan model `gemini-3.6-flash`).
- **Build Tool**: Vite & esbuild.

---

## 📄 Lisensi
Hak Cipta © 2024-2026. Dikembangkan untuk analisis kepatuhan regulasi Karantina Indonesia.
