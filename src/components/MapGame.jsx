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
  const [feedback, setFeedback] = useState(null);

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
      
      setFeedback({ type: 'success', text: `Benar! Memori lokasi "${location.nama_tempat}" berhasil dibuka.` });
    } else {
      setFeedback({ type: 'error', text: 'Belum tepat! Coba ingat-ingat lagi nama tempatnya.' });
    }
  };

  const centerMap = locationsData[0]?.kordinat || [-7.7694, 110.3777];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-2xl border border-[#DED6C6]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Napak Tilas TL 2016</h2>
          <p className="text-stone-600 text-sm">Klik pin di peta dan tebak nama lokasinya!</p>
        </div>
        <div className="bg-[#FAF6EE] px-5 py-3 rounded-xl border border-[#DED6C6]">
          <span className="text-stone-600 text-xs font-mono font-bold block">SKOR PETA</span>
          <span className="text-2xl font-mono font-bold text-green-900">{score} / {locationsData.length}</span>
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-900'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Tutup notifikasi"
            className="min-w-[36px] min-h-[36px] rounded-lg bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold px-2 border border-[#DED6C6]"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="h-[500px] w-full rounded-xl overflow-hidden border border-[#DED6C6] relative z-0">
        <MapContainer center={centerMap} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
