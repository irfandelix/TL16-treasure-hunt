import React, { useState, useEffect } from 'react';

export default function LayarEksekusi({ pesanPengumuman, pemain, onSelesai }) {
  const [bgColor, setBgColor] = useState('bg-black');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // 1. Teks muncul perlahan setelah setengah detik
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 500);

    // 2. Efek Transmisi Warna Latar Belakang (Suspense) setelah 3 detik
    const colorTimer = setTimeout(() => {
      // Cek apakah di dalam pesan teks pengumuman mengandung kata kunci sukses
      const isSukses = pesanPengumuman.includes('adalah seorang Dosen Killer') || pesanPengumuman.includes('aman');
      setBgColor(isSukses ? 'bg-green-950' : 'bg-red-950');
    }, 2500);

    // 3. Durasi penayangan selesai setelah 7 detik, lempar balik ke engine utama
    const closeTimer = setTimeout(() => {
      if (onSelesai) onSelesai();
    }, 7000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(colorTimer);
      clearTimeout(closeTimer);
    };
  }, [pesanPengumuman, onSelesai]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors dining-gate duration-1000 p-6 ${bgColor}`}>
      {showText && (
        <div className="text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-1000">
          <span className="text-6xl block animate-pulse">📢</span>
          <h2 className="text-xl md:text-2xl font-mono text-white tracking-wide font-bold leading-relaxed uppercase">
            {pesanPengumuman}
          </h2>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest pt-4 border-t border-slate-900">
            SISTEM OTOMATIS MEMUTAR SIKLUS KELAS...
          </p>
        </div>
      )}
    </div>
  );
}