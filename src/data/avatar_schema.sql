-- Tambahkan kolom avatar_config untuk menyimpan detail kustomisasi karakter ke Supabase
-- Jalankan di Supabase Dashboard -> SQL Editor -> Run

ALTER TABLE public.alumni
ADD COLUMN IF NOT EXISTS avatar_config jsonb;

ALTER TABLE public.monopoli_users
ADD COLUMN IF NOT EXISTS avatar_config jsonb;
