// src/components/GameDashboard.jsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti'; // <--- IMPORT CONFETTI
import Login from './Login';
import TreasureHunt from './TreasureHunt'; 
import FaceGame from './FaceGame'; 
import ScoreBoard from './ScoreBoard';
import AdminDashboard from './AdminDashboard'; // <--- TAMBAHKAN INI

export default function GameDashboard() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [activeView, setActiveView] = useState('dashboard'); 
  
  // State untuk overlay Anniversary
  const [showAnniversary, setShowAnniversary] = useState(false);

  useEffect(() => {
    // Cek sesi login di browser
    const savedNim = localStorage.getItem('user_nim');
    const savedNama = localStorage.getItem('user_nama');
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (savedNim) {
      setUser({ nim: savedNim, nama: savedNama, is_admin: isAdmin });
    }
    setIsChecking(false);
  }, []);

  // Effect khusus untuk menjalankan Anniversary setelah Login berhasil
  useEffect(() => {
    if (user && user.nim !== 'guest') {
      const hasSeen = localStorage.getItem(`has_seen_anniversary_${user.nim}`);
      
      if (!hasSeen) {
        setShowAnniversary(true);

        // --- LOGIKA KEMBANG API KONFETI (6 Detik) ---
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

        // Auto-tutup overlay setelah 8 detik
        setTimeout(() => {
          closeAnniversary();
        }, 8000);
      }
    }
  }, [user]);

  const closeAnniversary = () => {
    setShowAnniversary(false);
    if (user) {
      localStorage.setItem(`has_seen_anniversary_${user.nim}`, 'true');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-green-500 font-mono">
        LOADING DATA TL16...
      </div>
    );
  }
  
  if (!user) return <Login onLoginSuccess={setUser} />;

  // Render Game Peta
  if (activeView === 'map') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button 
          onClick={() => setActiveView('dashboard')}
          className="mb-6 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors"
        >
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <TreasureHunt /> 
      </div>
    );
  }

  // Render Game Muka Blur
  if (activeView === 'face') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <button 
          onClick={() => setActiveView('dashboard')}
          className="mb-6 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors"
        >
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>
        <FaceGame />
      </div>
    );
  }

  // Render Dashboard Admin
  if (activeView === 'admin' && user.is_admin) {
    return <AdminDashboard onBack={() => setActiveView('dashboard')} />;
  }

  // Render Dashboard Utama
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 relative">
      
      {/* ========================================= */}
      {/* OVERLAY ANNIVERSARY (Hanya muncul sekali) */}
      {/* ========================================= */}
      {showAnniversary && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
          {/* Import Font Keren (Cinzel) Khusus untuk Overlay Ini */}
          <style>
            {`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');`}
          </style>

          {/* Efek Cahaya di Belakang */}
          <div className="absolute w-96 h-96 bg-yellow-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

          <div className="relative z-10 text-center animate-in fade-in zoom-in duration-1000">
            <h2 className="text-yellow-500 font-bold tracking-widest text-lg md:text-2xl mb-2 drop-shadow-lg">
              SELAMAT DATANG KEMBALI
            </h2>
            <h1 
              className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-6"
              style={{ fontFamily: "'Cinzel', serif", textShadow: "0px 4px 20px rgba(250, 204, 21, 0.4)" }}
            >
              HAPPY 10th<br/>ANNIVERSARY
            </h1>
            <p className="text-white text-2xl md:text-4xl font-bold tracking-[0.2em] mb-12">
              SEDULUR 16
            </p>

            <button 
              onClick={closeAnniversary}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full backdrop-blur-sm transition-all animate-bounce"
            >
              Lanjut ke Dashboard &rarr;
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD UTAMA */}
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-slate-700 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-500">Halo, {user.nama}</h1>
            <p className="text-slate-400 font-mono text-sm">Teknik Lingkungan 2016 | NIM: {user.nim}</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-xs bg-slate-800 px-4 py-2 rounded-full border border-slate-600 hover:bg-red-900/30 hover:border-red-500 transition-all"
          >
            LOGOUT
          </button>
        </header>

        {/* Grid untuk 3 Kotak Menu */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Menu Game Peta (Aktif) */}
          <div 
            onClick={() => setActiveView('map')}
            className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">🗺️</span>
              <h2 className="text-2xl font-bold mb-2">Digital Treasure Hunt</h2>
              <p className="text-slate-400 text-sm mb-6">Napak tilas lokasi memori di sekitar kampus dan tempat kumpul legendaris.</p>
            </div>
            <div className="relative z-10">
              <button className="w-full bg-green-600 py-3 rounded-xl font-bold group-hover:bg-green-500 transition-colors">
                Mulai Eksplorasi
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">📍</div>
          </div>

          {/* Menu Game Muka (Aktif) */}
          <div 
            onClick={() => setActiveView('face')}
            className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">👥</span>
              <h2 className="text-2xl font-bold mb-2">Tebak Muka Blur</h2>
              <p className="text-slate-400 text-sm mb-6">Uji ingatanmu! Seberapa kenal kamu dengan teman seangkatan?</p>
            </div>
            <div className="relative z-10">
              <button className="w-full bg-green-600 py-3 rounded-xl font-bold group-hover:bg-green-500 transition-colors">
                Hayo Tebak, Siapa Ini?
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 text-8xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">🕵️</div>
          </div>

          {/* Menu Kejutan Rahasia (Coming Soon) */}
          <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 cursor-not-allowed shadow-inner relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block opacity-50 grayscale">🎁</span>
              <h2 className="text-2xl font-bold mb-2 text-slate-500">Proyek Rahasia</h2>
              <p className="text-slate-500 text-sm mb-6">Fitur Kejutan Khusus untuk menemani Perjalanan ke Puncak 1 Dekade, Tungguin yaa !!!</p>
            </div>
            <div className="relative z-10">
              <button 
                disabled
                className="w-full bg-slate-900/50 py-3 rounded-xl font-bold text-slate-500 border border-slate-700 cursor-not-allowed flex justify-center items-center gap-2"
              >
                <span className="animate-pulse">⏳</span> Coming Soon
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 text-8xl opacity-[0.02] pointer-events-none">🔒</div>
          </div>

        </div>

        {/* Akses Khusus Admin */}
        {user.is_admin && (
          <div className="mt-12 p-6 bg-green-900/20 border border-green-500/50 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-green-400 font-bold uppercase tracking-widest text-xs">Akses Kontrol Admin</p>
              <p className="text-slate-300 text-sm">Pantau klasemen mahasiswa dan kunci game.</p>
            </div>
            <button 
              onClick={() => setActiveView('admin')} 
              className="bg-green-500 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-green-400 transition-transform active:scale-95 shadow-lg inline-block"
            >
              DASHBOARD ADMIN
            </button>
          </div>
        )}

        {/* TAMPILAN SCOREBOARD DISINI */}
        <ScoreBoard />

        <footer className="mt-16 text-center text-slate-500 text-xs tracking-widest">
          <p>© 2026 TEKNIK LINGKUNGAN ANGKATAN 16 - 1 DEKADE ANNIVERSARY</p>
        </footer>
      </div>
    </div>
  );
}