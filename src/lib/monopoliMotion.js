export const MONOPOLI_BOARD_SIZE = 40;
export const MONOPOLI_GRID_DIM = 11;

export const normalizeTilePos = (pos) => {
  const n = Math.floor(Number(pos) || 0);
  return ((n % MONOPOLI_BOARD_SIZE) + MONOPOLI_BOARD_SIZE) % MONOPOLI_BOARD_SIZE;
};

export const getTileGridCoords = (tileId) => {
  const id = normalizeTilePos(tileId);
  if (id === 0) return { row: 10, col: 10 };
  if (id <= 9) return { row: 10, col: 10 - id };
  if (id === 10) return { row: 10, col: 0 };
  if (id <= 19) return { row: 20 - id, col: 0 };
  if (id === 20) return { row: 0, col: 0 };
  if (id <= 29) return { row: 0, col: id - 20 };
  if (id === 30) return { row: 0, col: 10 };
  return { row: id - 30, col: 10 };
};

export const getTileCenterPercent = (tileId) => {
  const { row, col } = getTileGridCoords(tileId);
  return {
    x: ((col + 0.5) / MONOPOLI_GRID_DIM) * 100,
    y: ((row + 0.5) / MONOPOLI_GRID_DIM) * 100
  };
};

// Offsets in board percentage (one tile is ~9.09% wide, keeping all 6 pawns inside the tile bounds).
const SLOT_LAYOUTS = {
  1: [{ dx: 0, dy: 1.0 }],
  2: [
    { dx: -1.75, dy: 1.1 },
    { dx: 1.75, dy: 1.1 }
  ],
  3: [
    { dx: -1.9, dy: 1.5 },
    { dx: 0, dy: -1.35 },
    { dx: 1.9, dy: 1.5 }
  ],
  4: [
    { dx: -1.75, dy: -1.35 },
    { dx: 1.75, dy: -1.35 },
    { dx: -1.75, dy: 1.65 },
    { dx: 1.75, dy: 1.65 }
  ],
  5: [
    { dx: -2.2, dy: -1.35 },
    { dx: 0, dy: -1.35 },
    { dx: 2.2, dy: -1.35 },
    { dx: -1.45, dy: 1.7 },
    { dx: 1.45, dy: 1.7 }
  ],
  6: [
    { dx: -2.2, dy: -1.35 },
    { dx: 0, dy: -1.35 },
    { dx: 2.2, dy: -1.35 },
    { dx: -2.2, dy: 1.7 },
    { dx: 0, dy: 1.7 },
    { dx: 2.2, dy: 1.7 }
  ]
};

export const getPawnSlotOffset = (slotIndex = 0, totalOnTile = 1) => {
  const clampedTotal = Math.max(1, Math.min(6, Number(totalOnTile) || 1));
  const layout = SLOT_LAYOUTS[clampedTotal] || SLOT_LAYOUTS[6];
  const idx = Math.max(0, Math.min(layout.length - 1, Number(slotIndex) || 0));
  return layout[idx];
};

export const computePawnMovePlan = (fromPos, toPos) => {
  const from = normalizeTilePos(fromPos);
  const to = normalizeTilePos(toPos);
  if (from === to) return { mode: 'none', steps: [] };

  const forward = (to - from + MONOPOLI_BOARD_SIZE) % MONOPOLI_BOARD_SIZE;
  if (forward >= 1 && forward <= 12) {
    const steps = [];
    for (let i = 1; i <= forward; i++) {
      steps.push((from + i) % MONOPOLI_BOARD_SIZE);
    }
    return { mode: 'step', steps };
  }

  const backward = (from - to + MONOPOLI_BOARD_SIZE) % MONOPOLI_BOARD_SIZE;
  if (backward >= 1 && backward <= 6) {
    const steps = [];
    for (let i = 1; i <= backward; i++) {
      steps.push((from - i + MONOPOLI_BOARD_SIZE) % MONOPOLI_BOARD_SIZE);
    }
    return { mode: 'step', steps };
  }

  return { mode: 'swoop', steps: [to] };
};
