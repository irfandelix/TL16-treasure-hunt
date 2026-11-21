import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isAdminSession } from '../lib/adminAuth';
import { useRoomConnection, pickActiveCoordinator, shouldBotControlPlayer } from '../lib/useRoomConnection';

import LayarMalam from './LayarMalam';
import LayarDiskusi from './LayarDiskusi';
import LayarVoting from './LayarVoting';
import LayarEksekusi from './LayarEksekusi';
import StoryShareButton from './StoryShareButton';
import InviteLinkButton from './InviteLinkButton';
import RoomStatusScreen from './RoomStatusScreen';
import SoloGamePrepScreen from './SoloGamePrepScreen';
import { getLocalAvatarConfig } from '../lib/avatarHelper';
import { checkShouldSkipRoomScoring } from '../lib/earlyAccess';
import { cleanupFinishedRooms, isFinishedRoomExpired } from '../lib/roomCleanup';

const DOSEN_KILLER_ROLES = [
  {
    id: 'dosen',
    name: 'Dosen Killer',
    team: 'Kubu Penyamar',
    teamClass: 'bg-rose-100 text-rose-900 border-rose-200',
    accentClass: 'text-rose-800',
    quota: '2 orang (bertambah jika kelas ramai)',
    description:
      'Menyamar di tengah mahasiswa. Setiap malam diam-diam memilih 1 orang untuk diberi nilai E (DO), dan punya ruang obrolan rahasia khusus sesama Dosen Killer untuk mengatur siasat.'
  },
  {
    id: 'intel',
    name: 'Mahasiswa Intel',
    team: 'Kubu Mahasiswa',
    teamClass: 'bg-sky-100 text-sky-900 border-sky-200',
    accentClass: 'text-sky-900',
    quota: '1 orang',
    description:
      'Setiap siang menerima bocoran 3 nama kandidat di layar: 1 di antaranya pasti Dosen Killer asli, 2 lainnya mahasiswa biasa. Gunakan petunjuk ini untuk mengarahkan obrolan tanpa buru-buru membongkar jati diri.'
  },
  {
    id: 'ahli',
    name: 'Mahasiswa Ahli',
    team: 'Kubu Mahasiswa',
    teamClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    accentClass: 'text-emerald-900',
    quota: '1 orang',
    description:
      'Setiap malam memilih 1 teman untuk dilindungi nilainya. Jika pilihanmu cocok dengan incaran Dosen Killer malam itu, teman tersebut selamat dan tidak jadi kena DO.'
  },
  {
    id: 'uptodate',
    name: 'Mahasiswa Uptodate',
    team: 'Kubu Mahasiswa',
    teamClass: 'bg-amber-100 text-amber-900 border-amber-200',
    accentClass: 'text-amber-800',
    quota: '1 orang',
    description:
      'Punya perlindungan otomatis di malam pertama. Kalau diincar Dosen Killer pada ronde pertama, kamu lolos dari ancaman DO. Mulai malam kedua, bermain seperti mahasiswa biasa.'
  },
  {
    id: 'biasa',
    name: 'Mahasiswa Biasa',
    team: 'Kubu Mahasiswa',
    teamClass: 'bg-[#F1ECE0] text-zinc-800 border-[#DED8CA]',
    accentClass: 'text-zinc-900',
    quota: 'Sisa peserta kelas',
    description:
      'Tidak punya tugas khusus di malam hari, tetapi suara kalian paling menentukan. Amati jawaban teman saat diskusi siang, tangkap gerak-gerik yang janggal, lalu sepakati siapa yang dikeluarkan waktu sidang.'
  }
];

export default function DosenKillerGame({ onBack, initialRoomCode = '' }) {
  const [hasPassedPrep, setHasPassedPrep] = useState(() => Boolean(initialRoomCode));
  const [roomCode, setRoomCode] = useState(''); 
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomIssue, setRoomIssue] = useState(null);
  const autoJoinedRef = useRef(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [faseGame, setFaseGame] = useState('LOBBY'); 
  const [pemain, setPemain] = useState([]); 
  const [sisaWaktuUI, setSisaWaktuUI] = useState(0); 
  
  const [peranKu, setPeranKu] = useState(null);
  const [isHidup, setIsHidup] = useState(true);
  const [intelSuspects, setIntelSuspects] = useState([]); 

  const [dkChat, setDkChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isDkChatCollapsed, setIsDkChatCollapsed] = useState(false);
  const [isIntelCollapsed, setIsIntelCollapsed] = useState(false);
  const [lobbyError, setLobbyError] = useState('');
  const chatEndRef = useRef(null);

  const dbStateRef = useRef(null);
  const pemainRef = useRef([]);
  const isProcessingRef = useRef(false); 

  const currentUser = {
    nim: localStorage.getItem('user_nim'),
    nama: localStorage.getItem('user_nama'),
    isAdmin: isAdminSession()
  };

  useEffect(() => {
    pemainRef.current = pemain;
  }, [pemain]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dkChat]);

  useEffect(() => {
    if (!showAdminWarning) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAdminWarning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAdminWarning]);

  useEffect(() => {
    cleanupFinishedRooms('dosenkiller');
    if (!currentUser.nim) return;
    const savedDkRoom = localStorage.getItem(`dk_room_${currentUser.nim}`);
    if (savedDkRoom && !isInRoom && !initialRoomCode) {
      supabase
        .from('dosen_killer_state')
        .select('room_code')
        .eq('room_code', savedDkRoom)
        .single()
        .then(({ data }) => {
          if (data?.room_code) {
            setRoomCode(data.room_code);
            setIsInRoom(true);
          } else {
            localStorage.removeItem(`dk_room_${currentUser.nim}`);
          }
        });
    }
  }, []);

  const syncDkRoom = useCallback(async () => {
    if (!isInRoom || !roomCode) return;
    const { data: stateData } = await supabase
      .from('dosen_killer_state')
      .select('*')
      .eq('room_code', roomCode)
      .single();
    if (stateData) {
      setFaseGame(stateData.fase_game);
      dbStateRef.current = stateData;
    } else {
      if (currentUser.nim) localStorage.removeItem(`dk_room_${currentUser.nim}`);
      const missingCode = roomCode;
      setIsInRoom(false);
      setRoomCode('');
      setPemain([]);
      setFaseGame('LOBBY');
      setRoomIssue({ status: 'cancelled', code: missingCode });
      return;
    }

    const { data: pemainData } = await supabase
      .from('mahasiswa_roles')
      .select('*')
      .eq('room_code', roomCode);
    if (pemainData) {
      setPemain(pemainData);
      const dataKu = pemainData.find((p) => p.nim === currentUser.nim);
      if (dataKu) {
        setPeranKu(dataKu.peran);
        setIsHidup(dataKu.is_hidup);
      }
    }
  }, [isInRoom, roomCode, currentUser.nim]);

  const { onlineNims, onlineMetaMap, connectionStatus } = useRoomConnection({
    channelName: roomCode ? `dk_presence:${roomCode}` : '',
    nim: currentUser.nim,
    meta: { isAdmin: currentUser.isAdmin },
    enabled: Boolean(isInRoom && roomCode && currentUser.nim),
    onSync: syncDkRoom
  });

  const onlineAdminNim = Object.keys(onlineMetaMap).find((k) => onlineMetaMap[k]?.isAdmin) || null;
  const actingCoordinatorNim = pickActiveCoordinator(pemain, onlineNims, onlineAdminNim);
  const isPhaseCoordinator = Boolean(
    actingCoordinatorNim ? actingCoordinatorNim === currentUser.nim : currentUser.isAdmin
  );

  useEffect(() => {
    if (!isInRoom || !roomCode) return;
    if (currentUser.nim) {
      localStorage.setItem(`dk_room_${currentUser.nim}`, roomCode);
    }

    if (currentUser.isAdmin) {
      setShowAdminWarning(true);
    }

    const initLobbyRoom = async () => {
      const [{ data: stateData }, { data: existingPlayer }] = await Promise.all([
        supabase.from('dosen_killer_state').select('fase_game').eq('room_code', roomCode).single(),
        supabase.from('mahasiswa_roles').select('nim').match({ room_code: roomCode, nim: currentUser.nim }).maybeSingle()
      ]);

      if (!existingPlayer) {
        const isLateJoiner = Boolean(stateData?.fase_game && stateData.fase_game !== 'LOBBY');
        await supabase.from('mahasiswa_roles').upsert([{
          room_code: roomCode,
          nim: currentUser.nim,
          nama: currentUser.nama,
          ...(isLateJoiner ? { is_hidup: false, peran: 'PENONTON' } : {})
        }]);
      }

      await syncDkRoom();
    };

    initLobbyRoom();

    const stateSub = supabase.channel(`state:${roomCode}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dosen_killer_state', filter: `room_code=eq.${roomCode}` }, (payload) => {
        setFaseGame(payload.new.fase_game);
        dbStateRef.current = payload.new;
      }).subscribe();

    const pemainSub = supabase.channel(`players:${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mahasiswa_roles', filter: `room_code=eq.${roomCode}` }, async () => {
        await syncDkRoom();
      }).subscribe();

    return () => {
      supabase.removeChannel(stateSub);
      supabase.removeChannel(pemainSub);
    };
  }, [isInRoom, roomCode, syncDkRoom]);

  useEffect(() => {
    let chatSub = null;
    if (faseGame === 'MALAM' && peranKu === 'DOSEN_KILLER' && isHidup) {
      chatSub = supabase.channel(`dk-chat-${roomCode}`)
        .on('broadcast', { event: 'dk_message' }, (payload) => {
          setDkChat(prev => [...prev, payload.payload]);
        })
        .subscribe();
    } else {
      setDkChat([]); 
    }

    return () => {
      if (chatSub) supabase.removeChannel(chatSub);
    };
  }, [faseGame, peranKu, isHidup, roomCode]);

  const kirimPesanDK = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const msg = { 
      sender: currentUser.nama, 
      text: chatInput, 
      time: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) 
    };
    
    setDkChat(prev => [...prev, msg]);
    setChatInput('');
    
    await supabase.channel(`dk-chat-${roomCode}`).send({
      type: 'broadcast',
      event: 'dk_message',
      payload: msg
    });
  };

  useEffect(() => {
    if (peranKu === 'INTEL' && isHidup && (faseGame === 'PAGI' || faseGame === 'DISKUSI') && intelSuspects.length === 0) {
      const dks = pemain.filter(p => p.peran === 'DOSEN_KILLER' && p.is_hidup);
      const wargas = pemain.filter(p => p.peran !== 'DOSEN_KILLER' && p.peran !== 'INTEL' && p.is_hidup);
      
      if (dks.length > 0 && wargas.length >= 1) {
        const pickedDk = dks[Math.floor(Math.random() * dks.length)];
        const shuffledWarga = [...wargas].sort(() => 0.5 - Math.random());
        const pickedWargas = shuffledWarga.slice(0, Math.min(2, shuffledWarga.length));
        
        const combined = [pickedDk, ...pickedWargas].sort(() => 0.5 - Math.random());
        setIntelSuspects(combined);
      }
    }
    
    if (faseGame === 'MALAM' || faseGame === 'SELESAI') {
      setIntelSuspects([]); 
    }
  }, [faseGame, peranKu, pemain, isHidup, intelSuspects.length]);

  useEffect(() => {
    if (!isPhaseCoordinator || !isInRoom || !roomCode) return;

    const engineInterval = setInterval(async () => {
      const state = dbStateRef.current;
      const players = pemainRef.current;

      if (!state || state.fase_game === 'LOBBY' || state.fase_game === 'SELESAI' || isProcessingRef.current) return;

      const now = new Date().getTime();
      const endTime = new Date(state.waktu_berakhir).getTime();
      const timeLeft = endTime - now;

      const mhsHidup = players.filter(p => p.is_hidup);
      const mhsSiapSkip = players.filter(p => p.is_hidup && p.siap_skip).length;
      const bypassDiskusi = (state.fase_game === 'DISKUSI' && mhsSiapSkip > Math.floor(mhsHidup.length / 2));

      if (timeLeft <= 0 || bypassDiskusi) {
        isProcessingRef.current = true; 
        const currentFase = state.fase_game;
        let nextFase = 'LOBBY';
        let durasiNext = 0;
        let pesanBaru = '';

        const bagikanPoin = async (daftarPemenang, allRoomPlayers) => {
          const roomNims = (allRoomPlayers || players || []).map((p) => p.nim);
          const skipDb = await checkShouldSkipRoomScoring('werewolf', roomNims);
          if (skipDb) return true;

          await Promise.all(daftarPemenang.map(async (p) => {
            const { data: userData } = await supabase.from('alumni').select('skor_werewolf').eq('nim', p.nim).single();
            if (userData) {
              await supabase.from('alumni').update({ skor_werewolf: (userData.skor_werewolf || 0) + 3000 }).eq('nim', p.nim);
            }
          }));
          return false;
        };

        const checkOutcome = async (freshList) => {
          const validLive = (freshList || []).filter((p) => p.is_hidup && p.peran && p.peran !== 'PENONTON');
          const dosenLive = validLive.filter((p) => p.peran === 'DOSEN_KILLER').length;
          const wargaLive = validLive.length - dosenLive;

          if (dosenLive === 0) {
            const wargaMenang = (freshList || []).filter((p) => p.peran && p.peran !== 'DOSEN_KILLER' && p.peran !== 'PENONTON');
            const isTrial = await bagikanPoin(wargaMenang, freshList);
            return isTrial
              ? 'MAHASISWA MENANG! Semua Dosen Killer berhasil ditemukan. (Mode Uji Coba: skor tidak masuk database klasemen.)'
              : 'MAHASISWA MENANG! Semua Dosen Killer berhasil ditemukan. Tim Mahasiswa mendapatkan 3000 Poin!';
          }
          if (dosenLive >= wargaLive) {
            const dosenMenang = (freshList || []).filter((p) => p.peran === 'DOSEN_KILLER');
            const isTrial = await bagikanPoin(dosenMenang, freshList);
            return isTrial
              ? 'DOSEN KILLER MENANG! Kelas dikuasai Dosen Killer. (Mode Uji Coba: skor tidak masuk database klasemen.)'
              : 'DOSEN KILLER MENANG! Kelas dikuasai Dosen Killer dan mendapatkan 3000 Poin!';
          }
          return null;
        };

        if (currentFase === 'MALAM') {
          let votesDosen = {}; let votesAhli = {};
          players.forEach(p => {
            if (p.is_hidup && p.target_malam) {
              if (p.peran === 'DOSEN_KILLER') votesDosen[p.target_malam] = (votesDosen[p.target_malam] || 0) + 1;
              if (p.peran === 'AHLI') votesAhli[p.target_malam] = (votesAhli[p.target_malam] || 0) + 1;
            }
          });

          let korbanNim = null; let maxDosenVote = 0;
          for (const nim in votesDosen) {
            if (votesDosen[nim] > maxDosenVote) { maxDosenVote = votesDosen[nim]; korbanNim = nim; }
          }

          pesanBaru = "Malam yang damai. Tidak ada mahasiswa yang terkena DO semalam.";
          if (korbanNim) {
            const korbanData = players.find(p => p.nim === korbanNim);

            if (votesAhli[korbanNim]) {
              pesanBaru = "Seseorang hampir terkena DO, tetapi nilainya berhasil diselamatkan oleh Mahasiswa Ahli!";
            } else if (korbanData?.peran === 'UPTODATE' && (state.ronde || 1) === 1) {
              pesanBaru = "Dosen Killer mencoba memberi nilai E semalam, tetapi Mahasiswa Uptodate berhasil menghindar di malam pertama!";
            } else {
              await supabase.from('mahasiswa_roles').update({ is_hidup: false }).eq('room_code', roomCode).eq('nim', korbanNim);
              pesanBaru = `Kabar Kampus: ${korbanData?.nama} terkena DO semalam!`;
            }
          }
          await supabase.from('mahasiswa_roles').update({ target_malam: null }).eq('room_code', roomCode);

          const { data: freshAfterNight } = await supabase.from('mahasiswa_roles').select('*').eq('room_code', roomCode);
          const nightWinText = await checkOutcome(freshAfterNight);
          if (nightWinText) {
            nextFase = 'SELESAI'; durasiNext = 0;
            pesanBaru = `${pesanBaru} ${nightWinText}`;
          } else {
            nextFase = 'PAGI'; durasiNext = 6;
          }
        }
        else if (currentFase === 'PAGI') {
          nextFase = 'DISKUSI'; durasiNext = 60 + (players.length * 2); 
        }
        else if (currentFase === 'DISKUSI') {
          nextFase = 'VOTING'; durasiNext = 20;
        }
        else if (currentFase === 'VOTING') {
          let votesVoting = {};
          players.forEach(p => {
            if (p.is_hidup && p.target_voting) {
              votesVoting[p.target_voting] = (votesVoting[p.target_voting] || 0) + 1;
            }
          });

          let korbanNim = null; let maxVote = 0; let isTie = false;
          for (const nim in votesVoting) {
            if (votesVoting[nim] > maxVote) {
              maxVote = votesVoting[nim]; korbanNim = nim; isTie = false;
            } else if (votesVoting[nim] === maxVote) {
              isTie = true;
            }
          }

          pesanBaru = "Hasil pemungutan suara seri atau kosong. Tidak ada yang dikeluarkan siang ini.";
          if (korbanNim && !isTie) {
            const korbanData = players.find(p => p.nim === korbanNim);
            await supabase.from('mahasiswa_roles').update({ is_hidup: false }).eq('room_code', roomCode).eq('nim', korbanNim);
            pesanBaru = `Berdasarkan hasil sidang angkatan, ${korbanData?.nama} dikeluarkan. Ternyata perannya adalah ${korbanData?.peran === 'DOSEN_KILLER' ? 'seorang Dosen Killer' : 'Mahasiswa Biasa'}.`;
          }
          await supabase.from('mahasiswa_roles').update({ target_voting: null, siap_skip: false }).eq('room_code', roomCode);
          nextFase = 'EKSEKUSI'; durasiNext = 7;
        }
        else if (currentFase === 'EKSEKUSI') {
          const { data: freshPlayers } = await supabase.from('mahasiswa_roles').select('*').eq('room_code', roomCode);
          const winText = await checkOutcome(freshPlayers);
          if (winText) {
            nextFase = 'SELESAI'; durasiNext = 0;
            pesanBaru = winText;
          } else {
            nextFase = 'MALAM'; durasiNext = 30;
            pesanBaru = "";
            await supabase.from('dosen_killer_state').update({ ronde: state.ronde + 1 }).eq('room_code', roomCode);
          }
        }

        const nextEndTime = new Date(Date.now() + durasiNext * 1000).toISOString();
        await supabase.from('dosen_killer_state').update({
          fase_game: nextFase,
          waktu_berakhir: nextEndTime,
          pesan_pengumuman: pesanBaru || state.pesan_pengumuman
        }).eq('room_code', roomCode).eq('fase_game', currentFase);

        setTimeout(() => { isProcessingRef.current = false; }, 2000);
      }
    }, 1000);

    return () => clearInterval(engineInterval);
  }, [isInRoom, roomCode, isPhaseCoordinator]);

  // Auto-bot fills actions for disconnected living players after a 6s grace delay, stopping automatically if they reconnect.
  useEffect(() => {
    if (!isPhaseCoordinator || !isInRoom || !roomCode) return;
    if (faseGame !== 'MALAM' && faseGame !== 'VOTING') return;

    const alivePlayers = pemain.filter((p) => p.is_hidup);
    const offlineNeedsAction = alivePlayers.filter((p) => {
      if (!shouldBotControlPlayer(p, onlineNims)) return false;
      if (faseGame === 'MALAM') {
        return (p.peran === 'DOSEN_KILLER' || p.peran === 'AHLI') && !p.target_malam;
      }
      return !p.target_voting;
    });

    if (offlineNeedsAction.length === 0) return;

    const timer = setTimeout(async () => {
      await Promise.all(
        offlineNeedsAction.map((actor) => {
          if (faseGame === 'MALAM') {
            const validTargets =
              actor.peran === 'DOSEN_KILLER'
                ? alivePlayers.filter((t) => t.peran !== 'DOSEN_KILLER')
                : alivePlayers.filter((t) => t.nim !== actor.nim);
            const pool = validTargets.length > 0 ? validTargets : alivePlayers;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            if (!picked) return Promise.resolve();
            return supabase
              .from('mahasiswa_roles')
              .update({ target_malam: picked.nim })
              .match({ room_code: roomCode, nim: actor.nim })
              .is('target_malam', null);
          }

          const candidates = alivePlayers.filter((t) => t.nim !== actor.nim);
          const pool = candidates.length > 0 ? candidates : alivePlayers;
          const picked = pool[Math.floor(Math.random() * pool.length)];
          if (!picked) return Promise.resolve();
          return supabase
            .from('mahasiswa_roles')
            .update({ target_voting: picked.nim })
            .match({ room_code: roomCode, nim: actor.nim })
            .is('target_voting', null);
        })
      );
    }, 6000);

    return () => clearTimeout(timer);
  }, [isPhaseCoordinator, isInRoom, roomCode, faseGame, pemain, onlineNims]);

  useEffect(() => {
    if (!isInRoom || !roomCode || faseGame === 'LOBBY' || faseGame === 'SELESAI') return;
    const uiTimer = setInterval(() => {
       const state = dbStateRef.current;
       if (state && state.waktu_berakhir) {
           const now = new Date().getTime();
           const end = new Date(state.waktu_berakhir).getTime();
           const sec = Math.max(0, Math.ceil((end - now) / 1000));
           setSisaWaktuUI(sec);
       }
    }, 1000);
    return () => clearInterval(uiTimer);
  }, [isInRoom, roomCode, faseGame]);

  const handleCreateRoom = async () => {
    setLobbyError('');
    const kodeBaru = `DK-${Math.floor(100 + Math.random() * 900)}`;
    const { error } = await supabase.from('dosen_killer_state').insert([{
      room_code: kodeBaru, fase_game: 'LOBBY', pesan_pengumuman: 'Kelas baru dibuat.'
    }]);

    if (!error) { setRoomCode(kodeBaru); setIsInRoom(true); } 
    else setLobbyError("Gagal membuat kelas baru. Silakan coba lagi.");
  };

  const handleJoinRoom = async (codeOverride) => {
    setLobbyError('');
    setRoomIssue(null);
    const rawCode = typeof codeOverride === 'string' ? codeOverride : inputRoomCode;
    const kodeBersih = rawCode.trim().toUpperCase();
    if (!kodeBersih) return setLobbyError("Masukkan kode kelas terlebih dahulu!");
    const { data } = await supabase.from('dosen_killer_state').select('*').eq('room_code', kodeBersih).single();
    if (!data) {
      setRoomIssue({ status: 'not_found', code: kodeBersih });
      return;
    }
    if (data.fase_game === 'SELESAI') {
      if (isFinishedRoomExpired('dosenkiller', data)) {
        await cleanupFinishedRooms('dosenkiller');
        setRoomIssue({ status: 'not_found', code: kodeBersih });
        return;
      }
      setRoomIssue({ status: 'finished', code: kodeBersih });
      return;
    }
    setRoomCode(kodeBersih);
    setIsInRoom(true);
  };

  const handleLeaveRoom = async () => {
    const leavingCode = roomCode;
    if (currentUser.nim) {
      localStorage.removeItem(`dk_room_${currentUser.nim}`);
    }
    if (leavingCode && currentUser.nim) {
      await supabase
        .from('mahasiswa_roles')
        .delete()
        .match({ room_code: leavingCode, nim: currentUser.nim });

      if (faseGame === 'LOBBY') {
        const { data: remaining } = await supabase
          .from('mahasiswa_roles')
          .select('nim')
          .eq('room_code', leavingCode);
        if (!remaining || remaining.length === 0) {
          await supabase.from('dosen_killer_state').delete().eq('room_code', leavingCode);
        }
      }
    }
    setIsInRoom(false);
    setRoomCode('');
    setInputRoomCode('');
    setPemain([]);
    setFaseGame('LOBBY');
    setPeranKu(null);
    setIsHidup(true);
  };

  useEffect(() => {
    if (!initialRoomCode || autoJoinedRef.current || isInRoom || !currentUser.nim) return;
    autoJoinedRef.current = true;
    setInputRoomCode(initialRoomCode);
    handleJoinRoom(initialRoomCode);
  }, [initialRoomCode, isInRoom]);

  const mulaiGame = async () => {
    const totalPemain = pemain.length;
    
    const jmlDosen = totalPemain < 25 ? 2 : Math.floor((totalPemain - 25) / 10) + 3;
    const jmlIntel = 1;
    const jmlAhli = 1;
    const jmlUptodate = 1;

    let shuffled = [...pemain].sort(() => 0.5 - Math.random());
    const updates = shuffled.map((p, index) => {
      let peranDiberikan = 'BIASA';
      
      if (index < jmlDosen) peranDiberikan = 'DOSEN_KILLER';
      else if (index < jmlDosen + jmlIntel) peranDiberikan = 'INTEL';
      else if (index < jmlDosen + jmlIntel + jmlAhli) peranDiberikan = 'AHLI';
      else if (index < jmlDosen + jmlIntel + jmlAhli + jmlUptodate) peranDiberikan = 'UPTODATE';
      
      return { 
        room_code: roomCode, nim: p.nim, nama: p.nama, peran: peranDiberikan, 
        is_hidup: true, target_malam: null, target_voting: null, siap_skip: false 
      };
    });

    await supabase.from('mahasiswa_roles').upsert(updates);
    await supabase.from('dosen_killer_chat').delete().eq('room_code', roomCode);

    const durasiMalam = 30; 
    const waktuSelesaiMalam = new Date(Date.now() + durasiMalam * 1000).toISOString();
    const pengumumanAwal = `Perkuliahan dimulai! Terdapat ${jmlDosen} Dosen Killer yang menyamar di kelas ini.`;

    await supabase.from('dosen_killer_state').update({ 
      fase_game: 'MALAM', ronde: 1, waktu_berakhir: waktuSelesaiMalam, pesan_pengumuman: pengumumanAwal
    }).eq('room_code', roomCode);
  };

  if (roomIssue) {
    return (
      <RoomStatusScreen
        gameName="Dosen Killer"
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
      <div className="py-4 sm:py-6">
        <SoloGamePrepScreen
          title="Sidang Dosen Killer"
          subtitle="Permainan tebak peran ramai-ramai versi kelas kuliah. Temukan siapa Dosen Killer yang menyamar sebelum seluruh mahasiswa terkena remedial."
          artworkSrc="/games/dosen-killer.webp"
          artworkAlt="Ilustrasi ruang sidang dan kaca pembesar Dosen Killer"
          stats={[
            { value: '5 Peran', label: 'Tokoh Kelas' },
            { value: 'Malam-Siang', label: 'Fase Sidang' },
            { value: '+3.000', label: 'Poin Menang' }
          ]}
          steps={[
            'Buka kelas baru atau masukkan kode kelas teman; peran rahasia dibagikan acak begitu permainan dimulai.',
            'Pada fase malam, Dosen Killer, Intel, Ahli, dan Uptodate menjalankan aksi rahasia masing-masing.',
            'Pada fase siang, diskusikan kecurigaan bersama lalu lakukan voting untuk menyingkirkan Dosen Killer.'
          ]}
          scoringTiers={[
            { condition: 'Tim Pemenang', points: '+3.000 poin' },
            { condition: 'Kapasitas', points: 's/d 100 org' }
          ]}
          scoringNote="Setiap anggota tim pemenang menerima +3.000 poin klasemen saat jadwal resmi terbuka (sesi uji coba tidak dicatat)."
          startLabel="Masuk ke Lobi Kelas"
          onStart={() => setHasPassedPrep(true)}
          onBack={onBack}
        />
      </div>
    );
  }

  if (!isInRoom) {
    return (
      <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-6">
        <section className="bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] p-6 sm:p-8 shadow-sm">
          <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-center">
            <div className="md:col-span-7 space-y-3 text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                Sidang Dosen Killer
              </h1>
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed">
                Permainan tebak peran ramai-ramai ala Werewolf versi kelas kuliah. Di antara teman seangkatan, ada beberapa Dosen Killer yang menyamar dan diam-diam mengincar mahasiswa setiap malam.
              </p>
              <p className="text-sm text-zinc-700 leading-relaxed">
                Cocok dimainkan bareng satu angkatan (bisa sampai 100 orang dalam satu kelas). Sebelum masuk, kenali dulu tokoh dan cara mainnya di bawah.
              </p>
            </div>

            <div className="md:col-span-5 bg-[#FAF6EE] border border-[#DED8CA] rounded-2xl p-5 space-y-4">
              {lobbyError && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
                  {lobbyError}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateRoom}
                className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3.5 px-5 rounded-xl transition-colors text-sm sm:text-base"
              >
                Buka Kelas Baru
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#DED8CA]"></div>
                <span className="flex-shrink mx-3 text-zinc-600 font-mono text-xs">ATAU GABUNG KODE</span>
                <div className="flex-grow border-t border-[#DED8CA]"></div>
              </div>

              <div className="flex gap-2">
                <label htmlFor="dk-room-code-input" className="sr-only">
                  Kode Kelas Dosen Killer
                </label>
                <input
                  id="dk-room-code-input"
                  type="text"
                  placeholder="CONTOH: DK-392"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value)}
                  className="flex-1 min-w-0 min-h-[48px] bg-white border border-[#C7BDA8] rounded-xl text-center text-sm font-mono font-bold tracking-widest text-zinc-900 uppercase focus:border-amber-500 placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  className="min-h-[48px] bg-[#14532D] hover:bg-[#166534] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0"
                >
                  Masuk
                </button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="dk-roles-heading" className="bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] overflow-hidden">
          <div className="px-6 py-4 bg-[#FAF6EE] border-b border-[#DED8CA] flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="dk-roles-heading" className="text-lg font-bold text-zinc-900">
              Kenalan dengan 5 Tokoh di Kelas
            </h2>
            <span className="text-xs text-zinc-600">
              Peran dibagikan acak begitu kelas dimulai
            </span>
          </div>

          <div className="divide-y divide-[#EDE6D8]">
            {DOSEN_KILLER_ROLES.map((role) => (
              <div key={role.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5">
                <div className="sm:w-56 shrink-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm font-bold ${role.accentClass}`}>{role.name}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${role.teamClass}`}>
                      {role.team}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-600">{role.quota}</p>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed flex-1">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section aria-labelledby="dk-flow-heading" className="bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] p-6 space-y-4">
            <h2 id="dk-flow-heading" className="text-lg font-bold text-zinc-900">
              Jalannya Satu Ronde
            </h2>
            <ol className="space-y-3.5 text-sm text-zinc-700">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] text-zinc-900 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-zinc-900 block">Malam Hari (30 detik)</strong>
                  <span>Kelas hening. Dosen Killer memilih 1 mahasiswa untuk diberi nilai E, sementara Mahasiswa Ahli memilih 1 teman yang ingin diselamatkan.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] text-zinc-900 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-zinc-900 block">Pagi dan Diskusi Kelas</strong>
                  <span>Hasil kejadian semalam diumumkan. Semua pemain yang masih bertahan saling bertanya dan berdebat di obrolan kelas. Jika lebih dari separuh pemain sepakat lanjut, waktu diskusi bisa langsung dilewati.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] text-zinc-900 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-zinc-900 block">Sidang Pemungutan Suara (20 detik)</strong>
                  <span>Setiap orang memilih 1 nama yang paling dicurigai (tidak bisa memilih diri sendiri). Pemilik suara terbanyak langsung dikeluarkan dan perannya dibuka. Jika suara seri atau kosong, tidak ada yang keluar di ronde itu.</span>
                </div>
              </li>
            </ol>
          </section>

          <section aria-labelledby="dk-win-heading" className="bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] p-6 space-y-4">
            <h2 id="dk-win-heading" className="text-lg font-bold text-zinc-900">
              Cara Menang dan Aturan Main
            </h2>
            <div className="space-y-3 text-sm text-zinc-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <strong className="text-emerald-900 block mb-0.5">Tim Mahasiswa Menang</strong>
                <span>Semua Dosen Killer berhasil ketahuan dan dikeluarkan lewat sidang.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <strong className="text-rose-900 block mb-0.5">Tim Dosen Killer Menang</strong>
                <span>Jumlah Dosen Killer yang masih bertahan sudah sama atau lebih banyak daripada sisa mahasiswa di kelas.</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-700 pt-1">
                <li>Setiap anggota tim pemenang mendapat <strong>+3.000 poin</strong> di papan klasemen (kecuali saat mode uji coba).</li>
                <li>Teman yang telat bergabung ketika kelas sudah berjalan otomatis ikut menyaksikan sebagai penonton.</li>
                <li>Usahakan layar HP tetap menyala selama sidang berlangsung supaya tidak tertinggal giliran memilih.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (faseGame === 'LOBBY') {
    const totalMhs = pemain.length;
    const currentJmlDosen = totalMhs < 25 ? 2 : Math.floor((totalMhs - 25) / 10) + 3;
    
    return (
      <>
        {showAdminWarning && currentUser.isAdmin && (
          <div
            className="fixed inset-0 z-[99999] bg-stone-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="host-warning-title"
          >
            <div className="bg-white border border-amber-400/50 rounded-2xl max-w-md p-6 text-center shadow-xl">
              <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
                Panduan Pemandu Kelas
              </p>
              <h3 id="host-warning-title" className="text-xl font-bold text-stone-900 mb-2">
                Perangkat Ini Memandu Jalannya Kelas
              </h3>
              <p className="text-stone-800 text-sm mb-4 leading-relaxed">
                Perangkat Admin mengatur pergantian waktu malam, diskusi, dan pemungutan suara secara otomatis.
              </p>
              <div className="text-left text-xs text-stone-800 space-y-2 mb-6 bg-[#FAF6EE] p-4 rounded-xl border border-[#DED6C6]">
                <p>1. Pastikan koneksi internet perangkat ini stabil selama sesi berlangsung.</p>
                <p>2. Jangan menutup tab atau mematikan layar ponsel hingga permainan selesai.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAdminWarning(false)}
                className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Mengerti & Lanjutkan
              </button>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-2xl mx-auto text-center relative">
          {currentUser.isAdmin && (
            <div className="flex justify-end mb-4">
              <button 
                type="button"
                onClick={async () => await supabase.from('dosen_killer_state').update({ fase_game: 'LOBBY' }).eq('room_code', roomCode)} 
                className="min-h-[44px] px-4 py-2 bg-white text-stone-800 border border-[#DED6C6] rounded-xl hover:bg-[#F3EDE0] text-xs font-mono font-bold"
              >
                Atur Ulang Kelas
              </button>
            </div>
          )}

          <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
            Ruang Tunggu Kelas
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6">
            Malam Keakraban TL 2016
          </h1>

          <div className="flex flex-col items-center gap-3 mb-8">
            <button 
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2500);
              }}
              className="bg-white border-2 border-dashed border-amber-400/70 hover:border-amber-400 p-6 md:p-8 rounded-2xl inline-block shadow-md transition-colors group"
            >
              <span className="block text-xs md:text-sm text-stone-800 font-bold tracking-wider mb-2 uppercase">
                {copySuccess ? 'Kode Kelas Berhasil Disalin!' : 'Kode Kelas (Klik untuk Salin)'}
              </span>
              <span className="block text-4xl md:text-6xl font-bold text-amber-700 tracking-widest font-mono">
                {roomCode}
              </span>
            </button>
            <InviteLinkButton gameKey="dosenkiller" roomCode={roomCode} />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 font-mono text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#DED6C6] text-center">
              <span className="text-rose-700 font-bold text-sm block">{currentJmlDosen} Dosen</span>
              <span className="text-stone-600 text-xs">Pemberi Nilai E</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DED6C6] text-center">
              <span className="text-sky-800 font-bold text-sm block">1 Intel</span>
              <span className="text-stone-600 text-xs">Penyelidik</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DED6C6] text-center">
              <span className="text-green-800 font-bold text-sm block">1 Ahli</span>
              <span className="text-stone-600 text-xs">Penyelamat Nilai</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DED6C6] text-center">
              <span className="text-amber-700 font-bold text-sm block">1 Uptodate</span>
              <span className="text-stone-600 text-xs">Kebal Nilai E</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DED6C6] text-center col-span-2 sm:col-span-1">
              <span className="text-stone-900 font-bold text-sm block">{Math.max(0, pemain.length - (currentJmlDosen + 3))} Mahasiswa</span>
              <span className="text-stone-600 text-xs">Peserta Sidang</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl mb-8 border border-[#DED6C6]">
            <h2 className="font-bold text-stone-900 mb-4 text-base">Mahasiswa Hadir ({pemain.length}/100)</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {pemain.map(p => (
                <span key={p.nim} className="bg-[#FAF6EE] px-4 py-2 rounded-xl text-xs font-bold text-stone-800 border border-[#DED6C6]">
                  {p.nama} {p.nim === currentUser.nim && '(Kamu)'}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl mb-8 border border-[#DED6C6] text-left">
            <h2 className="font-bold text-amber-700 mb-4 text-base text-center border-b border-[#DED6C6] pb-3">
              Panduan Tokoh di Kelas
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {DOSEN_KILLER_ROLES.map((role) => (
                <div
                  key={role.id}
                  className={`bg-[#FAF6EE] p-4 rounded-xl border border-[#DED6C6] ${role.id === 'biasa' ? 'sm:col-span-2' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`font-bold ${role.accentClass}`}>{role.name}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${role.teamClass}`}>
                      {role.team}
                    </span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {(currentUser.isAdmin || isPhaseCoordinator) && (
            <button 
              type="button"
              onClick={mulaiGame}
              className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-4 px-6 rounded-xl transition-colors shadow-md text-base"
            >
              Bagikan Peran & Mulai Sesi Kelas
            </button>
          )}
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="w-full min-h-[46px] mt-3 py-3 px-6 bg-[#FAF6EE] hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold rounded-xl text-sm transition-colors"
          >
            {pemain.length <= 1 ? 'Batalkan Kelas' : 'Keluar dari Kelas'}
          </button>
        </div>
      </>
    );
  }

  const GlobalTimer = () => (
    <div className="fixed top-4 right-4 z-[5000] bg-[#FAF6EE] border border-amber-400/50 text-amber-700 font-bold px-4 py-2 rounded-xl shadow-md font-mono flex items-center gap-2">
      <span>Sisa Waktu:</span>
      <span className="w-8 text-right">{sisaWaktuUI}d</span>
    </div>
  );

  const pesanLayar = dbStateRef.current?.pesan_pengumuman || '';

  if (faseGame === 'SELESAI') {
    const isMenang = pesanLayar.includes('MAHASISWA MENANG');
    return (
      <div className="fixed inset-0 bg-[#FAF6EE] flex flex-col items-center justify-center p-6 text-center z-50">
        <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-2">
          Hasil Akhir Sidang Angkatan
        </p>
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isMenang ? 'text-green-800' : 'text-rose-700'}`}>
          {isMenang ? 'Tim Mahasiswa Menang!' : 'Tim Dosen Killer Menang!'}
        </h2>
        <p className="text-stone-800 text-sm max-w-md leading-relaxed">{pesanLayar}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <StoryShareButton
            label="Bagikan Hasil Sidang ke IG Story"
            variant="primary"
            getPayload={() => {
              const roleLabel = (role) => {
                if (role === 'DOSEN_KILLER') return 'Dosen Killer';
                if (role === 'INTEL') return 'Intel';
                if (role === 'AHLI') return 'Ahli';
                if (role === 'UPTODATE') return 'Uptodate';
                return 'Mahasiswa';
              };
              const ordered = [...pemain].sort((a, b) => Number(b.is_hidup) - Number(a.is_hidup));
              return {
                variant: 'session',
                badge: 'SIDANG DOSEN KILLER',
                name: currentUser.nama,
                subtitle: `Kelas ${roomCode || '-'}  |  ${pemain.length} Peserta`,
                nim: currentUser.nim,
                avatarConfig: getLocalAvatarConfig(currentUser.nim),
                accent: isMenang ? '#14532D' : '#B45309',
                ringColor: isMenang ? '#14532D' : '#D97706',
                scoreText: isMenang ? 'TIM MAHASISWA MENANG!' : 'DOSEN KILLER MENANG!',
                scoreLabel: `Peranmu: ${roleLabel(peranKu)} (${isHidup ? 'Selamat' : 'Terkena DO'})`,
                sessionTitle: 'PESERTA SIDANG DI KELAS INI',
                sessionPlayers: ordered.map((p, idx) => ({
                  rank: `#${idx + 1}`,
                  nama: p.nama,
                  meta: roleLabel(p.peran),
                  scoreText: p.is_hidup ? 'Selamat' : 'DO',
                  isMe: p.nim === currentUser.nim
                })),
                filename: `dosen-killer-${roomCode || 'sesi'}.png`,
                shareTitle: 'Hasil Sidang Dosen Killer TL 2016',
                shareText: `Sesi Sidang Dosen Killer kelas ${roomCode} selesai: ${isMenang ? 'Tim Mahasiswa Menang!' : 'Tim Dosen Killer Menang!'}`
              };
            }}
          />
          {(currentUser.isAdmin || isPhaseCoordinator) && (
            <button
              type="button"
              onClick={async () => await supabase.from('dosen_killer_state').update({ fase_game: 'LOBBY' }).eq('room_code', roomCode)}
              className="min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 px-8 py-3 rounded-xl transition-colors font-bold text-sm"
            >
              Kembali ke Ruang Tunggu
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsInRoom(false);
              setRoomCode('');
              setFaseGame('LOBBY');
              if (onBack) onBack();
            }}
            className="min-h-[48px] bg-white hover:bg-[#F3EDE0] border border-[#DED6C6] text-stone-800 px-8 py-3 rounded-xl transition-colors font-bold text-sm"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalTimer />
      
      {faseGame === 'MALAM' && peranKu === 'DOSEN_KILLER' && isHidup && (
        <div className="fixed bottom-4 left-4 w-72 md:w-80 bg-white border border-rose-500/60 rounded-2xl shadow-xl z-[9999] flex flex-col overflow-hidden">
          <div className="bg-[#FAF6EE] px-3 py-2 border-b border-[#DED6C6] flex justify-between items-center gap-2">
            <span className="text-rose-700 font-bold text-xs font-mono">
              Diskusi Khusus Dosen Killer
            </span>
            <button
              type="button"
              onClick={() => setIsDkChatCollapsed(prev => !prev)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white hover:bg-[#F3EDE0] text-stone-800 text-xs font-mono border border-[#DED6C6]"
            >
              {isDkChatCollapsed ? 'Buka' : 'Tutup'}
            </button>
          </div>
          {!isDkChatCollapsed && (
            <>
              <div className="h-44 p-3 overflow-y-auto flex flex-col gap-3 bg-[#FAF6EE]">
                {dkChat.length === 0 && (
                  <p className="text-center text-xs text-stone-600 font-mono my-auto">
                    Diskusikan target malam ini bersama rekan Dosen Killer...
                  </p>
                )}
                {dkChat.map((c, i) => (
                  <div key={i} className={`flex flex-col max-w-[85%] ${c.sender === currentUser.nama ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-rose-700 font-bold text-[10px] mb-0.5">{c.sender}</span>
                    <div className={`px-3 py-1.5 rounded-xl text-xs ${c.sender === currentUser.nama ? 'bg-rose-700 text-white' : 'bg-white border border-[#DED6C6] text-stone-800'}`}>
                      {c.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={kirimPesanDK} className="p-2 bg-white border-t border-[#DED6C6] flex gap-2">
                <label htmlFor="dk-secret-chat-input" className="sr-only">
                  Pesan Rahasia Dosen Killer
                </label>
                <input 
                  id="dk-secret-chat-input"
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  className="w-full min-h-[44px] bg-[#FAF6EE] text-stone-900 text-xs px-3 py-2 rounded-lg border border-[#C7BDA8] focus:border-amber-400 placeholder:text-stone-500" 
                  placeholder="Tulis rencana malam ini..." 
                />
                <button
                  type="submit"
                  className="min-h-[44px] bg-rose-700 hover:bg-rose-600 text-white px-4 rounded-lg text-xs font-bold transition-colors"
                >
                  Kirim
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {peranKu === 'INTEL' && isHidup && intelSuspects.length > 0 && (faseGame === 'DISKUSI' || faseGame === 'VOTING') && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white border-2 border-sky-400 p-4 rounded-2xl shadow-xl z-[4000]">
          <div className="flex items-center justify-between gap-2 border-b border-[#DED6C6] pb-2 mb-2">
            <h3 className="text-sky-900 font-bold text-sm">
              Catatan Penyelidikan Intel
            </h3>
            <button
              type="button"
              onClick={() => setIsIntelCollapsed(prev => !prev)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#F3EDE0] text-stone-800 text-xs font-mono border border-[#DED6C6]"
            >
              {isIntelCollapsed ? 'Lihat' : 'Sembunyikan'}
            </button>
          </div>
          {!isIntelCollapsed && (
            <>
              <p className="text-stone-800 text-xs mb-3 leading-relaxed">
                Berdasarkan pengamatan semalam, salah satu dari kandidat berikut adalah Dosen Killer:
              </p>
              <div className="flex flex-col gap-2">
                {intelSuspects.map((s, i) => (
                  <div key={i} className="bg-[#FAF6EE] border border-sky-500/40 text-stone-900 text-center py-2 rounded-lg text-xs font-bold">
                    {s.nama}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {connectionStatus !== 'online' && (
        <div role="status" className="mb-3 px-4 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-mono font-bold text-center">
          {connectionStatus === 'offline'
            ? 'Koneksi terputus. Sesi kelas akan otomatis tersinkron saat internet kembali.'
            : 'Sedang menyinkronkan ulang status kelas...'}
        </div>
      )}

      {faseGame === 'MALAM' && <LayarMalam peranKu={peranKu} isHidup={isHidup} pemain={pemain} currentUser={{...currentUser, roomCode}} />}
      {faseGame === 'DISKUSI' && <LayarDiskusi pemain={pemain} isHidup={isHidup} currentUser={{...currentUser, roomCode}} />}
      {faseGame === 'VOTING' && <LayarVoting pemain={pemain} isHidup={isHidup} currentUser={{...currentUser, roomCode}} />}
      {(faseGame === 'PAGI' || faseGame === 'EKSEKUSI') && <LayarEksekusi pesanPengumuman={pesanLayar} pemain={pemain} />}
    </>
  );
}
