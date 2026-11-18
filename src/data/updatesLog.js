export const UPDATES_LOG = [
  {
    id: 'upd-017',
    date: '18 November 2026',
    version: 'v2.5.0',
    category: 'Desain & UI',
    title: 'Perombakan UI Modern Bento & Studio Kustomisasi Karakter Alumni',
    commit: '8a6c0eb',
    summary: 'Merombak antarmuka portal menjadi gaya Modern Bento yang lebih bersih dan menambahkan studio desain karakter interaktif (@opeepsfun + opsi Hijab) saat memasuki dashboard.',
    changes: [
      'Menambahkan halaman AvatarDesigner sebelum masuk ke Beranda pada setiap login atau sesi baru, lengkap dengan pilihan kulit, latar, 9 gaya rambut/hijab (termasuk Hijab model pashmina lebar bahu), 3 model baju, kacamata, mata, 8 ekspresi mulut, serta tombol Acak Karakter.',
      'Menyimpan detail kustomisasi karakter ke localStorage dan kolom avatar_config di Supabase (alumni & monopoli_users) agar tersinkron antarpemain dan perangkat.',
      'Merombak tampilan Login, Beranda Perayaan (GameDashboard), dan Papan Klasemen (ScoreBoard) ke tata letak Modern Bento yang responsif di HP dan laptop.',
      'Mengintegrasikan karakter kustom ke kartu profil Beranda, tombol Edit Karakter, daftar pemain Klasemen, lobi Monopoli, serta bidak berbingkai warna langsung di atas papan Monopoli TL16.'
    ],
    docs: {
      files: [
        'src/lib/avatarHelper.js',
        'src/components/PlayerAvatar.jsx',
        'src/components/AvatarDesigner.jsx',
        'src/components/GameDashboard.jsx',
        'src/components/Login.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/components/ScoreBoard.jsx',
        'src/data/avatar_schema.sql'
      ],
      notes: 'Menggunakan @opeepsfun/avatar-illustration-system dengan size=380 dan ID mask unik agar tidak terpotong saat dirender responsif, serta overlay vektor custom-hijab agar leher dan bahu tertutup rapi.'
    }
  },
  {
    id: 'upd-016',
    date: '17 November 2026',
    version: 'v2.4.7',
    category: 'Desain & UI',
    title: 'Penyelarasan Tinggi Papan Monopoli & Penanda Warna Blok Pemilik',
    commit: 'latest',
    summary: 'Menyamakan tinggi kolom kanan Daftar Petak dengan batas bawah papan Monopoli di laptop dan mengubah penanda pemilik dari titik kecil menjadi blok warna penuh.',
    changes: [
      'Menyamakan batas bawah kolom Daftar Petak Papan dengan batas bawah papan Monopoli pada tampilan laptop (lg:items-stretch + lg:flex-1).',
      'Mengubah penanda petak yang sudah dimiliki pemain di Daftar Petak dari lingkaran kecil menjadi blok warna penuh sesuai warna bidak pemiliknya.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Menggunakan teknik CSS Grid stretch (lg:h-0 lg:min-h-full pada kolom kanan) agar tinggi daftar petak otomatis mengikuti tinggi papan persegi.'
    }
  },
  {
    id: 'upd-015',
    date: '17 November 2026',
    version: 'v2.4.6',
    category: 'Desain & UI',
    title: 'Daftar Petak Interaktif Pengganti Dropdown di Monopoli TL16',
    commit: 'latest',
    summary: 'Mengganti dropdown Periksa Detail Petak dengan daftar petak interaktif yang dapat dicari dan diklik langsung.',
    changes: [
      'Menghapus elemen <select> dropdown dan menggantinya dengan daftar gulir 40 petak lengkap dengan strip warna, harga, dan indikator pemilik.',
      'Menambahkan kotak pencarian cepat berdasarkan nama atau nomor petak.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Daftar petak terhubung langsung ke handleTileClick sehingga detail harga, sewa, dan pemilik langsung tampil di panel atasnya.'
    }
  },
  {
    id: 'upd-014',
    date: '17 November 2026',
    version: 'v2.4.5',
    category: 'Fitur Baru',
    title: 'Pertahankan Halaman & Ruangan Permainan Saat Refresh',
    commit: 'latest',
    summary: 'Menjaga pemain tetap berada di permainan dan ruangan yang sedang dimainkan ketika halaman di-refresh, tanpa kembali ke dashboard utama.',
    changes: [
      'Menyimpan tampilan aktif (activeView) per NIM di localStorage sehingga refresh di tengah kuis atau permainan tetap membuka permainan tersebut.',
      'Menyimpan ID ruangan aktif pada Monopoli TL16, Sidang Dosen Killer, dan UNO Sedulur 16 agar pemain otomatis masuk kembali ke ruangannya setelah refresh.',
      'Membersihkan status ruangan secara otomatis saat pemain menekan tombol Keluar atau kembali ke beranda.'
    ],
    docs: {
      files: ['src/components/GameDashboard.jsx', 'src/components/MonopoliBoard.jsx', 'src/components/DosenKillerGame.jsx', 'src/components/UnoBrutalGame.jsx'],
      notes: 'Menggunakan key active_view_{nim}, monopoli_room_{nim}, dk_room_{nim}, dan uno_room_{nim} di localStorage dengan validasi status ruangan ke Supabase saat komponen dimuat.'
    }
  },
  {
    id: 'upd-013',
    date: '17 November 2026',
    version: 'v2.4.4',
    category: 'Desain & UI',
    title: 'Animasi Kocokan 2 Dadu Bergoyang pada Monopoli TL16',
    commit: 'latest',
    summary: 'Menambahkan animasi kocokan dadu bergoyang dengan tampilan mata dadu (1-6 titik) di panel tengah papan saat pemain melempar dadu.',
    changes: [
      'Menampilkan 2 dadu bergoyang dan berputar cepat di panel tengah papan selama proses pengacakan (isRolling).',
      'Mengganti kotak angka dadu saat melangkah dengan komponen dadu bertitik (MonopoliDice) yang lebih ekspresif.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Menggunakan komponen MonopoliDice berbasis grid 3x3 pips dan state rollTick untuk animasi goyangan bolak-balik.'
    }
  },
  {
    id: 'upd-012',
    date: '17 November 2026',
    version: 'v2.4.3',
    category: 'Fitur Baru',
    title: 'Pembersihan Otomatis Riwayat Ruangan Monopoli Setelah 30 Menit',
    commit: 'latest',
    summary: 'Menghapus data riwayat permainan Monopoli yang telah selesai setelah 30 menit tanpa menghapus perolehan poin pemain di klasemen.',
    changes: [
      'Menghapus otomatis data ruangan, posisi pemain, dan kepemilikan properti di tabel monopoli_rooms, monopoli_players, dan monopoli_properties 30 menit setelah permainan selesai.',
      'Menjaga skor kemenangan tetap tersimpan permanen pada alumni.skor_monopoli dan monopoli_users.points.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Menggunakan fungsi cleanupExpiredFinishedRooms saat lobi dibuka/disegarkan serta timer 30 menit pada layar hasil akhir (appState === result).'
    }
  },
  {
    id: 'upd-011',
    date: '17 November 2026',
    version: 'v2.4.2',
    category: 'Fitur Baru',
    title: 'Daftar Ruangan Aktif di Lobi Monopoli TL16',
    commit: 'latest',
    summary: 'Menambahkan daftar ruangan Monopoli yang sedang aktif langsung di halaman lobi agar pemain bisa bergabung dengan satu klik tanpa mengetik kode manual.',
    changes: [
      'Menampilkan daftar ruangan aktif (status Menunggu atau Sedang Bermain dalam 1 jam terakhir) beserta jumlah pemain (maks 6) dan nama peserta.',
      'Menyediakan tombol Gabung/Lanjutkan langsung dan tombol Segarkan (serta pembaruan otomatis tiap 6 detik).'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Mengambil data dari tabel monopoli_rooms dengan filter last_active >= 1 jam terakhir dan menggabungkan jumlah peserta dari monopoli_players.'
    }
  },
  {
    id: 'upd-010',
    date: '17 November 2026',
    version: 'v2.4.1',
    category: 'Desain & UI',
    title: 'Tata Letak Responsif Papan Monopoli (HP & Laptop) serta Kerapian Header',
    commit: 'latest',
    summary: 'Memperbesar papan Monopoli agar jelas terbaca di laptop (2 kolom dengan panel kontrol di kanan), meningkatkan zoom papan di HP, dan merapikan tombol navigasi header.',
    changes: [
      'Mengubah tampilan Monopoli di layar laptop/desktop menjadi 2 kolom: papan besar di kiri (~720px) dengan teks & harga petak jelas, dan panel saldo/dadu/detail petak di kanan.',
      'Menampilkan indikator posisi pemain saat ini dan saldo seluruh pemain langsung di panel tengah papan.',
      'Menambah kontras label EVENT, PAJAK, dan ToD pada petak serta fitur Perbesar Papan (700px) di layar HP.',
      'Merapikan bar navigasi header Beranda agar tombol Jadwal Acara, Catatan Update, Ruang Panitia, dan Keluar sejajar rapi dalam satu baris.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx', 'src/components/GameDashboard.jsx', 'src/components/RoadmapModal.jsx'],
      notes: 'Menggunakan CSS Grid 12-kolom (8 kolom papan + 4 kolom kontrol sticky) pada breakpoint lg: serta overflow-x-auto saat mode perbesar diaktifkan di ponsel.'
    }
  },
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
