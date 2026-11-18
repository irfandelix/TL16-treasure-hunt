import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import PlayerAvatar from './PlayerAvatar';
import { getLocalAvatarConfig } from '../lib/avatarHelper';

export default function ScoreBoard({ currentNim = '', currentAvatarConfig = null }) {
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

      let alumniRes = await supabase
        .from('alumni')
        .select('nim, nama, skor_peta, skor_muka, skor_monopoli, skor_werewolf, avatar_config');
      if (alumniRes.error) {
        alumniRes = await supabase
          .from('alumni')
          .select('nim, nama, skor_peta, skor_muka, skor_monopoli, skor_werewolf');
      }
      if (alumniRes.error) throw alumniRes.error;
      const alumniData = alumniRes.data;

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
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"
    >
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h2 id="scoreboard-heading" className="text-2xl md:text-3xl font-bold text-slate-900">
          Klasemen Sedulur 16
        </h2>
        <p className="text-slate-600 mt-1 text-sm">
          {isAdmin
            ? 'Mode Panitia: seluruh nama alumni ditampilkan untuk pemantauan skor.'
            : isRevealed
              ? 'Klasemen akhir telah dibuka! Selamat kepada para peraih skor tertinggi perayaan 1 Dekade TL 2016.'
              : 'Nama peserta masih dirahasiakan sampai puncak perayaan dibuka oleh panitia.'}
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-700 text-sm flex flex-col items-center gap-3 bg-slate-50 rounded-2xl border border-slate-200">
          <span
            aria-hidden="true"
            className="w-8 h-8 border-2 border-slate-300 border-t-emerald-700 rounded-full animate-spin"
          />
          <span>Memuat data klasemen angkatan...</span>
        </div>
      ) : errorMsg ? (
        <div
          role="alert"
          className="py-10 px-4 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-4"
        >
          <p className="text-rose-800 text-sm font-medium">{errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              loadAllData(isAdmin);
            }}
            className="min-h-[44px] px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm"
          >
            Muat Ulang Klasemen
          </button>
        </div>
      ) : alumni.length === 0 ? (
        <div className="py-10 px-4 text-center text-slate-600 text-sm bg-slate-50 rounded-2xl border border-slate-200">
          Belum ada skor permainan yang tercatat. Mainkan salah satu permainan di atas untuk mulai mengumpulkan poin!
        </div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
              <tr className="text-slate-700 font-bold text-xs sm:text-sm">
                <th scope="col" className="py-3.5 px-3 text-center w-16">No</th>
                <th scope="col" className="py-3.5 px-4">Peserta &amp; Rincian Poin</th>
                <th scope="col" className="py-3.5 px-3 text-center w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alumni.map((person, index) => {
                const totalSkor =
                  (person.skor_peta || 0) +
                  (person.skor_muka || 0) +
                  (isMonopoliUnlocked ? (person.skor_monopoli || 0) : 0) +
                  (isWerewolfUnlocked ? (person.skor_werewolf || 0) : 0);

                const displayNim = shouldReveal ? person.nim : `${person.nim.substring(0, 5)}****`;
                const displayName = shouldReveal ? person.nama : 'Teman Seangkatan (Rahasia)';
                const resolvedAvatar =
                  person.nim === currentNim && currentAvatarConfig
                    ? currentAvatarConfig
                    : person.avatar_config || (person.nim === currentNim ? getLocalAvatarConfig(person.nim) : null);

                return (
                  <tr key={person.nim} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-3 text-center align-middle font-mono font-bold text-base text-amber-600">
                      #{index + 1}
                    </td>

                    <td className="py-4 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          config={resolvedAvatar}
                          seed={person.nim}
                          className="w-10 h-10 border border-slate-200"
                          alt={displayName}
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm sm:text-base">
                            {displayName}
                          </div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">
                            NIM: {displayNim}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-lg font-medium">
                          Peta: <strong className="font-mono text-emerald-700">{person.skor_peta || 0}</strong>
                        </span>
                        <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-lg font-medium">
                          Foto: <strong className="font-mono text-emerald-700">{person.skor_muka || 0}</strong>
                        </span>

                        {isMonopoliUnlocked && (
                          <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-lg font-medium">
                            Monopoli: <strong className="font-mono text-amber-600">{person.skor_monopoli || 0}</strong>
                          </span>
                        )}

                        {isWerewolfUnlocked && (
                          <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-lg font-medium">
                            Dosen Killer: <strong className="font-mono text-amber-600">{person.skor_werewolf || 0}</strong>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center font-mono font-bold text-lg sm:text-xl text-emerald-700 align-middle">
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
