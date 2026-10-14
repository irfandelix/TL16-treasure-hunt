// src/data/athleteCharacters.js

export const ATHLETE_CHARACTERS = [
  // --- DIVISI 1: WATER ENGINEERING ---
  {
    id: 'acid_mine',
    name: 'Acid Mine Drainage',
    subname: 'Air Asam Tambang',
    division: 'Water Engineering',
    divisionColor: 'from-amber-600 to-orange-500',
    emoji: '🧪',
    skillName: 'Corrosive Leach',
    skillDesc: 'Sangat korosif! Lawan di petak yang sama terpental mundur 3 petak.',
    type: 'DISRUPTOR'
  },
  {
    id: 'slurry_tailing',
    name: 'Slurry Tailing',
    subname: 'Endapan Tailing',
    division: 'Water Engineering',
    divisionColor: 'from-amber-600 to-orange-500',
    emoji: '🪨',
    skillName: 'Viscous Trap',
    skillDesc: 'Pekat & berat! Lawan yang mencoba menyalip harus berhenti di petaknya.',
    type: 'TANK'
  },
  {
    id: 'alum_coagulant',
    name: 'Alum Coagulant',
    subname: 'Koagulan Tawas',
    division: 'Water Engineering',
    divisionColor: 'from-amber-600 to-orange-500',
    emoji: '💧',
    skillName: 'Flash Flocculation',
    skillDesc: 'Menggumpal cepat! Jika dadu 1 atau 2, boleh lempar ulang ambil tertinggi.',
    type: 'SPEED'
  },
  {
    id: 'groundwater',
    name: 'Groundwater Flow',
    subname: 'Aliran Air Tanah',
    division: 'Water Engineering',
    divisionColor: 'from-amber-600 to-orange-500',
    emoji: '🌊',
    skillName: 'Subsurface Surge',
    skillDesc: 'Arus bawah tanah! Jika disalip lawan, otomatis ikut terseret maju 2 petak.',
    type: 'PARASITE'
  },

  // --- DIVISI 2: WASTEWATER & BIOREMEDIATION ---
  {
    id: 'activated_sludge',
    name: 'Activated Sludge',
    subname: 'Bakteri Lumpur Aktif',
    division: 'Wastewater Treatment',
    divisionColor: 'from-emerald-600 to-teal-500',
    emoji: '🦠',
    skillName: 'Organic Breakdown',
    skillDesc: 'Makan polutan! Dadu bernilai genap (2, 4, 6) mendapat bonus +1 langkah.',
    type: 'SPEED'
  },
  {
    id: 'clarifier_unit',
    name: 'Clarifier Unit',
    subname: 'Kolam Sedimentasi',
    division: 'Wastewater Treatment',
    divisionColor: 'from-emerald-600 to-teal-500',
    emoji: '🏞️',
    skillName: 'Steady Settling',
    skillDesc: 'Aliran terukur! Tiap giliran boleh pilih: lempar dadu 1-6 ATAU maju pasti 3 langkah.',
    type: 'TACTIC'
  },
  {
    id: 'phytoremediation',
    name: 'Phytoremediation',
    subname: 'Bio-Filter Flora',
    division: 'Wastewater Treatment',
    divisionColor: 'from-emerald-600 to-teal-500',
    emoji: '🌲',
    skillName: 'Phyto-Immunity',
    skillDesc: 'Bio-toleran! Kebal terhadap semua petak jebakan & penalti di sepanjang lintasan.',
    type: 'TANK'
  },
  {
    id: 'dissolved_oxygen',
    name: 'Dissolved Oxygen',
    subname: 'Gelembung Aerasi',
    division: 'Wastewater Treatment',
    divisionColor: 'from-emerald-600 to-teal-500',
    emoji: '🫧',
    skillName: 'Oxygen Boost',
    skillDesc: 'Lonjakan oksigen! Khusus di giliran pertama balapan langsung melesat maju +3 petak.',
    type: 'SPEED'
  },

  // --- DIVISI 3: SOLID & HAZARDOUS WASTE ---
  {
    id: 'waste_compactor',
    name: 'Waste Compactor',
    subname: 'Kompaktor Sampah',
    division: 'Solid Waste & B3',
    divisionColor: 'from-red-600 to-rose-500',
    emoji: '🚛',
    skillName: 'Hydraulic Crush',
    skillDesc: 'Tekanan hidrolik! Sekali per balapan: paksa SEMUA lawan mundur 1 petak.',
    type: 'DISRUPTOR'
  },
  {
    id: 'biogas_methane',
    name: 'Biogas Methane',
    subname: 'Gas Metana CH4',
    division: 'Solid Waste & B3',
    divisionColor: 'from-red-600 to-rose-500',
    emoji: '🔥',
    skillName: 'Methane Flare',
    skillDesc: 'Ledakan gas! Selama berada di posisi paling bontot, hasil dadu otomatis +3 langkah.',
    type: 'COMEBACK'
  },
  {
    id: 'leachate',
    name: 'Leachate Concentration',
    subname: 'Cairan Lindi',
    division: 'Solid Waste & B3',
    divisionColor: 'from-red-600 to-rose-500',
    emoji: '☕',
    skillName: 'Toxic Odor',
    skillDesc: 'Bau pekat! Sekali per balapan: tarik pelari terdepan mundur 2 petak.',
    type: 'DISRUPTOR'
  },
  {
    id: 'compost_nutrient',
    name: 'Compost Nutrient',
    subname: 'Kompos Organik',
    division: 'Solid Waste & B3',
    divisionColor: 'from-red-600 to-rose-500',
    emoji: '♻️',
    skillName: 'Bio-Enrichment',
    skillDesc: 'Siklus baru! Setiap kali dadu keluar angka 6, langsung dapat 1x lemparan tambahan.',
    type: 'SPEED'
  },

  // --- DIVISI 4: GEOLOGY & EARTH DYNAMICS ---
  {
    id: 'active_fault',
    name: 'Active Fault',
    subname: 'Patahan Sesar Aktif',
    division: 'Geology & Earth Dynamics',
    divisionColor: 'from-purple-600 to-indigo-500',
    emoji: '⚡',
    skillName: 'Tectonic Shift',
    skillDesc: 'Geser bidang! Boleh membalikkan angka dadu (1 jadi 6, 2 jadi 5, 3 jadi 4).',
    type: 'TACTIC'
  },
  {
    id: 'karst_conduit',
    name: 'Karst Conduit',
    subname: 'Akuifer Karst',
    division: 'Geology & Earth Dynamics',
    divisionColor: 'from-purple-600 to-indigo-500',
    emoji: '🕳️',
    skillName: 'Subterranean Passage',
    skillDesc: 'Lorong goa kapur! Menerobos dan melompati semua rintangan/lawan tanpa hambatan.',
    type: 'SPEED'
  },
  {
    id: 'mass_wasting',
    name: 'Mass Wasting',
    subname: 'Runtuhan Longsoran',
    division: 'Geology & Earth Dynamics',
    divisionColor: 'from-purple-600 to-indigo-500',
    emoji: '⛰️',
    skillName: 'Gravity Slide',
    skillDesc: 'Luncuran tebing! Jika ada lawan 1-2 petak di depan, boleh langsung samakan posisi.',
    type: 'PARASITE'
  },
  {
    id: 'magma_pressure',
    name: 'Magmatic Pressure',
    subname: 'Intrusi Magma',
    division: 'Geology & Earth Dynamics',
    divisionColor: 'from-purple-600 to-indigo-500',
    emoji: '🌋',
    skillName: 'Magma Burst',
    skillDesc: 'Dapur magma! Setelah melewati petak 12, semua hasil dadu otomatis +2 langkah.',
    type: 'COMEBACK'
  }
];

export const TRACK_TILES = [
  { index: 0, label: 'START / FINISH', type: 'start_finish', desc: 'Garis Awal & Garis Akhir' },
  { index: 1, label: '1', type: 'normal' },
  { index: 2, label: '2', type: 'normal' },
  { index: 3, label: '3', type: 'normal' },
  { index: 4, label: '4', type: 'boost', desc: '⚡ Arus Deras (+2 Langkah)' },
  { index: 5, label: '5', type: 'normal' },
  { index: 6, label: '6', type: 'trap', desc: '⚠️ Lumpur Limbah (-2 Langkah)' },
  { index: 7, label: '7', type: 'normal' },
  { index: 8, label: '8', type: 'normal' },
  { index: 9, label: '9', type: 'normal' },
  { index: 10, label: '10', type: 'normal' },
  { index: 11, label: '11', type: 'boost', desc: '⚡ Turbulensi Oksigen (+2 Langkah)' },
  { index: 12, label: '12', type: 'halfway', desc: '🏁 Titik Tengah (Halfway)' },
  { index: 13, label: '13', type: 'normal' },
  { index: 14, label: '14', type: 'trap', desc: '⚠️ Gas Beracun (-2 Langkah)' },
  { index: 15, label: '15', type: 'normal' },
  { index: 16, label: '16', type: 'normal' },
  { index: 17, label: '17', type: 'boost', desc: '⚡ Sesar Gravitasi (+2 Langkah)' },
  { index: 18, label: '18', type: 'normal' },
  { index: 19, label: '19', type: 'trap', desc: '⚠️ Retakan Tanah (-2 Langkah)' },
  { index: 20, label: '20', type: 'normal' },
  { index: 21, label: '21', type: 'normal' },
  { index: 22, label: '22', type: 'normal' },
  { index: 23, label: '23', type: 'normal' },
  { index: 24, label: 'START / FINISH', type: 'start_finish', desc: '🏆 Garis Akhir' }
];

export const PLAYER_COLORS = [
  {
    id: 'blue',
    name: 'Biru Neon',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-400',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
    ring: 'ring-cyan-400',
    badge: 'bg-cyan-500 text-slate-950'
  },
  {
    id: 'red',
    name: 'Merah Crimson',
    bg: 'bg-rose-500/20',
    border: 'border-rose-400',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.6)]',
    ring: 'ring-rose-400',
    badge: 'bg-rose-500 text-white'
  },
  {
    id: 'green',
    name: 'Hijau Zamrud',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-400',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.6)]',
    ring: 'ring-emerald-400',
    badge: 'bg-emerald-500 text-slate-950'
  },
  {
    id: 'gold',
    name: 'Emas Mulia',
    bg: 'bg-amber-500/20',
    border: 'border-amber-400',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]',
    ring: 'ring-amber-400',
    badge: 'bg-amber-500 text-slate-950'
  }
];
