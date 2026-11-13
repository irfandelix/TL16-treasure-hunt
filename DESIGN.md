# DESIGN.md: Perayaan 1 Dekade Sedulur 16 (Ulang Tahun Ceria)

## Design Read
Reading this as: Portal perayaan & arena permainan interaktif 1 Dekade Teknik Lingkungan 2016 (Sedulur 16), dengan gaya visual **Ulang Tahun Ceria (Festive Anniversary Arcade)**, dial `ENERGY 2 / RHYTHM 2 / MOTION 2`.

## Three Dials
- **Dial:** `ENERGY 2 / RHYTHM 2 / MOTION 2`
- **ENERGY 2 (Balanced Festive):** Hangat, meriah, dan akrab untuk reuni satu angkatan tanpa tumpukan glow atau efek sci-fi berlebihan.
- **RHYTHM 2 (Consistent with Deliberate Breaks):** Menampilkan kartu utama (Kapsul Waktu & Wheel of Family) sebagai focal point perayaan (full-width banner), dipadukan dengan grid permainan kenangan yang bervariasi sesuai hierarki konten, lalu tabel Klasemen.
- **MOTION 2 (Purposeful Transitions):** Transisi halus pada interaksi tombol/kartu dan animasi permainan (putaran roda, lemparan dadu) yang sepenuhnya mematuhi `@media (prefers-reduced-motion: reduce)` tanpa loop `animate-bounce` atau `animate-pulse` tanpa henti.

## Color Palette (R-29 & R-25 WCAG AA Verified)
- **Core 1 — Malam Perayaan (`#0f172a` `slate-900` & `#1e293b` `slate-800`):** Kanvas dasar yang menjaga keterbacaan logo resmi `Asset 2.webp` (yang memiliki huruf kuning cerah `#FACC15`) sekaligus memberi kontras tinggi untuk teks utama `#f8fafc` (`slate-50`, >15:1) dan teks sekunder `#cbd5e1` (`slate-300`, 9.85:1) serta `#94a3b8` (`slate-400`, 5.71:1).
- **Core 2 — Hijau Teknik Lingkungan (`#34d399` `emerald-400` / `#047857` `emerald-700`):** Warna identitas jurusan Teknik Lingkungan 2016; digunakan sebagai teks/ikon di atas latar gelap (7.61:1) atau tombol aksi sekunder dengan teks putih di atas `emerald-700` (5.48:1).
- **Accent — Kuning Emas Perayaan (`#fbbf24` `amber-400` dengan teks `#020617` `slate-950`):** Satu-satunya warna aksen utama untuk momen kunci perayaan ulang tahun dan CTA utama (kontras 12.08:1).
- **Status Semantik — Merah Rose (`#fb7185` `rose-400` / `#be123c` `rose-700`):** Khusus penanda bahaya, error, atau eliminasi permainan (kontras 5.44:1 / 6.29:1).

## Typography (R-06)
- **Display & Heading (`Fredoka`, sans-serif):** Dipilih karena bentuk membulat yang hangat, ceria, dan selaras dengan lekukan huruf pada logo `Asset 2.webp` ("HAPPY ANNIVERSARY TL 2016").
- **Body & UI (`Plus Jakarta Sans`, sans-serif):** Dipilih untuk keterbacaan optimal pada teks antarmuka Bahasa Indonesia di layar ponsel maupun desktop.
- **Tabular & Kode (`JetBrains Mono`, monospace):** Dibatasi khusus untuk angka hitung mundur, NIM, skor tabel, dan kode ruangan 4–6 karakter agar lebar digit sejajar.

## Identity Motif
- **Pita & Lencana 1 Dekade ("10 Tahun Sedulur 16"):** Aksen sudut membulat hangat (`rounded-2xl` untuk kartu, `rounded-xl` untuk tombol/input, `rounded-md` untuk badge status) dengan bingkai emas tipis (`border-amber-400/40`) pada elemen perayaan utama.

## One-Line Reasons for Major Decisions (R-31)
- **Why this color:** Kanvas `slate-900` membuat huruf kuning cerah pada logo resmi `Asset 2.webp` terbaca jelas, sementara aksen emas `amber-400` dan hijau `emerald-400` menghadirkan suasana ulang tahun jurusan Teknik Lingkungan dengan kontras WCAG AA > 5.4:1.
- **Why this layout:** Dashboard menempatkan fitur utama perayaan (Kapsul Waktu & Wheel of Family) sebagai banner sorotan penuh di bagian atas, diikuti daftar permainan dengan hierarki berbeda, lalu papan klasemen.
- **Why this typography:** `Fredoka` menyatu dengan karakter huruf membulat pada logo ulang tahun TL 2016, `Plus Jakarta Sans` menjaga keterbacaan narasi, dan `font-mono` hanya dipakai pada kode ruangan, NIM, serta angka waktu.
- **Why this spacing:** Jarak antar-bagian menggunakan skala responsif (`p-4 md:p-8`, `gap-4 md:gap-6`) agar proporsional di layar ponsel tanpa membuang ruang vertikal.
- **Why use cards:** Kartu dipakai untuk mengelompokkan tiap modul mini-game dengan variasi ukuran (banner unggulan vs kartu standar) agar pemain langsung mengenali prioritas acara.
- **Why use icons:** Ikon hanya dipakai sebagai penanda visual kategori permainan (peta, foto, kapsul, roda putar, dadu) dengan `aria-hidden="true"`, tanpa taburan emoji dekoratif pada teks tombol atau judul.
