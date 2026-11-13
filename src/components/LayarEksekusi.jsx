import React, { useState, useEffect } from 'react';

export default function LayarEksekusi({ pesanPengumuman, pemain, onSelesai }) {
  const [bgColor, setBgColor] = useState('bg-slate-950');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 400);

    const colorTimer = setTimeout(() => {
      const isSukses = pesanPengumuman.includes('adalah seorang Dosen Killer') || pesanPengumuman.includes('damai') || pesanPengumuman.includes('diselamatkan');
      setBgColor(isSukses ? 'bg-emerald-950' : 'bg-rose-950');
    }, 2200);

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
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-700 p-6 ${bgColor}`}>
      {showText && (
        <div className="text-center max-w-md mx-auto space-y-4 bg-slate-900/90 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-xl">
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Pengumuman Kelas
          </p>
          <h2 className="text-lg md:text-2xl font-bold text-white leading-relaxed">
            {pesanPengumuman}
          </h2>
          <p className="text-xs text-slate-300 font-mono pt-4 border-t border-slate-800">
            Melanjutkan ke sesi berikutnya secara otomatis...
          </p>
        </div>
      )}
    </div>
  );
}
