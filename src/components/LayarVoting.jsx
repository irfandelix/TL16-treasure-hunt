import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LayarVoting({ pemain, isHidup, currentUser }) {
  const [votedNim, setVotedNim] = useState('');
  const [sudahVote, setSudahVote] = useState(false);

  const kandidatPemain = pemain.filter(p => p.is_hidup);

  const handleVote = async (targetNim) => {
    if (sudahVote || !isHidup) return;

    setVotedNim(targetNim);
    setSudahVote(true);

    await supabase
      .from('mahasiswa_roles')
      .update({ target_voting: targetNim })
      .eq('room_code', currentUser.roomCode)
      .eq('nim', currentUser.nim);
  };

  if (!isHidup) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-50">
        <p className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-1">
          Mode Penonton
        </p>
        <h2 className="text-white font-bold text-2xl">Sesi Pemungutan Suara</h2>
        <p className="text-slate-300 text-sm mt-2 max-w-sm">
          Kamu sudah terkena DO sehingga tidak memiliki hak suara pada putaran ini.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
          Sidang Kelas
        </p>
        <h2 className="text-2xl font-bold text-white mb-1">Sesi Pemungutan Suara</h2>
        <p className="text-xs text-slate-300 mb-6">
          Pilih satu peserta yang paling kamu curigai sebagai Dosen Killer.
        </p>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl max-h-[60vh] overflow-y-auto w-full text-left space-y-2.5">
          {sudahVote ? (
            <div className="bg-slate-900 p-6 rounded-xl border border-amber-400/40 text-center text-amber-300 font-mono text-sm">
              Suara kamu berhasil dicatat.
              <span className="text-xs text-slate-300 mt-2 block">
                Menunggu peserta lain selesai memilih...
              </span>
            </div>
          ) : (
            kandidatPemain.map(k => (
              <button
                key={k.nim}
                type="button"
                onClick={() => handleVote(k.nim)}
                className={`w-full min-h-[48px] font-bold py-3 px-4 rounded-xl text-sm text-left transition-colors border flex justify-between items-center ${
                  k.nim === currentUser.nim
                    ? 'bg-slate-900 border-dashed border-slate-700 text-slate-300'
                    : 'bg-slate-900 hover:bg-slate-700 text-slate-100 border-slate-700 hover:border-amber-400'
                }`}
              >
                <span>{k.nama} {k.nim === currentUser.nim && '(Kamu)'}</span>
                {k.nim !== currentUser.nim && (
                  <span className="text-xs text-amber-400 font-mono">Pilih</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
