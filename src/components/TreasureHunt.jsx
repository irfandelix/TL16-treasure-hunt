import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const targetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const deltaP = (lat2-lat1) * Math.PI/180;
  const deltaLon = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaP/2) * Math.sin(deltaP/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

export default function TreasureHunt({ onBack }) {
  const [myMissions, setMyMissions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [userGuess, setUserGuess] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [result, setResult] = useState({ distance: 0, points: 0 });

  const saveHuntSession = (missions, idx, scr) => {
    const userNim = localStorage.getItem('user_nim') || 'guest';
    localStorage.setItem(`session_hunt_${userNim}`, JSON.stringify({
      missions,
      currentIdx: idx,
      totalScore: scr
    }));
  };

  const initGame = async () => {
    setLoading(true);
    setErrorMsg('');
    const userNim = localStorage.getItem('user_nim') || 'guest';
    
    const isFinished = localStorage.getItem(`hunt_completed_${userNim}`);
    
    if (isFinished === 'true') {
      const finalScore = localStorage.getItem(`hunt_final_score_${userNim}`) || 0;
      setTotalScore(Number(finalScore));
      setCurrentIdx(20); 
      setLoading(false);
      return;
    }

    const savedSession = localStorage.getItem(`session_hunt_${userNim}`);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (Array.isArray(parsed.missions) && parsed.missions.length > 0) {
          setMyMissions(parsed.missions);
          setCurrentIdx(parsed.currentIdx || 0);
          setTotalScore(parsed.totalScore || 0);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Gagal membaca sesi peta:', e);
      }
    }

    const { data: dbLocations, error } = await supabase
      .from('locations') 
      .select('*');

    if (error || !dbLocations) {
      console.error("Gagal mengambil data lokasi dari Supabase:", error);
      setErrorMsg("Gagal memuat peta lokasi kenangan. Pastikan koneksi internet lancar dan coba lagi.");
      setLoading(false);
      return;
    }

    const shuffled = [...dbLocations].sort(() => 0.5 - Math.random());
    const selected20 = shuffled.slice(0, 20);
    
    setMyMissions(selected20);
    setCurrentIdx(0);
    setTotalScore(0);
    setUserGuess(null);
    setIsRevealed(false);
    setResult({ distance: 0, points: 0 });
    saveHuntSession(selected20, 0, 0);
    setLoading(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        if (!isRevealed) {
          setUserGuess(e.latlng);
        }
      },
    });
    return userGuess === null ? null : <Marker position={userGuess} icon={defaultIcon}></Marker>;
  };

  const handleKunciJawaban = async () => {
    const mission = myMissions[currentIdx];
    if (!userGuess || !mission) return;
    const distanceMeters = getDistance(userGuess.lat, userGuess.lng, mission.kordinat[0], mission.kordinat[1]);
    
    let points = 0;
    if (distanceMeters <= 50) points = 100;
    else if (distanceMeters <= 250) points = 80;
    else if (distanceMeters <= 1000) points = 50;
    else if (distanceMeters <= 5000) points = 20;
    else points = 0;

    setResult({ distance: distanceMeters, points });
    setIsRevealed(true);

    const newScore = totalScore + points;
    setTotalScore(newScore);
    saveHuntSession(myMissions, currentIdx, newScore);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (points >= 80 && !prefersReducedMotion) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    const userNim = localStorage.getItem('user_nim');
    if (userNim && userNim !== 'guest') {
      const { data: existing } = await supabase
        .from('alumni')
        .select('skor_peta')
        .eq('nim', userNim)
        .single();
      const bestScore = Math.max(existing?.skor_peta || 0, newScore);
      await supabase.from('alumni').update({ skor_peta: bestScore }).eq('nim', userNim);
    }
  };

  const handleNextMission = () => {
    const nextIdx = currentIdx + 1;
    setCurrentIdx(nextIdx);
    setUserGuess(null);
    setIsRevealed(false);

    if (nextIdx >= 20) {
      const userNim = localStorage.getItem('user_nim') || 'guest';
      localStorage.setItem(`hunt_completed_${userNim}`, 'true');
      localStorage.setItem(`hunt_final_score_${userNim}`, totalScore.toString());
      localStorage.removeItem(`session_hunt_${userNim}`);
    } else {
      saveHuntSession(myMissions, nextIdx, totalScore);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#DED6C6] border-t-green-900 rounded-full animate-spin"></div>
        <div className="text-center">
          <h3 className="text-stone-900 font-bold text-lg mb-1">Menyiapkan Peta Napak Tilas...</h3>
          <p className="text-stone-600 text-sm">Memuat 20 titik kenangan kampus dan tongkrongan TL 2016</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div role="alert" className="max-w-xl mx-auto p-8 bg-white rounded-2xl border border-rose-300 text-center">
        <h2 className="text-xl font-bold text-rose-800 mb-2">Gagal Memuat Peta</h2>
        <p className="text-stone-600 text-sm mb-6">{errorMsg}</p>
        <button
          type="button"
          onClick={initGame}
          className="px-6 py-3 min-h-[44px] bg-green-900 hover:bg-green-800 text-white font-bold rounded-xl transition-colors"
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

  if (currentIdx >= 20) {
    return (
      <div className="max-w-xl mx-auto p-8 md:p-10 bg-white rounded-2xl border border-[#DED6C6] text-center">
        <h2 className="text-3xl font-bold text-stone-900 mb-3">Petualangan Peta Selesai!</h2>
        <p className="text-stone-600 mb-4">Kamu sudah menelusuri kembali 20 lokasi kenangan Sedulur 16.</p>
        <p className="text-stone-600 mb-8">
          Skor Akhir Kamu:<br />
          <span className="text-green-900 font-mono font-bold text-5xl">{totalScore}</span>
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              const userNim = localStorage.getItem('user_nim') || 'guest';
              localStorage.removeItem(`hunt_completed_${userNim}`);
              localStorage.removeItem(`hunt_final_score_${userNim}`);
              localStorage.removeItem(`session_hunt_${userNim}`);
              initGame();
            }}
            className="inline-flex items-center justify-center bg-green-900 hover:bg-green-800 px-8 py-3.5 min-h-[48px] rounded-xl font-bold text-white transition-colors"
          >
            Main Ulang Napak Tilas
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

  const mission = myMissions[currentIdx];
  const centerMap = [-7.762171406006976, 110.40926671296263]; 

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-2xl border border-[#DED6C6]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-green-900 bg-green-100 px-2.5 py-1 rounded-md inline-block mb-1.5">
            Titik {currentIdx + 1} dari 20
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900">Napak Tilas Kampus &amp; Jogja</h2>
        </div>
        <div className="bg-[#FAF6EE] px-5 py-3 rounded-xl border border-[#DED6C6] text-center md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end">
          <span className="text-stone-600 text-xs font-mono font-bold tracking-wider block">SKOR SAAT INI</span>
          <span className="text-2xl md:text-3xl font-mono font-bold text-green-900">{totalScore}</span>
        </div>
      </div>

      <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#DED6C6] mb-6">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Petunjuk Lokasi</p>
        <p className="text-stone-900 text-base md:text-lg leading-relaxed">{mission?.clue}</p>
      </div>

      <div className="h-[46dvh] min-h-[300px] max-h-[500px] md:h-[500px] w-full rounded-xl overflow-hidden border border-[#DED6C6] relative z-0 mb-6">
        <MapContainer 
          center={centerMap} 
          zoom={17} 
          className="w-full h-full" 
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <LocationMarker />
          
          {isRevealed && (
            <Marker position={mission.kordinat} icon={targetIcon} />
          )}
        </MapContainer>
      </div>

      {!isRevealed ? (
        <button 
          type="button"
          onClick={handleKunciJawaban}
          disabled={!userGuess}
          className={`w-full py-4 min-h-[48px] rounded-xl font-bold transition-colors text-base md:text-lg ${
            userGuess 
              ? 'bg-green-900 hover:bg-green-800 text-white' 
              : 'bg-stone-200 text-stone-500 cursor-not-allowed'
          }`}
        >
          {userGuess ? 'Kunci Titik Lokasi Ini' : 'Klik pada Peta untuk Menaruh Pin Tebakan'}
        </button>
      ) : (
        <div className={`p-6 rounded-xl border text-center ${
          result.points > 0 ? 'bg-green-50 border-green-300' : 'bg-rose-50 border-rose-300'
        }`}>
          <h3 className="text-stone-900 font-bold text-2xl mb-2">
            {result.points === 100 ? 'Tepat Sasaran!' : result.points > 0 ? 'Cukup Dekat!' : 'Masih Meleset Jauh'}
          </h3>
          <p className="text-stone-700 text-base mb-1">
            Lokasi sebenarnya: <span className="text-stone-900 font-bold">{mission?.nama_tempat}</span>
          </p>
          <p className="text-stone-600 text-sm mb-3">Selisih jarak: {Math.round(result.distance)} meter</p>
          <p className="text-3xl font-mono font-bold text-amber-700 mb-6">+{result.points} Poin</p>
          
          <button 
            type="button"
            onClick={handleNextMission}
            className="w-full min-h-[48px] bg-green-900 hover:bg-green-800 text-white py-3.5 px-6 rounded-xl font-bold transition-colors text-base"
          >
            Lanjut ke Titik {currentIdx + 2 > 20 ? 'Terakhir' : currentIdx + 2}
          </button>
        </div>
      )}

    </div>
  );
}
