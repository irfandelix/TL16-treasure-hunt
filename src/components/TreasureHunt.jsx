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
  
  const [userGuess, setUserGuess] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [result, setResult] = useState({ distance: 0, points: 0 });

  useEffect(() => {
    const initGame = async () => {
      const userNim = localStorage.getItem('user_nim') || 'guest';
      
      // 1. CEK APAKAH SUDAH PERNAH TAMAT
      const isFinished = localStorage.getItem(`hunt_completed_${userNim}`);
      
      if (isFinished === 'true') {
        const finalScore = localStorage.getItem(`hunt_final_score_${userNim}`) || 0;
        setTotalScore(Number(finalScore));
        setCurrentIdx(20); 
        setLoading(false);
        return;
      }

      // 2. TARIK DATA DARI SUPABASE
      const { data: dbLocations, error } = await supabase
        .from('locations') 
        .select('*');

      if (error) {
        console.error("Gagal mengambil data lokasi dari Supabase:", error);
        alert("Gagal memuat peta. Pastikan internet lancar!");
        setLoading(false);
        return;
      }

      // 3. LOGIKA RESET KEJAM
      if (userNim !== 'guest') {
        await supabase.from('alumni').update({ skor_peta: 0 }).eq('nim', userNim);
      }

      // 4. KocoK Data dari Database
      const shuffled = [...dbLocations].sort(() => 0.5 - Math.random());
      const selected20 = shuffled.slice(0, 20);
      
      setMyMissions(selected20);
      setCurrentIdx(0);
      setTotalScore(0);
      setLoading(false);
    };

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

    if (points >= 80) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    const userNim = localStorage.getItem('user_nim');
    if (userNim !== 'guest') {
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

  // LAYAR LOADING ANIMASI (Saat mengambil data dari Supabase)
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
      <div className="w-16 h-16 border-8 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
      <div className="text-center">
        <h3 className="text-green-500 font-black tracking-widest text-xl mb-2 animate-pulse">MENYAPU RADAR LOKASI...</h3>
        <p className="text-slate-400 text-sm">Menghubungkan ke satelit Nostalgia 16</p>
      </div>
    </div>
  );
  
  if (currentIdx >= 20) {
    return (
      <div className="max-w-xl mx-auto p-10 bg-slate-800 rounded-3xl border border-green-500 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-4">PETUALANGAN SELESAI! 🗺️</h2>
        <p className="text-slate-400 mb-2">Kamu sudah menyelesaikan Napak Tilas ini.</p>
        <p className="text-slate-400 mb-8">Skor Akhir Kamu: <br/><span className="text-green-500 font-bold text-5xl">{totalScore}</span></p>
        
        <div className="flex justify-center">
          <a href="/" className="inline-block bg-green-600 px-8 py-3 rounded-xl font-bold text-white hover:bg-green-500 transition-all">
            🏠 Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  const mission = myMissions[currentIdx];
  const centerMap = [-7.762171406006976, 110.40926671296263]; 

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold text-green-500 uppercase tracking-widest">Enviro 16 Geo-Guesser</h2>
          <p className="text-slate-400 text-sm md:text-base mt-1">Titik {currentIdx + 1} / 20</p>
        </div>
        <div className="bg-slate-900 px-6 py-3 rounded-xl border border-green-500/30 text-center md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end">
          <span className="text-slate-400 text-xs md:text-sm font-bold tracking-widest block mb-0 md:mb-1">SKOR SAAT INI</span>
          <span className="text-2xl md:text-4xl font-black text-green-500">{totalScore}</span>
        </div>
      </div>

      <div className="bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-700 mb-6 relative overflow-hidden shadow-inner">
        <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
        <p className="text-slate-300 italic text-base md:text-xl pl-2">"{mission?.clue}"</p>
      </div>

      <div className="h-[400px] md:h-[550px] w-full rounded-2xl overflow-hidden border-4 border-slate-900 relative z-0 mb-6 shadow-lg">
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
          onClick={handleKunciJawaban}
          disabled={!userGuess}
          className={`w-full py-4 md:py-5 rounded-xl font-bold text-white transition-all text-lg md:text-xl ${
            userGuess 
              ? 'bg-green-600 hover:bg-green-500 active:scale-95 shadow-lg shadow-green-900/50' 
              : 'bg-slate-700 cursor-not-allowed opacity-50'
          }`}
        >
          {userGuess ? 'KUNCI LOKASI INI 🔒' : 'TARUH PIN DI PETA DULU'}
        </button>
      ) : (
        <div className={`p-6 rounded-xl border-2 text-center animate-in zoom-in duration-300 ${
          result.points > 0 ? 'bg-green-900/40 border-green-500' : 'bg-red-900/40 border-red-500'
        }`}>
          <h3 className="text-white font-black text-2xl md:text-3xl mb-2">
            {result.points === 100 ? 'AKURAT BANGET! 🎯' : result.points > 0 ? 'LUMAYAN DEKAT! 📍' : 'NYASAR JAUH! 😭'}
          </h3>
          <p className="text-slate-300 text-base md:text-lg mb-1">
            Aslinya di: <span className="text-white font-bold">{mission?.nama_tempat}</span>
          </p>
          <p className="text-slate-400 text-sm md:text-base mb-3">Meleset: {Math.round(result.distance)} meter</p>
          <p className="text-3xl md:text-4xl font-black text-yellow-400 mb-6">+{result.points} Poin</p>
          
          <button 
            onClick={handleNextMission}
            className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-md text-lg"
          >
            Lanjut Titik {currentIdx + 2 > 20 ? 'Terakhir' : currentIdx + 2} →
          </button>
        </div>
      )}

    </div>
  );
}