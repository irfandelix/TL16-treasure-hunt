# PRODUCT.md: Portal Reuni 1 Dekade Teknik Lingkungan 2016 (Sedulur 16)

## Ringkasan Produk
Aplikasi web interaktif untuk perayaan ulang tahun ke-10 (1 Dekade) alumni Teknik Lingkungan UPN "Veteran" Yogyakarta angkatan 2016 (**Sedulur 16**).

## Pengguna & Peran
- **Alumni TL 2016 (63 orang):** Masuk menggunakan NIM angkatan (`alumni`) untuk mengisi Kapsul Waktu, memainkan seluruh mini-game, dan memantau papan klasemen.
- **Panitia / Komting:** Mengatur jadwal pembukaan tiap modul permainan, visibilitas papan klasemen, serta memandu sesi permainan multipemain (*Host*).

## Modul Utama
1. **Kapsul Waktu (`FormKapsulWaktu.jsx`):** Unggah foto terbaru tahun 2026 (terkompresi otomatis) dan pesan ulang tahun ke Supabase Storage (`foto_anniversary`).
2. **Wheel of Family (`WheelOfFamily.jsx`):** Roda undian nostalgia menampilkan perbandingan foto Maba 2016, foto kini 2026, dan pesan angkatan.
3. **Napak Tilas Peta (`TreasureHunt.jsx`):** Kuis tebak 20 lokasi kenangan kampus & Jogja di atas peta satelit Leaflet dengan sistem poin jarak.
4. **Tebak Foto Kenangan (`FaceGame.jsx`):** Kuis 20 foto blur bertahap yang semakin jelas seiring waktu berjalan.
5. **Monopoli TL16 (`MonopoliBoard.jsx`):** Papan monopoli multipemain *real-time* bertema lokasi kampus dengan kartu Dana Umum, Kesempatan, dan Truth or Dare.
6. **Sidang Dosen Killer (`DosenKillerGame.jsx`):** Permainan deduksi sosial (Malam, Pagi, Diskusi, Voting) dengan peran Dosen Killer, Intel, Ahli, dan Uptodate.
7. **UNO Sedulur 16 (`UnoBrutalGame.jsx`):** Permainan kartu multipemain *real-time* dengan giliran, kartu `+2`, `Skip`, dan `Titip Absen`.
8. **Magical Athlete TL16 (`MagicalAthleteGame.jsx`):** Balap karakter sains lingkungan 4 ronde dengan fase Snake Draft dan skill unik tiap karakter.
9. **Klasemen (`ScoreBoard.jsx`) & Panel Panitia (`AdminDashboard.jsx`):** Akumulasi skor lintas permainan dan pengaturan jadwal buka modul via `app_settings`.
