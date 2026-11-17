import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [nim, setNim] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [pendingAdminUser, setPendingAdminUser] = useState(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [verifyingPasskey, setVerifyingPasskey] = useState(false);

  useEffect(() => {
    if (!pendingAdminUser) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPendingAdminUser(null);
        setPasskeyInput('');
        setPasskeyError('');
        setError('Akses panitia dibatalkan.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingAdminUser]);

  const completeLogin = (userData, adminFlag) => {
    localStorage.setItem('user_nim', userData.nim);
    localStorage.setItem('user_nama', userData.nama);
    localStorage.setItem('is_admin', Boolean(adminFlag).toString());
    onLoginSuccess({ ...userData, is_admin: adminFlag });
  };

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

    // NIM khusus komting memerlukan verifikasi passkey tambahan dari database
    if (nim.trim() === '114160066') {
      setLoading(false);
      setPendingAdminUser(data);
      setPasskeyInput('');
      setPasskeyError('');
      return;
    }

    setLoading(false);
    completeLogin(data, data.is_admin);
  };

  const handleVerifyPasskey = async (e) => {
    e.preventDefault();
    if (!passkeyInput.trim()) {
      setPasskeyError('Masukkan passkey panitia terlebih dahulu.');
      return;
    }

    setVerifyingPasskey(true);
    setPasskeyError('');

    const { data: settings } = await supabase
      .from('app_settings')
      .select('admin_passkey')
      .eq('id', 1)
      .single();

    setVerifyingPasskey(false);

    if (settings && passkeyInput === settings.admin_passkey) {
      const adminData = pendingAdminUser;
      setPendingAdminUser(null);
      setPasskeyInput('');
      completeLogin(adminData, true);
    } else {
      setPasskeyError('Passkey tidak sesuai. Akses panitia ditolak.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex justify-center items-center p-4">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-amber-400/40 w-full max-w-md relative">
        <header className="text-center mb-8 flex flex-col items-center">
          <h1 className="w-full flex justify-center">
            <img
              src="/Asset 2.webp"
              alt="Happy Anniversary Teknik Lingkungan 2016"
              width="280"
              height="109"
              fetchPriority="high"
              className="w-full max-w-[280px] h-auto"
            />
          </h1>
          <p className="text-sm text-slate-300 mt-4">
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

      {pendingAdminUser && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-modal-title"
        >
          <div className="bg-slate-800 border border-amber-400/50 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 id="passkey-modal-title" className="text-xl font-bold text-white mb-1">
              Verifikasi Akses Panitia
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              Masukkan passkey panitia untuk masuk sebagai pengelola acara.
            </p>

            {passkeyError && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-400 text-rose-200 text-xs font-medium">
                {passkeyError}
              </div>
            )}

            <form onSubmit={handleVerifyPasskey} className="space-y-4">
              <div>
                <label htmlFor="admin-passkey-input" className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Passkey Panitia
                </label>
                <input
                  id="admin-passkey-input"
                  type="password"
                  autoFocus
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Masukkan passkey..."
                  className="w-full min-h-[48px] bg-slate-900 border border-slate-500 rounded-xl px-3.5 py-2.5 text-slate-50 text-sm placeholder:text-slate-400 focus:border-amber-400"
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAdminUser(null);
                    setPasskeyInput('');
                    setPasskeyError('');
                    setError('Akses panitia dibatalkan.');
                  }}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={verifyingPasskey}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-300 text-slate-950 text-sm font-bold transition-colors"
                >
                  {verifyingPasskey ? 'Memeriksa...' : 'Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
