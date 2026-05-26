// src/components/ScoreBoard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ScoreBoard() {
  const [alumni, setAlumni] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMonopoliUnlocked, setIsMonopoliUnlocked] = useState(false); // STATE BARU

  useEffect(() => {
    const checkAdmin = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(checkAdmin);

    const loadAllData = async () => {
      try {
        // 1. Tarik Pengaturan Dulu (Cek Jadwal Monopoli)
        const { data: settings } = await supabase.from('app_settings').select('show_scoreboard, monopoli_unlock_date').eq('id', 1).single();
        
        let monopoliBuka = false;
        if (settings) {
          setIsRevealed(settings.show_scoreboard);
          if (checkAdmin) {
            monopoliBuka = true; // Admin selalu bisa lihat
          } else if (settings.monopoli_unlock_date) {
            const unlockTime = new Date(settings.monopoli_unlock_date).getTime();
            const now = new Date().getTime();
            monopoliBuka = now >= unlockTime;
          }
          setIsMonopoliUnlocked(monopoliBuka);
        }

        // 2. Tarik Data Alumni & Urutkan
        const { data: alumniData } = await supabase.from('alumni').select('*');
        if (alumniData) {
          const sorted = alumniData.sort((a, b) => {
            // Skor monopoli HANYA dihitung ke total jika jadwalnya sudah tiba
            const skorMonopoliA = monopoliBuka ? (a.skor_monopoli || 0) : 0;
            const skorMonopoliB = monopoliBuka ? (b.skor_monopoli || 0) : 0;
            
            const totalA = (a.skor_peta || 0) + (a.skor_muka || 0) + skorMonopoliA;
            const totalB = (b.skor_peta || 0) + (b.skor_muka || 0) + skorMonopoliB;
            
            if (totalB !== totalA) return totalB - totalA;
            return a.nim.localeCompare(b.nim);
          });
          setAlumni(sorted); 
        }
      } catch (error) {
        console.error("Gagal menarik data klasemen:", error.message);
      }
    };

    loadAllData();

    // Auto-Refresh setiap 5 detik
    const intervalId = setInterval(loadAllData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const shouldReveal = isAdmin || isRevealed;

  return (
    <div className="mt-16 bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
      
      {isRevealed && (
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500/20 blur-[50px] rounded-full pointer-events-none animate-pulse"></div>
      )}

      <div className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-black text-yellow-500 tracking-widest uppercase drop-shadow-md">KLASEMEN</h2>
        <p className="text-slate-400 mt-2 text-sm">
          {isAdmin 
            ? "Mode Admin: Identitas selalu terbuka di layar ini." 
            : isRevealed
              ? "SEGEL TELAH DIBUKA! 🔓 Inilah para penjelajah terbaik sedulur 16!"
              : "Identitas dirahasiakan! Siapakah penjelajah misterius di puncak klasemen? 🕵️‍♂️"}
        </p>
      </div>
      
      {/* CONTAINER TABEL SCROLLABLE: 
        max-h-[500px] membuat tabel punya batas tinggi, dan overflow-y-auto memunculkan scrollbar di dalam tabel 
      */}
      <div className="max-h-[400px] md:max-h-[500px] overflow-y-auto overflow-x-auto relative z-10 rounded-xl border border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        <table className="w-full text-left relative">
          {/* HEADER STICKY: Tetap nempel di atas saat tabel di-scroll */}
          <thead className="sticky top-0 bg-slate-900 z-20 shadow-md">
            <tr className="border-b border-slate-700 text-slate-400 font-bold text-sm">
              <th className="py-4 px-2 text-center w-16">Rank</th>
              <th className="py-4 px-4">NIM / Identitas</th>
              <th className="py-4 px-2 text-center w-28">Total Skor</th>
            </tr>
          </thead>
          
          <tbody>
            {alumni.map((person, index) => {
              // Total skor disesuaikan agar Monopoli ikut hilang jika belum waktunya
              const totalSkor = (person.skor_peta || 0) + (person.skor_muka || 0) + (isMonopoliUnlocked ? (person.skor_monopoli || 0) : 0);
              
              const displayNim = shouldReveal ? person.nim : `${person.nim.substring(0, 5)}****`;
              const displayName = shouldReveal ? person.nama : "PENJELAJAH RAHASIA";

              return (
                <tr key={person.nim} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                  <td className="py-4 px-2 text-center text-xl align-middle">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-slate-500 text-base">{index + 1}</span>}
                  </td>
                  
                  <td className="py-4 px-4 align-middle">
                    <div className="font-bold text-yellow-500 tracking-wider transition-all duration-500">{displayNim}</div>
                    <div className={`text-xs mt-1 transition-all duration-500 ${shouldReveal ? 'text-green-400 font-bold' : 'text-slate-500 font-mono italic tracking-widest'}`}>
                      {displayName}
                    </div>
                    
                    {/* --- BADGE RINCIAN SKOR --- */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-slate-900/80 border border-slate-700 text-blue-400 text-[10px] px-2 py-1 rounded-md font-bold shadow-inner">
                        🗺️ PETA: {person.skor_peta || 0}
                      </span>
                      <span className="bg-slate-900/80 border border-slate-700 text-pink-400 text-[10px] px-2 py-1 rounded-md font-bold shadow-inner">
                        👤 MUKA: {person.skor_muka || 0}
                      </span>
                      
                      {/* BADGE MONOPOLI HANYA MUNCUL JIKA SUDAH UNLOCKED */}
                      {isMonopoliUnlocked && (
                        <span className="bg-slate-900/80 border border-slate-700 text-purple-400 text-[10px] px-2 py-1 rounded-md font-bold shadow-inner">
                          🎲 MONOPOLI: {person.skor_monopoli || 0}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-2 text-center font-black text-xl text-white drop-shadow-md align-middle">
                    {totalSkor}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Jika belum ada data sama sekali */}
        {alumni.length === 0 && (
          <div className="py-10 text-center text-slate-500 font-mono text-sm">
            Belum ada skor yang tercatat.
          </div>
        )}
      </div>

      {/* Indikator scroll biar user tahu tabelnya bisa digeser ke bawah */}
      {alumni.length > 5 && (
        <div className="text-center mt-3 animate-bounce opacity-50">
          <span className="text-xs text-slate-400 font-mono">👇 Scroll untuk melihat lebih banyak 👇</span>
        </div>
      )}

    </div>
  );
}