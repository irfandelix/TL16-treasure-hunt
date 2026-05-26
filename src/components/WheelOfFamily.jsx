import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';

export default function WheelOfFamily() {
  const [peserta, setPeserta] = useState([]);
  const [dataWheel, setDataWheel] = useState([]);
  
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [pemenang, setPemenang] = useState(null);

  // 1. TARIK DATA DARI SUPABASE (Hanya yang sudah isi Kapsul Waktu)
  useEffect(() => {
    const fetchPeserta = async () => {
      try {
        const { data, error } = await supabase
          .from('alumni')
          .select('nim, nama, foto_tebak, foto_now, pesan_anniv')
          .not('foto_now', 'is', null); // Tarik yang foto_now nya gak kosong

        if (error) throw error;

        if (data && data.length > 0) {
          setPeserta(data);
          
          // Format data untuk library react-custom-roulette
          const formatWheel = data.map((item) => ({
            option: item.nama.substring(0, 15) + (item.nama.length > 15 ? '...' : '') // Potong nama biar gak kepanjangan di roda
          }));
          setDataWheel(formatWheel);
        }
      } catch (error) {
        console.error("Gagal tarik data peserta:", error.message);
      }
    };

    fetchPeserta();
  }, []);

  // 2. LOGIKA KLIK TOMBOL SPIN
  const handleSpinClick = () => {
    if (!mustSpin && dataWheel.length > 0) {
      // Pilih pemenang secara acak
      const newPrizeNumber = Math.floor(Math.random() * dataWheel.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setShowResult(false);
    }
  };

  // 3. LOGIKA SAAT RODA BERHENTI BERPUTAR
  const handleStopSpinning = () => {
    setMustSpin(false);
    setPemenang(peserta[prizeNumber]);
    setShowResult(true);

    // Tembak Konfeti Pas Roda Berhenti
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#EAB308', '#22C55E', '#3B82F6'] // Kuning, Hijau, Biru
    });
  };

  return (
    <div className="flex flex-col items-center w-full text-white font-sans pb-20">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Dekorasi Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-widest drop-shadow-lg mb-2">
            WHEEL OF FAMILY
          </h2>
          <p className="text-slate-400 font-mono tracking-widest">WAKTUNYA BERNOLSTALGIA SEDULUR 16</p>
        </div>

        {/* AREA MESIN PUTAR */}
        <div className="flex flex-col items-center justify-center relative z-10">
          {dataWheel.length > 0 ? (
            <div className="relative pointer-events-none scale-75 md:scale-100 origin-top">
              {/* Panah Penunjuk Custom (Opsional, library udah sedia, tapi biar makin estetik) */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 text-5xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                👇
              </div>
              
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={dataWheel}
                onStopSpinning={handleStopSpinning}
                outerBorderColor="#1e293b" // slate-800
                outerBorderWidth={10}
                innerBorderColor="#0f172a" // slate-950
                innerBorderWidth={5}
                radiusLineColor="#334155"
                radiusLineWidth={1}
                backgroundColors={['#eab308', '#166534', '#1e293b', '#0f172a']} // Kuning, Hijau Tua, Slate, Gelap
                textColors={['#ffffff']}
                fontSize={16}
                textDistance={60}
                spinDuration={0.8} // Durasi putaran (0.8 = sekitar 8 detik)
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl w-full">
              <p className="text-slate-500 animate-pulse font-mono">Belum ada data Kapsul Waktu masuk...</p>
            </div>
          )}

          {/* TOMBOL SPIN */}
          <button
            onClick={handleSpinClick}
            disabled={mustSpin || dataWheel.length === 0}
            className={`mt-10 md:mt-2 px-12 py-4 rounded-full font-black text-2xl tracking-widest transition-all shadow-[0_0_40px_rgba(234,179,8,0.3)] 
              ${mustSpin || dataWheel.length === 0 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 hover:scale-105 active:scale-95'
              }`}
          >
            {mustSpin ? 'MEMUTAR NASIB...' : 'SPIN SEKARANG 🎰'}
          </button>
        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL POP-UP HASIL SPIN (BEFORE - AFTER) */}
      {/* ========================================== */}
      {showResult && pemenang && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm">
          
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(234,179,8,0.2)] animate-in zoom-in duration-500">
            
            {/* Tombol Close Pop-Up */}
            <button 
              onClick={() => setShowResult(false)}
              className="absolute top-4 right-6 text-slate-400 hover:text-red-500 text-3xl font-bold transition-colors"
            >
              &times;
            </button>

            <div className="text-center mb-8">
              <h3 className="text-yellow-500 font-black tracking-widest text-sm md:text-lg animate-pulse mb-2">
                🌟 TIME TRAVELER TERPILIH 🌟
              </h3>
              <h2 className="text-3xl md:text-5xl font-bold text-white">{pemenang.nama}</h2>
            </div>

            {/* Container Foto Side-by-Side */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 relative">
              
              {/* SISI KIRI: BEFORE (2016) */}
              <div className="relative w-full md:w-80 aspect-[3/4] md:rounded-l-2xl md:rounded-r-none rounded-xl overflow-hidden border-4 border-slate-700 shadow-xl">
                {/* Asumsi kolom foto lama namanya 'foto_tebak', kalau beda tolong disesuaikan ya! */}
                <img 
                  src={pemenang.foto_tebak || "https://via.placeholder.com/400x500?text=Foto+Jadul+Kosong"} 
                  alt="2016" 
                  className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 pt-10 pb-4 px-4">
                  <p className="text-slate-300 font-mono text-lg font-bold">🎓 ERA 2016</p>
                </div>
              </div>

              {/* GARIS PORTAL WAKTU TENGAH (MUNCUL DI DESKTOP) */}
              <div className="hidden md:flex flex-col items-center justify-center z-10 -mx-4">
                <div className="w-2 h-96 bg-gradient-to-b from-yellow-400 via-green-500 to-blue-500 shadow-[0_0_20px_#eab308] rounded-full"></div>
                <div className="absolute bg-slate-900 border-4 border-yellow-500 p-3 rounded-full text-xl shadow-[0_0_20px_#eab308]">
                  ⚡
                </div>
              </div>

              {/* SISI KANAN: AFTER (2026 NOW) */}
              <div className="relative w-full md:w-80 aspect-[3/4] md:rounded-r-2xl md:rounded-l-none rounded-xl overflow-hidden border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <img 
                  src={pemenang.foto_now} 
                  alt="2026" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 pt-10 pb-4 px-4 text-right">
                  <p className="text-yellow-400 font-mono text-lg font-bold">✨ NOW 2026</p>
                </div>
              </div>

            </div>

            {/* AREA PESAN */}
            <div className="mt-8 max-w-2xl mx-auto bg-slate-950 border border-slate-800 p-6 rounded-2xl relative">
              <span className="absolute -top-5 left-6 text-5xl opacity-20">"</span>
              <p className="text-slate-200 text-center text-lg md:text-xl italic leading-relaxed relative z-10 font-serif">
                {pemenang.pesan_anniv}
              </p>
              <span className="absolute -bottom-10 right-6 text-5xl opacity-20 rotate-180">"</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}