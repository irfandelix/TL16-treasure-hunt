import { supabase } from './supabaseClient';

export const FINISHED_ROOM_TTL_MS = 30 * 60 * 1000;

export function pickFinishedTimestamp(candidates = []) {
  for (const value of candidates) {
    if (!value) continue;
    const ms = typeof value === 'number' ? value : new Date(value).getTime();
    if (!Number.isNaN(ms) && ms > 0) return ms;
  }
  return null;
}

export function isRoomExpired(timestampValue, now = Date.now(), ttlMs = FINISHED_ROOM_TTL_MS) {
  const ms = Array.isArray(timestampValue)
    ? pickFinishedTimestamp(timestampValue)
    : pickFinishedTimestamp([timestampValue]);
  if (ms === null) return false;
  return now - ms >= ttlMs;
}

export function getFinishedRoomTimestampMs(gameKey, row) {
  if (!row || typeof row !== 'object') return null;
  if (gameKey === 'monopoli') {
    return pickFinishedTimestamp([row.last_active, row.updated_at, row.created_at]);
  }
  if (gameKey === 'dosenkiller') {
    return pickFinishedTimestamp([row.waktu_berakhir, row.updated_at, row.created_at]);
  }
  if (gameKey === 'unobrutal') {
    return pickFinishedTimestamp([row.top_card?.finishedAt, row.updated_at, row.created_at]);
  }
  if (gameKey === 'athlete') {
    return pickFinishedTimestamp([row.updated_at, row.created_at]);
  }
  return null;
}

export function isFinishedRoomExpired(gameKey, row, now = Date.now(), ttlMs = FINISHED_ROOM_TTL_MS) {
  const ms = getFinishedRoomTimestampMs(gameKey, row);
  if (ms === null) return false;
  return now - ms >= ttlMs;
}

/**
 * Remove finished rooms older than 30 minutes for the given multiplayer game.
 * shortcut: cleanup runs opportunistically from clients on lobby/join because there is no Supabase pg_cron job configured; upgrade to a scheduled DB job if strict background purging is ever needed.
 */
export async function cleanupFinishedRooms(gameKey, client = supabase, now = Date.now()) {
  try {
    if (gameKey === 'monopoli') {
      const { data: rows } = await client
        .from('monopoli_rooms')
        .select('id, last_active')
        .eq('status', 'finished');
      const expiredIds = (rows || [])
        .filter((r) => isFinishedRoomExpired('monopoli', r, now))
        .map((r) => r.id);
      if (expiredIds.length === 0) return 0;

      await client.from('monopoli_properties').delete().in('room_id', expiredIds);
      await client.from('monopoli_players').delete().in('room_id', expiredIds);
      await client.from('monopoli_rooms').delete().in('id', expiredIds);
      return expiredIds.length;
    }

    if (gameKey === 'dosenkiller') {
      const { data: rows } = await client
        .from('dosen_killer_state')
        .select('*')
        .eq('fase_game', 'SELESAI');
      const expiredCodes = (rows || [])
        .filter((r) => isFinishedRoomExpired('dosenkiller', r, now))
        .map((r) => r.room_code);
      if (expiredCodes.length === 0) return 0;

      await client.from('dosen_killer_chat').delete().in('room_code', expiredCodes);
      await client.from('mahasiswa_roles').delete().in('room_code', expiredCodes);
      await client.from('dosen_killer_state').delete().in('room_code', expiredCodes);
      return expiredCodes.length;
    }

    if (gameKey === 'unobrutal') {
      const { data: rows } = await client
        .from('uno_rooms')
        .select('*')
        .eq('status', 'finished');
      const expiredCodes = (rows || [])
        .filter((r) => isFinishedRoomExpired('unobrutal', r, now))
        .map((r) => r.room_code);
      if (expiredCodes.length === 0) return 0;

      await client.from('uno_players').delete().in('room_code', expiredCodes);
      await client.from('uno_rooms').delete().in('room_code', expiredCodes);
      return expiredCodes.length;
    }

    if (gameKey === 'athlete') {
      const { data: rows } = await client
        .from('athlete_rooms')
        .select('room_code, updated_at, created_at')
        .eq('status', 'GAME_OVER');
      const expiredCodes = (rows || [])
        .filter((r) => isFinishedRoomExpired('athlete', r, now))
        .map((r) => r.room_code);
      if (expiredCodes.length === 0) return 0;

      await client.from('athlete_players').delete().in('room_code', expiredCodes);
      await client.from('athlete_rooms').delete().in('room_code', expiredCodes);
      return expiredCodes.length;
    }
  } catch {
    // Abaikan kegagalan pembersihan agar tidak menghambat lobi permainan
  }
  return 0;
}
