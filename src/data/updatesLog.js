export const UPDATES_LOG = [
  {
    id: 'upd-033',
    date: '20 November 2026',
    version: 'v2.9.2',
    category: 'Fitur Baru',
    title: 'Tombol Batalkan/Keluar Ruangan & Halaman Status Ruangan Multiplayer',
    commit: 'latest',
    summary: 'Menambahkan tombol Batalkan atau Keluar Ruangan di seluruh ruang tunggu multiplayer serta halaman khusus saat ruangan tidak ditemukan, sudah selesai, kedaluwarsa, penuh, atau dibatalkan.',
    changes: [
      'Membuat komponen RoomStatusScreen.jsx untuk menampilkan status ruangan secara jelas (tidak ditemukan, permainan selesai, kedaluwarsa, sedang berlangsung, penuh, atau dibatalkan) lengkap dengan tombol kembali ke lobi dan beranda.',
      'Menambahkan tombol Batalkan Ruangan / Keluar dari Ruangan pada ruang tunggu MonopoliBoard.jsx, DosenKillerGame.jsx, UnoBrutalGame.jsx, dan MagicalAthleteGame.jsx yang otomatis menghapus ruangan kosong saat pemain terakhir keluar.',
      'Menghubungkan pengecekan masuk ruangan dan sinkronisasi ruangan di seluruh permainan multiplayer agar menampilkan RoomStatusScreen menggantikan dialog alert bawaan browser.'
    ],
    docs: {
      files: [
        'src/components/RoomStatusScreen.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx'
      ],
      notes: 'Jika pembuat ruangan membatalkan sesi sebelum permainan dimulai, pemain lain yang masih berada di ruang tunggu atau membuka tautan undangan lama otomatis diarahkan ke layar status ruangan dibatalkan/tidak ditemukan.'
    }
  },
  {
    id: 'upd-032',
    date: '20 November 2026',
    version: 'v2.9.1',
    category: 'Perbaikan Bug',
    title: 'Penyelarasan Urutan Seri Gelar Rekor Bidang dengan Podium #1',
    commit: 'latest',
    summary: 'Menyamakan aturan pemecah seri pada Gelar Pemegang Rekor Bidang dengan urutan Podium klasemen agar nama pemegang gelar utama selalu cocok dengan Peringkat #1 bidang tersebut.',
    changes: [
      'Menambahkan pengurutan pemecah seri (total skor tertinggi lalu NIM terkecil) pada computeCategoryAwards di ScoreBoard.jsx sehingga daftar pemegang skor seri tidak lagi mengikuti urutan acak dari database.'
    ],
    docs: {
      files: [
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Saat beberapa alumni memiliki skor tertinggi yang sama di satu bidang, nama pertama di strip Gelar Pemegang Rekor Bidang kini identik dengan Peringkat #1 di Podium.'
    }
  },
  {
    id: 'upd-031',
    date: '20 November 2026',
    version: 'v2.9.0',
    category: 'Fitur Baru',
    title: 'Link Undangan Ruangan Multiplayer & Gelar Pemegang Rekor Klasemen',
    commit: 'latest',
    summary: 'Menambahkan tombol Salin Link Undangan (?join=...) di ruang tunggu multiplayer agar teman langsung masuk ke ruangan tanpa mengetik kode, serta sorotan Gelar Pemegang Rekor Bidang otomatis di papan klasemen.',
    changes: [
      'Membuat modul roomInvite.js dan komponen InviteLinkButton.jsx untuk menghasilkan dan menyalin tautan undangan ruangan (?join=...) dengan fallback clipboard untuk browser HP.',
      'Menambahkan penangkapan parameter ?join=... di GameDashboard.jsx (tersimpan melewati layar masuk) dan gabung ruangan otomatis di MonopoliBoard.jsx, DosenKillerGame.jsx, UnoBrutalGame.jsx, serta MagicalAthleteGame.jsx sesuai jadwal akses masing-masing mode.',
      'Menambahkan strip Gelar Pemegang Rekor Bidang otomatis di ScoreBoard.jsx (Paling Hafal Jogja, Paling Hafal Wajah Angkatan, dan gelar mode lain saat sudah terbuka) yang langsung mengurutkan klasemen ke kategori terkait saat diklik.'
    ],
    docs: {
      files: [
        'src/lib/roomInvite.js',
        'src/components/InviteLinkButton.jsx',
        'src/components/GameDashboard.jsx',
        'src/components/ScoreBoard.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx'
      ],
      notes: 'Tautan undangan tetap memeriksa jadwal rilis publik atau akses uji coba sebelum membuka permainan, dan gelar rekor baru tampil saat papan klasemen sudah dibuka dan skor tertinggi lebih dari nol.'
    }
  },
  {
    id: 'upd-030',
    date: '19 November 2026',
    version: 'v2.8.2',
    category: 'Perbaikan Bug',
    title: 'Sinkronisasi Tombol Back HP & Browser ke Menu Sebelumnya',
    commit: 'latest',
    summary: 'Menghubungkan perpindahan menu permainan dan editor karakter ke Browser History API agar menekan tombol Back di HP kembali ke beranda aplikasi, bukan langsung keluar ke beranda browser.',
    changes: [
      'Menambahkan helper navigateToView, openAvatarEditor, closeAvatarEditor, dan listener popstate di GameDashboard.jsx menggunakan window.history.pushState dan replaceState.',
      'Menancapkan entri dasar dashboard saat sesi dimuat ulang di sub-halaman sehingga tombol Back HP tetap mengarahkan kembali ke beranda perayaan.'
    ],
    docs: {
      files: [
        'src/components/GameDashboard.jsx'
      ],
      notes: 'Tombol kembali di layar aplikasi juga memakai history.back() saat entri riwayat tersedia agar tumpukan riwayat browser tetap bersih.'
    }
  },
  {
    id: 'upd-029',
    date: '19 November 2026',
    version: 'v2.8.1',
    category: 'Desain & UI',
    title: 'Sensor Mode Belum Rilis & Rincian 2 Baris pada Poster IG Story',
    commit: 'latest',
    summary: 'Memastikan poster IG Story selalu menyensor mode yang belum memasuki jadwal rilis publik (termasuk saat dibagikan oleh akun admin) dan menyusun rincian skor ke 2 baris agar tidak terpotong titik-titik.',
    changes: [
      'Memisahkan status pembukaan jadwal publik di ScoreBoard.jsx agar poster IG Story selalu menampilkan blok hitam detektif pada mode yang belum dirilis meski dibuat dari sesi admin.',
      'Menambahkan tata letak rincian skor 2 baris terpusat di storyCardGenerator.js sehingga 4 rincian permainan tampil utuh tanpa terpotong elipsis (...).'
    ],
    docs: {
      files: [
        'src/lib/storyCardGenerator.js',
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Poster IG Story selalu mengikuti jadwal rilis publik dan visibilitas papan klasemen agar tangkapan layar atau unduhan Story dari perangkat panitia tetap aman dibagikan ke media sosial.'
    }
  },
  {
    id: 'upd-028',
    date: '19 November 2026',
    version: 'v2.8.0',
    category: 'Fitur Baru',
    title: 'Poster IG Story 9:16 untuk Klasemen, Kuis Solo, & Sesi Multiplayer',
    commit: 'latest',
    summary: 'Menambahkan generator poster vertikal 1080x1920 bergaya Kertas Kenangan yang bisa langsung dibagikan ke Instagram Story via Web Share API di HP atau diunduh otomatis sebagai PNG.',
    changes: [
      'Membuat modul avatarCanvas.js, storyCardGenerator.js, dan komponen StoryShareButton.jsx untuk menggambar kartu Story 9:16 lengkap dengan logo Asset 2.webp, avatar Canvas2D peserta, dan ruang aman UI Instagram.',
      'Menambahkan tombol Bagikan ke Story pada ScoreBoard.jsx, FaceGame.jsx, dan TreasureHunt.jsx dengan blok Persaingan Terdekat (1 peserta di atas dan 1 di bawah beserta selisih skor, otomatis tersensor blok hitam saat klasemen masih dirahasiakan).',
      'Menambahkan tombol Bagikan Hasil Sesi pada layar akhir Monopoli TL16, Dosen Killer, UNO Seru TL16, dan Magical Athlete TL16 yang menampilkan daftar seluruh peserta dalam satu sesi ruangan.'
    ],
    docs: {
      files: [
        'src/lib/avatarCanvas.js',
        'src/lib/storyCardGenerator.js',
        'src/components/StoryShareButton.jsx',
        'src/components/PlayerAvatar.jsx',
        'src/components/ScoreBoard.jsx',
        'src/components/FaceGame.jsx',
        'src/components/TreasureHunt.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx'
      ],
      notes: 'Menggunakan Web Share API (navigator.share dengan berkas PNG) di browser ponsel yang mendukung dan jatuh otomatis ke unduhan PNG pada laptop atau browser dalam aplikasi.'
    }
  },
  {
    id: 'upd-027',
    date: '19 November 2026',
    version: 'v2.7.3',
    category: 'Desain & UI',
    title: 'Penyesuaian Proporsi Tangga Podium 3 Besar Klasemen',
    commit: 'latest',
    summary: 'Memastikan kartu peringkat #1 pada papan klasemen selalu lebih tinggi dan menonjol dibanding #2 dan #3 walaupun panjang nama peserta berbeda baris.',
    changes: [
      'Menetapkan tinggi minimum bertingkat pada kartu podium desktop (#1 tertinggi, disusul #2 lalu #3) serta memperbesar avatar dan ukuran skor peringkat #1.',
      'Menyamakan ruang blok nama (min-h-[2.75rem]) dan meratakan tengah rincian poin di kartu podium ScoreBoard.jsx agar tata letak tetap simetris saat nama panjang membungkus ke 2 baris.'
    ],
    docs: {
      files: [
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Tinggi minimum hanya berlaku pada breakpoint md ke atas sehingga kartu podium di layar HP tetap ringkas mengikuti isi.'
    }
  },
  {
    id: 'upd-026',
    date: '19 November 2026',
    version: 'v2.7.2',
    category: 'Perbaikan Bug',
    title: 'Perbaikan Tombol Kembali ke Beranda & Audit Navigasi Seluruh Permainan',
    commit: 'latest',
    summary: 'Memperbaiki tombol Kembali ke Beranda yang sebelumnya kembali masuk ke halaman kuis terakhir karena active_view di localStorage tidak dibersihkan, serta melengkapi tombol keluar pada layar selesai.',
    changes: [
      'Menyalurkan prop onBack dari GameDashboard.jsx ke seluruh sub-tampilan permainan agar tombol kembali langsung menutup permainan dan mengosongkan active_view tanpa muat ulang penuh.',
      'Memperbaiki tombol Kembali ke Beranda dan Main Ulang pada FaceGame.jsx serta TreasureHunt.jsx agar kembali ke beranda dengan bersih dan mengulang kuis tanpa reload halaman.',
      'Memperbaiki tautan kembali pada UpdatesPage.jsx dan Magical Athlete TL16 agar menghapus active_view tersimpan, serta menambahkan tombol Kembali ke Beranda bagi semua peserta di layar selesai Dosen Killer.'
    ],
    docs: {
      files: [
        'src/components/GameDashboard.jsx',
        'src/components/FaceGame.jsx',
        'src/components/TreasureHunt.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/MagicalAthleteGame.jsx',
        'src/components/UpdatesPage.jsx'
      ],
      notes: 'Seluruh tombol tanpa handler dan tautan <a href="/"> pada komponen telah diaudit agar tidak terjebak pada active_view sebelumnya.'
    }
  },
  {
    id: 'upd-025',
    date: '19 November 2026',
    version: 'v2.7.1',
    category: 'Perbaikan Bug',
    title: 'Proteksi Warna Avatar pada Mode Gelap HP (Canvas2D Path2D)',
    commit: '2a07fd4',
    summary: 'Memperbaiki warna avatar karakter yang berubah pudar atau terbalik saat dibuka di ponsel dengan fitur Force Dark aktif, sekaligus mengunci skema warna dokumen ke only light.',
    changes: [
      'Menambahkan meta color-scheme only light pada shell halaman dan aturan CSS color-scheme: only light di global.css agar browser standar mempertahankan tema kertas hangat.',
      'Mengubah PlayerAvatar.jsx agar menggambar seluruh path SVG langsung secara sinkron ke CanvasRenderingContext2D memakai Path2D dan DOMMatrix (tanpa data:image/svg+xml atau SVGImage), sehingga mesin Force Dark HP tidak membalik warna rambut, mata, kerah, maupun latar avatar.',
      'Mempertegas garis outline karakter ke #111318 di avatarHelper.js, menambahkan cache offscreen canvas 320x320, dan memberi ring pembatas tipis .avatar-photo-lock saat prefers-color-scheme: dark aktif.'
    ],
    docs: {
      files: [
        'src/components/PlayerAvatar.jsx',
        'src/lib/avatarHelper.js',
        'src/styles/global.css',
        'src/layouts/Layout.astro',
        'src/pages/index.astro',
        'src/pages/updates.astro',
        'src/pages/lock/magical-athlete.astro'
      ],
      notes: 'Pemisahan render langsung ke Canvas2D menghilangkan tahap decoding SVGImage yang sebelumnya membalik warna stroke dan latar biru muda sebelum disalin ke canvas.'
    }
  },
  {
    id: 'upd-024',
    date: '19 November 2026',
    version: 'v2.7.0',
    category: 'Desain & UI',
    title: 'Pembaruan Tampilan Papan Skor dengan Podium 3 Besar & Filter Kategori',
    commit: 'e032cba',
    summary: 'Merombak papan Klasemen Sedulur 16 agar memiliki panggung podium untuk tiga peringkat teratas, ringkasan posisi pengguna, tab urutan per permainan, dan batang rasio skor.',
    changes: [
      'Memisahkan peringkat #1, #2, dan #3 ke kartu podium khusus dengan penekanan aksen emas hangat dan mahkota SVG untuk posisi teratas serta tata letak responsif ponsel hingga desktop.',
      'Menambahkan kartu ringkasan posisi pengguna aktif, penanda badge Kamu, dan tombol Lihat Barisku untuk melompat langsung ke baris peringkat sendiri.',
      'Menambahkan tab urutan kategori (Total Skor, Peta, Foto, serta Monopoli dan Dosen Killer saat jadwalnya terbuka), pencarian nama/NIM saat klasemen sudah dibuka, sensor blok hitam saat nama masih rahasia, dan batang rasio poin di tiap baris #4 ke bawah.'
    ],
    docs: {
      files: [
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Pencarian hanya aktif ketika klasemen sudah dibuka agar peserta tidak dapat menebak nama tersembunyi sebelum jadwal pembukaan panitia.'
    }
  },
  {
    id: 'upd-023',
    date: '19 November 2026',
    version: 'v2.6.2',
    category: 'Desain & UI',
    title: 'Sensor Blok Hitam Detektif pada Catatan Pembaruan & File Terkait',
    commit: '22b9b11',
    summary: 'Menampilkan seluruh catatan pembaruan publik dengan sensor blok hitam bergaya berkas detektif untuk mode, mekanik, dan berkas yang masih dirahasiakan.',
    changes: [
      'Menampilkan entri v2.6.1 secara publik di halaman /updates dengan blok sensor hitam otomatis pada istilah mode dan mekanik yang belum memasuki tanggal rilis.',
      'Menyensor nama berkas yang masih terkunci pada bagian File Terkait di UpdatesPage.jsx sebagai badge blok hitam penuh tanpa membocorkan jalur file.'
    ],
    docs: {
      files: [
        'src/components/UpdatesPage.jsx',
        'src/data/updatesLog.js'
      ],
      notes: 'Aturan sensor membaca status jadwal pembukaan dari app_settings secara dinamis sehingga blok hitam otomatis terbuka saat mode dirilis.'
    }
  },
  {
    id: 'upd-022',
    date: '19 November 2026',
    version: 'v2.6.1',
    category: 'Perbaikan Bug',
    title: 'Audit Mekanik & Integrasi Mode Terjadwal ke Arena Main Bareng',
    commit: '2707592',
    summary: 'Menutup celah aturan permainan pada mode Dosen Killer, Monopoli TL16, UNO Seru TL16, Wheel of Family, dan Magical Athlete TL16 serta menampilkan mode keempat di Arena Main Bareng.',
    changes: [
      'Dosen Killer & LayarVoting: mengecek kemenangan segera setelah fase malam, menandai pemain telat masuk sebagai penonton, memblokir vote ke NIM sendiri, dan membuka tombol mulai untuk koordinator pengganti.',
      'Monopoli TL16: menambah jeda 6 detik antar lemparan dadu, mengunci lemparan saat modal aksi masih terbuka, mencegah bonus ganda START saat kartu KE_START keluar, serta memakai compare-and-swap untuk kas sewa dan skor.',
      'UNO Seru TL16 & Magical Athlete: menambah pemilih 4 warna untuk kartu Titip Absen, memindahkan giliran otomatis saat pemain keluar meja, membaca ref terbaru selama animasi langkah, dan membatasi giliran bonus beruntun.',
      'Wheel of Family & GameDashboard: menyaring alumni yang sudah pernah menang dari putaran berikutnya dan menampilkan Magical Athlete TL16 di baris #04 Arena Main Bareng.'
    ],
    docs: {
      files: [
        'src/components/DosenKillerGame.jsx',
        'src/components/LayarVoting.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx',
        'src/components/WheelOfFamily.jsx',
        'src/components/GameDashboard.jsx'
      ],
      notes: 'Perbaikan ini menjaga alur permainan Dosen Killer, Monopoli TL16, UNO Seru TL16, Wheel of Family, dan Magical Athlete TL16 tetap konsisten di semua kondisi koneksi.'
    }
  },
  {
    id: 'upd-021',
    date: '19 November 2026',
    version: 'v2.6.0',
    category: 'Perbaikan Bug',
    title: 'Ketahanan Koneksi Ruangan & Perbaikan Audit Logika Permainan',
    commit: 'f473a70',
    summary: 'Memasang pengalihan kendali otomatis ketika pembuat ruangan terputus, bot cadangan sementara bagi pemain offline, serta perbaikan penyimpanan skor dan timer kuis.',
    changes: [
      'Menambahkan hook useRoomConnection dengan Supabase Realtime Presence, sinkronisasi ulang otomatis saat jaringan pulih atau tab dibuka kembali, serta polling cadangan tiap 5 detik.',
      'Menambahkan pengambilan alih giliran sementara oleh bot bila pemain terputus beberapa detik, dan menghentikan bot secara otomatis begitu pemain tersebut aktif lagi.',
      'Menjaga skor tertinggi pada FaceGame.jsx dan TreasureHunt.jsx dengan Math.max agar main ulang tidak menghapus nilai sebelumnya di klasemen.',
      'Menyimpan sisa waktu, status terungkap, dan jawaban aktif pada FaceGame.jsx ke localStorage supaya muat ulang halaman tidak mengulang timer ke 60 detik.'
    ],
    docs: {
      files: [
        'src/lib/useRoomConnection.js',
        'src/components/FaceGame.jsx',
        'src/components/TreasureHunt.jsx',
        'src/components/GameDashboard.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/LayarVoting.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx',
        'src/components/WheelOfFamily.jsx'
      ],
      notes: 'Pemilihan pengendali pengganti memakai fungsi deterministik pickActiveCoordinator agar seluruh perangkat di ruangan memilih koordinator yang sama tanpa bentrok.'
    }
  },
  {
    id: 'upd-020',
    date: '18 November 2026',
    version: 'v2.5.3',
    category: 'Keamanan & Akses',
    title: 'Proteksi Global Anti-F12 & Anti Inspect Element',
    commit: '43d2c73',
    summary: 'Mengaktifkan pengamanan menyeluruh pada seluruh halaman untuk memblokir pintasan Developer Tools (F12), menu klik kanan Inspect Element, dan peninjauan kode sumber.',
    changes: [
      'Memblokir klik kanan (menu konteks Inspect Element), tombol F12, kombinasi DevTools (Ctrl+Shift+I/J/C/K/E dan Cmd+Option+I/J/C/K/U), serta pintasan Ctrl+U / Ctrl+S pada fase capture di seluruh rute portal.',
      'Menambahkan komponen global InspectGuard yang aktif di Beranda (/), Catatan Update (/updates), halaman permainan, maupun Layout dasar.',
      'Menyediakan layar pengaman otomatis bila sesi pemeriksaan/debugger aktif melalui menu peramban, serta mengunci sourcemap: false pada build Vite.'
    ],
    docs: {
      files: [
        'src/components/InspectGuard.astro',
        'src/pages/index.astro',
        'src/pages/updates.astro',
        'src/pages/lock/magical-athlete.astro',
        'src/layouts/Layout.astro',
        'astro.config.mjs'
      ],
      notes: 'Skrip pengaman dimuat secara inline sebelum hidrasi React sehingga pintasan inspeksi diblokir di seluruh lapisan aplikasi sejak awal halaman terbuka.'
    }
  },
  {
    id: 'upd-019',
    requiresMode: 'adminOnly',
    date: '18 November 2026',
    version: 'v2.5.2',
    category: 'Keamanan & Akses',
    title: 'Penyensoran Menyeluruh Seluruh Mode Permainan yang Belum Rilis',
    commit: '3a41321',
    summary: 'Memperluas sistem sensor blok hitam ala berkas kasus detektif agar tidak satu pun mode yang belum memasuki tanggal rilis (Monopoli TL16, Dosen Killer, UNO Seru TL16, Wheel of Family, dan Magical Athlete) bocor di halaman publik.',
    changes: [
      'Menyensor frasa penuh "bidak Monopoli" pada panggung pratinjau dan panel kontrol AvatarDesigner hingga tanggal rilis tiba.',
      'Menyensor nama seluruh agenda dan mode permainan belum rilis (Monopoli TL16, Dosen Killer, UNO Seru TL16, dan Wheel of Family) pada Beranda, Jadwal Acara, dan rincian poin Klasemen mengikuti tanggal pembukaan di app_settings.',
      'Menerapkan penyensoran otomatis RedactedText pada halaman Catatan Update (/updates) untuk judul, ringkasan, daftar perubahan, catatan teknis, hingga path file mode yang masih terkunci.'
    ],
    docs: {
      files: [
        'src/components/RedactedText.jsx',
        'src/components/AvatarDesigner.jsx',
        'src/components/GameDashboard.jsx',
        'src/components/RoadmapModal.jsx',
        'src/components/ScoreBoard.jsx',
        'src/components/UpdatesPage.jsx',
        'src/data/updatesLog.js'
      ],
      notes: 'Halaman statis /updates dan seluruh komponen UI mengacu pada tanggal rilis app_settings di Supabase dengan status awal terkunci (revealed=false), sehingga DOM publik bebas dari bocoran nama mode yang belum tayang.'
    }
  },
  {
    id: 'upd-018',
    date: '18 November 2026',
    version: 'v2.5.1',
    category: 'Desain & UI',
    title: 'Penyempurnaan Antarmuka Anti-Slop & Sensor Kasus Detektif Monopoli',
    commit: '4604319',
    summary: 'Menyelaraskan seluruh halaman ke desain editorial kertas hangat (Bricolage Grotesque & Public Sans) sesuai audit antislop/impeccable dan menyensor label Monopoli sebelum jadwal buka tiba.',
    changes: [
      'Menghilangkan gradasi latar belakang, header kaca blur, bayangan kartu bertumpuk, dan eyebrow pill pada Login, AvatarDesigner, GameDashboard, dan ScoreBoard.',
      'Mengganti kartu grid seragam dengan komposisi editorial yang bervariasi antara pembagian 2 kolom kuis solo dan daftar indeks bernomor pada permainan multipemain.',
      'Menambahkan komponen RedactedText yang menampilkan blok sensor hitam ala berkas kasus detektif untuk menyembunyikan nama Monopoli di AvatarDesigner, Beranda, dan Jadwal Acara sebelum tanggal pembukaan tiba.',
      'Memperbaiki kontras tombol disabled pada Login dan MonopoliBoard sehingga lulus pemeriksaan detector tanpa temuan.'
    ],
    docs: {
      files: [
        'src/components/RedactedText.jsx',
        'src/components/AvatarDesigner.jsx',
        'src/components/GameDashboard.jsx',
        'src/components/RoadmapModal.jsx',
        'src/components/Login.jsx',
        'src/components/ScoreBoard.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/styles/global.css'
      ],
      notes: 'RedactedText tidak merender kata rahasia ke DOM saat revealed=false sehingga aman dari seleksi teks maupun inspeksi cepat.'
    }
  },
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
    requiresMode: 'monopoli',
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
    requiresMode: 'monopoli',
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
    requiresMode: 'monopoli',
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
    requiresMode: 'monopoli',
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
    requiresMode: 'monopoli',
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
    requiresMode: 'monopoli',
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
    requiresMode: 'athlete',
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
    requiresMode: 'monopoli',
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
