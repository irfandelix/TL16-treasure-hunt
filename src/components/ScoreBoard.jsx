// src/components/ScoreBoard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ScoreBoard() {
  const [alumni, setAlumni] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Cek apakah yang lagi buka web ini ADMIN atau BUKAN
    const checkAdmin = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(checkAdmin);

    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('alumni').select('*');
    if (data) {
      const sorted = data.sort((a, b) => {
        const totalA = (a.skor_peta || 0) + (a.skor_muka || 0);
        const totalB = (b.skor_peta || 0) + (b.skor_muka || 0);
        if (totalB !== totalA) return totalB - totalA;
        return a.nim.localeCompare(b.nim);
      });
      setAlumni(sorted.slice(0, 10)); // Menampilkan Top 10 Saja
    }
  };

  return (
    <div className="mt-16 bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-yellow-500 tracking-widest uppercase drop-shadow-md">KLASEMEN</h2>
        <p className="text-slate-400 mt-2 text-sm">
          {isAdmin 
            ? "Mode Admin: Identitas telah dibuka! Inilah para penjelajah terbaik kita." 
            : "Identitas dirahasiakan! Siapakah penjelajah misterius di puncak klasemen?"}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 font-bold text-sm">
              <th className="py-4 px-2 text-center">Rank</th>
              <th className="py-4 px-4">NIM / Identitas</th>
              <th className="py-4 px-2 text-center">Total Skor</th>
            </tr>
          </thead>
          <tbody>
            {alumni.map((person, index) => {
              const totalSkor = (person.skor_peta || 0) + (person.skor_muka || 0);
              
              // ==========================================
              // 🛡️ LOGIKA MASKING (RAHASIAKAN IDENTITAS)
              // ==========================================
              // Kalau Admin: Muncul NIM dan Nama asli
              // Kalau BUKAN Admin: NIM dibintangin, Nama jadi Agen Rahasia
              const displayNim = isAdmin ? person.nim : `${person.nim.substring(0, 5)}****`;
              const displayName = isAdmin ? person.nama : "PENJELAJAH RAHASIA";

              return (
                <tr key={person.nim} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-2 text-center text-xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-slate-500 text-base">{index + 1}</span>}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-yellow-500 tracking-wider">{displayNim}</div>
                    <div className={`text-xs mt-1 ${isAdmin ? 'text-green-400 font-bold' : 'text-slate-500 font-mono italic tracking-widest'}`}>
                      {displayName}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center font-black text-xl text-white drop-shadow-md">
                    {totalSkor}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}