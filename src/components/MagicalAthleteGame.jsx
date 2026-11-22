import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isAdminSession, verifyAdminPassword, setAdminSessionVerified } from '../lib/adminAuth';
import { useRoomConnection, pickActiveCoordinator, shouldBotControlPlayer } from '../lib/useRoomConnection';
import { ATHLETE_CHARACTERS, TRACK_TILES, PLAYER_COLORS } from '../data/athleteCharacters';
import confetti from 'canvas-confetti';
import StoryShareButton from './StoryShareButton';
import InviteLinkButton from './InviteLinkButton';
import RoomStatusScreen from './RoomStatusScreen';
import SoloGamePrepScreen from './SoloGamePrepScreen';
import { getLocalAvatarConfig } from '../lib/avatarHelper';
import { cleanupFinishedRooms, isFinishedRoomExpired } from '../lib/roomCleanup';
import { checkShouldSkipRoomScoring, awardAlumniPoints, extractEarlyAccessConfig, hasActiveEarlyAccess } from '../lib/earlyAccess';

const TRACK_LOOP_COORDS = {
  0:  { col: 1, row: 1, dir: 'Kanan' },
  1:  { col: 2, row: 1, dir: 'Kanan' },
  2:  { col: 3, row: 1, dir: 'Kanan' },
  3:  { col: 4, row: 1, dir: 'Kanan' },
  4:  { col: 5, row: 1, dir: 'Kanan' },
  5:  { col: 6, row: 1, dir: 'Kanan' },
  6:  { col: 7, row: 1, dir: 'Kanan' },
  7:  { col: 8, row: 1, dir: 'Turun' },
  8:  { col: 8, row: 2, dir: 'Turun' },
  9:  { col: 8, row: 3, dir: 'Turun' },
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
  24: { col: 1, row: 1, dir: 'Finish' },
};

const ATHLETE_MOTION_CLASS = {
  hop: 'ath-idle-hop',
  surf: 'ath-idle-surf',
  stomp: 'ath-idle-stomp',
  engine: 'ath-idle-engine',
  flare: 'ath-idle-flare',
  slime: 'ath-idle-slime',
  quake: 'ath-idle-quake'
};

const ATHLETE_SPARK_OFFSETS = [
  { sx: '-72px', sy: '-36px', size: 10 },
  { sx: '74px', sy: '-34px', size: 9 },
  { sx: '-56px', sy: '24px', size: 8 },
  { sx: '58px', sy: '22px', size: 10 },
  { sx: '-32px', sy: '-68px', size: 7 },
  { sx: '36px', sy: '-66px', size: 8 },
  { sx: '-80px', sy: '-4px', size: 6 },
  { sx: '82px', sy: '-6px', size: 7 }
];

const ATHLETE_TYPE_LABELS = {
  DISRUPTOR: 'Pengganggu Lawan',
  TANK: 'Tahan Banting',
  SPEED: 'Pelari Cepat',
  PARASITE: 'Menempel Lawan',
  TACTIC: 'Taktik Dadu',
  COMEBACK: 'Pembalik Keadaan'
};

function AthleteMascot({ char, className = 'w-12 h-12', fallback = '🏃' }) {
  if (!char?.image) {
    return <span className="leading-none">{char?.emoji || fallback}</span>;
  }
  return (
    <img
      src={char.image}
      alt={char.name}
      width="96"
      height="96"
      loading="lazy"
      className={`${className} object-contain shrink-0 select-none`}
    />
  );
}

export default function MagicalAthleteGame({ onBack, initialRoomCode = '' }) {
  const [hasPassedPrep, setHasPassedPrep] = useState(() => Boolean(initialRoomCode));
  const [selectedRosterChar, setSelectedRosterChar] = useState(null);
  const [rosterBurstTick, setRosterBurstTick] = useState(0);
  const [isRosterBursting, setIsRosterBursting] = useState(false);
  const rosterBurstTimerRef = useRef(null);
  const [currentUser, setCurrentUser] = useState({
    nim: '',
    nama: '',
    isAdmin: false
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputNim, setInputNim] = useState('');
  const [pendingAdminUser, setPendingAdminUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomIssue, setRoomIssue] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [alumniList, setAlumniList] = useState([]);
  const [searchAlumni, setSearchAlumni] = useState('');
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null);

  const [diceRolling, setDiceRolling] = useState(false);
  const [lastDice, setLastDice] = useState(null);
  const [displayDice, setDisplayDice] = useState(1);
  const [diceRollDetails, setDiceRollDetails] = useState(null);
  const [selectedDraftChar, setSelectedDraftChar] = useState(null);
  const [secretSelectedChar, setSecretSelectedChar] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [accessCheckState, setAccessCheckState] = useState('checking');

  const roomDataRef = useRef(null);
  const playersRef = useRef([]);
  const isBotThinkingRef = useRef(false);
  const bonusRollsRef = useRef({ slot: null, count: 0 });
  const autoJoinedRef = useRef(false);

  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    if (!showAlumniModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAlumniModal(false);
        setTargetSlot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAlumniModal]);

  const triggerRosterAction = () => {
    if (rosterBurstTimerRef.current) clearTimeout(rosterBurstTimerRef.current);
    setRosterBurstTick((t) => t + 1);
    setIsRosterBursting(true);
    rosterBurstTimerRef.current = setTimeout(() => {
      setIsRosterBursting(false);
    }, 640);
  };

  useEffect(() => {
    if (!selectedRosterChar) {
      setIsRosterBursting(false);
      return;
    }
    setIsRosterBursting(false);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedRosterChar(null);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const idx = ATHLETE_CHARACTERS.findIndex((c) => c.id === selectedRosterChar.id);
        if (idx === -1) return;
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const nextIdx = (idx + delta + ATHLETE_CHARACTERS.length) % ATHLETE_CHARACTERS.length;
        setSelectedRosterChar(ATHLETE_CHARACTERS[nextIdx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rosterBurstTimerRef.current) clearTimeout(rosterBurstTimerRef.current);
    };
  }, [selectedRosterChar]);

  useEffect(() => {
    if (roomData?.round_winners && typeof roomData.round_winners === 'object' && !Array.isArray(roomData.round_winners)) {
      const synced = roomData.round_winners;
      if (synced.last_dice) {
        setDisplayDice(synced.last_dice);
        setLastDice(synced.last_dice);
        setDiceRollDetails({
          rollerName: synced.roller_name,
          charName: synced.char_name,
          roll: synced.last_dice,
          bonus: synced.bonus || 0,
          totalSteps: synced.total_steps || synced.last_dice,
          skillNote: synced.skill_note || ''
        });
      }
    } else if (Array.isArray(roomData?.round_winners) && roomData.round_winners.length === 0) {
      setDiceRollDetails(null);
    }
  }, [roomData?.round_winners]);

  useEffect(() => {
    const savedNim = localStorage.getItem('user_nim');
    const savedNama = localStorage.getItem('user_nama');
    const savedAdmin = isAdminSession();

    if (localStorage.getItem('is_admin') === 'true' && !savedAdmin) {
      localStorage.removeItem('user_nim');
      localStorage.removeItem('user_nama');
      setAdminSessionVerified(false);
      return;
    }

    if (savedNim && savedNama) {
      setCurrentUser({
        nim: savedNim,
        nama: savedNama,
        isAdmin: savedAdmin
      });
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser.nim) return;
    if (currentUser.isAdmin) {
      setAccessCheckState('allowed');
      return;
    }

    let active = true;
    setAccessCheckState('checking');
    supabase
      .from('app_settings')
      .select('patch_notes')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (!active) return;
        const eaConfig = extractEarlyAccessConfig(data);
        const allowed = hasActiveEarlyAccess(eaConfig, currentUser.nim);
        setAccessCheckState(allowed ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (active) setAccessCheckState('denied');
      });

    return () => {
      active = false;
    };
  }, [isLoggedIn, currentUser.nim, currentUser.isAdmin]);

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

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (pendingAdminUser) {
      if (!verifyAdminPassword(adminPassword)) {
        setLoginError('Password panitia salah! Silakan coba lagi.');
        return;
      }
      finishManualLogin(pendingAdminUser, true);
      setPendingAdminUser(null);
      setAdminPassword('');
      return;
    }

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

    if (data.is_admin) {
      setPendingAdminUser(data);
      setAdminPassword('');
      setLoginLoading(false);
      return;
    }

    finishManualLogin(data, false);
  };

  const finishManualLogin = (data, isAdminStatus) => {
    localStorage.setItem('user_nim', data.nim);
    localStorage.setItem('user_nama', data.nama);
    setAdminSessionVerified(Boolean(isAdminStatus));

    setCurrentUser({
      nim: data.nim,
      nama: data.nama,
      isAdmin: Boolean(isAdminStatus)
    });
    setIsLoggedIn(true);
    setLoginLoading(false);
  };

  const handleCreateRoom = async () => {
    const generatedCode = 'ENV' + Math.floor(100 + Math.random() * 900);
    const poolCharIds = ATHLETE_CHARACTERS.map(c => c.id);

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
      alert('Gagal membuat ruangan: ' + roomErr.message);
      return;
    }

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

  const handleJoinRoom = async (e, codeOverride) => {
    e?.preventDefault();
    setRoomIssue(null);
    const rawCode = typeof codeOverride === 'string' ? codeOverride : inputRoomCode;
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    const { data: room, error } = await supabase
      .from('athlete_rooms')
      .select('*')
      .eq('room_code', code)
      .single();

    if (error || !room) {
      setRoomIssue({ status: 'not_found', code });
      return;
    }
    if (room.status === 'GAME_OVER') {
      if (isFinishedRoomExpired('athlete', room)) {
        await cleanupFinishedRooms('athlete');
        setRoomIssue({ status: 'not_found', code });
        return;
      }
      setRoomIssue({ status: 'finished', code });
      return;
    }

    setRoomCode(code);
    setIsInRoom(true);
  };

  const handleLeaveRoom = async () => {
    const leavingCode = roomCode;
    if (leavingCode && currentUser.nim && roomData?.status === 'LOBBY') {
      await supabase
        .from('athlete_players')
        .delete()
        .match({ room_code: leavingCode, nim: currentUser.nim });

      const { data: remaining } = await supabase
        .from('athlete_players')
        .select('id')
        .eq('room_code', leavingCode);
      if (!remaining || remaining.length === 0) {
        await supabase.from('athlete_rooms').delete().eq('room_code', leavingCode);
      }
    }
    setIsInRoom(false);
    setRoomCode('');
    setInputRoomCode('');
    setRoomData(null);
    setPlayers([]);
  };

  useEffect(() => {
    cleanupFinishedRooms('athlete');
  }, []);

  useEffect(() => {
    if (!initialRoomCode || autoJoinedRef.current || !isLoggedIn || isInRoom) return;
    autoJoinedRef.current = true;
    setInputRoomCode(initialRoomCode);
    handleJoinRoom(null, initialRoomCode);
  }, [initialRoomCode, isLoggedIn, isInRoom]);

  const loadGameData = useCallback(async () => {
    if (!isInRoom || !roomCode) return;
    const { data: room } = await supabase
      .from('athlete_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();
    if (room) {
      setRoomData(room);
    } else {
      const missingCode = roomCode;
      setIsInRoom(false);
      setRoomCode('');
      setRoomData(null);
      setPlayers([]);
      setRoomIssue({ status: 'cancelled', code: missingCode });
      return;
    }

    const { data: plyrs } = await supabase
      .from('athlete_players')
      .select('*')
      .eq('room_code', roomCode)
      .order('slot_number', { ascending: true });
    if (plyrs) setPlayers(plyrs);
  }, [isInRoom, roomCode]);

  const { onlineNims, connectionStatus } = useRoomConnection({
    channelName: roomCode ? `athlete_presence:${roomCode}` : '',
    nim: currentUser.nim,
    enabled: Boolean(isInRoom && roomCode && currentUser.nim),
    onSync: loadGameData
  });

  useEffect(() => {
    if (!isInRoom || !roomCode) return;

    loadGameData();

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
  }, [isInRoom, roomCode, loadGameData]);

  const myPlayer = players.find(p => p.nim === currentUser.nim);
  const mySlot = myPlayer?.slot_number;

  const handleAssignPlayer = async (alumnus) => {
    if (!targetSlot) return;

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

    setPlayers(prev => [...prev.filter(p => p.slot_number !== targetSlot), newPlayer].sort((a, b) => a.slot_number - b.slot_number));
    setShowAlumniModal(false);
    setTargetSlot(null);

    await supabase.from('athlete_players').delete().eq('room_code', roomCode).eq('slot_number', targetSlot);

    const { error } = await supabase.from('athlete_players').insert([newPlayer]);
    if (error) {
      console.error('Gagal assign pemain:', error);
    }

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

    setPlayers(prev => [...prev.filter(p => p.slot_number !== slotNum), newBot].sort((a, b) => a.slot_number - b.slot_number));

    await supabase.from('athlete_players').delete().eq('room_code', roomCode).eq('slot_number', slotNum);

    const { error } = await supabase.from('athlete_players').insert([newBot]);
    if (error) {
      console.error('Gagal tambah bot:', error);
    }

    const { data: updated } = await supabase.from('athlete_players').select('*').eq('room_code', roomCode).order('slot_number', { ascending: true });
    if (updated) setPlayers(updated);
  };

  const handleRemoveSlot = async (slotNum) => {
    setPlayers(prev => prev.filter(p => p.slot_number !== slotNum));

    const { error } = await supabase
      .from('athlete_players')
      .delete()
      .eq('room_code', roomCode)
      .eq('slot_number', slotNum);

    if (error) {
      console.error('Gagal menghapus slot pemain:', error);
      alert('Gagal menghapus pemain: ' + error.message);
    }

    const { data: updated } = await supabase
      .from('athlete_players')
      .select('*')
      .eq('room_code', roomCode)
      .order('slot_number', { ascending: true });
    if (updated) setPlayers(updated);
  };

  const handleStartDraft = async () => {
    if (players.length < 2) {
      alert('Minimal diperlukan 2 pemain (atau Bot) untuk memulai balapan!');
      return;
    }

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
      last_action: 'Bursa Transfer Dimulai! Pemain pertama silakan pilih atlet jagoanmu!'
    }).eq('room_code', roomCode);
  };

  const preferredHostNim =
    roomData?.admin_nim || players.find(p => !p.is_bot && p.slot_number === 1)?.nim;
  const actingCoordinatorNim = pickActiveCoordinator(players, onlineNims, preferredHostNim);
  const isHost = Boolean(
    actingCoordinatorNim
      ? actingCoordinatorNim === currentUser.nim
      : roomData?.admin_nim === currentUser.nim || currentUser.isAdmin || mySlot === 1
  );

  const handleDraftPick = async (charId) => {
    const currentR = roomDataRef.current || roomData;
    const currentP = playersRef.current || players;
    if (!currentR || currentR.status !== 'DRAFT') return;

    const currentDraftSlot = currentR.draft_order?.[currentR.draft_turn_index];
    const currentDraftPlayer = currentP.find(p => p.slot_number === currentDraftSlot);

    if (!currentDraftPlayer) return;

    const canBotDrive = isHost && shouldBotControlPlayer(currentDraftPlayer, onlineNims);
    if (currentDraftPlayer.nim !== currentUser.nim && !canBotDrive) {
      alert('Bukan giliran Anda memilih!');
      return;
    }

    const updatedPool = (currentR.pool_characters || []).filter(id => id !== charId);
    const updatedDrafted = [...(currentDraftPlayer.drafted_characters || []), charId];

    setPlayers(prev => prev.map(p => p.id === currentDraftPlayer.id ? { ...p, drafted_characters: updatedDrafted } : p));
    setRoomData(prev => prev ? {
      ...prev,
      draft_turn_index: prev.draft_turn_index + 1,
      pool_characters: updatedPool
    } : prev);

    await supabase.from('athlete_players').update({
      drafted_characters: updatedDrafted
    }).eq('id', currentDraftPlayer.id);

    const nextIndex = currentR.draft_turn_index + 1;
    const isDraftFinished = nextIndex >= (currentR.draft_order || []).length;
    const chosenChar = ATHLETE_CHARACTERS.find(c => c.id === charId);

    if (isDraftFinished) {
      await supabase.from('athlete_rooms').update({
        status: 'RACE_SELECT',
        current_round: 1,
        draft_turn_index: nextIndex,
        pool_characters: updatedPool,
        last_action: `Draft selesai! ${currentDraftPlayer.nama} memilih ${chosenChar?.name}. Waktunya pilih atlet untuk Ronde 1!`
      }).eq('room_code', roomCode);
    } else {
      const nextSlot = currentR.draft_order[nextIndex];
      const nextPlayer = currentP.find(p => p.slot_number === nextSlot);

      await supabase.from('athlete_rooms').update({
        draft_turn_index: nextIndex,
        pool_characters: updatedPool,
        last_action: `${currentDraftPlayer.nama} memilih ${chosenChar?.name}! Giliran: ${nextPlayer?.nama}.`
      }).eq('room_code', roomCode);
    }

    setSelectedDraftChar(null);
  };

  useEffect(() => {
    if (!isHost || !roomData) return;

    if (roomData.status === 'DRAFT') {
      const currentDraftSlot = roomData.draft_order?.[roomData.draft_turn_index];
      const currentDraftPlayer = players.find(p => p.slot_number === currentDraftSlot);

      if (shouldBotControlPlayer(currentDraftPlayer, onlineNims) && !isBotThinkingRef.current) {
        isBotThinkingRef.current = true;
        const delayMs = currentDraftPlayer.is_bot ? 1000 : 4500;
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
        }, delayMs);

        return () => {
          clearTimeout(timer);
          isBotThinkingRef.current = false;
        };
      }
    }

    if (roomData.status === 'RACE_SELECT') {
      const botWaiting = players.find(
        p => shouldBotControlPlayer(p, onlineNims) && !p.active_character_id
      );
      if (botWaiting && !isBotThinkingRef.current) {
        isBotThinkingRef.current = true;
        const delayMs = botWaiting.is_bot ? 800 : 4500;
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
        }, delayMs);

        return () => {
          clearTimeout(timer);
          isBotThinkingRef.current = false;
        };
      }
    }

    if (roomData.status === 'RACING') {
      const activeSlot = roomData.current_turn_slot;
      const activePlayer = players.find(p => p.slot_number === activeSlot);

      if (shouldBotControlPlayer(activePlayer, onlineNims) && !isBotThinkingRef.current && !diceRolling) {
        isBotThinkingRef.current = true;
        const delayMs = activePlayer.is_bot ? 1200 : 4500;
        const timer = setTimeout(async () => {
          try {
            await executePlayerMove(activePlayer, null);
          } catch (err) {
            console.error('Error bot move:', err);
          } finally {
            isBotThinkingRef.current = false;
          }
        }, delayMs);

        return () => {
          clearTimeout(timer);
          isBotThinkingRef.current = false;
        };
      }
    }
  }, [roomData, players, isHost, diceRolling, onlineNims]);

  const handleLockInCharacter = async () => {
    if (!myPlayer || !secretSelectedChar) return;

    await supabase.from('athlete_players').update({
      active_character_id: secretSelectedChar,
      is_ready: true
    }).eq('id', myPlayer.id);

    setSecretSelectedChar(null);
  };

  useEffect(() => {
    if (!isHost || !roomData || roomData.status !== 'RACE_SELECT') return;

    const allReady = players.length >= 2 && players.every(p => p.active_character_id);
    if (allReady) {
      const timer = setTimeout(async () => {
        await supabase.from('athlete_players').update({
          position: 0,
          is_ready: false,
          skill_used: false
        }).eq('room_code', roomCode);

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

        const firstTurnSlot = players[0]?.slot_number || 1;
        await supabase.from('athlete_rooms').update({
          status: 'RACING',
          current_turn_slot: firstTurnSlot,
          last_action: `Ronde ${roomData.current_round} Resmi Dimulai! Semua atlet berada di lintasan!`
        }).eq('room_code', roomCode);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [players, roomData, isHost]);

  const executePlayerMove = async (playerToMove, overrideSteps = null) => {
    if (isProcessingMove) return;
    setIsProcessingMove(true);
    setDiceRolling(true);

    const shuffleInterval = setInterval(() => {
      setDisplayDice(Math.floor(1 + Math.random() * 6));
    }, 60);

    let roll = overrideSteps !== null ? overrideSteps : Math.floor(1 + Math.random() * 6);

    await new Promise(r => setTimeout(r, 850));
    clearInterval(shuffleInterval);

    setDisplayDice(roll);
    setLastDice(roll);
    setDiceRolling(false);

    let charData = ATHLETE_CHARACTERS.find(c => c.id === playerToMove.active_character_id);
    let steps = roll;
    let skillNote = '';

    if (charData?.id === 'alum_coagulant' && (roll === 1 || roll === 2) && overrideSteps === null) {
      const secondRoll = Math.floor(1 + Math.random() * 6);
      steps = Math.max(roll, secondRoll);
      skillNote = ` [Flash Flocculation: lempar ulang dari ${roll} jadi ${steps}!]`;
      setDisplayDice(steps);
      setLastDice(steps);
    }

    if (charData?.id === 'activated_sludge' && roll % 2 === 0 && overrideSteps === null) {
      steps += 1;
      skillNote = ` [Organic Breakdown: genap +1 langkah!]`;
    }

    if (charData?.id === 'biogas_methane' && overrideSteps === null) {
      const minPos = Math.min(...players.map(p => p.position));
      if (playerToMove.position === minPos) {
        steps += 3;
        skillNote = ` [Methane Flare: posisi bontot +3 langkah!]`;
      }
    }

    if (charData?.id === 'magma_pressure' && playerToMove.position >= 12 && overrideSteps === null) {
      steps += 2;
      skillNote = ` [Magma Burst: paruh kedua +2 langkah!]`;
    }

    setDiceRollDetails({
      rollerName: playerToMove.nama,
      charName: charData?.name,
      roll: roll,
      bonus: steps - roll,
      totalSteps: steps,
      skillNote: skillNote
    });

    await supabase.from('athlete_rooms').update({
      round_winners: {
        last_dice: roll,
        total_steps: steps,
        bonus: steps - roll,
        roller_slot: playerToMove.slot_number,
        roller_name: playerToMove.nama,
        char_name: charData?.name,
        skill_note: skillNote,
        rolled_at: Date.now()
      },
      last_action: `${playerToMove.nama} melempar dadu: [ ${roll} ] ${steps !== roll ? `(Skill +${steps - roll} = ${steps} Petak)` : ''}`
    }).eq('room_code', roomCode);

    await new Promise(r => setTimeout(r, 450));

    let currentPos = playerToMove.position;
    const tailingPlayer = players.find(p => p.active_character_id === 'slurry_tailing' && p.id !== playerToMove.id);

    const stepTo = async (newPos) => {
      currentPos = newPos;
      setPlayers(prev => prev.map(p => p.id === playerToMove.id ? { ...p, position: newPos } : p));
      await new Promise(r => setTimeout(r, 220));
    };

    for (let s = 1; s <= steps; s++) {
      if (currentPos >= 24) break;
      await stepTo(currentPos + 1);

      if (tailingPlayer && currentPos === tailingPlayer.position) {
        skillNote += ` [Terjebak Viscous Trap dari ${tailingPlayer.nama}!]`;
        setToastMessage(`${playerToMove.nama} terhenti di petak Slurry Tailing milik ${tailingPlayer.nama}!`);
        await new Promise(r => setTimeout(r, 350));
        break;
      }
    }

    const targetTile = TRACK_TILES.find(t => t.index === currentPos);
    if (targetTile && currentPos < 24) {
      if (targetTile.type === 'boost') {
        skillNote += ` [Meluncur di petak Boost +2!]`;
        setToastMessage(`${playerToMove.nama} menginjak petak Boost! Meluncur +2 langkah maju!`);
        await new Promise(r => setTimeout(r, 350));
        for (let b = 0; b < 2; b++) {
          if (currentPos >= 24) break;
          await stepTo(currentPos + 1);
        }
      } else if (targetTile.type === 'trap') {
        if (charData?.id === 'phytoremediation') {
          skillNote += ` [Phyto-Immunity: Kebal jebakan!]`;
          setToastMessage(`${playerToMove.nama} kebal terhadap jebakan!`);
          await new Promise(r => setTimeout(r, 300));
        } else {
          skillNote += ` [Terperosok jebakan -2!]`;
          setToastMessage(`${playerToMove.nama} terperosok jebakan! Melangkah mundur 2 petak!`);
          await new Promise(r => setTimeout(r, 400));
          for (let t = 0; t < 2; t++) {
            if (currentPos <= 0) break;
            await stepTo(currentPos - 1);
          }
        }
      }
    }

    const livePlayersBeforeEnd = playersRef.current.length > 0 ? playersRef.current : players;
    const acidPlayer = livePlayersBeforeEnd.find(p => p.active_character_id === 'acid_mine' && p.id !== playerToMove.id);
    if (acidPlayer && acidPlayer.position === currentPos && currentPos < 24) {
      skillNote += ` [Terpental Corrosive Leach mundur 3 petak!]`;
      setToastMessage(`${playerToMove.nama} mendarat di petak Acid Mine! Terpental mundur 3 petak!`);
      await new Promise(r => setTimeout(r, 400));
      for (let a = 0; a < 3; a++) {
        if (currentPos <= 0) break;
        await stepTo(currentPos - 1);
      }
    }

    await supabase.from('athlete_players').update({
      position: currentPos
    }).eq('id', playerToMove.id);

    const gwPlayer = livePlayersBeforeEnd.find(p => p.active_character_id === 'groundwater' && p.id !== playerToMove.id);
    if (gwPlayer && playerToMove.position < gwPlayer.position && currentPos > gwPlayer.position) {
      let gwPos = gwPlayer.position;
      setToastMessage(`${gwPlayer.nama} terseret Subsurface Surge maju +2 petak!`);
      await new Promise(r => setTimeout(r, 350));
      for (let g = 0; g < 2; g++) {
        if (gwPos >= 24) break;
        gwPos += 1;
        setPlayers(prev => prev.map(p => p.id === gwPlayer.id ? { ...p, position: gwPos } : p));
        await new Promise(r => setTimeout(r, 220));
      }
      await supabase.from('athlete_players').update({ position: gwPos }).eq('id', gwPlayer.id);
      skillNote += ` [${gwPlayer.nama} terseret Subsurface Surge +2!]`;
    }

    if (currentPos >= 24) {
      bonusRollsRef.current = { slot: null, count: 0 };
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      await handleFinishRound(playerToMove, `${playerToMove.nama} (${charData?.name}) Menembus Garis FINISH!`);
      setIsProcessingMove(false);
      return;
    }

    const latestPlayers = playersRef.current.length > 0 ? playersRef.current : players;
    const latestRoom = roomDataRef.current || roomData;
    const currentSlotIdx = latestPlayers.findIndex(p => p.slot_number === latestRoom.current_turn_slot);
    const safeIdx = currentSlotIdx >= 0 ? currentSlotIdx : 0;
    const nextSlotIdx = (safeIdx + 1) % latestPlayers.length;
    const nextSlot = latestPlayers[nextSlotIdx].slot_number;
    const nextPlayer = latestPlayers[nextSlotIdx];

    const sameSlotBonusCount =
      bonusRollsRef.current.slot === playerToMove.slot_number ? bonusRollsRef.current.count : 0;

    if (charData?.id === 'compost_nutrient' && roll === 6 && sameSlotBonusCount < 2) {
      bonusRollsRef.current = { slot: playerToMove.slot_number, count: sameSlotBonusCount + 1 };
      await supabase.from('athlete_rooms').update({
        last_action: `${playerToMove.nama} dapat angka 6! Bio-Enrichment memberi giliran tambahan (${sameSlotBonusCount + 1}/2)!`
      }).eq('room_code', roomCode);
    } else {
      bonusRollsRef.current = { slot: null, count: 0 };
      await supabase.from('athlete_rooms').update({
        current_turn_slot: nextSlot,
        last_action: `${playerToMove.nama} melangkah ${steps} petak (ke petak ${currentPos}).${skillNote} Giliran: ${nextPlayer.nama}.`
      }).eq('room_code', roomCode);
    }

    setIsProcessingMove(false);
  };

  const handleFinishRound = async (finisher, victoryText) => {
    const latestRoom = roomDataRef.current || roomData;
    const latestPlayers = playersRef.current.length > 0 ? playersRef.current : players;
    const multiplier = latestRoom.current_round === 4 ? 2 : 1;
    const pointsAwarded = 5 * multiplier;

    await Promise.all([
      supabase.from('athlete_players').update({
        score: (finisher.score || 0) + pointsAwarded
      }).eq('id', finisher.id),
      ...latestPlayers
        .filter((p) => p.active_character_id)
        .map((p) =>
          supabase.from('athlete_players').update({
            used_characters: [...(p.used_characters || []), p.active_character_id],
            active_character_id: null,
            position: 0
          }).eq('id', p.id)
        )
    ]);

    if (latestRoom.current_round >= 4) {
      const finalStandings = latestPlayers
        .map((p) => ({
          ...p,
          finalScore: p.id === finisher.id ? (p.score || 0) + pointsAwarded : (p.score || 0)
        }))
        .sort((a, b) => b.finalScore - a.finalScore);
      const humanNims = finalStandings.filter((p) => !p.is_bot && p.nim).map((p) => p.nim);
      const skipDb = await checkShouldSkipRoomScoring('athlete', humanNims);
      setIsTrialSession(skipDb);
      if (!skipDb) {
        const rankRewards = [3000, 1500, 750];
        await Promise.all(
          finalStandings.slice(0, 3).map((p, idx) =>
            !p.is_bot && p.nim ? awardAlumniPoints(p.nim, 'skor_athlete', rankRewards[idx]) : Promise.resolve()
          )
        );
      }

      await supabase.from('athlete_rooms').update({
        status: 'GAME_OVER',
        updated_at: new Date().toISOString(),
        last_action: `TURNAMEN SELESAI! ${victoryText} Selamat kepada para juara!`
      }).eq('room_code', roomCode);
    } else {
      await supabase.from('athlete_rooms').update({
        status: 'ROUND_OVER',
        last_action: `${victoryText} Memperoleh ${pointsAwarded} Medali! Siapkan atlet ronde berikutnya!`
      }).eq('room_code', roomCode);
    }
  };

  const handleNextRound = async () => {
    if (!isHost) return;
    const nextRound = roomData.current_round + 1;
    const firstTurnSlot = players[0]?.slot_number || 1;

    await supabase.from('athlete_rooms').update({
      status: 'RACE_SELECT',
      current_round: nextRound,
      current_turn_slot: firstTurnSlot,
      last_action: `Ronde ${nextRound} Dimulai! Silakan kunci atlet pilihanmu!`
    }).eq('room_code', roomCode);
  };

  const handleResetGame = async () => {
    if (!isHost) return;
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] text-stone-900 flex items-center justify-center p-4">
        <div className="bg-white border border-[#DED6C6] p-8 rounded-2xl max-w-md w-full shadow-md text-center">
          <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
            Olimpiade Sains Teknik Lingkungan
          </p>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            Magical Athlete TL 2016
          </h1>
          <p className="text-xs text-stone-600 mb-6">
            Masukkan NIM untuk bergabung ke lintasan balap spesial 1 Dekade.
          </p>

          {loginError && (
            <div role="alert" className="p-3 mb-4 bg-rose-50 border border-rose-500/40 rounded-xl text-rose-700 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            {pendingAdminUser ? (
              <>
                <div className="bg-[#FAF6EE] border border-[#DED6C6] rounded-xl p-3 text-left text-xs">
                  <p className="font-bold text-stone-900">Verifikasi Panitia: {pendingAdminUser.nama}</p>
                  <p className="font-mono text-stone-600 mt-0.5">NIM {pendingAdminUser.nim}</p>
                </div>
                <div className="text-left">
                  <label htmlFor="athlete-admin-pass" className="text-xs font-mono uppercase tracking-wider text-stone-800 block mb-1.5 font-bold">
                    Password Panitia
                  </label>
                  <input
                    id="athlete-admin-pass"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan password panitia"
                    className="w-full min-h-[48px] bg-[#FAF6EE] border border-[#C7BDA8] focus:border-amber-400 rounded-xl px-4 py-3 text-stone-900 text-center transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAdminUser(null);
                      setAdminPassword('');
                      setLoginError('');
                    }}
                    className="w-1/3 min-h-[48px] bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold py-3.5 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3.5 rounded-xl transition-colors shadow-md"
                  >
                    Verifikasi &amp; Masuk
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-left">
                  <label htmlFor="athlete-login-nim" className="text-xs font-mono uppercase tracking-wider text-stone-800 block mb-1.5 font-bold">
                    Nomor Induk Mahasiswa (NIM)
                  </label>
                  <input
                    id="athlete-login-nim"
                    type="text"
                    value={inputNim}
                    onChange={(e) => setInputNim(e.target.value)}
                    placeholder="Contoh: 114160001"
                    className="w-full min-h-[48px] bg-[#FAF6EE] border border-[#C7BDA8] focus:border-amber-400 rounded-xl px-4 py-3 text-stone-900 font-mono text-center tracking-wider transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3.5 rounded-xl transition-colors shadow-md"
                >
                  {loginLoading ? 'Memeriksa NIM...' : 'Masuk ke Arena Balap'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (accessCheckState === 'checking') {
    return (
      <div className="min-h-[60vh] bg-[#FAF6EE] flex items-center justify-center p-6 text-zinc-700 text-sm font-semibold">
        Memeriksa akses halaman...
      </div>
    );
  }

  if (accessCheckState === 'denied') {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4">
        <RoomStatusScreen
          gameName="Agenda Kejutan TL 2016"
          status="access_denied"
          onBackHome={() => {
            if (currentUser.nim) localStorage.removeItem(`active_view_${currentUser.nim}`);
            if (onBack) {
              onBack();
            } else {
              window.location.href = '/';
            }
          }}
        />
      </div>
    );
  }

  if (roomIssue) {
    return (
      <RoomStatusScreen
        gameName="Magical Athlete TL16"
        status={roomIssue.status}
        roomCode={roomIssue.code}
        onBackToLobby={() => {
          setRoomIssue(null);
          setInputRoomCode('');
          setIsInRoom(false);
        }}
        onBackHome={onBack}
      />
    );
  }

  if (!isInRoom && !hasPassedPrep && !initialRoomCode) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] text-zinc-900 py-4 sm:py-6 px-4">
        <SoloGamePrepScreen
          title="Magical Athlete TL 2016"
          subtitle="Bursa draft 4 tokoh berjurus unik dan balapan 4 ronde melintasi 24 petak penuh arus dan rintangan bersama teman atau bot."
          artworkSrc="/games/magical-athlete.webp"
          artworkAlt="Ilustrasi lintasan balap Magical Athlete TL 2016"
          stats={[
            { value: '2-4', label: 'Pemain / Bot' },
            { value: '4 Ronde', label: '24 Petak' },
            { value: '+3.000', label: 'Poin Juara 1' }
          ]}
          steps={[
            'Buat ruang balap bersama teman seangkatan atau tambahkan bot untuk mulai langsung di lintasan.',
            'Pilih 4 tokoh berjurus unik secara bergiliran dalam fase Snake Draft sebelum balapan dibuka.',
            'Turunkan satu pembalap tiap ronde, lempar dadu, dan manfaatkan jurus khusus untuk merebut medali emas dan perak.'
          ]}
          scoringTiers={[
            { condition: 'Juara #1', points: '+3.000 poin' },
            { condition: 'Juara #2', points: '+1.500 poin' },
            { condition: 'Juara #3', points: '+750 poin' }
          ]}
          scoringNote="Peringkat akhir ditentukan dari total nilai medali yang dikumpulkan sepanjang 4 ronde balapan."
          startLabel="Masuk ke Lobi Balap"
          onStart={() => setHasPassedPrep(true)}
          onBack={onBack}
        />
      </div>
    );
  }

  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] text-zinc-900 py-4 sm:py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <section className="bg-[#FFFDF9] border border-[#DED8CA] p-6 sm:p-8 rounded-2xl shadow-sm">
            <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-center">
              <div className="md:col-span-7 space-y-3 text-left">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
                  Magical Athlete TL 2016
                </h1>
                <p className="text-sm sm:text-base text-zinc-700 leading-relaxed">
                  Balapan 4 ronde seru bertema ilmu Teknik Lingkungan dan Geologi. Setiap pemain memilih tim berisi 4 tokoh berjurus unik, lalu mengadu mereka di lintasan 24 petak penuh rintangan dan dorongan arus.
                </p>
                <div className="inline-flex items-center gap-3 bg-[#FAF6EE] border border-[#DED8CA] rounded-xl px-4 py-2.5 text-left">
                  <div>
                    <div className="text-xs text-zinc-600">Masuk sebagai</div>
                    <div className="font-bold text-sm text-zinc-900">
                      {currentUser.nama} <span className="font-mono font-normal text-xs text-emerald-800">({currentUser.nim})</span>
                    </div>
                  </div>
                  {currentUser.isAdmin && (
                    <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg">
                      Panitia
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-5 bg-[#FAF6EE] border border-[#DED8CA] rounded-2xl p-5 space-y-4">
                {currentUser.isAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCreateRoom}
                      className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3.5 px-6 rounded-xl text-sm sm:text-base transition-colors"
                    >
                      Buat Ruang Balapan Baru
                    </button>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      Di dalam lobi kamu bisa mengisi 2 sampai 4 slot dengan alumni berdasarkan NIM atau menambahkan Bot untuk latihan.
                    </p>
                  </>
                ) : (
                  <form onSubmit={handleJoinRoom} className="space-y-3">
                    <label htmlFor="athlete-room-code" className="block text-xs font-bold text-zinc-800">
                      Gabung ke Ruang Balapan
                    </label>
                    <input
                      id="athlete-room-code"
                      type="text"
                      value={inputRoomCode}
                      onChange={(e) => setInputRoomCode(e.target.value)}
                      placeholder="CONTOH: ENV123"
                      className="w-full min-h-[48px] bg-white border border-[#C7BDA8] focus:border-amber-500 rounded-xl px-4 py-3 text-zinc-900 font-mono font-bold text-center uppercase tracking-widest placeholder:text-zinc-500"
                    />
                    <button
                      type="submit"
                      className="w-full min-h-[48px] bg-[#14532D] hover:bg-[#166534] text-white font-bold py-3.5 rounded-xl transition-colors text-sm sm:text-base"
                    >
                      Gabung Ruang Balapan
                    </button>
                  </form>
                )}

                <div className="pt-3 border-t border-[#DED8CA] flex items-center justify-center gap-1 text-xs text-zinc-600">
                  <span>Kembali ke</span>
                  {onBack ? (
                    <button
                      type="button"
                      onClick={onBack}
                      className="min-h-[44px] px-2 text-amber-800 font-bold hover:underline"
                    >
                      Beranda Utama
                    </button>
                  ) : (
                    <a
                      href="/"
                      onClick={() => {
                        const nim = localStorage.getItem('user_nim');
                        if (nim) localStorage.removeItem(`active_view_${nim}`);
                      }}
                      className="inline-flex items-center min-h-[44px] px-2 text-amber-800 font-bold hover:underline"
                    >
                      Beranda Utama
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section aria-labelledby="ath-flow-heading" className="bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] p-6 space-y-4">
              <h2 id="ath-flow-heading" className="text-lg font-bold text-zinc-900">
                Alur Turnamen 4 Ronde
              </h2>
              <ol className="space-y-3 text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] text-zinc-900 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Pilih 4 Karakter di Bursa Draft</strong>
                    <span>Semua pemain bergantian merebut 4 tokoh dari 16 pilihan yang tersedia. Pilih kombinasi pelari cepat, pengganggu lawan, dan pelari kebal jebakan.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] text-zinc-900 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Turunkan 1 Karakter per Ronde</strong>
                    <span>Di awal tiap ronde, pilih secara rahasia 1 karakter dari timmu untuk berlomba. Setiap karakter hanya bisa turun sekali sepanjang 4 ronde.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] text-zinc-900 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-zinc-900 block">Adu Dadu di Lintasan 24 Petak</strong>
                    <span>Lempar dadu bergantian menuju petak 24. Manfaatkan petak dorongan (+2 langkah: Arus Deras, Turbulensi Oksigen, Sesar Gravitasi) dan waspadai petak jebakan (-2 langkah: Lumpur Limbah, Gas Beracun, Retakan Tanah).</span>
                  </div>
                </li>
              </ol>
            </section>

            <section aria-labelledby="ath-win-heading" className="bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] p-6 space-y-4">
              <h2 id="ath-win-heading" className="text-lg font-bold text-zinc-900">
                Hitungan Medali dan Cara Menang
              </h2>
              <div className="space-y-3 text-sm text-zinc-700 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#DED8CA]">
                  <strong className="text-zinc-900 block mb-0.5">Ronde 1 sampai 3</strong>
                  <span>Pemain pertama yang menyentuh garis Finish (petak 24) membawa pulang <strong>5 Medali</strong>.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <strong className="text-amber-900 block mb-0.5">Ronde 4 (Babak Penentuan)</strong>
                  <span>Poin digandakan! Pemenang ronde terakhir langsung meraih <strong>10 Medali</strong>, jadi masih ada peluang membalikkan keadaan di akhir.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <strong className="text-emerald-900 block mb-0.5">Hadiah Poin Klasemen</strong>
                  <span>
                    Setelah 4 ronde selesai, pemilik total medali terbanyak menjadi juara turnamen: <strong>Juara #1 +3.000 poin</strong>, <strong>Juara #2 +1.500 poin</strong>, dan <strong>Juara #3 +750 poin</strong> di papan klasemen (kecuali saat mode uji coba).
                  </span>
                </div>
              </div>
            </section>
          </div>

          <section aria-labelledby="ath-roster-heading" className="bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF6EE] border-b border-[#DED8CA] flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="ath-roster-heading" className="text-lg font-bold text-zinc-900">
                Daftar 16 Tokoh dan Jurusnya
              </h2>
              <span className="text-xs text-zinc-600">
                Klik tokoh untuk membuka pop-up detail & animasi karakter
              </span>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:gap-px bg-[#EDE6D8]">
              {ATHLETE_CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setSelectedRosterChar(char)}
                  className="group w-full text-left bg-[#FFFDF9] hover:bg-[#FAF6EE] active:scale-[0.99] p-4 flex items-start gap-3.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14532D]"
                >
                  <div className="w-16 h-16 rounded-xl bg-[#FAF6EE] group-hover:bg-[#FFFDF9] border border-[#E5DFD2] group-hover:border-amber-400/70 p-1.5 flex items-center justify-center shrink-0 transition-colors">
                    <AthleteMascot
                      char={char}
                      className="w-13 h-13 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#14532D] transition-colors">
                        {char.name} <span className="font-normal text-xs text-zinc-600">({char.subname})</span>
                      </h3>
                      <span className="text-[11px] font-mono font-bold text-[#14532D] bg-[#F1ECE0] px-2 py-0.5 rounded">
                        {char.division}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      <strong className="text-amber-800">{char.skillName}:</strong> {char.skillDesc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedRosterChar && (() => {
            const currentIdx = ATHLETE_CHARACTERS.findIndex((c) => c.id === selectedRosterChar.id);
            const goStep = (delta) => {
              const nextIdx = (currentIdx + delta + ATHLETE_CHARACTERS.length) % ATHLETE_CHARACTERS.length;
              setSelectedRosterChar(ATHLETE_CHARACTERS[nextIdx]);
            };

            return (
              <div
                className="ath-backdrop-in fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ath-char-modal-title"
                onClick={() => setSelectedRosterChar(null)}
              >
                <div
                  className="ath-modal-pop w-full max-w-md bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative bg-[#F4EFE4] border-b border-[#E5DFD2] px-6 pt-5 pb-6 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-zinc-600 bg-[#FFFDF9] border border-[#DED8CA] px-2.5 py-1 rounded-lg">
                        #{String(currentIdx + 1).padStart(2, '0')} / {ATHLETE_CHARACTERS.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedRosterChar(null)}
                        aria-label="Tutup detail karakter"
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-[#FFFDF9] hover:bg-[#EFE9DC] border border-[#DED8CA] text-zinc-700 font-bold text-lg flex items-center justify-center cursor-pointer transition-colors"
                      >
                        &times;
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={triggerRosterAction}
                      aria-label={`Jalankan aksi ${selectedRosterChar.name}`}
                      className="relative flex flex-col items-center justify-center pt-2 pb-1 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] rounded-2xl"
                    >
                      <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center">
                        {isRosterBursting && (
                          <div key={`sparks-${rosterBurstTick}`} className="pointer-events-none absolute inset-0">
                            {ATHLETE_SPARK_OFFSETS.map((sp, sIdx) => (
                              <span
                                key={sIdx}
                                className="ath-spark absolute left-1/2 top-1/2 rounded-full"
                                style={{
                                  width: `${sp.size}px`,
                                  height: `${sp.size}px`,
                                  backgroundColor: selectedRosterChar.sparkColor || '#f59e0b',
                                  '--sx': sp.sx,
                                  '--sy': sp.sy
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <div
                          key={`${selectedRosterChar.id}-${isRosterBursting ? `act-${rosterBurstTick}` : 'idle'}`}
                          className={`ath-sprite-pivot ${
                            isRosterBursting
                              ? 'ath-action-burst'
                              : ATHLETE_MOTION_CLASS[selectedRosterChar.motion] || 'ath-idle-hop'
                          }`}
                        >
                          <AthleteMascot
                            char={selectedRosterChar}
                            className="w-36 h-36 sm:w-40 sm:h-40 drop-shadow-[0_10px_14px_rgba(24,24,27,0.14)]"
                          />
                        </div>
                      </div>
                      <div
                        aria-hidden="true"
                        className={`w-28 h-3.5 rounded-full bg-stone-900/30 blur-[3px] -mt-2 ${
                          isRosterBursting ? 'ath-shadow-burst' : 'ath-shadow-idle'
                        }`}
                      />
                      <span className="mt-2.5 text-[11px] font-medium text-zinc-500">
                        Ketuk karakter untuk uji gerak jurus
                      </span>
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="text-center space-y-2">
                      <div>
                        <h3 id="ath-char-modal-title" className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">
                          {selectedRosterChar.name}
                        </h3>
                        <p className="text-sm font-medium text-zinc-600 mt-0.5">
                          {selectedRosterChar.subname}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                        <span className="text-xs font-mono font-bold text-[#14532D] bg-[#ECFDF5] border border-[#BBF7D0] px-2.5 py-1 rounded-lg">
                          {selectedRosterChar.division}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-900 bg-[#FEF7E6] border border-[#F3D38A] px-2.5 py-1 rounded-lg">
                          {ATHLETE_TYPE_LABELS[selectedRosterChar.type] || selectedRosterChar.type}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FAF6EE] border border-[#E5DFD2] rounded-xl p-4 space-y-1.5 text-left">
                      <div className="text-xs font-mono font-bold text-amber-800">
                        Jurus: {selectedRosterChar.skillName}
                      </div>
                      <p className="text-sm text-zinc-800 leading-relaxed">
                        {selectedRosterChar.skillDesc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => goStep(-1)}
                        className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-[#F4EFE4] hover:bg-[#EAE3D3] border border-[#DED8CA] text-zinc-800 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                      >
                        &larr; Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={() => goStep(1)}
                        className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                      >
                        Berikutnya &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 pb-16">
      <header className="sticky top-0 z-40 bg-[#FAF6EE] border-b border-[#DED6C6] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide text-stone-900 text-base">Magical Athlete TL16</span>
                <span className="px-2.5 py-0.5 bg-white border border-amber-400/50 text-amber-700 font-mono text-xs font-bold rounded-md">
                  {roomCode}
                </span>
              </div>
              <div className="text-xs text-stone-600 font-mono">
                {roomData?.status === 'LOBBY' && 'Lobi Penataan Pemain'}
                {roomData?.status === 'DRAFT' && `Bursa Draft Atlet (${roomData.draft_turn_index + 1}/16)`}
                {roomData?.status === 'RACE_SELECT' && `Pilihan Atlet Ronde ${roomData.current_round}/4`}
                {roomData?.status === 'RACING' && `Balapan Ronde ${roomData.current_round}/4`}
                {roomData?.status === 'ROUND_OVER' && `Ronde ${roomData.current_round} Selesai`}
                {roomData?.status === 'GAME_OVER' && 'Klasemen Akhir Turnamen'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {roomData?.status === 'LOBBY' && (
              <>
                <InviteLinkButton gameKey="athlete" roomCode={roomCode} />
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="px-3.5 py-2 min-h-[44px] bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-colors"
                >
                  {players.length <= 1 ? 'Batalkan Ruangan' : 'Keluar Ruangan'}
                </button>
              </>
            )}
            {connectionStatus !== 'online' && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-mono font-bold">
                {connectionStatus === 'offline' ? 'Koneksi terputus' : 'Menyinkronkan...'}
              </span>
            )}
            {currentUser.isAdmin && (
              <button
                type="button"
                onClick={handleResetGame}
                className="px-3.5 py-2 min-h-[44px] bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-mono font-bold transition-colors"
              >
                Reset Ruangan
              </button>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-stone-800">{currentUser.nama}</div>
              <div className="text-xs font-mono text-green-800">{currentUser.nim}</div>
            </div>
          </div>
        </div>
      </header>

      {toastMessage && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="p-3.5 bg-white border border-amber-400/40 rounded-xl text-amber-800 text-xs sm:text-sm font-mono flex items-center justify-between">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {roomData?.status === 'LOBBY' && (
        <main className="max-w-5xl mx-auto mt-6 px-4">
          <div className="bg-white border border-[#DED6C6] rounded-2xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Susunan Pemain Balapan</h2>
                <p className="text-xs text-stone-600 font-mono mt-0.5">
                  {currentUser.isAdmin
                    ? 'Pilih 2 sampai 4 alumni berdasarkan NIM untuk mengisi slot, atau gunakan Bot untuk simulasi.'
                    : 'Menunggu Admin menyelesaikan susunan pemain...'}
                </p>
              </div>
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={handleStartDraft}
                  disabled={players.length < 2}
                  className={`px-6 py-3 min-h-[48px] rounded-xl font-bold text-sm transition-colors shadow-md ${
                    players.length >= 2
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      : 'bg-[#E7DFCE] text-stone-600 cursor-not-allowed border border-[#C7BDA8]'
                  }`}
                >
                  Mulai Bursa Draft ({players.length}/4 Siap)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((slotNum) => {
                const player = players.find(p => p.slot_number === slotNum);
                const colorConfig = PLAYER_COLORS[slotNum - 1];

                return (
                  <div
                    key={slotNum}
                    className={`rounded-2xl border p-4 transition-colors relative overflow-hidden flex flex-col justify-between min-h-[175px] ${
                      player
                        ? `bg-[#FAF6EE] ${colorConfig.border}`
                        : 'bg-[#FAF6EE] border-[#DED6C6] border-dashed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded font-bold ${colorConfig.badge}`}>
                          Slot {slotNum}
                        </span>
                        {player?.is_bot && (
                          <span className="text-xs font-mono bg-white border border-[#C7BDA8] text-amber-800 px-2 py-0.5 rounded">
                            Bot AI
                          </span>
                        )}
                      </div>

                      {player ? (
                        <div className="mt-2">
                          <div className="font-bold text-base text-stone-900 truncate">{player.nama}</div>
                          <div className="text-xs font-mono text-stone-600">NIM: {player.nim}</div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-stone-600 font-mono text-xs">
                          Slot Kosong
                        </div>
                      )}
                    </div>

                    {currentUser.isAdmin && (
                      <div className="mt-3 pt-3 border-t border-[#DED6C6] flex flex-col gap-2">
                        {player ? (
                          slotNum !== 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSlot(slotNum);
                              }}
                              className="w-full min-h-[44px] py-2 text-xs font-mono font-bold bg-rose-700 hover:bg-rose-600 text-white rounded-xl transition-colors"
                            >
                              Keluarkan
                            </button>
                          )
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetSlot(slotNum);
                                setShowAlumniModal(true);
                              }}
                              className="min-h-[44px] py-2 px-2 bg-white hover:bg-[#F3EDE0] border border-emerald-500/40 text-green-900 rounded-xl text-xs font-mono font-bold transition-colors"
                            >
                              Pilih NIM
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddBot(slotNum)}
                              className="min-h-[44px] py-2 px-2 bg-white hover:bg-[#F3EDE0] border border-amber-400/40 text-amber-800 rounded-xl text-xs font-mono font-bold transition-colors"
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

      {roomData?.status === 'DRAFT' && (
        <main className="max-w-6xl mx-auto mt-6 px-4">
          <div className="bg-white border border-[#DED6C6] rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                Fase Pemilihan Tim (Snake Draft)
              </p>
              <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                Pilih 4 Atlet Sains Terbaik Untuk Tim Kamu
              </h2>
            </div>

            {(() => {
              const currentDraftSlot = roomData.draft_order[roomData.draft_turn_index];
              const currentDraftPlayer = players.find(p => p.slot_number === currentDraftSlot);
              const isMyTurn = currentDraftPlayer?.nim === currentUser.nim;

              return (
                <div className={`px-5 py-3 rounded-xl border text-center font-mono ${
                  isMyTurn
                    ? 'bg-[#FAF6EE] border-amber-400 text-amber-800'
                    : 'bg-[#FAF6EE] border-[#DED6C6] text-stone-800'
                }`}>
                  <div className="text-xs uppercase tracking-wider text-stone-600">Giliran Memilih</div>
                  <div className="font-bold text-sm mt-0.5">
                    {isMyTurn ? 'Giliran Kamu Sekarang!' : `${currentDraftPlayer?.nama} (Slot ${currentDraftSlot})`}
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
                      className="mt-2 min-h-[44px] px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                    >
                      Jalankan Pilihan Bot
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {ATHLETE_CHARACTERS.map((char) => {
              const isAvailable = roomData.pool_characters.includes(char.id);
              const ownerPlayer = players.find(p => (p.drafted_characters || []).includes(char.id));
              const currentDraftSlot = roomData.draft_order[roomData.draft_turn_index];
              const currentDraftPlayer = players.find(p => p.slot_number === currentDraftSlot);
              const isMyTurn = currentDraftPlayer?.nim === currentUser.nim;

              return (
                <article
                  key={char.id}
                  className={`rounded-2xl border p-4 transition-colors relative flex flex-col justify-between min-h-[220px] ${
                    isAvailable
                      ? isMyTurn
                        ? 'bg-white border-[#C7BDA8] hover:border-amber-400'
                        : 'bg-white border-[#DED6C6]'
                      : 'bg-[#FAF6EE] border-[#DED6C6] opacity-50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="w-16 h-16 p-1.5 bg-[#FAF6EE] border border-[#E5DFD2] rounded-xl flex items-center justify-center shrink-0">
                        <AthleteMascot char={char} className="w-14 h-14" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6EE] text-stone-600 uppercase">
                        {char.division}
                      </span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-base leading-tight">{char.name}</h3>
                    <p className="text-xs font-mono text-green-800 mb-2">{char.subname}</p>

                    <div className="p-2.5 bg-[#FAF6EE] rounded-xl border border-[#DED6C6] mb-2">
                      <div className="text-xs font-mono font-bold text-amber-700">
                        {char.skillName}
                      </div>
                      <p className="text-xs text-stone-800 leading-snug mt-1">
                        {char.skillDesc}
                      </p>
                    </div>
                  </div>

                  {!isAvailable && ownerPlayer && (
                    <div className="mt-2 text-center py-2 bg-[#FAF6EE] border border-[#DED6C6] rounded-xl text-xs font-mono text-stone-600 uppercase">
                      Diambil {ownerPlayer.nama}
                    </div>
                  )}

                  {isAvailable && isMyTurn && (
                    <button
                      type="button"
                      onClick={() => handleDraftPick(char.id)}
                      className="mt-2 w-full min-h-[44px] py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl uppercase tracking-wider transition-colors"
                    >
                      Pilih Atlet Ini
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <div className="bg-white border border-[#DED6C6] rounded-2xl p-5">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-800 mb-4">
              Atlet Terpilih Tiap Pemain ({players.length} Pemain)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {players.map(p => {
                const colorConfig = PLAYER_COLORS[p.slot_number - 1];
                return (
                  <div key={p.id} className={`p-4 rounded-xl border bg-[#FAF6EE] ${colorConfig.border}`}>
                    <div className="font-bold text-sm text-stone-900 flex items-center justify-between mb-2">
                      <span>{p.nama}</span>
                      <span className="text-xs font-mono text-stone-600">({(p.drafted_characters || []).length}/4)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.drafted_characters || []).map(cid => {
                        const c = ATHLETE_CHARACTERS.find(x => x.id === cid);
                        return (
                          <span key={cid} className="px-2 py-1 bg-white border border-[#DED6C6] rounded-lg text-xs font-mono flex items-center gap-1.5 text-stone-800">
                            <AthleteMascot char={c} className="w-5 h-5" />
                            <span className="truncate max-w-[90px]">{c?.name}</span>
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

      {roomData?.status === 'RACE_SELECT' && (
        <main className="max-w-4xl mx-auto mt-6 px-4">
          <div className="bg-white border border-[#DED6C6] rounded-2xl p-6 text-center mb-6">
            <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
              {roomData.current_round === 4 ? 'Ronde 4 - Poin Ganda (2x Lipat)' : `Ronde ${roomData.current_round} dari 4`}
            </p>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              Kunci Atlet Jagoanmu Untuk Balapan Ini
            </h2>
            <p className="text-xs text-stone-600 max-w-lg mx-auto mb-6">
              Pilihan bersifat rahasia. Begitu semua pemain selesai memilih, seluruh atlet akan tampil serentak di garis Start.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {players.map(p => (
                <div key={p.id} className="p-3 bg-[#FAF6EE] border border-[#DED6C6] rounded-xl text-center">
                  <div className="font-bold text-xs text-stone-900 truncate">{p.nama}</div>
                  <div className="mt-1.5">
                    {p.active_character_id ? (
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-green-100 text-green-900 border border-emerald-500/40">
                        Terkunci
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-white text-stone-600">
                        Memilih...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {myPlayer && (
              <div className="text-left">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-3">
                  Pilih 1 dari 4 Atlet Milikmu:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(myPlayer.drafted_characters || []).map(cid => {
                    const c = ATHLETE_CHARACTERS.find(x => x.id === cid);
                    const isUsed = (myPlayer.used_characters || []).includes(cid);
                    const isSelected = secretSelectedChar === cid;

                    return (
                      <button
                        key={cid}
                        type="button"
                        disabled={isUsed || Boolean(myPlayer.active_character_id)}
                        onClick={() => {
                          if (!isUsed && !myPlayer.active_character_id) {
                            setSecretSelectedChar(cid);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-colors relative text-left flex flex-col justify-between ${
                          isUsed
                            ? 'bg-[#FAF6EE] border-[#DED6C6] opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#FAF6EE] border-2 border-amber-400'
                            : 'bg-[#FAF6EE] border-[#DED6C6] hover:border-amber-400/60'
                        }`}
                      >
                        <div>
                          <div className="w-16 h-16 mb-2.5 p-1.5 rounded-xl bg-white border border-[#DED6C6] flex items-center justify-center">
                            <AthleteMascot char={c} className="w-14 h-14" />
                          </div>
                          <div className="font-bold text-sm text-stone-900">{c?.name}</div>
                          <div className="text-xs font-mono text-green-800 mb-2">{c?.subname}</div>
                          <div className="text-xs text-stone-600 leading-snug">{c?.skillDesc}</div>
                        </div>

                        {isUsed && (
                          <div className="mt-3 py-1 px-2 bg-rose-50 border border-rose-500/40 rounded-lg text-center font-mono text-xs font-bold text-rose-700">
                            Sudah Terpakai
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!myPlayer.active_character_id && (
                  <button
                    type="button"
                    onClick={handleLockInCharacter}
                    disabled={!secretSelectedChar}
                    className={`mt-6 w-full min-h-[48px] py-3.5 rounded-xl font-bold text-sm transition-colors ${
                      secretSelectedChar
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                        : 'bg-[#E7DFCE] text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    Kunci Pilihan Atlet Untuk Ronde {roomData.current_round}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {(roomData?.status === 'RACING' || roomData?.status === 'ROUND_OVER' || roomData?.status === 'GAME_OVER') && (
        <main className="max-w-6xl mx-auto mt-6 px-4">
          <div className="bg-white border border-[#DED6C6] rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                  Sirkuit Stadion 24 Petak
                </p>
                <h2 className="text-xl font-bold text-stone-900">
                  Ronde {roomData.current_round} dari 4
                </h2>
              </div>

              {roomData.status === 'ROUND_OVER' && isHost && (
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="min-h-[48px] px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-colors"
                >
                  Lanjut ke Ronde {roomData.current_round + 1}
                </button>
              )}
            </div>

            {/* PANEL KONTROL DADU & GILIRAN UNTUK LAYAR HP (< MD) */}
            <div className="md:hidden mb-4 rounded-2xl border border-[#DED6C6] bg-[#FAF6EE] p-4 text-center">
              {renderInfieldControl()}
            </div>

            {/* LINTASAN RESPONSIF LAYAR HP (< MD): 4 KOLOM TANPA SCROLL HORIZONTAL */}
            <div className="md:hidden grid grid-cols-4 gap-2 bg-[#F3EDE0] p-3 rounded-2xl border border-[#DED6C6]">
              {TRACK_TILES.slice(0, 24).map(tile => renderTile(tile, true))}
            </div>

            {/* LINTASAN OVAL STADION DESKTOP (MD KE ATAS): 8 KOLOM X 6 BARIS */}
            <div className="hidden md:block p-4 bg-[#F3EDE0] rounded-2xl border border-[#DED6C6] shadow-md">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                  gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
                  gap: '0.5rem'
                }}
                className="relative"
              >
                {TRACK_TILES.slice(0, 24).map(tile => renderTile(tile, false))}

                <div
                  style={{
                    gridColumn: '2 / 8',
                    gridRow: '2 / 6'
                  }}
                  className="rounded-2xl border border-[#DED6C6] bg-[#FAF6EE] p-5 flex flex-col justify-between items-center text-center relative overflow-hidden my-0.5"
                >
                  {renderInfieldControl()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {players.map(p => {
              const char = ATHLETE_CHARACTERS.find(c => c.id === p.active_character_id);
              const colorConfig = PLAYER_COLORS[p.slot_number - 1];
              const isCurrentTurn = roomData.status === 'RACING' && roomData.current_turn_slot === p.slot_number;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    isCurrentTurn
                      ? `${colorConfig.border} bg-white ring-2 ring-amber-400`
                      : 'bg-white border-[#DED6C6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono px-2.5 py-0.5 rounded font-bold ${colorConfig.badge}`}>
                      P{p.slot_number}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {p.score || 0} Poin
                    </span>
                  </div>

                  <div className="font-bold text-base text-stone-900">{p.nama}</div>
                  <div className="text-xs font-mono text-stone-600 mb-3">Posisi: Petak {p.position} / 24</div>

                  {char && (
                    <div className="p-3 bg-[#FAF6EE] border border-[#DED6C6] rounded-xl">
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-11 h-11 rounded-lg bg-white border border-[#E5DFD2] p-1 flex items-center justify-center shrink-0">
                          <AthleteMascot char={char} className="w-9 h-9" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900">{char.name}</div>
                          <div className="text-xs font-mono text-green-800">{char.skillName}</div>
                        </div>
                      </div>
                      <div className="text-xs text-stone-600 leading-snug mt-1">
                        {char.skillDesc}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {roomData.status === 'GAME_OVER' && (
            <div
              className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gameover-modal-title"
            >
              <div className="bg-white border border-amber-400/60 p-8 rounded-2xl max-w-lg w-full text-center shadow-xl">
                <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
                  Turnamen 4 Ronde Selesai
                </p>
                <h2 id="gameover-modal-title" className="text-3xl font-bold text-stone-900 mb-6">
                  Juara Olimpiade TL 2016
                </h2>

                <div className="space-y-3 mb-6">
                  {[...players]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((p, idx) => (
                      <div
                        key={p.id}
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          idx === 0
                            ? 'bg-[#FAF6EE] border-amber-400 text-amber-800 font-bold'
                            : 'bg-[#FAF6EE] border-[#DED6C6] text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono font-bold text-amber-700">
                            #{idx + 1}
                          </span>
                          <div className="text-left">
                            <div className="text-sm font-bold text-stone-900">{p.nama}</div>
                            <div className="text-xs font-mono text-stone-600">NIM: {p.nim}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold font-mono text-green-800">
                            {p.score || 0} Medali
                          </div>
                          {!p.is_bot && idx < 3 && (
                            <div className="text-[11px] font-mono text-amber-800">
                              {isTrialSession ? 'Mode Uji Coba' : `+${[3000, 1500, 750][idx]} Poin`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                  <StoryShareButton
                    label="Bagikan Hasil Turnamen ke IG Story"
                    variant="primary"
                    className="w-full"
                    getPayload={() => {
                      const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
                      const winner = sorted[0];
                      const isMeWinner = winner?.nim === currentUser.nim;
                      const myEntry = sorted.find((p) => p.nim === currentUser.nim);
                      const myRank = myEntry ? sorted.indexOf(myEntry) + 1 : null;
                      return {
                        variant: 'session',
                        badge: 'MAGICAL ATHLETE TL16',
                        name: currentUser.nama || 'Alumni TL 2016',
                        subtitle: `Ruang ${roomCode || '-'}  |  Turnamen 4 Ronde`,
                        nim: currentUser.nim || '',
                        avatarConfig: getLocalAvatarConfig(currentUser.nim),
                        accent: isMeWinner ? '#B45309' : '#14532D',
                        ringColor: isMeWinner ? '#D97706' : '#14532D',
                        scoreText: isMeWinner ? 'JUARA OLIMPIADE TL16!' : (myRank ? `PERINGKAT #${myRank}` : 'TURNAMEN SELESAI'),
                        scoreLabel: winner ? `Juara sesi: ${winner.nama} (${winner.score || 0} Poin)` : 'Turnamen 4 Ronde Selesai',
                        sessionTitle: 'PESERTA BALAPAN SESI INI',
                        sessionPlayers: sorted.map((p, idx) => ({
                          rank: `#${idx + 1}`,
                          nama: p.nama,
                          meta: p.is_bot ? 'Bot Simulasi' : `NIM ${p.nim}`,
                          scoreText: `${p.score || 0} Poin`,
                          isMe: p.nim === currentUser.nim
                        })),
                        filename: `magical-athlete-tl16-${roomCode || 'turnamen'}.png`,
                        shareTitle: 'Hasil Turnamen Magical Athlete TL16',
                        shareText: `Turnamen 4 ronde Magical Athlete TL16 di ruang ${roomCode} selesai!`
                      };
                    }}
                  />
                  {currentUser.isAdmin && (
                    <button
                      type="button"
                      onClick={handleResetGame}
                      className="w-full min-h-[48px] py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors shadow-md"
                    >
                      Mulai Pertandingan Baru
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {showAlumniModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alumni-modal-title"
          onClick={() => {
            setShowAlumniModal(false);
            setTargetSlot(null);
          }}
        >
          <div
            className="bg-white border border-[#DED6C6] p-6 rounded-2xl max-w-md w-full shadow-xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 id="alumni-modal-title" className="font-bold text-base text-stone-900">
                  Pilih Alumni Untuk Slot {targetSlot}
                </h3>
                <p className="text-xs text-stone-600 font-mono">Cari berdasarkan Nama atau NIM</p>
              </div>
              <button
                type="button"
                aria-label="Tutup daftar alumni"
                onClick={() => {
                  setShowAlumniModal(false);
                  setTargetSlot(null);
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FAF6EE] hover:bg-[#F3EDE0] text-stone-800 border border-[#DED6C6] font-mono"
              >
                &times;
              </button>
            </div>

            <label htmlFor="search-alumni-input" className="sr-only">
              Cari Nama atau NIM Alumni
            </label>
            <input
              id="search-alumni-input"
              type="text"
              value={searchAlumni}
              onChange={(e) => setSearchAlumni(e.target.value)}
              placeholder="Ketik Nama atau NIM..."
              className="w-full min-h-[44px] bg-[#FAF6EE] border border-[#C7BDA8] focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-mono text-stone-900 mb-4"
            />

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {alumniList
                .filter(a =>
                  a.nama.toLowerCase().includes(searchAlumni.toLowerCase()) ||
                  a.nim.includes(searchAlumni)
                )
                .slice(0, 30)
                .map(alumnus => (
                  <button
                    key={alumnus.nim}
                    type="button"
                    onClick={() => handleAssignPlayer(alumnus)}
                    className="w-full min-h-[48px] p-3 bg-[#FAF6EE] hover:bg-[#F3EDE0] border border-[#DED6C6] hover:border-amber-400 rounded-xl transition-colors flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="text-sm font-bold text-stone-900">{alumnus.nama}</div>
                      <div className="text-xs font-mono text-green-800">{alumnus.nim}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700">Pilih</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderInfieldControl() {
    return (
      <>
        <div className="mb-2">
          <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
            Sirkuit Atletik TL 2016 (1 Putaran Penuh)
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 my-auto py-2 w-full max-w-lg mx-auto">
          {roomData.status === 'RACING' && (() => {
            const isMyTurn = mySlot === roomData.current_turn_slot;
            const activePlayer = players.find(p => p.slot_number === roomData.current_turn_slot);
            const activeChar = ATHLETE_CHARACTERS.find(c => c.id === activePlayer?.active_character_id);

            return (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="text-xs sm:text-sm font-mono text-stone-800 flex flex-wrap items-center justify-center gap-2">
                  <span>Giliran:</span>
                  <strong className="text-stone-900 bg-white px-3 py-1 rounded-xl border border-[#DED6C6] flex items-center gap-1.5">
                    <AthleteMascot char={activeChar} className="w-6 h-6" />
                    <span>{activePlayer?.nama}</span>
                    <span className="text-xs text-stone-600 font-normal">({activeChar?.name || `Slot ${activePlayer?.slot_number}`})</span>
                  </strong>
                </div>

                <div className="flex items-center justify-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl bg-[#F3EDE0] border border-[#DED6C6] w-full max-w-md my-0.5">
                  <div className="flex flex-col items-center gap-1">
                    <DiceCube value={displayDice || 1} isRolling={diceRolling} />
                    <span className="text-[10px] font-mono text-stone-600 font-bold uppercase tracking-wider">
                      {diceRolling ? 'Mengocok...' : 'Dadu'}
                    </span>
                  </div>

                  <div className="flex flex-col items-start justify-center flex-1">
                    <div className="text-xs font-mono uppercase tracking-wider text-stone-600">
                      {diceRolling ? 'Mengacak Angka...' : diceRollDetails?.rollerName ? `Lemparan ${diceRollDetails.rollerName}:` : 'Angka Dadu:'}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <div className={`text-2xl sm:text-3xl font-mono font-bold px-4 py-1.5 rounded-xl flex items-center gap-2 border ${
                        diceRolling
                          ? 'bg-white text-amber-800 border-amber-400/50'
                          : 'bg-amber-400 text-slate-950 border-amber-300'
                      }`}>
                        <span>{diceRolling ? '...' : (displayDice || '-')}</span>
                      </div>

                      {!diceRolling && diceRollDetails && (
                        <div className="flex flex-col text-left">
                          <span className="text-xs sm:text-sm font-bold text-stone-900 font-mono">
                            = {diceRollDetails.totalSteps} Petak
                          </span>
                          {diceRollDetails.bonus !== 0 && (
                            <span className={`text-xs font-mono font-bold ${diceRollDetails.bonus > 0 ? 'text-green-800' : 'text-rose-700'}`}>
                              {diceRollDetails.bonus > 0 ? `(+${diceRollDetails.bonus} Bonus Skill)` : `(${diceRollDetails.bonus} Penalti)`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!diceRolling && diceRollDetails?.skillNote && (
                      <div className="text-xs font-mono text-green-900 mt-1.5 line-clamp-2 text-left bg-[#FAF6EE] px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {diceRollDetails.skillNote.trim()}
                      </div>
                    )}
                  </div>
                </div>

                {isMyTurn ? (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {myPlayer?.active_character_id === 'clarifier_unit' && (
                      <button
                        type="button"
                        onClick={() => executePlayerMove(myPlayer, 3)}
                        disabled={diceRolling || isProcessingMove}
                        className="min-h-[48px] px-5 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-mono text-xs font-bold transition-colors"
                      >
                        Maju Pasti 3 Langkah
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => executePlayerMove(myPlayer, null)}
                      disabled={diceRolling || isProcessingMove}
                      className={`min-h-[48px] px-8 py-3 rounded-xl uppercase tracking-wider font-mono text-sm font-bold transition-colors shadow-md ${
                        diceRolling || isProcessingMove
                          ? 'bg-[#E7DFCE] text-stone-600 border border-[#C7BDA8] cursor-not-allowed'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {diceRolling ? 'Mengocok Dadu...' : 'Lempar Dadu Sekarang'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <div className="px-4 py-2.5 bg-[#F3EDE0] border border-[#DED6C6] rounded-xl text-xs font-mono text-stone-600">
                      Menunggu <strong className="text-stone-900">{activePlayer?.nama}</strong> melangkah di lintasan...
                    </div>
                    {activePlayer?.is_bot && isHost && (
                      <button
                        type="button"
                        onClick={() => executePlayerMove(activePlayer, null)}
                        disabled={diceRolling || isProcessingMove}
                        className="min-h-[44px] px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition-colors"
                      >
                        Jalankan Giliran Bot
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#DED6C6] mx-auto">
          {players.map(p => {
            const colorConfig = PLAYER_COLORS[p.slot_number - 1];
            const pct = Math.min(100, Math.round((p.position / 24) * 100));
            return (
              <div key={p.id} className="p-2 bg-[#F3EDE0] rounded-xl border border-[#DED6C6] text-left">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-stone-900 truncate max-w-[75px]">{p.nama}</span>
                  <span className={colorConfig.text}>{pct}%</span>
                </div>
                <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${colorConfig.badge.split(' ')[0]}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderTile(tile, isCompactMobile = false) {
    const isStartFinish = tile.index === 0 || tile.type === 'start_finish';
    const racersOnThisTile = players.filter(p => {
      if (isStartFinish) {
        return p.position === 0 || p.position >= 24;
      }
      return p.position === tile.index;
    });
    const coord = TRACK_LOOP_COORDS[tile.index] || { col: 1, row: 1, dir: 'Kanan' };

    return (
      <div
        key={tile.index}
        style={
          isCompactMobile
            ? undefined
            : {
                gridColumn: coord.col,
                gridRow: coord.row
              }
        }
        className={`h-20 sm:h-24 rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between relative transition-colors ${
          isStartFinish
            ? 'bg-[#FAF6EE] border-2 border-amber-400'
            : tile.type === 'boost'
            ? 'bg-green-50 border-emerald-400/70'
            : tile.type === 'trap'
            ? 'bg-rose-50 border-rose-400/70'
            : tile.type === 'halfway'
            ? 'bg-white border-amber-400/60'
            : 'bg-[#FAF6EE] border-[#DED6C6]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] sm:text-xs font-mono font-bold ${isStartFinish ? 'text-amber-800' : 'text-stone-800'}`}>
            {isStartFinish ? '0/24' : `#${tile.label}`}
          </span>
          {tile.type === 'boost' && <span className="text-[10px] font-mono font-bold text-green-900">+2</span>}
          {tile.type === 'trap' && <span className="text-[10px] font-mono font-bold text-rose-700">-2</span>}
          {tile.type === 'halfway' && <span className="text-[10px] font-mono font-bold text-amber-800">Tengah</span>}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1 my-auto">
          {racersOnThisTile.map(p => {
            const char = ATHLETE_CHARACTERS.find(c => c.id === p.active_character_id);
            const colorConfig = PLAYER_COLORS[p.slot_number - 1];
            const isCurrentTurn = roomData?.status === 'RACING' && roomData?.current_turn_slot === p.slot_number;
            const isStepping = isCurrentTurn && isProcessingMove && !diceRolling;
            const hasFinished = p.position >= 24;

            return (
              <div
                key={p.id}
                title={`${p.nama} (${char?.name})${hasFinished ? ' - FINISH!' : ''}`}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white p-0.5 border-2 shadow-sm transition-transform duration-200 z-10 relative ${colorConfig.border} ${
                  isStepping
                    ? 'ath-token-active ring-2 ring-amber-400 z-20'
                    : isCurrentTurn
                    ? 'ring-2 ring-amber-400 scale-110 z-20'
                    : ''
                }`}
              >
                <AthleteMascot char={char} className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            );
          })}
        </div>

        <div className="text-[9px] font-mono text-stone-600 truncate text-center">
          {isStartFinish && <span className="text-amber-800 font-bold">START/FINISH</span>}
          {tile.type === 'boost' && 'Maju +2'}
          {tile.type === 'trap' && 'Mundur -2'}
          {tile.type === 'halfway' && 'Petak 12'}
        </div>
      </div>
    );
  }
}

const DICE_PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

function DiceCube({ value = 1, isRolling = false }) {
  const pips = DICE_PIPS[value] || DICE_PIPS[1];
  const isOne = value === 1;

  return (
    <div
      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 p-2 sm:p-2.5 border-2 border-[#C7BDA8] flex items-center justify-center transition-transform duration-200 select-none shadow-md ${
        isRolling
          ? 'ring-2 ring-amber-400 rotate-6 scale-105'
          : 'ring-2 ring-amber-400/80'
      }`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 sm:gap-1.5 w-full h-full">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
          const hasPip = pips.includes(idx);
          if (!hasPip) {
            return <div key={idx} className="w-full h-full" />;
          }
          return (
            <div
              key={idx}
              className={`w-full h-full rounded-full ${
                isOne && idx === 4
                  ? 'bg-rose-600 scale-110'
                  : 'bg-[#FAF6EE]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
