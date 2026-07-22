// src/components/GameDashboard.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient'; 
import Login from './Login';
import RoadmapModal from './RoadmapModal';

// Komponen berat diload secara lazy (Code Splitting)
const TreasureHunt = lazy(() => import('./TreasureHunt')); 
const FaceGame = lazy(() => import('./FaceGame')); 
const ScoreBoard = lazy(() => import('./ScoreBoard'));
const AdminDashboard = lazy(() => import('./AdminDashboard')); 
const FormKapsulWaktu = lazy(() => import('./FormKapsulWaktu')); 
const WheelOfFamily = lazy(() => import('./WheelOfFamily'));
const MonopoliBoard = lazy(() => import('./MonopoliBoard'));
const DosenKillerGame = lazy(() => import('./DosenKillerGame'));
const UnoBrutalGame = lazy(() => import('./UnoBrutalGame'));

// Komponen Loading Sederhana
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-900 flex justify-center items-center text-green-500 font-mono">
    MEMUAT GAME...
  </div>
);

export default function GameDashboard() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [activeView, setActiveView] = useState('dashboard'); 
  
  const [showAnniversary, setShowAnniversary] = useState(false);
  
  // State khusus untuk sistem Countdown Wheel of Family
  const [targetDate, setTargetDate] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [wheelUnlocked, setWheelUnlocked] = useState(false);
  
  // State untuk kunci game rahasia
  const [isMonopoliUnlocked, setIsMonopoliUnlocked] = useState(false);
  const [isWerewolfUnlocked, setIsWerewolfUnlocked] = useState(false);
  const [isUnoUnlocked, setIsUnoUnlocked] = useState(false);

  // State untuk Teaser H-30
  const [monopoliApproaching, setMonopoliApproaching] = useState(false);
  const [werewolfApproaching, setWerewolfApproaching] = useState(false);
  const [unoApproaching, setUnoApproaching] = useState(false);

  useEffect(() => {
    // 1. Matikan Klik Kanan
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 2. Matikan Shortcut Keyboard (F12, Ctrl+Shift+I, Ctrl+U, dll)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && e.key === 'U') || 
        (e.metaKey && e.altKey && e.key === 'I') // Untuk pengguna Mac
      ) {
        e.preventDefault();
      }
    };

    // Pasang event listener ke seluruh halaman
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Bersihkan saat komponen ditutup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  useEffect(() => {
    const savedNim = localStorage.getItem('user_nim');
    const savedNama = localStorage.getItem('user_nama');
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (savedNim) {
      setUser({ nim: savedNim, nama: savedNama, is_admin: isAdmin });
    }
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (user && user.nim !== 'guest') {
      const hasSeen = localStorage.getItem(`has_seen_anniversary_${user.nim}`);
      if (!hasSeen) {
        setShowAnniversary(true);
        const duration = 6 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        setTimeout(() => closeAnniversary(), 8000);
      }
    }
  }, [user]);

  // State bantu untuk menyimpan tanggal (agar dicek secara lokal tanpa membebani database)
  const [gameDates, setGameDates] = useState(null);

  // 1. AMBIL DATA DARI DATABASE SECARA REALTIME (MENGHAPUS POLLING INTERVAl)
  useEffect(() => {
    if (!user) return;

    const updateGameStatus = (data) => {
      setTargetDate(data.wheel_unlock_date ? new Date(data.wheel_unlock_date) : null);
      if (!data.wheel_unlock_date) setWheelUnlocked(false);
      
      setGameDates({
        monopoli: data.monopoli_unlock_date,
        werewolf: data.werewolf_unlock_date,
        uno: data.uno_unlock_date
      });
    };

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('wheel_unlock_date, monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date')
          .eq('id', 1)
          .single();

        if (error) throw error;
        if (data) {
          updateGameStatus(data);
        }
      } catch (error) {
        console.error("Gagal cek jadwal:", error.message);
      }
    };

    fetchSettings(); // Ambil sekali saat pertama load

    // Subscribe ke Realtime Supabase
    const subscription = supabase
      .channel('public:app_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' }, payload => {
          console.log("Realtime Update Diterima:", payload.new);
          updateGameStatus(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // 2. MESIN HITUNG MUNDUR (COUNTDOWN) WHEEL
  useEffect(() => {
    if (!targetDate) return;

    // Update setiap 1 detik
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        // Waktu habis! Buka gamenya
        setWheelUnlocked(true);
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        // Hitung sisa hari, jam, menit, detik
        setWheelUnlocked(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // 3. CEK LOKAL JADWAL GAME RAHASIA (TIDAK ADA PERMINTAAN KE DATABASE SAMA SEKALI)
  useEffect(() => {
    if (!user || !gameDates) return;

    const checkLocalTime = () => {
      const now = new Date().getTime();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // Hitungan 30 hari dalam milidetik

      // === Cek Status Monopoli ===
      if (user.is_admin) {
         setIsMonopoliUnlocked(true);
         setMonopoliApproaching(false);
      } else if (gameDates.monopoli) {
        const unlockTimeMono = new Date(gameDates.monopoli).getTime();
        setIsMonopoliUnlocked(now >= unlockTimeMono);
        setMonopoliApproaching(now < unlockTimeMono && (unlockTimeMono - now) <= THIRTY_DAYS_MS);
      } else {
        setIsMonopoliUnlocked(false); 
        setMonopoliApproaching(false);
      }

      // === Cek Status Dosen Killer ===
      if (user.is_admin) {
         setIsWerewolfUnlocked(true);
         setWerewolfApproaching(false);
      } else if (gameDates.werewolf) {
        const unlockTimeWolf = new Date(gameDates.werewolf).getTime();
        setIsWerewolfUnlocked(now >= unlockTimeWolf);
        setWerewolfApproaching(now < unlockTimeWolf && (unlockTimeWolf - now) <= THIRTY_DAYS_MS);
      } else {
        setIsWerewolfUnlocked(false);
        setWerewolfApproaching(false);
      }

      // === Cek Status UNO Brutal ===
      if (user.is_admin) {
         setIsUnoUnlocked(true);
         setUnoApproaching(false);
      } else if (gameDates.uno) {
        const unlockTimeUno = new Date(gameDates.uno).getTime();
        setIsUnoUnlocked(now >= unlockTimeUno);
        setUnoApproaching(now < unlockTimeUno && (unlockTimeUno - now) <= THIRTY_DAYS_MS);
      } else {
        setIsUnoUnlocked(false);
        setUnoApproaching(false);
      }
    };

    checkLocalTime();
    // Cek otomatis setiap detik secara lokal (tanpa akses DB, 0% quota used)
    const interval = setInterval(checkLocalTime, 1000); 
    return () => clearInterval(interval);
  }, [user, gameDates]);

  const closeAnniversary = () => {
    setShowAnniversary(false);
    if (user) localStorage.setItem(`has_seen_anniversary_${user.nim}`, 'true');
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (isChecking) {
    return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-green-500 font-mono">LOADING DATA TL16...</div>;
  }
  
  if (!user) return <Login onLoginSuccess={setUser} />;

  // ==============================================================
  // PINDAH HALAMAN MENU (ROUTING SEDERHANA)
  // ==============================================================
  if (activeView === 'map') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors">
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <Suspense fallback={<LoadingScreen />}>
          <TreasureHunt /> 
        </Suspense>
      </div>
    );
  }

  if (activeView === 'face') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors">
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <Suspense fallback={<LoadingScreen />}>
          <FaceGame />
        </Suspense>
      </div>
    );
  }

  if (activeView === 'kapsul') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors">
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <Suspense fallback={<LoadingScreen />}>
          <FormKapsulWaktu userLocal={user} />
        </Suspense>
      </div>
    );
  }

  if (activeView === 'wheel') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors">
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <Suspense fallback={<LoadingScreen />}>
          <WheelOfFamily />
        </Suspense>
      </div>
    );
  }

  if (activeView === 'monopoli') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors">
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <Suspense fallback={<LoadingScreen />}>
          <MonopoliBoard />
        </Suspense>
      </div>
    );
  }

  if (activeView === 'dosenkiller') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center text-red-500 hover:text-red-400 font-bold transition-colors">
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <Suspense fallback={<LoadingScreen />}>
          <DosenKillerGame />
        </Suspense>
      </div>
    );
  }

  if (activeView === 'unobrutal') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
        <button onClick={() => setActiveView('dashboard')} className="mb-6 flex items-center text-red-500 hover:text-red-400 font-bold transition-colors">
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <Suspense fallback={<LoadingScreen />}>
          <UnoBrutalGame />
        </Suspense>
      </div>
    );
  }

  if (activeView === 'admin' && user.is_admin) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminDashboard onBack={() => setActiveView('dashboard')} />
      </Suspense>
    );
  }

  // ==============================================================
  // TAMPILAN DASHBOARD UTAMA
  // ==============================================================
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 relative">
      
      {showAnniversary && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');`}</style>
          <div className="absolute w-96 h-96 bg-yellow-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
          <div className="relative z-10 text-center animate-in fade-in zoom-in duration-1000">
            <h2 className="text-yellow-500 font-bold tracking-widest text-lg md:text-2xl mb-2 drop-shadow-lg">SELAMAT DATANG KEMBALI</h2>
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-6" style={{ fontFamily: "'Cinzel', serif", textShadow: "0px 4px 20px rgba(250, 204, 21, 0.4)" }}>
              HAPPY <br/>ANNIVERSARY
            </h1>
            <p className="text-white text-2xl md:text-4xl font-bold tracking-[0.2em] mb-12">SEDULUR 16</p>
            <button onClick={closeAnniversary} className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full backdrop-blur-sm transition-all animate-bounce">
              Lanjut ke Dashboard &rarr;
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-slate-700 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-500">Halo, {user.nama}</h1>
            <p className="text-slate-400 font-mono text-sm">Teknik Lingkungan 2016 | NIM: {user.nim}</p>
          </div>
          
          {/* GRUP TOMBOL HEADER */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <RoadmapModal /> 
            
            <button onClick={handleLogout} className="text-xs md:text-sm bg-slate-800 px-4 py-2 rounded-full border border-slate-600 hover:bg-red-900/30 hover:border-red-500 hover:text-red-400 transition-all ml-auto md:ml-0">
              LOGOUT
            </button>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          
          <div onClick={() => setActiveView('map')} className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">🗺️</span>
              <h2 className="text-2xl font-bold mb-2">Digital Treasure Hunt</h2>
              <p className="text-slate-400 text-sm mb-6">Napak tilas lokasi memori di sekitar kampus dan tempat kumpul legendaris.</p>
            </div>
            <div className="relative z-10">
              <button className="w-full bg-green-600 py-3 rounded-xl font-bold group-hover:bg-green-500 transition-colors">Mulai Eksplorasi</button>
            </div>
            <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">📍</div>
          </div>

          <div onClick={() => setActiveView('face')} className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">👥</span>
              <h2 className="text-2xl font-bold mb-2">Tebak Muka Blur</h2>
              <p className="text-slate-400 text-sm mb-6">Uji ingatanmu! Seberapa kenal kamu dengan teman seangkatan?</p>
            </div>
            <div className="relative z-10">
              <button className="w-full bg-green-600 py-3 rounded-xl font-bold group-hover:bg-green-500 transition-colors">Hayo Tebak, Siapa Ini?</button>
            </div>
            <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">🕵️</div>
          </div>

          <div onClick={() => setActiveView('kapsul')} className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-yellow-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">⏳</span>
              <h2 className="text-2xl font-bold mb-2 text-yellow-500">Kapsul Waktu</h2>
              <p className="text-slate-400 text-sm mb-6">Setor foto terbaik & pesan maut kalian untuk acara Wheel of Family!</p>
            </div>
            <div className="relative z-10">
              <button className="w-full bg-yellow-600 py-3 rounded-xl font-bold text-slate-900 group-hover:bg-yellow-500 transition-colors">Buka Kapsul</button>
            </div>
            <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">📦</div>
          </div>

          {/* ============================================================== */}
          {/* KARTU TEASER MONOPOLI (H-30) */}
          {/* ============================================================== */}
          {monopoliApproaching && !isMonopoliUnlocked && (
            <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col justify-between cursor-not-allowed opacity-80 animate-in fade-in">
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-4xl mb-4 block blur-[2px] opacity-30">🎲</span>
                <span className="bg-red-950/50 border border-red-900 text-red-500 text-[10px] font-black px-2 py-1 rounded-md tracking-widest uppercase">ENCRYPTED</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">
                  <span className="bg-slate-800 text-transparent px-2 py-0.5 rounded-sm select-none relative inline-block">
                    Monopoli TL16
                    <span className="absolute inset-0 flex items-center justify-center text-red-600/90 text-[11px] font-black tracking-widest uppercase">Classified</span>
                  </span>
                </h2>
                <p className="text-slate-600 text-sm mb-6 line-through decoration-slate-950 decoration-[5px] decoration-wavy select-none">
                  Napak tilas 4 tahun masa kuliah. Kocok dadu, bayar UKT.
                </p>
              </div>
              <div className="absolute -right-8 -bottom-8 text-8xl opacity-[0.02] pointer-events-none blur-sm">🔒</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* KARTU MONOPOLI ASLI */}
          {/* ============================================================== */}
          {isMonopoliUnlocked && (
            <div onClick={() => setActiveView('monopoli')} className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between animate-in zoom-in duration-500">
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-4xl mb-4 block">🎲</span>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-widest">LIVE</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 text-emerald-400">Monopoli TL16</h2>
                <p className="text-slate-400 text-sm mb-6">Napak tilas 4 tahun masa kuliah. Kocok dadu, bayar UKT, dan bersiaplah buka aib di petak ToD!</p>
              </div>
              <div className="relative z-10">
                <button className="w-full bg-emerald-600 py-3 rounded-xl font-bold text-white group-hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">Masuk ke Papan 🏃‍♂️</button>
              </div>
              <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">💸</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* KARTU TEASER DOSEN KILLER (H-30) */}
          {/* ============================================================== */}
          {werewolfApproaching && !isWerewolfUnlocked && (
            <div className="bg-[#0f172a]/60 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between cursor-not-allowed opacity-80 animate-in fade-in">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-4xl opacity-30 blur-[2px]">🧛‍♂️</span>
                  <span className="bg-red-950/50 border border-red-900 text-red-500 text-[10px] font-black px-2 py-1 rounded tracking-wider">RESTRICTED</span>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  <span className="bg-slate-800 text-transparent px-2 py-0.5 rounded-sm select-none relative inline-block">
                    Dosen Killer
                    <span className="absolute inset-0 flex items-center justify-center text-red-600/90 text-[11px] font-black tracking-widest uppercase">Classified</span>
                  </span>
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed line-through decoration-slate-950 decoration-[5px] decoration-wavy select-none">
                  Satu dekade berlalu, tapi ancaman nilai E masih mengintai. Temukan pengkhianat!
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* KARTU DOSEN KILLER ASLI */}
          {/* ============================================================== */}
          {isWerewolfUnlocked && (
            <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 flex flex-col justify-between hover:border-red-500 transition-colors animate-in zoom-in duration-500 cursor-pointer shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-4xl drop-shadow-md">🧛‍♂️</span>
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded tracking-wider">LIVE</span>
                </div>
                <h3 className="text-2xl font-bold text-red-400 mb-2">Dosen Killer</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Satu dekade berlalu, tapi ancaman nilai E masih mengintai. Temukan pengkhianat di antara sedulur 16 sebelum kamu di-DO!
                </p>
              </div>
              <button 
                onClick={() => setActiveView('dosenkiller')} 
                className="relative z-10 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-900/20"
              >
                Masuk Kelas 🚪
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* KARTU TEASER UNO BRUTAL (H-30) */}
          {/* ============================================================== */}
          {unoApproaching && !isUnoUnlocked && (
            <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col justify-between cursor-not-allowed opacity-80 animate-in fade-in">
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-4xl mb-4 block blur-[2px] opacity-30">🃏</span>
                <span className="bg-red-950/50 border border-red-900 text-red-500 text-[10px] font-black px-2 py-1 rounded-md tracking-widest uppercase">ENCRYPTED</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">
                  <span className="bg-slate-800 text-transparent px-2 py-0.5 rounded-sm select-none relative inline-block">
                    UNO Brutal
                    <span className="absolute inset-0 flex items-center justify-center text-red-600/90 text-[11px] font-black tracking-widest uppercase">Classified</span>
                  </span>
                </h2>
                <p className="text-slate-600 text-sm mb-6 line-through decoration-slate-950 decoration-[5px] decoration-wavy select-none">
                  Hancurkan pertemanan sedulur 16 dengan aturan main yang lebih kejam.
                </p>
              </div>
              <div className="absolute -right-8 -bottom-8 text-8xl opacity-[0.02] pointer-events-none blur-sm">🔒</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* KARTU UNO BRUTAL ASLI */}
          {/* ============================================================== */}
          {isUnoUnlocked && (
            <div onClick={() => setActiveView('unobrutal')} className="group bg-[#1e293b] p-8 rounded-3xl border border-slate-700 hover:border-yellow-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between animate-in zoom-in duration-500">
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-4xl mb-4 block">🃏</span>
                <span className="bg-yellow-600 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-widest">LIVE</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 text-yellow-500">UNO Brutal</h2>
                <p className="text-slate-400 text-sm mb-6">Hancurkan pertemanan sedulur 16 dengan aturan main yang lebih kejam. Berani masuk meja?</p>
              </div>
              <div className="relative z-10">
                <button className="w-full bg-yellow-600 py-3 rounded-xl font-bold text-slate-900 group-hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)]">Gabung Meja 🪑</button>
              </div>
              <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">🔥</div>
            </div>
          )}

        </div>

        {/* ============================================================== */}
        {/* WHEEL OF FAMILY (KARTU ADMIN & COUNTDOWN) */}
        {/* ============================================================== */}
        <div className="max-w-md mx-auto mb-16">
          {user.is_admin ? (
            <div onClick={() => setActiveView('wheel')} className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-blue-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-4xl mb-4 block">🎡</span>
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-widest animate-pulse">ADMIN MODE</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 text-blue-400">Wheel of Family</h2>
                <p className="text-slate-400 text-sm mb-6">Akses khusus panitia. {targetDate ? 'Countdown ke user sedang berjalan.' : 'Jadwal belum di-set.'}</p>
              </div>
              <div className="relative z-10">
                <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-white group-hover:bg-blue-500 transition-colors">Buka Mesin Spin</button>
              </div>
              <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">🎰</div>
            </div>
          ) : !targetDate ? (
            null
          ) : !wheelUnlocked && timeLeft ? (
            <div className="bg-slate-800/80 p-8 rounded-3xl border border-yellow-500/30 relative overflow-hidden flex flex-col justify-between shadow-[0_0_30px_rgba(234,179,8,0.1)]">
              <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
                <span className="text-4xl mb-2 block animate-pulse">🎁</span>
                <h2 className="text-2xl font-black mb-2 text-yellow-500 uppercase tracking-widest">Tunggu Kejutan Ini</h2>
                <p className="text-slate-400 text-xs mb-6 font-mono">Buka dalam waktu:</p>
                <div className="flex gap-2 justify-center w-full">
                  <div className="bg-slate-900 border border-slate-700 w-14 py-2 rounded-lg text-center">
                    <span className="block font-bold text-lg text-white">{timeLeft.days}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">Hari</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 w-14 py-2 rounded-lg text-center">
                    <span className="block font-bold text-lg text-white">{timeLeft.hours}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">Jam</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 w-14 py-2 rounded-lg text-center animate-pulse">
                    <span className="block font-bold text-lg text-yellow-500">{timeLeft.minutes}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">Mnt</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 w-14 py-2 rounded-lg text-center">
                    <span className="block font-bold text-lg text-red-400">{timeLeft.seconds}</span>
                    <span className="block text-[8px] text-slate-500 uppercase">Dtk</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div onClick={() => setActiveView('wheel')} className="group bg-slate-800 p-8 rounded-3xl border border-blue-500 hover:border-blue-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)] relative overflow-hidden flex flex-col justify-between animate-in zoom-in duration-500">
              <div className="relative z-10">
                <span className="text-4xl mb-4 block animate-bounce">🎡</span>
                <h2 className="text-2xl font-bold mb-2 text-blue-400">Wheel of Family</h2>
                <p className="text-slate-300 text-sm mb-6">WAKTU TELAH TIBA! Putar roda keberuntungan dan lihat perubahan sedulur 16 sekarang!</p>
              </div>
              <div className="relative z-10">
                <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-white group-hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                  Masuk ke Mesin Spin 🚀
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 text-8xl opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">🎰</div>
            </div>
          )}
        </div>

        {user.is_admin && (
          <div className="mt-12 mb-16 p-6 bg-green-900/20 border border-green-500/50 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-green-400 font-bold uppercase tracking-widest text-xs">Akses Kontrol Admin</p>
              <p className="text-slate-300 text-sm">Masuk Control Room untuk atur jadwal game dan kunci klasemen.</p>
            </div>
            <button onClick={() => setActiveView('admin')} className="bg-green-500 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-green-400 transition-transform active:scale-95 shadow-lg inline-block">
              CONTROL ROOM
            </button>
          </div>
        )}

        <Suspense fallback={<div className="text-center p-8 text-slate-500 animate-pulse">Memuat Scoreboard...</div>}>
          <ScoreBoard />
        </Suspense>

        <footer className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs tracking-widest">
          <p>© 2026 TEKNIK LINGKUNGAN ANGKATAN 16 - 1 DEKADE ANNIVERSARY</p>
        </footer>
      </div>
    </div>
  );
}