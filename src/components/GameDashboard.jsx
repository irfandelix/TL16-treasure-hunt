import React, { useState, useEffect, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';
import Login from './Login';
import RoadmapModal from './RoadmapModal';

const TreasureHunt = lazy(() => import('./TreasureHunt'));
const FaceGame = lazy(() => import('./FaceGame'));
const ScoreBoard = lazy(() => import('./ScoreBoard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const FormKapsulWaktu = lazy(() => import('./FormKapsulWaktu'));
const WheelOfFamily = lazy(() => import('./WheelOfFamily'));
const MonopoliBoard = lazy(() => import('./MonopoliBoard'));
const DosenKillerGame = lazy(() => import('./DosenKillerGame'));
const UnoBrutalGame = lazy(() => import('./UnoBrutalGame'));

const LoadingScreen = ({ label = 'Memuat halaman permainan...' }) => (
  <div className="min-h-[60vh] bg-[#FAF6EE] flex flex-col justify-center items-center gap-3 text-stone-700 p-6">
    <span
      aria-hidden="true"
      className="w-9 h-9 border-3 border-[#DED6C6] border-t-green-900 rounded-full animate-spin"
    />
    <p className="text-sm font-semibold">{label}</p>
  </div>
);

const IconMap = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-green-800 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconUsers = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-green-800 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBoard = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-amber-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
  </svg>
);

const IconClass = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-amber-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconCards = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-amber-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4" width="12" height="16" rx="2" />
    <path d="M9 2h10a2 2 0 0 1 2 2v14" />
  </svg>
);

export default function GameDashboard() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showAnniversary, setShowAnniversary] = useState(false);

  const [targetDate, setTargetDate] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [wheelUnlocked, setWheelUnlocked] = useState(false);

  const [isMonopoliUnlocked, setIsMonopoliUnlocked] = useState(false);
  const [isWerewolfUnlocked, setIsWerewolfUnlocked] = useState(false);
  const [isUnoUnlocked, setIsUnoUnlocked] = useState(false);

  const [monopoliApproaching, setMonopoliApproaching] = useState(false);
  const [werewolfApproaching, setWerewolfApproaching] = useState(false);
  const [unoApproaching, setUnoApproaching] = useState(false);
  const [gameDates, setGameDates] = useState(null);

  useEffect(() => {
    const savedNim = localStorage.getItem('user_nim');
    const savedNama = localStorage.getItem('user_nama');
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (savedNim) {
      setUser({ nim: savedNim, nama: savedNama, is_admin: isAdmin });
    }
    setIsChecking(false);
  }, []);

  const closeAnniversary = () => {
    setShowAnniversary(false);
    if (user) localStorage.setItem(`has_seen_anniversary_${user.nim}`, 'true');
  };

  useEffect(() => {
    if (!showAnniversary) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAnniversary();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnniversary, user]);

  useEffect(() => {
    if (user && user.nim !== 'guest') {
      const hasSeen = localStorage.getItem(`has_seen_anniversary_${user.nim}`);
      if (!hasSeen) {
        setShowAnniversary(true);
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#34d399', '#f8fafc']
          });
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const updateGameStatus = (data) => {
      setTargetDate(data.wheel_unlock_date ? new Date(data.wheel_unlock_date) : null);
      if (!data.wheel_unlock_date) setWheelUnlocked(false);

      setGameDates({
        monopoli: data.monopoli_unlock_date,
        werewolf: data.werewolf_unlock_date,
        uno: data.uno_unlock_date
      });
    };

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('wheel_unlock_date, monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date')
          .eq('id', 1)
          .single();

        if (error) throw error;
        if (data) {
          updateGameStatus(data);
        }
      } catch (error) {
        console.error('Gagal memeriksa jadwal:', error.message);
      }
    };

    fetchSettings();

    const subscription = supabase
      .channel('public:app_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
        (payload) => {
          updateGameStatus(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      const now = Date.now();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        setWheelUnlocked(true);
        setTimeLeft(null);
      } else {
        setWheelUnlocked(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  useEffect(() => {
    if (!user || !gameDates) return;

    const checkLocalTime = () => {
      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      if (user.is_admin) {
        setIsMonopoliUnlocked(true);
        setMonopoliApproaching(false);
      } else if (gameDates.monopoli) {
        const unlockTimeMono = new Date(gameDates.monopoli).getTime();
        setIsMonopoliUnlocked(now >= unlockTimeMono);
        setMonopoliApproaching(now < unlockTimeMono && unlockTimeMono - now <= THIRTY_DAYS_MS);
      } else {
        setIsMonopoliUnlocked(false);
        setMonopoliApproaching(false);
      }

      if (user.is_admin) {
        setIsWerewolfUnlocked(true);
        setWerewolfApproaching(false);
      } else if (gameDates.werewolf) {
        const unlockTimeWolf = new Date(gameDates.werewolf).getTime();
        setIsWerewolfUnlocked(now >= unlockTimeWolf);
        setWerewolfApproaching(now < unlockTimeWolf && unlockTimeWolf - now <= THIRTY_DAYS_MS);
      } else {
        setIsWerewolfUnlocked(false);
        setWerewolfApproaching(false);
      }

      if (user.is_admin) {
        setIsUnoUnlocked(true);
        setUnoApproaching(false);
      } else if (gameDates.uno) {
        const unlockTimeUno = new Date(gameDates.uno).getTime();
        setIsUnoUnlocked(now >= unlockTimeUno);
        setUnoApproaching(now < unlockTimeUno && unlockTimeUno - now <= THIRTY_DAYS_MS);
      } else {
        setIsUnoUnlocked(false);
        setUnoApproaching(false);
      }
    };

    checkLocalTime();
    const interval = setInterval(checkLocalTime, 1000);
    return () => clearInterval(interval);
  }, [user, gameDates]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-[#FAF6EE] flex justify-center items-center text-stone-700 font-semibold">
        Memuat Portal Perayaan 1 Dekade TL 2016...
      </main>
    );
  }

  if (!user) return <Login onLoginSuccess={setUser} />;

  const renderSubView = (Component, props = {}) => (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <nav aria-label="Navigasi kembali" className="mb-6 pb-4 border-b border-[#DED6C6]">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#DED6C6] text-green-900 hover:bg-[#F3EDE0] font-bold text-sm transition-colors"
          >
            &larr; Kembali ke Beranda Perayaan
          </button>
        </nav>
        <main>
          <Suspense fallback={<LoadingScreen />}>
            <Component {...props} />
          </Suspense>
        </main>
      </div>
    </div>
  );

  if (activeView === 'map') return renderSubView(TreasureHunt);
  if (activeView === 'face') return renderSubView(FaceGame);
  if (activeView === 'kapsul') return renderSubView(FormKapsulWaktu, { userLocal: user });
  if (activeView === 'wheel') return renderSubView(WheelOfFamily);
  if (activeView === 'monopoli') return renderSubView(MonopoliBoard);
  if (activeView === 'dosenkiller') return renderSubView(DosenKillerGame);
  if (activeView === 'unobrutal') return renderSubView(UnoBrutalGame);

  if (activeView === 'admin' && user.is_admin) {
    return (
      <Suspense fallback={<LoadingScreen label="Memuat ruang panitia..." />}>
        <AdminDashboard onBack={() => setActiveView('dashboard')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 p-4 md:p-8 relative">
      {showAnniversary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anniv-welcome-title"
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4"
        >
          <div className="bg-white border border-[#DED6C6] p-8 md:p-10 rounded-2xl max-w-lg w-full text-center shadow-xl">
            <h2 id="anniv-welcome-title" className="flex justify-center mb-5">
              <img
                src="/Asset 2.webp"
                alt="Happy Anniversary Teknik Lingkungan 2016"
                width="280"
                height="109"
                className="w-full max-w-[260px] h-auto"
              />
            </h2>
            <p className="text-stone-700 text-base mb-8 leading-relaxed">
              Selamat datang kembali, <strong className="text-stone-900">{user.nama}</strong>! Mari rayakan satu dekade Teknik Lingkungan 2016 dengan mengisi kapsul kenangan dan bermain bersama.
            </p>
            <button
              type="button"
              onClick={closeAnniversary}
              className="min-h-[48px] px-8 py-3 bg-green-900 hover:bg-green-800 text-white font-bold rounded-xl transition-colors text-base"
            >
              Mulai Rayakan Sekarang
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#DED6C6] pb-6 gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/Asset 2.webp"
              alt="Happy Anniversary TL 2016"
              width="140"
              height="54"
              className="w-32 h-auto hidden sm:block"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
                Halo, {user.nama}!
              </h1>
              <p className="text-stone-600 text-sm">
                NIM: <span className="font-mono font-semibold text-green-800">{user.nim}</span>
              </p>
            </div>
          </div>

          <nav aria-label="Menu pengguna" className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <RoadmapModal />
            {user.is_admin && (
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className="min-h-[44px] text-sm bg-green-900 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl font-bold transition-colors"
              >
                Ruang Panitia
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] text-sm bg-white px-4 py-2.5 rounded-xl border border-[#DED6C6] hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800 text-stone-700 font-semibold transition-colors ml-auto md:ml-0"
            >
              Keluar
            </button>
          </nav>
        </header>

        <main className="space-y-14">
          {/* BAGIAN 1: SOROTAN UTAMA PERAYAAN ULANG TAHUN (EDITORIAL 2-KOLOM) */}
          <section aria-labelledby="highlight-heading">
            <div className="mb-5">
              <h2 id="highlight-heading" className="text-2xl md:text-3xl font-bold text-stone-900">
                Agenda Utama Ulang Tahun 1 Dekade
              </h2>
              <p className="text-stone-600 text-sm mt-1">
                Kirimkan foto terbaru dan pesan kenanganmu untuk diputar bersama saat puncak perayaan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <article className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-[#DED6C6] flex flex-col justify-between">
                <div>
                  <span className="inline-block px-3 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold mb-4">
                    Wajib Diisi Semua Alumni
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-stone-900 mb-2">
                    Kapsul Waktu 2016 ke 2026
                  </h3>
                  <p className="text-stone-600 text-sm md:text-base mb-6 leading-relaxed">
                    Unggah satu foto terbaikmu di tahun 2026 beserta pesan hangat atau cerita lucu masa kuliah untuk ditampilkan di acara Wheel of Family.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveView('kapsul')}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-green-900 hover:bg-green-800 rounded-xl font-bold text-white text-base transition-colors"
                  >
                    Isi Kapsul Waktu Sekarang
                  </button>
                </div>
              </article>

              <article className="lg:col-span-5 bg-[#F3EDE0] p-6 md:p-8 rounded-2xl border border-[#DED6C6] flex flex-col justify-between">
                {user.is_admin ? (
                  <>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-md bg-green-900/10 text-green-900 text-xs font-bold mb-4">
                        Akses Panitia
                      </span>
                      <h3 className="text-2xl font-bold text-stone-900 mb-2">
                        Wheel of Family
                      </h3>
                      <p className="text-stone-700 text-sm mb-6 leading-relaxed">
                        {targetDate
                          ? 'Hitung mundur untuk peserta sedang berjalan. Panitia dapat menguji roda putar kapan saja.'
                          : 'Jadwal pembukaan roda putar belum diatur di Ruang Panitia.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('wheel')}
                      className="w-full min-h-[48px] py-3 px-5 bg-white hover:bg-stone-50 border border-[#C7BDA8] rounded-xl font-bold text-stone-900 text-base transition-colors"
                    >
                      Buka Roda Putar
                    </button>
                  </>
                ) : !targetDate ? (
                  <div className="my-auto py-2">
                    <h3 className="text-xl font-bold text-stone-900 mb-2">
                      Kejutan Puncak Wheel of Family
                    </h3>
                    <p className="text-stone-700 text-sm leading-relaxed">
                      Jadwal pemutaran kapsul kenangan akan diumumkan oleh panitia. Pastikan kamu sudah mengisi Kapsul Waktu!
                    </p>
                  </div>
                ) : !wheelUnlocked && timeLeft ? (
                  <div className="my-auto">
                    <span className="inline-block px-3 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold mb-3">
                      Menuju Puncak Acara
                    </span>
                    <h3 className="text-xl font-bold text-stone-900 mb-1">
                      Wheel of Family Segera Dibuka
                    </h3>
                    <p className="text-stone-600 text-xs mb-5">
                      Hitung mundur pembukaan foto & pesan satu angkatan:
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white border border-[#DED6C6] py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-stone-900">{timeLeft.days}</span>
                        <span className="block text-xs text-stone-600 mt-0.5 font-medium">Hari</span>
                      </div>
                      <div className="bg-white border border-[#DED6C6] py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-stone-900">{timeLeft.hours}</span>
                        <span className="block text-xs text-stone-600 mt-0.5 font-medium">Jam</span>
                      </div>
                      <div className="bg-white border border-[#DED6C6] py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-stone-900">{timeLeft.minutes}</span>
                        <span className="block text-xs text-stone-600 mt-0.5 font-medium">Menit</span>
                      </div>
                      <div className="bg-white border border-[#DED6C6] py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-green-800">{timeLeft.seconds}</span>
                        <span className="block text-xs text-stone-600 mt-0.5 font-medium">Detik</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-md bg-green-900/10 text-green-900 text-xs font-bold mb-4">
                        Sudah Dibuka
                      </span>
                      <h3 className="text-2xl font-bold text-stone-900 mb-2">
                        Wheel of Family
                      </h3>
                      <p className="text-stone-700 text-sm mb-6 leading-relaxed">
                        Saatnya memutar roda kenangan dan melihat transformasi teman-teman Sedulur 16 dari tahun 2016 hingga 2026!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('wheel')}
                      className="w-full min-h-[48px] py-3 px-5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-base transition-colors"
                    >
                      Buka Roda Kenangan
                    </button>
                  </>
                )}
              </article>
            </div>
          </section>

          {/* BAGIAN 2: PERMAINAN NOSTALGIA INDIVIDU (DAFTAR EDITORIAL) */}
          <section aria-labelledby="solo-games-heading">
            <div className="mb-4">
              <h2 id="solo-games-heading" className="text-xl md:text-2xl font-bold text-stone-900">
                Kuis Kenangan Kampus (Main Sendiri)
              </h2>
              <p className="text-stone-600 text-sm">
                Kumpulkan poin untuk klasemen angkatan dengan menebak lokasi kampus dan foto masa maba.
              </p>
            </div>

            <div className="bg-white border border-[#DED6C6] rounded-2xl divide-y divide-[#DED6C6]">
              <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EDE0] flex items-center justify-center shrink-0 mt-0.5">
                    <IconMap />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-stone-900">Digital Treasure Hunt</h3>
                      <span className="text-xs font-semibold text-green-900 bg-green-100 px-2 py-0.5 rounded-md">
                        20 Lokasi Memori
                      </span>
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                      Napak tilas titik-titik kenangan di sekitar kampus dan tempat nongkrong legendaris angkatan 2016.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('map')}
                  className="w-full sm:w-auto shrink-0 min-h-[48px] bg-green-900 hover:bg-green-800 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                >
                  Mulai Tebak Lokasi
                </button>
              </article>

              <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EDE0] flex items-center justify-center shrink-0 mt-0.5">
                    <IconUsers />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-stone-900">Tebak Muka Blur</h3>
                      <span className="text-xs font-semibold text-green-900 bg-green-100 px-2 py-0.5 rounded-md">
                        20 Foto Angkatan
                      </span>
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                      Seberapa hafal kamu dengan wajah teman seangkatan tahun 2016? Semakin cepat menebak, semakin tinggi poinnya.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('face')}
                  className="w-full sm:w-auto shrink-0 min-h-[48px] bg-green-900 hover:bg-green-800 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                >
                  Mulai Tebak Foto
                </button>
              </article>
            </div>
          </section>

          {/* BAGIAN 3: PERMAINAN BARENG SEANGKATAN (MULTIPLAYER) */}
          {(isMonopoliUnlocked || monopoliApproaching || isWerewolfUnlocked || werewolfApproaching || isUnoUnlocked || unoApproaching) && (
            <section aria-labelledby="party-games-heading">
              <div className="mb-4">
                <h2 id="party-games-heading" className="text-xl md:text-2xl font-bold text-stone-900">
                  Arena Main Bareng (Multiplayer)
                </h2>
                <p className="text-stone-600 text-sm">
                  Permainan seru untuk dimainkan bersama satu tongkrongan secara langsung.
                </p>
              </div>

              <div className="bg-white border border-[#DED6C6] rounded-2xl divide-y divide-[#DED6C6]">
                {monopoliApproaching && !isMonopoliUnlocked && (
                  <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF6EE]/60">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconBoard />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-800">Monopoli TL16</h3>
                          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-md">
                            Segera Dibuka
                          </span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                          Permainan papan kenangan 4 tahun masa kuliah ini akan segera dibuka sesuai jadwal perayaan.
                        </p>
                      </div>
                    </div>
                  </article>
                )}

                {isMonopoliUnlocked && (
                  <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconBoard />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-900">Monopoli TL16</h3>
                          <span className="bg-green-100 text-green-900 text-xs font-bold px-2 py-0.5 rounded-md">
                            Siap Dimainkan
                          </span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                          Kelilingi petak kampus, kumpulkan properti kontrakan, dan jawab tantangan Truth or Dare bersama teman-teman.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('monopoli')}
                      className="w-full sm:w-auto shrink-0 min-h-[48px] bg-amber-500 hover:bg-amber-400 py-3 px-5 rounded-xl font-bold text-stone-950 text-sm transition-colors"
                    >
                      Buka Papan Monopoli
                    </button>
                  </article>
                )}

                {werewolfApproaching && !isWerewolfUnlocked && (
                  <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF6EE]/60">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconClass />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-800">Dosen Killer</h3>
                          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-md">
                            Segera Dibuka
                          </span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                          Permainan deduksi sosial khas ruang kelas TL 2016 ini sedang disiapkan untuk sesi kumpul angkatan.
                        </p>
                      </div>
                    </div>
                  </article>
                )}

                {isWerewolfUnlocked && (
                  <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconClass />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-900">Dosen Killer</h3>
                          <span className="bg-green-100 text-green-900 text-xs font-bold px-2 py-0.5 rounded-md">
                            Siap Dimainkan
                          </span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                          Permainan tebak peran ala kelas kuliah: temukan siapa yang menyamar sebagai Dosen Killer sebelum satu kelas kena remedial!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('dosenkiller')}
                      className="w-full sm:w-auto shrink-0 min-h-[48px] bg-amber-500 hover:bg-amber-400 py-3 px-5 rounded-xl font-bold text-stone-950 text-sm transition-colors"
                    >
                      Masuk Ruang Kelas
                    </button>
                  </article>
                )}

                {unoApproaching && !isUnoUnlocked && (
                  <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF6EE]/60">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconCards />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-800">UNO Seru TL16</h3>
                          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-md">
                            Segera Dibuka
                          </span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                          Meja kartu UNO spesial reuni 1 Dekade akan dibuka menjelang sesi permainan bersama.
                        </p>
                      </div>
                    </div>
                  </article>
                )}

                {isUnoUnlocked && (
                  <article className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconCards />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-900">UNO Seru TL16</h3>
                          <span className="bg-green-100 text-green-900 text-xs font-bold px-2 py-0.5 rounded-md">
                            Siap Dimainkan
                          </span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                          Buka meja kartu bersama teman-teman angkatan dengan aturan tumpuk kartu yang meriah.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('unobrutal')}
                      className="w-full sm:w-auto shrink-0 min-h-[48px] bg-amber-500 hover:bg-amber-400 py-3 px-5 rounded-xl font-bold text-stone-950 text-sm transition-colors"
                    >
                      Gabung Meja Kartu
                    </button>
                  </article>
                )}
              </div>
            </section>
          )}

          {/* BAGIAN 4: PAPAN KLASEMEN */}
          <Suspense
            fallback={
              <div className="text-center p-8 text-stone-600 bg-white rounded-2xl border border-[#DED6C6]">
                Memuat Papan Klasemen...
              </div>
            }
          >
            <ScoreBoard />
          </Suspense>
        </main>

        <footer className="mt-16 pt-8 border-t border-[#DED6C6] text-center text-stone-600 text-xs space-y-1">
          <p className="font-semibold text-stone-800">Perayaan 1 Dekade Teknik Lingkungan Angkatan 2016 (Sedulur 16)</p>
          <p>2016 - 2026 | Kebersamaan Satu Dekade</p>
        </footer>
      </div>
    </div>
  );
}
