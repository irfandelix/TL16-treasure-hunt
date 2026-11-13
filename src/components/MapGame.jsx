import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';
import locationsData from '../data/locations.json';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const solvedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapGame() {
  const [score, setScore] = useState(0);
  const [solvedLocations, setSolvedLocations] = useState([]);
  const [guess, setGuess] = useState("");

  useEffect(() => {
    const userNim = localStorage.getItem('user_nim');
    const savedSession = localStorage.getItem(`session_map_${userNim}`);
    
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setSolvedLocations(data.solved);
      setScore(data.score);
    }
  }, []);

  const handleGuess = async (location) => {
    if (guess.toLowerCase().trim() === location.nama_tempat.toLowerCase()) {
      const newSolved = [...solvedLocations, location.id];
      const newScore = score + 1;
      
      setSolvedLocations(newSolved);
      setScore(newScore);
      setGuess("");
      
      const userNim = localStorage.getItem('user_nim');
      localStorage.setItem(`session_map_${userNim}`, JSON.stringify({
        solved: newSolved,
        score: newScore
      }));

      await supabase.from('alumni').update({ skor_peta: newScore }).eq('nim', userNim);
      
      alert("Benar! Memori lokasi berhasil dibuka.");
    } else {
      alert("Belum tepat! Coba ingat-ingat lagi nama tempatnya.");
    }
  };

  const centerMap = locationsData[0]?.kordinat || [-7.7694, 110.3777];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-800 rounded-2xl shadow-md border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-400">Napak Tilas TL 2016</h2>
          <p className="text-slate-300 text-sm">Klik pin di peta dan tebak nama lokasinya!</p>
        </div>
        <div className="bg-slate-900 px-5 py-3 rounded-xl border border-emerald-500/30">
          <span className="text-slate-300 text-xs font-mono font-bold block">SKOR PETA</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">{score} / {locationsData.length}</span>
        </div>
      </div>

      <div className="h-[500px] w-full rounded-xl overflow-hidden border-2 border-slate-700 relative z-0">
        <MapContainer center={centerMap} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {locationsData.map((loc) => {
            const isSolved = solvedLocations.includes(loc.id);
            const inputId = `map-guess-${loc.id}`;
            return (
              <Marker 
                key={loc.id} 
                position={loc.kordinat}
                icon={isSolved ? solvedIcon : L.Icon.Default}
              >
                <Popup className="custom-popup">
                  <div className="text-center p-2">
                    {isSolved ? (
                      <div>
                        <p className="text-emerald-700 font-bold mb-1">Terpecahkan!</p>
                        <p className="font-bold text-lg text-slate-900">{loc.nama_tempat}</p>
                        <p className="text-sm mt-2 text-slate-700">{loc.clue}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="font-bold text-slate-900">Titik Kenangan</p>
                        <p className="text-sm text-slate-700">{loc.clue}</p>
                        <label htmlFor={inputId} className="sr-only">
                          Tebak nama tempat
                        </label>
                        <input 
                          id={inputId}
                          type="text" 
                          placeholder="Nama tempat..."
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          className="w-full border border-slate-400 p-2 rounded text-slate-900 text-center"
                        />
                        <button 
                          type="button"
                          onClick={() => handleGuess(loc)}
                          className="w-full min-h-[44px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                          Tebak Lokasi
                        </button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
