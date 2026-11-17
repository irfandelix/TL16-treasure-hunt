# DESIGN.md: Buku Kenangan 1 Dekade Sedulur 16 (Warm Paper & Ink)

## Design Read
Portal reuni dan permainan interaktif 1 Dekade Teknik Lingkungan 2016 (Sedulur 16) dengan estetika **Buku Kenangan Hangat (Editorial Yearbook & Festive Anniversary)**, dial `ENERGY 2 / RHYTHM 2 / MOTION 2`.

## Three Dials
- **Dial:** `ENERGY 2 / RHYTHM 2 / MOTION 2`
- **ENERGY 2 (Warm & Nostalgic):** Hangat, akrab, seperti membuka lembar album foto dan buku tahunan angkatan 2016 tanpa kesan dashboard dark-mode generik.
- **RHYTHM 2 (Editorial Breaks):** Sorotan utama perayaan (Kapsul Waktu & Wheel of Family) dipisahkan dengan garis tipis (`#DED6C6`) dan daftar indeks permainan bernomor, bukan grid kartu seragam atau kotak bersarang.
- **MOTION 2 (Purposeful Transitions):** Transisi halus pada interaksi tombol/daftar dan animasi permainan yang mematuhi `prefers-reduced-motion` tanpa mematikan umpan balik loading.

## Color Palette (WCAG AA Verified)
- **Canvas — Kertas Kenangan (`#FAF6EE`):** Latar utama sehangat kertas album foto, menjaga logo warna-warni `Asset 2.webp` tetap cerah sekaligus nyaman dibaca di layar HP siang maupun malam.
- **Surface — Kertas Foto & Amplop (`#FFFFFF` & `#F3EDE0`):** Permukaan bersih untuk lembar konten, modal, dan tabel klasemen dengan garis pembatas tipis `#DED6C6`.
- **Ink — Tinta Arang (`#1C1917` & `#57534E`):** Teks utama `stone-900` (>15:1) dan teks sekunder `stone-600` (>6.5:1) di atas `#FAF6EE`.
- **Core Brand — Hijau Teknik Lingkungan (`#14532D` & `#15803D`):** Hijau hutan jurusan Teknik Lingkungan untuk CTA utama (`#14532D` dengan teks `#FFFFFF`, kontras >9:1) dan tautan/status aktif (`#15803D`).
- **Warm Accent — Kuning Emas Perayaan (`#D97706` & `#F59E0B` / `#FEF3C7`):** Sorotan perayaan ulang tahun ke-10 dan penanda peringkat teratas.
- **Semantic Danger (`#BE123C`):** Khusus penanda error, pembatalan, atau eliminasi permainan.

## Typography
- **Display & Heading (`Fredoka`, sans-serif):** Selaras dengan lekukan huruf pada logo `Asset 2.webp` ("HAPPY ANNIVERSARY TL 2016").
- **Body & UI (`DM Sans`, sans-serif):** Bersih, manusiawi, mudah dibaca pada narasi Bahasa Indonesia tanpa menjadi font klise.
- **Tabular & Kode (`JetBrains Mono`, monospace):** Dibatasi khusus untuk angka hitung mundur, NIM, skor, dan kode ruangan agar digit sejajar (`tabular-nums`).

## Structural Anti-Slop Rules
- Tidak memakai eyebrow/kicker huruf kapital di atas judul.
- Tidak memakai emoji sebagai pengganti ikon navigasi atau tombol; gunakan ikon garis SVG seragam (`strokeWidth="1.75"`).
- Hindari kotak kartu seragam dan kotak bersarang (*nested cards*); gunakan tata letak editorial dengan garis pembatas tipis (`divide-y`) dan ruang napas yang jelas.
