export const MERCY_LIMIT = 20;
export const INITIAL_HAND_SIZE = 7;

export const CARD_COLORS = [
  { name: 'Merah', bg: 'bg-rose-700', border: 'border-rose-400', text: 'text-white' },
  { name: 'Kuning', bg: 'bg-amber-400', border: 'border-amber-200', text: 'text-slate-950' },
  { name: 'Hijau', bg: 'bg-emerald-700', border: 'border-emerald-400', text: 'text-white' },
  { name: 'Biru', bg: 'bg-sky-700', border: 'border-sky-400', text: 'text-white' }
];

export const WILD_COLOR = {
  name: 'Bebas',
  bg: 'bg-zinc-900',
  border: 'border-amber-400',
  text: 'text-amber-300'
};

export const DRAW_POWER = {
  '+2': 2,
  '+4': 4,
  '+6': 6
};

export const WILD_VALUES = new Set(['Titip Absen', '+4', '+6']);

// Weighted pool: numbers stay common enough for smooth flow while brutal action cards show up often.
const WEIGHTED_CARD_POOL = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'Skip', 'Skip',
  'Reverse', 'Reverse',
  '+2', '+2', '+2',
  'Skip Semua',
  'Sapu Bersih',
  'Tukar KTM',
  'Titip Absen',
  '+4', '+4',
  '+6'
];

export const CARD_SUBLABELS = {
  Skip: 'Lewati 1',
  Reverse: 'Putar Balik',
  '+2': 'Tumpuk +2',
  '+4': 'Revisi +4',
  '+6': 'Mengulang +6',
  'Skip Semua': 'Jam Kosong',
  'Sapu Bersih': 'Buang 1 Warna',
  'Tukar KTM': 'Tukar Tangan',
  'Titip Absen': 'Pilih Warna'
};

export const isWildCard = (card) => Boolean(card && WILD_VALUES.has(card.value));

export const getDrawPower = (card) => (card ? DRAW_POWER[card.value] || 0 : 0);

export const generateRandomCard = () => {
  const value = WEIGHTED_CARD_POOL[Math.floor(Math.random() * WEIGHTED_CARD_POOL.length)];
  const color = WILD_VALUES.has(value)
    ? WILD_COLOR
    : CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    color,
    value
  };
};

export const generateInitialTopCard = () => {
  const color = CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
  const value = String(Math.floor(Math.random() * 9) + 1);
  return {
    id: `init-${Date.now()}`,
    color,
    value,
    meta: {
      pendingDraw: 0,
      pendingMinPower: 0,
      eliminatedNims: [],
      unoVulnerableNim: null,
      lastEvent: 'Mode No Mercy dimulai! Batas gugur (DO): 20 kartu.'
    }
  };
};

export const getRoomMeta = (topCard) => {
  const raw = topCard?.meta && typeof topCard.meta === 'object' ? topCard.meta : {};
  return {
    pendingDraw: Number(raw.pendingDraw) || 0,
    pendingMinPower: Number(raw.pendingMinPower) || 0,
    eliminatedNims: Array.isArray(raw.eliminatedNims) ? raw.eliminatedNims : [],
    unoVulnerableNim: raw.unoVulnerableNim || null,
    lastEvent: raw.lastEvent || ''
  };
};

export const isPlayerEliminated = (player, eliminatedNims = []) => {
  if (!player) return true;
  if (eliminatedNims.includes(player.nim)) return true;
  const handLen = Array.isArray(player.hand) ? player.hand.length : 0;
  return handLen >= MERCY_LIMIT;
};

export const getActivePlayers = (players = [], eliminatedNims = []) =>
  players.filter((p) => !isPlayerEliminated(p, eliminatedNims));

export const getNextActivePlayerNim = (
  players = [],
  currentNim,
  direction = 1,
  stepCount = 1,
  eliminatedNims = []
) => {
  const active = getActivePlayers(players, eliminatedNims);
  if (active.length === 0) return currentNim || players[0]?.nim || null;
  if (active.length === 1) return active[0].nim;

  const dir = direction === -1 ? -1 : 1;
  const currentActiveIdx = active.findIndex((p) => p.nim === currentNim);
  if (currentActiveIdx >= 0) {
    const nextIdx = (currentActiveIdx + stepCount * dir + active.length * 10) % active.length;
    return active[nextIdx].nim;
  }

  // Fallback if current player was just eliminated: walk from their seat in full roster
  const fullIdx = players.findIndex((p) => p.nim === currentNim);
  if (fullIdx < 0) return active[0].nim;

  let remainingSteps = Math.max(1, stepCount);
  let cursor = fullIdx;
  for (let i = 0; i < players.length * 3; i++) {
    cursor = (cursor + dir + players.length) % players.length;
    const candidate = players[cursor];
    if (!isPlayerEliminated(candidate, eliminatedNims)) {
      remainingSteps -= 1;
      if (remainingSteps === 0) return candidate.nim;
    }
  }
  return active[0].nim;
};

export const isCardPlayable = (card, topCard, meta = null) => {
  if (!card || !topCard) return false;
  const roomMeta = meta || getRoomMeta(topCard);
  const power = getDrawPower(card);

  // Under a stacking draw attack, ONLY draw cards of equal or higher power can deflect it.
  if (roomMeta.pendingDraw > 0) {
    return power > 0 && power >= Math.max(2, roomMeta.pendingMinPower);
  }

  if (isWildCard(card)) return true;
  return card.color?.name === topCard.color?.name || card.value === topCard.value;
};

export const pickBestWildColor = (hand = []) => {
  const counts = {};
  for (const c of hand) {
    const name = c?.color?.name;
    if (name && name !== 'Bebas') {
      counts[name] = (counts[name] || 0) + 1;
    }
  }
  const bestName = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return CARD_COLORS.find((c) => c.name === bestName) || CARD_COLORS[0];
};

export const pickBotUnoCard = (hand = [], topCard, meta = null) => {
  if (!Array.isArray(hand) || !topCard) return null;
  const roomMeta = meta || getRoomMeta(topCard);
  const playable = hand.filter((card) => isCardPlayable(card, topCard, roomMeta));
  if (playable.length === 0) return null;

  if (roomMeta.pendingDraw > 0) {
    // Use the lowest legal stacking card first to conserve bigger bombs.
    return [...playable].sort((a, b) => getDrawPower(a) - getDrawPower(b))[0];
  }

  const nonWild = playable.find((c) => !isWildCard(c));
  return nonWild || playable[0];
};

export const normalizeCardColor = (card) => {
  if (!card) return card;
  if (card.color?.name === 'Bebas') return { ...card, color: WILD_COLOR };
  const matched = CARD_COLORS.find((c) => c.name === card.color?.name);
  return matched ? { ...card, color: matched } : card;
};
