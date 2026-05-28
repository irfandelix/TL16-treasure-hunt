import React, { useState } from 'react';

export default function RahasiaDapur() {
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMssg, setErrorMssg] = useState('');

  // GANTI PASSWORD INI SESUAI KESEPAKATAN DENGAN KOMTING
  const KATA_SANDI_RAHASIA = "TL16ROOT"; 

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode.toUpperCase() === KATA_SANDI_RAHASIA) {
      setIsUnlocked(true);
      setErrorMssg('');
    } else {
      setErrorMssg('Akses Ditolak. Anda bukan Admin.');
      setPasscode('');
    }
  };

  // TAMPILAN JIKA BELUM MEMASUKKAN PASSWORD
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl text-center">
          <span className="text-5xl block mb-6 animate-pulse">🔒</span>
          <h1 className="text-red-500 font-bold text-xl tracking-widest mb-2">RESTRICTED AREA</h1>
          <p className="text-slate-500 text-xs mb-8">Masukkan kode otorisasi untuk mengakses Dev's Note.</p>
          
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Passcode..."
              className="bg-black border border-slate-700 text-green-500 text-center px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 tracking-widest uppercase font-bold"
            />
            {errorMssg && <p className="text-red-500 text-[10px] animate-bounce">{errorMssg}</p>}
            <button 
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors text-sm"
            >
              DECRYPT DATA
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TAMPILAN DEV'S NOTE SETELAH UNLOCK
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-mono text-slate-300 selection:bg-green-900 selection:text-green-400">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER */}
        <div className="border-b border-slate-800 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-green-500 mb-2 tracking-widest uppercase">
              🛠️ DEV'S NOTE
            </h1>
            <p className="text-xs text-slate-500">SYSTEM ARCHITECTURE & PATCH NOTES</p>
          </div>
          <button 
            onClick={() => setIsUnlocked(false)}
            className="text-[10px] bg-red-950/30 text-red-500 px-3 py-1 rounded border border-red-900/50 hover:bg-red-900 hover:text-white transition-colors"
          >
            LOCK SYSTEM
          </button>
        </div>

        {/* ISI KONTEN */}
        <div className="space-y-8 text-sm leading-relaxed">
          
          {/* INTRO */}
          <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 border-l-4 border-l-green-500">
            <p>
              <strong className="text-white">Status:</strong> <span className="text-green-400 animate-pulse">🟢 100% ONLINE & READY TO DEPLOY</span>
            </p>
            <p className="mt-4">
              Laporan teknis internal untuk Komting / Tim Inti. Seluruh ekosistem modul interaktif (Mini-Games & Fitur Memori) telah terintegrasi dengan database Supabase secara realtime.
            </p>
          </section>

          {/* MODUL 1 & 2 */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
              <h2 className="text-yellow-500 font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🎲</span> MODUL 1: MONOPOLI TL16
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-2 text-slate-400 text-xs">
                <li><strong className="text-slate-200">Papan Custom:</strong> Bergerak virtual serentak di satu papan realtime.</li>
                <li><strong className="text-slate-200">Mekanik UKT & ToD:</strong> Fitur Truth or Dare aktif. Database siap menampung log aktivitas.</li>
              </ul>
            </section>

            <section className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
              <h2 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🧛‍♂️</span> MODUL 2: DOSEN KILLER
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-2 text-slate-400 text-xs">
                <li><strong className="text-slate-200">Auto-Balancing:</strong> Rasio otomatis 1 Dosen : 1 Intel : 1 Ahli per 10 pemain.</li>
                <li><strong className="text-slate-200">Bot Moderator:</strong> Siklus Malam &rarr; Pagi &rarr; Diskusi &rarr; Voting dieksekusi client-side (Interval JS).</li>
              </ul>
            </section>
          </div>

          {/* MODUL 3 & 4 */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
              <h2 className="text-blue-500 font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🎡</span> MODUL 3: WHEEL OF FAMILY
              </h2>
              <p className="text-slate-400 text-xs">
                Sistem Gacha/Roulette tersinkronisasi. Algoritma <code className="bg-slate-950 px-1 text-blue-400">Math.random()</code> murni tanpa intervensi data.
              </p>
            </section>

            <section className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
              <h2 className="text-purple-500 font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">⏳</span> MODUL 4: KAPSUL WAKTU
              </h2>
              <p className="text-slate-400 text-xs">
                Skema penyimpanan Blob/Text terkunci di database. Trigger buka otomatis berdasarkan <code className="bg-slate-950 px-1 text-purple-400">timestamp</code> hari H.
              </p>
            </section>
          </div>

          {/* WARNING SECTION */}
          <section className="bg-red-950/20 p-6 rounded-xl border border-red-900/50 mt-8">
            <h2 className="text-red-500 font-bold mb-4">⚠️ PROTOKOL ADMIN / HOST ROOM</h2>
            <p className="text-slate-300 mb-3 text-xs">Arsitektur aplikasi menggunakan skema <em>Serverless Client-Hosted</em>. Perangkat Admin bertindak sebagai mesin.</p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 text-xs">
              <li>Koneksi Host wajib memiliki latensi rendah.</li>
              <li>Dilarang menutup tab, me-refresh, atau <em>sleep</em> layar.</li>
              <li>Gunakan tombol <strong className="text-white">RESET ROOM</strong> hanya saat <em>desync / fatal error</em>.</li>
            </ol>
          </section>

        </div>
      </div>
    </div>
  );
}