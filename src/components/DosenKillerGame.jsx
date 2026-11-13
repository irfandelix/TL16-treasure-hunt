import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

import LayarMalam from './LayarMalam';
import LayarDiskusi from './LayarDiskusi';
import LayarVoting from './LayarVoting';
import LayarEksekusi from './LayarEksekusi';

export default function DosenKillerGame() {
  const [roomCode, setRoomCode] = useState(''); 
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
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
  const chatEndRef = useRef(null);

  const dbStateRef = useRef(null);
  const pemainRef = useRef([]);
  const isProcessingRef = useRef(false); 

  const currentUser = {
    nim: localStorage.getItem('user_nim'),
    nama: localStorage.getItem('user_nama'),
    isAdmin: localStorage.getItem('is_admin') === 'true'
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
            pesanBaru = "MAHASISWA MENANG! Semua Dosen Killer berhasil ditemukan. Tim Mahasiswa mendapatkan 3000 Poin!";
            const wargaMenang = freshPlayers.filter(p => p.peran !== 'DOSEN_KILLER');
            await bagikanPoin(wargaMenang);
          } else if (dosenLive >= wargLive) {
            nextFase = 'SELESAI'; durasiNext = 999;
            pesanBaru = "DOSEN KILLER MENANG! Kelas dikuasai Dosen Killer dan mendapatkan 3000 Poin!";
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
    const kodeBaru = `DK-${Math.floor(100 + Math.random() * 900)}`;
    const { error } = await supabase.from('dosen_killer_state').insert([{
      room_code: kodeBaru, fase_game: 'LOBBY', pesan_pengumuman: 'Kelas baru dibuat.'
    }]);

    if (!error) { setRoomCode(kodeBaru); setIsInRoom(true); } 
    else alert("Gagal membuat kelas baru. Silakan coba lagi.");
  };

  const handleJoinRoom = async () => {
    const kodeBersih = inputRoomCode.trim().toUpperCase();
    if (!kodeBersih) return alert("Masukkan kode kelas terlebih dahulu!");
    const { data } = await supabase.from('dosen_killer_state').select('*').eq('room_code', kodeBersih).single();
    if (data) { setRoomCode(kodeBersih); setIsInRoom(true); } 
    else alert("Kode kelas tidak ditemukan.");
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
    await supabase.from('dosen_killer_chat').delete().eq('room_code', roomCode);

    const durasiMalam = 30; 
    const waktuSelesaiMalam = new Date(Date.now() + durasiMalam * 1000).toISOString();
    const pengumumanAwal = `Perkuliahan dimulai! Terdapat ${jmlDosen} Dosen Killer yang menyamar di kelas ini.`;

    await supabase.from('dosen_killer_state').update({ 
      fase_game: 'MALAM', ronde: 1, waktu_berakhir: waktuSelesaiMalam, pesan_pengumuman: pengumumanAwal
    }).eq('room_code', roomCode);
  };

  if (!isInRoom) {
    return (
      <div className="p-6 md:p-8 max-w-md mx-auto bg-slate-800 rounded-2xl border border-slate-700 mt-10 text-center shadow-md">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
          Deduksi Sosial Angkatan
        </p>
        <h2 className="text-2xl font-bold text-white mb-1">Sidang Dosen Killer</h2>
        <p className="text-sm text-slate-300 mb-6">
          Buka ruang kelas baru atau gabung ke kelas yang sudah dibuat temanmu.
        </p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleCreateRoom}
            className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-colors text-base"
          >
            Buka Kelas Baru (Buat Ruangan)
          </button>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-300 font-mono text-xs">ATAU GABUNG KELAS</span>
            <div className="flex-grow border-t border-slate-700"></div>
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
              className="flex-1 min-h-[48px] bg-slate-900 border border-slate-600 rounded-xl text-center text-sm font-mono font-bold tracking-widest text-white uppercase focus:border-amber-400 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleJoinRoom}
              className="min-h-[48px] bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
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
          <div
            className="fixed inset-0 z-[99999] bg-slate-950/90 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="host-warning-title"
          >
            <div className="bg-slate-800 border border-amber-400/50 rounded-2xl max-w-md p-6 text-center shadow-xl">
              <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                Panduan Pemandu Kelas
              </p>
              <h3 id="host-warning-title" className="text-xl font-bold text-white mb-2">
                Perangkat Ini Memandu Jalannya Kelas
              </h3>
              <p className="text-slate-200 text-sm mb-4 leading-relaxed">
                Perangkat Admin mengatur pergantian waktu malam, diskusi, dan pemungutan suara secara otomatis.
              </p>
              <div className="text-left text-xs text-slate-200 space-y-2 mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700">
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
                className="min-h-[44px] px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 text-xs font-mono font-bold"
              >
                Atur Ulang Kelas
              </button>
            </div>
          )}

          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            Ruang Tunggu Kelas
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Malam Keakraban TL 2016
          </h1>

          <button 
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(roomCode);
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 2500);
            }}
            className="bg-slate-800 border-2 border-dashed border-amber-400/70 hover:border-amber-400 p-6 md:p-8 rounded-2xl inline-block mb-8 shadow-md transition-colors group"
          >
            <span className="block text-xs md:text-sm text-slate-200 font-bold tracking-wider mb-2 uppercase">
              {copySuccess ? 'Kode Kelas Berhasil Disalin!' : 'Kode Kelas (Klik untuk Salin)'}
            </span>
            <span className="block text-4xl md:text-6xl font-bold text-amber-400 tracking-widest font-mono">
              {roomCode}
            </span>
          </button>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 font-mono text-xs">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-rose-400 font-bold text-sm block">{currentJmlDosen} Dosen</span>
              <span className="text-slate-300 text-xs">Pemberi Nilai E</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-sky-400 font-bold text-sm block">1 Intel</span>
              <span className="text-slate-300 text-xs">Penyelidik</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-emerald-400 font-bold text-sm block">1 Ahli</span>
              <span className="text-slate-300 text-xs">Penyelamat Nilai</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-amber-400 font-bold text-sm block">1 Uptodate</span>
              <span className="text-slate-300 text-xs">Kebal Nilai E</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center col-span-2 sm:col-span-1">
              <span className="text-slate-100 font-bold text-sm block">{Math.max(0, pemain.length - (currentJmlDosen + 3))} Mahasiswa</span>
              <span className="text-slate-300 text-xs">Peserta Sidang</span>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl mb-8 border border-slate-700">
            <h2 className="font-bold text-white mb-4 text-base">Mahasiswa Hadir ({pemain.length}/100)</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {pemain.map(p => (
                <span key={p.nim} className="bg-slate-900 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 border border-slate-700">
                  {p.nama} {p.nim === currentUser.nim && '(Kamu)'}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl mb-8 border border-slate-700 text-left">
            <h2 className="font-bold text-amber-400 mb-4 text-base text-center border-b border-slate-700 pb-3">
              Panduan Peran Kelas
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <h3 className="text-rose-400 font-bold mb-1">Dosen Killer</h3>
                <p className="text-slate-300 leading-relaxed">
                  Memilih 1 mahasiswa setiap malam untuk diberi nilai E (DO) dan dapat berdiskusi di ruang pesan khusus sesama Dosen Killer.
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <h3 className="text-sky-400 font-bold mb-1">Mahasiswa Intel</h3>
                <p className="text-slate-300 leading-relaxed">
                  Menerima petunjuk 3 nama kandidat setiap siang (1 Dosen Killer asli dan 2 Mahasiswa) untuk membantu arah diskusi.
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <h3 className="text-emerald-400 font-bold mb-1">Mahasiswa Ahli</h3>
                <p className="text-slate-300 leading-relaxed">
                  Memilih 1 teman setiap malam untuk diselamatkan nilainya agar terhindar dari ancaman DO.
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <h3 className="text-amber-400 font-bold mb-1">Mahasiswa Uptodate & Biasa</h3>
                <p className="text-slate-300 leading-relaxed">
                  Mahasiswa Uptodate kebal serangan malam pertama, sementara seluruh mahasiswa berdiskusi dan memilih suspek saat siang hari.
                </p>
              </div>
            </div>
          </div>

          {currentUser.isAdmin && (
            <button
              type="button"
              onClick={mulaiGame}
              className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-4 px-6 rounded-xl transition-colors shadow-md text-base"
            >
              Bagikan Peran & Mulai Sesi Kelas
            </button>
          )}
        </div>
      </>
    );
  }

  const GlobalTimer = () => (
    <div className="fixed top-4 right-4 z-[5000] bg-slate-900 border border-amber-400/50 text-amber-400 font-bold px-4 py-2 rounded-xl shadow-md font-mono flex items-center gap-2">
      <span>Sisa Waktu:</span>
      <span className="w-8 text-right">{sisaWaktuUI}d</span>
    </div>
  );

  const pesanLayar = dbStateRef.current?.pesan_pengumuman || '';

  if (faseGame === 'SELESAI') {
    const isMenang = pesanLayar.includes('MAHASISWA MENANG');
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-50">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
          Hasil Akhir Sidang Angkatan
        </p>
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isMenang ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isMenang ? 'Tim Mahasiswa Menang!' : 'Tim Dosen Killer Menang!'}
        </h2>
        <p className="text-slate-200 text-sm max-w-md leading-relaxed">{pesanLayar}</p>

        {currentUser.isAdmin && (
          <button
            type="button"
            onClick={async () => await supabase.from('dosen_killer_state').update({ fase_game: 'LOBBY' }).eq('room_code', roomCode)}
            className="mt-10 min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 px-8 py-3 rounded-xl transition-colors font-bold text-sm"
          >
            Kembali ke Ruang Tunggu
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <GlobalTimer />
      
      {faseGame === 'MALAM' && peranKu === 'DOSEN_KILLER' && isHidup && (
        <div className="fixed bottom-4 left-4 w-72 md:w-80 bg-slate-800 border border-rose-500/60 rounded-2xl shadow-xl z-[9999] flex flex-col overflow-hidden">
          <div className="bg-slate-900 p-3 border-b border-slate-700 flex justify-between items-center">
            <span className="text-rose-400 font-bold text-xs font-mono">
              Diskusi Khusus Dosen Killer
            </span>
          </div>
          <div className="h-44 p-3 overflow-y-auto flex flex-col gap-3 bg-slate-900/90">
            {dkChat.length === 0 && (
              <p className="text-center text-xs text-slate-300 font-mono my-auto">
                Diskusikan target malam ini bersama rekan Dosen Killer...
              </p>
            )}
            {dkChat.map((c, i) => (
              <div key={i} className={`flex flex-col max-w-[85%] ${c.sender === currentUser.nama ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-rose-300 font-bold text-[10px] mb-0.5">{c.sender}</span>
                <div className={`px-3 py-1.5 rounded-xl text-xs ${c.sender === currentUser.nama ? 'bg-rose-700 text-white' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                  {c.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={kirimPesanDK} className="p-2 bg-slate-800 border-t border-slate-700 flex gap-2">
            <label htmlFor="dk-secret-chat-input" className="sr-only">
              Pesan Rahasia Dosen Killer
            </label>
            <input 
              id="dk-secret-chat-input"
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              className="w-full min-h-[44px] bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-600 focus:border-amber-400 placeholder:text-slate-400" 
              placeholder="Tulis rencana malam ini..." 
            />
            <button
              type="submit"
              className="min-h-[44px] bg-rose-700 hover:bg-rose-600 text-white px-4 rounded-lg text-xs font-bold transition-colors"
            >
              Kirim
            </button>
          </form>
        </div>
      )}

      {peranKu === 'INTEL' && isHidup && intelSuspects.length > 0 && (faseGame === 'DISKUSI' || faseGame === 'VOTING') && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-800 border-2 border-sky-400 p-5 rounded-2xl shadow-xl z-[4000]">
          <h3 className="text-sky-300 font-bold text-sm mb-2 border-b border-slate-700 pb-2">
            Catatan Penyelidikan Intel
          </h3>
          <p className="text-slate-200 text-xs mb-3 leading-relaxed">
            Berdasarkan pengamatan semalam, salah satu dari 3 nama berikut adalah Dosen Killer:
          </p>
          <div className="flex flex-col gap-2">
            {intelSuspects.map((s, i) => (
              <div key={i} className="bg-slate-900 border border-sky-500/40 text-white text-center py-2 rounded-lg text-xs font-bold">
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
