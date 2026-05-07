// src/components/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [nim, setNim] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!nim.trim()) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .eq('nim', nim)
      .single();

    if (error || !data) {
      alert("NIM tidak ditemukan. Pastikan ketikan sudah benar!");
      setLoading(false);
      return;
    }

    localStorage.setItem('user_nim', data.nim);
    localStorage.setItem('user_nama', data.nama);
    localStorage.setItem('is_admin', data.is_admin);
    
    onLoginSuccess(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          {/* Teks sudah diganti fokus ke Teknik Lingkungan */}
          <p className="text-green-500 font-bold tracking-widest text-sm mb-2">
            TEKNIK LINGKUNGAN
          </p>
          <h1 className="text-3xl font-bold text-white mb-2">1 Dekade Angkatan 16</h1>
          <p className="text-slate-400">Masukkan NIM untuk memulai napak tilas</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input 
              type="text" 
              placeholder="NIM (Misal: 114160001)" 
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="w-full bg-slate-900 text-white border border-slate-600 p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-xl tracking-widest font-mono"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center"
          >
            {loading ? 'Mengecek Database...' : 'MASUK KE GAME'}
          </button>
        </form>
      </div>
    </div>
  );
}