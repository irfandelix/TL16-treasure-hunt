// src/components/RoadmapModal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function RoadmapModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchRoadmap = async () => {
        setIsLoading(true);
        try {
          // Hanya perlu menarik tanggal dari 3 game utama
          const { data, error } = await supabase
            .from('app_settings')
            .select('monopoli_unlock_date, werewolf_unlock_date, wheel_unlock_date')
            .eq('id', 1)
            .single();

          if (error) throw error;
          
          // Helper fungsi yang sama seperti di Admin
          const getAutoSchedule = (dateStr) => {
            if (!dateStr) return { month: 'TBA', week: '-', status: 'secret' };
            const d = new Date(dateStr);
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const month = months[d.getMonth()];
            const week = `Minggu ${Math.ceil(d.getDate() / 7)}`;
            const status = new Date().getTime() >= d.getTime() ? 'released' : 'upcoming';
            return { month, week, status };
          };

          const mono = getAutoSchedule(data.monopoli_unlock_date);
          const wolf = getAutoSchedule(data.werewolf_unlock_date);
          const wheel = getAutoSchedule(data.wheel_unlock_date);

          // Rangkai array otomatis
          setScheduleData([
            { id: 1, month: 'Mei', week: 'Minggu 2', game: 'Digital Treasure Hunt', status: 'released' },
            { id: 2, month: 'Mei', week: 'Minggu 2', game: 'Tebak Muka Blur', status: 'released' },
            { id: 3, month: mono.month, week: mono.week, game: 'Monopoli TL16', status: mono.status },
            { id: 4, month: wolf.month, week: wolf.week, game: 'Dosen Killer', status: wolf.status },
            { id: 5, month: uno.month, week: uno.week, game: 'UNO Brutal', status: uno.status },
            { id: 6, month: wheel.month, week: wheel.week, game: 'Wheel of Family', status: wheel.status },
          ]);

        } catch (error) {
          console.error("Gagal load roadmap:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRoadmap();
    }
  }, [isOpen]);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-xs md:text-sm bg-slate-800 px-4 py-2 rounded-full border border-slate-600 hover:bg-slate-700 hover:border-slate-400 text-slate-300 font-bold transition-all flex items-center gap-2 shadow-lg">
        <span>📅</span> JADWAL RILIS
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 p-6 md:p-8 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">ROADMAP <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">SEDULUR 16</span></h2>
              <p className="text-sm text-slate-400 mt-1">Pantau jadwal rilis memori dan game interaktif kita di sini.</p>
            </div>
            
            <div className="overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 flex-1">
              {isLoading ? (
                <div className="p-10 text-center text-slate-500 font-mono animate-pulse">Mengambil data intel...</div>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-700 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-4 py-4 whitespace-nowrap">Bulan</th>
                      <th scope="col" className="px-4 py-4 whitespace-nowrap">Minggu</th>
                      <th scope="col" className="px-4 py-4">Nama Game</th>
                      <th scope="col" className="px-4 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {scheduleData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-4 font-bold text-white whitespace-nowrap">{item.month}</td>
                        <td className="px-4 py-4 text-slate-400 whitespace-nowrap">{item.week}</td>
                        <td className="px-4 py-4">
                          {item.status === 'secret' ? (
                            <span className="bg-slate-800 text-transparent px-2 py-1 rounded-sm select-none relative group cursor-help transition-all hover:bg-slate-950 inline-block">
                              {item.game}
                              <span className="absolute inset-0 flex items-center justify-center text-red-600 text-[10px] font-black tracking-widest opacity-0 group-hover:opacity-100 uppercase">Classified</span>
                            </span>
                          ) : (
                            <span className="font-bold text-yellow-400">{item.game}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {item.status === 'released' && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-emerald-500/20">Live</span>}
                          {item.status === 'upcoming' && <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-blue-500/20">Segera</span>}
                          {item.status === 'secret' && <span className="bg-slate-800 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-slate-700">Rahasia</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button onClick={() => setIsOpen(false)} className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-white transition-all border border-slate-600 active:scale-95">
              TUTUP JADWAL
            </button>
          </div>
        </div>
      )}
    </>
  );
}