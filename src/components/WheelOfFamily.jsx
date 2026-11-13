import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';

export default function WheelOfFamily() {
  const [peserta, setPeserta] = useState([]);
  const [dataWheel, setDataWheel] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [pemenang, setPemenang] = useState(null);

  const fetchPeserta = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('nim, nama, foto_now, pesan_anniv')
        .not('foto_now', 'is', null);

      if (error) throw error;

      if (data && data.length > 0) {
        setPeserta(data);
        const formatWheel = data.map((item) => ({
          option: item.nama.substring(0, 15) + (item.nama.length > 15 ? '...' : '')
        }));
        setDataWheel(formatWheel);
      } else {
        setPeserta([]);
        setDataWheel([]);
      }
    } catch (error) {
      console.error("Gagal tarik data peserta:", error.message);
      setErrorMsg('Gagal memuat daftar peserta Kapsul Waktu. Silakan muat ulang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  useEffect(() => {
    if (!showResult) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowResult(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult]);

  const handleSpinClick = () => {
    if (!mustSpin && dataWheel.length > 0) {
      const newPrizeNumber = Math.floor(Math.random() * dataWheel.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setShowResult(false);
    }
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    setPemenang(peserta[prizeNumber]);
    setShowResult(true);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#34d399', '#f8fafc']
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full text-white font-sans pb-16">
      <div className="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-10 shadow-md relative overflow-hidden">
        
        <div className="text-center mb-8">
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            Perayaan 1 Dekade Teknik Lingkungan 2016
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-amber-400 tracking-tight mb-2">
            Wheel of Family
          </h2>
          <p className="text-slate-300 text-sm md:text-base">
            Saatnya Bernostalgia Bersama Sedulur 16 ({peserta.length} Kapsul Terkumpul)
          </p>
        </div>

        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center border border-slate-700 bg-slate-900 rounded-2xl w-full p-6">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin mb-3"></div>
              <p className="text-slate-300 font-mono text-sm">Memuat daftar alumni Kapsul Waktu...</p>
            </div>
          ) : errorMsg ? (
            <div role="alert" className="h-64 flex flex-col items-center justify-center border border-rose-500/40 bg-rose-950/30 rounded-2xl w-full p-6 text-center">
              <p className="text-rose-300 font-semibold mb-4">{errorMsg}</p>
              <button
                type="button"
                onClick={fetchPeserta}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
              >
                Coba Lagi
              </button>
            </div>
          ) : dataWheel.length > 0 ? (
            <div className="relative pointer-events-none scale-75 md:scale-100 origin-top">
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={dataWheel}
                onStopSpinning={handleStopSpinning}
                outerBorderColor="#1e293b"
                outerBorderWidth={8}
                innerBorderColor="#0f172a"
                innerBorderWidth={4}
                radiusLineColor="#334155"
                radiusLineWidth={1}
                backgroundColors={['#b45309', '#047857', '#1e293b', '#0f172a']}
                textColors={['#f8fafc']}
                fontSize={15}
                textDistance={60}
                spinDuration={0.8}
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 bg-slate-900 rounded-2xl w-full p-6 text-center">
              <p className="text-slate-200 font-bold text-base mb-1">Belum Ada Kapsul Waktu yang Masuk</p>
              <p className="text-slate-300 text-sm max-w-md">
                Ajak teman-teman Sedulur 16 mengisi foto terbaru dan pesan di menu Kapsul Waktu agar namanya masuk ke roda putar!
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSpinClick}
            disabled={mustSpin || dataWheel.length === 0 || isLoading}
            className={`mt-8 md:mt-4 px-10 py-4 min-h-[52px] rounded-xl font-bold text-lg md:text-xl tracking-wide transition-colors shadow-md 
              ${mustSpin || dataWheel.length === 0 || isLoading
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
          >
            {mustSpin ? 'Memutar Roda Kenangan...' : 'Putar Roda Sekarang'}
          </button>
        </div>

      </div>

      {showResult && pemenang && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/90 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-modal-title"
          onClick={() => setShowResult(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setShowResult(false)}
              aria-label="Tutup jendela pemenang"
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xl font-bold transition-colors"
            >
              &times;
            </button>

            <div className="text-center mb-6 pr-10">
              <p className="text-amber-400 font-mono font-bold tracking-wider text-xs md:text-sm uppercase mb-1">
                Alumni Terpilih 1 Dekade
              </p>
              <h3 id="winner-modal-title" className="text-2xl md:text-4xl font-bold text-white">
                {pemenang.nama}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-2xl mx-auto">
              
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-md">
                <img 
                  src={`/2016/${pemenang.nim}.webp`} 
                  alt={`Foto ${pemenang.nama} tahun 2016`} 
                  width="320"
                  height="426"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-slate-950/85 py-2.5 px-4 border-t border-slate-800">
                  <p className="text-slate-200 font-mono text-sm font-bold">Era Maba 2016</p>
                </div>
              </div>

              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-900 shadow-md">
                <img 
                  src={pemenang.foto_now} 
                  alt={`Foto ${pemenang.nama} tahun 2026`} 
                  width="320"
                  height="426"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-slate-950/85 py-2.5 px-4 border-t border-amber-400/40 text-right">
                  <p className="text-amber-400 font-mono text-sm font-bold">Kini 2026 (1 Dekade)</p>
                </div>
              </div>

            </div>

            <div className="mt-6 max-w-2xl mx-auto bg-slate-900 border border-slate-700 p-5 rounded-xl">
              <p className="text-xs font-mono font-bold text-amber-400 uppercase mb-2 text-center">
                Pesan Untuk Sedulur 16
              </p>
              <p className="text-slate-100 text-center text-base md:text-lg leading-relaxed">
                {pemenang.pesan_anniv}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
