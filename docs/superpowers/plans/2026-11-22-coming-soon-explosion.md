# Coming Soon Explosion 4 Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menampilkan banner trigger pop-up "COMING SOON" tepat di bawah Tombol Misteri yang meledakkan 4 game multiplayer tanpa kotak secara bertahap (Misterius -> Siluet Mengintip -> Terbuka), lengkap dengan jadwal otomatis dan tombol override manual di Ruang Panitia.

**Architecture:** Konfigurasi jadwal publik `Magical Athlete TL16` dan override tahap per game disimpan dalam `app_settings.patch_notes` lewat `src/lib/earlyAccess.js` tanpa migrasi skema DB. Komponen `src/components/ComingSoonExplosion.jsx` menangani banner trigger dan pop-up ledakan radial memakai 4 aset WebP di `public/games/`, lalu dihubungkan ke `GameDashboard.jsx` dan `AdminDashboard.jsx`.

**Tech Stack:** Astro 5, React 19, Tailwind CSS v4, Sharp (konversi WebP), Node assert test runner, Headless Chrome (verifikasi visual HP & Desktop).

**Spec:** `docs/superpowers/specs/2026-11-22-coming-soon-explosion-design.md`

## Global Constraints

- Pakai 4 aset ilustrasi asli (`vector_1_monopoli_transparan.png`, `vector_2_dosen_killer_transparan.png`, `vector_3_uno_transparan.png`, `vector_5_magical_athlete_transparan.png`) yang dikompres ke WebP di `public/games/`.
- Tanpa kotak di sekeliling 4 ilustrasi game, tanpa kotak putih di belakang stiker 3D **COMING SOON**, tanpa tombol main dobel di dalam pop-up, dan tanpa teks petunjuk di bagian bawah pop-up.
- Pada Tahap 2 (`clue`), tanggal rilis (atau `Menyusul`) diletakkan tepat di bawah bar sensor judul (`redacted`).
- Seluruh tombol interaktif memiliki target sentuh minimal `44px`, aksesibel keyboard (`Escape` menutup pop-up), dan patuh `prefers-reduced-motion`.
- Tidak mengubah struktur tabel database Supabase; seluruh pengaturan baru masuk ke `app_settings.patch_notes`.

## Review Focus

- `patch_notes` lama di produksi yang belum memiliki record `coming_soon_games` harus tetap fallback aman ke default (`athlete_unlock_date: null`, semua override `'auto'`) dan tidak menghilangkan `early_access`, `kapsul_schedule`, atau catatan panitia yang sudah ada saat simpan/tambah/hapus catatan.
- Format tanggal tidak valid atau kosong pada `unlockDateIso` harus aman jatuh ke `'mystery'` (bukan `NaN` atau terbuka tidak sengaja).
- Override `'mystery'` atau `'clue'` harus tetap menahan pembukaan publik meskipun tanggal rilis sudah lewat, sedangkan override `'open'` membuka game meskipun tanggal kosong.
- Saat semua 4 game sudah berstatus publik `'open'`, banner trigger Coming Soon otomatis tidak ditampilkan agar tidak dobel dengan daftar Arena Main Bareng.
- Pada layar HP `390px`, pop-up ledakan tidak boleh menyebabkan overflow horizontal dan seluruh 4 game + stiker tengah harus terlihat rapi.

---

### Task 1: Konversi 4 Aset PNG Asli ke WebP Ringan di `public/games/`

**Files:**
- Create: `public/games/monopoli.webp`
- Create: `public/games/dosen-killer.webp`
- Create: `public/games/uno.webp`
- Create: `public/games/magical-athlete.webp`

**Interfaces:**
- Produces: 4 berkas WebP transparan (`<= 380px`, ukuran ringan) yang dilayani dari `/games/*.webp`.

- [ ] **Step 1: Konversi 4 PNG dari folder artefak ke `public/games/*.webp` dengan `sharp`**
- [ ] **Step 2: Verifikasi keempat berkas WebP ada, tidak kosong, dan dimensinya sesuai**

---

### Task 2: Helper Konfigurasi & Resolusi Tahap 3 Fase di `src/lib/earlyAccess.js`

**Files:**
- Modify: `src/lib/earlyAccess.js`
- Test: `C:\Users\Admin\.gemini\antigravity\brain\9fd9c074-2272-4206-98c7-dcc0f4300075\scratch\test_coming_soon.mjs`

**Interfaces:**
- Produces:
  - `COMING_SOON_RECORD_TYPE`, `COMING_SOON_RECORD_ID`, `DEFAULT_COMING_SOON_CONFIG`, `COMING_SOON_STAGE_MODES`, `DEFAULT_CLUE_WINDOW_MS`
  - `extractComingSoonConfig(settingsRow) -> { athlete_unlock_date: string|null, overrides: { monopoli, werewolf, uno, athlete } }`
  - `mergeAppConfigsIntoPatchNotes(existingPatchNotes, { earlyAccess, kapsul, comingSoon })`
  - `resolveGameStage(unlockDateIso, overrideMode = 'auto', now = Date.now(), clueWindowMs = DEFAULT_CLUE_WINDOW_MS) -> 'mystery' | 'clue' | 'open'`
  - `formatShortReleaseDateId(isoString) -> string` (misal `'5 Des 2026'` atau `'Menyusul'`)

- [ ] **Step 1: Tulis unit test assert (`test_coming_soon.mjs`) untuk `extractComingSoonConfig`, `mergeAppConfigsIntoPatchNotes` (preservasi `early_access`, `kapsul_schedule`, dan patch notes terlihat), `resolveGameStage` (otomatis + 3 override + tanggal invalid), dan `formatShortReleaseDateId`**
- [ ] **Step 2: Jalankan test dan pastikan gagal sebelum implementasi**
- [ ] **Step 3: Implementasikan helper di `src/lib/earlyAccess.js` dan perbarui `checkShouldSkipRoomScoring` untuk membaca `comingSoonConfig` (termasuk `athlete`)**
- [ ] **Step 4: Jalankan test dan pastikan semua lolos**

---

### Task 3: Komponen Banner Trigger & Pop-Up Ledakan (`src/components/ComingSoonExplosion.jsx` + `src/styles/global.css`)

**Files:**
- Create: `src/components/ComingSoonExplosion.jsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `formatShortReleaseDateId` dari `../lib/earlyAccess`, 4 aset `/games/*.webp`.
- Produces: `export default function ComingSoonExplosion({ publicStages, gameDates })`
  - Merender `null` bila keempat game sudah `'open'`.
  - Merender banner trigger hijau + 4 mini siluet + tombol *"Intip 4 Game Coming Soon"*.
  - Saat diklik, membuka modal pop-up dengan shockwave + 24 partikel konfeti + stiker 3D **COMING SOON** tanpa kotak + 4 game menyebar tanpa kotak (Tahap 1 `?` + wiggle, Tahap 2 siluet mengintip + animasi khas + tanggal di bawah bar redacted, Tahap 3 ilustrasi warna penuh + label `Sudah Terbuka` tanpa tombol main, dan tanpa kalimat petunjuk bawah).

- [ ] **Step 1: Tambahkan keyframes animasi scoped `.cs-*` dan blok `prefers-reduced-motion` di `src/styles/global.css`**
- [ ] **Step 2: Buat komponen `src/components/ComingSoonExplosion.jsx`**

---

### Task 4: Integrasi ke `GameDashboard.jsx` dan Kontrol Panitia di `AdminDashboard.jsx`

**Files:**
- Modify: `src/components/GameDashboard.jsx`
- Modify: `src/components/AdminDashboard.jsx`

**Interfaces:**
- Consumes: `extractComingSoonConfig`, `mergeAppConfigsIntoPatchNotes`, `resolveGameStage`, `ComingSoonExplosion`.

- [ ] **Step 1: Hubungkan `comingSoonConfig`, `publicStages`, `isAthleteUnlocked`, guard undangan/rute `#athlete`, banner `<ComingSoonExplosion />` tepat di bawah **Tombol Misteri**, serta daftar **Arena Main Bareng** di `src/components/GameDashboard.jsx`**
- [ ] **Step 2: Tambahkan kontrol jadwal `Magical Athlete TL16` dan pilihan 4 tahap (`Otomatis`, `Misterius`, `Mengintip`, `Terbuka`) untuk keempat game di `src/components/AdminDashboard.jsx`, serta pastikan `handleSave`, `handleAddNote`, dan `handleDeleteNote` meneruskan `comingSoon`**

---

### Task 5: Verifikasi Build, Unit Test, dan Visual HP (390px) & Desktop

**Files:**
- Verify only (tidak menambah berkas sampah di repo)

- [ ] **Step 1: Jalankan `npm run build` dan pastikan lolos tanpa error**
- [ ] **Step 2: Jalankan ulang `test_coming_soon.mjs` dan pastikan semua kasus lolos**
- [ ] **Step 3: Render `ComingSoonExplosion` via esbuild + Headless Chrome pada viewport `390x844` (HP) dan `1280x800` (Desktop) untuk memeriksa trigger banner dan pop-up terbuka (Tahap 1, Tahap 2 tanggal di bawah redacted, tanpa teks bawah, tanpa overflow horizontal)**
