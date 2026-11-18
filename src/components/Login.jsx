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

    if (!nim.trim()) {
      setError('Masukkan NIM kamu terlebih dahulu.');
      setLoading(false);
      return;
    }

    const { data, error: supabaseError } = await supabase
      .from('alumni')
      .select('*')
      .eq('nim', nim.trim())
      .single();

    if (supabaseError || !data) {
      setError('NIM tidak terdaftar atau koneksi ke server sedang terkendala.');
      setLoading(false);
      return;
    }

    localStorage.setItem('user_nim', data.nim);
    localStorage.setItem('user_nama', data.nama);
    localStorage.setItem('is_admin', Boolean(data.is_admin).toString());
    if (data.avatar_config) {
      localStorage.setItem(`avatar_config_${data.nim}`, JSON.stringify(data.avatar_config));
    }
    sessionStorage.removeItem(`avatar_confirmed_${data.nim}`);

    setLoading(false);
    onLoginSuccess({ ...data, is_admin: Boolean(data.is_admin) });
  };

  return (
    <main className="min-h-screen bg-[#F4F6F9] flex justify-center items-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-[0_14px_40px_-12px_rgba(15,23,42,0.1)] w-full max-w-md relative">
        <header className="text-center mb-8 flex flex-col items-center border-b border-slate-100 pb-6">
          <h1 className="w-full flex justify-center">
            <img
              src="/Asset 2.webp"
              alt="Happy Anniversary Teknik Lingkungan 2016"
              width="280"
              height="109"
              fetchPriority="high"
              className="w-full max-w-[260px] h-auto"
            />
          </h1>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            Masuk dengan NIM angkatan untuk mendesain karaktermu dan bermain bersama Sedulur 16.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-sm text-center mb-6 font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="nim-input" className="block text-slate-800 font-semibold text-sm">
              Nomor Induk Mahasiswa (NIM)
            </label>
            <input
              id="nim-input"
              type="text"
              inputMode="numeric"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Contoh: 114160001"
              maxLength={11}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 font-mono text-base placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white transition-colors min-h-[48px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600 py-3.5 px-6 rounded-xl font-bold text-white text-base transition-colors min-h-[48px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin"
                />
                <span>Memeriksa Data Alumni...</span>
              </>
            ) : (
              'Masuk & Desain Karakter'
            )}
          </button>
        </form>

        <footer className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-500 text-xs space-y-1">
          <p className="font-semibold text-slate-800">Teknik Lingkungan UPN &ldquo;Veteran&rdquo; Yogyakarta 2016</p>
          <p>Gunakan NIM angkatan 2016 untuk membuka profil dan catatan skormu.</p>
        </footer>
      </div>
    </main>
  );
}
