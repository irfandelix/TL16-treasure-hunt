import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { verifyAdminPassword, setAdminSessionVerified } from '../lib/adminAuth';

export default function Login({ onLoginSuccess }) {
  const [nim, setNim] = useState('');
  const [pendingAdminUser, setPendingAdminUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finalizeLogin = (data) => {
    localStorage.setItem('user_nim', data.nim);
    localStorage.setItem('user_nama', data.nama);
    setAdminSessionVerified(Boolean(data.is_admin));
    if (data.avatar_config) {
      localStorage.setItem(`avatar_config_${data.nim}`, JSON.stringify(data.avatar_config));
      localStorage.setItem(`avatar_saved_${data.nim}`, 'true');
    } else {
      localStorage.removeItem(`avatar_saved_${data.nim}`);
    }
    if ('mystery_location' in data) {
      if (data.mystery_location) {
        localStorage.setItem(`mystery_location_${data.nim}`, 'locked');
      } else {
        localStorage.removeItem(`mystery_location_${data.nim}`);
      }
    }

    setLoading(false);
    onLoginSuccess({ ...data, is_admin: Boolean(data.is_admin) });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (pendingAdminUser) {
      if (!adminPassword.trim()) {
        setError('Masukkan password panitia terlebih dahulu.');
        return;
      }
      if (!verifyAdminPassword(adminPassword)) {
        setError('Password panitia tidak sesuai. Periksa kembali lalu coba lagi.');
        return;
      }
      finalizeLogin(pendingAdminUser);
      return;
    }

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

    if (data.is_admin) {
      setPendingAdminUser(data);
      setAdminPassword('');
      setLoading(false);
      return;
    }

    finalizeLogin(data);
  };

  return (
    <main className="min-h-[100dvh] bg-[#F8F6F1] flex justify-center items-center p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="bg-[#FFFDF9] p-6 sm:p-10 rounded-2xl border border-[#DED8CA] w-full max-w-md relative">
        <header className="text-center mb-8 flex flex-col items-center border-b border-[#E5DFD2] pb-6">
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
          <p className="text-sm text-zinc-600 mt-4 leading-relaxed">
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
          {pendingAdminUser ? (
            <>
              <div className="bg-[#F8F6F1] border border-[#DED8CA] rounded-xl p-4 space-y-1">
                <p className="text-xs font-bold text-[#14532D]">Verifikasi Akses Panitia</p>
                <p className="text-sm font-semibold text-zinc-900">{pendingAdminUser.nama}</p>
                <p className="text-xs font-mono text-zinc-600">NIM {pendingAdminUser.nim}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="admin-password-input" className="block text-zinc-800 font-semibold text-sm">
                  Password Panitia
                </label>
                <input
                  id="admin-password-input"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Masukkan password panitia"
                  className="w-full bg-[#F8F6F1] border border-[#CEC6B6] p-3.5 rounded-xl text-zinc-900 text-base placeholder:text-zinc-500 focus:border-[#14532D] focus:bg-white transition-colors min-h-[48px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAdminUser(null);
                    setAdminPassword('');
                    setError('');
                  }}
                  className="sm:w-1/3 py-3.5 px-4 rounded-xl font-bold text-sm border border-[#DED8CA] bg-[#F8F6F1] hover:bg-[#EFE9DC] text-zinc-800 transition-colors min-h-[48px]"
                >
                  Ganti NIM
                </button>
                <button
                  type="submit"
                  className="sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-base bg-[#14532D] hover:bg-[#166534] active:bg-[#0F3F22] text-white transition-colors min-h-[48px]"
                >
                  Verifikasi &amp; Masuk
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="nim-input" className="block text-zinc-800 font-semibold text-sm">
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
                  className="w-full bg-[#F8F6F1] border border-[#CEC6B6] p-3.5 rounded-xl text-zinc-900 font-mono text-base placeholder:text-zinc-500 focus:border-[#14532D] focus:bg-white transition-colors min-h-[48px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-base transition-colors min-h-[48px] flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-[#E5DFD2] text-zinc-800'
                    : 'bg-[#14532D] hover:bg-[#166534] active:bg-[#0F3F22] text-white'
                }`}
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin"
                    />
                    <span>Memeriksa Data Alumni...</span>
                  </>
                ) : (
                  'Masuk ke Portal'
                )}
              </button>
            </>
          )}
        </form>

        <footer className="mt-8 pt-4 border-t border-[#E5DFD2] text-center text-zinc-600 text-xs space-y-1">
          <p className="font-semibold text-zinc-800">Teknik Lingkungan UPN &ldquo;Veteran&rdquo; Yogyakarta 2016</p>
          <p>Gunakan NIM angkatan 2016 untuk membuka profil dan catatan skormu.</p>
        </footer>
      </div>
    </main>
  );
}
