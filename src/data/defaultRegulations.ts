import { RegulationDocument } from '../types';

export const DEFAULT_REGULATIONS: RegulationDocument[] = [
  {
    id: 'uu-21-2019',
    category: 'UU',
    number: 'UU No. 21 Tahun 2019',
    title: 'Karantina Hewan, Ikan, dan Tumbuhan',
    year: 2019,
    description: 'Landasan hukum utama penyelenggaraan perkarantinaan hewan, ikan, dan tumbuhan untuk mencegah masuk, keluar, dan tersebarnya HPHK, HPIK, dan OPTK.',
    source: 'sistem_bawaan',
    lastSyncedAt: new Date().toISOString(),
    articles: [
      {
        id: 'uu-21-2019-p1',
        pasal: 'Pasal 1 angka 1',
        content: 'Karantina adalah sistem pencegahan masuk, keluar, dan tersebarnya hama dan penyakit hewan karantina, hama dan penyakit ikan karantina, serta organisme pengganggu tumbuhan karantina; serta pengawasan dan/atau pengendalian terhadap keamanan pangan dan mutu pangan, keamanan pakan dan mutu pakan, produk rekayasa genetik, sumber daya genetik, agens hayati, jenis asing invasif, tumbuhan dan satwa liar, serta tumbuhan dan satwa langka yang dimasukkan ke dalam, tersebarnya dari suatu Area ke Area lain, dan/atau dikeluarkan dari wilayah Negara Kesatuan Republik Indonesia.',
      },
      {
        id: 'uu-21-2019-p7',
        pasal: 'Pasal 7',
        content: 'Objek Karantina meliputi: a. Media Pembawa; dan b. Bukan Media Pembawa yang berpotensi membawa HPHK, HPIK, dan/atau OPTK.',
      },
      {
        id: 'uu-21-2019-p16',
        pasal: 'Pasal 16',
        content: '(1) Terhadap setiap Media Pembawa yang dimasukkan ke dalam wilayah Negara Kesatuan Republik Indonesia, dibawa atau dikirim dari satu Area ke Area lain di dalam wilayah Negara Kesatuan Republik Indonesia, dan dikeluarkan dari wilayah Negara Kesatuan Republik Indonesia dilakukan Tindakan Karantina.\n(2) Tindakan Karantina sebagaimana dimaksud pada ayat (1) meliputi:\na. pemeriksaan;\nb. pengasingan;\nc. pengamatan;\nd. perlakuan;\ne. penahanan;\nf. penolakan;\ng. pemusnahan; dan\nh. pembebasan.\n(3) Tindakan Karantina sebagaimana dimaksud pada ayat (2) dilakukan oleh Pejabat Karantina.',
      },
      {
        id: 'uu-21-2019-p33',
        pasal: 'Pasal 33',
        content: '(1) Setiap Orang yang memasukkan Media Pembawa ke dalam wilayah Negara Kesatuan Republik Indonesia wajib:\na. melengkapi sertifikat kesehatan dari negara asal bagi Hewan, Produk Hewan, Ikan, Produk Ikan, Tumbuhan, dan/atau Produk Tumbuhan;\nb. memasukkan Media Pembawa melalui Tempat Pemasukan yang telah ditetapkan oleh Pemerintah Pusat; dan\nc. melaporkan dan menyerahkan Media Pembawa kepada Pejabat Karantina di Tempat Pemasukan yang ditetapkan oleh Pemerintah Pusat untuk keperluan Tindakan Karantina dan pengawasan dan/atau pengendalian.\n(2) Kewajiban melengkapi sertifikat kesehatan sebagaimana dimaksud pada ayat (1) huruf a juga berlaku untuk pemasukan Benda Lain.',
      },
      {
        id: 'uu-21-2019-p34',
        pasal: 'Pasal 34',
        content: 'Setiap Orang yang mengeluarkan Media Pembawa dari wilayah Negara Kesatuan Republik Indonesia wajib:\na. melengkapi sertifikat kesehatan bagi Hewan, Produk Hewan, Ikan, Produk Ikan, Tumbuhan, dan/atau Produk Tumbuhan jika dipersyaratkan oleh negara tujuan;\nb. mengeluarkan Media Pembawa melalui Tempat Pengeluaran yang telah ditetapkan oleh Pemerintah Pusat; dan\nc. melaporkan dan menyerahkan Media Pembawa kepada Pejabat Karantina di Tempat Pengeluaran yang ditetapkan oleh Pemerintah Pusat untuk keperluan Tindakan Karantina dan pengawasan dan/atau pengendalian.',
      },
      {
        id: 'uu-21-2019-p35',
        pasal: 'Pasal 35',
        content: '(1) Setiap Orang yang membawa atau mengirim Media Pembawa dari satu Area ke Area lain di dalam wilayah Negara Kesatuan Republik Indonesia wajib:\na. melengkapi sertifikat kesehatan dari Tempat Pengeluaran yang ditetapkan oleh Pemerintah Pusat bagi Hewan, Produk Hewan, Ikan, Produk Ikan, Tumbuhan, dan/atau Produk Tumbuhan;\nb. memasukkan dan/atau mengeluarkan Media Pembawa melalui Tempat Pemasukan dan Tempat Pengeluaran yang telah ditetapkan oleh Pemerintah Pusat; dan\nc. melaporkan dan menyerahkan Media Pembawa kepada Pejabat Karantina di Tempat Pemasukan dan Tempat Pengeluaran yang ditetapkan oleh Pemerintah Pusat untuk keperluan Tindakan Karantina dan pengawasan dan/atau pengendalian.',
      },
      {
        id: 'uu-21-2019-p44',
        pasal: 'Pasal 44',
        content: 'Pemusnahan terhadap Media Pembawa dilakukan jika:\na. setelah Media Pembawa diturunkan dari alat angkut dan dilakukan pemeriksaan, ternyata busuk, rusak, atau merupakan jenis yang dilarang pemasukannya;\nb. setelah dilakukan pengamatan, pemeriksaan laboratoris, dan perlakuan, ternyata HPHK, HPIK, atau OPTK yang bersangkutan tidak dapat dibebaskan;\nc. setelah dilakukan penolakan, Media Pembawa tidak segera dibawa keluar wilayah Indonesia atau Area tujuan oleh pemilik dalam batas waktu yang ditentukan; atau\nd. setelah dilakukan pemeriksaan, Media Pembawa tertular HPHK, HPIK, atau OPTK tertentu yang ditetapkan Pemerintah Pusat.',
      },
      {
        id: 'uu-21-2019-p86',
        pasal: 'Pasal 86',
        content: 'Setiap Orang yang dengan sengaja memasukkan atau mengeluarkan Media Pembawa dari luar negeri atau antar Area ke dalam wilayah Negara Kesatuan Republik Indonesia tanpa memenuhi kewajiban sertifikat kesehatan dan lapor Pejabat Karantina sebagaimana dimaksud dalam Pasal 33 ayat (1) dipidana dengan pidana penjara paling lama 10 (sepuluh) tahun dan pidana denda paling banyak Rp10.000.000.000,00 (sepuluh miliar rupiah).',
      },
      {
        id: 'uu-21-2019-p88',
        pasal: 'Pasal 88',
        content: 'Setiap Orang yang membawa atau mengirim Media Pembawa dari satu Area ke Area lain di dalam wilayah NKRI yang tidak memenuhi persyaratan sebagaimana dimaksud dalam Pasal 35 ayat (1) dipidana dengan pidana penjara paling lama 2 (dua) tahun dan pidana denda paling banyak Rp2.000.000.000,00 (dua miliar rupiah).',
      },
    ],
    fullText: `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 21 TAHUN 2019 TENTANG KARANTINA HEWAN, IKAN, DAN TUMBUHAN.
Menetapkan kewajiban 3 persyaratan karantina (Sertifikat Kesehatan, Masuk/Keluar lewat Tempat Ditetapkan, dan Lapor Pejabat Karantina).
Menetapkan 8 Tindakan Karantina (8P: Pemeriksaan, Pengasingan, Pengamatan, Perlakuan, Penahanan, Penolakan, Pemusnahan, Pembebasan).
Sanksi Pidana: Pasal 86 penjara hingga 10 tahun dan denda hingga Rp10 Miliar. Pasal 88 antar area penjara hingga 2 tahun dan denda hingga Rp2 Miliar.`,
  },
  {
    id: 'uu-20-2023',
    category: 'UU',
    number: 'UU No. 20 Tahun 2023',
    title: 'Aparatur Sipil Negara (ASN)',
    year: 2023,
    description: 'Pengaturan penyelenggaraan Aparatur Sipil Negara berbasis sistem merit, nilai dasar BerAKHLAK, digitalisasi manajemen ASN, serta disiplin dan netralitas pegawai.',
    source: 'sistem_bawaan',
    lastSyncedAt: new Date().toISOString(),
    articles: [
      {
        id: 'uu-20-2023-p3',
        pasal: 'Pasal 3',
        content: 'ASN sebagai profesi berlandaskan pada prinsip:\na. nilai dasar;\nb. kode etik dan kode perilaku;\nc. komitmen, integritas moral, dan tanggung jawab pada pelayanan publik;\nd. kompetensi yang diperlukan sesuai dengan bidang tugas;\ndan profesionalitas jabatan.',
      },
      {
        id: 'uu-20-2023-p4',
        pasal: 'Pasal 4',
        content: '(1) Nilai dasar ASN dijabarkan dalam kode etik dan kode perilaku ASN yang berorientasi pelayanan, akuntabel, kompeten, harmonis, loyal, adaptif, dan kolaboratif (BerAKHLAK).\n(2) Pegawai ASN wajib menginternalisasi dan menerapkan nilai dasar ASN dalam pelaksanaan tugas dan kehidupan sehari-hari.',
      },
      {
        id: 'uu-20-2023-p9',
        pasal: 'Pasal 9 ayat (2)',
        content: 'Pegawai ASN harus bebas dari pengaruh dan intervensi semua golongan dan partai politik.',
      },
      {
        id: 'uu-20-2023-p21',
        pasal: 'Pasal 21',
        content: '(1) Pegawai ASN berhak memperoleh penghargaan dan pengakuan berupa materiel dan/atau nonmateriel.\n(2) Komponen penghargaan dan pengakuan Pegawai ASN meliputi: penghasilan; penghargaan yang bersifat motivasi; tunjangan dan fasilitas; jaminan sosial (kesehatan, kecelakaan kerja, kematian, pensiun, hari tua); lingkungan kerja; pengembangan diri; dan bantuan hukum.',
      },
      {
        id: 'uu-20-2023-p24',
        pasal: 'Pasal 24',
        content: 'Pegawai ASN wajib:\na. setia dan taat pada Pancasila, Undang-Undang Dasar Negara Republik Indonesia Tahun 1945, NKRI, dan pemerintah yang sah;\nb. menaati ketentuan peraturan perundang-undangan;\nc. melaksanakan nilai dasar ASN dan kode etik serta kode perilaku ASN;\nd. menjaga netralitas;\ne. bersedia ditempatkan di seluruh wilayah NKRI dan satuan kerja di luar negeri.',
      },
      {
        id: 'uu-20-2023-p52',
        pasal: 'Pasal 52',
        content: '(1) Pemberhentian Pegawai ASN terdiri atas pemberhentian atas permintaan sendiri dan pemberhentian tidak atas permintaan sendiri.\n(2) Pegawai ASN diberhentikan tidak atas permintaan sendiri karena:\na. melakukan penyelewengan terhadap Pancasila dan UUD 1945;\nb. meninggal dunia;\nc. mencapai batas usia pensiun jabatan;\nd. terdampak perampingan organisasi atau kebijakan pemerintah;\ne. tidak cakap jasmani dan/atau rohani;\nf. tidak berkinerja;\ng. melakukan pelanggaran disiplin tingkat berat;\nh. dipidana dengan pidana penjara berdasarkan putusan pengadilan yang telah berkekuatan hukum tetap; atau\ni. menjadi anggota dan/atau pengurus partai politik.',
      },
      {
        id: 'uu-20-2023-p55',
        pasal: 'Pasal 55',
        content: 'Batas usia pensiun jabatan Pegawai ASN yaitu:\na. Jabatan Manajerial:\n1. 60 (enam puluh) tahun bagi pejabat pimpinan tinggi utama, madya, dan pratama;\n2. 58 (lima puluh delapan) tahun bagi pejabat administrator dan pengawas;\nb. Jabatan Nonmanajerial:\n1. sesuai dengan ketentuan peraturan perundang-undangan bagi pejabat fungsional;\n2. 58 (lima puluh delapan) tahun bagi pejabat pelaksana.',
      },
    ],
    fullText: `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 20 TAHUN 2023 TENTANG APARATUR SIPIL NEGARA.
Menetapkan asas netralitas ASN (Pasal 9 ayat 2, Pasal 24), nilai dasar BerAKHLAK (Pasal 4), hak dan kewajiban ASN (Pasal 21, Pasal 24), pemberhentian tidak dengan hormat/atas permintaan sendiri (Pasal 52), dan batas usia pensiun (Pasal 55).`,
  },
  {
    id: 'pp-29-2023',
    category: 'PP',
    number: 'PP No. 29 Tahun 2023',
    title: 'Peraturan Pelaksanaan UU No. 21 Tahun 2019 tentang Karantina Hewan, Ikan, dan Tumbuhan',
    year: 2023,
    description: 'Ketentuan teknis pelaksanaan tindakan karantina, penetapan tempat pemasukan dan pengeluaran, pengawasan dokumen, serta fungsi laboratorium karantina.',
    source: 'sistem_bawaan',
    lastSyncedAt: new Date().toISOString(),
    articles: [
      {
        id: 'pp-29-2023-p4',
        pasal: 'Pasal 4',
        content: '(1) Setiap Media Pembawa yang dimasukkan, dikeluarkan, atau dilalulintaskan antar Area wajib diperiksa oleh Pejabat Karantina pada Tempat Pemasukan atau Tempat Pengeluaran yang telah ditetapkan.\n(2) Tempat Pemasukan dan Tempat Pengeluaran sebagaimana dimaksud pada ayat (1) berupa pelabuhan laut, pelabuhan sungai, pelabuhan danau, bandar udara, kantor pos, pos lintas batas darat, dan pos lintas batas laut.',
      },
      {
        id: 'pp-29-2023-p12',
        pasal: 'Pasal 12',
        content: '(1) Tindakan Karantina berupa pemeriksaan dilakukan untuk mengetahui kelengkapan, kebenaran, dan keabsahan dokumen persyaratan, serta mendeteksi ada tidaknya HPHK, HPIK, atau OPTK.\n(2) Pemeriksaan kesehatan Media Pembawa dilakukan secara klinis, visual, dan/atau laboratoris sesuai dengan standar analisis risiko.',
      },
      {
        id: 'pp-29-2023-p28',
        pasal: 'Pasal 28',
        content: '(1) Perlakuan Karantina dilakukan terhadap Media Pembawa apabila:\na. setelah diperiksa ternyata tertular HPHK, HPIK, atau OPTK yang masih dapat disembuhkan atau dibebaskan;\nb. dipersyaratkan oleh negara tujuan atau Area tujuan; atau\nc. merupakan tindakan preventif pencegahan penularan.\n(2) Perlakuan dapat berupa fumigasi, desinfeksi, desinfestasi, perlakuan panas, dingin, atau tindakan fisik dan kimiawi lainnya sesuai standar biosafety dan biosecurity.',
      },
      {
        id: 'pp-29-2023-p45',
        pasal: 'Pasal 45',
        content: 'Pejabat Karantina berwenang memasuki alat angkut, gudang, instalasi karantina, atau tempat penyimpanan Media Pembawa untuk melakukan Tindakan Karantina dan pengawasan peredaran.',
      },
    ],
    fullText: `PERATURAN PEMERINTAH NOMOR 29 TAHUN 2023 TENTANG PERATURAN PELAKSANAAN UNDANG-UNDANG NOMOR 21 TAHUN 2019 TENTANG KARANTINA HEWAN, IKAN, DAN TUMBUHAN.
Mengatur rincian teknis tindakan pemeriksaan (Pasal 12), perlakuan (Pasal 28), tempat pemasukan/pengeluaran (Pasal 4), dan kewenangan pejabat karantina dalam inspeksi (Pasal 45).`,
  },
  {
    id: 'pp-94-2021',
    category: 'PP',
    number: 'PP No. 94 Tahun 2021',
    title: 'Disiplin Pegawai Negeri Sipil',
    year: 2021,
    description: 'Aturan mengenai kewajiban, larangan, serta tingkat dan jenis hukuman disiplin bagi PNS, termasuk penegakan netralitas dan sanksi ketidakhadiran kerja.',
    source: 'sistem_bawaan',
    lastSyncedAt: new Date().toISOString(),
    articles: [
      {
        id: 'pp-94-2021-p3',
        pasal: 'Pasal 3',
        content: 'PNS wajib:\na. setia dan taat sepenuhnya kepada Pancasila, UUD 1945, NKRI, dan Pemerintah;\nb. menjaga persatuan dan kesatuan bangsa;\nc. melaksanakan kebijakan yang ditetapkan oleh pejabat pemerintah yang berwenang;\nd. menaati ketentuan peraturan perundang-undangan;\ne. melaksanakan tugas kedinasan dengan penuh pengabdian, kejujuran, kesadaran, dan tanggung jawab;\nf. menunjukkan integritas dan keteladanan dalam sikap, perilaku, ucapan, dan tindakan kepada setiap orang;\ng. menyimpan rahasia jabatan;\nh. bersedia ditempatkan di seluruh wilayah NKRI.',
      },
      {
        id: 'pp-94-2021-p5',
        pasal: 'Pasal 5 huruf n',
        content: 'PNS dilarang memberikan dukungan kepada calon Presiden/Wakil Presiden, calon Kepala Daerah/Wakil Kepala Daerah, calon anggota DPR, DPD, atau DPRD dengan cara:\n1. ikut kampanye;\n2. menjadi peserta kampanye dengan menggunakan atribut partai atau atribut PNS;\n3. sebagai peserta kampanye dengan mengerahkan PNS lain;\n4. sebagai peserta kampanye dengan menggunakan fasilitas negara;\n5. membuat keputusan dan/atau tindakan yang menguntungkan atau merugikan salah satu pasangan calon;\n6. mengadakan kegiatan yang mengarah kepada keberpihakan terhadap pasangan calon; dan/atau\n7. memberikan surat dukungan disertai fotokopi KTP.',
      },
      {
        id: 'pp-94-2021-p8',
        pasal: 'Pasal 8',
        content: '(1) Tingkat Hukuman Disiplin terdiri atas:\na. Hukuman Disiplin ringan;\nb. Hukuman Disiplin sedang; dan\nc. Hukuman Disiplin berat.\n(2) Jenis Hukuman Disiplin ringan terdiri atas: teguran lisan; teguran tertulis; dan pernyataan tidak puas secara tertulis.\n(3) Jenis Hukuman Disiplin sedang terdiri atas: pemotongan tunjangan kinerja sebesar 25% selama 6 bulan, 9 bulan, atau 12 bulan.\n(4) Jenis Hukuman Disiplin berat terdiri atas:\na. penurunan jabatan setingkat lebih rendah selama 12 (dua belas) bulan;\nb. pembebasan dari jabatannya menjadi jabatan pelaksana selama 12 (dua belas) bulan; dan\nc. pemberhentian dengan hormat tidak atas permintaan sendiri sebagai PNS.',
      },
      {
        id: 'pp-94-2021-p11',
        pasal: 'Pasal 11 ayat (2) huruf d',
        content: 'Pemberhentian dengan hormat tidak atas permintaan sendiri sebagai PNS dijatuhkan bagi PNS yang tidak Masuk Kerja tanpa alasan yang sah secara kumulatif selama 28 (dua puluh delapan) hari kerja atau lebih dalam 1 (satu) tahun, atau secara terus-menerus selama 10 (sepuluh) hari kerja berturut-turut.',
      },
    ],
    fullText: `PERATURAN PEMERINTAH NOMOR 94 TAHUN 2021 TENTANG DISIPLIN PEGAWAI NEGERI SIPIL.
Mengatur kewajiban PNS (Pasal 3), larangan netralitas politik (Pasal 5 huruf n), klasifikasi hukuman disiplin ringan, sedang, dan berat (Pasal 8), serta sanksi pemecatan akibat mangkir 10 hari kerja berturut-turut atau 28 hari kerja kumulatif (Pasal 11).`,
  },
  {
    id: 'perba-01-2024',
    category: 'PERBA',
    number: 'PERBA No. 1 Tahun 2024',
    title: 'Tata Cara Tindakan Karantina Hewan, Ikan, dan Tumbuhan',
    year: 2024,
    description: 'Peraturan Badan Karantina Indonesia tentang pedoman operasional pelaksanaan 8 tindakan karantina di pos lintas batas, pelabuhan, dan bandar udara.',
    source: 'sistem_bawaan',
    lastSyncedAt: new Date().toISOString(),
    articles: [
      {
        id: 'perba-01-2024-p3',
        pasal: 'Pasal 3',
        content: 'Tindakan Karantina dilaksanakan secara terpadu oleh Pejabat Karantina yang terdiri dari Analis Perkarantinaan Tumbuhan, Pemeriksa Karantina Tumbuhan, Medik Veteriner Karantina, Paramedik Karantina Hewan, Pengendali Hama Penyakit Ikan, dan Asisten Pengendali Hama Penyakit Ikan sesuai dengan kompetensi jabatannya.',
      },
      {
        id: 'perba-01-2024-p8',
        pasal: 'Pasal 8',
        content: '(1) Setiap pengajuan permohonan pemeriksaan karantina dilakukan secara elektronik melalui sistem informasi perkarantinaan terintegrasi.\n(2) Pemilik atau kuasanya wajib mengunggah dokumen persyaratan karantina paling lambat sebelum Media Pembawa tiba di Tempat Pemasukan.',
      },
      {
        id: 'perba-01-2024-p15',
        pasal: 'Pasal 15',
        content: 'Penahanan Media Pembawa dilakukan dalam jangka waktu paling lama 14 (empat belas) hari kerja apabila dokumen persyaratan belum lengkap, untuk memberikan kesempatan kepada pemilik melengkapi dokumen yang dipersyaratkan.',
      },
      {
        id: 'perba-01-2024-p22',
        pasal: 'Pasal 22',
        content: 'Sertifikat Pelepasan Karantina diterbitkan apabila Media Pembawa dinyatakan bebas dari HPHK, HPIK, atau OPTK setelah melalui tahapan pemeriksaan fisik, uji laboratorium, dan perlakuan (jika diperlukan).',
      },
    ],
    fullText: `PERATURAN BADAN KARANTINA INDONESIA NOMOR 1 TAHUN 2024 TENTANG TATA CARA TINDAKAN KARANTINA HEWAN, IKAN, DAN TUMBUHAN.
Mengatur sinergi pejabat fungsional karantina (Pasal 3), permohonan daring (Pasal 8), jangka waktu penahanan maksimal 14 hari kerja (Pasal 15), dan syarat penerbitan sertifikat pembebasan (Pasal 22).`,
  },
  {
    id: 'kpt-45-2024',
    category: 'KPT',
    number: 'Keputusan Kepala Barantin No. 45/Kpts/2024',
    title: 'Petunjuk Teknis Penugasan dan Penilaian Kinerja Pejabat Fungsional Karantina Indonesia',
    year: 2024,
    description: 'Keputusan Kepala Badan Karantina Indonesia tentang tata laksana operasional harian, kode perilaku petugas di lapangan, dan standardisasi laporan tindakan karantina.',
    source: 'sistem_bawaan',
    lastSyncedAt: new Date().toISOString(),
    articles: [
      {
        id: 'kpt-45-2024-d1',
        pasal: 'Diktum KESATU',
        content: 'Menetapkan Petunjuk Teknis Penugasan dan Penilaian Kinerja Pejabat Fungsional di Lingkungan Badan Karantina Indonesia sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan ini.',
      },
      {
        id: 'kpt-45-2024-d2',
        pasal: 'Diktum KEDUA',
        content: 'Pejabat Fungsional Karantina wajib mematuhi jam operasional dinas 24/7 pada Tempat Pemasukan dan Tempat Pengeluaran strategis internasional, dengan sistem giliran dinas (shift) sesuai standar keselamatan kerja dan integritas ASN.',
      },
      {
        id: 'kpt-45-2024-d3',
        pasal: 'Diktum KETIGA',
        content: 'Setiap Pejabat Fungsional Karantina dilarang menerima imbalan, gratifikasi, atau pungutan liar dalam bentuk apa pun terkait penerbitan sertifikat kesehatan karantina maupun pelaksanaan tindakan 8P.',
      },
    ],
    fullText: `KEPUTUSAN KEPALA BADAN KARANTINA INDONESIA NOMOR 45/Kpts/HK.160/K/02/2024 TENTANG PETUNJUK TEKNIS PENUGASAN DAN PENILAIAN KINERJA PEJABAT FUNGSIONAL KARANTINA INDONESIA.
Mengatur sistem giliran dinas 24/7 di tempat pemasukan strategis (Diktum KEDUA) dan larangan gratifikasi/pungli dalam sertifikasi karantina (Diktum KETIGA).`,
  },
];
