import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard({ onBack }) {
  const [unlockDate, setUnlockDate] = useState('');
  const [monopoliDate, setMonopoliDate] = useState(''); 
  const [werewolfDate, setWerewolfDate] = useState(''); 
  const [unoDate, setUnoDate] = useState('');
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [secretMode, setSecretMode] = useState(false);
  const [patchNotes, setPatchNotes] = useState([]);
  const [newNoteTag, setNewNoteTag] = useState('[SYS]');
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;

      if (data) {
        setShowScoreboard(data.show_scoreboard);
        
        if (data.patch_notes) {
          setPatchNotes(data.patch_notes);
        }

        if (data.wheel_unlock_date) {
          const dateObj = new Date(data.wheel_unlock_date);
          setUnlockDate(new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }

        if (data.monopoli_unlock_date) {
          const mDateObj = new Date(data.monopoli_unlock_date);
          setMonopoliDate(new Date(mDateObj.getTime() - mDateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }

        if (data.werewolf_unlock_date) {
          const wDateObj = new Date(data.werewolf_unlock_date);
          setWerewolfDate(new Date(wDateObj.getTime() - wDateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }

        if (data.uno_unlock_date) {
          const uDateObj = new Date(data.uno_unlock_date);
          setUnoDate(new Date(uDateObj.getTime() - uDateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }
      }
    } catch (error) {
      console.error("Gagal menarik data setting:", error.message);
      setErrorMsg('Gagal memuat pengaturan dari server. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('Menyimpan perubahan...');

    try {
      const dbDate = unlockDate ? new Date(unlockDate).toISOString() : null;
      const dbMonopoliDate = monopoliDate ? new Date(monopoliDate).toISOString() : null;
      const dbWerewolfDate = werewolfDate ? new Date(werewolfDate).toISOString() : null;
      const dbUnoDate = unoDate ? new Date(unoDate).toISOString() : null;

      const { error } = await supabase
        .from('app_settings')
        .update({
          show_scoreboard: showScoreboard,
          wheel_unlock_date: dbDate,
          monopoli_unlock_date: dbMonopoliDate,
          werewolf_unlock_date: dbWerewolfDate,
          uno_unlock_date: dbUnoDate
        })
        .eq('id', 1);

      if (error) throw error;

      setSaveStatus('Pengaturan berhasil disimpan!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error("Gagal menyimpan setting:", error.message);
      setSaveStatus('Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setIsSubmittingNote(true);

    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const newNote = { id: Date.now(), date: dateStr, tag: newNoteTag, text: newNoteText };
    const updatedNotes = [newNote, ...patchNotes]; 

    try {
      const { error } = await supabase.from('app_settings').update({ patch_notes: updatedNotes }).eq('id', 1);
      if (error) throw error;
      setPatchNotes(updatedNotes);
      setNewNoteText('');
    } catch (err) {
      alert("Gagal menyimpan catatan!");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (idToRemove) => {
    const confirmDelete = window.confirm("Hapus catatan ini dari daftar?");
    if (!confirmDelete) return;

    const updatedNotes = patchNotes.filter(n => n.id !== idToRemove);
    try {
      await supabase.from('app_settings').update({ patch_notes: updatedNotes }).eq('id', 1);
      setPatchNotes(updatedNotes);
    } catch (err) {
      alert("Gagal menghapus catatan!");
    }
  };

  const handleClearDate = () => setUnlockDate('');
  const handleClearMonopoliDate = () => setMonopoliDate('');
  const handleClearWerewolfDate = () => setWerewolfDate('');
  const handleClearUnoDate = () => setUnoDate('');

  const getAutoSchedule = (dateStr) => {
    if (!dateStr) return { month: 'Segera', week: '-', status: 'secret' };
    const d = new Date(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const month = months[d.getMonth()];
    const week = `Minggu ${Math.ceil(d.getDate() / 7)}`;
    const status = new Date().getTime() >= d.getTime() ? 'released' : 'upcoming';
    
    return { month, week, status };
  };

  const monoData = getAutoSchedule(monopoliDate);
  const wolfData = getAutoSchedule(werewolfDate);
  const wheelData = getAutoSchedule(unlockDate);
  const unoData = getAutoSchedule(unoDate);

  const autoRoadmap = [
    { id: 1, month: 'Mei', week: 'Minggu 2', game: 'Digital Treasure Hunt', status: 'released' },
    { id: 2, month: 'Mei', week: 'Minggu 2', game: 'Tebak Foto Maba', status: 'released' },
    { id: 3, month: monoData.month, week: monoData.week, game: 'Monopoli TL16', status: monoData.status },
    { id: 4, month: wolfData.month, week: wolfData.week, game: 'Sidang Dosen Killer', status: wolfData.status },
    { id: 5, month: unoData.month, week: unoData.week, game: 'UNO Sedulur 16', status: unoData.status }, 
    { id: 6, month: wheelData.month, week: wheelData.week, game: 'Wheel of Family', status: wheelData.status },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-amber-400 font-mono">
        Memuat Ruang Panitia 1 Dekade...
      </div>
    );
  }

  if (secretMode) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-200 pb-20">
        <div className="max-w-4xl mx-auto">
          
          <div className="border-b border-slate-700 pb-6 mb-8 flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-xs font-mono text-amber-400 uppercase font-bold mb-1">Dokumentasi Internal Panitia</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Catatan Pengembang & Panitia
              </h1>
            </div>
            <button 
              type="button"
              onClick={() => setSecretMode(false)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-600 font-bold transition-colors"
            >
              Kembali ke Ruang Panitia
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md">
                <h2 className="text-amber-400 font-bold mb-4 text-base">
                  Tambah Catatan Pembaruan
                </h2>
                <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div>
                      <label htmlFor="note-tag-select" className="sr-only">Kategori Catatan</label>
                      <select 
                        id="note-tag-select"
                        value={newNoteTag}
                        onChange={(e) => setNewNoteTag(e.target.value)}
                        className="w-full sm:w-auto min-h-[44px] bg-slate-900 border border-slate-600 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                      >
                        <option value="[SYS]">[SYS] Sistem</option>
                        <option value="[UI]">[UI] Tampilan</option>
                        <option value="[DB]">[DB] Database</option>
                        <option value="[FIX]">[FIX] Perbaikan</option>
                        <option value="[NEW]">[NEW] Fitur Baru</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="note-text-input" className="sr-only">Isi Catatan</label>
                      <input 
                        id="note-text-input"
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Tulis rincian pembaruan di sini..."
                        className="w-full min-h-[44px] bg-slate-900 border border-slate-600 text-white rounded-xl px-3.5 py-2 text-sm placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    className="min-h-[44px] bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:bg-slate-700 disabled:text-slate-300 py-2.5 px-4 rounded-xl text-sm font-bold transition-colors"
                  >
                    {isSubmittingNote ? 'Menyimpan Catatan...' : 'Simpan Catatan'}
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h2 className="text-slate-200 font-bold text-base border-b border-slate-700 pb-2">
                  Riwayat Catatan Sistem
                </h2>
                {patchNotes.length === 0 ? (
                  <p className="text-slate-300 text-sm bg-slate-800 p-4 rounded-xl border border-slate-700">
                    Belum ada catatan sistem yang ditambahkan.
                  </p>
                ) : (
                  patchNotes.map((note) => (
                    <div key={note.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-slate-300">{note.date}</span>
                        <button 
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          aria-label={`Hapus catatan ${note.text}`}
                          className="text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-700 border border-rose-500/30 px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                      <p className="text-sm text-slate-100 leading-relaxed">
                        <span className="font-mono font-bold text-amber-400 mr-2">{note.tag}</span>
                        {note.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <section className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 className="text-amber-400 font-bold mb-2 text-sm">Modul Monopoli TL16</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Seluruh pemain bergerak serentak di satu papan virtual dengan mekanik UKT dan kartu Tantangan Jujur atau Berani.
                </p>
              </section>
              <section className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 className="text-emerald-400 font-bold mb-2 text-sm">Modul Sidang Dosen Killer</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Rasio peran otomatis menyesuaikan jumlah pemain (Dosen Killer, Intel Kampus, dan Mahasiswa Kura-Kura).
                </p>
              </section>
              <section className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 className="text-amber-400 font-bold mb-2 text-sm">Modul UNO Sedulur 16</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Mendukung tumpukan kartu hukuman (+2 dan +4) serta sinkronisasi kartu meja secara langsung via Supabase.
                </p>
              </section>
              <section className="bg-slate-800 p-5 rounded-xl border border-amber-400/40">
                <h3 className="text-amber-400 font-bold mb-2 text-sm">Panduan Host Ruangan</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Pastikan perangkat Host memiliki koneksi stabil dan layar tetap menyala selama memandu sesi permainan bersama.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-4xl mx-auto">
        
        <button 
          type="button"
          onClick={onBack}
          className="mb-6 min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center text-amber-400 font-bold text-sm transition-colors"
        >
          Kembali ke Beranda
        </button>

        {errorMsg && (
          <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm flex items-center justify-between gap-4">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={fetchSettings}
              className="px-4 py-2 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs border border-slate-700"
            >
              Muat Ulang
            </button>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-10 shadow-md">
          
          <div className="mb-8 border-b border-slate-700 pb-6">
            <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
              Pengaturan Acara Reuni 1 Dekade
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Ruang Kendali Panitia TL 2016</h1>
            <p className="text-slate-300 text-sm mt-1">
              Atur jadwal pembukaan setiap kado permainan dan visibilitas papan klasemen angkatan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
              <label htmlFor="schedule-wheel" className="block text-lg font-bold text-amber-400 mb-2">
                Jadwal Wheel of Family
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-wheel"
                  type="datetime-local" 
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-slate-300">
                    {unlockDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {unlockDate && (
                    <button
                      type="button"
                      onClick={handleClearDate}
                      className="text-xs font-bold text-rose-300 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
              <label htmlFor="schedule-monopoli" className="block text-lg font-bold text-emerald-400 mb-2">
                Jadwal Monopoli TL16
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-monopoli"
                  type="datetime-local" 
                  value={monopoliDate}
                  onChange={(e) => setMonopoliDate(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-slate-300">
                    {monopoliDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {monopoliDate && (
                    <button
                      type="button"
                      onClick={handleClearMonopoliDate}
                      className="text-xs font-bold text-rose-300 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
              <label htmlFor="schedule-werewolf" className="block text-lg font-bold text-amber-400 mb-2">
                Jadwal Sidang Dosen Killer
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-werewolf"
                  type="datetime-local" 
                  value={werewolfDate}
                  onChange={(e) => setWerewolfDate(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-slate-300">
                    {werewolfDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {werewolfDate && (
                    <button
                      type="button"
                      onClick={handleClearWerewolfDate}
                      className="text-xs font-bold text-rose-300 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
              <label htmlFor="schedule-uno" className="block text-lg font-bold text-emerald-400 mb-2">
                Jadwal UNO Sedulur 16
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-uno"
                  type="datetime-local" 
                  value={unoDate}
                  onChange={(e) => setUnoDate(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-slate-300">
                    {unoDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {unoDate && (
                    <button
                      type="button"
                      onClick={handleClearUnoDate}
                      className="text-xs font-bold text-rose-300 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 md:col-span-2">
              <h2 className="text-lg font-bold text-amber-400 mb-2">
                Visibilitas Klasemen Angkatan
              </h2>
              <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 mt-3">
                <label htmlFor="toggle-scoreboard" className="font-bold text-slate-200 cursor-pointer">
                  Tampilkan Papan Klasemen di Beranda Peserta
                </label>
                <label htmlFor="toggle-scoreboard" className="relative inline-flex items-center cursor-pointer min-h-[44px]">
                  <input
                    id="toggle-scoreboard"
                    type="checkbox"
                    className="sr-only peer"
                    checked={showScoreboard}
                    onChange={() => setShowScoreboard(!showScoreboard)}
                  />
                  <div className="w-14 h-7 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full mb-8">
            <h2 className="text-lg font-bold text-white mb-1">
              Pratinjau Jadwal Kejutan Acara
            </h2>
            <p className="text-xs text-slate-300 mb-5">
              Tabel ini otomatis menyesuaikan tanggal yang diatur di atas. Kosongkan tanggal jika permainan masih ingin disimpan sebagai kejutan.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-800 text-xs uppercase text-slate-300">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Bulan</th>
                    <th className="px-4 py-3">Minggu</th>
                    <th className="px-4 py-3">Permainan</th>
                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {autoRoadmap.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-bold text-white">{item.month}</td>
                      <td className="px-4 py-3 text-slate-300">{item.week}</td>
                      <td className="px-4 py-3 font-bold text-white">{item.game}</td>
                      <td className="px-4 py-3">
                        {item.status === 'released' && (
                          <span className="text-emerald-300 font-bold text-xs bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-md">
                            Sudah Dibuka
                          </span>
                        )}
                        {item.status === 'upcoming' && (
                          <span className="text-amber-300 font-bold text-xs bg-amber-950/80 border border-amber-400/40 px-2.5 py-1 rounded-md">
                            Terjadwal
                          </span>
                        )}
                        {item.status === 'secret' && (
                          <span className="text-slate-300 font-bold text-xs bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                            Kado Kejutan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              type="button"
              onClick={() => setSecretMode(true)}
              className="min-h-[44px] bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-400 px-6 py-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-colors"
            >
              Buka Catatan Pengembang & Panitia
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-emerald-400 font-mono text-sm min-h-[24px]">{saveStatus}</p>
            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full md:w-auto min-h-[48px] px-10 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
