import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard({ onBack }) {
  const [unlockDate, setUnlockDate] = useState('');
  const [monopoliDate, setMonopoliDate] = useState(''); // State baru untuk Monopoli
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // 1. TARIK DATA SETTINGAN SAAT INI DARI SUPABASE
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) throw error;

        if (data) {
          setShowScoreboard(data.show_scoreboard);
          
          // Format tanggal Wheel of Family (UTC ke Lokal)
          if (data.wheel_unlock_date) {
            const dateObj = new Date(data.wheel_unlock_date);
            const localISO = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16); 
            setUnlockDate(localISO);
          }

          // Format tanggal Monopoli (UTC ke Lokal)
          if (data.monopoli_unlock_date) {
            const mDateObj = new Date(data.monopoli_unlock_date);
            const mLocalISO = new Date(mDateObj.getTime() - mDateObj.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16); 
            setMonopoliDate(mLocalISO);
          }
        }
      } catch (error) {
        console.error("Gagal menarik data setting:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 2. SIMPAN PERUBAHAN KE SUPABASE
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('Menyimpan perubahan... ⏳');

    try {
      // Ubah kembali format lokal ke ISO string (UTC) untuk database
      const dbDate = unlockDate ? new Date(unlockDate).toISOString() : null;
      const dbMonopoliDate = monopoliDate ? new Date(monopoliDate).toISOString() : null;

      const { error } = await supabase
        .from('app_settings')
        .update({
          show_scoreboard: showScoreboard,
          wheel_unlock_date: dbDate,
          monopoli_unlock_date: dbMonopoliDate // Simpan tanggal monopoli
        })
        .eq('id', 1);

      if (error) throw error;

      setSaveStatus('Tersimpan! 🚀');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error("Gagal menyimpan setting:", error.message);
      setSaveStatus('Gagal menyimpan! ❌');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. HAPUS JADWAL (KUNCI KEMBALI)
  const handleClearDate = () => setUnlockDate('');
  const handleClearMonopoliDate = () => setMonopoliDate('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center text-green-500 font-mono">
        MEMUAT CONTROL ROOM...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Tombol Kembali */}
        <button 
          onClick={onBack}
          className="mb-8 flex items-center text-green-500 hover:text-green-400 font-bold transition-colors"
        >
          <span className="mr-2">←</span> KEMBALI KE MENU UTAMA
        </button>

        <div className="bg-slate-900 border border-green-500/30 rounded-3xl p-6 md:p-10 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden">
          
          {/* Efek Garis Hacker */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>

          <div className="flex items-center mb-10 border-b border-slate-700 pb-6">
            <span className="text-5xl mr-4">🎛️</span>
            <div>
              <h1 className="text-3xl font-black text-green-500 tracking-widest">CONTROL ROOM</h1>
              <p className="text-slate-400 font-mono text-sm mt-1">Akses root. Hati-hati dalam mengubah konfigurasi.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* PANEL 1: SETTING WHEEL OF FAMILY */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-xl font-bold text-blue-400 mb-2 flex items-center">
                <span className="mr-2">🎡</span> Jadwal Wheel of Family
              </h2>
              <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                Atur tanggal dan jam kapan menu putar roda otomatis terbuka di HP semua peserta.
              </p>

              <div className="flex flex-col gap-3">
                <input 
                  type="datetime-local" 
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                />
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-mono text-slate-500">
                    {unlockDate ? 'Jadwal Aktif' : 'Status: Terkunci Permanen'}
                  </span>
                  {unlockDate && (
                    <button 
                      onClick={handleClearDate}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Hapus Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PANEL 2: SETTING MONOPOLI UPN */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-xl font-bold text-purple-400 mb-2 flex items-center">
                <span className="mr-2">🎲</span> Jadwal Monopoli UPN
              </h2>
              <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                Atur tanggal dan jam kapan sesi permainan Monopoli angkatan mulai dapat diakses.
              </p>

              <div className="flex flex-col gap-3">
                <input 
                  type="datetime-local" 
                  value={monopoliDate}
                  onChange={(e) => setMonopoliDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none"
                />
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-mono text-slate-500">
                    {monopoliDate ? 'Jadwal Aktif' : 'Status: Terkunci Permanen'}
                  </span>
                  {monopoliDate && (
                    <button 
                      onClick={handleClearMonopoliDate}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Hapus Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PANEL 3: SETTING SCOREBOARD / KLASEMEN */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 md:col-span-2">
              <h2 className="text-xl font-bold text-yellow-400 mb-2 flex items-center">
                <span className="mr-2">🏆</span> Visibilitas Klasemen
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Buka kunci ini untuk menampilkan ranking dan skor ke seluruh peserta secara publik.
              </p>

              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-600 mt-5">
                <span className="font-bold text-slate-300">Tampilkan Scoreboard</span>
                
                {/* Toggle Switch Custom */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showScoreboard}
                    onChange={() => setShowScoreboard(!showScoreboard)}
                  />
                  <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <p className="text-right text-xs mt-2 font-mono text-slate-500">
                Status saat ini: <span className={showScoreboard ? 'text-green-400' : 'text-red-400'}>{showScoreboard ? 'PUBLIK (ON)' : 'DISEMBUNYIKAN (OFF)'}</span>
              </p>
            </div>

          </div>

          {/* TOMBOL SAVE MASTER */}
          <div className="mt-10 pt-6 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-green-400 font-mono text-sm animate-pulse h-6">
              {saveStatus}
            </p>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full md:w-auto px-10 py-4 bg-green-600 hover:bg-green-500 text-slate-950 font-black tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-[0_0_15px_rgba(22,163,74,0.4)]"
            >
              {isSaving ? 'MENYIMPAN...' : 'SIMPAN KONFIGURASI'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}