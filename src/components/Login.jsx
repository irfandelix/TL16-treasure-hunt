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

    let isAdminStatus = data.is_admin;

    // NIM khusus komting memerlukan verifikasi passkey tambahan dari database
    if (nim.trim() === '114160066') {
      const passkeyInput = window.prompt('Masukkan Passkey Panitia:');

      if (!passkeyInput) {
        setError('Akses panitia dibatalkan.');
        setLoading(false);
        return;
      }

      const { data: settings } = await supabase
        .from('app_settings')
        .select('admin_passkey')
        .eq('id', 1)
        .single();

      if (settings && passkeyInput === settings.admin_passkey) {
        isAdminStatus = true;
      } else {
        setError('Passkey tidak sesuai. Akses panitia ditolak.');
        setLoading(false);
        return;
      }
    }

    localStorage.setItem('user_nim', data.nim);
    localStorage.setItem('user_nama', data.nama);
    localStorage.setItem('is_admin', Boolean(isAdminStatus).toString());

    setLoading(false);
    onLoginSuccess({ ...data, is_admin: isAdminStatus });
  };

  return (
    <main className="min-h-screen bg-slate-900 flex justify-center items-center p-4">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-amber-400/40 w-full max-w-md relative">
        <header className="text-center mb-8 flex flex-col items-center">
          <span className="inline-block px-3 py-1 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-5">
            Perayaan 10 Tahun Sedulur 16
          </span>
          <img
            src="/Asset 2.webp"
            alt="Happy Anniversary Teknik Lingkungan 2016"
            width="280"
            height="109"
            fetchPriority="high"
            className="w-full max-w-[260px] h-auto mb-3"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-50 mt-2">
            Selamat Ulang Tahun ke-10, TL 2016!
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Masuk dengan NIM untuk ikut kumpul kenangan dan bermain bersama teman seangkatan.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="bg-rose-950/90 border border-rose-400 text-rose-200 p-3.5 rounded-xl text-sm text-center mb-6 font-medium"
          >
            Perhatian: {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="nim-input" className="block text-slate-200 font-semibold text-sm">
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
              className="w-full bg-slate-900 border border-slate-500 p-3.5 rounded-xl text-slate-50 font-mono text-base placeholder:text-slate-400 focus:border-amber-400 transition-colors min-h-[48px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-300 py-3.5 px-6 rounded-xl font-bold text-slate-950 text-base transition-colors min-h-[48px] flex items-center justify-center gap-2 border border-amber-300"
          >
            {loading ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-5 h-5 border-2 border-slate-400 border-t-slate-950 rounded-full animate-spin"
                />
                <span>Memeriksa Data Alumni...</span>
              </>
            ) : (
              'Masuk ke Perayaan 1 Dekade'
            )}
          </button>
        </form>

        <footer className="mt-8 pt-4 border-t border-slate-700 text-center text-slate-300 text-xs space-y-1">
          <p className="font-semibold text-amber-300">Portal Reuni & Permainan Teknik Lingkungan 2016</p>
          <p>Gunakan NIM angkatan 2016 untuk membuka profil dan skor kamu.</p>
        </footer>
      </div>
    </main>
  );
}
