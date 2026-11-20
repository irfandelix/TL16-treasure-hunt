import { supabase } from './supabaseClient';
import { isAdminSession } from './adminAuth';

export const EARLY_ACCESS_RECORD_TYPE = 'early_access';
export const EARLY_ACCESS_RECORD_ID = '__early_access_config__';
export const KAPSUL_RECORD_TYPE = 'kapsul_schedule';
export const KAPSUL_RECORD_ID = '__kapsul_schedule_config__';

export const DEFAULT_EARLY_ACCESS_CONFIG = {
  nims: [],
  start_at: null,
  end_at: null
};

export const DEFAULT_KAPSUL_CONFIG = {
  enabled: false,
  unlock_at: null
};

function normalizeValidIso(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : value;
}

function isInternalConfigRecord(item) {
  if (!item || typeof item !== 'object') return false;
  return (
    item.__type === EARLY_ACCESS_RECORD_TYPE ||
    item.id === EARLY_ACCESS_RECORD_ID ||
    item.__type === KAPSUL_RECORD_TYPE ||
    item.id === KAPSUL_RECORD_ID
  );
}

/**
 * Extract the early-access configuration stored inside app_settings.patch_notes
 * (so no manual Supabase column migration is required).
 */
export function extractEarlyAccessConfig(settingsRow) {
  const notes = Array.isArray(settingsRow?.patch_notes) ? settingsRow.patch_notes : [];
  const raw = notes.find(
    (item) => item && (item.__type === EARLY_ACCESS_RECORD_TYPE || item.id === EARLY_ACCESS_RECORD_ID)
  );
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_EARLY_ACCESS_CONFIG };
  }
  const nims = Array.isArray(raw.nims)
    ? [...new Set(raw.nims.map((n) => String(n || '').trim()).filter(Boolean))]
    : [];
  return {
    nims,
    start_at: normalizeValidIso(raw.start_at),
    end_at: normalizeValidIso(raw.end_at)
  };
}

/**
 * Extract the Kapsul Waktu toggle & scheduled unlock date stored inside app_settings.patch_notes.
 * Defaults to OFF (enabled: false) when no record exists yet.
 */
export function extractKapsulConfig(settingsRow) {
  const notes = Array.isArray(settingsRow?.patch_notes) ? settingsRow.patch_notes : [];
  const raw = notes.find(
    (item) => item && (item.__type === KAPSUL_RECORD_TYPE || item.id === KAPSUL_RECORD_ID)
  );
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_KAPSUL_CONFIG };
  }
  return {
    enabled: Boolean(raw.enabled),
    unlock_at: normalizeValidIso(raw.unlock_at)
  };
}

/**
 * Return only user-visible panitia patch notes (filtering out internal config records).
 */
export function filterVisiblePatchNotes(patchNotes) {
  if (!Array.isArray(patchNotes)) return [];
  return patchNotes.filter((item) => item && !isInternalConfigRecord(item));
}

/**
 * Merge internal app configuration records into patch_notes while preserving visible notes
 * and any existing config omitted from the partial update.
 */
export function mergeAppConfigsIntoPatchNotes(existingPatchNotes, { earlyAccess, kapsul } = {}) {
  const visible = filterVisiblePatchNotes(existingPatchNotes);
  const resolvedEa = earlyAccess ?? extractEarlyAccessConfig({ patch_notes: existingPatchNotes });
  const resolvedKapsul = kapsul ?? extractKapsulConfig({ patch_notes: existingPatchNotes });

  const cleanNims = Array.isArray(resolvedEa?.nims)
    ? [...new Set(resolvedEa.nims.map((n) => String(n || '').trim()).filter(Boolean))]
    : [];

  const eaRecord = {
    id: EARLY_ACCESS_RECORD_ID,
    __type: EARLY_ACCESS_RECORD_TYPE,
    nims: cleanNims,
    start_at: normalizeValidIso(resolvedEa?.start_at),
    end_at: normalizeValidIso(resolvedEa?.end_at)
  };

  const kapsulRecord = {
    id: KAPSUL_RECORD_ID,
    __type: KAPSUL_RECORD_TYPE,
    enabled: Boolean(resolvedKapsul?.enabled),
    unlock_at: normalizeValidIso(resolvedKapsul?.unlock_at)
  };

  return [eaRecord, kapsulRecord, ...visible];
}

/**
 * Merge updated early-access config into patch_notes while preserving all visible notes and other configs.
 */
export function mergeEarlyAccessIntoPatchNotes(existingPatchNotes, config, kapsulConfig) {
  return mergeAppConfigsIntoPatchNotes(existingPatchNotes, {
    earlyAccess: config,
    kapsul: kapsulConfig
  });
}

export function isKapsulPubliclyOpen(kapsulConfig, now = Date.now()) {
  if (!kapsulConfig?.enabled) return false;
  if (!kapsulConfig.unlock_at) return true;
  return isPubliclyReleased(kapsulConfig.unlock_at, now);
}

export function getKapsulScheduleStatus(kapsulConfig, now = Date.now()) {
  if (!kapsulConfig?.enabled) return 'off';
  if (kapsulConfig.unlock_at && !isPubliclyReleased(kapsulConfig.unlock_at, now)) {
    return 'scheduled';
  }
  return 'open';
}

/**
 * Return status of the configured early-access window: 'inactive' | 'scheduled' | 'active' | 'expired'.
 */
export function getEarlyAccessWindowStatus(config, now = Date.now()) {
  if (!config || !Array.isArray(config.nims) || config.nims.length === 0) {
    return 'inactive';
  }
  if (!config.start_at || !config.end_at) {
    return 'inactive';
  }
  const startMs = new Date(config.start_at).getTime();
  const endMs = new Date(config.end_at).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return 'inactive';
  }
  if (now < startMs) return 'scheduled';
  if (now > endMs) return 'expired';
  return 'active';
}

export function isEarlyAccessWindowActive(config, now = Date.now()) {
  return getEarlyAccessWindowStatus(config, now) === 'active';
}

export function hasActiveEarlyAccess(config, nim, now = Date.now()) {
  if (!nim || !isEarlyAccessWindowActive(config, now)) return false;
  return config.nims.includes(String(nim).trim());
}

export function isPubliclyReleased(unlockDateIso, now = Date.now()) {
  if (!unlockDateIso) return false;
  const ts = new Date(unlockDateIso).getTime();
  return !Number.isNaN(ts) && now >= ts;
}

/**
 * Pure check deciding whether a multiplayer match should skip writing points to
 * the alumni leaderboard database (unreleased game, admin testing, or early-access session).
 */
export function shouldSkipScoreWrite({
  unlockDateIso,
  earlyAccessConfig,
  participantNims = [],
  isAdminActor = false,
  now = Date.now()
}) {
  if (!isPubliclyReleased(unlockDateIso, now)) {
    return true;
  }

  if (isEarlyAccessWindowActive(earlyAccessConfig, now)) {
    if (isAdminActor) return true;
    const hasTesterInRoom = participantNims.some((nim) =>
      hasActiveEarlyAccess(earlyAccessConfig, nim, now)
    );
    if (hasTesterInRoom) return true;
  }

  return false;
}

/**
 * Fetch fresh app_settings and decide whether a multiplayer session should skip
 * writing points to the official database leaderboard.
 */
export async function checkShouldSkipRoomScoring(gameColumn, participantNims = []) {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date, patch_notes')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Fail safe: if admin is running a test and settings couldn't be read, do not write test points.
      return isAdminSession();
    }

    const eaConfig = extractEarlyAccessConfig(data);
    const unlockDateIso =
      gameColumn === 'monopoli'
        ? data.monopoli_unlock_date
        : gameColumn === 'werewolf'
        ? data.werewolf_unlock_date
        : gameColumn === 'uno'
        ? data.uno_unlock_date
        : null;

    return shouldSkipScoreWrite({
      unlockDateIso,
      earlyAccessConfig: eaConfig,
      participantNims,
      isAdminActor: isAdminSession()
    });
  } catch {
    return isAdminSession();
  }
}

const ALLOWED_SCORE_COLUMNS = new Set(['skor_monopoli', 'skor_werewolf', 'skor_uno', 'skor_athlete']);

/**
 * Safely increment an alumni leaderboard score column with compare-and-swap retries.
 */
export async function awardAlumniPoints(nim, columnName, amount) {
  if (!nim || !amount || amount <= 0 || !ALLOWED_SCORE_COLUMNS.has(columnName)) return false;
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: row, error: readErr } = await supabase
        .from('alumni')
        .select(columnName)
        .eq('nim', nim)
        .single();
      if (readErr || !row) return false;

      const currentVal = Number(row[columnName] || 0);
      const nextVal = currentVal + amount;
      const { data: saved, error: writeErr } = await supabase
        .from('alumni')
        .update({ [columnName]: nextVal })
        .eq('nim', nim)
        .eq(columnName, row[columnName] ?? 0)
        .select(columnName);

      if (writeErr) return false;
      if (saved && saved.length > 0) return true;
    }
  } catch {
    return false;
  }
  return false;
}
