import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';
import locationsData from '../data/locations.json';

// Fix untuk icon Leaflet yang kadang tidak muncul di React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icon khusus untuk lokasi yang sudah ditebak (Warna Hijau)
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
    // Ambil progres dari localStorage saat komponen dimuat
    const userNim = localStorage.getItem('user_nim');
    const savedSession = localStorage.getItem(`session_map_${userNim}`);
    
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setSolvedLocations(data.solved);
      setScore(data.score);
    }
  }, []);

  const handleGuess = async (location) => {
    // Toleransi tebakan (lowercase)
    if (guess.toLowerCase().trim() === location.nama_tempat.toLowerCase()) {
      const newSolved = [...solvedLocations, location.id];
      const newScore = score + 1;
      
      setSolvedLocations(newSolved);
      setScore(newScore);
      setGuess("");
      
      // Simpan ke localStorage
      const userNim = localStorage.getItem('user_nim');
      localStorage.setItem(`session_map_${userNim}`, JSON.stringify({
        solved: newSolved,
        score: newScore
      }));

      // Update skor peta di Supabase
      await supabase.from('alumni').update({ skor_peta: newScore }).eq('nim', userNim);
      
      alert("BENAR! Memori berhasil dibuka.");
    } else {
      alert("Salah! Coba ingat-ingat lagi nama tempatnya.");
    }
  };

  // Titik tengah peta saat pertama kali diload (misal: koordinat fakultas)
  const centerMap = locationsData[0]?.kordinat || [-7.7694, 110.3777];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-500">Napak Tilas TL16</h2>
          <p className="text-slate-400 text-sm">Klik pin di peta dan tebak nama lokasinya!</p>
        </div>
        <div className="bg-slate-900 px-6 py-3 rounded-xl border border-green-500/30">
          <span className="text-slate-400 text-sm block">SKOR PETA</span>
          <span className="text-3xl font-bold text-green-500">{score} / {locationsData.length}</span>
        </div>
      </div>

      {/* Container Peta */}
      <div className="h-[500px] w-full rounded-2xl overflow-hidden border-4 border-slate-900 relative z-0">
        <MapContainer center={centerMap} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          {/* Menggunakan basemap CartoDB Dark Matter agar sesuai tema dark mode web */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {locationsData.map((loc) => {
            const isSolved = solvedLocations.includes(loc.id);
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
                        <p className="text-green-600 font-bold mb-1">Terpecahkan!</p>
                        <p className="font-bold text-lg">{loc.nama_tempat}</p>
                        <p className="text-sm italic mt-2 text-gray-600">"{loc.clue}"</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="font-bold text-gray-800">Mystery Spot</p>
                        <p className="text-sm italic text-gray-600">"{loc.clue}"</p>
                        <input 
                          type="text" 
                          placeholder="Nama tempat..."
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500 text-center"
                        />
                        <button 
                          onClick={() => handleGuess(loc)}
                          className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-500 transition-colors"
                        >
                          TEBAK
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