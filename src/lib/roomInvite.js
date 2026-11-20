export const VALID_INVITE_GAMES = ['monopoli', 'dosenkiller', 'unobrutal', 'athlete'];
const PENDING_INVITE_KEY = 'sedulur16_pending_invite';

/**
 * Parse a `?join=game:CODE` value into a validated invite object or null.
 */
export function parseRoomInviteParam(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  const sepIdx = trimmed.indexOf(':');
  if (sepIdx <= 0) return null;

  const game = trimmed.slice(0, sepIdx).trim().toLowerCase();
  const code = trimmed.slice(sepIdx + 1).trim().toUpperCase();
  if (!VALID_INVITE_GAMES.includes(game)) return null;
  if (!/^[A-Z0-9-]{2,16}$/.test(code)) return null;

  return { game, code };
}

export function buildRoomInviteUrl(gameKey, roomCode) {
  if (typeof window === 'undefined' || !gameKey || !roomCode) return '';
  const cleanCode = String(roomCode).trim().toUpperCase();
  const url = new URL(window.location.origin + '/');
  url.searchParams.set('join', `${gameKey}:${cleanCode}`);
  return url.toString();
}

/**
 * Capture `?join=...` from the URL into sessionStorage and strip it from the address bar.
 */
export function captureInviteFromUrl() {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('join');
    if (!raw) return null;

    const parsed = parseRoomInviteParam(raw);
    url.searchParams.delete('join');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);

    if (parsed) {
      sessionStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readPendingInvite() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parseRoomInviteParam(`${parsed?.game || ''}:${parsed?.code || ''}`);
  } catch {
    return null;
  }
}

export function clearPendingInvite() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // Abaikan jika storage dibatasi browser
  }
}

/**
 * Copy text to clipboard with textarea fallback for older mobile WebViews.
 */
export async function copyTextToClipboard(text) {
  if (!text || typeof window === 'undefined') return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Lanjut ke fallback DOM
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
