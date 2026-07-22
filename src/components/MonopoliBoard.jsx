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
  corner: 'bg-slate-600', property: '', tax: 'bg-rose-700', event: 'bg-purple-600', tod: 'bg-orange-500',
};
const TILE_TYPE_LABEL = { corner: '', tax: 'PAJAK', event: 'EVENT', tod: 'ToD', property: '' };
const TILE_ICON_MAP   = { corner: '🏠', tax: '💸', event: '🃏', tod: '🎯', property: '🏡' };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const PLAYER_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400', 'bg-purple-500', 'bg-pink-500'];

export default function MonopoliBoard() {
  const [appState, setAppState] = useState('lobby');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [currentUser, setCurrentUser] = useState({ nim: '', nama: '', points: 0 });
  const [players, setPlayers] = useState([]);
  const [myState, setMyState] = useState(null);
  const [properties, setProperties] = useState([]);
  const [myAnimPos, setMyAnimPos] = useState(null);

  // Journey log untuk panel tengah
  const [journeyLog, setJourneyLog] = useState([]);
  const [journeyIdx, setJourneyIdx] = useState(0);
  const journeyTimer = useRef(null);

  const [isRolling, setIsRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false)
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
  const hasSelectedColor = useRef(false); // <--- TAMBAHKAN BARIS INI

  const [showEventCard, setShowEventCard] = useState(false);
  const [activeCard, setActiveCard] = useState({ title: '', text: '' });
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [activeTile, setActiveTile] = useState(null);
  const [activeProp, setActiveProp] = useState(null);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);

  useEffect(() => {
    const initUser = async () => {
      const nim = localStorage.getItem('user_nim');
      // PENTING: Ganti 'nama_tabel_alumnimu' dengan nama tabel asli yang ada di gambarmu
      const TABEL_ALUMNI = 'alumni'; 

      if (nim) {
        // Ambil data langsung dari tabel alumni
        const { data: user } = await supabase.from(TABEL_ALUMNI).select('*').eq('nim', nim).single();
        
        if (user) {
            // Pasang data alumni ke dalam game
            setCurrentUser({ 
                nim: user.nim, 
                nama: user.nama, 
                points: user.skor_monopoli || 0 
            });
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

  const cleanupStaleRooms = async () => {
    // Menghitung batas waktu 30 menit yang lalu
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    try {
      // 1. Cari ID room yang tidak ada aktivitas selama 30 menit terakhir
      const { data: staleRooms } = await supabase
        .from('monopoli_rooms')
        .select('id')
        .lt('last_active', thirtyMinutesAgo);

      if (staleRooms && staleRooms.length > 0) {
        const roomIds = staleRooms.map(r => r.id);

        // 2. Hapus berurutan: Properti -> Pemain -> Room (untuk menghindari error Foreign Key)
        await supabase.from('monopoli_properties').delete().in('room_id', roomIds);
        await supabase.from('monopoli_players').delete().in('room_id', roomIds);
        await supabase.from('monopoli_rooms').delete().in('id', roomIds);
      }
    } catch (error) {
      console.error("Gagal membersihkan room kedaluwarsa:", error.message);
    }
  };

  const createRoom = async () => {
    // await cleanupStaleRooms(); // DINONAKTIFKAN KARENA MENYEBABKAN RACE CONDITION PADA BANYAK USER

    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from('monopoli_rooms').insert([{ id: newCode, status: 'waiting', last_active: new Date() }]);
    joinRoom(newCode);
  };

  const joinRoom = async (code) => {
    // await cleanupStaleRooms(); // DINONAKTIFKAN KARENA MENYEBABKAN RACE CONDITION PADA BANYAK USER

    const rCode = code || joinCode;
    const { data: room } = await supabase.from('monopoli_rooms').select('*').eq('id', rCode).single();
    if (!room) return alert('Room tidak ditemukan!');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(room.last_active) < oneHourAgo) return alert('Sesi Room sudah kedaluwarsa. Buat Room baru.');
    if (room.status === 'finished') return alert('Game di room ini sudah selesai!');
    const { data: ep } = await supabase.from('monopoli_players').select('*').eq('room_id', rCode);
    if (ep.length >= 6 && !ep.find(p => p.nim === currentUser.nim)) return alert('Room Penuh! Maksimal 6 Pemain.');
    
    // --- FITUR AUTO-CLEANUP ---
    // Hapus NIM pemain ini dari semua room LAIN yang sudah ditinggalkan
    await supabase.from('monopoli_players')
      .delete()
      .eq('nim', currentUser.nim)
      .neq('room_id', rCode); 
    // --------------------------
    
    if (!ep.find(p => p.nim === currentUser.nim))
      await supabase.from('monopoli_players').insert([{ room_id: rCode, nim: currentUser.nim, nama: currentUser.nama }]);
    setCurrentRoom(room);
    setAppState(room.status === 'playing' ? 'game' : 'room');
  };

  const startGame = async () => {
    if (players.length < 4) { if (!window.confirm('Pemain kurang dari 4. Yakin?')) return; }
    await supabase.from('monopoli_rooms').update({ status: 'playing', last_active: new Date() }).eq('id', currentRoom.id);
    setAppState('game');
  };

  const exitGame = async () => {
    if (!currentRoom) {
      setAppState('lobby');
      return;
    }

    // 1. Hapus data pemain ini dari tabel monopoli_players
    await supabase.from('monopoli_players')
      .delete()
      .match({ nim: currentUser.nim, room_id: currentRoom.id });

    // 2. Cek apakah masih ada sisa pemain lain di dalam room
    const { data: sisaPemain } = await supabase.from('monopoli_players')
      .select('nim')
      .eq('room_id', currentRoom.id);

    // 3. Jika ruangan sudah benar-benar kosong, hapus room dan propertinya
    if (!sisaPemain || sisaPemain.length === 0) {
      await supabase.from('monopoli_properties').delete().eq('room_id', currentRoom.id);
      await supabase.from('monopoli_rooms').delete().eq('id', currentRoom.id);
    }

    // 4. Bersihkan memori lokal dan kembali ke beranda
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
    
    // Ambil data pertama kali saat masuk room
    loadGameData();
    
    // Subscribe ke perubahan Room, Players, dan Properties
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
    // Hapus loadGameData dari dependency array agar tidak terjadi loop tidak terbatas saat state berubah
  }, [currentRoom?.id, appState]);

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
    isTransacting.current = true;
    hasSelectedColor.current = true; // <--- Kunci rapat-rapat agar tidak muncul lagi
    setShowColorModal(false); 
    
    // Optimalkan tampilan lokal secara instan
    setPlayers(prev => prev.map(p => p.nim === currentUser.nim ? { ...p, color: c } : p));
    if (myState) setMyState(prev => ({ ...prev, color: c }));

    await supabase.from('monopoli_players')
      .update({ color: c })
      .match({ nim: currentUser.nim, room_id: currentRoom.id });
      
    isTransacting.current = false;
    loadGameData();
  };

  const givePoints = async (nim, amount) => {
    const TABEL_ALUMNI = 'alumni'; // Sesuaikan nama tabel
    
    // Tarik poin saat ini dari tabel alumni
    const { data: u } = await supabase.from(TABEL_ALUMNI).select('skor_monopoli').eq('nim', nim).single();
    
    // Tambahkan poin baru dan simpan kembali
    await supabase.from(TABEL_ALUMNI)
      .update({ skor_monopoli: (u?.skor_monopoli || 0) + amount })
      .eq('nim', nim);
  };

  const declareBankrupt = async () => {
    if (!window.confirm('Yakin Menyerah? Semua asetmu akan hangus!')) return;
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
    if (!myState || myState.cash < activeTile.price) return alert('Uang tidak cukup!');
    isTransacting.current = true;
    const newCash = myState.cash - activeTile.price;
    setProperties(prev => [...prev, { tile_id: activeTile.id, owner_nim: currentUser.nim, upgrade_level: 0 }]);
    setMyState(prev => ({ ...prev, cash: newCash }));
    await supabase.from('monopoli_properties').insert([{ room_id: currentRoom.id, tile_id: activeTile.id, owner_nim: currentUser.nim, upgrade_level: 0 }]);
    await supabase.from('monopoli_players').update({ cash: newCash }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity(); setShowBuyModal(false);
    setTimeout(() => { isTransacting.current = false; loadGameData(); }, 800);
  };

  const upgradeProperty = async () => {
    if (!activeProp || activeProp.upgrade_level >= 5) return alert('Sudah Apartemen Maksimal!');
    const cost = Math.floor(activeTile.price * 0.5);
    if (!myState || myState.cash < cost) return alert('Uang tidak cukup!');
    isTransacting.current = true;
    const newCash = myState.cash - cost;
    const newLevel = (activeProp.upgrade_level || 0) + 1;
    setProperties(prev => prev.map(p => p.id === activeProp.id ? { ...p, upgrade_level: newLevel } : p));
    setMyState(prev => ({ ...prev, cash: newCash }));
    await supabase.from('monopoli_properties').update({ upgrade_level: newLevel }).match({ id: activeProp.id, room_id: currentRoom.id });
    await supabase.from('monopoli_players').update({ cash: newCash }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity(); setShowUpgradeModal(false);
    setTimeout(() => { isTransacting.current = false; loadGameData(); }, 800);
  };

  const sellProperty = async (prop, e) => {
    e.stopPropagation(); isTransacting.current = true;
    const tile = BOARD_DATA.find(t => t.id === prop.tile_id);
    const sellPrice = Math.floor(tile.price * 0.75);
    const newCash = myState.cash + sellPrice;
    setProperties(prev => prev.filter(p => p.id !== prop.id));
    setMyState(prev => ({ ...prev, cash: newCash }));
    await supabase.from('monopoli_properties').delete().match({ id: prop.id, room_id: currentRoom.id });
    await supabase.from('monopoli_players').update({ cash: newCash }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity();
    setTimeout(() => { isTransacting.current = false; loadGameData(); }, 800);
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

      // BLOKIR JIKA PEMAIN SEDANG DIHUKUM
      if (myState.skip_turn > 0) {
          const sisaHukuman = myState.skip_turn - 1;
          const pesan = "Giliran dilewati! Sisa hukuman: " + sisaHukuman;
          
          setMyState(prev => ({ ...prev, skip_turn: sisaHukuman, last_message: pesan }));
          await supabase.from('monopoli_players')
              .update({ skip_turn: sisaHukuman, last_message: pesan })
              .match({ nim: currentUser.nim, room_id: currentRoom.id });
              
          updateRoomActivity();
          return; // Hentikan fungsi di sini, dadu tidak akan dilempar
      }

      setIsRolling(true);
      let counter = 0;
      const iv = setInterval(() => {
          setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
          if (++counter > 10) { clearInterval(iv); finishRoll(); }
      }, 80);
  };

  const finishRoll = async () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice([d1, d2]); setIsRolling(false); setIsAnimating(true); isAnimatingRef.current = true;
    
    const totalSteps = d1 + d2;
    let animPos = myState.pos;
    const steps = [];
    for (let i = 0; i < totalSteps; i++) { 
        animPos = (animPos + 1) % 40; 
        steps.push(animPos); 
    }
    startJourney(steps);

    animPos = myState.pos;
    for (let i = 0; i < totalSteps; i++) {
      animPos = (animPos + 1) % 40;
      setMyAnimPos(animPos);
      await sleep(220);
    }

    let finalPos = animPos; 
    let newCash = myState.cash; 
    let newMessage = '';
    
    if (finalPos < myState.pos || (myState.pos === 0 && finalPos > 0)) { 
        newCash += 200; 
        newMessage = 'KRS-an cair Rp 200k! '; 
    }

    const tile = BOARD_DATA[finalPos];
    
    if (tile.id === 30) { 
        finalPos = 10; 
        setMyAnimPos(10); 
        newMessage = 'Busted! Ketahuan titip absen!'; 
    }
    else if (tile.type === 'tod') { 
        setShowToD(true); 
    }
    else if (tile.type === 'tax') { 
        newCash -= tile.price; 
        newMessage = `Bayar ${tile.name} ${tile.price}k`; 
    }
    else if (tile.type === 'event') {
      const pool = eventsBank.filter(e => (tile.name.includes('Dana') ? e.tipe === 'DANA_UMUM' : e.tipe === 'KESEMPATAN') && e.side === tile.side);
      if (pool.length > 0) {
        const card = pool[Math.floor(Math.random() * pool.length)];
        setActiveCard({ title: tile.name, text: card.teks });
        setShowEventCard(true);

        let updatedSkip = myState.skip_turn || 0; 

        // --- EKSEKUSI KARTU PRO ---
        switch (card.action_type) {
            case 'MUNDUR':
                for (let i = 0; i < card.action_value; i++) {
                    finalPos = (finalPos - 1 + 40) % 40;
                    setMyAnimPos(finalPos);
                    await sleep(220);
                }
                newMessage = "Mundur " + card.action_value + " langkah!";
                break;
            case 'BAYAR':
                newCash -= card.action_value;
                newMessage = "Bayar denda Rp " + card.action_value + "k!";
                break;
            case 'DAPAT':
                newCash += card.action_value;
                newMessage = "Dapat dana Rp " + card.action_value + "k!";
                break;
            case 'KE_START':
                finalPos = 0;
                setMyAnimPos(0);
                newMessage = "Kembali ke START!";
                break;
            case 'TELEPORT':
                if (card.action_value < finalPos) {
                    newCash += 200;
                }
                finalPos = card.action_value;
                setMyAnimPos(finalPos);
                newMessage = "Teleportasi ke petak " + card.action_value + "!";
                break;
            case 'SKIP_TURN':
                updatedSkip += card.action_value;
                newMessage = "Kena hukuman hilang giliran!";
                break;
        }

        // Simpan status hukuman ke database
        if (updatedSkip > 0) {
            setMyState(prev => ({ ...prev, skip_turn: updatedSkip }));
            await supabase.from('monopoli_players').update({ skip_turn: updatedSkip }).match({ nim: currentUser.nim, room_id: currentRoom.id });
        }
      }
    } else if (tile.type === 'property') {
      const ownerRecord = properties.find(p => p.tile_id === tile.id);
      if (!ownerRecord) { setActiveTile(tile); setShowBuyModal(true); }
      else if (ownerRecord.owner_nim === currentUser.nim) { setActiveTile(tile); setActiveProp(ownerRecord); setShowUpgradeModal(true); }
      else {
        const mult = ownerRecord.upgrade_level >= 5 ? 5 : (1 + (ownerRecord.upgrade_level || 0) * 0.5);
        const rent = Math.floor(tile.rent * mult);
        newCash -= rent; newMessage = `Bayar sewa Rp ${rent}k!`;
      }
    }

    // --- PENGECEKAN OTOMATIS JIKA UANG MINUS ---
    if (newCash < 0) {
      alert('Saldo kamu bernilai negatif! Kamu otomatis kalah dan dinyatakan bangkrut.');
      await handleAutomaticBankrupt();
      setIsAnimating(false);
      isAnimatingRef.current = false;
      return; 
    }

    setMyState(prev => ({ ...prev, pos: finalPos, cash: newCash, last_message: newMessage }));
    await supabase.from('monopoli_players').update({ pos: finalPos, cash: newCash, last_message: newMessage }).match({ nim: currentUser.nim, room_id: currentRoom.id });
    updateRoomActivity(); 
    setIsAnimating(false); 
    isAnimatingRef.current = false;
  };

  const getDisplayPos = (player) => {
    if (player.nim === currentUser.nim)
      return isAnimating ? (myAnimPos ?? myState?.pos ?? 0) : (myState?.pos ?? player.pos);
    return player.pos;
  };

  const getStripColor = (tile) => tile.type === 'property' ? tile.color : (TILE_STRIP_COLOR[tile.type] || 'bg-slate-700');

  // Teks tile: side2=kiri(vertikal), side4=kanan(vertikal), lainnya normal
  const getTextStyle = (tile) => {
    if (tile.type === 'corner') return {};
    if (tile.side === 2) return { writingMode: 'vertical-rl', transform: 'rotate(180deg)' };
    if (tile.side === 4) return { writingMode: 'vertical-rl' };
    return {};
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (appState === 'lobby') return (
    <div className="flex flex-col items-center justify-center w-full h-[80vh]">
      <div className="w-full max-w-sm bg-slate-950 p-8 rounded-2xl border border-slate-700 text-center shadow-2xl">
        <h1 className="text-3xl font-black text-green-500 mb-2 tracking-tight">MONOPOLI UPN</h1>
        <p className="text-slate-300 mb-8 font-medium">Halo, <span className="font-bold text-white">{currentUser.nama}</span>!<br/><span className="text-yellow-400 font-extrabold">Total Poin: ⭐️ {currentUser.points}</span></p>
        <button onClick={createRoom} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-lg text-lg mb-6 shadow-lg transition-transform active:scale-95">BUAT ROOM BARU</button>
        <div className="flex items-center gap-2 mb-4"><div className="flex-1 h-px bg-slate-700"></div><span className="text-slate-500 text-sm font-bold">ATAU</span><div className="flex-1 h-px bg-slate-700"></div></div>
        <input type="text" placeholder="Masukkan Kode Room" value={joinCode} onChange={e=>setJoinCode(e.target.value)} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-lg text-center text-xl font-black tracking-[0.5em] mb-4 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 placeholder:tracking-normal" maxLength={4}/>
        <button onClick={()=>joinRoom()} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg text-lg shadow-lg transition-transform active:scale-95">JOIN ROOM</button>
      </div>
    </div>
  );

  if (appState === 'room') return (
    <div className="flex flex-col items-center justify-center w-full h-[80vh]">
      <div className="w-full max-w-sm bg-slate-950 p-8 rounded-2xl border border-slate-700 text-center shadow-2xl">
        <p className="text-slate-400 font-bold mb-2 uppercase text-xs tracking-widest">Kode Room</p>
        <h1 className="text-5xl font-black text-white tracking-[0.2em] mb-8 bg-slate-800 py-4 rounded-xl border border-slate-700">{currentRoom.id}</h1>
        <h3 className="text-left font-bold text-green-400 mb-4">Pemain ({players.length}/6):</h3>
        <div className="flex flex-col gap-2 mb-8 max-h-48 overflow-y-auto pr-1">
          {players.map(p=>(
            <div key={p.nim} className="bg-slate-800 p-3 rounded-lg flex items-center justify-between border border-slate-700">
              <span className="font-semibold text-sm">{p.nama} {p.nim===currentUser.nim?<span className="text-slate-400">(Kamu)</span>:''}</span>
            </div>
          ))}
        </div>
        <button onClick={startGame} className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-lg text-lg shadow-lg transition-transform active:scale-95">MULAI GAME 🚀</button>
      </div>
    </div>
  );

  if (appState === 'result') {
    // Mengecek apakah pemain ini adalah sang juara
    const myResult = players.find(p => p.nim === currentUser.nim);
    const isWinner = myResult?.rank === 1;

    return (
      <div className="flex flex-col items-center justify-center w-full h-[80vh]">
        {/* Bingkai akan bercahaya hijau jika dia pemenang, atau kuning jika dia kalah */}
        <div className={`w-full max-w-md bg-slate-950 p-8 rounded-2xl border ${isWinner ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-yellow-500'} text-center shadow-2xl`}>
          
          {/* Judul Teks Berubah Sesuai Status */}
          <h1 className={`text-4xl font-black mb-2 tracking-tighter ${isWinner ? 'text-green-400' : 'text-yellow-400'}`}>
            {isWinner ? '🏆 KAMU MENANG!' : 'GAME OVER'}
          </h1>
          
          {/* Sub-judul Pemenang */}
          {isWinner ? (
            <p className="text-green-300 mb-8 font-medium leading-tight">Selamat! Kamu bertahan sebagai juara dan otomatis mendapatkan hadiah <br/><span className="font-black text-green-400 text-xl">+3000 Pts</span>!</p>
          ) : (
            <p className="text-slate-300 mb-8 font-medium">Peringkat & Poin Pertandingan</p>
          )}

          {/* Daftar Pemain dan Poinnya */}
          <div className="flex flex-col gap-3 mb-8 text-left">
            {players.sort((a,b) => (a.rank || 99) - (b.rank || 99)).map(p => (
              <div key={p.nim} className={`p-4 rounded-xl flex justify-between items-center border ${p.rank === 1 ? 'bg-yellow-950/40 border-yellow-500' : 'bg-slate-800 border-slate-700'}`}>
                <span className="font-bold text-lg text-white">
                  {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '🏳️'} {p.nama}
                  {p.nim === currentUser.nim && <span className="text-slate-400 text-sm ml-1.5">(Kamu)</span>}
                </span>
                <span className={`font-black text-xl ${p.rank === 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                  +{p.rank === 1 ? 3000 : p.rank === 2 ? 1500 : p.rank === 3 ? 750 : 0} Pts
                </span>
              </div>
            ))}
          </div>
          
          <button onClick={exitGame} className="w-full py-4 bg-slate-800 hover:bg-slate-700 font-black rounded-lg text-lg text-white transition-colors active:scale-95">
            KEMBALI KE LOBBY
          </button>
        </div>
      </div>
    );
  }

  // ═══ GAME ════════════════════════════════════════════════════════════════
  const journeyTile = journeyLog.length > 0 ? BOARD_DATA[journeyLog[Math.min(journeyIdx, journeyLog.length - 1)]] : null;

  return (
    <div className="flex flex-col items-center bg-slate-900 min-h-screen text-white p-2 w-full overflow-hidden">

      {/* HEADER */}
      <div className="w-full max-w-[600px] flex justify-between items-center mb-3 bg-slate-950 p-3 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-green-400 font-black text-lg">{currentUser.nama} {myState?.is_bankrupt && <span className="text-red-500">(BANGKRUT)</span>}</h2>
          <div className="flex gap-2 mt-1">
            <button onClick={()=>setShowAssetsModal(true)} className="text-[10px] bg-yellow-500 px-2.5 py-1 rounded-full text-black font-extrabold hover:bg-yellow-400">ASETKU</button>
            {!myState?.is_bankrupt && <button onClick={declareBankrupt} className="text-[10px] bg-red-600 px-2.5 py-1 rounded-full text-white font-extrabold hover:bg-red-500">MENYERAH 🏳️</button>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Saldo</p>
          <p className={`text-xl font-black ${(myState?.cash??0)<0?'text-red-500':'text-green-400'}`}>Rp {myState?.cash??0}k</p>
        </div>
      </div>

      {/* PAPAN */}
      <div className="w-full max-w-[600px] mx-auto pb-3">
        <div className="relative w-full aspect-square bg-slate-950 p-1 rounded-2xl border border-slate-700 shadow-inner">

          <div className="grid grid-cols-11 grid-rows-11 h-full w-full gap-[1px]">
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
              const bgClass = owner ? `${owner.color} bg-opacity-25` : isCorner ? 'bg-slate-700' : 'bg-slate-800/50';

              // Strip posisi berdasarkan sisi
              const stripPos =
                tile.side===1 ? 'top-0 left-0 right-0 h-[4px]' :
                tile.side===2 ? 'top-0 right-0 bottom-0 w-[4px]' :
                tile.side===3 ? 'bottom-0 left-0 right-0 h-[4px]' :
                tile.side===4 ? 'top-0 left-0 bottom-0 w-[4px]' : '';

              const textStyle = getTextStyle(tile);
              const typeLabel = TILE_TYPE_LABEL[tile.type];
              const isVertical = tile.side===2 || tile.side===4;

              return (
                <div
                  key={tile.id}
                  onClick={()=>handleTileClick(tile)}
                  style={{gridArea:area}}
                  className={`relative flex flex-col items-center justify-center cursor-pointer overflow-hidden border border-slate-700/50 ${bgClass} active:brightness-125 transition-all`}
                >
                  {/* Strip warna tipe */}
                  {!isCorner && <div className={`absolute ${stripPos} ${stripColor} pointer-events-none`}/>}

                  {/* Teks — mengisi ruang tersisa, tidak overflow */}
                  <div style={textStyle} className="flex-1 w-full h-full flex items-center justify-center overflow-hidden p-[1px]">
                    <div
                      className="text-white font-semibold text-center leading-tight overflow-hidden"
                      style={{
                        fontSize: isCorner ? '6.5px' : '5px',
                        lineHeight: 1.1,
                        wordBreak: 'break-word',
                        hyphens: 'auto',
                        display: '-webkit-box',
                        WebkitLineClamp: isVertical ? 999 : 5,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        maxWidth: '100%',
                        maxHeight: '100%',
                      }}
                    >
                      {typeLabel && <span style={{display:'block',fontSize:'4px',letterSpacing:'0.04em',color:'#fde68a'}}>{typeLabel}</span>}
                      {tile.name}
                    </div>
                  </div>

                  {/* Level upgrade */}
                  {prop && (
                    <span className="absolute bottom-0 right-[1px] text-white font-black" style={{fontSize:'4px'}}>
                      {prop.upgrade_level>=5?'★':`L${prop.upgrade_level||0}`}
                    </span>
                  )}

                  {/* Bidak */}
                  {playersOnTile.length>0 && (
                    <div className="absolute bottom-[2px] left-0 right-0 flex flex-wrap gap-[1px] justify-center">
                      {playersOnTile.map(p=>(
                        <div
                          key={p.nim}
                          style={{width:7,height:7,flexShrink:0}}
                          className={`rounded-full border border-white/80 ${p.color||'bg-blue-400'} ${p.nim===currentUser.nim&&isAnimating?'ring-1 ring-white scale-125':''} transition-all duration-150`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── PANEL TENGAH: VIDEO PERJALANAN ── */}
          <div
            className="absolute z-20 bg-slate-950 rounded-xl border border-slate-600 overflow-hidden flex flex-col"
            style={{ inset: 'calc(100% / 11 + 2px)' }}
          >
            {isAnimating && journeyTile ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-[3px] px-2 py-1">
                {/* Strip warna kotak saat ini */}
                <div className={`w-full h-[5px] rounded-sm ${getStripColor(journeyTile)} shrink-0`}/>

                <span className="text-slate-500 font-bold" style={{fontSize:'7px'}}>
                  Langkah {journeyIdx+1}/{journeyLog.length}
                </span>

                <span className="font-black text-white text-center leading-tight px-1" style={{fontSize:'10px',lineHeight:1.2}}>
                  {journeyTile.name}
                </span>

                <span style={{fontSize:'18px'}}>
                  {TILE_ICON_MAP[journeyTile.type] || '🏡'}
                </span>

                {journeyTile.price && (
                  <span className="text-yellow-400 font-extrabold" style={{fontSize:'8px'}}>Rp {journeyTile.price}k</span>
                )}

                {/* Dadu kecil */}
                <div className="flex gap-1">
                  {dice.map((d,i)=>(
                    <div key={i} className="bg-white rounded flex items-center justify-center text-black font-black" style={{width:16,height:16,fontSize:'8px'}}>{d}</div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="w-full px-1 mt-1">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-200"
                      style={{width:`${((journeyIdx+1)/journeyLog.length)*100}%`}}/>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-1 p-2">
                {myState?.last_message ? (
                  <>
                    <span style={{fontSize:'16px'}}>
                      {myState.last_message.includes('cair')?'💰':myState.last_message.includes('sewa')?'🏠':myState.last_message.includes('Bayar')?'💸':myState.last_message.includes('Busted')?'🚨':'ℹ️'}
                    </span>
                    <p className="text-white font-bold text-center px-1" style={{fontSize:'8px',lineHeight:1.3}}>
                      {myState.last_message}
                    </p>
                  </>
                ) : (
                  <>
                    <span style={{fontSize:'22px'}}>🎲</span>
                    <p className="text-slate-400 font-bold text-center" style={{fontSize:'8px'}}>LEMPAR DADU UNTUK MULAI</p>
                  </>
                )}

                {/* Legenda pemain aktif */}
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {players.filter(p=>!p.is_bankrupt).map(p=>(
                    <div key={p.nim} className="flex items-center gap-[2px]">
                      <div className={`rounded-full ${p.color||'bg-slate-400'}`} style={{width:6,height:6}}/>
                      <span className="text-slate-300" style={{fontSize:'5px'}}>{p.nama.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TOMBOL LEMPAR DADU */}
      <div className="w-full max-w-[600px] mx-auto mb-3">
        <button
          onClick={rollDice}
          disabled={isRolling||isAnimating||myState?.is_bankrupt}
          className="w-full bg-green-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-green-500 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnimating ? `🎲 ${dice[0]} + ${dice[1]} = ${dice[0]+dice[1]} langkah` : 'LEMPAR DADU 🎲'}
        </button>
      </div>

      {/* PANEL INFO */}
      <div className="w-full max-w-[600px] bg-slate-950 p-3 rounded-xl border border-slate-700 min-h-[90px] mb-20 shadow-xl">
        {selectedInfo ? (
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-sm shrink-0 ${getStripColor(selectedInfo)}`}/>
              <h3 className="font-black text-yellow-400 text-base leading-tight">{selectedInfo.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {selectedInfo.price && <p className="text-slate-300">Harga: <span className="font-bold text-white">Rp {selectedInfo.price}k</span></p>}
              {selectedInfo.rent  && <p className="text-slate-300">Sewa: <span className="font-bold text-white">Rp {selectedInfo.rent}k</span></p>}
              {selectedInfo.prop && <>
                <p className="text-slate-300">Pemilik: <span className="font-bold text-white">{selectedInfo.owner?.nama||'...'}</span></p>
                <p className="text-slate-300">Level: <span className="font-bold text-green-400">{selectedInfo.prop.upgrade_level>=5?'Apartemen ★':'Lvl '+(selectedInfo.prop.upgrade_level||0)}</span></p>
              </>}
            </div>
            {!selectedInfo.prop && selectedInfo.type==='property' && myState?.pos === selectedInfo.id && (
              <button onClick={()=>{setActiveTile(selectedInfo);setShowBuyModal(true);}} className="mt-2 w-full py-1.5 bg-green-600 rounded font-bold text-xs hover:bg-green-500">BELI PROPERTI</button>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-center pt-5 font-bold text-xs">Ketuk kotak di papan untuk melihat info properti</p>
        )}
      </div>

      {/* MODAL: PILIH WARNA */}
      {showColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-sm text-center border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Pilih Warna Bidak</h2>
            <div className="grid grid-cols-3 gap-4">
              {PLAYER_COLORS.map(c=>(<button key={c} onClick={()=>selectColor(c)} className={`h-16 w-full rounded-xl ${c} hover:scale-105 transition-transform border-4 border-white shadow-lg`}/>))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASET */}
      {showAssetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm text-center border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-5 text-white">Aset Properti Kamu</h2>
            <div className="max-h-60 overflow-y-auto mb-5 pr-1 flex flex-col gap-2">
              {properties.filter(p=>p.owner_nim===currentUser.nim).map(prop=>{
                const tile=BOARD_DATA.find(t=>t.id===prop.tile_id);
                const sp=Math.floor(tile.price*0.75);
                return (
                  <div key={prop.id||prop.tile_id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg text-left border border-slate-700">
                    <div className="flex flex-col flex-1 pr-2">
                      <span className="text-sm font-bold text-white leading-tight">{tile.name}</span>
                      <span className="text-[10px] font-medium text-slate-400">{prop.upgrade_level>=5?'⚡ Apartemen':'🏠 Lvl '+(prop.upgrade_level||0)}</span>
                    </div>
                    {!myState?.is_bankrupt && (
                      <button onClick={e=>sellProperty(prop,e)} className="px-2.5 py-2 bg-red-600 text-[10px] font-extrabold rounded-md hover:bg-red-500 active:scale-95 text-white">
                        JUAL (+{sp}k)
                      </button>
                    )}
                  </div>
                );
              })}
              {properties.filter(p=>p.owner_nim===currentUser.nim).length===0 && <p className="text-sm text-slate-500 py-4">Belum ada properti.</p>}
            </div>
            <button onClick={()=>setShowAssetsModal(false)} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm text-white">TUTUP</button>
          </div>
        </div>
      )}

      {/* MODAL: UPGRADE */}
      {showUpgradeModal && activeTile && activeProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-sm text-center border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-white">
              {activeProp.upgrade_level>=5?'Status: Apartemen ★':`Upgrade ke ${activeProp.upgrade_level>=4?'Apartemen':'Rumah Lvl '+((activeProp.upgrade_level||0)+1)}?`}
            </h2>
            {activeProp.upgrade_level<5 && <p className="text-yellow-400 font-extrabold text-lg mb-6">Biaya: Rp {Math.floor(activeTile.price*0.5)}k</p>}
            <div className="flex gap-4">
              {activeProp.upgrade_level<5 && <button onClick={upgradeProperty} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl">UPGRADE</button>}
              <button onClick={()=>setShowUpgradeModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl">TUTUP</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BELI */}
      {showBuyModal && activeTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-sm text-center border border-green-600 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-white">Beli {activeTile.name}?</h2>
            <p className="text-green-400 font-extrabold text-xl mb-6">Harga: Rp {activeTile.price}k</p>
            <div className="flex gap-4">
              <button onClick={buyProperty} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl">BELI</button>
              <button onClick={()=>setShowBuyModal(false)} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">LEWAT</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TOD */}
      {showToD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-sm text-center border border-slate-700 shadow-2xl min-h-[350px] flex flex-col justify-between overflow-hidden">
            {!todType ? (
              <><h1 className="text-3xl text-white font-black mb-8">Silahkan Pilih</h1><div className="flex gap-3"><button onClick={()=>startSpin('TRUTH')} className="flex-1 py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl text-xl active:scale-95">TRUTH 🤐</button><button onClick={()=>startSpin('DARE')} className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xl active:scale-95">DARE 🔥</button></div></>
            ) : !todQuestion ? (
              <div className="flex flex-col flex-1">
                <div className="bg-slate-950 p-6 rounded-xl mb-6 h-36 flex items-center justify-center border border-slate-700 shadow-inner"><p className="text-xl font-bold text-white text-center leading-snug">{spinningText}</p></div>
                <div className="h-16 mt-auto">{isSpinning&&<button onClick={stopSpin} className="w-full h-14 bg-yellow-500 text-black font-black rounded-xl border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all">STOP!</button>}</div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 justify-center"><h2 className="text-2xl font-black mb-4 text-yellow-400 uppercase">{todType}!</h2><p className="text-white mb-8 font-semibold text-center flex-1 text-lg leading-relaxed">{todQuestion}</p><button onClick={()=>{setShowToD(false);setTodType('');setTodQuestion('');}} className="w-full py-3 bg-green-600 hover:bg-green-500 font-bold rounded-lg text-white">TUTUP</button></div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EVENT */}
      {showEventCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-sm text-center border border-purple-600 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-white">{activeCard.title}</h2>
            <p className="mb-6 text-slate-200 text-sm font-medium leading-relaxed">{activeCard.text}</p>
            <button onClick={()=>setShowEventCard(false)} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg">TERIMA</button>
          </div>
        </div>
      )}
    </div>
  );
}