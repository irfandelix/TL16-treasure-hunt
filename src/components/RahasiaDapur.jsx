import React, { useState } from 'react';

export default function RahasiaDapur() {
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMssg, setErrorMssg] = useState('');

  const KATA_SANDI_RAHASIA = "TL16ROOT"; 

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode.toUpperCase() === KATA_SANDI_RAHASIA) {
      setIsUnlocked(true);
      setErrorMssg('');
    } else {
      setErrorMssg('Kode akses belum tepat. Khusus panitia inti TL 2016.');
      setPasscode('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-md text-center">
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            Dokumentasi Panitia
          </p>
          <h1 className="text-white font-bold text-2xl mb-2">Arsip Dapur Panitia TL 2016</h1>
          <p className="text-slate-300 text-sm mb-6">
            Masukkan kode panitia untuk membuka dokumentasi teknis perayaan 1 Dekade.
          </p>
          
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div>
              <label htmlFor="passcode-input" className="sr-only">
                Kode Panitia
              </label>
              <input 
                id="passcode-input"
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Masukkan kode panitia..."
                className="w-full min-h-[48px] bg-slate-900 border border-slate-600 text-amber-400 text-center px-4 py-3 rounded-xl focus:border-amber-400 tracking-widest uppercase font-mono font-bold placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal"
              />
            </div>
            {errorMssg && (
              <p role="alert" className="text-rose-400 text-xs font-semibold">
                {errorMssg}
              </p>
            )}
            <button 
              type="submit"
              className="min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
            >
              Buka Catatan Panitia
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-200">
      <div className="max-w-3xl mx-auto">
        
        <div className="border-b border-slate-700 pb-6 mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
              Arsip Teknis Perayaan 1 Dekade
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Catatan Dapur Panitia Sedulur 16
            </h1>
          </div>
          <button 
            type="button"
            onClick={() => setIsUnlocked(false)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-600 font-bold transition-colors"
          >
            Kunci Kembali
          </button>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          
          <section className="bg-slate-800 p-6 rounded-2xl border border-emerald-500/40">
            <p className="text-xs font-mono font-bold text-emerald-400 uppercase mb-1">
              Status Sistem: Siap Digunakan
            </p>
            <p className="text-slate-200">
              Panduan teknis internal untuk Komting dan Tim Inti Reuni 1 Dekade. Seluruh permainan interaktif dan fitur Kapsul Waktu telah terhubung langsung dengan basis data Supabase.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-amber-400 font-bold text-base mb-2">
                Modul 1: Monopoli TL16
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed mb-2">
                Seluruh peserta bergerak serentak di satu papan virtual waktu nyata dengan mekanik UKT dan kartu Jujur atau Berani.
              </p>
            </section>

            <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-emerald-400 font-bold text-base mb-2">
                Modul 2: Sidang Dosen Killer
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed mb-2">
                Pembagian peran otomatis menyesuaikan jumlah peserta di ruangan, dengan alur Malam, Pagi, Diskusi, dan Pemungutan Suara yang dipandu otomatis.
              </p>
            </section>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-amber-400 font-bold text-base mb-2">
                Modul 3: Wheel of Family
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed">
                Roda undian terhubung otomatis dengan daftar alumni yang telah mengisi Kapsul Waktu menggunakan pengacakan murni.
              </p>
            </section>

            <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-emerald-400 font-bold text-base mb-2">
                Modul 4: Kapsul Waktu
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed">
                Menyimpan foto terbaru tahun 2026 beserta pesan ulang tahun untuk angkatan yang ditampilkan saat sesi nostalgia bersama.
              </p>
            </section>
          </div>

          <section className="bg-slate-800 p-6 rounded-2xl border border-amber-400/40">
            <h2 className="text-amber-400 font-bold text-base mb-3">Panduan Pemandu Ruangan (Host)</h2>
            <p className="text-slate-200 mb-3 text-xs">
              Aplikasi menggunakan sinkronisasi langsung dari perangkat Host. Agar jalannya permainan mulus:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs">
              <li>Pastikan koneksi internet Host stabil selama acara berlangsung.</li>
              <li>Biarkan tab peramban tetap terbuka dan layar tidak masuk mode tidur.</li>
              <li>Gunakan tombol atur ulang ruangan hanya jika ingin memulai sesi baru dari awal.</li>
            </ol>
          </section>

        </div>
      </div>
    </div>
  );
}
