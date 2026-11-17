export const UPDATES_LOG = [
  {
    id: 'upd-009',
    date: '17 November 2026',
    version: 'v2.4.0',
    category: 'Fitur Baru',
    title: 'Halaman Catatan Update & Dokumentasi',
    commit: 'latest',
    summary: 'Menambahkan halaman khusus /updates dan tombol navigasi di dashboard untuk mencatat seluruh riwayat pembaruan beserta dokumentasi teknisnya.',
    changes: [
      'Menambahkan halaman statis /updates yang dapat diakses langsung lewat URL maupun tombol "Catatan Update" di bar navigasi atas.',
      'Menyediakan filter kategori (Fitur Baru, Perbaikan Bug, Desain & UI, Keamanan & Akses) agar riwayat mudah ditelusuri.',
      'Menyertakan rincian dokumentasi teknis (file terdampak dan mekanisme kerja) untuk setiap pembaruan.'
    ],
    docs: {
      files: ['src/data/updatesLog.js', 'src/components/UpdatesPage.jsx', 'src/pages/updates.astro', 'src/components/GameDashboard.jsx'],
      notes: 'Setiap pembaruan baru ditambahkan ke array UPDATES_LOG di src/data/updatesLog.js pada urutan paling atas agar otomatis tampil di /updates dan menu Catatan Update.'
    }
  },
  {
    id: 'upd-008',
    date: '17 November 2026',
    version: 'v2.3.1',
    category: 'Keamanan & Akses',
    title: 'Penyeragaman Login Panitia Tanpa Passkey',
    commit: 'daae315',
    summary: 'Menyamakan alur masuk NIM 114160066 dengan NIM 114160067 agar langsung masuk sebagai panitia tanpa prompt passkey tambahan.',
    changes: [
      'Menghapus pemeriksaan passkey khusus NIM 114160066 pada halaman login utama dan halaman Magical Athlete.',
      'Status panitia (is_admin) kini dibaca langsung dari tabel alumni di Supabase.'
    ],
    docs: {
      files: ['src/components/Login.jsx', 'src/components/MagicalAthleteGame.jsx'],
      notes: 'Akses panitia dikontrol penuh oleh kolom boolean is_admin pada tabel alumni di Supabase.'
    }
  },
  {
    id: 'upd-007',
    date: '17 November 2026',
    version: 'v2.3.0',
    category: 'Perbaikan Bug',
    title: 'Perbaikan Ikon SVG Dashboard & Penguncian Node.js 22.x',
    commit: 'a36e9a7',
    summary: 'Memperbaiki ReferenceError IconMap pada dashboard utama dan mengunci versi Node.js build Vercel ke 22.x LTS.',
    changes: [
      'Menambahkan definisi komponen ikon SVG (IconMap, IconUsers, IconBoard, IconClass, IconCards) di GameDashboard.jsx.',
      'Mengubah engines.node di package.json dari >=22.12.0 menjadi 22.x agar Vercel tidak menaikkan runtime ke 26.x.'
    ],
    docs: {
      files: ['src/components/GameDashboard.jsx', 'package.json'],
      notes: 'Mengatasi error runtime saat membuka beranda setelah migrasi ikon SVG.'
    }
  },
  {
    id: 'upd-006',
    date: '17 November 2026',
    version: 'v2.2.0',
    category: 'Desain & UI',
    title: 'Transformasi Tema Buku Kenangan Hangat (Warm Paper & Ink)',
    commit: 'eba8553',
    summary: 'Merombak seluruh tampilan dari tema gelap generik menjadi tema kertas buku tahunan (#FAF6EE) dengan tipografi DM Sans dan Fredoka.',
    changes: [
      'Mengganti latar belakang gelap menjadi kertas krem hangat (#FAF6EE) dengan permukaan putih (#FFFFFF) dan pemisah garis tipis (#DED6C6).',
      'Mengganti font Plus Jakarta Sans dengan DM Sans yang dipadukan Fredoka untuk judul dan JetBrains Mono untuk angka tabular.',
      'Mengubah tata letak daftar permainan di beranda menjadi baris editorial tanpa kotak kartu seragam dan mengganti emoji dengan ikon garis SVG.',
      'Menyelaraskan peta MapGame ke tile terang (light_all) dan segmen Wheel of Family ke palet hijau-emas-merah-biru klasik.'
    ],
    docs: {
      files: ['DESIGN.md', 'src/styles/global.css', 'src/layouts/Layout.astro', 'src/pages/index.astro', 'src/components/*'],
      notes: 'Memenuhi pemeriksaan Impeccable Detect dengan 0 peringatan overused-font, 0 ai-color-palette, dan 0 bounce-easing.'
    }
  },
  {
    id: 'upd-005',
    date: '17 November 2026',
    version: 'v2.1.0',
    category: 'Desain & UI',
    title: 'Peningkatan Audit Impeccable (Skor 20/20)',
    commit: '79207be',
    summary: 'Menambahkan mode perbesar papan Monopoli di HP, semantic CSS tokens, optimasi query Supabase, dan dokumen PRODUCT.md.',
    changes: [
      'Menambahkan tombol "Perbesar Papan (Sentuh Mudah)" di layar HP untuk papan Monopoli 11x11 agar petak mudah disentuh (>=44px).',
      'Membuat panel chat Dosen Killer dan catatan Intel dapat dilipat (collapsible) di layar kecil.',
      'Mempersempit query select(*) di FaceGame dan ScoreBoard agar hanya mengambil kolom yang diperlukan.',
      'Mengganti dialog alert/confirm bawaan browser di AdminDashboard, MapGame, dan DosenKillerGame dengan banner notifikasi inline.'
    ],
    docs: {
      files: ['PRODUCT.md', 'src/styles/global.css', 'src/components/MonopoliBoard.jsx', 'src/components/AdminDashboard.jsx', 'src/components/DosenKillerGame.jsx', 'src/components/MapGame.jsx', 'src/components/FaceGame.jsx', 'src/components/ScoreBoard.jsx'],
      notes: 'Skor audit teknis Impeccable meningkat dari 13/20 (Acceptable) menjadi 20/20 (Excellent).'
    }
  },
  {
    id: 'upd-004',
    date: '13 November 2026',
    version: 'v2.0.1',
    category: 'Perbaikan Bug',
    title: 'Perbaikan Bug Database & Logika di 5 Permainan',
    commit: '5056216',
    summary: 'Memperbaiki error query Wheel of Family, kebocoran chat Dosen Killer, sinkronisasi real-time UNO, penyimpanan progres Treasure Hunt, dan hak Host Magical Athlete.',
    changes: [
      'WheelOfFamily: Menghapus kolom foto_tebak yang tidak ada di Supabase dan mengarahkan foto 2016 langsung ke /2016/{nim}.webp.',
      'DosenKiller: Memfilter chat diskusi berdasarkan room_code, membatasi kekebalan Uptodate hanya di malam pertama, dan menyelaraskan petunjuk Intel.',
      'UNO Sedulur 16: Menyinkronkan top_card, current_turn, hand, serta efek kartu Skip dan +2 ke tabel uno_rooms dan uno_players.',
      'TreasureHunt: Menyimpan progres soal ke localStorage agar skor tidak ter-reset saat halaman dimuat ulang.'
    ],
    docs: {
      files: ['src/components/WheelOfFamily.jsx', 'src/components/DosenKillerGame.jsx', 'src/components/LayarDiskusi.jsx', 'src/components/LayarMalam.jsx', 'src/components/UnoBrutalGame.jsx', 'src/components/TreasureHunt.jsx', 'src/components/MagicalAthleteGame.jsx'],
      notes: 'Seluruh skema tabel Supabase telah diverifikasi dengan operasi baca-tulis langsung.'
    }
  },
  {
    id: 'upd-003',
    date: '13 November 2026',
    version: 'v2.0.0',
    category: 'Perbaikan Bug',
    title: 'Perbaikan Lengkap Mekanik & Database Monopoli TL16',
    commit: '0240852',
    summary: 'Memperbaiki 6 bug pada Monopoli termasuk sinkronisasi foreign key monopoli_users, transfer uang sewa, dan bonus START.',
    changes: [
      'Menambahkan sinkronisasi upsert otomatis ke monopoli_users agar 62 alumni lainnya dapat masuk ruangan tanpa error foreign key 23503.',
      'Menambahkan transfer uang sewa ke saldo pemilik properti di monopoli_players.',
      'Memperbaiki syarat bonus START (+Rp 200k) agar hanya cair setelah melewati satu putaran penuh.',
      'Mengevaluasi petak tujuan setelah kartu TELEPORT/MUNDUR dan mengunci warna bidak yang sudah dipilih pemain lain.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Memastikan sinkronisasi state real-time antara tabel monopoli_rooms, monopoli_players, dan monopoli_properties.'
    }
  },
  {
    id: 'upd-002',
    date: '13 November 2026',
    version: 'v1.9.1',
    category: 'Desain & UI',
    title: 'Penghapusan Teks Judul Ganda pada Logo Resmi',
    commit: '9ab620c',
    summary: 'Menampilkan hanya logo grafis berwarna "HAPPY ANNIVERSARY TL 2016" tanpa pengulangan teks judul di atas atau bawahnya.',
    changes: [
      'Menghapus badge dan heading teks ganda di Login.jsx dan modal sambutan GameDashboard.jsx.',
      'Mempertahankan aksesibilitas heading semantik menggunakan alt text pada gambar logo.'
    ],
    docs: {
      files: ['src/components/Login.jsx', 'src/components/GameDashboard.jsx'],
      notes: 'Menggunakan aset /Asset 2.webp secara tunggal sebagai penanda visual utama.'
    }
  }
];
