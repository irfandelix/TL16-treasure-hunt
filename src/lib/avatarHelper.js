import { Avatar } from '@opeepsfun/avatar-illustration-system';
import { supabase } from './supabaseClient';

export const SKIN_PALETTE = [
  { hex: '#F9DFC6', label: 'Putih Cerah' },
  { hex: '#F3D2B3', label: 'Kuning Langsat' },
  { hex: '#D5A177', label: 'Sawo Matang' },
  { hex: '#AC6651', label: 'Cokelat Hangat' },
  { hex: '#7A4734', label: 'Gelap' }
];

export const CIRCLE_PALETTE = [
  { hex: '#D1FAE5', label: 'Hijau Mint' },
  { hex: '#DBEAFE', label: 'Biru Langit' },
  { hex: '#FEF3C7', label: 'Krem Hangat' },
  { hex: '#FFE4E6', label: 'Merah Muda' },
  { hex: '#EDE9FE', label: 'Ungu Lembut' },
  { hex: '#E2E8F0', label: 'Abu Bersih' }
];

export const HAIR_PALETTE = [
  { hex: '#171921', label: 'Hitam' },
  { hex: '#8C7263', label: 'Mocca / Cokelat Susu' },
  { hex: '#5C3A21', label: 'Cokelat Tua' },
  { hex: '#B45309', label: 'Cokelat Terang' },
  { hex: '#E11D48', label: 'Merah Marun' },
  { hex: '#047857', label: 'Hijau TL' },
  { hex: '#2563EB', label: 'Biru' },
  { hex: '#D6C7B2', label: 'Krem' }
];

export const SHIRT_PALETTE = [
  { hex: '#059669', label: 'Hijau TL' },
  { hex: '#0F172A', label: 'Hitam' },
  { hex: '#F59E0B', label: 'Kuning Amber' },
  { hex: '#E11D48', label: 'Merah' },
  { hex: '#0284C7', label: 'Biru' },
  { hex: '#7C3AED', label: 'Ungu' }
];

export const TOP_CHOICES = [
  { id: 'Fonze', label: 'Fonze' },
  { id: 'Full', label: 'Panjang' },
  { id: 'Pixie', label: 'Pixie' },
  { id: 'Doug', label: 'Keriting' },
  { id: 'MisterT', label: 'Cepak' },
  { id: 'Phantom', label: 'Belah' },
  { id: 'Turban', label: 'Turban' },
  { id: 'Hijab', label: 'Hijab' },
  { id: 'Bald', label: 'Plontos' }
];

export const SHIRT_CHOICES = [
  { id: 'Collared', label: 'Kerah' },
  { id: 'Crew', label: 'Sweater' },
  { id: 'Tee', label: 'Kaos' }
];

export const GLASSES_CHOICES = [
  { id: 'none', label: 'Tanpa' },
  { id: 'Round', label: 'Bulat' },
  { id: 'Square', label: 'Kotak' }
];

export const MOUTH_CHOICES = [
  { id: 'Laughing', label: 'Ketawa' },
  { id: 'Smile', label: 'Senyum' },
  { id: 'Smirk', label: 'Miring' },
  { id: 'Surprised', label: 'Kaget' },
  { id: 'Pucker', label: 'Bibir O' },
  { id: 'Nervous', label: 'Cemas' },
  { id: 'Frown', label: 'Cemberut' },
  { id: 'Sad', label: 'Sedih' }
];

export const EYE_CHOICES = [
  { id: 'Smiling', label: 'Senyum' },
  { id: 'Round', label: 'Bulat' },
  { id: 'Ellipse', label: 'Oval' },
  { id: 'EllipseShadow', label: 'Bayangan' }
];

export const DEFAULT_AVATAR_CONFIG = {
  skinColor: '#F3D2B3',
  circleBg: '#D1FAE5',
  top: 'Fonze',
  topColor: '#171921',
  shirt: 'Collared',
  shirtColor: '#059669',
  glasses: 'none',
  mouth: 'Smile',
  eye: 'Round',
  eyebrow: 'Up'
};

/**
 * Normalize partial or legacy avatar configs into a valid full config object.
 */
export function normalizeAvatarConfig(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AVATAR_CONFIG };
  const validTop = TOP_CHOICES.some((t) => t.id === raw.top) ? raw.top : DEFAULT_AVATAR_CONFIG.top;
  const validShirt = SHIRT_CHOICES.some((s) => s.id === raw.shirt) ? raw.shirt : DEFAULT_AVATAR_CONFIG.shirt;
  const validMouth = MOUTH_CHOICES.some((m) => m.id === raw.mouth) ? raw.mouth : DEFAULT_AVATAR_CONFIG.mouth;
  const validEye = EYE_CHOICES.some((e) => e.id === raw.eye) ? raw.eye : DEFAULT_AVATAR_CONFIG.eye;
  const validGlasses = raw.glasses === 'Round' || raw.glasses === 'Square' ? raw.glasses : 'none';

  return {
    skinColor: typeof raw.skinColor === 'string' ? raw.skinColor : DEFAULT_AVATAR_CONFIG.skinColor,
    circleBg: typeof raw.circleBg === 'string' ? raw.circleBg : DEFAULT_AVATAR_CONFIG.circleBg,
    top: validTop,
    topColor: typeof raw.topColor === 'string' ? raw.topColor : DEFAULT_AVATAR_CONFIG.topColor,
    shirt: validShirt,
    shirtColor: typeof raw.shirtColor === 'string' ? raw.shirtColor : DEFAULT_AVATAR_CONFIG.shirtColor,
    glasses: validGlasses,
    mouth: validMouth,
    eye: validEye,
    eyebrow: typeof raw.eyebrow === 'string' ? raw.eyebrow : DEFAULT_AVATAR_CONFIG.eyebrow
  };
}

/**
 * Generate a deterministic fallback avatar config from a player NIM or seed string.
 */
export function generateSeedAvatarConfig(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const pick = (arr, offset) => arr[(hash + offset) % arr.length];
  return {
    skinColor: pick(SKIN_PALETTE, 1).hex,
    circleBg: pick(CIRCLE_PALETTE, 2).hex,
    top: pick(TOP_CHOICES, 3).id,
    topColor: pick(HAIR_PALETTE, 5).hex,
    shirt: pick(SHIRT_CHOICES, 7).id,
    shirtColor: pick(SHIRT_PALETTE, 11).hex,
    glasses: pick(GLASSES_CHOICES, 13).id,
    mouth: pick(MOUTH_CHOICES, 17).id,
    eye: pick(EYE_CHOICES, 19).id,
    eyebrow: 'Up'
  };
}

function shadeHex(hex, delta) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return hex;
  const r = Math.min(255, Math.max(0, (num >> 16) + delta));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + delta));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + delta));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function drawCustomHijab(hijabColor, outlineColor) {
  const isBlack = hijabColor.toLowerCase() === '#171921';
  const deepShade = isBlack ? '#232836' : shadeHex(hijabColor, -20);
  const foldLine = isBlack ? '#3E465B' : outlineColor;
  return `
    <g id="custom-hijab">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M180 48 C238 48 282 86 288 148 C290 192 284 234 260 264 L92 296 C80 250 76 186 84 128 C94 78 130 48 180 48 Z
           M198 94 C158 94 128 124 128 170 C128 216 150 262 194 268 C236 268 260 228 260 176 C260 126 234 94 198 94 Z"
        fill="${hijabColor}"
        stroke="${outlineColor}"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M88 268 C74 304 60 344 54 384 L276 384 C272 346 266 308 256 268 C222 288 150 292 88 268 Z"
        fill="${deepShade}"
        stroke="${outlineColor}"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M158 312 C152 340 148 362 146 382"
        fill="none"
        stroke="${foldLine}"
        stroke-width="3.5"
        stroke-linecap="round"
      />
      <path
        d="M214 316 C222 342 228 364 232 382"
        fill="none"
        stroke="${foldLine}"
        stroke-width="3.2"
        stroke-linecap="round"
      />
      <path
        d="M86 250 C124 280 192 284 260 250 C272 282 276 320 264 346 C220 368 136 372 78 340 C74 308 78 274 86 250 Z"
        fill="${hijabColor}"
        stroke="${outlineColor}"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M96 302 C148 334 212 336 260 304"
        fill="none"
        stroke="${foldLine}"
        stroke-width="3.5"
        stroke-linecap="round"
      />
    </g>
  `;
}

let svgMaskCounter = 0;

/**
 * Render an SVG string from a normalized avatar config with unique mask IDs.
 */
export function renderOpeepsSvg(config, uniqueHint = '') {
  const cfg = normalizeAvatarConfig(config);
  const isHijab = cfg.top === 'Hijab';
  let raw = Avatar({
    size: 380,
    circle: { backgroundColor: cfg.circleBg },
    top: isHijab ? 'Bald' : cfg.top,
    shirt: cfg.shirt,
    glasses: cfg.glasses === 'none' ? undefined : cfg.glasses,
    mouth: cfg.mouth,
    eye: cfg.eye,
    eyebrow: cfg.eyebrow || 'Up',
    nose: 'Round',
    ear: 'Attached',
    color: {
      outlineColor: '#171921',
      skinColor: cfg.skinColor,
      topColor: cfg.topColor,
      shirtColor: cfg.shirtColor,
      collarColor: '#FFFFFF',
      glassFrameColor: '#171921'
    }
  });

  if (isHijab) {
    raw = raw.replace('<g id="ear"', '<g id="ear" style="display:none"');
    const shirtIdx = raw.indexOf('<g id="shirt"');
    if (shirtIdx !== -1) {
      const shirtEnd = raw.indexOf('</g>', shirtIdx);
      if (shirtEnd !== -1) {
        raw = raw.slice(0, shirtEnd + 4) + '\n' + drawCustomHijab(cfg.topColor, '#171921') + raw.slice(shirtEnd + 4);
      }
    }
  }

  const uid = `opeeps_mask_${uniqueHint ? uniqueHint.replace(/[^a-zA-Z0-9_-]/g, '') : ++svgMaskCounter}`;
  const bgGradId = `${uid}_bg`;
  const bgLight = shadeHex(cfg.circleBg, 6);
  const bgDeep = shadeHex(cfg.circleBg, -18);

  // Replace only the first background circle with an opaque gradient rect so
  // mobile Force Dark classifiers see an opaque portrait rather than an icon.
  raw = raw.replace(
    /<circle cx="190" cy="190" r="190" fill="[^"]*"\s*\/>/,
    `<defs><radialGradient id="${bgGradId}" cx="42%" cy="34%" r="68%"><stop offset="0%" stop-color="${bgLight}"/><stop offset="100%" stop-color="${bgDeep}"/></radialGradient></defs><rect width="380" height="380" fill="url(#${bgGradId})"/>`
  );

  return raw.replaceAll('mask0_65_1039', uid);
}

/**
 * Read a player's saved avatar synchronously from localStorage if present.
 */
export function getLocalAvatarConfig(nim) {
  if (!nim) return null;
  try {
    const raw = localStorage.getItem(`avatar_config_${nim}`);
    if (!raw) return null;
    return normalizeAvatarConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function hasLocalSavedAvatar(nim) {
  if (!nim || typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem(`avatar_saved_${nim}`) === 'true' ||
      Boolean(localStorage.getItem(`avatar_config_${nim}`))
    );
  } catch {
    return false;
  }
}

/**
 * Load a player's saved avatar from localStorage and refresh from Supabase if available.
 */
export async function loadPlayerAvatar(nim) {
  const local = getLocalAvatarConfig(nim);
  if (!nim) return local || { ...DEFAULT_AVATAR_CONFIG };

  try {
    const { data, error } = await supabase
      .from('alumni')
      .select('avatar_config')
      .eq('nim', nim)
      .single();

    if (!error && data?.avatar_config) {
      const normalized = normalizeAvatarConfig(data.avatar_config);
      localStorage.setItem(`avatar_config_${nim}`, JSON.stringify(normalized));
      localStorage.setItem(`avatar_saved_${nim}`, 'true');
      return normalized;
    }
  } catch {
    // Abaikan jika kolom avatar_config belum dibuat di database
  }

  return local || generateSeedAvatarConfig(nim);
}

/**
 * Check whether an alumni has saved avatar customization either locally or in Supabase.
 */
export async function hasSavedPlayerAvatar(nim) {
  if (!nim) return false;
  if (hasLocalSavedAvatar(nim)) return true;

  try {
    const { data, error } = await supabase
      .from('alumni')
      .select('avatar_config')
      .eq('nim', nim)
      .single();

    if (!error && data?.avatar_config) {
      const normalized = normalizeAvatarConfig(data.avatar_config);
      localStorage.setItem(`avatar_config_${nim}`, JSON.stringify(normalized));
      localStorage.setItem(`avatar_saved_${nim}`, 'true');
      return true;
    }
  } catch {
    // Abaikan jika kolom belum tersedia
  }

  return false;
}

/**
 * Save avatar customization to localStorage and Supabase (when supported).
 */
export async function savePlayerAvatar(nim, config) {
  const normalized = normalizeAvatarConfig(config);
  if (!nim) return { savedRemote: false, config: normalized };

  try {
    localStorage.setItem(`avatar_config_${nim}`, JSON.stringify(normalized));
    localStorage.setItem(`avatar_saved_${nim}`, 'true');
  } catch {
    // Abaikan kegagalan storage browser
  }

  let savedRemote = false;
  try {
    const { error: alumniErr } = await supabase
      .from('alumni')
      .update({ avatar_config: normalized })
      .eq('nim', nim);
    if (!alumniErr) savedRemote = true;

    await supabase
      .from('monopoli_users')
      .update({ avatar_config: normalized })
      .eq('nim', nim);
  } catch {
    // Tetap aman memakai penyimpanan lokal bila kolom DB belum tersedia
  }

  return { savedRemote, config: normalized };
}
