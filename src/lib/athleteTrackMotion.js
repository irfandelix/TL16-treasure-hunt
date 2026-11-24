export const ATHLETE_TRACK_COLS = 8;
export const ATHLETE_TRACK_ROWS = 6;
export const ATHLETE_FINISH_POS = 24;

export const ATHLETE_LOOP_COORDS = {
  0: { col: 1, row: 1, dir: 'Kanan' },
  1: { col: 2, row: 1, dir: 'Kanan' },
  2: { col: 3, row: 1, dir: 'Kanan' },
  3: { col: 4, row: 1, dir: 'Kanan' },
  4: { col: 5, row: 1, dir: 'Kanan' },
  5: { col: 6, row: 1, dir: 'Kanan' },
  6: { col: 7, row: 1, dir: 'Kanan' },
  7: { col: 8, row: 1, dir: 'Turun' },
  8: { col: 8, row: 2, dir: 'Turun' },
  9: { col: 8, row: 3, dir: 'Turun' },
  10: { col: 8, row: 4, dir: 'Turun' },
  11: { col: 8, row: 5, dir: 'Turun' },
  12: { col: 8, row: 6, dir: 'Kiri' },
  13: { col: 7, row: 6, dir: 'Kiri' },
  14: { col: 6, row: 6, dir: 'Kiri' },
  15: { col: 5, row: 6, dir: 'Kiri' },
  16: { col: 4, row: 6, dir: 'Kiri' },
  17: { col: 3, row: 6, dir: 'Kiri' },
  18: { col: 2, row: 6, dir: 'Kiri' },
  19: { col: 1, row: 6, dir: 'Naik' },
  20: { col: 1, row: 5, dir: 'Naik' },
  21: { col: 1, row: 4, dir: 'Naik' },
  22: { col: 1, row: 3, dir: 'Naik' },
  23: { col: 1, row: 2, dir: 'Naik' },
  24: { col: 1, row: 1, dir: 'Finish' }
};

export const clampAthletePos = (pos) =>
  Math.max(0, Math.min(ATHLETE_FINISH_POS, Math.floor(Number(pos) || 0)));

export const getAthleteTilePercent = (pos) => {
  const safe = clampAthletePos(pos);
  const coord = ATHLETE_LOOP_COORDS[safe] || ATHLETE_LOOP_COORDS[0];
  return {
    x: ((coord.col - 0.5) / ATHLETE_TRACK_COLS) * 100,
    y: ((coord.row - 0.5) / ATHLETE_TRACK_ROWS) * 100,
    dir: coord.dir,
    facingLeft: coord.dir === 'Kiri'
  };
};

// Offsets in board percentage (one cell is 12.5% wide x 16.67% tall) for up to 4 runners sharing a tile.
const RUNNER_SLOTS = {
  1: [{ dx: 0, dy: 0 }],
  2: [
    { dx: -2.4, dy: 0.6 },
    { dx: 2.4, dy: -0.6 }
  ],
  3: [
    { dx: -2.6, dy: 1.6 },
    { dx: 0, dy: -2.0 },
    { dx: 2.6, dy: 1.6 }
  ],
  4: [
    { dx: -2.4, dy: -2.0 },
    { dx: 2.4, dy: -2.0 },
    { dx: -2.4, dy: 2.0 },
    { dx: 2.4, dy: 2.0 }
  ]
};

export const getAthleteSlotOffset = (slotIdx = 0, totalOnTile = 1) => {
  const total = Math.max(1, Math.min(4, Number(totalOnTile) || 1));
  const layout = RUNNER_SLOTS[total] || RUNNER_SLOTS[4];
  const idx = Math.max(0, Math.min(layout.length - 1, Number(slotIdx) || 0));
  return layout[idx];
};

export const computeAthleteStepPlan = (fromPos, toPos) => {
  const from = clampAthletePos(fromPos);
  const to = clampAthletePos(toPos);
  if (from === to) return { direction: 'none', steps: [] };

  const direction = to > from ? 'forward' : 'back';
  const delta = direction === 'forward' ? 1 : -1;
  const steps = [];
  for (let p = from + delta; direction === 'forward' ? p <= to : p >= to; p += delta) {
    steps.push(p);
  }
  return { direction, steps };
};
