import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';
import StoryShareButton from './StoryShareButton';
import SoloGamePrepScreen from './SoloGamePrepScreen';
import { fetchSoloQuizStoryContext } from '../lib/storyCardGenerator';

export default function FaceGame({ onBack }) {
  const [list, setList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  const getDynamicBlur = () => {
    if (isRevealed) return 'blur-0';
    if (timeLeft > 50) return 'blur-3xl';
    if (timeLeft > 40) return 'blur-2xl';
    if (timeLeft > 30) return 'blur-xl';
    if (timeLeft > 20) return 'blur-lg';
    if (timeLeft > 10) return 'blur-md';
    return 'blur-sm';
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (!hasStarted) return undefined;
    let interval = null;
    if (timerActive && timeLeft > 0 && !isRevealed) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isRevealed) {
      handleTimeOut();
    }
    return () => clearInterval(interval);
  }, [hasStarted, timerActive, timeLeft, isRevealed]);

  const generateOptions = (correctPerson, allData) => {
    let sameGenderList = allData.filter(p => 
      p.gender === correctPerson.gender && p.nama !== correctPerson.nama
    );

    if (sameGenderList.length < 2) {
      sameGenderList = allData.filter(p => p.nama !== correctPerson.nama);
    }

    const wrongAnswers = sameGenderList
      .sort(() => 0.5 - Math.random()) 
      .slice(0, 2)
      .map(p => p.nama);
    
    return [correctPerson.nama, ...wrongAnswers].sort(() => 0.5 - Math.random());
  };

  const initGame = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const userNim = localStorage.getItem('user_nim');
      const savedSession = localStorage.getItem(`session_face_${userNim}`);

      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        setList(sessionData.list);
        setCurrentIndex(sessionData.currentIndex);
        setScore(sessionData.score);
        if (typeof sessionData.timeLeft === 'number') setTimeLeft(sessionData.timeLeft);
        if (sessionData.isRevealed) setIsRevealed(true);
        if (sessionData.selectedAnswer) setSelectedAnswer(sessionData.selectedAnswer);
        if (typeof sessionData.lastPoints === 'number') setLastPoints(sessionData.lastPoints);
        setTimerActive(!sessionData.isRevealed && (typeof sessionData.timeLeft !== 'number' || sessionData.timeLeft > 0));
      } else {
        const { data, error } = await supabase
          .from('alumni')
          .select('nim, nama, gender, hint');
        if (error) throw error;

        if (data && data.length > 0) {
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          const selected20 = shuffled.slice(0, 20).map(person => ({
            ...person,
            options: generateOptions(person, data)
          }));
          
          setList(selected20);
          setCurrentIndex(0);
          setScore(0);
          setIsRevealed(false);
          setSelectedAnswer(null);
          setTimeLeft(60);
          setLastPoints(0);
          updateLocalSession(selected20, 0, 0, { timeLeft: 60, isRevealed: false, selectedAnswer: null, lastPoints: 0 });
        }
        setTimerActive(true);
      }
    } catch (err) {
      console.error("Gagal memuat kuis foto:", err.message);
      setErrorMsg('Gagal memuat data foto alumni. Periksa koneksi internet dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeOut = () => {
    setTimerActive(false);
    setIsRevealed(true);
    setSelectedAnswer("WAKTU HABIS");
  };

  const handleGuess = async (guessName) => {
    if (isRevealed) return;

    setTimerActive(false);
    setIsRevealed(true);
    setSelectedAnswer(guessName);

    const currentPerson = list[currentIndex];
    if (!currentPerson) return;

    const isCorrect = guessName === currentPerson.nama;
    let newScore = score;

    if (isCorrect) {
      let pointsEarned = 50; 
      if (timeLeft > 50) pointsEarned = 100;      
      else if (timeLeft > 40) pointsEarned = 90;  
      else if (timeLeft > 30) pointsEarned = 80;  
      else if (timeLeft > 20) pointsEarned = 70;  
      else if (timeLeft > 10) pointsEarned = 60;  
      
      setLastPoints(pointsEarned); 
      newScore = score + pointsEarned;
      setScore(newScore);
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({ particleCount: 100, spread: 70, origin: { x: 0.2, y: 0.8 }, zIndex: 100 });
        confetti({ particleCount: 100, spread: 70, origin: { x: 0.8, y: 0.8 }, zIndex: 100 });
      }
      
      const userNim = localStorage.getItem('user_nim');
      if (userNim && userNim !== 'guest') {
        const { data: existing } = await supabase
          .from('alumni')
          .select('skor_muka')
          .eq('nim', userNim)
          .single();
        const bestScore = Math.max(existing?.skor_muka || 0, newScore);
        await supabase.from('alumni').update({ skor_muka: bestScore }).eq('nim', userNim);
      }
      updateLocalSession(list, currentIndex, newScore, {
        timeLeft,
        isRevealed: true,
        selectedAnswer: guessName,
        lastPoints: pointsEarned
      });
    } else {
      setLastPoints(0); 
      updateLocalSession(list, currentIndex, newScore, {
        timeLeft,
        isRevealed: true,
        selectedAnswer: guessName,
        lastPoints: 0
      });
    }
  };

  const updateLocalSession = (currentList, idx, scr, extra = {}) => {
    const userNim = localStorage.getItem('user_nim');
    if (!userNim) return;
    localStorage.setItem(`session_face_${userNim}`, JSON.stringify({
      list: currentList,
      currentIndex: idx,
      score: scr,
      timeLeft: typeof extra.timeLeft === 'number' ? extra.timeLeft : timeLeft,
      isRevealed: typeof extra.isRevealed === 'boolean' ? extra.isRevealed : isRevealed,
      selectedAnswer: extra.selectedAnswer !== undefined ? extra.selectedAnswer : selectedAnswer,
      lastPoints: typeof extra.lastPoints === 'number' ? extra.lastPoints : lastPoints
    }));
  };

  useEffect(() => {
    if (loading || list.length === 0 || currentIndex >= 20) return;
    updateLocalSession(list, currentIndex, score);
  }, [timeLeft, isRevealed]);

  const nextPerson = () => {
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setIsRevealed(false);
    setSelectedAnswer(null); 
    setTimeLeft(60); 
    setTimerActive(true); 
    setLastPoints(0); 
    updateLocalSession(list, nextIdx, score, {
      timeLeft: 60,
      isRevealed: false,
      selectedAnswer: null,
      lastPoints: 0
    });
  };

  if (loading) {
    return (
      <div className="text-center p-10 text-stone-700 font-mono flex flex-col items-center justify-center mt-16">
        <div className="w-12 h-12 border-4 border-[#DED6C6] border-t-green-900 rounded-full animate-spin mb-4"></div>
        Menyiapkan Foto Kenangan...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div role="alert" className="text-center p-8 bg-white rounded-2xl border border-rose-300 mt-10 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-rose-800 mb-2">Gagal Memuat Permainan</h2>
        <p className="text-stone-600 mb-6 text-sm">{errorMsg}</p>
        <button
          type="button"
          onClick={initGame}
          className="bg-green-900 hover:bg-green-800 text-white font-bold px-6 py-3 min-h-[44px] rounded-xl transition-colors w-full"
        >
          Coba Lagi
        </button>
      </div>
    );
  }
  
  const handleGoHome = () => {
    const userNim = localStorage.getItem('user_nim');
    if (userNim) localStorage.removeItem(`active_view_${userNim}`);
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  const handleRestartQuiz = () => {
    const userNim = localStorage.getItem('user_nim');
    if (userNim) localStorage.removeItem(`session_face_${userNim}`);
    setHasStarted(true);
    initGame();
  };

  if (currentIndex >= 20) {
    return (
      <div className="text-center p-8 md:p-10 bg-white rounded-2xl border border-[#DED6C6] max-w-md mx-auto">
        <h2 className="text-3xl font-bold text-stone-900 mb-3">Tebak Foto Selesai!</h2>
        <p className="text-stone-600 mb-6">
          Total skor kenangan kamu: <span className="text-green-900 font-mono font-bold text-2xl">{score}</span>
        </p>
        
        <div className="flex flex-col gap-3">
          <StoryShareButton
            label="Bagikan Skor ke IG Story"
            variant="primary"
            className="w-full"
            getPayload={async () => {
              const userNim = localStorage.getItem('user_nim') || '';
              const ctx = await fetchSoloQuizStoryContext('skor_muka', userNim, score);
              return {
                variant: 'ladder',
                badge: 'TEBAK FOTO KENANGAN',
                name: ctx.nama,
                subtitle: userNim ? `NIM ${userNim}` : '20 FOTO MABA 2016',
                nim: userNim,
                avatarConfig: ctx.avatarConfig,
                rankText: ctx.myRank ? `PERINGKAT FOTO #${ctx.myRank} DARI ${ctx.totalCount}` : 'KUIS FOTO SELESAI',
                redactedRank: !ctx.revealNames,
                accent: '#14532D',
                ringColor: '#14532D',
                scoreText: String(score),
                scoreLabel: 'SKOR TEBAK MUKA BLUR',
                breakdownLine: '20 Foto Angkatan 2016  |  1 Dekade TL 2016',
                neighborsTitle: ctx.neighborsTitle || 'POSISI DI KLASEMEN FOTO',
                neighbors: ctx.neighbors,
                filename: `tebak-foto-sedulur16-${userNim || 'skor'}.png`,
                shareTitle: 'Skor Tebak Foto 1 Dekade TL 2016',
                shareText: `Skor Tebak Foto Kenangan saya di 1 Dekade TL 2016: ${score} poin!`
              };
            }}
          />

          <button 
            type="button"
            onClick={handleRestartQuiz} 
            className="bg-green-900 hover:bg-green-800 text-white px-8 py-3.5 min-h-[48px] rounded-xl font-bold transition-colors"
          >
            Main Ulang Kuis Foto
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center justify-center bg-[#FAF6EE] hover:bg-[#F3EDE0] border border-[#DED6C6] px-8 py-3.5 min-h-[48px] rounded-xl font-bold text-stone-800 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    const isResuming = currentIndex > 0 || score > 0 || timeLeft < 60;
    return (
      <SoloGamePrepScreen
        title="Tebak Muka Blur 2016"
        subtitle="Uji seberapa hafal kamu dengan wajah teman-teman seangkatan tahun 2016. Timer 60 detik baru berjalan setelah kamu menekan tombol mulai."
        artworkSrc="/games/tebak-wajah.webp"
        artworkAlt="Ilustrasi kartu foto blur dan stopwatch Tebak Muka Blur TL 2016"
        stats={[
          { value: '20', label: 'Foto Maba' },
          { value: '60 dtk', label: 'Per Foto' },
          { value: '100', label: 'Maks. Poin' }
        ]}
        steps={[
          'Setiap foto maba 2016 awalnya sangat buram dan perlahan semakin jelas setiap 10 detik.',
          'Baca petunjuk singkat di bawah foto, lalu pilih 1 dari 3 nama teman seangkatan sebelum waktu habis.',
          'Semakin cepat kamu menebak dengan benar, semakin besar poin yang kamu kumpulkan.'
        ]}
        scoringTiers={[
          { condition: 'Sisa > 50 dtk', points: '100 poin' },
          { condition: 'Sisa > 40 dtk', points: '90 poin' },
          { condition: 'Sisa > 30 dtk', points: '80 poin' },
          { condition: 'Sisa > 20 dtk', points: '70 poin' },
          { condition: 'Sisa > 10 dtk', points: '60 poin' },
          { condition: 'Sisa <= 10 dtk', points: '50 poin' }
        ]}
        scoringNote="Salah menebak atau waktu habis mendapat 0 poin. Hanya skor tertinggimu yang disimpan ke papan klasemen."
        resumeBanner={
          isResuming
            ? `Sesi sebelumnya tersimpan di Foto ${currentIndex + 1} dari 20 (sisa ${timeLeft} detik, skor sementara ${score} poin).`
            : null
        }
        startLabel={isResuming ? `Lanjutkan dari Foto ${currentIndex + 1}/20` : 'Mulai Tebak Foto'}
        onStart={() => setHasStarted(true)}
        onBack={handleGoHome}
      />
    );
  }

  const currentPerson = list[currentIndex];

  if (!currentPerson) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl border border-rose-300 mt-10 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-rose-800 mb-3">Sesi Kuis Perlu Dimuat Ulang</h2>
        <p className="text-stone-600 mb-6 text-sm">
          Data sesi sebelumnya tidak lengkap. Klik tombol di bawah untuk menyegarkan sesi permainanmu.
        </p>
        <button 
          type="button"
          onClick={handleRestartQuiz} 
          className="bg-green-900 hover:bg-green-800 text-white px-6 py-3.5 min-h-[48px] rounded-xl font-bold transition-colors w-full"
        >
          Muat Ulang Sesi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-[#DED6C6]">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-mono font-bold text-green-900 bg-green-100 px-3 py-1 rounded-lg">
          Foto {currentIndex + 1} / 20
        </span>
        <div className={`font-mono font-bold text-xl ${timeLeft <= 10 ? 'text-rose-700' : 'text-amber-700'}`}>
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>
      </div>

      <div className="w-full bg-[#EDE6D8] h-2 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-rose-600' : 'bg-green-800'}`}
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        ></div>
      </div>

      <div className="relative aspect-square mb-5 overflow-hidden rounded-xl border border-[#DED6C6] bg-[#FAF6EE]">
        <img 
          src={`/2016/${currentPerson.nim}.webp`} 
          width="400"
          height="400"
          className={`w-full h-full object-cover ${isRevealed ? 'transition-all duration-700' : 'transition-none'} ${getDynamicBlur()}`}
          alt={`Foto misteri alumni ke-${currentIndex + 1}`}
        />
        {timeLeft === 0 && !isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-rose-800 font-bold text-2xl border-2 border-rose-400 m-8 rounded-xl">
            Waktu Habis!
          </div>
        )}
      </div>

      <div className="bg-[#FAF6EE] border border-[#DED6C6] rounded-xl px-4 py-3 mb-4 text-center">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-0.5">Petunjuk</p>
        <p className="text-stone-700 text-sm">{currentPerson.hint || "Teman seangkatan Teknik Lingkungan 2016"}</p>
      </div>

      <details className="mb-5 bg-[#FFFDF9] border border-[#DED8CA] rounded-xl overflow-hidden group text-left">
        <summary className="cursor-pointer select-none px-4 py-3 min-h-[44px] flex items-center justify-between text-xs font-bold text-[#14532D] hover:bg-[#FAF6EE] transition-colors">
          <span>Cara Main &amp; Hitungan Skor Tebak Foto</span>
          <span className="font-mono text-xs text-zinc-600 group-open:hidden">Buka</span>
          <span className="font-mono text-xs text-zinc-600 hidden group-open:inline">Tutup</span>
        </summary>
        <div className="px-4 pb-4 pt-2 border-t border-[#EDE6D8] text-xs text-zinc-700 space-y-2 leading-relaxed">
          <p>
            Ada <strong>20 foto masa kuliah 2016</strong> yang awalnya buram dan perlahan makin jelas tiap 10 detik. Kamu punya <strong>60 detik</strong> untuk memilih 1 dari 3 nama teman seangkatan.
          </p>
          <p>
            <strong>Makin cepat menebak, makin besar poinnya:</strong> sisa waktu &gt;50 dtk (<strong>100 poin</strong>), &gt;40 dtk (<strong>90 poin</strong>), &gt;30 dtk (<strong>80 poin</strong>), &gt;20 dtk (<strong>70 poin</strong>), &gt;10 dtk (<strong>60 poin</strong>), dan di bawah 10 dtk (<strong>50 poin</strong>). Salah tebak atau waktu habis dapat 0 poin.
          </p>
          <p className="text-zinc-600">
            Hanya skor tertinggimu yang disimpan ke klasemen.
          </p>
        </div>
      </details>

      <div className="space-y-3">
        {!isRevealed ? (
          currentPerson.options.map((opt, idx) => (
            <button 
              key={idx}
              type="button"
              onClick={() => handleGuess(opt)}
              className="w-full min-h-[48px] bg-[#FAF6EE] hover:bg-[#F3EDE0] border border-[#C7BDA8] hover:border-green-800 py-3.5 px-4 rounded-xl font-bold text-stone-900 transition-colors text-base"
            >
              {opt}
            </button>
          ))
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border text-center ${
              selectedAnswer === currentPerson.nama 
                ? 'bg-green-50 border-green-300 text-green-900' 
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}>
              <p className="text-xs font-bold mb-1 uppercase tracking-wider">
                {selectedAnswer === currentPerson.nama
                  ? `Tebakan Tepat! (+${lastPoints} Poin)`
                  : 'Belum Tepat / Waktu Habis'}
              </p>
              <p className="font-bold text-xl text-stone-900">{currentPerson.nama}</p>
            </div>
            <button 
              type="button"
              onClick={nextPerson}
              className="w-full min-h-[48px] bg-green-900 hover:bg-green-800 text-white py-3.5 px-6 rounded-xl font-bold transition-colors"
            >
              Lanjut ke Foto Berikutnya ({currentIndex + 1 > 20 ? 20 : currentIndex + 1}/20)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
