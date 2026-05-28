import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LayarVoting({ pemain, isHidup, currentUser }) {
  const [votedNim, setVotedNim] = useState('');
  const [sudahVote, setSudahVote] = useState(false);

  // Ambil daftar kandidat (semua mahasiswa yang masih hidup)
  const kandidatPemain = pemain.filter(p => p.is_hidup);

  const handleVote = async (targetNim, targetNama) => {
    if (sudahVote || !isHidup) return;

    setVotedNim(targetNim);
    setSudahVote(true);

    // Simpan hasil voting ke kolom target_voting di database
    await supabase
      .from('mahasiswa_roles')
      .update({ target_voting: targetNim })
      .eq('room_code', currentUser.roomCode) // <-- Tambahan penyaring room
      .eq('nim', currentUser.nim);
  };

  if (!isHidup) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-50">
        <span className="text-6xl mb-4">👻</span>
        <h2 className="text-red-500 font-bold text-xl uppercase tracking-wider">Masa Sidang Voting</h2>
        <p className="text-slate-500 text-sm mt-2 font-mono">Kamu sudah di-DO, tidak memiliki hak suara dalam pemungutan suara.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-50 select-none">
      <div className="max-w-md w-full text-center">
        <span className="text-5xl animate-bounce block mb-4">🗳️</span>
        <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-1">Sesi Pemungutan Suara</h2>
        <p className="text-xs text-yellow-500 font-mono mb-8">Pilih satu orang yang paling kamu curigai sebagai Dosen Killer!</p>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl max-h-[60vh] overflow-y-auto w-full text-left space-y-2">
          {sudahVote ? (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-yellow-400 font-mono text-sm">
              Kamu telah memberikan suara. <br />
              <span className="text-xs text-slate-500 mt-2 block">Menunggu mahasiswa lain selesai memilih...</span>
            </div>
          ) : (
            kandidatPemain.map(k => (
              <button
                key={k.nim}
                onClick={() => handleVote(k.nim, k.nama)}
                className={`w-full font-bold py-3 px-4 rounded-xl text-sm text-left transition-all border flex justify-between items-center ${
                  k.nim === currentUser.nim
                    ? 'bg-slate-950 border-dashed border-slate-800 text-slate-500 hover:bg-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-98'
                }`}
              >
                <span>👤 {k.nama} {k.nim === currentUser.nim && '(Kamu)'}</span>
                {k.nim !== currentUser.nim && <span className="text-xs text-slate-500 font-mono">Pilih &rarr;</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}