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
      <div className="fixed inset-0 bg-[#FAF6EE] flex flex-col items-center justify-center p-6 text-center z-50">
        <h2 className="text-stone-900 font-bold text-2xl">Kamu Sudah Terkena DO</h2>
        <p className="text-stone-600 text-sm mt-2 max-w-sm">
          Kamu tetap bisa memantau jalannya permainan hingga sidang selesai.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#FAF6EE] flex flex-col items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Fase Malam Hari</h2>
        <p className="text-xs text-stone-600 font-mono mb-6">
          Saatnya peran khusus mengambil tindakan secara rahasia...
        </p>

        {(peranKu === 'BIASA' || peranKu === 'UPTODATE' || peranKu === 'INTEL') ? (
          <div className="bg-white border border-[#DED6C6] p-6 rounded-2xl">
            <h3 className="text-green-900 font-bold text-lg">
              {peranKu === 'UPTODATE'
                ? 'Mahasiswa Uptodate'
                : peranKu === 'INTEL'
                ? 'Mahasiswa Intel'
                : 'Mahasiswa Biasa'}
            </h3>
            <p className="text-stone-700 text-sm mt-2 leading-relaxed">
              {peranKu === 'UPTODATE'
                ? 'Kamu kebal terhadap ancaman nilai E pada malam pertama. Tunggu hingga pagi tiba untuk berdiskusi.'
                : peranKu === 'INTEL'
                ? 'Kamu sedang mengamati gerak-gerik mencurigakan malam ini. Saat pagi dan sesi diskusi tiba, kamu akan menerima petunjuk 3 nama kandidat yang memuat 1 Dosen Killer.'
                : 'Tidak ada aksi khusus malam ini. Istirahatlah dan bersiap berdiskusi saat pagi tiba.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#DED6C6] p-5 rounded-2xl max-h-[60vh] overflow-y-auto w-full text-left">
            <p className="text-green-900 font-bold text-xs uppercase tracking-wide mb-3">
              {peranKu === 'DOSEN_KILLER' && 'Pilih Mahasiswa yang Akan Diberi Nilai E:'}
              {peranKu === 'AHLI' && 'Pilih Mahasiswa yang Ingin Diselamatkan Nilainya:'}
            </p>

            {pesanAksi ? (
              <div className="bg-green-50 p-4 rounded-xl border border-green-300 text-center text-green-900 font-mono text-sm">
                {pesanAksi}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {daftarTarget.map(t => (
                  <button
                    key={t.nim}
                    type="button"
                    onClick={() => handleAksiMalam(t.nim, t.nama)}
                    className="w-full min-h-[48px] bg-[#FAF6EE] hover:bg-[#F3EDE0] text-stone-900 font-bold py-3 px-4 rounded-xl text-sm text-left transition-colors border border-[#DED6C6]"
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
