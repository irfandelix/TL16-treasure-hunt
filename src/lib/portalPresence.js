export function getSafePresenceActivityLabel(
  view,
  {
    hasTestAccess = false,
    isKapsulUnlocked = false,
    isMonopoliUnlocked = false,
    isWerewolfUnlocked = false,
    isUnoUnlocked = false,
    isAthleteUnlocked = false,
    wheelUnlocked = false
  } = {}
) {
  switch (view) {
    case 'dashboard':
      return 'Di Beranda';
    case 'map':
      return 'Tebak Lokasi';
    case 'face':
      return 'Tebak Foto';
    case 'updates':
      return 'Catatan Update';
    case 'kapsul':
      return hasTestAccess || isKapsulUnlocked ? 'Kapsul Waktu' : 'Di Portal';
    case 'monopoli':
      return hasTestAccess || isMonopoliUnlocked ? 'Monopoli' : 'Di Portal';
    case 'dosenkiller':
      return hasTestAccess || isWerewolfUnlocked ? 'Dosen Killer' : 'Di Portal';
    case 'unobrutal':
      return hasTestAccess || isUnoUnlocked ? 'UNO' : 'Di Portal';
    case 'athlete':
      return hasTestAccess || isAthleteUnlocked ? 'Magical Athlete' : 'Di Portal';
    case 'wheel':
      return hasTestAccess || wheelUnlocked ? 'Wheel of Family' : 'Di Portal';
    default:
      return 'Di Portal';
  }
}

export function normalizePresenceUsers(presenceState = {}, selfUser = null) {
  const byNim = new Map();

  Object.entries(presenceState || {}).forEach(([key, entries]) => {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const latest = entries[entries.length - 1] || {};
    const nim = String(latest.nim || key || '').trim();
    if (!nim) return;
    const nama = String(latest.nama || '').trim() || `Alumni ${nim}`;
    byNim.set(nim, {
      nim,
      nama,
      view: latest.view || 'dashboard',
      onlineAt: latest.online_at || ''
    });
  });

  if (selfUser?.nim && !byNim.has(selfUser.nim)) {
    byNim.set(selfUser.nim, {
      nim: selfUser.nim,
      nama: selfUser.nama || `Alumni ${selfUser.nim}`,
      view: selfUser.view || 'dashboard',
      onlineAt: ''
    });
  }

  return Array.from(byNim.values()).sort((a, b) => {
    if (selfUser?.nim && a.nim === selfUser.nim) return -1;
    if (selfUser?.nim && b.nim === selfUser.nim) return 1;
    return a.nama.localeCompare(b.nama, 'id');
  });
}
