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

    setLoading(false);
    onLoginSuccess({ ...data, is_admin: Boolean(data.is_admin) });
  };

  return (
    <main className="min-h-screen bg-[#FAF6EE] flex justify-center items-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-[#DED6C6] shadow-[0_12px_36px_-12px_rgba(28,25,23,0.12)] w-full max-w-md relative">
        <header className="text-center mb-8 flex flex-col items-center border-b border-[#DED6C6] pb-6">
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
          <p className="text-sm text-stone-600 mt-4 leading-relaxed">
            Masuk dengan NIM angkatan untuk membuka buku kenangan dan bermain bersama Sedulur 16.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-300 text-rose-800 p-3.5 rounded-xl text-sm text-center mb-6 font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="nim-input" className="block text-stone-800 font-semibold text-sm">
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
              className="w-full bg-[#FAF6EE] border border-[#C7BDA8] p-3.5 rounded-xl text-stone-900 font-mono text-base placeholder:text-stone-400 focus:border-green-800 focus:bg-white transition-colors min-h-[48px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-900 hover:bg-green-800 active:bg-green-950 disabled:bg-stone-300 disabled:text-stone-600 py-3.5 px-6 rounded-xl font-bold text-white text-base transition-colors min-h-[48px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-5 h-5 border-2 border-stone-300 border-t-white rounded-full animate-spin"
                />
                <span>Memeriksa Data Alumni...</span>
              </>
            ) : (
              'Buka Buku Kenangan'
            )}
          </button>
        </form>

        <footer className="mt-8 pt-4 border-t border-[#DED6C6] text-center text-stone-600 text-xs space-y-1">
          <p className="font-semibold text-stone-800">Teknik Lingkungan UPN &ldquo;Veteran&rdquo; Yogyakarta 2016</p>
          <p>Gunakan NIM angkatan 2016 untuk membuka profil dan catatan skormu.</p>
        </footer>
      </div>
    </main>
  );
}
