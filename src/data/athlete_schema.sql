-- Skrip SQL untuk Game Magical Athlete (TL16 Edition)
-- Jalankan di Supabase Dashboard -> SQL Editor -> Run

-- 1. Tabel Ruang Permainan (athlete_rooms)
CREATE TABLE IF NOT EXISTS public.athlete_rooms (
  room_code text PRIMARY KEY,
  admin_nim text NOT NULL,
  status text NOT NULL DEFAULT 'LOBBY', -- 'LOBBY', 'DRAFT', 'RACE_SELECT', 'RACING', 'ROUND_OVER', 'GAME_OVER'
  current_round integer NOT NULL DEFAULT 1,
  current_turn_slot integer NOT NULL DEFAULT 1,
  draft_turn_index integer NOT NULL DEFAULT 0,
  draft_order jsonb DEFAULT '[]'::jsonb,
  pool_characters jsonb DEFAULT '[]'::jsonb,
  last_action text DEFAULT 'Ruang balapan berhasil dibuat oleh Admin.',
  round_winners jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Pemain dalam Ruang (athlete_players)
CREATE TABLE IF NOT EXISTS public.athlete_players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text NOT NULL REFERENCES public.athlete_rooms(room_code) ON DELETE CASCADE,
  slot_number integer NOT NULL, -- 1, 2, 3, 4
  nim text NOT NULL,
  nama text NOT NULL,
  is_bot boolean DEFAULT false,
  color text NOT NULL, -- 'blue', 'red', 'green', 'gold'
  drafted_characters jsonb DEFAULT '[]'::jsonb, -- 4 karakter hasil draft
  active_character_id text, -- Karakter yang diturunkan di ronde saat ini
  used_characters jsonb DEFAULT '[]'::jsonb, -- Karakter yang sudah terpakai
  position integer DEFAULT 0, -- Posisi petak lintasan (0 - 24)
  score integer DEFAULT 0, -- Total poin akumulasi medali
  skill_used boolean DEFAULT false,
  is_ready boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(room_code, slot_number),
  UNIQUE(room_code, nim)
);

-- 3. Row Level Security (RLS) Permissive agar lancar dimainkan realtime
ALTER TABLE public.athlete_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions on athlete_rooms" ON public.athlete_rooms;
CREATE POLICY "Allow all actions on athlete_rooms" ON public.athlete_rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions on athlete_players" ON public.athlete_players;
CREATE POLICY "Allow all actions on athlete_players" ON public.athlete_players FOR ALL USING (true) WITH CHECK (true);

-- 4. Aktifkan Supabase Realtime untuk kedua tabel ini
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'athlete_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.athlete_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'athlete_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.athlete_players;
  END IF;
END $$;
