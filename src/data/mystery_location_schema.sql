-- Tambahkan kolom mystery_location untuk mencatat koordinat satu kali dari Tombol Misteri
-- Jalankan di Supabase Dashboard -> SQL Editor -> Run

ALTER TABLE public.alumni
ADD COLUMN IF NOT EXISTS mystery_location jsonb;
