// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard({ onBack }) {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('alumni').select('*');
    
    if (data) {
      // Urutkan dengan 2 Aturan: 
      // 1. Berdasarkan Total Skor tertinggi
      // 2. Kalau skor sama (seri), urutkan berdasarkan NIM dari kecil ke besar
      const sorted = data.sort((a, b) => {
        const totalA = (a.skor_peta || 0) + (a.skor_muka || 0);
        const totalB = (b.skor_peta || 0) + (b.skor_muka || 0);
        
        if (totalB !== totalA) {
          return totalB - totalA; // Urutkan skor
        }
        
        // Kalau skor sama persis, urutkan pakai NIM
        return a.nim.localeCompare(b.nim);
      });
      
      setAlumni(sorted);
    }
    setLoading(false);
  };

  const handleResetScores = async () => {
    const confirm1 = window.confirm("⚠️ PERINGATAN: Yakin mau reset SEMUA skor jadi 0?");
    if (confirm1) {
      const confirm2 = window.prompt("Ketik 'RESET' untuk melanjutkan:");
      if (confirm2 === "RESET") {
        setLoading(true);
        // Reset skor_peta dan skor_muka untuk semua user yang bukan admin
        const { error } = await supabase.from('alumni').update({ skor_peta: 0, skor_muka: 0 }).neq('nim', '0');
        if (!error) {
          alert("✅ Semua skor berhasil di-reset menjadi 0!");
          fetchData();
        } else {
          alert("❌ Gagal reset skor: " + error.message);
        }
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-yellow-500 font-mono text-xl">SINKRONISASI SERVER...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Admin */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-yellow-500 drop-shadow-lg">👑 DASHBOARD ADMIN</h1>
            <p className="text-slate-400 font-mono text-sm">Live Control Panel - 1 Dekade TL16</p>
          </div>
          <button 
            onClick={onBack} 
            className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <span>←</span> Kembali ke Menu
          </button>
        </div>

        {/* Tombol Kontrol */}
        <div className="flex flex-wrap gap-4 mb-8 bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <button 
            onClick={fetchData} 
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex-1 md:flex-none"
          >
            🔄 Refresh Data Live
          </button>
          <button 
            onClick={handleResetScores} 
            className="bg-red-900/80 text-red-300 border border-red-500 hover:bg-red-600 hover:text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex-1 md:flex-none"
          >
            ⚠️ Kosongkan Semua Skor
          </button>
        </div>

        {/* Tabel Klasemen */}
        <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-950 text-yellow-500 font-mono text-sm">
              <tr>
                <th className="p-4 border-b border-slate-700 text-center">RANK</th>
                <th className="p-4 border-b border-slate-700">NAMA ALUMNI</th>
                <th className="p-4 border-b border-slate-700 text-center">SKOR PETA</th>
                <th className="p-4 border-b border-slate-700 text-center">SKOR MUKA</th>
                <th className="p-4 border-b border-slate-700 text-center font-bold text-green-400">TOTAL SKOR</th>
              </tr>
            </thead>
            <tbody>
              {alumni.map((person, index) => {
                const totalSkor = (person.skor_peta || 0) + (person.skor_muka || 0);
                return (
                  <tr key={person.nim} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 text-center font-mono font-bold text-slate-400">#{index + 1}</td>
                    <td className="p-4">
                      <p className="font-bold text-white text-lg">{person.nama}</p>
                      <p className="text-xs text-slate-500 font-mono">{person.nim} {person.is_admin ? '(ADMIN)' : ''}</p>
                    </td>
                    <td className="p-4 text-center text-slate-300 font-mono">{person.skor_peta || 0}</td>
                    <td className="p-4 text-center text-slate-300 font-mono">{person.skor_muka || 0}</td>
                    <td className="p-4 text-center font-black text-green-400 text-xl font-mono">
                      {totalSkor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}