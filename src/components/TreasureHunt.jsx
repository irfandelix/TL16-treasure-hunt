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

export default function TreasureHunt() {
  const [myMissions, setMyMissions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [userGuess, setUserGuess] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [result, setResult] = useState({ distance: 0, points: 0 });

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

    const { data: dbLocations, error } = await supabase
      .from('locations') 
      .select('*');

    if (error || !dbLocations) {
      console.error("Gagal mengambil data lokasi dari Supabase:", error);
      setErrorMsg("Gagal memuat peta lokasi kenangan. Pastikan koneksi internet lancar dan coba lagi.");
      setLoading(false);
      return;
    }

    if (userNim !== 'guest') {
      await supabase.from('alumni').update({ skor_peta: 0 }).eq('nim', userNim);
    }

    const shuffled = [...dbLocations].sort(() => 0.5 - Math.random());
    const selected20 = shuffled.slice(0, 20);
    
    setMyMissions(selected20);
    setCurrentIdx(0);
    setTotalScore(0);
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
    if (!userGuess) return;

    const mission = myMissions[currentIdx];
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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (points >= 80 && !prefersReducedMotion) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    const userNim = localStorage.getItem('user_nim');
    if (userNim && userNim !== 'guest') {
      await supabase.from('alumni').update({ skor_peta: newScore }).eq('nim', userNim);
    }
  };

  const handleNextMission = () => {
    const nextIdx = currentIdx + 1;
    setCurrentIdx(nextIdx);
    setUserGuess(null);
    setIsRevealed(false);

    if (nextIdx >= 20) {
      const userNim = localStorage.getItem('user_nim');
      localStorage.setItem(`hunt_completed_${userNim}`, 'true');
      localStorage.setItem(`hunt_final_score_${userNim}`, totalScore.toString());
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
        <div className="text-center">
          <h3 className="text-emerald-400 font-bold text-lg mb-1">Menyiapkan Peta Napak Tilas...</h3>
          <p className="text-slate-300 text-sm">Memuat 20 titik kenangan kampus dan tongkrongan TL 2016</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div role="alert" className="max-w-xl mx-auto p-8 bg-slate-800 rounded-2xl border border-rose-500/40 text-center shadow-md">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Gagal Memuat Peta</h2>
        <p className="text-slate-300 text-sm mb-6">{errorMsg}</p>
        <button
          type="button"
          onClick={initGame}
          className="px-6 py-3 min-h-[44px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }
  
  if (currentIdx >= 20) {
    return (
      <div className="max-w-xl mx-auto p-8 md:p-10 bg-slate-800 rounded-2xl border border-emerald-500/50 text-center shadow-md">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
          Napak Tilas Selesai
        </p>
        <h2 className="text-3xl font-bold text-white mb-3">Petualangan Peta Selesai!</h2>
        <p className="text-slate-300 mb-4">Kamu sudah menelusuri kembali 20 lokasi kenangan Sedulur 16.</p>
        <p className="text-slate-300 mb-8">
          Skor Akhir Kamu:<br />
          <span className="text-emerald-400 font-mono font-bold text-5xl">{totalScore}</span>
        </p>
        
        <div className="flex justify-center">
          <a href="/" className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 px-8 py-3.5 min-h-[48px] rounded-xl font-bold text-slate-950 transition-colors">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const mission = myMissions[currentIdx];
  const centerMap = [-7.762171406006976, 110.40926671296263]; 

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 bg-slate-800 rounded-2xl shadow-md border border-slate-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            Titik Kenangan {currentIdx + 1} dari 20
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Napak Tilas Kampus & Jogja</h2>
        </div>
        <div className="bg-slate-900 px-5 py-3 rounded-xl border border-emerald-500/30 text-center md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end">
          <span className="text-slate-300 text-xs font-mono font-bold tracking-wider block">SKOR SAAT INI</span>
          <span className="text-2xl md:text-3xl font-mono font-bold text-emerald-400">{totalScore}</span>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 mb-6">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase mb-1">Petunjuk Lokasi:</p>
        <p className="text-slate-100 text-base md:text-lg leading-relaxed">{mission?.clue}</p>
      </div>

      <div className="h-[380px] md:h-[500px] w-full rounded-xl overflow-hidden border-2 border-slate-700 relative z-0 mb-6 shadow-md">
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
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md' 
              : 'bg-slate-700 text-slate-300 cursor-not-allowed'
          }`}
        >
          {userGuess ? 'Kunci Titik Lokasi Ini' : 'Klik pada Peta untuk Menaruh Pin Tebakan'}
        </button>
      ) : (
        <div className={`p-6 rounded-xl border text-center ${
          result.points > 0 ? 'bg-emerald-950/50 border-emerald-500/50' : 'bg-rose-950/50 border-rose-500/50'
        }`}>
          <h3 className="text-white font-bold text-2xl mb-2">
            {result.points === 100 ? 'Tepat Sasaran!' : result.points > 0 ? 'Cukup Dekat!' : 'Masih Meleset Jauh'}
          </h3>
          <p className="text-slate-200 text-base mb-1">
            Lokasi sebenarnya: <span className="text-white font-bold">{mission?.nama_tempat}</span>
          </p>
          <p className="text-slate-300 text-sm mb-3">Selisih jarak: {Math.round(result.distance)} meter</p>
          <p className="text-3xl font-mono font-bold text-amber-400 mb-6">+{result.points} Poin</p>
          
          <button 
            type="button"
            onClick={handleNextMission}
            className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 py-3.5 px-6 rounded-xl font-bold transition-colors shadow-md text-base"
          >
            Lanjut ke Titik {currentIdx + 2 > 20 ? 'Terakhir' : currentIdx + 2}
          </button>
        </div>
      )}

    </div>
  );
}
