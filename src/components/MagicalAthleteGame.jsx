// src/components/MagicalAthleteGame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ATHLETE_CHARACTERS, TRACK_TILES, PLAYER_COLORS } from '../data/athleteCharacters';
import confetti from 'canvas-confetti';

// Koordinat petak untuk sirkuit stadion balap lari oval melingkar (9 Kolom x 6 Baris)
const TRACK_LOOP_COORDS = {
  // Sisi Lurus Atas (Lari ke Kanan ➔)
  0:  { col: 2, row: 1, arrow: '➔' },
  1:  { col: 3, row: 1, arrow: '➔' },
  2:  { col: 4, row: 1, arrow: '➔' },
  3:  { col: 5, row: 1, arrow: '➔' },
  4:  { col: 6, row: 1, arrow: '➔' },
  5:  { col: 7, row: 1, arrow: '➔' },
  6:  { col: 8, row: 1, arrow: '➔' },
  7:  { col: 9, row: 1, arrow: '⤵' },

  // Tikungan & Sisi Kanan (Lari ke Bawah ↓)
  8:  { col: 9, row: 2, arrow: '↓' },
  9:  { col: 9, row: 3, arrow: '↓' },
  10: { col: 9, row: 4, arrow: '↓' },
  11: { col: 9, row: 5, arrow: '↓' },
  12: { col: 9, row: 6, arrow: '↵' },

  // Sisi Lurus Bawah (Lari ke Kiri ⬅)
  13: { col: 8, row: 6, arrow: '⬅' },
  14: { col: 7, row: 6, arrow: '⬅' },
  15: { col: 6, row: 6, arrow: '⬅' },
  16: { col: 5, row: 6, arrow: '⬅' },
  17: { col: 4, row: 6, arrow: '⬅' },
  18: { col: 3, row: 6, arrow: '⬅' },
  19: { col: 2, row: 6, arrow: '⬅' },
  20: { col: 1, row: 6, arrow: '↰' },

  // Tikungan & Lurus Depan / Home Stretch (Lari ke Atas ↑)
  21: { col: 1, row: 5, arrow: '↑' },
  22: { col: 1, row: 4, arrow: '↑' },
  23: { col: 1, row: 3, arrow: '↑' },
  24: { col: 1, row: 2, arrow: '🏁' }, // FINISH LINE
};

export default function MagicalAthleteGame() {
  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState({
    nim: '',
    nama: '',
    isAdmin: false
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputNim, setInputNim] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- ROOM STATE ---
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [alumniList, setAlumniList] = useState([]);
  const [searchAlumni, setSearchAlumni] = useState('');
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null);

  // --- GAMEPLAY LOCAL STATE ---
  const [diceRolling, setDiceRolling] = useState(false);
  const [lastDice, setLastDice] = useState(null);
  const [selectedDraftChar, setSelectedDraftChar] = useState(null);
  const [secretSelectedChar, setSecretSelectedChar] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessingMove, setIsProcessingMove] = useState(false);

  // Ref to prevent stale closures in realtime and bot ticks
  const roomDataRef = useRef(null);
  const playersRef = useRef([]);
  const isBotThinkingRef = useRef(false);

  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // 1. CEK SESI LOGIN DARI LOCALSTORAGE
  useEffect(() => {
    const savedNim = localStorage.getItem('user_nim');
    const savedNama = localStorage.getItem('user_nama');
    const savedAdmin = localStorage.getItem('is_admin') === 'true';

    if (savedNim && savedNama) {
      setCurrentUser({
        nim: savedNim,
        nama: savedNama,
        isAdmin: savedAdmin
      });
      setIsLoggedIn(true);
    }
  }, []);

  // 2. FETCH DAFTAR ALUMNI UNTUK ADMIN SELECTOR
  useEffect(() => {
    if (currentUser.isAdmin) {
      const fetchAlumni = async () => {
        const { data } = await supabase
          .from('alumni')
          .select('nim, nama')
          .order('nama', { ascending: true });
        if (data) setAlumniList(data);
      };
      fetchAlumni();
    }
  }, [currentUser.isAdmin]);

  // 3. LOGIN MANUAL DI HALAMAN TERSEMBUNYI JIKA BELUM ADA SESI
  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!inputNim.trim()) {
      setLoginError('Masukkan NIM terlebih dahulu!');
      setLoginLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .eq('nim', inputNim.trim())
      .single();

    if (error || !data) {
      setLoginError('NIM tidak terdaftar di database alumni!');
      setLoginLoading(false);
      return;
    }

    let isAdminStatus = data.is_admin || false;
    if (data.nim === '114160066') {
      const pass = window.prompt('Masukkan Passkey Admin:');
      if (pass) {
        const { data: setts } = await supabase.from('app_settings').select('admin_passkey').eq('id', 1).single();
        if (setts && pass === setts.admin_passkey) {
          isAdminStatus = true;
        }
      }
    }

    localStorage.setItem('user_nim', data.nim);
    localStorage.setItem('user_nama', data.nama);
    localStorage.setItem('is_admin', isAdminStatus.toString());

    setCurrentUser({
      nim: data.nim,
      nama: data.nama,
      isAdmin: isAdminStatus
    });
    setIsLoggedIn(true);
    setLoginLoading(false);
  };

  // 4. BUAT ROOM BARU (KHUSUS ADMIN)
  const handleCreateRoom = async () => {
    const generatedCode = 'ENV' + Math.floor(100 + Math.random() * 900);
    const poolCharIds = ATHLETE_CHARACTERS.map(c => c.id);

    // Insert Room
    const { error: roomErr } = await supabase.from('athlete_rooms').insert([
      {
        room_code: generatedCode,
        admin_nim: currentUser.nim,
        status: 'LOBBY',
        current_round: 1,
        current_turn_slot: 1,
        draft_turn_index: 0,
        draft_order: [],
        pool_characters: poolCharIds,
        last_action: `Ruang balapan ${generatedCode} dibuat oleh Admin ${currentUser.nama}.`
      }
    ]);

    if (roomErr) {
      alert('Gagal membuat room: ' + roomErr.message);
      return;
    }

    // Insert Admin sebagai Slot 1
    const { error: playErr } = await supabase.from('athlete_players').insert([
      {
        room_code: generatedCode,
        slot_number: 1,
        nim: currentUser.nim,
        nama: currentUser.nama,
        is_bot: false,
        color: PLAYER_COLORS[0].id,
        drafted_characters: [],
        active_character_id: null,
        used_characters: [],
        position: 0,
        score: 0,
        is_ready: true
      }
    ]);

    if (playErr) {
      alert('Gagal menambahkan host: ' + playErr.message);
      return;
    }

    setRoomCode(generatedCode);
    setIsInRoom(true);
  };

  // 5. GABUNG KE ROOM (UNTUK PEMAIN LAIN)
  const handleJoinRoom = async (e) => {
    e?.preventDefault();
    const code = inputRoomCode.trim().toUpperCase();
    if (!code) return;

    const { data: room, error } = await supabase
      .from('athlete_rooms')
      .select('*')
      .eq('room_code', code)
      .single();

    if (error || !room) {
      alert('Ruangan tidak ditemukan! Pastikan kode room benar.');
      return;
    }

    setRoomCode(code);
    setIsInRoom(true);
  };

  // 6. REALTIME RADAR & SYNC ROOM DATA
  useEffect(() => {
    if (!isInRoom || !roomCode) return;

    // Load initial
    const loadGameData = async () => {
      const { data: room } = await supabase
        .from('athlete_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();
      if (room) setRoomData(room);

      const { data: plyrs } = await supabase
        .from('athlete_players')
        .select('*')
        .eq('room_code', roomCode)
        .order('slot_number', { ascending: true });
      if (plyrs) setPlayers(plyrs);
    };

    loadGameData();

    // Subscribe to channels
    const channel = supabase
      .channel(`athlete_game:${roomCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athlete_rooms', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.new) {
            setRoomData(payload.new);
            if (payload.new.last_action) {
              setToastMessage(payload.new.last_action);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athlete_players', filter: `room_code=eq.${roomCode}` },
        async () => {
          const { data: updatedPlyrs } = await supabase
            .from('athlete_players')
            .select('*')
            .eq('room_code', roomCode)
            .order('slot_number', { ascending: true });
          if (updatedPlyrs) setPlayers(updatedPlyrs);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isInRoom, roomCode]);

  // Helper Player Ku
  const myPlayer = players.find(p => p.nim === currentUser.nim);
  const mySlot = myPlayer?.slot_number;

  // 7. ADMIN CONTROLS: ASSIGN PEMAIN KE SLOT ATAU BOT
  const handleAssignPlayer = async (alumnus) => {
    if (!targetSlot) return;

    // Cek apakah nim sudah ada di slot lain
    const existing = players.find(p => p.nim === alumnus.nim);
    if (existing) {
      alert(`${alumnus.nama} sudah berada di Slot ${existing.slot_number}!`);
      return;
    }

    const colorConfig = PLAYER_COLORS[targetSlot - 1] || PLAYER_COLORS[0];
    const newPlayer = {
      room_code: roomCode,
      slot_number: targetSlot,
      nim: alumnus.nim,
      nama: alumnus.nama,
      is_bot: false,
      color: colorConfig.id,
      drafted_characters: [],
      active_character_id: null,
      used_characters: [],
      position: 0,
      score: 0,
      is_ready: true
    };

    // Optimistic UI update
    setPlayers(prev => [...prev.filter(p => p.slot_number !== targetSlot), newPlayer].sort((a, b) => a.slot_number - b.slot_number));
    setShowAlumniModal(false);
    setTargetSlot(null);

    // Hapus player di slot tersebut jika ada
    await supabase.from('athlete_players').delete().eq('room_code', roomCode).eq('slot_number', targetSlot);

    // Insert player baru
    const { error } = await supabase.from('athlete_players').insert([newPlayer]);
    if (error) {
      console.error('Gagal assign pemain:', error);
    }

    // Refresh data dari database
    const { data: updated } = await supabase.from('athlete_players').select('*').eq('room_code', roomCode).order('slot_number', { ascending: true });
    if (updated) setPlayers(updated);
  };

  const handleAddBot = async (slotNum) => {
    const botNames = ['Bot Alum', 'Bot Sludge', 'Bot Karst', 'Bot Magma', 'Bot Methane'];
    const botName = botNames[slotNum - 1] || `Bot P${slotNum}`;
    const botNim = `BOT_${slotNum}_${Math.floor(100 + Math.random() * 900)}`;
    const colorConfig = PLAYER_COLORS[slotNum - 1] || PLAYER_COLORS[0];

    const newBot = {
      room_code: roomCode,
      slot_number: slotNum,
      nim: botNim,
      nama: botName,
      is_bot: true,
      color: colorConfig.id,
      drafted_characters: [],
      active_character_id: null,
      used_characters: [],
      position: 0,
      score: 0,
      is_ready: true
    };

    // Optimistic UI update
    setPlayers(prev => [...prev.filter(p => p.slot_number !== slotNum), newBot].sort((a, b) => a.slot_number - b.slot_number));

    await supabase.from('athlete_players').delete().eq('room_code', roomCode).eq('slot_number', slotNum);

    const { error } = await supabase.from('athlete_players').insert([newBot]);
    if (error) {
      console.error('Gagal tambah bot:', error);
    }

    // Refresh data dari database
    const { data: updated } = await supabase.from('athlete_players').select('*').eq('room_code', roomCode).order('slot_number', { ascending: true });
    if (updated) setPlayers(updated);
  };

  const handleRemoveSlot = async (slotNum) => {
    // 1. Optimistic UI update langsung hilang dari layar
    setPlayers(prev => prev.filter(p => p.slot_number !== slotNum));

    // 2. Hapus dari database Supabase
    const { error } = await supabase
      .from('athlete_players')
      .delete()
      .eq('room_code', roomCode)
      .eq('slot_number', slotNum);

    if (error) {
      console.error('Gagal menghapus slot pemain:', error);
      alert('Gagal menghapus pemain: ' + error.message);
    }

    // 3. Pastikan state tersinkron dengan database
    const { data: updated } = await supabase
      .from('athlete_players')
      .select('*')
      .eq('room_code', roomCode)
      .order('slot_number', { ascending: true });
    if (updated) setPlayers(updated);
  };

  // 8. MULAI FASE DRAFT (ADMIN TRIGGER)
  const handleStartDraft = async () => {
    if (players.length < 2) {
      alert('Minimal butuh 2 pemain (atau Bot) untuk memulai balapan!');
      return;
    }

    // Buat Urutan Snake Draft (4 Ronde Draft)
    // Contoh 4 Pemain: [1,2,3,4, 4,3,2,1, 1,2,3,4, 4,3,2,1]
    const pSlots = players.map(p => p.slot_number);
    let order = [];
    for (let r = 0; r < 4; r++) {
      if (r % 2 === 0) {
        order = order.concat([...pSlots]);
      } else {
        order = order.concat([...pSlots].reverse());
      }
    }

    await supabase.from('athlete_rooms').update({
      status: 'DRAFT',
      draft_turn_index: 0,
      draft_order: order,
      pool_characters: ATHLETE_CHARACTERS.map(c => c.id),
      last_action: '🔥 Bursa Transfer Dimulai! Pemain pertama silakan pilih atlet jagoanmu!'
    }).eq('room_code', roomCode);
  };

  // Helper Host check: Room creator or Admin
  const isHost = roomData?.admin_nim === currentUser.nim || currentUser.isAdmin || mySlot === 1;

  // 9. EKSEKUSI PEMILIHAN ATLET (DRAFT PICK)
  const handleDraftPick = async (charId) => {
    const currentR = roomDataRef.current || roomData;
    const currentP = playersRef.current || players;
    if (!currentR || currentR.status !== 'DRAFT') return;

    const currentDraftSlot = currentR.draft_order?.[currentR.draft_turn_index];
    const currentDraftPlayer = currentP.find(p => p.slot_number === currentDraftSlot);

    if (!currentDraftPlayer) return;

    // Pastikan ini giliran player terkait (atau Host mengeksekusi untuk bot)
    if (currentDraftPlayer.nim !== currentUser.nim && !currentDraftPlayer.is_bot) {
      alert('Bukan giliran Anda memilih!');
      return;
    }

    const updatedPool = (currentR.pool_characters || []).filter(id => id !== charId);
    const updatedDrafted = [...(currentDraftPlayer.drafted_characters || []), charId];

    // Optimistic UI updates
    setPlayers(prev => prev.map(p => p.id === currentDraftPlayer.id ? { ...p, drafted_characters: updatedDrafted } : p));
    setRoomData(prev => prev ? {
      ...prev,
      draft_turn_index: prev.draft_turn_index + 1,
      pool_characters: updatedPool
    } : prev);

    // Update Player di database
    await supabase.from('athlete_players').update({
      drafted_characters: updatedDrafted
    }).eq('id', currentDraftPlayer.id);

    const nextIndex = currentR.draft_turn_index + 1;
    const isDraftFinished = nextIndex >= (currentR.draft_order || []).length;
    const chosenChar = ATHLETE_CHARACTERS.find(c => c.id === charId);

    if (isDraftFinished) {
      // Draft Selesai! Pindah ke fase Pemilihan Atlet Ronde 1
      await supabase.from('athlete_rooms').update({
        status: 'RACE_SELECT',
        current_round: 1,
        draft_turn_index: nextIndex,
        pool_characters: updatedPool,
        last_action: `🎉 Draft selesai! ${currentDraftPlayer.nama} memilih ${chosenChar?.name}. Waktunya pilih atlet untuk Ronde 1!`
      }).eq('room_code', roomCode);
    } else {
      const nextSlot = currentR.draft_order[nextIndex];
      const nextPlayer = currentP.find(p => p.slot_number === nextSlot);

      await supabase.from('athlete_rooms').update({
        draft_turn_index: nextIndex,
        pool_characters: updatedPool,
        last_action: `✨ ${currentDraftPlayer.nama} memilih ${chosenChar?.name}! Giliran: ${nextPlayer?.nama}.`
      }).eq('room_code', roomCode);
    }

    setSelectedDraftChar(null);
  };

  // 10. BOT AUTOMATION (HANYA DIEKSEKUSI OLEH CLIENT HOST AGAR TIDAK DUPLIKAT)
  useEffect(() => {
    if (!isHost || !roomData) return;

    // BOT TICK PADA FASE DRAFT
    if (roomData.status === 'DRAFT') {
      const currentDraftSlot = roomData.draft_order?.[roomData.draft_turn_index];
      const currentDraftPlayer = players.find(p => p.slot_number === currentDraftSlot);

      if (currentDraftPlayer?.is_bot && !isBotThinkingRef.current) {
        isBotThinkingRef.current = true;
        const timer = setTimeout(async () => {
          try {
            const currentR = roomDataRef.current || roomData;
            const available = currentR.pool_characters || [];
            if (available.length > 0) {
              const randomPick = available[Math.floor(Math.random() * available.length)];
              await handleDraftPick(randomPick);
            }
          } catch (err) {
            console.error('Error bot drafting:', err);
          } finally {
            isBotThinkingRef.current = false;
          }
        }, 1000);

        return () => {
          clearTimeout(timer);
          isBotThinkingRef.current = false;
        };
      }
    }

    // BOT TICK PADA FASE RACE_SELECT (LOCK-IN)
    if (roomData.status === 'RACE_SELECT') {
      const botWaiting = players.find(p => p.is_bot && !p.active_character_id);
      if (botWaiting && !isBotThinkingRef.current) {
        isBotThinkingRef.current = true;
        const timer = setTimeout(async () => {
          try {
            const unused = (botWaiting.drafted_characters || []).filter(
              id => !(botWaiting.used_characters || []).includes(id)
            );
            if (unused.length > 0) {
              const pick = unused[Math.floor(Math.random() * unused.length)];
              await supabase.from('athlete_players').update({
                active_character_id: pick,
                is_ready: true
              }).eq('id', botWaiting.id);
            }
          } catch (err) {
            console.error('Error bot lock-in:', err);
          } finally {
            isBotThinkingRef.current = false;
          }
        }, 800);

        return () => {
          clearTimeout(timer);
          isBotThinkingRef.current = false;
        };
      }
    }

    // BOT TICK PADA FASE RACING (LEMPAR DADU)
    if (roomData.status === 'RACING') {
      const activeSlot = roomData.current_turn_slot;
      const activePlayer = players.find(p => p.slot_number === activeSlot);

      if (activePlayer?.is_bot && !isBotThinkingRef.current && !diceRolling) {
        isBotThinkingRef.current = true;
        const timer = setTimeout(async () => {
          try {
            await executePlayerMove(activePlayer, null);
          } catch (err) {
            console.error('Error bot move:', err);
          } finally {
            isBotThinkingRef.current = false;
          }
        }, 1200);

        return () => {
          clearTimeout(timer);
          isBotThinkingRef.current = false;
        };
      }
    }
  }, [roomData, players, isHost, diceRolling]);

  // 11. LOCK-IN ATLET UNTUK BALAPAN RONDE SAAT INI
  const handleLockInCharacter = async () => {
    if (!myPlayer || !secretSelectedChar) return;

    await supabase.from('athlete_players').update({
      active_character_id: secretSelectedChar,
      is_ready: true
    }).eq('id', myPlayer.id);

    setSecretSelectedChar(null);
  };

  // Cek apakah semua pemain sudah lock-in atlet untuk ronde ini
  useEffect(() => {
    if (!isHost || !roomData || roomData.status !== 'RACE_SELECT') return;

    const allReady = players.length >= 2 && players.every(p => p.active_character_id);
    if (allReady) {
      // Semua sudah lock-in! Buka tirai dan mulai balapan!
      const timer = setTimeout(async () => {
        // Reset posisi ke 0 untuk semua pemain
        await supabase.from('athlete_players').update({
          position: 0,
          is_ready: false,
          skill_used: false
        }).eq('room_code', roomCode);

        // Eksekusi skill awal (Oxygen Boost: +3 petak di awal ronde)
        const updatedPlayers = await supabase.from('athlete_players').select('*').eq('room_code', roomCode);
        if (updatedPlayers.data) {
          for (const p of updatedPlayers.data) {
            if (p.active_character_id === 'dissolved_oxygen') {
              await supabase.from('athlete_players').update({
                position: 3
              }).eq('id', p.id);
            }
          }
        }

        await supabase.from('athlete_rooms').update({
          status: 'RACING',
          current_turn_slot: 1,
          last_action: `🏁 Ronde ${roomData.current_round} Resmi Dimulai! Semua atlet berada di lintasan!`
        }).eq('room_code', roomCode);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [players, roomData, currentUser.isAdmin]);

  // 12. LOGIKA UTAMA LEMPAR DADU & PERGERAKAN ATLET
  const executePlayerMove = async (playerToMove, overrideSteps = null) => {
    if (isProcessingMove) return;
    setIsProcessingMove(true);
    setDiceRolling(true);

    let roll = overrideSteps !== null ? overrideSteps : Math.floor(1 + Math.random() * 6);
    setLastDice(roll);

    // Animasi jeda dadu
    await new Promise(r => setTimeout(r, 600));
    setDiceRolling(false);

    let charData = ATHLETE_CHARACTERS.find(c => c.id === playerToMove.active_character_id);
    let steps = roll;
    let skillNote = '';

    // --- SKILL CHECK SEBELUM MELANGKAH ---
    // 1. Alum Coagulant: Jika 1 atau 2, lempar ulang
    if (charData?.id === 'alum_coagulant' && (roll === 1 || roll === 2) && overrideSteps === null) {
      const secondRoll = Math.floor(1 + Math.random() * 6);
      steps = Math.max(roll, secondRoll);
      skillNote = ` [💧 Flash Flocculation: lempar ulang dari ${roll} jadi ${steps}!]`;
    }

    // 2. Activated Sludge: Dadu genap +1
    if (charData?.id === 'activated_sludge' && roll % 2 === 0 && overrideSteps === null) {
      steps += 1;
      skillNote = ` [🦠 Organic Breakdown: genap +1 langkah!]`;
    }

    // 3. Biogas Methane: Jika di posisi paling bontot, +3 langkah
    if (charData?.id === 'biogas_methane' && overrideSteps === null) {
      const minPos = Math.min(...players.map(p => p.position));
      if (playerToMove.position === minPos) {
        steps += 3;
        skillNote = ` [🔥 Methane Flare: posisi bontot +3 langkah!]`;
      }
    }

    // 4. Magmatic Pressure: Setelah petak 12, +2 langkah
    if (charData?.id === 'magma_pressure' && playerToMove.position >= 12 && overrideSteps === null) {
      steps += 2;
      skillNote = ` [🌋 Magma Burst: paruh kedua +2 langkah!]`;
    }

    let targetPos = Math.min(24, playerToMove.position + steps);

    // --- CHECK SLURRY TAILING (Viscous Trap: Lawan yang mencoba menyalip harus berhenti di petaknya) ---
    const tailingPlayer = players.find(p => p.active_character_id === 'slurry_tailing' && p.id !== playerToMove.id);
    if (tailingPlayer && playerToMove.position < tailingPlayer.position && targetPos > tailingPlayer.position) {
      targetPos = tailingPlayer.position;
      skillNote += ` [🪨 Terjebak Viscous Trap dari ${tailingPlayer.nama}!]`;
    }

    // --- CHECK TILE KHUSUS (BOOST / TRAP) ---
    const targetTile = TRACK_TILES.find(t => t.index === targetPos);
    if (targetTile) {
      if (targetTile.type === 'boost') {
        targetPos = Math.min(24, targetPos + 2);
        skillNote += ` [⚡ Meluncur di petak Boost +2!]`;
      } else if (targetTile.type === 'trap') {
        // Phytoremediation kebal terhadap jebakan!
        if (charData?.id === 'phytoremediation') {
          skillNote += ` [🌲 Phyto-Immunity: Kebal jebakan!]`;
        } else {
          targetPos = Math.max(0, targetPos - 2);
          skillNote += ` [⚠️ Terperosok jebakan -2!]`;
        }
      }
    }

    // --- CHECK MENDARAT DI PETAK ACID MINE DRAINAGE ---
    const acidPlayer = players.find(p => p.active_character_id === 'acid_mine' && p.id !== playerToMove.id);
    if (acidPlayer && acidPlayer.position === targetPos && targetPos < 24) {
      targetPos = Math.max(0, targetPos - 3);
      skillNote += ` [🧪 Terpental Corrosive Leach mundur 3 petak!]`;
    }

    // UPDATE POSISI PEMAIN YANG SEDANG GILIRAN
    await supabase.from('athlete_players').update({
      position: targetPos
    }).eq('id', playerToMove.id);

    // --- SKILL CEK PENUMPANG: Groundwater Flow (Subsurface Surge) ---
    // Jika ada lawan menyalip groundwater, groundwater ikut maju +2 petak
    const gwPlayer = players.find(p => p.active_character_id === 'groundwater' && p.id !== playerToMove.id);
    if (gwPlayer && playerToMove.position < gwPlayer.position && targetPos > gwPlayer.position) {
      const newGwPos = Math.min(24, gwPlayer.position + 2);
      await supabase.from('athlete_players').update({
        position: newGwPos
      }).eq('id', gwPlayer.id);
      skillNote += ` [🌊 ${gwPlayer.nama} terseret Subsurface Surge +2!]`;
    }

    // CEK APAKAH RONDE BERAKHIR (ATLET MENCAPAI FINISH LINE 24)
    if (targetPos >= 24) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      await handleFinishRound(playerToMove, `${playerToMove.nama} (${charData?.name}) Menembus Garis FINISH! 🏆`);
      setIsProcessingMove(false);
      return;
    }

    // Cek giliran berikutnya
    const currentSlotIdx = players.findIndex(p => p.slot_number === roomData.current_turn_slot);
    const nextSlotIdx = (currentSlotIdx + 1) % players.length;
    const nextSlot = players[nextSlotIdx].slot_number;
    const nextPlayer = players[nextSlotIdx];

    // Compost Nutrient: Jika dapat angka 6, dapat 1x lemparan tambahan!
    if (charData?.id === 'compost_nutrient' && roll === 6) {
      await supabase.from('athlete_rooms').update({
        last_action: `♻️ ${playerToMove.nama} dapat angka 6! Bio-Enrichment memberi giliran tambahan!`
      }).eq('room_code', roomCode);
    } else {
      await supabase.from('athlete_rooms').update({
        current_turn_slot: nextSlot,
        last_action: `🎲 ${playerToMove.nama} melangkah ${steps} petak (ke petak ${targetPos}).${skillNote} Giliran: ${nextPlayer.nama}.`
      }).eq('room_code', roomCode);
    }

    setIsProcessingMove(false);
  };

  // 13. PENYELESAIAN RONDE & PEMBAGIAN MEDALI
  const handleFinishRound = async (finisher, victoryText) => {
    // Hitung poin: Ronde 4 adalah DOUBLE POINTS!
    const multiplier = roomData.current_round === 4 ? 2 : 1;
    const pointsAwarded = 5 * multiplier;

    // Tambahkan poin ke finisher
    await supabase.from('athlete_players').update({
      score: (finisher.score || 0) + pointsAwarded
    }).eq('id', finisher.id);

    // Tandai karakter yang sudah dipakai di ronde ini agar tidak bisa dipakai lagi
    for (const p of players) {
      if (p.active_character_id) {
        const updatedUsed = [...(p.used_characters || []), p.active_character_id];
        await supabase.from('athlete_players').update({
          used_characters: updatedUsed,
          active_character_id: null,
          position: 0
        }).eq('id', p.id);
      }
    }

    if (roomData.current_round >= 4) {
      // PERMAINAN SELESAI (GAME OVER)!
      await supabase.from('athlete_rooms').update({
        status: 'GAME_OVER',
        last_action: `🏆 TURNAMEN SELESAI! ${victoryText} Selamat kepada para juara!`
      }).eq('room_code', roomCode);
    } else {
      // LANJUT KE RONDE BERIKUTNYA
      await supabase.from('athlete_rooms').update({
        status: 'ROUND_OVER',
        last_action: `🏁 ${victoryText} Memperoleh ${pointsAwarded} Medali! Siapkan atlet ronde berikutnya!`
      }).eq('room_code', roomCode);
    }
  };

  const handleNextRound = async () => {
    if (!currentUser.isAdmin) return;
    const nextRound = roomData.current_round + 1;

    await supabase.from('athlete_rooms').update({
      status: 'RACE_SELECT',
      current_round: nextRound,
      current_turn_slot: 1,
      last_action: `🔥 Ronde ${nextRound} Dimulai! Silakan kunci atlet pilihanmu!`
    }).eq('room_code', roomCode);
  };

  // 14. RESET GAME (ADMIN)
  const handleResetGame = async () => {
    if (!currentUser.isAdmin) return;
    if (!confirm('Yakin ingin mereset permainan kembali ke Lobi?')) return;

    await supabase.from('athlete_rooms').update({
      status: 'LOBBY',
      current_round: 1,
      current_turn_slot: 1,
      draft_turn_index: 0,
      draft_order: [],
      pool_characters: ATHLETE_CHARACTERS.map(c => c.id),
      last_action: 'Ruangan direset oleh Admin ke Lobi.'
    }).eq('room_code', roomCode);

    await supabase.from('athlete_players').update({
      drafted_characters: [],
      active_character_id: null,
      used_characters: [],
      position: 0,
      score: 0,
      is_ready: true,
      skill_used: false
    }).eq('room_code', roomCode);
  };

  // ==========================================
  // RENDER: LAYAR 0 - LOGIN JIKA BELUM ADA SESI
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            🧪
          </div>
          <h1 className="text-2xl font-black tracking-wider text-emerald-400 uppercase mb-2">
            Magical Athlete
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-6">
            Olimpiade Teknik Lingkungan TL16
          </p>

          {loginError && (
            <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                Masukkan NIM Anda
              </label>
              <input
                type="text"
                value={inputNim}
                onChange={(e) => setInputNim(e.target.value)}
                placeholder="Contoh: 114160001"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 font-mono text-center tracking-wider outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3 rounded-xl tracking-wider uppercase transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {loginLoading ? 'Memeriksa NIM...' : 'Masuk Arena Rahasia'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LAYAR 1 - LOBBY SELEKSI ROOM
  // ==========================================
  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl backdrop-blur-xl text-center">
          <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-full mb-3 uppercase tracking-widest">
            🔒 Sandbox Mode / Area Tersembunyi
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            MAGICAL <span className="text-emerald-400">ATHLETE</span>
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Balap Karakter Sains Lingkungan & Geologi FTM (Edisi TL16)
          </p>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 text-left flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Pemain Aktif</div>
              <div className="font-bold text-white">{currentUser.nama}</div>
              <div className="text-xs text-emerald-400 font-mono">NIM: {currentUser.nim}</div>
            </div>
            {currentUser.isAdmin && (
              <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                👑 Admin / Host
              </span>
            )}
          </div>

          {currentUser.isAdmin ? (
            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-4 rounded-2xl tracking-wider uppercase text-base transition shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
              >
                🚀 Buat Ruang Balapan Baru
              </button>
              <div className="text-xs text-slate-500 font-mono">
                Sebagai Admin, Anda bisa memilih 2–4 alumni berdasarkan NIM atau menguji coba dengan Bot.
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                type="text"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value)}
                placeholder="Masukkan Kode Room (misal: ENV123)"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 font-mono text-center uppercase tracking-widest outline-none"
              />
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl tracking-wider uppercase transition"
              >
                Gabung Room Balapan
              </button>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Kembali ke</span>
            <a href="/" className="text-emerald-400 hover:underline">Game Dashboard Utama</a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LAYAR 2 - DALAM ROOM / GAMEPLAY
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* TOP BAR / HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
              🏃
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wide text-white text-base">MAGICAL ATHLETE</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs rounded-md">
                  {roomCode}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {roomData?.status === 'LOBBY' && 'Lobi Penataan Pemain'}
                {roomData?.status === 'DRAFT' && `Bursa Draft Atlet (${roomData.draft_turn_index + 1}/16)`}
                {roomData?.status === 'RACE_SELECT' && `Pilihan Atlet Ronde ${roomData.current_round}/4`}
                {roomData?.status === 'RACING' && `Balapan Ronde ${roomData.current_round}/4`}
                {roomData?.status === 'ROUND_OVER' && `Ronde ${roomData.current_round} Selesai`}
                {roomData?.status === 'GAME_OVER' && 'Klasemen Akhir Turnamen'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser.isAdmin && (
              <button
                onClick={handleResetGame}
                className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-mono transition"
              >
                Reset
              </button>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-200">{currentUser.nama}</div>
              <div className="text-[10px] font-mono text-emerald-400">{currentUser.nim}</div>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION / ACTION LOG */}
      {toastMessage && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="p-3 bg-slate-900/90 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs sm:text-sm font-mono shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="text-base">📢</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONDISIONAL 1: TAMPILAN LOBBY (ADMIN PILIH NIM & BOT)                     */}
      {/* ========================================================================= */}
      {roomData?.status === 'LOBBY' && (
        <main className="max-w-5xl mx-auto mt-6 px-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white">Susunan Pemain Balapan</h2>
                <p className="text-xs text-slate-400 font-mono">
                  {currentUser.isAdmin
                    ? 'Pilih 2 hingga 4 alumni berdasarkan NIM untuk mengisi slot, atau gunakan Bot untuk simulasi.'
                    : 'Menunggu Admin menyelesaikan susunan pemain...'}
                </p>
              </div>
              {currentUser.isAdmin && (
                <button
                  onClick={handleStartDraft}
                  disabled={players.length < 2}
                  className={`px-6 py-3 rounded-xl font-black uppercase tracking-wider text-sm transition shadow-lg ${
                    players.length >= 2
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  🚀 Mulai Bursa Draft ({players.length}/4 Siap)
                </button>
              )}
            </div>

            {/* 4 SLOTS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((slotNum) => {
                const player = players.find(p => p.slot_number === slotNum);
                const colorConfig = PLAYER_COLORS[slotNum - 1];

                return (
                  <div
                    key={slotNum}
                    className={`rounded-2xl border p-4 transition relative overflow-hidden flex flex-col justify-between min-h-[170px] ${
                      player
                        ? `${colorConfig.bg} ${colorConfig.border} ${colorConfig.glow}`
                        : 'bg-slate-950/40 border-slate-800 border-dashed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${colorConfig.badge}`}>
                          Slot {slotNum}
                        </span>
                        {player?.is_bot && (
                          <span className="text-[10px] font-mono bg-purple-500/20 border border-purple-500/40 text-purple-300 px-1.5 py-0.5 rounded">
                            AI BOT
                          </span>
                        )}
                      </div>

                      {player ? (
                        <div className="mt-2">
                          <div className="font-bold text-base text-white truncate">{player.nama}</div>
                          <div className="text-xs font-mono text-slate-400">NIM: {player.nim}</div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-600 font-mono text-xs">
                          Slot Kosong
                        </div>
                      )}
                    </div>

                    {/* ADMIN ACTION BUTTONS FOR SLOTS */}
                    {currentUser.isAdmin && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5">
                        {player ? (
                          slotNum !== 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSlot(slotNum);
                              }}
                              className="w-full py-1.5 text-xs font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
                            >
                              ✕ Keluarkan
                            </button>
                          )
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                setTargetSlot(slotNum);
                                setShowAlumniModal(true);
                              }}
                              className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono font-bold transition truncate"
                            >
                              🔍 Pilih NIM
                            </button>
                            <button
                              onClick={() => handleAddBot(slotNum)}
                              className="py-1.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-mono font-bold transition truncate"
                            >
                              + Bot AI
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* KONDISIONAL 2: FASE 1 - BURSA SNAKE DRAFT ATLET                           */}
      {/* ========================================================================= */}
      {roomData?.status === 'DRAFT' && (
        <main className="max-w-6xl mx-auto mt-6 px-4">
          {/* DRAFT STATUS HEADER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                Fase Pemilihan Tim (Snake Draft)
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                Pilih 4 Atlet Sains Terbaik Untuk Tim Kamu
              </h2>
            </div>

            {/* INDICATOR GILIRAN SIAPA */}
            {(() => {
              const currentDraftSlot = roomData.draft_order[roomData.draft_turn_index];
              const currentDraftPlayer = players.find(p => p.slot_number === currentDraftSlot);
              const isMyTurn = currentDraftPlayer?.nim === currentUser.nim;

              return (
                <div className={`px-5 py-3 rounded-2xl border text-center font-mono ${
                  isMyTurn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">Giliran Memilih</div>
                  <div className="font-bold text-sm">
                    {isMyTurn ? '👉 GILIRAN KAMU SEKARANG! 👈' : `${currentDraftPlayer?.nama} (Slot ${currentDraftSlot})`}
                  </div>
                  {currentDraftPlayer?.is_bot && (
                    <button
                      type="button"
                      onClick={() => {
                        const available = roomData.pool_characters || [];
                        if (available.length > 0) {
                          const randomPick = available[Math.floor(Math.random() * available.length)];
                          handleDraftPick(randomPick);
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer"
                    >
                      ⚡ Klik: Paksa Bot Memilih Sekarang
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* DRAFT CARDS GRID (16 ATLET) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {ATHLETE_CHARACTERS.map((char) => {
              const isAvailable = roomData.pool_characters.includes(char.id);
              const ownerPlayer = players.find(p => (p.drafted_characters || []).includes(char.id));
              const currentDraftSlot = roomData.draft_order[roomData.draft_turn_index];
              const currentDraftPlayer = players.find(p => p.slot_number === currentDraftSlot);
              const isMyTurn = currentDraftPlayer?.nim === currentUser.nim;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    if (isAvailable && isMyTurn) {
                      setSelectedDraftChar(char);
                    }
                  }}
                  className={`rounded-2xl border p-4 transition-all relative flex flex-col justify-between min-h-[220px] ${
                    isAvailable
                      ? isMyTurn
                        ? 'bg-slate-900 border-slate-700 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer'
                        : 'bg-slate-900/60 border-slate-800 opacity-90'
                      : 'bg-slate-950/40 border-slate-900 opacity-40 grayscale'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl p-1 bg-slate-800/80 rounded-xl">{char.emoji}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {char.division}
                      </span>
                    </div>

                    <h3 className="font-black text-white text-base leading-tight">{char.name}</h3>
                    <p className="text-xs font-mono text-emerald-400 mb-2">{char.subname}</p>

                    <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-2">
                      <div className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                        <span>⚡</span> {char.skillName}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug mt-1">
                        {char.skillDesc}
                      </p>
                    </div>
                  </div>

                  {!isAvailable && ownerPlayer && (
                    <div className="mt-2 text-center py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-mono text-slate-400 uppercase">
                      Diambil {ownerPlayer.nama}
                    </div>
                  )}

                  {isAvailable && isMyTurn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDraftPick(char.id);
                      }}
                      className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider transition active:scale-95"
                    >
                      Pilih Atlet Ini 🎯
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* DAFTAR ATLET TIAP PEMAIN (BOTTOM TRAY) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-4">
              Atlet Terpilih Tiap Pemain ({players.length} Pemain)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {players.map(p => {
                const colorConfig = PLAYER_COLORS[p.slot_number - 1];
                return (
                  <div key={p.id} className={`p-4 rounded-2xl border ${colorConfig.bg} ${colorConfig.border}`}>
                    <div className="font-bold text-sm text-white flex items-center justify-between mb-2">
                      <span>{p.nama}</span>
                      <span className="text-xs font-mono opacity-60">({(p.drafted_characters || []).length}/4)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.drafted_characters || []).map(cid => {
                        const c = ATHLETE_CHARACTERS.find(x => x.id === cid);
                        return (
                          <span key={cid} className="px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono flex items-center gap-1">
                            <span>{c?.emoji}</span>
                            <span className="truncate max-w-[80px]">{c?.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* KONDISIONAL 3: FASE BLIND LOCK-IN (PILIH ATLET UNTUK RONDE INI)            */}
      {/* ========================================================================= */}
      {roomData?.status === 'RACE_SELECT' && (
        <main className="max-w-4xl mx-auto mt-6 px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center mb-6">
            <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono rounded-full mb-3 uppercase tracking-widest font-bold">
              {roomData.current_round === 4 ? '🔥 RONDE 4 - FINAL CLIMAX (POIN 2X LIPAT!)' : `RONDE ${roomData.current_round} DARI 4`}
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              Kunci Atlet Jagoanmu Untuk Balapan Ini! 🃏
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mb-6">
              Pilihan bersifat rahasia. Begitu semua pemain selesai memilih, tirai kartu akan dibuka serentak di garis Start!
            </p>

            {/* STATUS LOCK-IN PEMAIN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {players.map(p => (
                <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <div className="font-bold text-xs text-white truncate">{p.nama}</div>
                  <div className="mt-1">
                    {p.active_character_id ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ✅ Terkunci
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        ⏳ Memilih...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* PILIHAN KARTU MILIK PEMAIN INI */}
            {myPlayer && (
              <div className="text-left">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">
                  Pilih 1 dari 4 Atlet Milikmu:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(myPlayer.drafted_characters || []).map(cid => {
                    const c = ATHLETE_CHARACTERS.find(x => x.id === cid);
                    const isUsed = (myPlayer.used_characters || []).includes(cid);
                    const isSelected = secretSelectedChar === cid;

                    return (
                      <div
                        key={cid}
                        onClick={() => {
                          if (!isUsed && !myPlayer.active_character_id) {
                            setSecretSelectedChar(cid);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition relative ${
                          isUsed
                            ? 'bg-slate-950 border-slate-900 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="text-3xl mb-2">{c?.emoji}</div>
                        <div className="font-bold text-sm text-white">{c?.name}</div>
                        <div className="text-xs font-mono text-emerald-400 mb-2">{c?.subname}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2">{c?.skillDesc}</div>

                        {isUsed && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center font-mono text-xs font-bold text-rose-400">
                            SUDAH TERPAKAI
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!myPlayer.active_character_id && (
                  <button
                    onClick={handleLockInCharacter}
                    disabled={!secretSelectedChar}
                    className={`mt-6 w-full py-4 rounded-xl font-black uppercase tracking-wider text-sm transition ${
                      secretSelectedChar
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    🔒 Kunci Pilihan Atlet Untuk Ronde {roomData.current_round}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* KONDISIONAL 4: FASE BALAPAN DI LINTASAN 24 KOTAK                           */}
      {/* ========================================================================= */}
      {(roomData?.status === 'RACING' || roomData?.status === 'ROUND_OVER' || roomData?.status === 'GAME_OVER') && (
        <main className="max-w-6xl mx-auto mt-6 px-4">
          {/* TRACK STATUS BOARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🏟️</span> Sirkuit Stadion 24 Petak (Loop Arena)
                </span>
                <h2 className="text-xl font-black text-white">
                  Ronde {roomData.current_round} dari 4
                </h2>
              </div>

              {/* ROUND OVER / NEXT ROUND BUTTON (ADMIN / HOST) */}
              {roomData.status === 'ROUND_OVER' && isHost && (
                <button
                  onClick={handleNextRound}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl uppercase tracking-wider text-sm shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Lanjut Ronde {roomData.current_round + 1} ⏩
                </button>
              )}
            </div>

            {/* ========================================================================= */}
            {/* LINTASAN BALAP 24 KOTAK STADION OVAL (BERPUTAR SEPERTI BALAPAN LARI)       */}
            {/* ========================================================================= */}
            <div className="p-3 sm:p-5 bg-slate-950/90 rounded-3xl border border-slate-800 overflow-x-auto shadow-2xl">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
                  gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
                  gap: '0.5rem'
                }}
                className="min-w-[860px] relative"
              >
                {/* 1. GERBANG TIKUNGAN GRAND ARCH (COL 1, ROW 1) */}
                <div
                  style={{ gridColumn: 1, gridRow: 1 }}
                  className="h-20 sm:h-24 rounded-2xl border-2 border-dashed border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-slate-900 to-blue-500/20 p-2 flex flex-col items-center justify-center text-center shadow-inner"
                >
                  <span className="text-xl sm:text-2xl animate-pulse">🏟️</span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-black text-amber-300 uppercase mt-0.5 leading-tight">
                    START / FINISH
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">Grand Gate</span>
                </div>

                {/* 2. PETAK LINTASAN 0 S/D 24 (MELINGKAR OVAL SEARAH JARUM JAM) */}
                {TRACK_TILES.map(tile => renderTile(tile))}

                {/* 3. LAPANGAN TENGAH STADION (INFIELD: COL 2..8, ROW 2..5) */}
                <div
                  style={{
                    gridColumn: '2 / 9',
                    gridRow: '2 / 6'
                  }}
                  className="rounded-3xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 via-slate-950/95 to-slate-900/90 p-5 flex flex-col justify-between items-center text-center backdrop-blur-md relative overflow-hidden my-0.5 shadow-inner"
                >
                  {/* HEADER LAPANGAN TENGAH */}
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest">
                      🏟️ SIRKUIT ATLETIK TL16 (1 PUTARAN PENUH)
                    </span>
                  </div>

                  {/* ACTION PUSAT / DADU & STATUS GILIRAN */}
                  <div className="flex flex-col items-center gap-3 my-auto py-2">
                    {roomData.status === 'RACING' && (() => {
                      const isMyTurn = mySlot === roomData.current_turn_slot;
                      const activePlayer = players.find(p => p.slot_number === roomData.current_turn_slot);

                      return (
                        <div className="flex flex-col items-center gap-3">
                          <div className="text-xs sm:text-sm font-mono text-slate-300 flex items-center gap-2">
                            <span className="text-emerald-400">📍</span>
                            <span>Pelari Giliran Ini:</span>
                            <strong className="text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 shadow-sm">
                              {activePlayer?.nama} (P{activePlayer?.slot_number})
                            </strong>
                          </div>

                          {isMyTurn ? (
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              {myPlayer?.active_character_id === 'clarifier_unit' && (
                                <button
                                  type="button"
                                  onClick={() => executePlayerMove(myPlayer, 3)}
                                  disabled={diceRolling || isProcessingMove}
                                  className="px-5 py-3.5 bg-teal-500/20 border border-teal-400 text-teal-300 hover:bg-teal-500/30 rounded-2xl font-mono text-xs font-bold transition active:scale-95 cursor-pointer shadow-lg"
                                >
                                  ⚖️ Maju Pasti 3 Langkah
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => executePlayerMove(myPlayer, null)}
                                disabled={diceRolling || isProcessingMove}
                                className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl uppercase tracking-wider text-base shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-95 transition flex items-center gap-3 cursor-pointer"
                              >
                                <span className="text-2xl animate-bounce">🎲</span>
                                <span>{diceRolling ? 'Mengocok Dadu...' : 'LEMPAR DADU SEKARANG'}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <div className="px-5 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-mono text-slate-400 flex items-center gap-2 shadow-inner">
                                <span className="animate-pulse">⏳</span>
                                <span>Menunggu <strong className="text-white">{activePlayer?.nama}</strong> melangkah di lintasan...</span>
                              </div>
                              {activePlayer?.is_bot && isHost && (
                                <button
                                  type="button"
                                  onClick={() => executePlayerMove(activePlayer, null)}
                                  disabled={diceRolling || isProcessingMove}
                                  className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer shadow-md"
                                >
                                  ⚡ Paksa Bot Jalan
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* LIVE PROGRESS STATUS UNTUK KEEMPAT PELARI */}
                  <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80">
                    {players.map(p => {
                      const colorConfig = PLAYER_COLORS[p.slot_number - 1];
                      const pct = Math.min(100, Math.round((p.position / 24) * 100));
                      return (
                        <div key={p.id} className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-left">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="font-bold text-white truncate max-w-[70px]">{p.nama}</span>
                            <span className={colorConfig.text}>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${colorConfig.badge.split(' ')[0]}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* STANDINGS & RUNNER CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {players.map(p => {
              const char = ATHLETE_CHARACTERS.find(c => c.id === p.active_character_id);
              const colorConfig = PLAYER_COLORS[p.slot_number - 1];
              const isCurrentTurn = roomData.status === 'RACING' && roomData.current_turn_slot === p.slot_number;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition ${
                    isCurrentTurn
                      ? `${colorConfig.border} bg-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/50`
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${colorConfig.badge}`}>
                      P{p.slot_number}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      🏅 {p.score || 0} Poin
                    </span>
                  </div>

                  <div className="font-bold text-base text-white">{p.nama}</div>
                  <div className="text-xs font-mono text-slate-400 mb-3">Posisi: Petak {p.position} / 24</div>

                  {char && (
                    <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{char.emoji}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{char.name}</div>
                          <div className="text-[10px] font-mono text-emerald-400">{char.skillName}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {char.skillDesc}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* GAME OVER MODAL / PODIUM */}
          {roomData.status === 'GAME_OVER' && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-amber-500/40 p-8 rounded-3xl max-w-lg w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                <div className="text-5xl mb-3">🏆</div>
                <h2 className="text-3xl font-black text-amber-400 mb-1">JUARA OLIMPIADE TL16</h2>
                <p className="text-xs font-mono text-slate-400 mb-6">
                  Turnamen 4 Ronde Magical Athlete Telah Selesai!
                </p>

                <div className="space-y-3 mb-6">
                  {[...players]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((p, idx) => (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between ${
                          idx === 0
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : idx === 1
                            ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}
                          </span>
                          <div className="text-left">
                            <div className="text-sm font-bold text-white">{p.nama}</div>
                            <div className="text-[11px] font-mono text-slate-400">NIM: {p.nim}</div>
                          </div>
                        </div>
                        <div className="text-base font-black font-mono">
                          {p.score || 0} Poin
                        </div>
                      </div>
                    ))}
                </div>

                {currentUser.isAdmin && (
                  <button
                    onClick={handleResetGame}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    Mulai Pertandingan Baru 🔄
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* MODAL SEARCH ALUMNI BY NIM (UNTUK ADMIN DI LOBBY)                         */}
      {/* ========================================================================= */}
      {showAlumniModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Pilih Alumni Untuk Slot {targetSlot}</h3>
                <p className="text-xs text-slate-400 font-mono">Cari berdasarkan Nama atau NIM</p>
              </div>
              <button
                onClick={() => {
                  setShowAlumniModal(false);
                  setTargetSlot(null);
                }}
                className="text-slate-500 hover:text-white text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={searchAlumni}
              onChange={(e) => setSearchAlumni(e.target.value)}
              placeholder="Ketik Nama atau NIM..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm font-mono text-white mb-4 outline-none transition"
            />

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {alumniList
                .filter(a =>
                  a.nama.toLowerCase().includes(searchAlumni.toLowerCase()) ||
                  a.nim.includes(searchAlumni)
                )
                .slice(0, 30)
                .map(alumnus => (
                  <div
                    key={alumnus.nim}
                    onClick={() => handleAssignPlayer(alumnus)}
                    className="p-3 bg-slate-950/60 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{alumnus.nama}</div>
                      <div className="text-xs font-mono text-emerald-400">{alumnus.nim}</div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Pilih ➔</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper render tile di lintasan oval berputar
  function renderTile(tile) {
    const racersOnThisTile = players.filter(p => p.position === tile.index);
    const coord = TRACK_LOOP_COORDS[tile.index] || { col: 1, row: 1, arrow: '➔' };

    return (
      <div
        key={tile.index}
        style={{
          gridColumn: coord.col,
          gridRow: coord.row
        }}
        className={`h-20 sm:h-24 rounded-2xl border p-1.5 sm:p-2 flex flex-col justify-between relative transition-all shadow-md ${
          tile.type === 'start'
            ? 'bg-blue-600/25 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50'
            : tile.type === 'finish'
            ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] ring-2 ring-amber-400'
            : tile.type === 'boost'
            ? 'bg-teal-500/15 border-teal-400/70 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
            : tile.type === 'trap'
            ? 'bg-rose-500/15 border-rose-400/70 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
            : tile.type === 'halfway'
            ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[10px] sm:text-xs font-mono font-black text-slate-300">
              {tile.label}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {coord.arrow}
            </span>
          </div>
          {tile.type === 'boost' && <span className="text-xs">⚡</span>}
          {tile.type === 'trap' && <span className="text-xs">⚠️</span>}
          {tile.type === 'finish' && <span className="text-xs animate-bounce">🏆</span>}
          {tile.type === 'start' && <span className="text-xs">🚀</span>}
          {tile.type === 'halfway' && <span className="text-xs">🏁</span>}
        </div>

        {/* PION ATLET DI ATAS PETAK */}
        <div className="flex flex-wrap items-center justify-center gap-1 my-auto">
          {racersOnThisTile.map(p => {
            const char = ATHLETE_CHARACTERS.find(c => c.id === p.active_character_id);
            const colorConfig = PLAYER_COLORS[p.slot_number - 1];

            return (
              <div
                key={p.id}
                title={`${p.nama} (${char?.name})`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base border-2 shadow-lg transition-transform animate-in zoom-in duration-300 hover:scale-125 z-10 ${colorConfig.badge} ${colorConfig.border} ${colorConfig.glow}`}
              >
                {char?.emoji || '🏃'}
              </div>
            );
          })}
        </div>

        <div className="text-[8px] sm:text-[9px] font-mono text-slate-400 truncate text-center">
          {tile.type === 'boost' && '+2 Langkah'}
          {tile.type === 'trap' && '-2 Langkah'}
          {tile.type === 'halfway' && 'Titik Tengah'}
          {tile.type === 'finish' && 'FINISH LINE'}
          {tile.type === 'start' && 'GARIS AWAL'}
        </div>
      </div>
    );
  }
}
