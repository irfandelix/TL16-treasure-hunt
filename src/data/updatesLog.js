export const UPDATES_LOG = [
  {
    id: 'upd-047',
    date: '22 November 2026',
    version: 'v2.9.16',
    category: 'Tampilan',
    title: 'Gerak Karakter Fisika Ala Video Game Pada Magical Athlete TL16',
    commit: 'latest',
    summary: 'Mengganti animasi mengambang standar pada Magical Athlete TL16 dengan 7 profil gerak natural ala video game (squash-stretch, bayangan tanah tersinkron, lompatan jurus saat diketuk, serta pantulan aktif di papan lintasan).',
    changes: [
      'Menambahkan 7 profil gerak khusus sesuai karakter masing-masing tokoh (hop memantul, selancar air, hentakan berat, getar mesin truk, nyala api, goyang slime, dan getar sesar/batu) lengkap dengan pendaratan gravitasi dan bayangan tanah tersinkron.',
      'Menjadikan maskot di dalam pop-up bisa diketuk langsung untuk memicu gerakan aksi lompatan dan percikan partikel berwarna sesuai karakter.',
      'Menambahkan animasi pantulan siap gerak pada bidak pelari yang sedang mendapat giliran di lintasan 24 petak.'
    ],
    docs: {
      files: [
        'src/data/athleteCharacters.js',
        'src/components/MagicalAthleteGame.jsx',
        'src/styles/global.css'
      ],
      notes: 'Seluruh animasi tetap otomatis dinonaktifkan ketika perangkat mengaktifkan preferensi prefers-reduced-motion.'
    }
  },
  {
    id: 'upd-046',
    date: '22 November 2026',
    version: 'v2.9.15',
    category: 'Tampilan',
    title: 'Pop-Up Interaktif & Animasi Detail 16 Karakter Magical Athlete TL16',
    commit: 'latest',
    summary: 'Daftar 16 tokoh di lobi Magical Athlete TL16 kini bisa diklik untuk membuka pop-up detail beranimasi lengkap dengan tampilan maskot besar, tipe peran, dan navigasi antar tokoh.',
    changes: [
      'Menambahkan efek hover dan klik interaktif pada setiap kartu tokoh di daftar 16 karakter lobi Magical Athlete TL16.',
      'Menambahkan modal pop-up beranimasi spring dan melayang halus untuk melihat maskot besar, divisi, tipe peran, serta deskripsi jurus tiap tokoh.',
      'Menambahkan tombol Sebelumnya/Berikutnya serta pintasan keyboard panah kiri/kanan dan Escape untuk berpindah atau menutup pop-up.'
    ],
    docs: {
      files: [
        'src/components/MagicalAthleteGame.jsx',
        'src/styles/global.css'
      ],
      notes: 'Seluruh animasi pop-up dan maskot otomatis dimatikan bila perangkat memakai pengaturan prefers-reduced-motion.'
    }
  },
  {
    id: 'upd-045',
    date: '22 November 2026',
    version: 'v2.9.14',
    category: 'Tampilan',
    title: 'Ilustrasi 16 Karakter Khusus Pada Magical Athlete TL16',
    commit: 'latest',
    summary: 'Menambahkan 16 ilustrasi maskot khusus bertema Teknik Lingkungan dan Geologi pada Magical Athlete TL16 agar pemain lebih mudah mengenali dan memilih tokoh saat bursa draft maupun balapan.',
    changes: [
      'Menambahkan 16 gambar maskot transparan pada daftar 16 tokoh di halaman lobi Magical Athlete TL16.',
      'Menampilkan ilustrasi karakter yang sama di kartu bursa draft, daftar tokoh terpilih tiap pemain, layar pilihan rahasia tiap ronde, kartu status pemain, penanda giliran dadu, serta bidak pelari di papan lintasan.'
    ],
    docs: {
      files: [
        'src/data/athleteCharacters.js',
        'src/components/MagicalAthleteGame.jsx',
        'public/games/athletes/*.webp',
        'src/components/UpdatesPage.jsx'
      ],
      notes: 'Setiap gambar maskot memakai format WebP ringan berukuran sekitar 11-19 KB dengan lazy loading.'
    }
  },
  {
    id: 'upd-044',
    date: '22 November 2026',
    version: 'v2.9.13',
    category: 'Tampilan',
    title: 'Halaman Persiapan Untuk Seluruh Permainan Yang Akan Hadir',
    commit: 'latest',
    summary: 'Melengkapi halaman persiapan bergambar ilustrasi khusus sebelum masuk ke ruang permainan pada Monopoli TL16, Sidang Dosen Killer, UNO Sedulur 16, Magical Athlete TL16, dan Wheel of Family.',
    changes: [
      'Menambahkan layar persiapan berisi ilustrasi permainan, ringkasan aturan, dan poin kemenangan pada Monopoli TL16, Sidang Dosen Killer, UNO Sedulur 16, Magical Athlete TL16, serta Wheel of Family.',
      'Menyiapkan ilustrasi khusus Wheel of Family agar seluruh 7 aktivitas reuni memakai tampilan persiapan yang seragam.',
      'Melewati layar persiapan secara otomatis saat pemain langsung bergabung lewat link undangan ruangan teman agar tidak menghambat proses gabung.'
    ],
    docs: {
      files: [
        'src/components/MonopoliBoard.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx',
        'src/components/WheelOfFamily.jsx',
        'public/games/wheel-of-family.webp',
        'src/components/UpdatesPage.jsx'
      ],
      notes: 'Seluruh nama permainan yang belum terbuka untuk alumni tetap disensor otomatis pada catatan pembaruan ini sampai jadwal rilisnya tiba.'
    }
  },
  {
    id: 'upd-043',
    date: '22 November 2026',
    version: 'v2.9.12',
    category: 'Tampilan',
    title: 'Halaman Persiapan Sebelum Bermain Napak Tilas & Tebak Foto',
    commit: 'latest',
    summary: 'Sebelum masuk ke peta Napak Tilas atau kuis Tebak Muka Blur, kini tampil layar persiapan lengkap dengan ilustrasi khusus, langkah bermain, dan tabel hitungan poin.',
    changes: [
      'Menambahkan layar persiapan sebelum bermain pada Digital Treasure Hunt dan Tebak Muka Blur lengkap dengan ilustrasi vektor baru dan ringkasan poin.',
      'Menahan hitungan mundur 60 detik pada Tebak Muka Blur selama berada di layar persiapan agar waktu baru berjalan saat pemain menekan tombol mulai.',
      'Menampilkan info sesi tersimpan pada layar persiapan bila pemain melanjutkan permainan yang sempat dijeda.'
    ],
    docs: {
      files: [
        'src/components/SoloGamePrepScreen.jsx',
        'src/components/TreasureHunt.jsx',
        'src/components/FaceGame.jsx',
        'public/games/treasure-hunt.webp',
        'public/games/tebak-wajah.webp'
      ],
      notes: 'Jika 20 soal sudah selesai dikerjakan, halaman tetap langsung menampilkan layar skor akhir dan tombol bagikan ke IG Story.'
    }
  },
  {
    id: 'upd-042',
    date: '22 November 2026',
    version: 'v2.9.11',
    category: 'Fitur Baru',
    title: 'Pop-Up Kejutan Coming Soon 4 Permainan Baru & Kontrol Tahap Panitia',
    commit: 'latest',
    summary: 'Menambahkan banner pemicu di beranda yang membuka pop-up ledakan Coming Soon untuk 4 permainan bersama (Monopoli TL16, Dosen Killer, UNO Seru TL16, dan Magical Athlete TL16) secara bertahap.',
    changes: [
      'Menambahkan banner pemicu tepat di bawah Tombol Misteri yang membuka pop-up ledakan konfeti dengan 4 permainan menyebar mengelilingi stiker Coming Soon.',
      'Mendukung 3 tahap kemunculan bertahap: segel misterius, siluet mengintip beranimasi dengan tanggal rilis di bawah sensor judul, hingga terbuka penuh saat waktunya tiba.',
      'Menambahkan pengaturan jadwal rilis Magical Athlete TL16 serta tombol paksa tahap (Otomatis, Misterius, Mengintip, Terbuka) per permainan di Ruang Panitia.'
    ],
    docs: {
      files: [
        'src/components/ComingSoonExplosion.jsx',
        'src/components/GameDashboard.jsx',
        'src/components/AdminDashboard.jsx',
        'src/lib/earlyAccess.js',
        'src/styles/global.css',
        'public/games/monopoli.webp',
        'public/games/dosen-killer.webp',
        'public/games/uno.webp',
        'public/games/magical-athlete.webp'
      ],
      notes: 'Begitu keempat permainan sudah terbuka untuk seluruh alumni, banner Coming Soon otomatis hilang karena semuanya sudah tampil di daftar Arena Main Bareng.'
    }
  },
  {
    id: 'upd-041',
    date: '21 November 2026',
    version: 'v2.9.10',
    category: 'Perbaikan',
    title: 'Perbaikan Pilihan & Tampilan Ekspresi Mulut Karakter',
    commit: 'latest',
    summary: 'Label pilihan ekspresi mulut di halaman Desain Karakter kini sesuai dengan bentuk mulut yang ditampilkan, sekaligus mencegah perubahan awal tertimpa saat data profil selesai dimuat.',
    changes: [
      'Menyesuaikan label ekspresi mulut agar sesuai gambarnya (Senyum Tipis, Kaget (O), dan Mencucu) sambil tetap mempertahankan data karakter yang sudah pernah disimpan.',
      'Menambahkan dukungan sudut membulat pada rendering kanvas avatar agar ekspresi mulut Cemas tampil persis seperti ilustrasi aslinya.',
      'Menjaga pilihan karakter yang sedang diubah di editor tidak tertimpa ketika muatan profil awal dari server datang belakangan.'
    ],
    docs: {
      files: [
        'src/lib/avatarHelper.js',
        'src/lib/avatarCanvas.js',
        'src/components/AvatarDesigner.jsx'
      ],
      notes: 'ID internal masing-masing ekspresi tetap dipertahankan sehingga karakter alumni yang sudah tersimpan sebelumnya tidak perlu diatur ulang.'
    }
  },
  {
    id: 'upd-040',
    date: '20 November 2026',
    version: 'v2.9.9',
    category: 'Keamanan',
    title: 'Halaman Pemberitahuan untuk Agenda yang Belum Dibuka',
    commit: 'latest',
    summary: 'Jika seseorang membuka tautan permainan atau agenda yang belum memasuki jadwal rilis resminya, layar kini langsung menampilkan halaman pemberitahuan untuk menunggu tanggal mainnya.',
    changes: [
      'Menambahkan tampilan Akses Dibatasi pada halaman status ruangan lengkap dengan jadwal buka (jika sudah ditentukan) dan tombol kembali ke beranda.',
      'Mengarahkan seluruh tautan undangan atau alamat langsung ke halaman pemberitahuan tersebut apabila jadwal permainan belum dibuka.'
    ],
    docs: {
      files: [
        'src/components/RoomStatusScreen.jsx',
        'src/components/GameDashboard.jsx'
      ],
      notes: 'Nama permainan yang masih dirahasiakan tidak ditampilkan di halaman pemberitahuan ini agar kejutan acara tetap terjaga.'
    }
  },
  {
    id: 'upd-039',
    date: '20 November 2026',
    version: 'v2.9.8',
    category: 'Perbaikan',
    title: 'Perbaikan Tombol Back Browser & Tombol Bagikan Catatan Update',
    commit: 'latest',
    summary: 'Menggunakan alamat tagar (#menu) dan penambatan ulang riwayat agar tombol Back tidak melompati beranda, serta menambahkan tombol Bagikan Halaman di Catatan Update & Dokumentasi.',
    changes: [
      'Menambahkan alamat tagar unik tiap halaman menu agar riwayat browser membedakan beranda dan halaman permainan.',
      'Menambatkan ulang riwayat beranda saat sentuhan atau ketikan pertama setelah halaman dimuat ulang atau dibuka dari tautan undangan.',
      'Menambahkan tombol Bagikan Halaman di bagian atas Catatan Update & Dokumentasi untuk langsung membagikan atau menyalin tautan /updates.'
    ],
    docs: {
      files: [
        'src/components/GameDashboard.jsx',
        'src/components/UpdatesPage.jsx'
      ],
      notes: 'Chrome melewati entri riwayat yang dibuat otomatis tanpa sentuhan pengguna, sehingga penambatan ulang pada interaksi pertama membuat tombol Back kembali ke beranda acara dengan konsisten.'
    }
  },
  {
    id: 'upd-038',
    date: '20 November 2026',
    version: 'v2.9.7',
    category: 'Fitur Baru',
    title: 'Sistem Poin Klasemen untuk UNO Sedulur 16 dan Magical Athlete TL 2016',
    commit: 'latest',
    summary: 'Kemenangan di UNO Sedulur 16 dan Magical Athlete TL 2016 kini ikut menyumbang poin ke papan klasemen, lengkap dengan keterangan hadiah poin di panduan masing-masing permainan.',
    changes: [
      'Menambahkan hadiah +3.000 poin klasemen bagi pemenang meja di UNO Sedulur 16 dan hadiah peringkat (+3.000 / +1.500 / +750 poin) di akhir 4 ronde Magical Athlete TL 2016.',
      'Menambahkan keterangan hadiah poin klasemen pada panduan awal dan layar akhir kedua permainan, sambil tetap mengecualikan sesi uji coba agar klasemen tetap adil.',
      'Menghubungkan skor UNO Sedulur 16 dan Magical Athlete TL 2016 ke total klasemen, tab urutan, dan gelar pemegang rekor bidang saat jadwalnya sudah terbuka.'
    ],
    docs: {
      files: [
        'src/data/scores_uno_athlete_schema.sql',
        'src/lib/earlyAccess.js',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx',
        'src/components/ScoreBoard.jsx',
        'src/components/UpdatesPage.jsx'
      ],
      notes: 'Papan klasemen tetap tampil normal meskipun kolom skor baru belum ditambahkan di server.'
    }
  },
  {
    id: 'upd-037',
    date: '20 November 2026',
    version: 'v2.9.6',
    category: 'Tampilan',
    title: 'Panduan Cara Main Lengkap di Seluruh Permainan Portal',
    commit: 'latest',
    summary: 'Seluruh permainan di portal kini dilengkapi panduan aturan main, isi permainan, dan hitungan poin dalam bahasa sehari-hari supaya semua alumni bisa langsung paham sebelum bermain.',
    changes: [
      'Menambahkan penjelasan aturan dan hadiah poin di halaman masuk Monopoli TL16 serta memperbarui penjelasan aturan di UNO Sedulur 16 agar sesuai mekanik aslinya.',
      'Menambahkan panduan alur, cara menang, dan daftar tokoh di halaman masuk Magical Athlete TL16.',
      'Menambahkan panduan lipat Cara Main & Hitungan Skor pada Napak Tilas Peta dan Tebak Foto Kenangan, serta penjelasan singkat cara kerja Wheel of Family.'
    ],
    docs: {
      files: [
        'src/components/MonopoliBoard.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx',
        'src/components/TreasureHunt.jsx',
        'src/components/FaceGame.jsx',
        'src/components/WheelOfFamily.jsx'
      ],
      notes: 'Seluruh panduan ditulis dengan bahasa yang ringan agar mudah diikuti teman seangkatan yang baru pertama kali mencoba.'
    }
  },
  {
    id: 'upd-036',
    date: '20 November 2026',
    version: 'v2.9.5',
    category: 'Tampilan',
    title: 'Panduan Tokoh dan Cara Main di Halaman Awal Sidang Dosen Killer',
    commit: 'latest',
    summary: 'Menambahkan penjelasan lengkap tentang daftar tokoh, jalannya satu ronde, dan syarat menang langsung di halaman masuk Sidang Dosen Killer memakai bahasa sehari-hari.',
    changes: [
      'Menampilkan pengenalan 5 peran beserta kubu dan tugas masing-masing sebelum pemain membuat atau bergabung ke kelas Sidang Dosen Killer.',
      'Menambahkan ringkasan alur permainan dan syarat menang agar alumni yang baru pertama kali ikut bisa langsung paham.',
      'Menyamakan panduan tokoh di dalam ruang tunggu kelas serta memperbaiki kontras pesan peringatan saat kode kelas kosong.'
    ],
    docs: {
      files: [
        'src/components/DosenKillerGame.jsx'
      ],
      notes: 'Penjelasan tokoh sekarang tampil sejak halaman awal sekaligus di ruang tunggu agar pemain bisa membacanya santai sebelum sesi dimulai.'
    }
  },
  {
    id: 'upd-035',
    date: '20 November 2026',
    version: 'v2.9.4',
    category: 'Tampilan',
    title: 'Bahasa Catatan Update Lebih Ringan dan Mudah Dipahami',
    commit: 'latest',
    summary: 'Seluruh isi halaman Catatan Update dan label kategorinya ditulis ulang memakai bahasa sehari-hari supaya enak dibaca semua alumni tanpa istilah pemrograman.',
    changes: [
      'Menyederhanakan label filter kategori menjadi Fitur Baru, Perbaikan, Tampilan, dan Keamanan.',
      'Menulis ulang judul, ringkasan, dan rincian perubahan di seluruh riwayat pembaruan agar langsung menjelaskan manfaatnya buat pemain.',
      'Mengganti label tombol detail menjadi Lihat Detail Lengkap agar terasa lebih ramah.'
    ],
    docs: {
      files: [
        'src/data/updatesLog.js',
        'src/components/UpdatesPage.jsx'
      ],
      notes: 'Bagian daftar berkas di dalam Detail Lengkap tetap dipertahankan untuk catatan panitia, sementara penjelasannya kini memakai bahasa yang lebih santai.'
    }
  },
  {
    id: 'upd-034',
    date: '20 November 2026',
    version: 'v2.9.3',
    category: 'Fitur Baru',
    title: 'Ruangan yang Sudah Selesai Otomatis Terhapus Setelah 30 Menit',
    commit: 'f8e81b3',
    summary: 'Semua permainan main bareng sekarang otomatis membersihkan ruangan yang sudah selesai setelah 30 menit supaya daftar ruangan tidak menumpuk.',
    changes: [
      'Menyamakan aturan batas waktu 30 menit untuk Monopoli TL16, Dosen Killer, UNO Sedulur 16, dan Magical Athlete TL16.',
      'Selama 30 menit pertama setelah permainan selesai, pemain masih punya waktu melihat hasil akhir dan mengunduh poster cerita.',
      'Jika ada teman yang membuka tautan ruangan lama setelah lewat 30 menit, ruangan langsung dibersihkan dan layar menampilkan keterangan ruangan tidak ditemukan.'
    ],
    docs: {
      files: [
        'src/lib/roomCleanup.js',
        'src/components/MonopoliBoard.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx'
      ],
      notes: 'Pembersihan berjalan otomatis saat pemain membuka ruang lobi atau saat tautan ruangan lama diakses, tanpa mengurangi skor yang sudah masuk ke klasemen.'
    }
  },
  {
    id: 'upd-033',
    date: '20 November 2026',
    version: 'v2.9.2',
    category: 'Fitur Baru',
    title: 'Tombol Batalkan Ruangan dan Layar Status Ruangan',
    commit: '1b1d5a6',
    summary: 'Sekarang kamu bisa membatalkan atau keluar dari ruang tunggu kapan saja, dan ada layar pemberitahuan khusus kalau ruangan tidak ditemukan atau sudah selesai.',
    changes: [
      'Menambahkan tombol Batalkan Ruangan atau Keluar dari Ruangan di ruang tunggu Monopoli TL16, Dosen Killer, UNO Sedulur 16, dan Magical Athlete TL16.',
      'Ruangan yang dibatalkan saat masih kosong langsung dihapus otomatis, jadi kamu tidak lagi terjebak masuk ke ruangan lama.',
      'Menambahkan halaman pemberitahuan khusus lengkap dengan tombol kembali saat ruangan tidak ditemukan, sudah selesai, kedaluwarsa, sedang berjalan, penuh, atau dibatalkan.'
    ],
    docs: {
      files: [
        'src/components/RoomStatusScreen.jsx',
        'src/components/MonopoliBoard.jsx',
        'src/components/DosenKillerGame.jsx',
        'src/components/UnoBrutalGame.jsx',
        'src/components/MagicalAthleteGame.jsx'
      ],
      notes: 'Kalau pembuat ruangan membatalkan permainan sebelum dimulai, teman yang sudah telanjur masuk ruang tunggu otomatis melihat pemberitahuan bahwa ruangan telah dibatalkan.'
    }
  },
  {
    id: 'upd-032',
    date: '20 November 2026',
    version: 'v2.9.1',
    category: 'Perbaikan',
    title: 'Nama Pemegang Gelar Rekor Sekarang Selalu Sama dengan Peringkat #1',
    commit: '711238e',
    summary: 'Memperbaiki perbedaan nama yang sempat muncul antara kotak Gelar Pemegang Rekor Bidang dan Podium #1 ketika beberapa orang punya skor tertinggi yang sama.',
    changes: [
      'Menyamakan aturan penentuan urutan saat skor seri di kotak Gelar Pemegang Rekor Bidang dengan aturan Podium klasemen (total poin lebih tinggi didahulukan, lalu urutan NIM).'
    ],
    docs: {
      files: [
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Saat ada beberapa teman yang mencetak skor tertinggi yang sama pada satu bidang, nama utama yang tampil di gelar rekor kini selalu cocok dengan juara pertama di Podium.'
    }
  },
  {
    id: 'upd-031',
    date: '20 November 2026',
    version: 'v2.9.0',
    category: 'Fitur Baru',
    title: 'Salin Tautan Undangan Ruangan dan Gelar Rekor Klasemen',
    commit: '92e2dd6',
    summary: 'Mengajak teman main bareng jadi lebih cepat lewat satu tautan undangan, dan papan klasemen kini menampilkan gelar pemegang rekor untuk tiap bidang.',
    changes: [
      'Menambahkan tombol Salin Link Undangan di ruang tunggu Monopoli TL16, Dosen Killer, UNO Sedulur 16, dan Magical Athlete TL16 agar teman tinggal klik tautan dari grup WhatsApp untuk langsung masuk ruangan.',
      'Kalau teman yang mengklik tautan belum sempat masuk akun, tujuan ruangannya tetap diingat dan langsung dibuka begitu selesai masuk.',
      'Menambahkan sorotan Gelar Pemegang Rekor Bidang di papan klasemen (seperti Paling Hafal Jogja dan Paling Hafal Wajah Angkatan) yang bisa diklik untuk langsung mengurutkan klasemen bidang tersebut.'
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
      notes: 'Tautan undangan tetap mengikuti jadwal buka permainan. Gelar pemegang rekor baru muncul saat klasemen sudah dibuka dan sudah ada peserta yang mencetak skor.'
    }
  },
  {
    id: 'upd-030',
    date: '19 November 2026',
    version: 'v2.8.2',
    category: 'Perbaikan',
    title: 'Tombol Kembali di HP Sekarang Pulang ke Beranda Acara',
    commit: '7b3ef41',
    summary: 'Menekan tombol Kembali di HP atau browser saat sedang membuka permainan maupun ubah karakter kini mengarahkan ke menu sebelumnya, bukan langsung keluar dari situs.',
    changes: [
      'Menyelaraskan tombol Kembali di HP saat berpindah dari beranda ke permainan atau halaman ubah karakter.',
      'Jika halaman sempat dimuat ulang di tengah permainan, menekan tombol Kembali tetap membawa pulang ke beranda acara.'
    ],
    docs: {
      files: [
        'src/components/GameDashboard.jsx'
      ],
      notes: 'Tombol kembali yang ada di dalam layar juga mengikuti riwayat yang sama supaya perpindahan halaman terasa mulus seperti aplikasi HP.'
    }
  },
  {
    id: 'upd-029',
    date: '19 November 2026',
    version: 'v2.8.1',
    category: 'Tampilan',
    title: 'Rincian Poster IG Story Lebih Rapi dan Tetap Aman dari Bocoran',
    commit: 'latest',
    summary: 'Rincian skor pada poster Instagram Story sekarang disusun menjadi dua baris agar tidak terpotong titik-titik, dan mode yang belum rilis selalu tertutup blok sensor.',
    changes: [
      'Memastikan poster IG Story selalu menutup nama permainan yang belum waktunya rilis, termasuk saat poster dibuat oleh akun panitia.',
      'Menyusun rincian skor ke dalam 2 baris terpusat supaya seluruh angkanya terbaca penuh tanpa terpotong.'
    ],
    docs: {
      files: [
        'src/lib/storyCardGenerator.js',
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Poster yang diunduh atau dibagikan ke media sosial selalu mengikuti jadwal publik sehingga aman dipajang kapan saja.'
    }
  },
  {
    id: 'upd-028',
    date: '19 November 2026',
    version: 'v2.8.0',
    category: 'Fitur Baru',
    title: 'Poster Siap Bagikan ke Instagram Story',
    commit: 'latest',
    summary: 'Sekarang kamu bisa membuat poster vertikal bertema Kertas Kenangan untuk dibagikan langsung ke Instagram Story dari papan klasemen, kuis solo, maupun hasil main bareng.',
    changes: [
      'Menambahkan tombol Bagikan ke Story di papan klasemen, Tebak Peta, dan Tebak Wajah lengkap dengan avatar karaktermu serta selisih skor dengan peserta tepat di atas dan di bawahmu.',
      'Jika klasemen masih dirahasiakan panitia, nama dan peringkat lawan di poster otomatis tertutup blok sensor hitam.',
      'Menambahkan tombol Bagikan Hasil Sesi di akhir Monopoli TL16, Dosen Killer, UNO Seru TL16, dan Magical Athlete TL16 yang memuat daftar semua peserta dalam satu sesi.'
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
      notes: 'Di HP yang mendukung, tombol ini langsung membuka menu berbagi ke aplikasi. Di laptop atau browser tertentu, poster otomatis tersimpan sebagai gambar PNG.'
    }
  },
  {
    id: 'upd-027',
    date: '19 November 2026',
    version: 'v2.7.3',
    category: 'Tampilan',
    title: 'Tangga Podium 3 Besar Klasemen Lebih Seimbang',
    commit: 'latest',
    summary: 'Kartu juara pertama di papan klasemen kini selalu tampil paling tinggi dan menonjol dibanding peringkat kedua dan ketiga, meski panjang nama pesertanya berbeda.',
    changes: [
      'Mengatur tinggi kartu podium di layar laptop agar posisi #1 selalu paling tinggi, diikuti #2 lalu #3, dengan ukuran avatar dan skor lebih besar untuk juara pertama.',
      'Merapikan area nama dan rincian skor di ketiga kartu podium supaya sejajar rapi walau ada nama panjang yang terbagi ke 2 baris.'
    ],
    docs: {
      files: [
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Di layar HP, kartu podium tetap menyesuaikan isi agar nyaman digulir dan tidak memakan terlalu banyak ruang.'
    }
  },
  {
    id: 'upd-026',
    date: '19 November 2026',
    version: 'v2.7.2',
    category: 'Perbaikan',
    title: 'Perbaikan Tombol Kembali ke Beranda di Semua Permainan',
    commit: 'latest',
    summary: 'Menekan tombol Kembali ke Beranda setelah selesai bermain kuis kini langsung pulang ke halaman utama tanpa tersangkut lagi di permainan sebelumnya.',
    changes: [
      'Memperbaiki tombol Kembali ke Beranda dan Main Ulang pada Tebak Wajah serta Tebak Peta agar langsung kembali atau mengulang permainan dengan mulus.',
      'Merapikan tombol kembali pada halaman Catatan Update dan Magical Athlete TL16 agar tidak memutar balik ke halaman lama.',
      'Menambahkan tombol Kembali ke Beranda bagi seluruh peserta pada layar akhir Dosen Killer.'
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
      notes: 'Seluruh tombol kembali di tiap halaman permainan sudah diperiksa ulang supaya tidak ada lagi tombol yang macet atau nyasar.'
    }
  },
  {
    id: 'upd-025',
    date: '19 November 2026',
    version: 'v2.7.1',
    category: 'Perbaikan',
    title: 'Warna Avatar Tetap Akurat Meski Mode Gelap HP Aktif',
    commit: '2a07fd4',
    summary: 'Memperbaiki warna rambut, kulit, baju, dan latar avatar yang sebelumnya sempat berubah pudar atau terbalik saat dibuka di HP dengan mode gelap paksa.',
    changes: [
      'Mengunci tema halaman agar tetap mempertahankan nuansa kertas hangat meski perangkat sedang memakai mode gelap.',
      'Menggambar avatar secara langsung sebagai gambar utuh sehingga fitur mode gelap paksa pada browser HP tidak lagi membalik warna karaktermu.',
      'Mempertegas garis gambar karakter dan memberi bingkai tipis agar avatar tetap jelas di semua jenis layar.'
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
      notes: 'Perubahan ini berlaku di beranda, papan klasemen, ruang tunggu permainan, maupun saat avatar dimasukkan ke poster IG Story.'
    }
  },
  {
    id: 'upd-024',
    date: '19 November 2026',
    version: 'v2.7.0',
    category: 'Tampilan',
    title: 'Wajah Baru Papan Klasemen dengan Podium 3 Besar',
    commit: 'e032cba',
    summary: 'Papan klasemen Sedulur 16 diperbarui dengan panggung podium 3 besar, kartu ringkasan posisimu sendiri, pilihan urutan per permainan, dan kolom pencarian nama.',
    changes: [
      'Menampilkan 3 peringkat teratas dalam bentuk podium khusus beraksen emas dengan ikon mahkota untuk juara pertama.',
      'Menambahkan kotak ringkasan posisimu sendiri lengkap dengan tanda Kamu dan tombol Lihat Barisku agar langsung meluncur ke namamu.',
      'Menambahkan tombol urutan berdasarkan Total Skor, Peta, Foto (serta Monopoli dan Dosen Killer begitu waktunya tiba), kolom cari nama saat klasemen dibuka, serta batang perbandingan skor.'
    ],
    docs: {
      files: [
        'src/components/ScoreBoard.jsx'
      ],
      notes: 'Kotak pencarian baru aktif setelah klasemen resmi dibuka panitia, sehingga nama peserta tetap aman dirahasiakan sebelum waktunya.'
    }
  },
  {
    id: 'upd-023',
    date: '19 November 2026',
    version: 'v2.6.2',
    category: 'Tampilan',
    title: 'Sensor Blok Hitam untuk Agenda dan Permainan Rahasia',
    commit: '22b9b11',
    summary: 'Catatan pembaruan sekarang bisa dibaca semua orang sejak awal, sementara nama permainan atau kejutan yang belum waktunya rilis otomatis tertutup blok hitam ala berkas detektif.',
    changes: [
      'Menampilkan seluruh catatan pembaruan publik di halaman ini dengan penutup blok hitam otomatis pada istilah permainan yang belum memasuki tanggal buka.',
      'Ikut menutup nama berkas terkait yang masih rahasia agar tidak ada bocoran kejutan acara.'
    ],
    docs: {
      files: [
        'src/components/UpdatesPage.jsx',
        'src/data/updatesLog.js'
      ],
      notes: 'Begitu tanggal buka suatu permainan tiba, blok hitam pada catatannya ikut terbuka secara otomatis.'
    }
  },
  {
    id: 'upd-022',
    date: '19 November 2026',
    version: 'v2.6.1',
    category: 'Perbaikan',
    title: 'Penyempurnaan Aturan Main di Seluruh Mode Permainan Bersama',
    commit: '2707592',
    summary: 'Merapikan berbagai celah aturan pada Dosen Killer, Monopoli TL16, UNO Seru TL16, Wheel of Family, dan Magical Athlete TL16 supaya permainan berjalan lebih adil.',
    changes: [
      'Dosen Killer: langsung mengecek pemenang setelah fase malam, menjadikan pemain yang telat masuk sebagai penonton, mencegah memilih diri sendiri, dan memperbolehkan pemain pengganti memulai sesi.',
      'Monopoli TL16: memberi jeda 6 detik antar lemparan dadu, menahan lemparan saat pilihan aksi masih terbuka, mencegah bonus ganda START, dan menjaga perhitungan kas sewa serta skor tetap akurat.',
      'UNO Seru TL16 dan Magical Athlete: menambahkan pilihan 4 warna untuk kartu Titip Absen, otomatis mengoper giliran saat pemain keluar meja, dan membatasi giliran bonus berturut-turut.',
      'Wheel of Family: menyaring peserta yang sudah pernah terpilih agar tidak terpilih dua kali, dan menampilkan Magical Athlete TL16 di daftar permainan bersama.'
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
      notes: 'Seluruh penyesuaian ini menjaga alur Dosen Killer, Monopoli TL16, UNO Seru TL16, Wheel of Family, dan Magical Athlete TL16 tetap lancar dan adil saat dimainkan ramai-ramai.'
    }
  },
  {
    id: 'upd-021',
    date: '19 November 2026',
    version: 'v2.6.0',
    category: 'Perbaikan',
    title: 'Permainan Tetap Jalan Lancar Meski Ada Teman yang Hilang Sinyal',
    commit: 'f473a70',
    summary: 'Kalau sinyal pembuat ruangan terputus, kendali ruangan otomatis berpindah ke teman lain, bot sementara membantu giliran pemain yang offline, dan skor terbaik kuis tetap aman.',
    changes: [
      'Menambahkan penyelarasan ulang otomatis begitu jaringan internet kembali normal atau tab HP dibuka lagi.',
      'Menambahkan bantuan bot sementara jika ada pemain yang terputus beberapa detik, lalu bot langsung berhenti begitu pemain tersebut aktif lagi.',
      'Menjaga skor tertinggi pada Tebak Wajah dan Tebak Peta supaya mengulang kuis tidak menurunkan nilai terbaikmu di klasemen.',
      'Menyimpan sisa waktu dan progres soal Tebak Wajah agar muat ulang halaman tidak mengulang waktu dari awal.'
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
      notes: 'Pengalihan kendali ruangan dipilih secara seragam di semua perangkat pemain yang aktif agar permainan tidak pernah macet di tengah jalan.'
    }
  },
  {
    id: 'upd-020',
    date: '18 November 2026',
    version: 'v2.5.3',
    category: 'Keamanan',
    title: 'Perlindungan Halaman dari Intip Kode dan Kecurangan',
    commit: '43d2c73',
    summary: 'Mengaktifkan pengamanan di seluruh halaman portal untuk mencegah klik kanan intip halaman, tombol F12, serta upaya membuka kunci jawaban dari alat pengembang browser.',
    changes: [
      'Menonaktifkan klik kanan serta pintasan keyboard alat pengembang di beranda, halaman permainan, dan halaman catatan pembaruan.',
      'Menampilkan layar pengaman otomatis apabila alat pemeriksa browser tetap dibuka dari menu.'
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
      notes: 'Lapisan pengaman aktif sejak halaman pertama kali dibuka untuk menjaga kejutan acara dan kejujuran skor kuis.'
    }
  },
  {
    id: 'upd-019',
    requiresMode: 'adminOnly',
    date: '18 November 2026',
    version: 'v2.5.2',
    category: 'Keamanan',
    title: 'Penutupan Menyeluruh untuk Semua Permainan yang Belum Rilis',
    commit: '3a41321',
    summary: 'Memastikan tidak ada satu pun nama permainan yang belum waktunya buka (Monopoli TL16, Dosen Killer, UNO Seru TL16, Wheel of Family, dan Magical Athlete) bocor di halaman publik.',
    changes: [
      'Menutup sebutan bidak Monopoli di halaman ubah karakter sampai jadwal rilis tiba.',
      'Menutup nama agenda dan permainan belum rilis di Beranda, Jadwal Acara, dan rincian skor Klasemen sesuai jadwal panitia.',
      'Menerapkan blok sensor otomatis di halaman Catatan Update mulai dari judul hingga daftar berkas terkait.'
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
      notes: 'Semua mode terjadwal berada dalam keadaan tertutup secara bawaan dan baru terbuka setelah melewati tanggal yang diatur panitia.'
    }
  },
  {
    id: 'upd-018',
    date: '18 November 2026',
    version: 'v2.5.1',
    category: 'Tampilan',
    title: 'Perapian Tampilan Kertas Hangat dan Sensor Kejutan Acara',
    commit: '4604319',
    summary: 'Merapikan seluruh halaman portal menjadi gaya kertas kenangan yang lebih bersih dan nyaman dibaca, sekaligus menyembunyikan nama Monopoli sebelum jadwal bukanya.',
    changes: [
      'Membersihkan efek latar dan bayangan yang terlalu ramai di halaman masuk, ubah karakter, beranda, dan papan klasemen.',
      'Membedakan susunan daftar kuis solo dan permainan bersama supaya halaman lebih nyaman dipindai mata.',
      'Menambahkan penutup blok hitam ala berkas detektif untuk menyembunyikan nama Monopoli sampai tanggal pembukaannya tiba.',
      'Memperjelas kontras tombol yang belum aktif agar tetap terbaca dengan nyaman.'
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
      notes: 'Kata rahasia yang tertutup blok hitam tidak dimunculkan sama sekali di layar sebelum waktunya sehingga tidak bisa disalin maupun diblok.'
    }
  },
  {
    id: 'upd-017',
    date: '18 November 2026',
    version: 'v2.5.0',
    category: 'Tampilan',
    title: 'Studio Karakter Alumni dan Tata Letak Beranda Baru',
    commit: '8a6c0eb',
    summary: 'Sekarang setiap alumni bisa merancang avatar karakternya sendiri lengkap dengan pilihan hijab, gaya rambut, kacamata, dan ekspresi wajah.',
    changes: [
      'Menambahkan halaman buat karakter saat pertama kali masuk, lengkap dengan warna kulit, latar, 9 pilihan rambut atau hijab, 3 model baju, kacamata, mata, 8 ekspresi mulut, dan tombol Acak.',
      'Karakter yang kamu simpan otomatis tersambung ke akunmu sehingga tetap sama meski dibuka dari HP atau laptop lain.',
      'Memperbarui tata letak halaman masuk, beranda acara, dan papan klasemen agar lebih lega di layar HP maupun komputer.',
      'Menampilkan karakter buatanmu di profil beranda, daftar klasemen, serta ruang tunggu dan bidak Monopoli TL16.'
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
      notes: 'Kamu tetap bisa mengubah tampilan karaktermu kapan saja lewat tombol Edit Karakter di halaman beranda.'
    }
  },
  {
    id: 'upd-016',
    requiresMode: 'monopoli',
    date: '17 November 2026',
    version: 'v2.4.7',
    category: 'Tampilan',
    title: 'Daftar Petak Monopoli Lebih Sejajar dan Jelas',
    commit: 'latest',
    summary: 'Tinggi kolom Daftar Petak di layar laptop kini sejajar rapi dengan papan Monopoli, dan penanda kepemilikan petak diperbesar menjadi blok warna penuh.',
    changes: [
      'Menyamakan tinggi kolom Daftar Petak di samping kanan dengan tinggi papan Monopoli di layar laptop.',
      'Mengubah tanda kepemilikan petak dari titik kecil menjadi kotak warna penuh sesuai warna bidak pemiliknya.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Warna pemilik properti jadi jauh lebih cepat dikenali saat memeriksa daftar petak.'
    }
  },
  {
    id: 'upd-015',
    requiresMode: 'monopoli',
    date: '17 November 2026',
    version: 'v2.4.6',
    category: 'Tampilan',
    title: 'Daftar Petak Interaktif yang Bisa Dicari di Monopoli TL16',
    commit: 'latest',
    summary: 'Menu pilih petak lama diganti menjadi daftar lengkap yang bisa digulir, dicari, dan langsung diklik untuk melihat rincian harga dan sewanya.',
    changes: [
      'Mengganti menu pilihan turun menjadi daftar gulir 40 petak lengkap dengan warna kelompok, harga, dan tanda pemilik.',
      'Menambahkan kotak cari cepat berdasarkan nama atau nomor petak.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Klik salah satu petak di daftar untuk langsung melihat info harga beli, biaya sewa, dan pemiliknya.'
    }
  },
  {
    id: 'upd-014',
    date: '17 November 2026',
    version: 'v2.4.5',
    category: 'Fitur Baru',
    title: 'Posisi Permainan dan Ruangan Tetap Aman Saat Halaman Dimuat Ulang',
    commit: 'latest',
    summary: 'Kalau halaman tidak sengaja ter-refresh di tengah permainan, kamu otomatis kembali ke permainan dan ruangan yang sedang diikuti tanpa harus masuk ulang dari awal.',
    changes: [
      'Mengingat halaman permainan terakhir yang kamu buka agar muat ulang tidak memulangkanmu ke beranda.',
      'Mengingat ruangan aktif di Monopoli TL16, Sidang Dosen Killer, dan UNO Sedulur 16 supaya kamu otomatis tersambung kembali setelah refresh.',
      'Otomatis melupakan ruangan lama begitu kamu menekan tombol keluar atau pulang ke beranda.'
    ],
    docs: {
      files: ['src/components/GameDashboard.jsx', 'src/components/MonopoliBoard.jsx', 'src/components/DosenKillerGame.jsx', 'src/components/UnoBrutalGame.jsx'],
      notes: 'Sebelum memasukkanmu kembali, portal selalu memeriksa dulu apakah ruangannya masih aktif.'
    }
  },
  {
    id: 'upd-013',
    requiresMode: 'monopoli',
    date: '17 November 2026',
    version: 'v2.4.4',
    category: 'Tampilan',
    title: 'Animasi 2 Dadu Bergoyang di Monopoli TL16',
    commit: 'latest',
    summary: 'Melempar dadu kini terasa lebih hidup dengan animasi 2 dadu bertitik yang bergoyang cepat di tengah papan.',
    changes: [
      'Menampilkan 2 dadu bergoyang saat proses pengocokan dadu berlangsung.',
      'Mengganti kotak angka dadu polos menjadi tampilan mata dadu bertitik 1 sampai 6.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Hasil kocokan dadu langsung tampil jelas di bagian tengah papan saat giliranmu berjalan.'
    }
  },
  {
    id: 'upd-012',
    requiresMode: 'monopoli',
    date: '17 November 2026',
    version: 'v2.4.3',
    category: 'Fitur Baru',
    title: 'Pembersihan Otomatis Ruangan Monopoli Setelah 30 Menit',
    commit: 'latest',
    summary: 'Riwayat ruangan Monopoli yang sudah selesai akan terhapus otomatis setelah 30 menit, sementara poin kemenangan tetap tersimpan aman di klasemen.',
    changes: [
      'Menghapus otomatis data ruangan, posisi pemain, dan kepemilikan properti 30 menit setelah permainan berakhir.',
      'Memastikan perolehan poin pemain tetap tercatat permanen di papan klasemen.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Jeda 30 menit memberi waktu bagi semua pemain untuk melihat papan hasil akhir sebelum ruangan dibersihkan.'
    }
  },
  {
    id: 'upd-011',
    requiresMode: 'monopoli',
    date: '17 November 2026',
    version: 'v2.4.2',
    category: 'Fitur Baru',
    title: 'Daftar Ruangan Aktif Langsung di Lobi Monopoli TL16',
    commit: 'latest',
    summary: 'Ruangan Monopoli yang sedang terbuka kini langsung tampil di halaman lobi, jadi kamu bisa ikut bergabung dengan sekali klik tanpa mengetik kode.',
    changes: [
      'Menampilkan ruangan yang aktif dalam 1 jam terakhir lengkap dengan status, jumlah pemain (maksimal 6 orang), dan nama pesertanya.',
      'Menyediakan tombol Gabung atau Lanjutkan langsung beserta pembaruan otomatis tiap beberapa detik.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Tombol Segarkan juga tersedia kalau kamu ingin langsung memeriksa ruangan baru yang baru saja dibuat teman.'
    }
  },
  {
    id: 'upd-010',
    requiresMode: 'monopoli',
    date: '17 November 2026',
    version: 'v2.4.1',
    category: 'Tampilan',
    title: 'Papan Monopoli Lebih Besar dan Nyaman di HP Maupun Laptop',
    commit: 'latest',
    summary: 'Ukuran papan Monopoli diperbesar agar tulisan tiap petak terbaca jelas di laptop, lengkap dengan mode perbesar papan untuk layar HP.',
    changes: [
      'Menata tampilan laptop menjadi dua sisi: papan besar di kiri dan panel saldo, dadu, serta info petak di kanan.',
      'Menampilkan posisi dan saldo seluruh pemain langsung di bagian tengah papan.',
      'Memperjelas label petak khusus serta menambahkan tombol Perbesar Papan agar lebih mudah disentuh di HP.',
      'Merapikan deretan tombol menu di bagian atas beranda agar sejajar dalam satu baris.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx', 'src/components/GameDashboard.jsx', 'src/components/RoadmapModal.jsx'],
      notes: 'Saat mode Perbesar Papan aktif di HP, papan bisa digeser ke kiri dan kanan dengan jari.'
    }
  },
  {
    id: 'upd-009',
    date: '17 November 2026',
    version: 'v2.4.0',
    category: 'Fitur Baru',
    title: 'Halaman Catatan Update dan Dokumentasi Resmi Dibuka',
    commit: 'latest',
    summary: 'Menambahkan halaman khusus ini supaya semua alumni bisa mengikuti perkembangan fitur baru dan perbaikan yang sudah diterapkan di portal reuni.',
    changes: [
      'Menambahkan menu Catatan Update di bagian atas beranda dan tautan langsung /updates.',
      'Menyediakan tombol filter kategori agar kamu bisa menyaring catatan sesuai topik.',
      'Menyediakan bagian detail tambahan yang bisa dibuka atau ditutup di tiap catatan.'
    ],
    docs: {
      files: ['src/data/updatesLog.js', 'src/components/UpdatesPage.jsx', 'src/pages/updates.astro', 'src/components/GameDashboard.jsx'],
      notes: 'Setiap kali ada pembaruan baru, catatannya langsung muncul paling atas di halaman ini.'
    }
  },
  {
    id: 'upd-008',
    requiresMode: 'athlete',
    date: '17 November 2026',
    version: 'v2.3.1',
    category: 'Keamanan',
    title: 'Penyeragaman Alur Masuk Panitia',
    commit: 'daae315',
    summary: 'Menyamakan cara masuk akun panitia sehingga seluruh panitia memiliki alur masuk yang seragam di halaman utama maupun Magical Athlete.',
    changes: [
      'Menyamakan alur masuk akun panitia pada halaman utama dan Magical Athlete tanpa langkah tambahan yang berbeda.',
      'Status panitia dibaca langsung dari daftar akun resmi angkatan.'
    ],
    docs: {
      files: ['src/components/Login.jsx', 'src/components/MagicalAthleteGame.jsx'],
      notes: 'Pengaturan hak akses panitia kini terpusat di satu tempat.'
    }
  },
  {
    id: 'upd-007',
    date: '17 November 2026',
    version: 'v2.3.0',
    category: 'Perbaikan',
    title: 'Perbaikan Ikon Beranda dan Kestabilan Situs',
    commit: 'a36e9a7',
    summary: 'Memperbaiki gangguan tampilan ikon yang sempat membuat beranda gagal terbuka serta menstabilkan proses penerbitan situs.',
    changes: [
      'Melengkapi ikon menu pada halaman beranda agar seluruh daftar permainan tampil utuh.',
      'Menstabilkan pengaturan server penerbitan situs agar setiap pembaruan tayang tanpa kendala.'
    ],
    docs: {
      files: ['src/components/GameDashboard.jsx', 'package.json'],
      notes: 'Mengatasi gangguan halaman kosong yang sempat terjadi sesaat setelah pembaruan ikon.'
    }
  },
  {
    id: 'upd-006',
    date: '17 November 2026',
    version: 'v2.2.0',
    category: 'Tampilan',
    title: 'Tema Baru Buku Kenangan Hangat',
    commit: 'eba8553',
    summary: 'Mengubah suasana portal dari latar gelap menjadi tema kertas buku tahunan berwarna krem hangat yang lebih akrab dan nyaman di mata.',
    changes: [
      'Mengganti latar belakang gelap menjadi warna kertas krem hangat dengan garis pemisah lembut.',
      'Memperbarui jenis huruf supaya judul dan angka skor lebih enak dibaca di HP maupun laptop.',
      'Merapikan daftar permainan di beranda dan mengganti emoji hiasan dengan ikon garis yang bersih.',
      'Menyesuaikan tampilan peta lokasi agar lebih terang dan menyelaraskan warna segmen Wheel of Family.'
    ],
    docs: {
      files: ['DESIGN.md', 'src/styles/global.css', 'src/layouts/Layout.astro', 'src/pages/index.astro', 'src/components/*'],
      notes: 'Tema kertas hangat ini menjadi identitas visual utama seluruh halaman Portal 1 Dekade TL 2016.'
    }
  },
  {
    id: 'upd-005',
    date: '17 November 2026',
    version: 'v2.1.0',
    category: 'Tampilan',
    title: 'Kenyamanan Layar HP dan Kecepatan Muat Halaman',
    commit: '79207be',
    summary: 'Menambah kenyamanan bermain lewat HP, mempercepat pemuatan daftar skor, dan mengganti kotak peringatan pop-up bawaan browser menjadi pemberitahuan di dalam layar.',
    changes: [
      'Menambahkan tombol Perbesar Papan di layar HP untuk papan Monopoli 11x11 agar petak lebih gampang disentuh.',
      'Membuat kotak obrolan Dosen Killer dan catatan Intel bisa dilipat supaya tidak menutupi layar kecil.',
      'Memperingan pemuatan data pada Tebak Wajah dan papan klasemen agar halaman terbuka lebih cepat.',
      'Mengganti peringatan pop-up bawaan browser menjadi pemberitahuan rapi di dalam halaman.'
    ],
    docs: {
      files: ['PRODUCT.md', 'src/styles/global.css', 'src/components/MonopoliBoard.jsx', 'src/components/AdminDashboard.jsx', 'src/components/DosenKillerGame.jsx', 'src/components/MapGame.jsx', 'src/components/FaceGame.jsx', 'src/components/ScoreBoard.jsx'],
      notes: 'Seluruh penyesuaian ini difokuskan agar portal nyaman dipakai langsung dari HP saat acara berlangsung.'
    }
  },
  {
    id: 'upd-004',
    date: '13 November 2026',
    version: 'v2.0.1',
    category: 'Perbaikan',
    title: 'Perbaikan Serentak pada 5 Permainan Portal',
    commit: '5056216',
    summary: 'Membereskan kendala foto di Wheel of Family, kebocoran chat di Dosen Killer, sinkronisasi kartu UNO, penyimpanan progres Tebak Peta, dan hak Host Magical Athlete.',
    changes: [
      'Wheel of Family: memperbaiki pengambilan foto 2016 agar foto kenangan alumni tampil tanpa error.',
      'Dosen Killer: memisahkan ruang obrolan per kelas, memastikan kekebalan Uptodate hanya berlaku di malam pertama, dan menyelaraskan petunjuk Intel.',
      'UNO Sedulur 16: menyinkronkan giliran pemain, kartu di tangan, dan efek kartu Skip dan +2 secara langsung antar perangkat.',
      'Tebak Peta: menyimpan progres pertanyaan supaya skor tidak hilang kalau halaman tidak sengaja dimuat ulang.'
    ],
    docs: {
      files: ['src/components/WheelOfFamily.jsx', 'src/components/DosenKillerGame.jsx', 'src/components/LayarDiskusi.jsx', 'src/components/LayarMalam.jsx', 'src/components/UnoBrutalGame.jsx', 'src/components/TreasureHunt.jsx', 'src/components/MagicalAthleteGame.jsx'],
      notes: 'Seluruh perbaikan sudah diuji agar permainan berjalan sinkron antar peserta.'
    }
  },
  {
    id: 'upd-003',
    requiresMode: 'monopoli',
    date: '13 November 2026',
    version: 'v2.0.0',
    category: 'Perbaikan',
    title: 'Perbaikan Menyeluruh Aturan Main Monopoli TL16',
    commit: '0240852',
    summary: 'Memperbaiki kendala masuk ruangan bagi seluruh alumni serta meluruskan perhitungan uang sewa, bonus START, dan warna bidak di Monopoli TL16.',
    changes: [
      'Memastikan seluruh 63 alumni bisa bergabung ke ruangan tanpa kendala pendaftaran akun.',
      'Memastikan uang sewa yang dibayar pemain otomatis masuk ke saldo pemilik properti.',
      'Meluruskan aturan bonus START (+Rp 200k) agar hanya cair setelah selesai satu putaran penuh.',
      'Menjalankan efek petak tujuan setelah kartu TELEPORT/MUNDUR dan mengunci warna bidak yang sudah dipilih pemain lain.'
    ],
    docs: {
      files: ['src/components/MonopoliBoard.jsx'],
      notes: 'Saldo, kepemilikan properti, dan posisi bidak kini tersinkron langsung di layar seluruh pemain.'
    }
  },
  {
    id: 'upd-002',
    date: '13 November 2026',
    version: 'v1.9.1',
    category: 'Tampilan',
    title: 'Tampilan Logo Utama Lebih Bersih Tanpa Judul Ganda',
    commit: '9ab620c',
    summary: 'Menampilkan logo grafis berwarna Happy Anniversary TL 2016 secara tunggal tanpa pengulangan teks judul yang sama di atas atau bawahnya.',
    changes: [
      'Menghapus tulisan judul berulang di sekitar logo pada halaman masuk dan jendela sambutan.',
      'Tetap menjaga teks keterangan gambar agar ramah bagi pembaca layar.'
    ],
    docs: {
      files: ['src/components/Login.jsx', 'src/components/GameDashboard.jsx'],
      notes: 'Logo utama sekarang tampil lebih lega dan menjadi fokus pertama saat membuka portal.'
    }
  }
];
