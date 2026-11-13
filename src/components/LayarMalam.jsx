import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LayarMalam({ peranKu, isHidup, pemain, currentUser }) {
  const [targetDipilih, setTargetDipilih] = useState('');
  const [pesanAksi, setPesanAksi] = useState('');

  const daftarTarget = pemain.filter(p => p.is_hidup && p.nim !== currentUser.nim);

  const handleAksiMalam = async (targetNim, targetNama) => {
    setTargetDipilih(targetNim);

    await supabase
      .from('mahasiswa_roles')
      .update({ target_malam: targetNim })
      .eq('room_code', currentUser.roomCode)
      .eq('nim', currentUser.nim);

    if (peranKu === 'DOSEN_KILLER') {
      setPesanAksi(`Kamu memilih memberikan nilai E kepada ${targetNama}.`);
    } else if (peranKu === 'INTEL') {
      const target = pemain.find(p => p.nim === targetNim);
      setPesanAksi(`Hasil penyelidikan: Peran ${targetNama} adalah ${target?.peran || 'BIASA'}.`);
    } else if (peranKu === 'AHLI') {
      setPesanAksi(`Kamu memilih menyelamatkan nilai milik ${targetNama} malam ini.`);
    }
  };

  if (!isHidup) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-50">
        <p className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-1">
          Status Peserta
        </p>
        <h2 className="text-white font-bold text-2xl">Kamu Sudah Terkena DO</h2>
        <p className="text-slate-300 text-sm mt-2 max-w-sm">
          Kamu tetap bisa memantau jalannya permainan hingga sidang selesai.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
          Siklus Malam
        </p>
        <h2 className="text-2xl font-bold text-white mb-2">Fase Malam Hari</h2>
        <p className="text-xs text-slate-300 font-mono mb-6">
          Saatnya peran khusus mengambil tindakan secara rahasia...
        </p>

        {(peranKu === 'BIASA' || peranKu === 'UPTODATE') ? (
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
            <h3 className="text-amber-400 font-bold text-lg">
              {peranKu === 'UPTODATE' ? 'Mahasiswa Uptodate' : 'Mahasiswa Biasa'}
            </h3>
            <p className="text-slate-200 text-sm mt-2 leading-relaxed">
              {peranKu === 'UPTODATE'
                ? 'Kamu kebal terhadap ancaman nilai E pada malam hari. Tunggu hingga pagi tiba untuk berdiskusi.'
                : 'Tidak ada aksi khusus malam ini. Istirahatlah dan bersiap berdiskusi saat pagi tiba.'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl max-h-[60vh] overflow-y-auto w-full text-left">
            <p className="text-amber-400 font-bold text-xs font-mono uppercase tracking-wider mb-3">
              {peranKu === 'DOSEN_KILLER' && 'Pilih Mahasiswa yang Akan Diberi Nilai E:'}
              {peranKu === 'INTEL' && 'Pilih Mahasiswa yang Ingin Diperiksa Perannya:'}
              {peranKu === 'AHLI' && 'Pilih Mahasiswa yang Ingin Diselamatkan Nilainya:'}
            </p>

            {pesanAksi ? (
              <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/40 text-center text-emerald-300 font-mono text-sm">
                {pesanAksi}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {daftarTarget.map(t => (
                  <button
                    key={t.nim}
                    type="button"
                    onClick={() => handleAksiMalam(t.nim, t.nama)}
                    className="w-full min-h-[48px] bg-slate-900 hover:bg-slate-700 text-slate-100 font-bold py-3 px-4 rounded-xl text-sm text-left transition-colors border border-slate-700"
                  >
                    {t.nama}
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
