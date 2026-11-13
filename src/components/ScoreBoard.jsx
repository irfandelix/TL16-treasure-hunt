import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ScoreBoard() {
  const [alumni, setAlumni] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMonopoliUnlocked, setIsMonopoliUnlocked] = useState(false);
  const [isWerewolfUnlocked, setIsWerewolfUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAllData = useCallback(async (checkAdmin) => {
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('app_settings')
        .select('show_scoreboard, monopoli_unlock_date, werewolf_unlock_date')
        .eq('id', 1)
        .single();

      if (settingsError) throw settingsError;

      let monopoliBuka = false;
      let werewolfBuka = false;

      if (settings) {
        setIsRevealed(Boolean(settings.show_scoreboard));
        const now = Date.now();

        if (checkAdmin) {
          monopoliBuka = true;
          werewolfBuka = true;
        } else {
          if (settings.monopoli_unlock_date) {
            monopoliBuka = now >= new Date(settings.monopoli_unlock_date).getTime();
          }
          if (settings.werewolf_unlock_date) {
            werewolfBuka = now >= new Date(settings.werewolf_unlock_date).getTime();
          }
        }
        setIsMonopoliUnlocked(monopoliBuka);
        setIsWerewolfUnlocked(werewolfBuka);
      }

      const { data: alumniData, error: alumniError } = await supabase.from('alumni').select('*');
      if (alumniError) throw alumniError;

      if (alumniData) {
        const sorted = [...alumniData].sort((a, b) => {
          const skorMonopoliA = monopoliBuka ? (a.skor_monopoli || 0) : 0;
          const skorMonopoliB = monopoliBuka ? (b.skor_monopoli || 0) : 0;
          const skorWerewolfA = werewolfBuka ? (a.skor_werewolf || 0) : 0;
          const skorWerewolfB = werewolfBuka ? (b.skor_werewolf || 0) : 0;

          const totalA = (a.skor_peta || 0) + (a.skor_muka || 0) + skorMonopoliA + skorWerewolfA;
          const totalB = (b.skor_peta || 0) + (b.skor_muka || 0) + skorMonopoliB + skorWerewolfB;

          if (totalB !== totalA) return totalB - totalA;
          return a.nim.localeCompare(b.nim);
        });
        setAlumni(sorted);
      }
      setErrorMsg('');
    } catch (error) {
      console.error('Gagal menarik data klasemen:', error.message);
      setErrorMsg('Gagal memuat papan klasemen. Periksa koneksi internetmu lalu muat ulang.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAdmin = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(checkAdmin);
    loadAllData(checkAdmin);

    const intervalId = setInterval(() => loadAllData(checkAdmin), 10000);
    return () => clearInterval(intervalId);
  }, [loadAllData]);

  const shouldReveal = isAdmin || isRevealed;

  return (
    <section
      aria-labelledby="scoreboard-heading"
      className="mt-12 bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-md relative"
    >
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2">
          Papan Peringkat 1 Dekade
        </span>
        <h2 id="scoreboard-heading" className="text-2xl md:text-3xl font-bold text-slate-50">
          Klasemen Sedulur 16
        </h2>
        <p className="text-slate-300 mt-1 text-sm">
          {isAdmin
            ? 'Mode Panitia: seluruh nama alumni ditampilkan untuk pemantauan skor.'
            : isRevealed
              ? 'Klasemen akhir telah dibuka! Selamat kepada para peraih skor tertinggi perayaan 1 Dekade TL 2016.'
              : 'Nama peserta masih dirahasiakan sampai puncak perayaan dibuka oleh panitia.'}
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-200 text-sm flex flex-col items-center gap-3 bg-slate-900 rounded-xl border border-slate-700">
          <span
            aria-hidden="true"
            className="w-8 h-8 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin"
          />
          <span>Memuat data klasemen angkatan...</span>
        </div>
      ) : errorMsg ? (
        <div
          role="alert"
          className="py-10 px-4 text-center bg-rose-950/60 border border-rose-400 rounded-xl space-y-4"
        >
          <p className="text-rose-200 text-sm font-medium">{errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              loadAllData(isAdmin);
            }}
            className="min-h-[44px] px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm"
          >
            Muat Ulang Klasemen
          </button>
        </div>
      ) : alumni.length === 0 ? (
        <div className="py-10 px-4 text-center text-slate-300 text-sm bg-slate-900 rounded-xl border border-slate-700">
          Belum ada skor permainan yang tercatat. Mainkan salah satu permainan di atas untuk mulai mengumpulkan poin!
        </div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-700 bg-slate-900">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-700">
              <tr className="text-slate-200 font-bold text-xs sm:text-sm">
                <th scope="col" className="py-3.5 px-3 text-center w-16">Peringkat</th>
                <th scope="col" className="py-3.5 px-4">Peserta & Rincian Poin</th>
                <th scope="col" className="py-3.5 px-3 text-center w-28">Total Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {alumni.map((person, index) => {
                const totalSkor =
                  (person.skor_peta || 0) +
                  (person.skor_muka || 0) +
                  (isMonopoliUnlocked ? (person.skor_monopoli || 0) : 0) +
                  (isWerewolfUnlocked ? (person.skor_werewolf || 0) : 0);

                const displayNim = shouldReveal ? person.nim : `${person.nim.substring(0, 5)}****`;
                const displayName = shouldReveal ? person.nama : 'Teman Seangkatan (Rahasia)';

                return (
                  <tr key={person.nim} className="hover:bg-slate-800/70 transition-colors">
                    <td className="py-4 px-3 text-center align-middle font-mono font-bold text-base text-amber-300">
                      #{index + 1}
                    </td>

                    <td className="py-4 px-4 align-middle">
                      <div className="font-bold text-slate-50 text-sm sm:text-base">
                        {displayName}
                      </div>
                      <div className="text-xs font-mono text-slate-300 mt-0.5">
                        NIM: {displayNim}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <span className="bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-md font-medium">
                          Peta: <strong className="font-mono text-emerald-300">{person.skor_peta || 0}</strong>
                        </span>
                        <span className="bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-md font-medium">
                          Foto: <strong className="font-mono text-emerald-300">{person.skor_muka || 0}</strong>
                        </span>

                        {isMonopoliUnlocked && (
                          <span className="bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-md font-medium">
                            Monopoli: <strong className="font-mono text-amber-300">{person.skor_monopoli || 0}</strong>
                          </span>
                        )}

                        {isWerewolfUnlocked && (
                          <span className="bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-md font-medium">
                            Dosen Killer: <strong className="font-mono text-amber-300">{person.skor_werewolf || 0}</strong>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center font-mono font-bold text-lg sm:text-xl text-amber-300 align-middle">
                      {totalSkor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
