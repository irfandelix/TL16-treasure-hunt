# Desain Fitur Pop-Up Ledakan "COMING SOON" 4 Game Multiplayer

Tanggal: 22 November 2026
Status: Disetujui pengguna

## 1. Tujuan & Alasan
Membuat keempat game multiplayer (**Monopoli TL16**, **Dosen Killer**, **UNO Seru TL16**, dan **Magical Athlete TL16**) mulai terasa hadir dan bikin penasaran di beranda Portal Sedulur 16 sebelum tanggal rilisnya, tanpa memenuhi tinggi halaman dan tanpa menggandakan tombol main dari daftar **Arena Main Bareng (Multiplayer)**.

### Ruang Lingkup (Goals)
- Menampilkan banner pemicu (**trigger**) tepat di bawah bagian **Tombol Misteri** di beranda.
- Saat tombol trigger diklik, membuka pop-up panggung dengan animasi ledakan radial (shockwave + partikel konfeti) yang menyebarkan 4 ilustrasi game mengelilingi stiker 3D **COMING SOON** bergaya logo `HAPPY ANNIVERSARY TL 2016`.
- Menggunakan 4 aset ilustrasi transparan yang sudah ada (`vector_1_monopoli_transparan.png`, `vector_2_dosen_killer_transparan.png`, `vector_3_uno_transparan.png`, `vector_5_magical_athlete_transparan.png`) yang dioptimasi menjadi WebP ringan di `public/games/`, tanpa kotak/frame kartu.
- Mendukung 3 tahap bertahap per game: **Tahap 1 (Misterius Total)** -> **Tahap 2 (Siluet Mengintip + animasi khas)** -> **Tahap 3 (Terbuka)**.
- Perpindahan tahap bekerja **otomatis mengikuti tanggal rilis** sekaligus bisa **di-override manual oleh panitia** di Ruang Panitia (termasuk menambahkan jadwal rilis publik untuk `Magical Athlete TL16`).

### Di Luar Ruang Lingkup (Non-Goals & Anti-Goals)
- Tidak menampilkan tombol "Main" di dalam pop-up untuk menghindari duplikasi dengan daftar **Arena Main Bareng (Multiplayer)**.
- Tidak mengubah struktur kolom database Supabase (pengaturan tahap manual dan jadwal `Magical Athlete` disimpan di `app_settings.patch_notes`, mengikuti pola `early_access` dan `kapsul_schedule`).
- Tidak memunculkan kotak kaku di sekeliling ilustrasi game atau di belakang teks stiker **COMING SOON**.
- Tidak memblokir atau melanggar `prefers-reduced-motion` (saat reduced motion aktif, animasi loop dan ledakan dimatikan dengan tampilan tetap terbaca penuh).

## 2. Perbandingan Pendekatan
Tiga pendekatan tata letak yang sempat dibandingkan selama diskusi:
1. **Grid 2x2 Berkotak / Daftar 01-04 langsung di beranda:** Mudah terlihat langsung, tetapi membuat halaman beranda panjang dan kotak gelap terasa kaku.
2. **Ledakan Radial langsung di halaman beranda (tanpa pop-up):** Bebas kotak dan meriah, tetapi memakan ruang vertikal cukup besar sebelum Kuis Kenangan Kampus.
3. **Banner Trigger + Pop-Up Ledakan Radial (Dipilih):** Beranda tetap ringkas dan rapi, efek ledakan konfeti + stiker 3D **COMING SOON** + 4 aset tanpa kotak jadi jauh lebih dramatis saat dibuka, serta pas satu layar di HP (`390px`) maupun Desktop.

## 3. Rincian Desain

### A. Posisi & Aturan Tampil di Beranda (`GameDashboard.jsx`)
- **Letak:** Tepat di bawah bagian **Tombol Misteri** dan di atas **Kuis Kenangan Kampus**.
- **Banner Trigger:** Bernuansa hijau khas TL (`#14532D`) dengan 4 mini-siluet game melayang di sisi kiri/atas, teks singkat *"Ada 4 Permainan Kejutan Sedang Disiapkan!"*, dan tombol trigger empuk kuning emas (*"Intip 4 Game Coming Soon"*).
- **Kapan Banner Trigger Tampil:**
  - Untuk alumni biasa: tampil selama masih ada minimal 1 dari 4 game yang berstatus publik `mystery` atau `clue`. Begitu keempat game sudah berstatus `open`, banner trigger otomatis hilang karena seluruh game sudah muncul di daftar **Arena Main Bareng**.
  - Untuk panitia (`user.is_admin`, keputusan implementasi): banner tetap muncul selama minimal 1 game belum terbuka secara publik agar panitia bisa memantau tampilan teaser peserta, dan pop-up menampilkan status publik (bukan status bypass admin).
- **Daftar Arena Main Bareng:** Tetap tampil seperti sekarang untuk game yang sudah terbuka, termasuk `Magical Athlete TL16` yang kini ikut membaca jadwal rilis publik/override (bukan hanya `hasTestAccess`). Game yang belum terbuka tidak perlu lagi muncul sebagai baris sensor polos terpisah jika sudah diwakili pop-up Coming Soon (keputusan implementasi: daftar **Arena Main Bareng** hanya menampilkan game yang sudah `unlocked` agar tidak terkesan dobel dengan pop-up).

### B. Pop-Up Ledakan (`ComingSoonExplosion.jsx`)
- **Overlay & Panggung:** Latar gelap blur lembut (`rgba(9, 9, 11, 0.82)`) dengan panggung radial hijau-emas gelap, tombol tutup `×` di kanan atas (serta bisa ditutup klik luar atau tombol `Escape`), tanpa kalimat petunjuk di bagian bawah pop-up agar visualnya bersih, dan stiker tengah tetap bisa diklik untuk memutar ulang ledakan konfeti.
- **Pusat Ledakan:** Stiker 3D **COMING SOON** tanpa kotak persegi (huruf tebal warna pelangi logo TL 2016 + outline krem tebal + shadow 3D + strip/dot magenta + bintang starburst berputar lembut di belakang + pita kecil `4 GAME KEJUTAN • TL 2016` / status jumlah terbuka).
- **Efek Ledakan:** 2 cincin shockwave + partikel konfeti warna logo TL 2016 menyebar dari pusat, diikuti 4 game yang melesat keluar dari tengah dengan spring overshoot (tanpa `opacity: 0` awal agar tidak pernah berkedip kosong).
- **Responsif HP vs Desktop:**
  - Desktop (`lg:`): 2 game di kiri (atas & bawah), stiker **COMING SOON** di tengah, 2 game di kanan (atas & bawah).
  - HP (`< 640px`): 2 game di atas, stiker **COMING SOON** di tengah, 2 game di bawah, ukuran ilustrasi kompak (`~104px`) agar seluruh komposisi muat satu layar HP tanpa perlu scroll (dengan `max-h-[92dvh] overflow-y-auto` sebagai pengaman layar sangat pendek).

### C. Perilaku 3 Tahap per Game (Tanpa Kotak, Tanpa Tombol Main)
1. **Tahap 1 (`mystery` - Misterius Total):**
   - Bayangan aset sangat samar (`blur`) di balik lingkaran `?` bertuliskan `RAHASIA #01..#04`, label `Coming Soon`, dan teks singkat *"Ketuk untuk cek"*.
   - Saat diketuk: ikon `?` bergetar kecil dan muncul bisikan singkat bahwa segel masih rapat.
2. **Tahap 2 (`clue` - Siluet Mengintip + Animasi Khas):**
   - **Monopoli TL16 (`#01`):** Siluet melangkah/memantul halus + sorot bundar warna asli mengintip area bidak & dadu.
   - **Dosen Killer (`#02`):** Siluet ruang sidang + lensa kaca pembesar emas menyapu di atas siluet, menampakkan potongan warna asli di dalam lensa.
   - **UNO Seru TL16 (`#03`):** Siluet kipas kartu bergoyang pelan + sapuan diagonal mengintip warna kartu.
   - **Magical Athlete TL16 (`#04`):** Siluet balapan bergetar cepat dengan pendar neon + kilatan garis warna **neon flash** melesat menyilang.
   - Di bawah tiap siluet tersusun vertikal rata tengah: label `Coming Soon`, lalu bar sensor judul (`redacted`), lalu tanggal rilis (jika sudah dijadwalkan) atau `Menyusul` tepat di bawah bar sensornya. Saat diketuk/di-hover, siluet sedikit membesar.
3. **Tahap 3 (`open` - Terbuka):**
   - Ilustrasi WebP berwarna penuh tanpa kotak, judul asli game, dan status singkat `Sudah Terbuka` (tanpa tombol main dobel; pemain masuk melalui daftar **Arena Main Bareng** di beranda).

### D. Logika Jadwal Otomatis + Override Panitia (`earlyAccess.js` & `AdminDashboard.jsx`)
- **Penyimpanan:** Menyimpan objek `coming_soon_games` di dalam JSON `app_settings.patch_notes` melalui helper baru di `src/lib/earlyAccess.js`:
  - `athlete_unlock_date`: ISO string atau `null` (jadwal rilis publik `Magical Athlete TL16`).
  - `overrides`: `{ monopoli, werewolf, uno, athlete }`, masing-masing bernilai `'auto' | 'mystery' | 'clue' | 'open'` (default `'auto'`).
- **Resolusi Tahap (`resolveGameStage`):**
  1. Jika `override` bukan `'auto'`, langsung pakai nilai `override`.
  2. Jika `'auto'` dan belum ada tanggal rilis -> `'mystery'`.
  3. Jika `'auto'` dan `now >= unlockTime` -> `'open'`.
  4. Jika `'auto'` dan jarak ke `unlockTime <= 30 hari` (mengikuti `THIRTY_DAYS_MS` yang sudah ada di beranda) -> `'clue'`.
  5. Selain itu (`> 30 hari`) -> `'mystery'`.
- **UI Ruang Panitia (`AdminDashboard.jsx`):**
  - Menambahkan input tanggal rilis untuk `Magical Athlete TL16` di bagian jadwal game.
  - Menambahkan kontrol 4 pilihan tahap (`Otomatis`, `Misterius`, `Mengintip`, `Terbuka`) untuk masing-masing dari 4 game agar panitia bisa memunculkan clue atau mengunci paksa kapan saja.

### E. Aset Gambar (`public/games/`)
- Mengonversi 4 file PNG transparan dari folder artefak sesi ini (`vector_1_monopoli_transparan.png`, `vector_2_dosen_killer_transparan.png`, `vector_3_uno_transparan.png`, `vector_5_magical_athlete_transparan.png`) ke WebP terkompresi (`~360x360`, transparan) di:
  - `public/games/monopoli.webp`
  - `public/games/dosen-killer.webp`
  - `public/games/uno.webp`
  - `public/games/magical-athlete.webp`

## 4. Keputusan Default yang Diambil
Bagian berikut ditetapkan sebagai default dan bisa langsung diubah jika diinginkan:
1. Batas otomatis pindah dari Tahap 1 (`mystery`) ke Tahap 2 (`clue`) memakai **30 hari sebelum rilis (`H-30`)** agar konsisten dengan konstanta yang sudah ada di `GameDashboard.jsx`.
2. Untuk daftar **Arena Main Bareng**, hanya game yang sudah `unlocked` yang ditampilkan di daftar tersebut (baris sensor lama untuk status `approaching` digantikan oleh pop-up Coming Soon supaya tidak dobel).
3. Panitia tetap melihat banner trigger selama minimal 1 game masih tertutup untuk publik agar mudah menguji pop-up.
