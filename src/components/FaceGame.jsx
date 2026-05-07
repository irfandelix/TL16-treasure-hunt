// src/components/FaceGame.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

export default function FaceGame() {
  const [list, setList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lastPoints, setLastPoints] = useState(0);
  
  // State Timer
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Fungsi untuk mengatur tingkat blur berdasarkan sisa waktu (turun tiap 10 detik)
  const getDynamicBlur = () => {
    if (isRevealed) return 'blur-0'; // Langsung jelas kalau sudah dijawab
    if (timeLeft > 50) return 'blur-3xl'; // 60s - 51s: Paling ngeblur
    if (timeLeft > 40) return 'blur-2xl'; // 50s - 41s
    if (timeLeft > 30) return 'blur-xl';  // 40s - 31s
    if (timeLeft > 20) return 'blur-lg';  // 30s - 21s
    if (timeLeft > 10) return 'blur-md';  // 20s - 11s
    return 'blur-sm';                     // 10s - 1s: Hampir jelas
  };
  
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  // Logic Timer Berjalan
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

  // Fungsi membuat 3 opsi pilihan (Satu Gender, 1 Benar, 2 Salah)
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
    const userNim = localStorage.getItem('user_nim');
    const savedSession = localStorage.getItem(`session_face_${userNim}`);

    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      setList(sessionData.list);
      setCurrentIndex(sessionData.currentIndex);
      setScore(sessionData.score);
    } else {
      const { data } = await supabase.from('alumni').select('*');
      if (data && data.length > 0) {
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected20 = shuffled.slice(0, 20).map(person => {
          return {
            ...person,
            options: generateOptions(person, data) 
          };
        });
        
        setList(selected20);
        updateLocalSession(selected20, 0, 0);
      }
    }
    setLoading(false);
    setTimerActive(true);
  };

  const handleTimeOut = () => {
    setTimerActive(false);
    setIsRevealed(true);
    setSelectedAnswer("WAKTU HABIS");
  };

  const handleGuess = async (guessName) => {
    if (isRevealed) return; // Mencegah user dobel klik

    setTimerActive(false);
    setIsRevealed(true);
    setSelectedAnswer(guessName);

    const currentPerson = list[currentIndex];
    if (!currentPerson) return; // Aman jika di-klik saat data kosong

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
      
      confetti({ particleCount: 150, spread: 80, origin: { x: 0, y: 0.9 }, angle: 45, zIndex: 100 });
      confetti({ particleCount: 150, spread: 80, origin: { x: 1, y: 0.9 }, angle: 135, zIndex: 100 });
      
      const userNim = localStorage.getItem('user_nim');
      if (userNim !== 'guest') {
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

  if (loading) return <div className="text-center p-10 text-green-500 font-mono flex flex-col items-center justify-center mt-20"><div className="w-12 h-12 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin mb-4"></div>MENYIAPKAN TARGET...</div>;
  
  if (currentIndex >= 20) return (
    <div className="text-center p-10 bg-slate-800 rounded-3xl border border-green-500 shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-4">MISSION COMPLETE! 🏁</h2>
      <p className="text-slate-400 mb-6">Total skor kamu: <span className="text-green-500 font-bold text-2xl">{score}</span></p>
      
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => {
            const userNim = localStorage.getItem('user_nim');
            localStorage.removeItem(`session_face_${userNim}`); 
            window.location.reload(); 
          }} 
          className="bg-blue-600 px-8 py-3 rounded-xl font-bold text-white hover:bg-blue-500 transition-all"
        >
          🔄 Main Ulang Game
        </button>

        <a href="/" className="inline-block bg-green-600 px-8 py-3 rounded-xl font-bold text-white hover:bg-green-500 transition-all">
          🏠 Kembali ke Dashboard
        </a>
      </div>
    </div>
  );

  const currentPerson = list[currentIndex];

  // ==========================================
  // 🛡️ SABUK PENGAMAN (GUARD CLAUSE) ANTI CRASH
  // ==========================================
  if (!currentPerson) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-3xl border border-red-500 mt-10 shadow-2xl max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-red-500 mb-4">DATA NYANGKUT! 🚨</h2>
        <p className="text-slate-300 mb-6 text-sm">
          Sistem gagal membaca memori lokasi. Ini wajar saat masa pembuatan. Klik tombol di bawah untuk membersihkan cache perangkatmu.
        </p>
        <button 
          onClick={() => {
            const userNim = localStorage.getItem('user_nim');
            localStorage.removeItem(`session_face_${userNim}`);
            window.location.reload();
          }} 
          className="bg-red-600 px-6 py-4 rounded-xl font-bold text-white hover:bg-red-500 transition-all w-full shadow-lg"
        >
          🧹 Bersihkan Cache & Restart
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-mono text-green-500 border border-green-500/30 px-2 py-1 rounded">
          ALUMNI {currentIndex + 1} / 20
        </span>
        <div className={`font-mono font-bold text-xl ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>
      </div>

      {/* Progress Bar Waktu */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        ></div>
      </div>

      {/* Foto Alumni */}
      <div className="relative aspect-square mb-6 overflow-hidden rounded-2xl border-4 border-slate-900 bg-slate-900">
        <img 
          src={`/2016/${currentPerson.nim}.webp`} 
          // 👇 UBAH CLASSNAME INI: Transisi hanya aktif saat isRevealed = true
          className={`w-full h-full object-cover ${isRevealed ? 'transition-all duration-1000' : 'transition-none'} ${getDynamicBlur()}`}
          alt="Mystery Alumni"
        />
        {timeLeft === 0 && !isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-500 font-black text-2xl rotate-12 border-4 border-red-500 m-10">
            WAKTU HABIS!
          </div>
        )}
      </div>

      <p className="text-center text-slate-300 text-sm mb-6 italic">"{currentPerson.hint || "Anak TL16..."}"</p>

      {/* Opsi Pilihan Ganda & Feedback */}
      <div className="space-y-3">
        {!isRevealed ? (
          currentPerson.options.map((opt, idx) => (
            <button 
              key={idx}
              onClick={() => handleGuess(opt)}
              className="w-full bg-slate-900 hover:bg-slate-700 border border-slate-600 py-4 rounded-xl font-bold text-white transition-all active:scale-95 text-lg"
            >
              {opt}
            </button>
          ))
        ) : (
          <div className="animate-in fade-in zoom-in duration-300 space-y-4">
            <div className={`p-4 rounded-xl border text-center ${
              selectedAnswer === currentPerson.nama 
                ? 'bg-green-900/30 border-green-500 text-green-400' 
                : 'bg-red-900/30 border-red-500 text-red-400'
            }`}>
              <p className="text-xs mb-1 uppercase tracking-widest">
                {selectedAnswer === currentPerson.nama ? `Tebakan Benar! (+${lastPoints} Poin)` : 'Jawaban Salah / Waktu Habis'}
              </p>
              <p className="font-bold text-xl uppercase text-white">{currentPerson.nama}</p>
            </div>
            <button 
              onClick={nextPerson}
              className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-xl"
            >
              LANJUT ({currentIndex + 1 > 20 ? 20 : currentIndex + 1}/20) →
            </button>
          </div>
        )}
      </div>

      {/* EFEK DEPRESI ANIME FULL SCREEN (BILA SALAH) */}
      {isRevealed && selectedAnswer !== currentPerson.nama && selectedAnswer !== null && (
        <div className="fixed inset-0 z-50 pointer-events-none flex justify-center backdrop-grayscale backdrop-contrast-125 backdrop-brightness-75 transition-all duration-1000">
          <div 
            className="absolute inset-0 opacity-40 animate-pulse"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0 L20 30 L40 60 L20 90 L40 120' fill='none' stroke='black' stroke-width='25' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 120px',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 70%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 70%)'
            }}
          ></div>
          <div 
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(51, 65, 85, 0.9) 0%, rgba(51, 65, 85, 0.4) 40%, transparent 100%)' }}
          ></div>
          <div className="absolute top-32 text-8xl opacity-90 animate-bounce drop-shadow-2xl">
            😭
          </div>
        </div>
      )}
    </div>
  );
}