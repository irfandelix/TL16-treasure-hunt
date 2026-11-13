import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function RoadmapModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRoadmap = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date, wheel_unlock_date')
        .eq('id', 1)
        .single();

      if (error) throw error;

      const getAutoSchedule = (dateStr) => {
        if (!dateStr) return { month: 'Segera', week: 'Menunggu Hari H', status: 'secret' };
        const d = new Date(dateStr);
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const month = months[d.getMonth()];
        const week = `Minggu ke-${Math.ceil(d.getDate() / 7)}`;
        const status = Date.now() >= d.getTime() ? 'released' : 'upcoming';
        return { month, week, status };
      };

      const mono = getAutoSchedule(data?.monopoli_unlock_date);
      const wolf = getAutoSchedule(data?.werewolf_unlock_date);
      const uno = getAutoSchedule(data?.uno_unlock_date);
      const wheel = getAutoSchedule(data?.wheel_unlock_date);

      setScheduleData([
        { id: 1, month: 'Mei', week: 'Minggu ke-2', game: 'Digital Treasure Hunt', status: 'released' },
        { id: 2, month: 'Mei', week: 'Minggu ke-2', game: 'Tebak Muka Blur', status: 'released' },
        { id: 3, month: mono.month, week: mono.week, game: 'Monopoli TL16', status: mono.status },
        { id: 4, month: wolf.month, week: wolf.week, game: 'Dosen Killer', status: wolf.status },
        { id: 5, month: uno.month, week: uno.week, game: 'UNO Seru TL16', status: uno.status },
        { id: 6, month: wheel.month, week: wheel.week, game: 'Wheel of Family (Puncak Acara)', status: wheel.status },
      ]);
    } catch (error) {
      console.error('Gagal memuat jadwal acara:', error);
      setErrorMsg('Gagal memuat jadwal perayaan dari server. Periksa koneksi internetmu lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoadmap();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-[44px] text-sm bg-slate-800 px-4 py-2.5 rounded-xl border border-amber-400/50 hover:bg-slate-700 hover:border-amber-400 text-amber-300 font-bold transition-colors flex items-center gap-2"
      >
        <span aria-hidden="true">🎂</span>
        <span>Jadwal Acara</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
        >
          <div className="bg-slate-800 p-6 md:p-8 rounded-2xl w-full max-w-2xl border-2 border-amber-400/40 shadow-lg relative flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 id="roadmap-modal-title" className="text-2xl font-bold text-amber-300">
                  Rangkaian Perayaan 1 Dekade Sedulur 16
                </h2>
                <p className="text-sm text-slate-200 mt-1">
                  Jadwal pembukaan kado permainan dan puncak reuni angkatan 2016.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup dialog jadwal acara"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900 border border-slate-600 text-slate-200 hover:bg-slate-700 font-bold text-lg flex items-center justify-center"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 flex-1">
              {isLoading ? (
                <div className="p-10 text-center text-slate-200 text-sm flex flex-col items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="w-7 h-7 border-2 border-slate-500 border-t-amber-400 rounded-full animate-spin"
                  />
                  <span>Memuat jadwal perayaan ulang tahun...</span>
                </div>
              ) : errorMsg ? (
                <div role="alert" className="p-8 text-center space-y-4">
                  <p className="text-rose-300 text-sm font-medium">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={fetchRoadmap}
                    className="min-h-[44px] px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm"
                  >
                    Coba Muat Ulang
                  </button>
                </div>
              ) : scheduleData.length === 0 ? (
                <div className="p-8 text-center text-slate-300 text-sm">
                  Belum ada jadwal permainan yang terdaftar.
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950 text-xs font-bold text-slate-300 border-b border-slate-700 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Agenda Permainan</th>
                      <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Bulan</th>
                      <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Pekan</th>
                      <th scope="col" className="px-4 py-3.5 text-center">Status Kado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {scheduleData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold">
                          {item.status === 'secret' ? (
                            <span className="text-slate-300">
                              Kado Kejutan ({item.game})
                            </span>
                          ) : (
                            <span className="text-amber-300">{item.game}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-200 whitespace-nowrap">{item.month}</td>
                        <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{item.week}</td>
                        <td className="px-4 py-3.5 text-center">
                          {item.status === 'released' && (
                            <span className="inline-block bg-emerald-950 text-emerald-300 text-xs font-bold px-3 py-1 rounded-md border border-emerald-500/50">
                              Sudah Dibuka
                            </span>
                          )}
                          {item.status === 'upcoming' && (
                            <span className="inline-block bg-amber-950 text-amber-300 text-xs font-bold px-3 py-1 rounded-md border border-amber-400/50">
                              Segera Hadir
                            </span>
                          )}
                          {item.status === 'secret' && (
                            <span className="inline-block bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-md border border-slate-600">
                              Masih Dibungkus
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full min-h-[48px] py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl text-sm font-bold text-slate-950 transition-colors"
            >
              Tutup Jadwal Acara
            </button>
          </div>
        </div>
      )}
    </>
  );
}
