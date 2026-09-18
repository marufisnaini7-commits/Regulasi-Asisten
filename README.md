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

## 🌐 Cara Menghasilkan Link Akses Publik (Live Site) dari GitHub

Anda dapat mempublikasikan situs ini menjadi link live yang dapat diakses siapa saja melalui 2 pilihan:

### Pilihan 1: GitHub Pages (Otomatis via GitHub Actions)
Alamat yang dihasilkan: `https://<username>.github.io/<nama-repo>/`

1. Masuk ke repositori GitHub Anda.
2. Buka tab **Settings** ➔ **Pages** (di bilah navigasi sebelah kiri).
3. Di bagian **Build and deployment** ➔ **Source**, ubah dari *Deploy from a branch* menjadi **GitHub Actions**.
4. GitHub Actions akan secara otomatis menjalankan workflow `.github/workflows/deploy-pages.yml` setiap kali Anda melakukan push ke branch `main`.
5. Setelah beberapa saat, link aktif `https://<username>.github.io/<nama-repo>/` akan langsung muncul di halaman tersebut.

> ℹ️ **Catatan Fitur**: GitHub Pages adalah hosting berkas statis. Seluruh fitur katalog dokumen, pencarian pasal, filter UU/PP/PERBA/KEPKA, serta komparasi regulasi berfungsi 100%. Untuk fitur Tanya Jawab AI dengan backend, gunakan Pilihan 2 di bawah.

---

### Pilihan 2: Hubungkan Repositori GitHub ke Render (Full-Stack + AI Aktif)
Alamat yang dihasilkan: `https://<nama-repo>.onrender.com`

1. Buka [render.com](https://render.com) dan login menggunakan akun GitHub Anda.
2. Klik **New +** ➔ **Web Service**.
3. Pilih repositori GitHub Anda.
4. Render akan otomatis mendeteksi berkas `render.yaml` yang sudah kami sediakan:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Di bagian **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`: Masukkan kunci API Gemini Anda.
6. Klik **Create Web Service**. Anda akan langsung mendapatkan link HTTPS publik dengan seluruh fitur pencarian dan asisten AI aktif!

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.
- **Backend**: Express.js (Node.js server dengan integrasi Vite middleware).
- **AI Engine**: Google Gemini API (`@google/genai` dengan model `gemini-3.6-flash`).
- **Build Tool**: Vite & esbuild.

---

## 📄 Lisensi
Hak Cipta © 2024-2026. Dikembangkan untuk analisis kepatuhan regulasi Karantina Indonesia.
