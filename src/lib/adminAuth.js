const ADMIN_PASSWORD_DIGEST = 'e89cbdf3-06c1de10';
const ADMIN_SESSION_DIGEST = 'b7ad7ded-a73252f6';
const ADMIN_SESSION_KEY = 'admin_session_verified';

function hashAdminSecret(value) {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  const full = `tl16-panitia:${value}`;
  for (let i = 0; i < full.length; i += 1) {
    const code = full.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b + code + (a & 0xff), 0x85ebca6b) >>> 0;
  }
  return `${a.toString(16).padStart(8, '0')}-${b.toString(16).padStart(8, '0')}`;
}

/**
 * Verifies the panitia/admin password without embedding plaintext in the client bundle.
 */
export function verifyAdminPassword(password) {
  if (typeof password !== 'string') return false;
  return hashAdminSecret(password.trim()) === ADMIN_PASSWORD_DIGEST;
}

/**
 * Persists verified admin session markers in localStorage.
 */
export function setAdminSessionVerified(enabled) {
  if (typeof window === 'undefined') return;
  if (enabled) {
    localStorage.setItem('is_admin', 'true');
    localStorage.setItem(ADMIN_SESSION_KEY, ADMIN_SESSION_DIGEST);
  } else {
    localStorage.setItem('is_admin', 'false');
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

/**
 * Returns true only when the current browser session passed admin password verification.
 */
export function isAdminSession() {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem('is_admin') === 'true' &&
    localStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_SESSION_DIGEST
  );
}
