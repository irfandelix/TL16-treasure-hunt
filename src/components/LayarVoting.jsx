import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LayarVoting({ pemain, isHidup, currentUser }) {
  const [votedNim, setVotedNim] = useState('');
  const [sudahVote, setSudahVote] = useState(false);

  const kandidatPemain = pemain.filter(p => p.is_hidup);

  const handleVote = async (targetNim) => {
    if (sudahVote || !isHidup || targetNim === currentUser.nim) return;

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
      <div className="fixed inset-0 bg-[#FAF6EE] flex flex-col items-center justify-center p-6 text-center z-50">
        <h2 className="text-stone-900 font-bold text-2xl">Sesi Pemungutan Suara</h2>
        <p className="text-stone-600 text-sm mt-2 max-w-sm">
          Kamu sudah terkena DO sehingga tidak memiliki hak suara pada putaran ini.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#FAF6EE] flex flex-col items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Sesi Pemungutan Suara</h2>
        <p className="text-xs text-stone-600 mb-6">
          Pilih satu peserta yang paling kamu curigai sebagai Dosen Killer.
        </p>

        <div className="bg-white border border-[#DED6C6] p-4 rounded-2xl max-h-[60vh] overflow-y-auto w-full text-left space-y-2.5">
          {sudahVote ? (
            <div className="bg-[#FAF6EE] p-6 rounded-xl border border-[#DED6C6] text-center text-green-900 font-mono text-sm">
              Suara kamu berhasil dicatat.
              <span className="text-xs text-stone-600 mt-2 block">
                Menunggu peserta lain selesai memilih...
              </span>
            </div>
          ) : (
            kandidatPemain.map(k => (
              <button
                key={k.nim}
                type="button"
                disabled={k.nim === currentUser.nim}
                onClick={() => handleVote(k.nim)}
                className={`w-full min-h-[48px] font-bold py-3 px-4 rounded-xl text-sm text-left transition-colors border flex justify-between items-center ${
                  k.nim === currentUser.nim
                    ? 'bg-[#FAF6EE] border-dashed border-[#C7BDA8] text-stone-500 cursor-not-allowed'
                    : 'bg-[#FAF6EE] hover:bg-[#F3EDE0] text-stone-900 border-[#DED6C6] hover:border-green-800'
                }`}
              >
                <span>{k.nama} {k.nim === currentUser.nim && '(Kamu)'}</span>
                {k.nim !== currentUser.nim && (
                  <span className="text-xs text-green-900 font-mono font-bold">Pilih</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
