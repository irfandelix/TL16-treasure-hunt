import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';
import SoloGamePrepScreen from './SoloGamePrepScreen';

export default function WheelOfFamily({ onBack }) {
  const [hasPassedPrep, setHasPassedPrep] = useState(false);
  const [peserta, setPeserta] = useState([]);
  const [usedWinnerNims, setUsedWinnerNims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [pemenang, setPemenang] = useState(null);

  const availablePeserta = peserta.filter((item) => !usedWinnerNims.includes(item.nim));
  const dataWheel = availablePeserta.map((item) => ({
    option: item.nama.substring(0, 15) + (item.nama.length > 15 ? '...' : '')
  }));

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
      } else {
        setPeserta([]);
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
    const chosen = availablePeserta[prizeNumber];
    if (!chosen) return;
    setPemenang(chosen);
    setUsedWinnerNims((prev) => (prev.includes(chosen.nim) ? prev : [...prev, chosen.nim]));
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

  if (!hasPassedPrep) {
    return (
      <div className="w-full py-4 sm:py-6">
        <SoloGamePrepScreen
          title="Wheel of Family"
          subtitle="Putar roda kenangan untuk membuka transformasi foto 2016 ke 2026 serta pesan nostalgia dari teman-teman seangkatan secara acak."
          artworkSrc="/games/wheel-of-family.webp"
          artworkAlt="Ilustrasi roda kenangan Wheel of Family"
          stats={[
            { value: isLoading ? '...' : `${peserta.length}`, label: 'Kapsul Siap' },
            { value: '1x', label: 'Per Siklus' },
            { value: '2016-2026', label: 'Transformasi' }
          ]}
          steps={[
            'Roda otomatis diisi oleh alumni TL 2016 yang sudah mengunggah foto terbaru dan pesan reuni.',
            'Tekan tombol putar untuk memilih satu teman seangkatan secara acak dan melihat kilas balik fotonya.',
            'Setiap nama hanya terpilih satu kali dalam satu putaran siklus sampai semua kapsul selesai dibuka.'
          ]}
          startLabel="Buka Roda Kenangan"
          onStart={() => setHasPassedPrep(true)}
          onBack={onBack}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full text-stone-900 font-sans pb-16">
      <div className="w-full max-w-4xl bg-white border border-[#DED6C6] rounded-2xl p-6 md:p-10 relative overflow-hidden">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-2">
            Wheel of Family
          </h2>
          <p className="text-stone-600 text-sm md:text-base">
            Saatnya Bernostalgia Bersama Sedulur 16 ({peserta.length} Kapsul Terkumpul)
          </p>
        </div>

        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center border border-[#DED6C6] bg-[#FAF6EE] rounded-2xl w-full p-6">
              <div className="w-10 h-10 border-4 border-[#DED6C6] border-t-green-900 rounded-full animate-spin mb-3"></div>
              <p className="text-stone-600 font-mono text-sm">Memuat daftar alumni Kapsul Waktu...</p>
            </div>
          ) : errorMsg ? (
            <div role="alert" className="h-64 flex flex-col items-center justify-center border border-rose-300 bg-rose-50 rounded-2xl w-full p-6 text-center">
              <p className="text-rose-800 font-semibold mb-4">{errorMsg}</p>
              <button
                type="button"
                onClick={fetchPeserta}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-green-900 hover:bg-green-800 text-white font-bold text-sm"
              >
                Coba Lagi
              </button>
            </div>
          ) : dataWheel.length > 0 ? (
            <div className="w-full overflow-hidden flex justify-center py-2">
              <div className="relative pointer-events-none scale-[0.72] sm:scale-90 md:scale-100 origin-center -my-12 sm:-my-4 md:my-0">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={dataWheel}
                  onStopSpinning={handleStopSpinning}
                  outerBorderColor="#1c1917"
                  outerBorderWidth={6}
                  innerBorderColor="#faf6ee"
                  innerBorderWidth={4}
                  radiusLineColor="#faf6ee"
                  radiusLineWidth={1}
                  backgroundColors={['#14532d', '#d97706', '#b91c1c', '#1e3a8a']}
                  textColors={['#faf6ee']}
                  fontSize={15}
                  textDistance={60}
                  spinDuration={0.8}
                />
              </div>
            </div>
          ) : peserta.length > 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#C7BDA8] bg-[#FAF6EE] rounded-2xl w-full p-6 text-center space-y-3">
              <p className="text-stone-900 font-bold text-base">Semua Nama Sudah Pernah Diputar</p>
              <p className="text-stone-600 text-sm max-w-md">
                Seluruh {peserta.length} alumni sudah mendapat giliran terpilih. Reset daftar jika ingin memulai putaran baru.
              </p>
              <button
                type="button"
                onClick={() => setUsedWinnerNims([])}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-sm transition-colors"
              >
                Reset Daftar Putaran
              </button>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#C7BDA8] bg-[#FAF6EE] rounded-2xl w-full p-6 text-center">
              <p className="text-stone-900 font-bold text-base mb-1">Belum Ada Kapsul Waktu yang Masuk</p>
              <p className="text-stone-600 text-sm max-w-md">
                Ajak teman-teman Sedulur 16 mengisi foto terbaru dan pesan di menu Kapsul Waktu agar namanya masuk ke roda putar!
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSpinClick}
            disabled={mustSpin || dataWheel.length === 0 || isLoading}
            className={`mt-8 md:mt-4 px-10 py-4 min-h-[52px] rounded-xl font-bold text-lg md:text-xl tracking-wide transition-colors 
              ${mustSpin || dataWheel.length === 0 || isLoading
                ? 'bg-stone-300 text-stone-600 cursor-not-allowed' 
                : 'bg-green-900 hover:bg-green-800 text-white'
              }`}
          >
            {mustSpin ? 'Memutar Roda Kenangan...' : 'Putar Roda Sekarang'}
          </button>

          <section aria-labelledby="wheel-guide-heading" className="mt-8 w-full bg-[#FAF6EE] border border-[#DED8CA] rounded-2xl p-5 text-left space-y-2">
            <h3 id="wheel-guide-heading" className="text-sm font-bold text-zinc-900">
              Cara Kerja Wheel of Family
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-700 leading-relaxed">
              <li>Roda ini otomatis diisi nama seluruh teman TL 2016 yang sudah mengirim foto dan pesan lewat menu <strong>Kapsul Waktu</strong>.</li>
              <li>Begitu roda berhenti, foto zaman kuliah 2016, foto terbaru, dan pesan reuni teman yang terpilih langsung terbuka untuk dibaca bersama.</li>
              <li>Nama yang sudah keluar tidak akan terpilih lagi di putaran berikutnya supaya semua dapat giliran merata. Jika semuanya sudah kebagian, daftar bisa diulang dari awal.</li>
            </ul>
          </section>
        </div>

      </div>

      {showResult && pemenang && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-[2px] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-modal-title"
          onClick={() => setShowResult(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-white border border-[#DED6C6] rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl my-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setShowResult(false)}
              aria-label="Tutup jendela pemenang"
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FAF6EE] hover:bg-[#F3EDE0] text-stone-800 border border-[#DED6C6] text-xl font-bold transition-colors"
            >
              &times;
            </button>

            <div className="text-center mb-6 pr-10">
              <h3 id="winner-modal-title" className="text-2xl md:text-4xl font-bold text-stone-900">
                {pemenang.nama}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-2xl mx-auto">
              
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-[#DED6C6] bg-[#FAF6EE]">
                <img 
                  src={`/2016/${pemenang.nim}.webp`} 
                  alt={`Foto ${pemenang.nama} tahun 2016`} 
                  width="320"
                  height="426"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-stone-950/80 py-2.5 px-4">
                  <p className="text-white font-mono text-sm font-bold">Era Maba 2016</p>
                </div>
              </div>

              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-500 bg-[#FAF6EE]">
                <img 
                  src={pemenang.foto_now} 
                  alt={`Foto ${pemenang.nama} tahun 2026`} 
                  width="320"
                  height="426"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-stone-950/80 py-2.5 px-4 text-right">
                  <p className="text-amber-300 font-mono text-sm font-bold">Kini 2026 (1 Dekade)</p>
                </div>
              </div>

            </div>

            <div className="mt-6 max-w-2xl mx-auto bg-[#FAF6EE] border border-[#DED6C6] p-5 rounded-xl">
              <p className="text-xs font-bold text-green-900 uppercase tracking-wide mb-2 text-center">
                Pesan Untuk Sedulur 16
              </p>
              <p className="text-stone-800 text-center text-base md:text-lg leading-relaxed">
                {pemenang.pesan_anniv}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
