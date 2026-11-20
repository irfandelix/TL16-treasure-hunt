-- Tambahkan kolom skor untuk UNO Sedulur 16 dan Magical Athlete TL 2016
-- Jalankan sekali di Supabase Dashboard -> SQL Editor -> Run

ALTER TABLE public.alumni
  ADD COLUMN IF NOT EXISTS skor_uno integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skor_athlete integer DEFAULT 0;
