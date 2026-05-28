import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LayarMalam({ peranKu, isHidup, pemain, currentUser }) {
  const [targetDipilih, setTargetDipilih] = useState('');
  const [pesanAksi, setPesanAksi] = useState('');

  // Filter hanya mahasiswa yang masih hidup untuk dijadikan target
  const daftarTarget = pemain.filter(p => p.is_hidup && p.nim !== currentUser.nim);

  const handleAksiMalam = async (targetNim, targetNama) => {
    setTargetDipilih(targetNim);

    // Simpan target malam ini ke database mahasiswa_roles milikmu
    await supabase
      .from('mahasiswa_roles')
      .update({ target_malam: targetNim })
      .eq('room_code', currentUser.roomCode) // <-- Tambahan penyaring room
      .eq('nim', currentUser.nim);

    // Tampilkan notifikasi teks sesuai peran
    if (peranKu === 'DOSEN_KILLER') {
      setPesanAksi(`Kamu sepakat memberikan nilai E kepada ${targetNama}.`);
    } else if (peranKu === 'INTEL') {
      // Intel bisa langsung melihat peran target di layar saat itu juga
      const target = pemain.find(p => p.nim === targetNim);
      setPesanAksi(`Hasil investigasi: ${targetNama} adalah ${target?.peran || 'BIASA'}`);
    } else if (peranKu === 'AHLI') {
      setPesanAksi(`Kamu memberikan bocoran kunci jawaban kepada ${targetNama}.`);
    }
  };

  if (!isHidup) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-50">
        <span className="text-6xl mb-4">👻</span>
        <h2 className="text-red-500 font-bold text-xl uppercase tracking-wider">Kamu Sudah Di-DO</h2>
        <p className="text-slate-500 text-sm mt-2 font-mono">Arwahmu hanya bisa memantau jalannya kelas dari balik layar.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-50 select-none">
      <div className="max-w-md w-full text-center">
        <span className="text-5xl animate-pulse block mb-4">🌙</span>
        <h2 className="text-xl font-bold text-slate-400 tracking-widest uppercase mb-2">Fase Malam Hari</h2>
        <p className="text-xs text-slate-600 font-mono mb-8">Ssst... Dosen sedang memeriksa draf revisi laporan...</p>

        {/* JIKA MAHASISWA BIASA */}
        {peranKu === 'BIASA' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <span className="text-4xl block mb-3">🥱</span>
            <h3 className="text-white font-bold text-base uppercase">Mahasiswa Biasa</h3>
            <p className="text-slate-400 text-xs mt-2 font-mono leading-relaxed">
              Tidak ada aksi malam untukmu. Tidurlah yang nyenyak, berdoa agar besok pagi nilaimu tidak berubah menjadi E.
            </p>
          </div>
        )}

        {/* JIKA PERAN AKSI KHUSUS */}
        {peranKu !== 'BIASA' && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl max-h-[60vh] overflow-y-auto w-full text-left">
            <p className="text-yellow-500 font-bold text-xs uppercase tracking-wider mb-3 px-2">
              {peranKu === 'DOSEN_KILLER' && '🎯 Pilih Mahasiswa yang Ingin Di-DO:'}
              {peranKu === 'INTEL' && '🔍 Pilih Mahasiswa yang Ingin Diintip Perannya:'}
              {peranKu === 'AHLI' && '🛡️ Pilih Mahasiswa yang Ingin Diselamatkan Nilainya:'}
            </p>

            {pesanAksi ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-green-400 font-mono text-xs">
                {pesanAksi}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {daftarTarget.map(t => (
                  <button
                    key={t.nim}
                    onClick={() => handleAksiMalam(t.nim, t.nama)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 px-4 rounded-xl text-sm text-left transition-colors border border-slate-700 active:scale-98"
                  >
                    👤 {t.nama}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}