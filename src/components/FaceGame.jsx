import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

export default function FaceGame() {
  const [list, setList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
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
    let interval = null;
    if (timerActive && timeLeft > 0 && !isRevealed) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isRevealed) {
      handleTimeOut();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, isRevealed]);

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
      } else {
        const { data, error } = await supabase.from('alumni').select('*');
        if (error) throw error;

        if (data && data.length > 0) {
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          const selected20 = shuffled.slice(0, 20).map(person => ({
            ...person,
            options: generateOptions(person, data)
          }));
          
          setList(selected20);
          updateLocalSession(selected20, 0, 0);
        }
      }
      setTimerActive(true);
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
        await supabase.from('alumni').update({ skor_muka: newScore }).eq('nim', userNim);
      }
    } else {
      setLastPoints(0); 
    }
    
    updateLocalSession(list, currentIndex, newScore);
  };

  const updateLocalSession = (currentList, idx, scr) => {
    const userNim = localStorage.getItem('user_nim');
    localStorage.setItem(`session_face_${userNim}`, JSON.stringify({
      list: currentList,
      currentIndex: idx,
      score: scr
    }));
  };

  const nextPerson = () => {
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setIsRevealed(false);
    setSelectedAnswer(null); 
    setTimeLeft(60); 
    setTimerActive(true); 
    setLastPoints(0); 
    updateLocalSession(list, nextIdx, score);
  };

  if (loading) {
    return (
      <div className="text-center p-10 text-amber-400 font-mono flex flex-col items-center justify-center mt-16">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin mb-4"></div>
        Menyiapkan Foto Kenangan...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div role="alert" className="text-center p-8 bg-slate-800 rounded-2xl border border-rose-500/40 mt-10 shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Gagal Memuat Permainan</h2>
        <p className="text-slate-300 mb-6 text-sm">{errorMsg}</p>
        <button
          type="button"
          onClick={initGame}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 min-h-[44px] rounded-xl transition-colors w-full"
        >
          Coba Lagi
        </button>
      </div>
    );
  }
  
  if (currentIndex >= 20) {
    return (
      <div className="text-center p-8 md:p-10 bg-slate-800 rounded-2xl border border-emerald-500/50 shadow-md max-w-md mx-auto">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
          Kuis Selesai
        </p>
        <h2 className="text-3xl font-bold text-white mb-3">Tebak Foto Selesai!</h2>
        <p className="text-slate-300 mb-6">
          Total skor kenangan kamu: <span className="text-emerald-400 font-mono font-bold text-2xl">{score}</span>
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            type="button"
            onClick={() => {
              const userNim = localStorage.getItem('user_nim');
              localStorage.removeItem(`session_face_${userNim}`); 
              window.location.reload(); 
            }} 
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-8 py-3.5 min-h-[48px] rounded-xl font-bold transition-colors"
          >
            Main Ulang Kuis Foto
          </button>

          <a href="/" className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-700 border border-slate-600 px-8 py-3.5 min-h-[48px] rounded-xl font-bold text-white transition-colors">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const currentPerson = list[currentIndex];

  if (!currentPerson) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-2xl border border-rose-500/40 mt-10 shadow-md max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-rose-400 mb-3">Sesi Kuis Perlu Dimuat Ulang</h2>
        <p className="text-slate-300 mb-6 text-sm">
          Data sesi sebelumnya tidak lengkap. Klik tombol di bawah untuk menyegarkan sesi permainanmu.
        </p>
        <button 
          type="button"
          onClick={() => {
            const userNim = localStorage.getItem('user_nim');
            localStorage.removeItem(`session_face_${userNim}`);
            window.location.reload();
          }} 
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3.5 min-h-[48px] rounded-xl font-bold transition-colors w-full"
        >
          Muat Ulang Sesi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-800 rounded-2xl shadow-md border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-900 border border-emerald-500/30 px-3 py-1 rounded-lg">
          Foto {currentIndex + 1} / 20
        </span>
        <div className={`font-mono font-bold text-xl ${timeLeft <= 10 ? 'text-rose-400' : 'text-amber-400'}`}>
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>
      </div>

      <div className="w-full bg-slate-900 h-2 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        ></div>
      </div>

      <div className="relative aspect-square mb-5 overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-900">
        <img 
          src={`/2016/${currentPerson.nim}.webp`} 
          width="400"
          height="400"
          className={`w-full h-full object-cover ${isRevealed ? 'transition-all duration-700' : 'transition-none'} ${getDynamicBlur()}`}
          alt={`Foto misteri alumni ke-${currentIndex + 1}`}
        />
        {timeLeft === 0 && !isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 text-rose-400 font-bold text-2xl border-2 border-rose-500 m-8 rounded-xl">
            Waktu Habis!
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 mb-6 text-center">
        <p className="text-xs font-mono text-amber-400 uppercase font-bold mb-0.5">Petunjuk</p>
        <p className="text-slate-200 text-sm">{currentPerson.hint || "Teman seangkatan Teknik Lingkungan 2016"}</p>
      </div>

      <div className="space-y-3">
        {!isRevealed ? (
          currentPerson.options.map((opt, idx) => (
            <button 
              key={idx}
              type="button"
              onClick={() => handleGuess(opt)}
              className="w-full min-h-[48px] bg-slate-900 hover:bg-slate-700 border border-slate-600 hover:border-amber-400 py-3.5 px-4 rounded-xl font-bold text-white transition-colors text-base"
            >
              {opt}
            </button>
          ))
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border text-center ${
              selectedAnswer === currentPerson.nama 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}>
              <p className="text-xs font-mono font-bold mb-1 uppercase tracking-wider">
                {selectedAnswer === currentPerson.nama
                  ? `Tebakan Tepat! (+${lastPoints} Poin)`
                  : 'Belum Tepat / Waktu Habis'}
              </p>
              <p className="font-bold text-xl text-white">{currentPerson.nama}</p>
            </div>
            <button 
              type="button"
              onClick={nextPerson}
              className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 py-3.5 px-6 rounded-xl font-bold transition-colors shadow-md"
            >
              Lanjut ke Foto Berikutnya ({currentIndex + 1 > 20 ? 20 : currentIndex + 1}/20)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
