import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- IMPORT COMPONENT LAYAR PERMAINAN ---
import LayarMalam from './LayarMalam';
import LayarDiskusi from './LayarDiskusi';
import LayarVoting from './LayarVoting';
import LayarEksekusi from './LayarEksekusi';

export default function DosenKillerGame() {
  // --- STATE ROOM MANAGEMENT ---
  const [roomCode, setRoomCode] = useState(''); 
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);

  // --- STATE GLOBAL GAME ---
  const [faseGame, setFaseGame] = useState('LOBBY'); 
  const [pemain, setPemain] = useState([]); 
  const [sisaWaktuUI, setSisaWaktuUI] = useState(0); 
  
  // --- STATE PEMAIN (KAMU) ---
  const [peranKu, setPeranKu] = useState(null);
  const [isHidup, setIsHidup] = useState(true);
  const [intelSuspects, setIntelSuspects] = useState([]); 

  // --- STATE CHAT KHUSUS DOSEN KILLER ---
  const [dkChat, setDkChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // --- REFS UNTUK MESIN BOT AGAR TIDAK STALE ---
  const dbStateRef = useRef(null);
  const pemainRef = useRef([]);
  const isProcessingRef = useRef(false); 

  const currentUser = {
    nim: localStorage.getItem('user_nim'),
    nama: localStorage.getItem('user_nama'),
    isAdmin: localStorage.getItem('is_admin') === 'true'
  };

  // 1. UPDATE REFS SAAT STATE BERUBAH
  useEffect(() => {
    pemainRef.current = pemain;
  }, [pemain]);

  // Auto-scroll ke bawah saat ada pesan chat baru
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dkChat]);

  // 2. RADAR REALTIME & INISIALISASI ROOM
  useEffect(() => {
    if (!isInRoom || !roomCode) return;

    if (currentUser.isAdmin) {
      setShowAdminWarning(true);
    }

    const initLobbyRoom = async () => {
      await supabase.from('mahasiswa_roles').upsert([{ 
        room_code: roomCode,
        nim: currentUser.nim, 
        nama: currentUser.nama
      }]);

      const { data: stateData } = await supabase.from('dosen_killer_state').select('*').eq('room_code', roomCode).single();
      if (stateData) {
        setFaseGame(stateData.fase_game);
        dbStateRef.current = stateData;
      }

      const { data: pemainData } = await supabase.from('mahasiswa_roles').select('*').eq('room_code', roomCode);
      if (pemainData) {
        setPemain(pemainData);
        const dataKu = pemainData.find(p => p.nim === currentUser.nim);
        if (dataKu) {
          setPeranKu(dataKu.peran);
          setIsHidup(dataKu.is_hidup);
        }
      }
    };

    initLobbyRoom();

    const stateSub = supabase.channel(`state:${roomCode}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dosen_killer_state', filter: `room_code=eq.${roomCode}` }, (payload) => {
        setFaseGame(payload.new.fase_game);
        dbStateRef.current = payload.new;
      }).subscribe();

    const pemainSub = supabase.channel(`players:${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mahasiswa_roles', filter: `room_code=eq.${roomCode}` }, async () => {
        const { data } = await supabase.from('mahasiswa_roles').select('*').eq('room_code', roomCode);
        if (data) {
          setPemain(data);
          const dataKu = data.find(p => p.nim === currentUser.nim);
          if (dataKu) {
            setPeranKu(dataKu.peran);
            setIsHidup(dataKu.is_hidup);
          }
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(stateSub);
      supabase.removeChannel(pemainSub);
    };
  }, [isInRoom, roomCode]);

  // ==============================================================
  // LIVE CHAT BROADCAST KHUSUS DOSEN KILLER SAAT MALAM
  // ==============================================================
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

  // ==============================================================
  // GENERATOR 3 NAMA SUSPEK UNTUK MAHASISWA INTEL
  // ==============================================================
  useEffect(() => {
    if (peranKu === 'INTEL' && isHidup && (faseGame === 'PAGI' || faseGame === 'DISKUSI') && intelSuspects.length === 0) {
      const dks = pemain.filter(p => p.peran === 'DOSEN_KILLER' && p.is_hidup);
      const wargas = pemain.filter(p => p.peran !== 'DOSEN_KILLER' && p.peran !== 'INTEL' && p.is_hidup);
      
      if (dks.length > 0 && wargas.length >= 2) {
        const pickedDk = dks[Math.floor(Math.random() * dks.length)];
        const shuffledWarga = wargas.sort(() => 0.5 - Math.random());
        const pickedWargas = shuffledWarga.slice(0, 2);
        
        const combined = [pickedDk, ...pickedWargas].sort(() => 0.5 - Math.random());
        setIntelSuspects(combined);
      }
    }
    
    if (faseGame === 'MALAM' || faseGame === 'SELESAI') {
      setIntelSuspects([]); 
    }
  }, [faseGame, peranKu, pemain, isHidup, intelSuspects.length]);

  // ==============================================================
  // OTAK BOT MODERATOR (HANYA BERJALAN DI HP ADMIN ROOM)
  // ==============================================================
  useEffect(() => {
    if (!currentUser.isAdmin || !isInRoom || !roomCode) return;

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

          pesanBaru = "Malam yang damai. Tidak ada yang di-DO semalam.";
          if (korbanNim) {
            const korbanData = players.find(p => p.nim === korbanNim);

            if (votesAhli[korbanNim]) {
              pesanBaru = "Seseorang hampir di-DO, tetapi nilainya berhasil diselamatkan oleh Mahasiswa Ahli!";
            } else if (korbanData?.peran === 'UPTODATE') {
              pesanBaru = "Dosen Killer mencoba memberi nilai E semalam, tapi Mahasiswa Uptodate berhasil menghindar karena dia sudah mendapat info duluan!";
            } else {
              await supabase.from('mahasiswa_roles').update({ is_hidup: false }).eq('room_code', roomCode).eq('nim', korbanNim);
              pesanBaru = `Kabar Duka! ${korbanData?.nama} telah resmi di-DO semalam!`;
            }
          }
          await supabase.from('mahasiswa_roles').update({ target_malam: null }).eq('room_code', roomCode);
          nextFase = 'PAGI'; durasiNext = 6;
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

          pesanBaru = "Voting seri atau kosong. Tidak ada yang dieksekusi siang ini.";
          if (korbanNim && !isTie) {
            const korbanData = players.find(p => p.nim === korbanNim);
            await supabase.from('mahasiswa_roles').update({ is_hidup: false }).eq('room_code', roomCode).eq('nim', korbanNim);
            pesanBaru = `Berdasarkan hasil sidang, ${korbanData?.nama} dieksekusi. Ternyata dia adalah ${korbanData?.peran === 'DOSEN_KILLER' ? 'seorang Dosen Killer' : 'mahasiswa biasa'}.`;
          }
          await supabase.from('mahasiswa_roles').update({ target_voting: null, siap_skip: false }).eq('room_code', roomCode);
          nextFase = 'EKSEKUSI'; durasiNext = 7;
        }
        else if (currentFase === 'EKSEKUSI') {
          const { data: freshPlayers } = await supabase.from('mahasiswa_roles').select('*').eq('room_code', roomCode);
          const mhsLive = freshPlayers.filter(p => p.is_hidup);
          const dosenLive = mhsLive.filter(p => p.peran === 'DOSEN_KILLER').length;
          const wargLive = mhsLive.length - dosenLive;

          const bagikanPoin = async (daftarPemenang) => {
            await Promise.all(daftarPemenang.map(async (p) => {
              const { data: userData } = await supabase.from('alumni').select('skor_werewolf').eq('nim', p.nim).single();
              if (userData) {
                await supabase.from('alumni').update({ skor_werewolf: userData.skor_werewolf + 3000 }).eq('nim', p.nim);
              }
            }));
          };

          if (dosenLive === 0) {
            nextFase = 'SELESAI'; durasiNext = 999;
            pesanBaru = "🎉 MAHASISWA MENANG! Semua Dosen Killer berhasil dikeluarkan. Warga dapat 3000 Poin!";
            const wargaMenang = freshPlayers.filter(p => p.peran !== 'DOSEN_KILLER');
            await bagikanPoin(wargaMenang);
          } else if (dosenLive >= wargLive) {
            nextFase = 'SELESAI'; durasiNext = 999;
            pesanBaru = "🧛‍♂️ DOSEN KILLER MENANG! Kelas hancur. Dosen Killer dapat 3000 Poin!";
            const dosenMenang = freshPlayers.filter(p => p.peran === 'DOSEN_KILLER');
            await bagikanPoin(dosenMenang);
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
        }).eq('room_code', roomCode);

        setTimeout(() => { isProcessingRef.current = false; }, 2000);
      }
    }, 1000);

    return () => clearInterval(engineInterval);
  }, [isInRoom, roomCode, currentUser.isAdmin]);

  // ==============================================================
  // TIMER VISUAL POJOK KANAN ATAS UNTUK SEMUA ORANG
  // ==============================================================
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

  
  // --- FUNGSI KLIK ADMIN ---
  const handleCreateRoom = async () => {
    const kodeBaru = `DK-${Math.floor(100 + Math.random() * 900)}`;
    const { error } = await supabase.from('dosen_killer_state').insert([{
      room_code: kodeBaru, fase_game: 'LOBBY', pesan_pengumuman: 'Kelas baru dibuat.'
    }]);

    if (!error) { setRoomCode(kodeBaru); setIsInRoom(true); } 
    else alert("Gagal membuat kelas baru. Coba lagi.");
  };

  const handleJoinRoom = async () => {
    const kodeBersih = inputRoomCode.trim().toUpperCase();
    if (!kodeBersih) return alert("Masukkan kode kelas dulu!");
    const { data } = await supabase.from('dosen_killer_state').select('*').eq('room_code', kodeBersih).single();
    if (data) { setRoomCode(kodeBersih); setIsInRoom(true); } 
    else alert("Kode kelas tidak ditemukan/salah!");
  };

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

    const durasiMalam = 30; 
    const waktuSelesaiMalam = new Date(Date.now() + durasiMalam * 1000).toISOString();
    const pengumumanAwal = `Game dimulai! Terdeteksi ${jmlDosen} Dosen Killer yang menyusup di kelas ini.`;

    await supabase.from('dosen_killer_state').update({ 
      fase_game: 'MALAM', ronde: 1, waktu_berakhir: waktuSelesaiMalam, pesan_pengumuman: pengumumanAwal
    }).eq('room_code', roomCode);
  };


  // ==============================================================
  // RENDER UI KOMPONEN
  // ==============================================================

  if (!isInRoom) {
    return (
      <div className="p-6 max-w-sm mx-auto bg-slate-800 rounded-3xl border border-slate-700 mt-12 text-center shadow-xl">
        <span className="text-5xl block mb-3">🧛‍♂️</span>
        <h2 className="text-xl font-bold text-white mb-1">Portal Dosen Killer</h2>
        <p className="text-xs text-slate-400 font-mono mb-6">Sistem Isolasi Kelas Multiplayer</p>

        <div className="space-y-4">
          <button onClick={handleCreateRoom} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm">
            ➕ Buka Kelas Baru (Buat Room)
          </button>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 font-mono text-[10px]">ATAU GABUNG</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="CONTOH: DK-392"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl text-center text-sm font-bold tracking-widest text-white uppercase focus:outline-none focus:border-red-500"
            />
            <button onClick={handleJoinRoom} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95">
              Masuk
            </button>
          </div>
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
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500 rounded-3xl max-w-sm p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in duration-300">
              <span className="text-5xl block mb-4">⚠️</span>
              <h3 className="text-xl font-black text-red-500 mb-2 uppercase tracking-widest">Peringatan Host!</h3>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Perangkat ini bertindak sebagai <b>SERVER UTAMA</b> untuk kelangsungan permainan ini.
              </p>
              <ul className="text-left text-xs text-slate-400 font-mono space-y-3 mb-6 bg-slate-950 p-4 rounded-xl">
                <li>📡 <b>Koneksi Wajib Stabil:</b> Jika internetmu putus, game semua orang akan macet seketika.</li>
                <li>🚫 <b>Jangan Keluar:</b> Dilarang me-refresh, menutup tab browser, atau membiarkan layar HP mati selama game berlangsung.</li>
              </ul>
              <button 
                onClick={() => setShowAdminWarning(false)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/50"
              >
                SAYA MENGERTI
              </button>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-2xl mx-auto text-center relative">
          {currentUser.isAdmin && (
            <button 
              onClick={async () => await supabase.from('dosen_killer_state').update({ fase_game: 'LOBBY' }).eq('room_code', roomCode)} 
              className="mb-8 px-4 py-2 bg-slate-800 text-slate-500 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white text-[9px] font-bold tracking-widest absolute -top-4 right-4"
            >
              ⚙️ RESET ROOM
            </button>
          )}

          <h1 className="text-3xl md:text-4xl font-black text-red-500 mb-8 tracking-widest uppercase drop-shadow-lg mt-4">
            MALAM KEAKRABAN
          </h1>

          <div 
            onClick={() => {
              navigator.clipboard.writeText(roomCode);
              alert(`Kode ${roomCode} berhasil disalin ke clipboard!`);
            }}
            className="bg-slate-900/80 border-2 border-dashed border-yellow-500/60 p-6 md:p-8 rounded-3xl inline-block mb-10 shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all hover:scale-105 hover:bg-slate-800 cursor-pointer active:scale-95 group relative"
            title="Klik untuk menyalin kode"
          >
            <p className="text-xs md:text-sm text-slate-400 font-bold tracking-[0.2em] mb-3 uppercase group-hover:text-yellow-500 transition-colors">
              KODE KELAS (Tap untuk Copy)
            </p>
            <div className="text-5xl md:text-7xl font-black text-yellow-400 tracking-widest drop-shadow-md font-mono">
              {roomCode}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 font-mono text-xs">
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center"><span className="block text-xl">🧛‍♂️</span><span className="text-red-400 font-bold text-[10px] md:text-sm block mt-1">{currentJmlDosen} Dosen</span></div>
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center"><span className="block text-xl">🕵️‍♂️</span><span className="text-blue-400 font-bold text-[10px] md:text-sm block mt-1">1 Intel</span></div>
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center"><span className="block text-xl">👨‍🎓</span><span className="text-green-400 font-bold text-[10px] md:text-sm block mt-1">1 Ahli</span></div>
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center"><span className="block text-xl">📱</span><span className="text-purple-400 font-bold text-[10px] md:text-sm block mt-1">1 Update</span></div>
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center"><span className="block text-xl">🥱</span><span className="text-slate-300 font-bold text-[10px] md:text-sm block mt-1">{Math.max(0, pemain.length - (currentJmlDosen + 3))} Warga</span></div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl mb-8 border border-slate-700">
            <h2 className="font-bold text-white mb-4 text-sm">Mahasiswa Hadir ({pemain.length}/100)</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {pemain.map(p => (
                <span key={p.nim} className="bg-slate-700 px-4 py-2 rounded-full text-xs font-bold text-slate-200 border border-slate-600 shadow-lg">
                  {p.nama} {p.nim === currentUser.nim && '(Kamu)'}
                </span>
              ))}
            </div>
          </div>

          {/* ============================================================== */}
          {/* PANDUAN PERAN - MUNCUL DI LOBBY */}
          {/* ============================================================== */}
          <div className="bg-slate-900/60 p-6 rounded-2xl mb-8 border border-slate-700 text-left shadow-inner">
            <h2 className="font-bold text-yellow-500 mb-5 text-sm text-center tracking-widest border-b border-slate-700 pb-3">
              📜 PANDUAN PERAN (BACA SEBELUM MULAI)
            </h2>
            <div className="space-y-4 text-xs font-mono">
              <div className="flex gap-4 items-start">
                 <span className="text-2xl drop-shadow">🧛‍♂️</span>
                 <div><span className="text-red-400 font-black tracking-wider block mb-0.5">DOSEN KILLER</span> <span className="text-slate-300 leading-relaxed">Memberi nilai E (DO) ke 1 mahasiswa setiap malam. Kalian bisa menyusun rencana rahasia melalui <b className="text-red-400">Live Chat</b> khusus sesama Dosen Killer.</span></div>
              </div>
              <div className="flex gap-4 items-start">
                 <span className="text-2xl drop-shadow">🕵️‍♂️</span>
                 <div><span className="text-blue-400 font-black tracking-wider block mb-0.5">MAHASISWA INTEL</span> <span className="text-slate-300 leading-relaxed">Setiap siang tiba, sistem akan membocorkan <b className="text-blue-400">3 Nama Suspek</b> (1 DK asli & 2 Warga) di layar HP-mu. Arahkan massa untuk mem-voting mereka!</span></div>
              </div>
              <div className="flex gap-4 items-start">
                 <span className="text-2xl drop-shadow">👨‍🎓</span>
                 <div><span className="text-green-400 font-black tracking-wider block mb-0.5">MAHASISWA AHLI</span> <span className="text-slate-300 leading-relaxed">Memiliki hak veto akademis. Kamu bisa memilih 1 orang setiap malam untuk <b className="text-green-400">diselamatkan</b> dari ancaman DO.</span></div>
              </div>
              <div className="flex gap-4 items-start">
                 <span className="text-2xl drop-shadow">📱</span>
                 <div><span className="text-purple-400 font-black tracking-wider block mb-0.5">MAHASISWA UPTODATE</span> <span className="text-slate-300 leading-relaxed">Anti-DO. Jika kamu ditargetkan oleh Dosen Killer saat malam, sistem otomatis menolak nilai E tersebut karena kamu <b className="text-purple-400">kebal</b> dan sudah tahu infonya duluan.</span></div>
              </div>
              <div className="flex gap-4 items-start">
                 <span className="text-2xl drop-shadow">🥱</span>
                 <div><span className="text-slate-400 font-black tracking-wider block mb-0.5">WARGA BIASA</span> <span className="text-slate-300 leading-relaxed">Tidak punya skill khusus di malam hari. Tugasmu berdiskusi di Live Chat siang hari, mencari kejanggalan, dan mem-voting Dosen Killer yang menyamar.</span></div>
              </div>
            </div>
          </div>

          {currentUser.isAdmin && (
            <button onClick={mulaiGame} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/50 active:scale-95 text-sm tracking-wide">
              Acak Peran & Mulai Perkuliahan 🎮
            </button>
          )}
        </div>
      </>
    );
  }

  // --- FLOATING GLOBAL TIMER ---
  const GlobalTimer = () => (
    <div className="fixed top-4 right-4 z-[5000] bg-slate-900/90 border border-red-500/50 text-red-400 font-bold px-4 py-2 rounded-full shadow-lg font-mono flex items-center gap-2 backdrop-blur-sm">
       <span className="animate-spin-slow origin-center">⏳</span>
       <span className="w-6 text-right">{sisaWaktuUI}s</span>
    </div>
  );

  const pesanLayar = dbStateRef.current?.pesan_pengumuman || '';

  if (faseGame === 'SELESAI') {
    const isMenang = pesanLayar.includes('MAHASISWA MENANG');
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-50 animate-in fade-in zoom-in duration-700">
        <span className="text-8xl mb-6">{isMenang ? '🎉' : '🧛‍♂️'}</span>
        <h2 className={`text-2xl md:text-4xl font-black uppercase tracking-widest mb-4 ${isMenang ? 'text-green-500' : 'text-red-500'}`}>
          {isMenang ? 'MAHASISWA MENANG' : 'DOSEN KILLER MENANG'}
        </h2>
        <p className="text-slate-400 font-mono text-sm max-w-md leading-relaxed">{pesanLayar}</p>

        {currentUser.isAdmin && (
           <button
             onClick={async () => await supabase.from('dosen_killer_state').update({ fase_game: 'LOBBY' }).eq('room_code', roomCode)}
             className="mt-16 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl border border-slate-700 transition-all font-bold tracking-widest text-xs"
           >
             KEMBALI KE LOBBY
           </button>
        )}
      </div>
    );
  }

  return (
    <>
      <GlobalTimer />
      
      {/* ============================================================== */}
      {/* PANEL CHAT DOSEN KILLER (HANYA MUNCUL DI MALAM HARI & BUAT DK) */}
      {/* ============================================================== */}
      {faseGame === 'MALAM' && peranKu === 'DOSEN_KILLER' && isHidup && (
        <div className="fixed bottom-4 left-4 w-72 md:w-80 bg-slate-900 border border-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 backdrop-blur-md">
          <div className="bg-red-950/80 p-3 border-b border-red-600/50 flex justify-between items-center">
             <span className="text-red-400 font-black text-[10px] tracking-widest flex items-center gap-2">
               <span className="animate-pulse">🔴</span> JARINGAN RAHASIA DK
             </span>
          </div>
          <div className="h-44 p-3 overflow-y-auto flex flex-col gap-3 bg-slate-950/80 scrollbar-thin scrollbar-thumb-red-900">
             {dkChat.length === 0 && (
               <p className="text-center text-[10px] text-slate-500 font-mono italic my-auto">Diskusi target DO kalian di sini...</p>
             )}
             {dkChat.map((c, i) => (
               <div key={i} className={`flex flex-col max-w-[85%] ${c.sender === currentUser.nama ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-red-500 font-bold text-[9px] mb-0.5">{c.sender}</span>
                  <div className={`px-3 py-1.5 rounded-xl text-xs shadow-md ${c.sender === currentUser.nama ? 'bg-red-600 text-white rounded-br-sm' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm'}`}>
                    {c.text}
                  </div>
               </div>
             ))}
             <div ref={chatEndRef} />
          </div>
          <form onSubmit={kirimPesanDK} className="p-2 bg-slate-900 border-t border-red-600/30 flex gap-2">
             <input 
                type="text" 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500 placeholder:text-slate-600" 
                placeholder="Rencana DO malam ini..." 
             />
             <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-4 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-red-900/50">
               SEND
             </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* OVERLAY PANEL RAHASIA KHUSUS INTEL SAAT SIANG HARI */}
      {/* ============================================================== */}
      {peranKu === 'INTEL' && isHidup && intelSuspects.length > 0 && (faseGame === 'DISKUSI' || faseGame === 'VOTING') && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-blue-900/95 border-2 border-blue-400 p-5 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.6)] z-[4000] backdrop-blur-md animate-in slide-in-from-bottom-10">
          <h3 className="text-blue-200 font-black tracking-widest text-sm mb-3 flex items-center gap-2 border-b border-blue-400/50 pb-2">
            <span className="text-xl animate-pulse">🕵️‍♂️</span> BERKAS RAHASIA INTEL
          </h3>
          <p className="text-white text-xs mb-4 leading-relaxed font-mono">
            Berdasarkan penyelidikanmu semalam, <b>salah satu dari 3 orang ini dipastikan adalah DOSEN KILLER</b>. Arahkan warga untuk mem-voting mereka!
          </p>
          <div className="flex flex-col gap-2">
            {intelSuspects.map((s, i) => (
              <div key={i} className="bg-blue-950 border border-blue-400/50 text-blue-100 text-center py-2 rounded-lg text-xs font-bold shadow-inner">
                {s.nama}
              </div>
            ))}
          </div>
        </div>
      )}

      {faseGame === 'MALAM' && <LayarMalam peranKu={peranKu} isHidup={isHidup} pemain={pemain} currentUser={{...currentUser, roomCode}} />}
      {faseGame === 'DISKUSI' && <LayarDiskusi pemain={pemain} isHidup={isHidup} currentUser={{...currentUser, roomCode}} />}
      {faseGame === 'VOTING' && <LayarVoting pemain={pemain} isHidup={isHidup} currentUser={{...currentUser, roomCode}} />}
      {(faseGame === 'PAGI' || faseGame === 'EKSEKUSI') && <LayarEksekusi pesanPengumuman={pesanLayar} pemain={pemain} />}
    </>
  );
}