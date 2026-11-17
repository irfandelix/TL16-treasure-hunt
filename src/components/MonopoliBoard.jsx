import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const BOARD_DATA = [
  { id: 0,  name: "START",               type: "corner",   side: 0 },
  { id: 1,  name: "Lapangan Rektorat",   type: "property", price: 60,  rent: 10,  color: "bg-sky-500",    side: 1 },
  { id: 2,  name: "Dana Umum",           type: "event",    side: 1 },
  { id: 3,  name: "Taman TL",            type: "property", price: 80,  rent: 15,  color: "bg-sky-500",    side: 1 },
  { id: 4,  name: "Loket UKT",           type: "tax",      price: 100, side: 1 },
  { id: 5,  name: "Digital Printing",    type: "property", price: 100, rent: 20,  color: "bg-sky-600",    side: 1 },
  { id: 6,  name: "Embung Tambakboyo",   type: "property", price: 110, rent: 22,  color: "bg-sky-600",    side: 1 },
  { id: 7,  name: "Taman Barat",         type: "property", price: 120, rent: 25,  color: "bg-sky-600",    side: 1 },
  { id: 8,  name: "Auditorium",          type: "property", price: 120, rent: 25,  color: "bg-sky-600",    side: 1 },
  { id: 9,  name: "Hutan Pinus",         type: "property", price: 150, rent: 30,  color: "bg-sky-700",    side: 1 },
  { id: 10, name: "RUANG INTEROGASI",    type: "corner",   side: 0 },
  { id: 11, name: "RM Anggrek",          type: "property", price: 180, rent: 40,  color: "bg-pink-500",   side: 2 },
  { id: 12, name: "Lab Lingkungan",      type: "tod",      side: 2 },
  { id: 13, name: "Kontrakan TL 1",      type: "property", price: 200, rent: 50,  color: "bg-pink-500",   side: 2 },
  { id: 14, name: "Kesempatan",          type: "event",    side: 2 },
  { id: 15, name: "Taman Kuliner",       type: "property", price: 220, rent: 60,  color: "bg-pink-600",   side: 2 },
  { id: 16, name: "Secangkir Jawa",      type: "property", price: 240, rent: 70,  color: "bg-pink-600",   side: 2 },
  { id: 17, name: "Perpus Pusat",        type: "property", price: 250, rent: 75,  color: "bg-pink-600",   side: 2 },
  { id: 18, name: "Gumuk Pasir",         type: "property", price: 260, rent: 80,  color: "bg-pink-700",   side: 2 },
  { id: 19, name: "RRI Pro 2",           type: "property", price: 280, rent: 90,  color: "bg-pink-700",   side: 2 },
  { id: 20, name: "SEKRE HIMPUNAN",      type: "corner",   side: 0 },
  { id: 21, name: "Kontrakan TL 2",      type: "property", price: 300, rent: 110, color: "bg-yellow-500", side: 3 },
  { id: 22, name: "Dana Umum",           type: "event",    side: 3 },
  { id: 23, name: "Parkiran Perpus",     type: "property", price: 320, rent: 120, color: "bg-yellow-500", side: 3 },
  { id: 24, name: "Lab Lingkungan",      type: "tod",      side: 3 },
  { id: 25, name: "Bali",                type: "property", price: 350, rent: 130, color: "bg-yellow-600", side: 3 },
  { id: 26, name: "Lapangan Bola",       type: "property", price: 380, rent: 140, color: "bg-yellow-600", side: 3 },
  { id: 27, name: "Lokasi KKN",          type: "property", price: 390, rent: 145, color: "bg-yellow-600", side: 3 },
  { id: 28, name: "Ruang Kelas A",       type: "property", price: 400, rent: 150, color: "bg-yellow-700", side: 3 },
  { id: 29, name: "Ruang Kelas B",       type: "property", price: 420, rent: 160, color: "bg-yellow-700", side: 3 },
  { id: 30, name: "TITIP ABSEN",         type: "corner",   side: 0 },
  { id: 31, name: "Kontrakan TL 3",      type: "property", price: 450, rent: 200, color: "bg-green-500",  side: 4 },
  { id: 32, name: "Kesempatan",          type: "event",    side: 4 },
  { id: 33, name: "Perpustakaan TL",     type: "property", price: 480, rent: 220, color: "bg-green-500",  side: 4 },
  { id: 34, name: "Ruang Dosen",         type: "tax",      price: 200, side: 4 },
  { id: 35, name: "Ruang Sidang",        type: "property", price: 500, rent: 250, color: "bg-green-600",  side: 4 },
  { id: 36, name: "Neon Box TL",         type: "property", price: 520, rent: 280, color: "bg-green-600",  side: 4 },
  { id: 37, name: "Malam Pelepasan",     type: "property", price: 550, rent: 300, color: "bg-green-600",  side: 4 },
  { id: 38, name: "Hal. Perpus",         type: "tax",      price: 250, side: 4 },
  { id: 39, name: "Halaman TL",          type: "property", price: 600, rent: 400, color: "bg-green-700",  side: 4 },
];

const TILE_STRIP_COLOR = {
  corner: 'bg-slate-600', property: '', tax: 'bg-rose-700', event: 'bg-purple-600', tod: 'bg-amber-500',
};
const TILE_TYPE_LABEL = { corner: '', tax: 'PAJAK', event: 'EVENT', tod: 'ToD', property: '' };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const PLAYER_COLOR_OPTIONS = [
  { id: 'bg-red-500', label: 'Merah', textClass: 'text-stone-900' },
  { id: 'bg-blue-500', label: 'Biru', textClass: 'text-stone-900' },
  { id: 'bg-green-500', label: 'Hijau', textClass: 'text-slate-950' },
  { id: 'bg-yellow-400', label: 'Kuning', textClass: 'text-slate-950' },
  { id: 'bg-purple-500', label: 'Ungu', textClass: 'text-stone-900' },
  { id: 'bg-pink-500', label: 'Merah Muda', textClass: 'text-stone-900' },
];

export default function MonopoliBoard() {
  const [appState, setAppState] = useState('lobby');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [currentUser, setCurrentUser] = useState({ nim: '', nama: '', points: 0 });
  const [players, setPlayers] = useState([]);
  const [myState, setMyState] = useState(null);
  const [properties, setProperties] = useState([]);
  const [myAnimPos, setMyAnimPos] = useState(null);

  const [journeyLog, setJourneyLog] = useState([]);
  const [journeyIdx, setJourneyIdx] = useState(0);
  const journeyTimer = useRef(null);

  const [isRolling, setIsRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const [dice, setDice] = useState([1, 1]);
  const [todBank, setTodBank] = useState({ truth: [], dare: [] });
  const [eventsBank, setEventsBank] = useState([]);
  const [showToD, setShowToD] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningText, setSpinningText] = useState('SIAP?');
  const [todType, setTodType] = useState('');
  const [todQuestion, setTodQuestion] = useState('');
  const intervalRef = useRef(null);
  const isTransacting = useRef(false);
  const hasSelectedColor = useRef(false);

  const [showEventCard, setShowEventCard] = useState(false);
  const [activeCard, setActiveCard] = useState({ title: '', text: '' });
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [activeTile, setActiveTile] = useState(null);
  const [activeProp, setActiveProp] = useState(null);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [isBoardZoomed, setIsBoardZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showAssetsModal) setShowAssetsModal(false);
      if (showUpgradeModal) setShowUpgradeModal(false);
      if (showBuyModal) setShowBuyModal(false);
      if (showEventCard) setShowEventCard(false);
      if (showToD && todQuestion) {
        setShowToD(false);
        setTodType('');
        setTodQuestion('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAssetsModal, showUpgradeModal, showBuyModal, showEventCard, showToD, todQuestion]);

  useEffect(() => {
    const initUser = async () => {
      const nim = localStorage.getItem('user_nim');
      const TABEL_ALUMNI = 'alumni';

      if (nim) {
        const { data: user } = await supabase.from(TABEL_ALUMNI).select('*').eq('nim', nim).single();

        if (user) {
          const currentPts = user.skor_monopoli || 0;
          setCurrentUser({
            nim: user.nim,
            nama: user.nama,
            points: currentPts
          });

          // Sinkronkan ke monopoli_users agar constraint foreign key monopoli_players_nim_fkey terpenuhi
          await supabase.from('monopoli_users').upsert(
            [{ nim: user.nim, nama: user.nama, points: currentPts }],
            { onConflict: 'nim' }
          );
        } else {
          alert("NIM tidak ditemukan di database alumni!");
        }
      }

      const { data: t } = await supabase.from('monopoli_tod').select('*');
      if (t) setTodBank({ truth: t.filter(x => x.tipe === 'TRUTH').map(x => x.pertanyaan), dare: t.filter(x => x.tipe === 'DARE').map(x => x.pertanyaan) });
      const { data: e } = await supabase.from('monopoli_events').select('*');
      if (e) setEventsBank(e);
    };
    initUser();
  }, []);

  const createRoom = async () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from('monopoli_rooms').insert([{ id: newCode, status: 'waiting', last_active: new Date() }]);
    joinRoom(newCode);
  };

  const joinRoom = async (code) => {
    const rCode = (code || joinCode).trim();
    if (!rCode) return alert('Masukkan kode ruangan 4 angka terlebih dahulu!');
    if (!currentUser.nim) return alert('Data profil belum siap, silakan muat ulang halaman.');

    const { data: room } = await supabase.from('monopoli_rooms').select('*').eq('id', rCode).single();
    if (!room) return alert('Ruangan tidak ditemukan!');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(room.last_active) < oneHourAgo) return alert('Sesi ruangan sudah kedaluwarsa. Silakan buat ruangan baru.');
    if (room.status === 'finished') return alert('Permainan di ruangan ini sudah selesai!');
    const { data: ep } = await supabase.from('monopoli_players').select('*').eq('room_id', rCode);
    const existingPlayers = ep || [];
    if (existingPlayers.length >= 6 && !existingPlayers.find(p => p.nim === currentUser.nim)) {
      return alert('Ruangan penuh! Maksimal 6 pemain.');
    }

    // Pastikan NIM terdaftar di monopoli_users sebelum insert ke monopoli_players
    await supabase.from('monopoli_users').upsert(
      [{ nim: currentUser.nim, nama: currentUser.nama, points: currentUser.points || 0 }],
      { onConflict: 'nim' }
    );

    await supabase.from('monopoli_players')
      .delete()
      .eq('nim', currentUser.nim)
      .neq('room_id', rCode);

    const myExistingRecord = existingPlayers.find(p => p.nim === currentUser.nim);
    if (!myExistingRecord) {
      hasSelectedColor.current = false;
      const { error: insertError } = await supabase
        .from('monopoli_players')
        .insert([{ room_id: rCode, nim: currentUser.nim, nama: currentUser.nama }]);

      if (insertError) {
        return alert('Gagal bergabung ke ruangan: ' + insertError.message);
      }
    } else {
      hasSelectedColor.current = Boolean(myExistingRecord.color);
    }

    setSelectedInfo(null);
    setCurrentRoom(room);
    setAppState(room.status === 'playing' ? 'game' : 'room');
  };

  const startGame = async () => {
    if (players.length < 4) { if (!window.confirm('Pemain kurang dari 4 orang. Lanjutkan mulai permainan?')) return; }
    await supabase.from('monopoli_rooms').update({ status: 'playing', last_active: new Date() }).eq('id', currentRoom.id);
    setAppState('game');
  };

  const exitGame = async () => {
    hasSelectedColor.current = false;
    setSelectedInfo(null);

    if (!currentRoom) {
      setAppState('lobby');
      return;
    }

    await supabase.from('monopoli_players')
      .delete()
      .match({ nim: currentUser.nim, room_id: currentRoom.id });

    const { data: sisaPemain } = await supabase.from('monopoli_players')
      .select('nim')
      .eq('room_id', currentRoom.id);

    if (!sisaPemain || sisaPemain.length === 0) {
      await supabase.from('monopoli_properties').delete().eq('room_id', currentRoom.id);
      await supabase.from('monopoli_rooms').delete().eq('id', currentRoom.id);
    }

    setAppState('lobby');
    setCurrentRoom(null);
    setMyState(null);
    setPlayers([]);
    setProperties([]);
  };

  const loadGameData = useCallback(async () => {
    if (isTransacting.current || !currentRoom) return;
    const { data: room } = await supabase.from('monopoli_rooms').select('*').eq('id', currentRoom.id).single();
    if (room) {
      setCurrentRoom(room);
      if (room.status === 'finished') setAppState('result');
      else if (room.status === 'playing') setAppState('game');
    }
    const { data: p } = await supabase.from('monopoli_players').select('*').eq('room_id', currentRoom.id);
    const { data: prop } = await supabase.from('monopoli_properties').select('*').eq('room_id', currentRoom.id);
    if (p) {
      setPlayers(p);
      const me = p.find(x => x.nim === currentUser.nim);
      if (!isAnimatingRef.current && !isTransacting.current) {
        setMyState(me);
        if (me) setMyAnimPos(me.pos);
      }
      if (me && !me.color && !hasSelectedColor.current && appState === 'game' && !me.is_bankrupt) setShowColorModal(true);
    }
    if (prop && !isTransacting.current) setProperties(prop);
  }, [currentRoom, appState, currentUser.nim]);

  useEffect(() => {
    if (appState === 'lobby' || !currentRoom) return;

    loadGameData();

    const roomSub = supabase.channel(`rooms:${currentRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monopoli_rooms', filter: `id=eq.${currentRoom.id}` }, () => {
        loadGameData();
      }).subscribe();

    const playersSub = supabase.channel(`players:${currentRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monopoli_players', filter: `room_id=eq.${currentRoom.id}` }, () => {
        loadGameData();
      }).subscribe();

    const propSub = supabase.channel(`props:${currentRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monopoli_properties', filter: `room_id=eq.${currentRoom.id}` }, () => {
        loadGameData();
      }).subscribe();

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(playersSub);
      supabase.removeChannel(propSub);
    };
  }, [currentRoom?.id, appState, loadGameData]);

  useEffect(() => () => clearInterval(journeyTimer.current), []);

  const updateRoomActivity = async () => {
    if (!currentRoom) return;
    await supabase.from('monopoli_rooms').update({ last_active: new Date() }).eq('id', currentRoom.id);
  };

  const startJourney = (steps) => {
    clearInterval(journeyTimer.current);
    setJourneyLog(steps);
    setJourneyIdx(0);
    let i = 0;
    journeyTimer.current = setInterval(() => {
      i++;
      setJourneyIdx(i);
      if (i >= steps.length - 1) clearInterval(journeyTimer.current);
    }, 220);
  };

  const selectColor = async (c) => {
    const takenByOther = players.some(p => p.nim !== currentUser.nim && p.color === c);
    if (takenByOther) return alert('Warna ini sudah dipilih pemain lain!');

    isTransacting.current = true;
    hasSelectedColor.current = true;
    setShowColorModal(false);

    setPlayers(prev => prev.map(p => p.nim === currentUser.nim ? { ...p, color: c } : p));
    if (myState) setMyState(prev => ({ ...prev, color: c }));

    await supabase.from('monopoli_players')
      .update({ color: c })
      .match({ nim: currentUser.nim, room_id: currentRoom.id });

    isTransacting.current = false;
    loadGameData();
  };

  const givePoints = async (nim, amount) => {
    const TABEL_ALUMNI = 'alumni';
    const { data: u } = await supabase.from(TABEL_ALUMNI).select('skor_monopoli').eq('nim', nim).single();
    const updatedScore = (u?.skor_monopoli || 0) + amount;
    await supabase.from(TABEL_ALUMNI)
      .update({ skor_monopoli: updatedScore })
      .eq('nim', nim);
    await supabase.from('monopoli_users')
      .update({ points: updatedScore })
      .eq('nim', nim);
    if (nim === currentUser.nim) {
      setCurrentUser(prev => ({ ...prev, points: updatedScore }));
    }
  };

  const declareBankrupt = async () => {
    if (!window.confirm('Yakin menyerah? Semua aset propertimu akan dilepas!')) return;
    isTransacting.current = true;
    const active = players.filter(p => !p.is_bankrupt);
    const rank = active.length;
    const pts = rank === 2 ? 1500 : rank === 3 ? 750 : 0;
    await supabase.from('monopoli_players').update({ is_bankrupt: true, rank }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    await supabase.from('monopoli_properties').delete().match({ owner_nim: currentUser.nim, room_id: currentRoom.id });
    if (pts > 0) await givePoints(currentUser.nim, pts);
    if (active.length === 2) {
      const winner = active.find(p => p.nim !== currentUser.nim);
      await supabase.from('monopoli_players').update({ rank: 1 }).match({ nim: winner.nim, room_id: currentRoom.id });
      await givePoints(winner.nim, 3000);
      await supabase.from('monopoli_rooms').update({ status: 'finished', last_active: new Date() }).eq('id', currentRoom.id);
    }
    updateRoomActivity(); isTransacting.current = false; loadGameData();
  };

  const handleAutomaticBankrupt = async () => {
    isTransacting.current = true;
    const active = players.filter(p => !p.is_bankrupt);
    const rank = active.length;
    const pts = rank === 2 ? 1500 : rank === 3 ? 750 : 0;

    await supabase.from('monopoli_players')
      .update({ is_bankrupt: true, rank, cash: 0, last_message: 'Kalah karena saldo minus!' })
      .match({ nim: currentUser.nim, room_id: currentRoom.id });

    await supabase.from('monopoli_properties')
      .delete()
      .match({ owner_nim: currentUser.nim, room_id: currentRoom.id });

    if (pts > 0) await givePoints(currentUser.nim, pts);

    if (active.length === 2) {
      const winner = active.find(p => p.nim !== currentUser.nim);
      await supabase.from('monopoli_players')
        .update({ rank: 1 })
        .match({ nim: winner.nim, room_id: currentRoom.id });
      await givePoints(winner.nim, 3000);
      await supabase.from('monopoli_rooms')
        .update({ status: 'finished', last_active: new Date() })
        .eq('id', currentRoom.id);
    }
    updateRoomActivity();
    isTransacting.current = false;
    loadGameData();
  };

  const buyProperty = async () => {
    if (!myState || !activeTile) return;
    if (myState.cash < activeTile.price) return alert('Saldo tidak mencukupi!');
    if (properties.some(p => p.tile_id === activeTile.id)) return alert('Properti ini sudah dimiliki pemain!');

    isTransacting.current = true;
    const newCash = myState.cash - activeTile.price;
    const { data: insertedProp, error: buyError } = await supabase
      .from('monopoli_properties')
      .insert([{ room_id: currentRoom.id, tile_id: activeTile.id, owner_nim: currentUser.nim, upgrade_level: 0 }])
      .select()
      .single();

    if (buyError) {
      isTransacting.current = false;
      return alert('Gagal membeli properti: ' + buyError.message);
    }

    if (insertedProp) {
      setProperties(prev => [...prev, insertedProp]);
    }
    setMyState(prev => ({ ...prev, cash: newCash }));
    await supabase.from('monopoli_players').update({ cash: newCash }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity();
    setShowBuyModal(false);
    isTransacting.current = false;
    loadGameData();
  };

  const upgradeProperty = async () => {
    if (!activeProp || activeProp.upgrade_level >= 5) return alert('Sudah mencapai level Apartemen maksimal!');
    const cost = Math.floor(activeTile.price * 0.5);
    if (!myState || myState.cash < cost) return alert('Saldo tidak mencukupi!');
    isTransacting.current = true;
    const newCash = myState.cash - cost;
    const newLevel = (activeProp.upgrade_level || 0) + 1;
    const matchFilter = activeProp.id
      ? { id: activeProp.id, room_id: currentRoom.id }
      : { tile_id: activeProp.tile_id, owner_nim: currentUser.nim, room_id: currentRoom.id };

    setProperties(prev => prev.map(p => (p.id ? p.id === activeProp.id : p.tile_id === activeProp.tile_id) ? { ...p, upgrade_level: newLevel } : p));
    setMyState(prev => ({ ...prev, cash: newCash }));
    await supabase.from('monopoli_properties').update({ upgrade_level: newLevel }).match(matchFilter);
    await supabase.from('monopoli_players').update({ cash: newCash }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity();
    setShowUpgradeModal(false);
    isTransacting.current = false;
    loadGameData();
  };

  const sellProperty = async (prop, e) => {
    e.stopPropagation();
    isTransacting.current = true;
    const tile = BOARD_DATA.find(t => t.id === prop.tile_id);
    const sellPrice = Math.floor(tile.price * 0.75);
    const newCash = myState.cash + sellPrice;
    const matchFilter = prop.id
      ? { id: prop.id, room_id: currentRoom.id }
      : { tile_id: prop.tile_id, owner_nim: currentUser.nim, room_id: currentRoom.id };

    setProperties(prev => prev.filter(p => (prop.id ? p.id !== prop.id : p.tile_id !== prop.tile_id)));
    setMyState(prev => ({ ...prev, cash: newCash }));
    await supabase.from('monopoli_properties').delete().match(matchFilter);
    await supabase.from('monopoli_players').update({ cash: newCash }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity();
    isTransacting.current = false;
    loadGameData();
  };

  const handleTileClick = (tile) => {
    const prop = properties.find(p => p.tile_id === tile.id);
    const owner = players.find(pl => pl.nim === prop?.owner_nim);
    setSelectedInfo({ ...tile, prop, owner });
  };

  const startSpin = (type) => {
    setTodType(type); setIsSpinning(true);
    const bank = type === 'TRUTH' ? todBank.truth : todBank.dare;
    intervalRef.current = setInterval(() => setSpinningText(bank[Math.floor(Math.random() * bank.length)]), 80);
  };
  const stopSpin = () => { clearInterval(intervalRef.current); setIsSpinning(false); setTodQuestion(spinningText); };

  const rollDice = async () => {
    if (isRolling || isAnimating || !myState || myState.is_bankrupt) return;

    if (myState.skip_turn > 0) {
      const sisaHukuman = myState.skip_turn - 1;
      const pesan = "Giliran dilewati! Sisa hukuman: " + sisaHukuman;

      setMyState(prev => ({ ...prev, skip_turn: sisaHukuman, last_message: pesan }));
      await supabase.from('monopoli_players')
        .update({ skip_turn: sisaHukuman, last_message: pesan })
        .match({ nim: currentUser.nim, room_id: currentRoom.id });

      updateRoomActivity();
      return;
    }

    setIsRolling(true);
    let counter = 0;
    const iv = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      if (++counter > 10) { clearInterval(iv); finishRoll(); }
    }, 80);
  };

  const evaluateNonEventTile = async (tile, currentCash, messages) => {
    let cashAfter = currentCash;
    let landedPos = tile.id;

    if (tile.id === 30) {
      landedPos = 10;
      setMyAnimPos(10);
      messages.push('Ketahuan titip absen! Masuk Ruang Interogasi.');
    } else if (tile.type === 'tod') {
      setShowToD(true);
      messages.push(`Berhenti di ${tile.name} (Truth or Dare).`);
    } else if (tile.type === 'tax') {
      cashAfter -= tile.price;
      messages.push(`Bayar ${tile.name} Rp ${tile.price}k`);
    } else if (tile.type === 'property') {
      const ownerRecord = properties.find(p => p.tile_id === tile.id);
      if (!ownerRecord) {
        setActiveTile(tile);
        setShowBuyModal(true);
        messages.push(`Mendarat di ${tile.name}`);
      } else if (ownerRecord.owner_nim === currentUser.nim) {
        setActiveTile(tile);
        setActiveProp(ownerRecord);
        setShowUpgradeModal(true);
        messages.push(`Singgah di propertimu: ${tile.name}`);
      } else {
        const mult = ownerRecord.upgrade_level >= 5 ? 5 : (1 + (ownerRecord.upgrade_level || 0) * 0.5);
        const rent = Math.floor(tile.rent * mult);
        cashAfter -= rent;

        const { data: ownerData } = await supabase
          .from('monopoli_players')
          .select('cash, nama')
          .match({ nim: ownerRecord.owner_nim, room_id: currentRoom.id })
          .single();

        if (ownerData) {
          const ownerNewCash = (ownerData.cash || 0) + rent;
          await supabase
            .from('monopoli_players')
            .update({
              cash: ownerNewCash,
              last_message: `Terima sewa ${tile.name} Rp ${rent}k dari ${currentUser.nama.split(' ')[0]}!`
            })
            .match({ nim: ownerRecord.owner_nim, room_id: currentRoom.id });

          setPlayers(prev => prev.map(p => p.nim === ownerRecord.owner_nim ? { ...p, cash: ownerNewCash } : p));
        }

        const ownerFirstName = ownerData?.nama?.split(' ')[0] || 'pemilik';
        messages.push(`Bayar sewa ${tile.name} Rp ${rent}k ke ${ownerFirstName}!`);
      }
    }

    return { cashAfter, landedPos };
  };

  const finishRoll = async () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice([d1, d2]); setIsRolling(false); setIsAnimating(true); isAnimatingRef.current = true;

    const totalSteps = d1 + d2;
    const startPos = myState.pos || 0;
    let animPos = startPos;
    const steps = [];
    for (let i = 0; i < totalSteps; i++) {
      animPos = (animPos + 1) % 40;
      steps.push(animPos);
    }
    startJourney(steps);

    animPos = startPos;
    for (let i = 0; i < totalSteps; i++) {
      animPos = (animPos + 1) % 40;
      setMyAnimPos(animPos);
      await sleep(220);
    }

    let finalPos = animPos;
    let newCash = myState.cash;
    const messages = [];

    // Bonus melewati atau berhenti di START setelah menyelesaikan satu putaran penuh
    if (startPos + totalSteps >= 40) {
      newCash += 200;
      messages.push('KRS-an cair +Rp 200k!');
    }

    const tile = BOARD_DATA[finalPos];

    if (tile.type === 'event') {
      const pool = eventsBank.filter(e => (tile.name.includes('Dana') ? e.tipe === 'DANA_UMUM' : e.tipe === 'KESEMPATAN') && e.side === tile.side);
      if (pool.length > 0) {
        const card = pool[Math.floor(Math.random() * pool.length)];
        setActiveCard({ title: tile.name, text: card.teks });
        setShowEventCard(true);

        let updatedSkip = myState.skip_turn || 0;
        let movedToNewTile = false;

        switch (card.action_type) {
          case 'MUNDUR':
            for (let i = 0; i < card.action_value; i++) {
              finalPos = (finalPos - 1 + 40) % 40;
              setMyAnimPos(finalPos);
              await sleep(220);
            }
            messages.push(`Mundur ${card.action_value} langkah ke ${BOARD_DATA[finalPos].name}!`);
            movedToNewTile = true;
            break;
          case 'BAYAR':
            newCash -= card.action_value;
            messages.push(`Bayar denda Rp ${card.action_value}k!`);
            break;
          case 'DAPAT':
            newCash += card.action_value;
            messages.push(`Dapat dana Rp ${card.action_value}k!`);
            break;
          case 'KE_START':
            finalPos = 0;
            setMyAnimPos(0);
            newCash += 200;
            messages.push('Kembali ke START (+Rp 200k)!');
            break;
          case 'TELEPORT':
            finalPos = card.action_value;
            setMyAnimPos(finalPos);
            messages.push(`Pindah ke ${BOARD_DATA[finalPos]?.name || 'petak ' + finalPos}!`);
            movedToNewTile = true;
            break;
          case 'SKIP_TURN':
            updatedSkip += card.action_value;
            messages.push('Kena hukuman lewati 1 giliran!');
            break;
        }

        if (updatedSkip > 0) {
          setMyState(prev => ({ ...prev, skip_turn: updatedSkip }));
          await supabase.from('monopoli_players').update({ skip_turn: updatedSkip }).match({ nim: currentUser.nim, room_id: currentRoom.id });
        }

        if (movedToNewTile && BOARD_DATA[finalPos]) {
          const destResult = await evaluateNonEventTile(BOARD_DATA[finalPos], newCash, messages);
          newCash = destResult.cashAfter;
          finalPos = destResult.landedPos;
        }
      }
    } else {
      const tileResult = await evaluateNonEventTile(tile, newCash, messages);
      newCash = tileResult.cashAfter;
      finalPos = tileResult.landedPos;
    }

    const finalMessage = messages.join(' • ');

    if (newCash < 0) {
      alert('Saldo kamu bernilai negatif! Kamu dinyatakan bangkrut.');
      await handleAutomaticBankrupt();
      setIsAnimating(false);
      isAnimatingRef.current = false;
      return;
    }

    setMyState(prev => ({ ...prev, pos: finalPos, cash: newCash, last_message: finalMessage }));
    await supabase.from('monopoli_players').update({ pos: finalPos, cash: newCash, last_message: finalMessage }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity();
    setIsAnimating(false);
    isAnimatingRef.current = false;
  };

  const getDisplayPos = (player) => {
    if (player.nim === currentUser.nim)
      return isAnimating ? (myAnimPos ?? myState?.pos ?? 0) : (myState?.pos ?? player.pos);
    return player.pos;
  };

  const getStripColor = (tile) => tile.type === 'property' ? tile.color : (TILE_STRIP_COLOR[tile.type] || 'bg-[#E7DFCE]');

  const getTextStyle = (tile) => {
    if (tile.type === 'corner') return {};
    if (tile.side === 2) return { writingMode: 'vertical-rl', transform: 'rotate(180deg)' };
    if (tile.side === 4) return { writingMode: 'vertical-rl' };
    return {};
  };

  if (appState === 'lobby') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[75vh] p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-[#DED6C6] text-center shadow-md">
          <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
            Permainan Papan Nostalgia
          </p>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Monopoli UPN TL 2016</h1>
          <p className="text-stone-800 mb-6 text-sm">
            Halo, <span className="font-bold text-stone-900">{currentUser.nama}</span>!
            <span className="block text-green-800 font-mono font-bold mt-1">
              Total Poin Monopoli: {currentUser.points}
            </span>
          </p>
          <button
            type="button"
            onClick={createRoom}
            className="w-full min-h-[48px] py-3.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-base mb-5 shadow-md transition-colors"
          >
            Buat Ruangan Baru
          </button>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-[#E7DFCE]"></div>
            <span className="text-stone-600 text-xs font-mono font-bold">ATAU GABUNG RUANGAN</span>
            <div className="flex-1 h-px bg-[#E7DFCE]"></div>
          </div>
          <label htmlFor="monopoli-join-code" className="sr-only">
            Kode Ruangan Monopoli
          </label>
          <input
            id="monopoli-join-code"
            type="text"
            placeholder="KODE 4 ANGKA"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            className="w-full min-h-[48px] p-3.5 bg-[#FAF6EE] border border-[#C7BDA8] rounded-xl text-center text-xl font-mono font-bold tracking-widest mb-4 focus:border-amber-400 text-stone-900 placeholder:text-stone-500 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal"
            maxLength={4}
          />
          <button
            type="button"
            onClick={() => joinRoom()}
            className="w-full min-h-[48px] py-3.5 px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-base shadow-md transition-colors"
          >
            Masuk ke Ruangan
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'room') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[75vh] p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-[#DED6C6] text-center shadow-md">
          <p className="text-amber-700 font-mono font-bold mb-2 uppercase text-xs tracking-wider">
            Kode Ruangan Monopoli
          </p>
          <h1 className="text-5xl font-mono font-bold text-stone-900 tracking-widest mb-6 bg-[#FAF6EE] py-4 rounded-xl border border-[#DED6C6]">
            {currentRoom.id}
          </h1>
          <h2 className="text-left font-bold text-green-800 text-sm mb-3">
            Pemain Bergabung ({players.length}/6):
          </h2>
          <div className="flex flex-col gap-2 mb-6 max-h-48 overflow-y-auto pr-1">
            {players.map(p => (
              <div key={p.nim} className="bg-[#FAF6EE] p-3 rounded-xl flex items-center justify-between border border-[#DED6C6]">
                <span className="font-semibold text-sm text-stone-900">
                  {p.nama} {p.nim === currentUser.nim ? <span className="text-amber-700">(Kamu)</span> : ''}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full min-h-[48px] py-3.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-base shadow-md transition-colors"
          >
            Mulai Permainan
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'result') {
    const myResult = players.find(p => p.nim === currentUser.nim);
    const isWinner = myResult?.rank === 1;

    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[75vh] p-4">
        <div className={`w-full max-w-md bg-white p-8 rounded-2xl border ${isWinner ? 'border-emerald-500/60' : 'border-amber-400/60'} text-center shadow-md`}>
          
          <h1 className={`text-3xl font-bold mb-2 ${isWinner ? 'text-green-800' : 'text-amber-700'}`}>
            {isWinner ? 'Selamat, Kamu Juara!' : 'Permainan Selesai'}
          </h1>
          
          {isWinner ? (
            <p className="text-stone-800 mb-6 text-sm leading-relaxed">
              Kamu bertahan sebagai penguasa properti kampus dan mendapatkan <span className="font-mono font-bold text-green-800">+3000 Poin</span>!
            </p>
          ) : (
            <p className="text-stone-600 mb-6 text-sm">Hasil Peringkat & Poin Pertandingan</p>
          )}

          <div className="flex flex-col gap-3 mb-6 text-left">
            {[...players].sort((a,b) => (a.rank || 99) - (b.rank || 99)).map(p => (
              <div key={p.nim} className={`p-4 rounded-xl flex justify-between items-center border ${p.rank === 1 ? 'bg-[#FAF6EE] border-amber-400' : 'bg-[#FAF6EE] border-[#DED6C6]'}`}>
                <span className="font-bold text-base text-stone-900">
                  #{p.rank || '-'} {p.nama}
                  {p.nim === currentUser.nim && <span className="text-stone-600 text-xs ml-1.5">(Kamu)</span>}
                </span>
                <span className={`font-mono font-bold text-base ${p.rank === 1 ? 'text-amber-700' : 'text-green-800'}`}>
                  +{p.rank === 1 ? 3000 : p.rank === 2 ? 1500 : p.rank === 3 ? 750 : 0} Poin
                </span>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={exitGame}
            className="w-full min-h-[48px] py-3.5 px-6 bg-amber-400 hover:bg-amber-300 font-bold rounded-xl text-base text-slate-950 transition-colors"
          >
            Kembali ke Ruang Utama
          </button>
        </div>
      </div>
    );
  }

  const journeyTile = journeyLog.length > 0 ? BOARD_DATA[journeyLog[Math.min(journeyIdx, journeyLog.length - 1)]] : null;
  const currentPosTile = BOARD_DATA[myState?.pos ?? 0];

  const renderTileInfoPanel = () => (
    <div className="w-full bg-white p-4 rounded-2xl border border-[#DED6C6]">
      {selectedInfo ? (
        <div className="text-stone-900">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3.5 h-3.5 rounded-sm shrink-0 ${getStripColor(selectedInfo)}`}/>
            <h3 className="font-bold text-stone-900 text-base leading-tight">
              Petak #{selectedInfo.id}: {selectedInfo.name}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {selectedInfo.price && <p className="text-stone-600">Harga: <span className="font-mono font-bold text-stone-900">Rp {selectedInfo.price}k</span></p>}
            {selectedInfo.rent  && <p className="text-stone-600">Sewa: <span className="font-mono font-bold text-stone-900">Rp {selectedInfo.rent}k</span></p>}
            {selectedInfo.prop && <>
              <p className="text-stone-600">Pemilik: <span className="font-bold text-stone-900">{selectedInfo.owner?.nama||'...'}</span></p>
              <p className="text-stone-600">Bangunan: <span className="font-bold text-green-800">{selectedInfo.prop.upgrade_level>=5?'Apartemen':'Rumah Lvl '+(selectedInfo.prop.upgrade_level||0)}</span></p>
            </>}
          </div>
          {!selectedInfo.prop && selectedInfo.type==='property' && myState?.pos === selectedInfo.id && (
            <button
              type="button"
              onClick={()=>{setActiveTile(selectedInfo);setShowBuyModal(true);}}
              className="mt-3 w-full min-h-[44px] py-2.5 bg-green-900 hover:bg-green-800 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Beli Properti Ini
            </button>
          )}
        </div>
      ) : (
        <p className="text-stone-600 text-center py-3 font-medium text-xs leading-relaxed">
          Klik petak di papan atau pilih lewat daftar di bawah untuk melihat harga, sewa, dan pemilik properti.
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#FAF6EE] text-stone-900 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* KOLOM KIRI (DESKTOP): PAPAN MONOPOLI BESAR */}
        <div className="lg:col-span-8 w-full">
          {/* Header ringkas khusus HP (< lg) */}
          <div className="lg:hidden w-full flex flex-wrap justify-between items-center gap-3 mb-3 bg-white p-4 rounded-2xl border border-[#DED6C6]">
            <div>
              <h2 className="text-green-900 font-bold text-base">
                {currentUser.nama} {myState?.is_bankrupt && <span className="text-rose-700">(Bangkrut)</span>}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetsModal(true)}
                  className="text-xs bg-amber-400 hover:bg-amber-300 px-3.5 py-2 min-h-[44px] rounded-xl text-slate-950 font-bold transition-colors"
                >
                  Aset Propertiku ({properties.filter(p => p.owner_nim === currentUser.nim).length})
                </button>
                {!myState?.is_bankrupt && (
                  <button
                    type="button"
                    onClick={declareBankrupt}
                    className="text-xs bg-rose-700 hover:bg-rose-600 px-3.5 py-2 min-h-[44px] rounded-xl text-white font-bold transition-colors"
                  >
                    Menyerah
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-600 uppercase font-mono font-bold">Saldo Kas</p>
              <p className={`text-xl font-mono font-bold ${(myState?.cash ?? 0) < 0 ? 'text-rose-700' : 'text-green-900'}`}>
                Rp {myState?.cash ?? 0}k
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2 lg:hidden">
            <span className="text-xs font-mono text-stone-600">
              Posisi: <strong className="text-stone-900">#{currentPosTile?.id} {currentPosTile?.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsBoardZoomed(prev => !prev)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#F3EDE0] border border-[#C7BDA8] text-xs font-mono font-bold text-green-900 transition-colors"
            >
              {isBoardZoomed ? 'Ukuran Normal' : 'Perbesar Papan'}
            </button>
          </div>

          <div className={isBoardZoomed ? 'overflow-x-auto pb-2 rounded-2xl' : ''}>
            <div className={`relative aspect-square bg-[#E7DFCE] p-1.5 rounded-2xl border border-[#C7BDA8] ${isBoardZoomed ? 'min-w-[700px] w-[700px]' : 'w-full'}`}>

              <div className="grid grid-cols-11 grid-rows-11 h-full w-full gap-[2px]">
              {BOARD_DATA.map((tile) => {
                let area;
                if (tile.id===0)        area='11/11';
                else if(tile.id<=9)    area=`11/${11-tile.id}`;
                else if(tile.id===10)  area='11/1';
                else if(tile.id<=19)   area=`${21-tile.id}/1`;
                else if(tile.id===20)  area='1/1';
                else if(tile.id<=29)   area=`1/${tile.id-19}`;
                else if(tile.id===30)  area='1/11';
                else                   area=`${tile.id-29}/11`;

                const prop = properties.find(p=>p.tile_id===tile.id);
                const owner = players.find(pl=>pl.nim===prop?.owner_nim);
                const playersOnTile = players.filter(pl=>getDisplayPos(pl)===tile.id);
                const isCorner = tile.type==='corner';
                const stripColor = getStripColor(tile);
                const bgClass = owner ? `${owner.color} bg-opacity-25` : isCorner ? 'bg-[#F3EDE0]' : 'bg-white';

                const stripPos =
                  tile.side===1 ? 'top-0 left-0 right-0 h-[5px]' :
                  tile.side===2 ? 'top-0 right-0 bottom-0 w-[5px]' :
                  tile.side===3 ? 'bottom-0 left-0 right-0 h-[5px]' :
                  tile.side===4 ? 'top-0 left-0 bottom-0 w-[5px]' : '';

                const textStyle = getTextStyle(tile);
                const typeLabel = TILE_TYPE_LABEL[tile.type];
                const isVertical = tile.side===2 || tile.side===4;

                return (
                  <button
                    key={tile.id}
                    type="button"
                    aria-label={`Petak ${tile.id}: ${tile.name}${tile.price ? `, Harga Rp ${tile.price}k` : ''}`}
                    onClick={() => handleTileClick(tile)}
                    style={{gridArea:area}}
                    className={`relative flex flex-col items-center justify-center cursor-pointer overflow-hidden border border-[#DED6C6] ${bgClass} hover:bg-[#FAF6EE] transition-colors p-0.5 ${selectedInfo?.id === tile.id ? 'ring-2 ring-green-900 z-10' : ''}`}
                  >
                    {!isCorner && <div className={`absolute ${stripPos} ${stripColor} pointer-events-none`}/>}

                    {/* Teks petak */}
                    <div style={textStyle} className="flex-1 w-full h-full flex items-center justify-center overflow-hidden p-[2px]">
                      <div
                        className={`text-stone-900 font-bold text-center leading-tight overflow-hidden ${
                          isBoardZoomed
                            ? (isCorner ? 'text-[10px]' : 'text-[9px]')
                            : (isCorner ? 'text-[6.5px] sm:text-[8.5px] lg:text-[9.5px]' : 'text-[5.5px] sm:text-[7.5px] lg:text-[8.5px]')
                        }`}
                        style={{
                          lineHeight: 1.12,
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                          display: '-webkit-box',
                          WebkitLineClamp: isVertical ? 999 : 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          maxWidth: '100%',
                          maxHeight: '100%',
                        }}
                      >
                        {typeLabel && (
                          <span className="block text-[4.5px] sm:text-[6.5px] lg:text-[7px] tracking-wide font-extrabold text-amber-800">
                            {typeLabel}
                          </span>
                        )}
                        {tile.name}
                        {tile.price && (
                          <span className="hidden lg:block text-[7px] font-mono font-semibold text-stone-500 mt-0.5">
                            {tile.price}k
                          </span>
                        )}
                      </div>
                    </div>

                    {prop && (
                      <span className="absolute bottom-0.5 right-0.5 text-amber-900 bg-amber-200/90 px-0.5 rounded font-bold text-[6px] sm:text-[7px]">
                        {prop.upgrade_level>=5?'APT':`L${prop.upgrade_level||0}`}
                      </span>
                    )}

                    {playersOnTile.length>0 && (
                      <div className="absolute bottom-[2px] left-0 right-0 flex flex-wrap gap-[2px] justify-center">
                        {playersOnTile.map(p=>(
                          <div
                            key={p.nim}
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-stone-900 ${p.color||'bg-blue-400'} ${p.nim===currentUser.nim&&isAnimating?'ring-2 ring-amber-500 scale-125':''} transition-all duration-150 shrink-0`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
              </div>

              {/* PANEL TENGAH */}
              <div
                className="absolute z-20 bg-[#FAF6EE] rounded-xl border border-[#DED6C6] overflow-hidden flex flex-col"
                style={{ inset: 'calc(100% / 11 + 3px)' }}
              >
                {isAnimating && journeyTile ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-2">
                    <div className={`w-full h-2 rounded-sm ${getStripColor(journeyTile)} shrink-0`}/>

                    <span className="text-stone-600 font-mono font-bold text-xs">
                      Langkah {journeyIdx+1}/{journeyLog.length}
                    </span>

                    <span className="font-bold text-stone-900 text-center leading-tight px-1 text-sm sm:text-base">
                      {journeyTile.name}
                    </span>

                    {journeyTile.price && (
                      <span className="text-amber-800 font-mono font-bold text-xs sm:text-sm">Rp {journeyTile.price}k</span>
                    )}

                    <div className="flex gap-2 mt-1">
                      {dice.map((d,i)=>(
                        <div key={i} className="bg-amber-400 border border-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-mono font-bold w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm">{d}</div>
                      ))}
                    </div>

                    <div className="w-full max-w-xs px-3 mt-1">
                      <div className="h-2 bg-[#E7DFCE] rounded-full overflow-hidden">
                        <div className="h-full bg-green-800 rounded-full transition-all duration-200"
                          style={{width:`${((journeyIdx+1)/journeyLog.length)*100}%`}}/>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2.5 p-3 sm:p-6">
                    <h2 className="text-sm sm:text-lg font-bold text-stone-900 text-center">
                      Monopoli Kampus TL 2016
                    </h2>
                    {currentPosTile && (
                      <div className="bg-white border border-[#DED6C6] px-3 py-1.5 rounded-lg text-center">
                        <span className="text-[11px] sm:text-xs text-stone-600">Posisi Kamu: </span>
                        <strong className="text-[11px] sm:text-xs text-green-900">#{currentPosTile.id} {currentPosTile.name}</strong>
                      </div>
                    )}
                    {myState?.last_message ? (
                      <p className="text-stone-800 font-semibold text-center px-2 text-xs sm:text-sm leading-snug max-w-sm">
                        {myState.last_message}
                      </p>
                    ) : (
                      <p className="text-stone-600 text-center text-xs sm:text-sm">
                        Tekan tombol Lempar Dadu untuk mulai melangkah.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mt-1">
                      {players.filter(p=>!p.is_bankrupt).map(p=>(
                        <div key={p.nim} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#DED6C6]">
                          <div className={`rounded-full w-2.5 h-2.5 border border-stone-900 ${p.color||'bg-slate-400'}`} />
                          <span className="text-stone-900 text-[10px] sm:text-xs font-semibold">{p.nama.split(' ')[0]}</span>
                          <span className="text-green-900 font-mono text-[10px] sm:text-xs font-bold">{p.cash}k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* KOLOM KANAN (DESKTOP) / BAWAH (HP): KONTROL & DETAIL PETAK */}
        <div className="lg:col-span-4 w-full space-y-4 lg:sticky lg:top-6">
          {/* Kartu Pemain & Saldo Desktop */}
          <div className="hidden lg:block bg-white p-5 rounded-2xl border border-[#DED6C6]">
            <div className="flex justify-between items-start gap-3 mb-4">
              <div>
                <h2 className="text-stone-900 font-bold text-lg leading-tight">
                  {currentUser.nama}
                </h2>
                {myState?.is_bankrupt && <span className="text-xs font-bold text-rose-700">Status: Bangkrut</span>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-stone-500 uppercase font-mono font-bold">Saldo Kas</p>
                <p className={`text-2xl font-mono font-bold ${(myState?.cash ?? 0) < 0 ? 'text-rose-700' : 'text-green-900'}`}>
                  Rp {myState?.cash ?? 0}k
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAssetsModal(true)}
                className="flex-1 text-xs bg-amber-400 hover:bg-amber-300 px-3 py-2.5 min-h-[44px] rounded-xl text-slate-950 font-bold transition-colors"
              >
                Aset Properti ({properties.filter(p => p.owner_nim === currentUser.nim).length})
              </button>
              {!myState?.is_bankrupt && (
                <button
                  type="button"
                  onClick={declareBankrupt}
                  className="text-xs bg-rose-700 hover:bg-rose-600 px-4 py-2.5 min-h-[44px] rounded-xl text-white font-bold transition-colors"
                >
                  Menyerah
                </button>
              )}
            </div>
          </div>

          {/* Tombol Lempar Dadu */}
          <button
            type="button"
            onClick={rollDice}
            disabled={isRolling||isAnimating||myState?.is_bankrupt}
            className="w-full min-h-[52px] bg-green-900 hover:bg-green-800 text-white font-bold py-4 rounded-xl transition-colors disabled:bg-[#E7DFCE] disabled:text-stone-500 disabled:cursor-not-allowed text-base"
          >
            {isAnimating ? `Dadu: ${dice[0]} + ${dice[1]} = ${dice[0]+dice[1]} Langkah` : 'Lempar Dadu Sekarang'}
          </button>

          {/* Detail Petak */}
          {renderTileInfoPanel()}

          {/* Pilih Petak Cepat */}
          <div className="w-full bg-white p-4 rounded-2xl border border-[#DED6C6]">
            <label htmlFor="mobile-tile-select" className="block text-xs font-bold text-stone-800 mb-2">
              Periksa Detail Petak
            </label>
            <select
              id="mobile-tile-select"
              value={selectedInfo?.id ?? ''}
              onChange={(e) => {
                const tile = BOARD_DATA.find(t => t.id === Number(e.target.value));
                if (tile) handleTileClick(tile);
              }}
              className="w-full min-h-[44px] bg-[#FAF6EE] border border-[#C7BDA8] rounded-xl px-3 py-2 text-sm text-stone-900"
            >
              <option value="" disabled>Pilih petak untuk melihat detail...</option>
              {BOARD_DATA.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} - {t.name} {t.price ? `(Rp ${t.price}k)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* MODAL: PILIH WARNA */}
      {showColorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="color-modal-title"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm text-center border border-[#DED6C6] shadow-xl">
            <h2 id="color-modal-title" className="text-2xl font-bold mb-2 text-stone-900">Pilih Warna Bidak</h2>
            <p className="text-stone-600 text-xs mb-6">Pilih warna penanda bidakmu di papan permainan:</p>
            <div className="grid grid-cols-2 gap-3">
              {PLAYER_COLOR_OPTIONS.map(c => {
                const takenBy = players.find(p => p.nim !== currentUser.nim && p.color === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={Boolean(takenBy)}
                    aria-label={`Pilih warna bidak ${c.label}`}
                    onClick={() => selectColor(c.id)}
                    className={`min-h-[48px] w-full rounded-xl ${c.id} ${c.textClass} font-bold text-sm border-2 border-white shadow-md hover:opacity-95 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {takenBy ? `${c.label} (${takenBy.nama.split(' ')[0]})` : c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASET */}
      {showAssetsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assets-modal-title"
          onClick={() => setShowAssetsModal(false)}
        >
          <div
            className="bg-white p-6 rounded-2xl w-full max-w-sm text-center border border-[#DED6C6] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="assets-modal-title" className="text-xl font-bold mb-4 text-stone-900">Aset Properti Kamu</h2>
            <div className="max-h-60 overflow-y-auto mb-5 pr-1 flex flex-col gap-2.5">
              {properties.filter(p=>p.owner_nim===currentUser.nim).map(prop=>{
                const tile=BOARD_DATA.find(t=>t.id===prop.tile_id);
                const sp=Math.floor(tile.price*0.75);
                return (
                  <div key={prop.id||prop.tile_id} className="flex justify-between items-center bg-[#FAF6EE] p-3 rounded-xl text-left border border-[#DED6C6]">
                    <div className="flex flex-col flex-1 pr-2">
                      <span className="text-sm font-bold text-stone-900 leading-tight">{tile.name}</span>
                      <span className="text-xs font-mono text-stone-600">
                        {prop.upgrade_level>=5?'Apartemen':'Rumah Lvl '+(prop.upgrade_level||0)}
                      </span>
                    </div>
                    {!myState?.is_bankrupt && (
                      <button
                        type="button"
                        onClick={e=>sellProperty(prop,e)}
                        className="px-3 py-2 min-h-[44px] bg-rose-700 hover:bg-rose-600 text-xs font-bold rounded-lg text-white transition-colors"
                      >
                        Jual (+{sp}k)
                      </button>
                    )}
                  </div>
                );
              })}
              {properties.filter(p=>p.owner_nim===currentUser.nim).length===0 && (
                <p className="text-sm text-stone-600 py-6 bg-[#FAF6EE] rounded-xl border border-[#DED6C6]">
                  Kamu belum memiliki properti. Lempar dadu dan beli petak kampus!
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={()=>setShowAssetsModal(false)}
              className="w-full min-h-[44px] py-2.5 bg-[#E7DFCE] hover:bg-[#E7DFCE] rounded-xl font-bold text-sm text-stone-900 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: UPGRADE */}
      {showUpgradeModal && activeTile && activeProp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm text-center border border-[#DED6C6] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="upgrade-modal-title" className="text-xl font-bold mb-2 text-stone-900">
              {activeProp.upgrade_level>=5?'Status: Apartemen Maksimal':`Tingkatkan ke ${activeProp.upgrade_level>=4?'Apartemen':'Rumah Lvl '+((activeProp.upgrade_level||0)+1)}?`}
            </h2>
            {activeProp.upgrade_level<5 && (
              <p className="text-amber-700 font-mono font-bold text-lg mb-6">
                Biaya: Rp {Math.floor(activeTile.price*0.5)}k
              </p>
            )}
            <div className="flex gap-3">
              {activeProp.upgrade_level<5 && (
                <button
                  type="button"
                  onClick={upgradeProperty}
                  className="flex-1 min-h-[44px] py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors"
                >
                  Tingkatkan
                </button>
              )}
              <button
                type="button"
                onClick={()=>setShowUpgradeModal(false)}
                className="flex-1 min-h-[44px] py-3 bg-[#E7DFCE] hover:bg-[#E7DFCE] text-stone-900 font-bold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BELI */}
      {showBuyModal && activeTile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buy-modal-title"
          onClick={() => setShowBuyModal(false)}
        >
          <div
            className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm text-center border border-emerald-500/60 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="buy-modal-title" className="text-2xl font-bold mb-2 text-stone-900">Beli {activeTile.name}?</h2>
            <p className="text-green-800 font-mono font-bold text-xl mb-6">Harga: Rp {activeTile.price}k</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={buyProperty}
                className="flex-1 min-h-[44px] py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors"
              >
                Beli Properti
              </button>
              <button
                type="button"
                onClick={()=>setShowBuyModal(false)}
                className="flex-1 min-h-[44px] py-3 bg-[#E7DFCE] hover:bg-[#E7DFCE] text-stone-900 font-bold rounded-xl transition-colors"
              >
                Lewati
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TOD */}
      {showToD && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tod-modal-title"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm text-center border border-[#DED6C6] shadow-xl min-h-[340px] flex flex-col justify-between overflow-hidden">
            {!todType ? (
              <>
                <div>
                  <p className="text-xs font-mono font-bold text-amber-700 uppercase mb-1">Petak Lab Lingkungan</p>
                  <h2 id="tod-modal-title" className="text-2xl text-stone-900 font-bold mb-6">Pilih Tantanganmu</h2>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={()=>startSpin('TRUTH')}
                    className="flex-1 min-h-[52px] py-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-lg transition-colors"
                  >
                    Jujur (Truth)
                  </button>
                  <button
                    type="button"
                    onClick={()=>startSpin('DARE')}
                    className="flex-1 min-h-[52px] py-4 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl text-lg transition-colors"
                  >
                    Berani (Dare)
                  </button>
                </div>
              </>
            ) : !todQuestion ? (
              <div className="flex flex-col flex-1">
                <h2 id="tod-modal-title" className="text-sm font-mono font-bold text-amber-700 uppercase mb-3">
                  Mengacak Pertanyaan {todType}...
                </h2>
                <div className="bg-[#FAF6EE] p-6 rounded-xl mb-6 h-36 flex items-center justify-center border border-[#DED6C6]">
                  <p className="text-lg font-bold text-stone-900 text-center leading-snug">{spinningText}</p>
                </div>
                <div className="mt-auto">
                  {isSpinning && (
                    <button
                      type="button"
                      onClick={stopSpin}
                      className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors"
                    >
                      Berhenti & Buka Kartu
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 justify-center">
                <h2 id="tod-modal-title" className="text-xl font-bold mb-4 text-amber-700 uppercase">{todType}</h2>
                <p className="text-stone-900 mb-8 font-medium text-center flex-1 text-base leading-relaxed">{todQuestion}</p>
                <button
                  type="button"
                  onClick={()=>{setShowToD(false);setTodType('');setTodQuestion('');}}
                  className="w-full min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-600 font-bold rounded-xl text-white transition-colors"
                >
                  Selesai & Lanjutkan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EVENT */}
      {showEventCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          onClick={() => setShowEventCard(false)}
        >
          <div
            className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm text-center border border-amber-400/60 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="event-modal-title" className="text-xl font-bold mb-3 text-amber-700">{activeCard.title}</h2>
            <p className="mb-6 text-stone-900 text-sm leading-relaxed">{activeCard.text}</p>
            <button
              type="button"
              onClick={()=>setShowEventCard(false)}
              className="w-full min-h-[48px] py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
