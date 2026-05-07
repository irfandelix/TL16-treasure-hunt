// src/components/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [nim, setNim] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!nim) {
      setError('NIM wajib diisi bos!');
      setLoading(false);
      return;
    }

    // Ambil data user berdasarkan NIM dari Supabase
    const { data, error: supabaseError } = await supabase
      .from('alumni')
      .select('*')
      .eq('nim', nim)
      .single();

    if (supabaseError || !data) {
      setError('NIM tidak terdaftar atau server lagi pusing!');
      setLoading(false);
      return;
    }

    // Simpan sesi di localStorage perangkat
    localStorage.setItem('user_nim', data.nim);
    localStorage.setItem('user_nama', data.nama);
    localStorage.setItem('is_admin', data.is_admin);

    setLoading(false);
    onLoginSuccess(data); // Beritahu dashboard kalau login sukses
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        
        {/* ========================================= */}
        {/* HEADER LOGO ANNIVERSARY (GANTI TULISAN) */}
        {/* ========================================= */}
        <div className="text-center mb-12 flex justify-center">
          <img 
            src="/Asset 2.webp" // <--- Memanggil file dari folder public
            alt="Happy Anniversary TL 2016" 
            className="w-full max-w-[280px] h-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]"
          />
        </div>
        {/* ========================================= */}

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 p-3 rounded-lg text-sm text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label htmlFor="nim" className="text-slate-400 font-mono text-xs uppercase tracking-widest">
              Masukkan NIM Kamu
            </label>
            <input
              id="nim"
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Contoh: 114160001"
              maxLength={11}
              className="w-full bg-slate-900 border border-slate-600 p-4 rounded-xl text-white font-mono text-lg placeholder:text-slate-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full ${loading ? 'bg-slate-700' : 'bg-green-600 hover:bg-green-500'} py-4 rounded-xl font-bold text-white text-lg transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                Memverifikasi...
              </>
            ) : (
              'MASUK & MAIN 🎉'
            )}
          </button>
        </form>

        <footer className="mt-12 text-center text-slate-600 text-xs tracking-wider">
          <p>Portal Nostalgia Internal TL16</p>
          <p>Pastikan koneksi internet lancar jaya!</p>
        </footer>

        {/* Dekorasi Latar Belakang */}
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
}