import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UPDATES_LOG } from '../data/updatesLog';
import {
  extractEarlyAccessConfig,
  filterVisiblePatchNotes,
  mergeEarlyAccessIntoPatchNotes,
  getEarlyAccessWindowStatus
} from '../lib/earlyAccess';
import { copyTextToClipboard } from '../lib/roomInvite';

function toLocalDateTimeInput(isoStr) {
  if (!isoStr) return '';
  const dateObj = new Date(isoStr);
  if (Number.isNaN(dateObj.getTime())) return '';
  return new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

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
  const [noteError, setNoteError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [mysteryCoords, setMysteryCoords] = useState([]);

  const [alumniRoster, setAlumniRoster] = useState([]);
  const [earlyAccessNims, setEarlyAccessNims] = useState([]);
  const [earlyAccessStart, setEarlyAccessStart] = useState('');
  const [earlyAccessEnd, setEarlyAccessEnd] = useState('');
  const [earlyAccessSearch, setEarlyAccessSearch] = useState('');
  const [capsuleFilter, setCapsuleFilter] = useState('unfilled');
  const [capsuleSearch, setCapsuleSearch] = useState('');
  const [copiedUnfilled, setCopiedUnfilled] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [{ data, error }, { data: rosterData, error: rosterErr }] = await Promise.all([
        supabase.from('app_settings').select('*').eq('id', 1).single(),
        supabase.from('alumni').select('nim, nama, foto_now, pesan_anniv').order('nama', { ascending: true })
      ]);

      if (error) throw error;
      if (!rosterErr && Array.isArray(rosterData)) {
        setAlumniRoster(rosterData);
      }

      const { data: alumniCoords, error: coordsErr } = await supabase
        .from('alumni')
        .select('nim, nama, mystery_location')
        .not('mystery_location', 'is', null)
        .order('nama', { ascending: true });
      if (!coordsErr && alumniCoords) {
        setMysteryCoords(alumniCoords);
      }

      if (data) {
        setShowScoreboard(data.show_scoreboard);
        setPatchNotes(filterVisiblePatchNotes(data.patch_notes));

        const eaCfg = extractEarlyAccessConfig(data);
        setEarlyAccessNims(eaCfg.nims);
        setEarlyAccessStart(toLocalDateTimeInput(eaCfg.start_at));
        setEarlyAccessEnd(toLocalDateTimeInput(eaCfg.end_at));

        setUnlockDate(toLocalDateTimeInput(data.wheel_unlock_date));
        setMonopoliDate(toLocalDateTimeInput(data.monopoli_unlock_date));
        setWerewolfDate(toLocalDateTimeInput(data.werewolf_unlock_date));
        setUnoDate(toLocalDateTimeInput(data.uno_unlock_date));
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

  const buildCurrentEarlyAccessPayload = () => ({
    nims: earlyAccessNims,
    start_at: earlyAccessStart ? new Date(earlyAccessStart).toISOString() : null,
    end_at: earlyAccessEnd ? new Date(earlyAccessEnd).toISOString() : null
  });

  const handleSave = async () => {
    if (earlyAccessStart && earlyAccessEnd && new Date(earlyAccessEnd).getTime() < new Date(earlyAccessStart).getTime()) {
      setSaveStatus('Tanggal berakhir Early Access tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Menyimpan perubahan...');

    try {
      const dbDate = unlockDate ? new Date(unlockDate).toISOString() : null;
      const dbMonopoliDate = monopoliDate ? new Date(monopoliDate).toISOString() : null;
      const dbWerewolfDate = werewolfDate ? new Date(werewolfDate).toISOString() : null;
      const dbUnoDate = unoDate ? new Date(unoDate).toISOString() : null;
      const mergedPatchNotes = mergeEarlyAccessIntoPatchNotes(patchNotes, buildCurrentEarlyAccessPayload());

      const { error } = await supabase
        .from('app_settings')
        .update({
          show_scoreboard: showScoreboard,
          wheel_unlock_date: dbDate,
          monopoli_unlock_date: dbMonopoliDate,
          werewolf_unlock_date: dbWerewolfDate,
          uno_unlock_date: dbUnoDate,
          patch_notes: mergedPatchNotes
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
      setNoteError('');
      const merged = mergeEarlyAccessIntoPatchNotes(updatedNotes, buildCurrentEarlyAccessPayload());
      const { error } = await supabase.from('app_settings').update({ patch_notes: merged }).eq('id', 1);
      if (error) throw error;
      setPatchNotes(updatedNotes);
      setNewNoteText('');
    } catch (err) {
      setNoteError("Gagal menyimpan catatan pembaruan. Coba lagi.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (idToRemove) => {
    const updatedNotes = patchNotes.filter(n => n.id !== idToRemove);
    try {
      setNoteError('');
      const merged = mergeEarlyAccessIntoPatchNotes(updatedNotes, buildCurrentEarlyAccessPayload());
      const { error } = await supabase.from('app_settings').update({ patch_notes: merged }).eq('id', 1);
      if (error) throw error;
      setPatchNotes(updatedNotes);
      setConfirmDeleteId(null);
    } catch (err) {
      setNoteError("Gagal menghapus catatan. Coba lagi.");
    }
  };

  const toggleEarlyAccessNim = (nim) => {
    setEarlyAccessNims((prev) =>
      prev.includes(nim) ? prev.filter((item) => item !== nim) : [...prev, nim]
    );
  };

  const filteredRoster = useMemo(() => {
    const q = earlyAccessSearch.trim().toLowerCase();
    if (!q) return alumniRoster;
    return alumniRoster.filter(
      (p) => (p.nama || '').toLowerCase().includes(q) || (p.nim || '').toLowerCase().includes(q)
    );
  }, [alumniRoster, earlyAccessSearch]);

  const earlyAccessStatus = getEarlyAccessWindowStatus(buildCurrentEarlyAccessPayload());

  const capsuleStats = useMemo(() => {
    const filled = [];
    const unfilled = [];
    for (const person of alumniRoster) {
      const hasPhoto = Boolean(person.foto_now && String(person.foto_now).trim());
      const hasMsg = Boolean(person.pesan_anniv && String(person.pesan_anniv).trim());
      if (hasPhoto || hasMsg) {
        filled.push({ ...person, hasPhoto, hasMsg });
      } else {
        unfilled.push({ ...person, hasPhoto: false, hasMsg: false });
      }
    }
    const total = alumniRoster.length;
    const pct = total > 0 ? Math.round((filled.length / total) * 100) : 0;
    return { filled, unfilled, total, pct };
  }, [alumniRoster]);

  const displayedCapsuleList = useMemo(() => {
    const source = capsuleFilter === 'filled' ? capsuleStats.filled : capsuleStats.unfilled;
    const q = capsuleSearch.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (p) => (p.nama || '').toLowerCase().includes(q) || (p.nim || '').toLowerCase().includes(q)
    );
  }, [capsuleStats, capsuleFilter, capsuleSearch]);

  const handleCopyUnfilledList = async () => {
    if (capsuleStats.unfilled.length === 0) return;
    const lines = [
      `Pengingat Kapsul Waktu 1 Dekade TL 2016 (${capsuleStats.filled.length}/${capsuleStats.total} sudah mengisi):`,
      '',
      'Daftar yang belum mengirim foto dan pesan:',
      ...capsuleStats.unfilled.map((p, idx) => `${idx + 1}. ${p.nama}`)
    ];
    const ok = await copyTextToClipboard(lines.join('\n'));
    if (ok) {
      setCopiedUnfilled(true);
      setTimeout(() => setCopiedUnfilled(false), 2500);
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
      <div className="min-h-screen bg-[#FAF6EE] flex justify-center items-center text-amber-700 font-mono">
        Memuat Ruang Panitia 1 Dekade...
      </div>
    );
  }

  if (secretMode) {
    const latestVersion = UPDATES_LOG[0]?.version || 'v2.8.2';
    const moduleSpecs = [
      {
        title: 'Kuis Solo: Napak Tilas Peta & Tebak Muka Blur',
        tone: 'text-[#14532D]',
        status: 'Terbuka Publik',
        detail:
          '20 lokasi kampus/Jogja dan 20 foto maba 2016. Skor tertinggi dijaga dengan Math.max, progres serta sisa timer foto tersimpan di localStorage, dan layar selesai menyediakan poster IG Story 9:16 lengkap dengan tetangga peringkat.'
      },
      {
        title: 'Monopoli TL16',
        tone: 'text-[#B45309]',
        status: monoData.status === 'released' ? 'Terbuka' : monoData.status === 'upcoming' ? 'Terjadwal' : 'Rahasia',
        detail:
          'Papan kampus real-time dengan kartu Dana Umum, Kesempatan, dan Truth or Dare. Dilengkapi jeda 6 detik antar lemparan dadu, kunci lemparan saat modal terbuka, compare-and-swap kas serta skor, dan poster hasil sesi.'
      },
      {
        title: 'Sidang Dosen Killer',
        tone: 'text-[#14532D]',
        status: wolfData.status === 'released' ? 'Terbuka' : wolfData.status === 'upcoming' ? 'Terjadwal' : 'Rahasia',
        detail:
          'Rasio peran otomatis (Dosen Killer, Intel, Ahli, Uptodate, Mahasiswa). Pengecekan menang berjalan langsung setelah fase malam, vote ke NIM sendiri diblokir, pemain telat masuk menjadi penonton, dan layar akhir memberi tombol kembali serta poster hasil sidang.'
      },
      {
        title: 'UNO Sedulur 16',
        tone: 'text-[#B45309]',
        status: unoData.status === 'released' ? 'Terbuka' : unoData.status === 'upcoming' ? 'Terjadwal' : 'Rahasia',
        detail:
          'Permainan kartu meja real-time dengan kartu +2, Skip, dan Titip Absen (pemilih 4 warna). Giliran otomatis berpindah bila pemain keluar meja, dilengkapi poster hasil meja untuk IG Story.'
      },
      {
        title: 'Magical Athlete TL16',
        tone: 'text-[#14532D]',
        status: 'Khusus Panitia & Early Access',
        detail:
          'Fase Snake Draft dan balapan 4 ronde dengan skill karakter unik serta batas giliran bonus beruntun. Mendukung bot simulasi dan poster hasil turnamen.'
      },
      {
        title: 'Kapsul Waktu, Wheel of Family, & Klasemen',
        tone: 'text-[#B45309]',
        status: wheelData.status === 'released' ? 'Wheel Terbuka' : 'Kapsul Aktif',
        detail:
          'Unggah foto 2026 terkompresi beserta pesan, roda undian yang menyaring pemenang sebelumnya, papan klasemen podium 3 besar dengan tab kategori, avatar Canvas2D anti-inversi dark mode HP, serta poster IG Story dengan sensor blok hitam.'
      },
      {
        title: 'Ketahanan Koneksi, Bot Cadangan, & Early Access',
        tone: 'text-[#14532D]',
        status: earlyAccessStatus === 'active' ? 'Early Access Aktif' : 'Siaga',
        detail:
          'Hook useRoomConnection memakai Supabase Presence dan polling 5 detik untuk mengalihkan kendali koordinator bila host terputus, menjalankan bot sementara saat pemain offline (otomatis mati begitu pemain aktif lagi), serta mengecualikan skor sesi uji coba Admin dan Early Access dari database klasemen.'
      },
      {
        title: 'Navigasi Back HP & Privasi Panitia',
        tone: 'text-zinc-900',
        status: 'Aktif Global',
        detail:
          'Seluruh perpindahan menu tersinkron dengan Browser History API agar tombol Back HP kembali ke beranda aplikasi. Jadwal, catatan pembaruan publik, dan poster Story menyensor mode belum rilis dengan blok hitam detektif, sementara data Tombol Misteri hanya tampil di Ruang Panitia.'
      }
    ];

    return (
      <div className="min-h-[100dvh] bg-[#F8F6F1] p-4 sm:p-6 md:p-8 font-sans text-zinc-900 pb-20">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="border-b border-[#DED8CA] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Catatan Pengembang &amp; Panitia
              </h1>
              <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
                Dokumentasi teknis internal seluruh modul aktif, mekanik ketahanan koneksi, dan riwayat catatan kerja panitia.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSecretMode(false)}
              className="self-start sm:self-auto text-xs sm:text-sm bg-[#FFFDF9] hover:bg-[#F1ECE0] text-[#14532D] px-4 py-2.5 min-h-[44px] rounded-xl border border-[#DED8CA] font-bold transition-colors shrink-0"
            >
              &larr; Kembali ke Ruang Panitia
            </button>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-xl px-4 py-3">
              <span className="block text-xs text-zinc-600">Versi Rilis</span>
              <span className="block font-mono font-bold text-base text-[#14532D] mt-0.5">{latestVersion}</span>
            </div>
            <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-xl px-4 py-3">
              <span className="block text-xs text-zinc-600">Data Alumni</span>
              <span className="block font-mono font-bold text-base text-zinc-900 mt-0.5">{alumniRoster.length} orang</span>
            </div>
            <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-xl px-4 py-3">
              <span className="block text-xs text-zinc-600">Early Access</span>
              <span className="block font-mono font-bold text-base text-[#B45309] mt-0.5">
                {earlyAccessStatus === 'active'
                  ? `Aktif (${earlyAccessNims.length})`
                  : earlyAccessStatus === 'scheduled'
                    ? `Terjadwal (${earlyAccessNims.length})`
                    : 'Nonaktif'}
              </span>
            </div>
            <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-xl px-4 py-3">
              <span className="block text-xs text-zinc-600">Catatan Internal</span>
              <span className="block font-mono font-bold text-base text-zinc-900 mt-0.5">{patchNotes.length} entri</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl p-5">
                <h2 className="text-zinc-900 font-bold mb-1 text-base">
                  Tambah Catatan Internal
                </h2>
                <p className="text-xs text-zinc-600 mb-4">
                  Tersimpan di database panitia dan tidak tampil di halaman pembaruan peserta.
                </p>
                <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                  {noteError && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium">
                      {noteError}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div>
                      <label htmlFor="note-tag-select" className="sr-only">Kategori Catatan</label>
                      <select
                        id="note-tag-select"
                        value={newNoteTag}
                        onChange={(e) => setNewNoteTag(e.target.value)}
                        className="w-full sm:w-auto min-h-[44px] bg-[#F8F6F1] border border-[#C7BDA8] text-zinc-900 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                      >
                        <option value="[SYS]">[SYS] Sistem</option>
                        <option value="[UI]">[UI] Tampilan</option>
                        <option value="[DB]">[DB] Database</option>
                        <option value="[FIX]">[FIX] Perbaikan</option>
                        <option value="[NEW]">[NEW] Fitur Baru</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label htmlFor="note-text-input" className="sr-only">Isi Catatan</label>
                      <input
                        id="note-text-input"
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Tulis rincian catatan panitia..."
                        className="w-full min-h-[44px] bg-[#F8F6F1] border border-[#C7BDA8] text-zinc-900 rounded-xl px-3.5 py-2 text-sm placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    className="min-h-[44px] bg-[#14532D] hover:bg-[#166534] text-white disabled:bg-[#E5DFD2] disabled:text-zinc-600 py-2.5 px-4 rounded-xl text-sm font-bold transition-colors"
                  >
                    {isSubmittingNote ? 'Menyimpan Catatan...' : 'Simpan Catatan'}
                  </button>
                </form>
              </section>

              <section className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1ECE0] border-b border-[#DED8CA] flex items-center justify-between gap-2">
                  <h2 className="text-zinc-900 font-bold text-sm">
                    Riwayat Catatan Sistem
                  </h2>
                  <span className="font-mono text-xs text-zinc-600">{patchNotes.length}</span>
                </div>

                {patchNotes.length === 0 ? (
                  <p className="text-zinc-600 text-sm p-5">
                    Belum ada catatan internal yang ditambahkan. Gunakan formulir di atas untuk mencatat hasil uji coba atau pengingat panitia.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E5DFD2]">
                    {patchNotes.map((note) => (
                      <div key={note.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-mono text-zinc-600">{note.date}</span>
                          {confirmDeleteId === note.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 px-3 py-1.5 min-h-[44px] rounded-lg transition-colors"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs font-bold text-zinc-800 bg-[#F1ECE0] hover:bg-[#E5DFD2] px-3 py-1.5 min-h-[44px] rounded-lg transition-colors"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(note.id)}
                              aria-label={`Hapus catatan ${note.text}`}
                              className="text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-700 border border-rose-300 px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-lg transition-colors"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-zinc-900 leading-relaxed">
                          <span className="font-mono font-bold text-[#B45309] mr-2">{note.tag}</span>
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="lg:col-span-7 bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-[#F1ECE0] border-b border-[#DED8CA]">
                <h2 className="text-zinc-900 font-bold text-base">
                  Ringkasan Modul &amp; Panduan Operasional Terbaru
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Acuan mekanik seluruh permainan, ketahanan koneksi ruangan, dan proteksi sesi uji coba.
                </p>
              </div>
              <div className="divide-y divide-[#E5DFD2]">
                {moduleSpecs.map((item) => (
                  <article key={item.title} className="p-5 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className={`font-bold text-sm sm:text-base ${item.tone}`}>
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-mono font-semibold text-zinc-700 bg-[#F8F6F1] border border-[#DED8CA] px-2.5 py-0.5 rounded-md">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-4xl mx-auto">
        
        <button 
          type="button"
          onClick={onBack}
          className="mb-6 min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-[#F3EDE0] border border-[#DED6C6] flex items-center text-amber-700 font-bold text-sm transition-colors"
        >
          Kembali ke Beranda
        </button>

        {errorMsg && (
          <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-500/40 text-rose-700 text-sm flex items-center justify-between gap-4">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={fetchSettings}
              className="px-4 py-2 min-h-[44px] bg-[#FAF6EE] hover:bg-white text-stone-900 rounded-lg font-bold text-xs border border-[#DED6C6]"
            >
              Muat Ulang
            </button>
          </div>
        )}

        <div className="bg-white border border-[#DED6C6] rounded-2xl p-6 md:p-10 shadow-md">
          
          <div className="mb-8 border-b border-[#DED6C6] pb-6">
            <p className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
              Pengaturan Acara Reuni 1 Dekade
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Ruang Kendali Panitia TL 2016</h1>
            <p className="text-stone-600 text-sm mt-1">
              Atur jadwal pembukaan setiap kado permainan dan visibilitas papan klasemen angkatan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#DED6C6]">
              <label htmlFor="schedule-wheel" className="block text-lg font-bold text-amber-700 mb-2">
                Jadwal Wheel of Family
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-wheel"
                  type="datetime-local" 
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full min-h-[44px] bg-white border border-[#C7BDA8] rounded-xl p-3 text-stone-900 focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-stone-600">
                    {unlockDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {unlockDate && (
                    <button
                      type="button"
                      onClick={handleClearDate}
                      className="text-xs font-bold text-rose-700 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-white hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#DED6C6]">
              <label htmlFor="schedule-monopoli" className="block text-lg font-bold text-green-800 mb-2">
                Jadwal Monopoli TL16
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-monopoli"
                  type="datetime-local" 
                  value={monopoliDate}
                  onChange={(e) => setMonopoliDate(e.target.value)}
                  className="w-full min-h-[44px] bg-white border border-[#C7BDA8] rounded-xl p-3 text-stone-900 focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-stone-600">
                    {monopoliDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {monopoliDate && (
                    <button
                      type="button"
                      onClick={handleClearMonopoliDate}
                      className="text-xs font-bold text-rose-700 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-white hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#DED6C6]">
              <label htmlFor="schedule-werewolf" className="block text-lg font-bold text-amber-700 mb-2">
                Jadwal Sidang Dosen Killer
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-werewolf"
                  type="datetime-local" 
                  value={werewolfDate}
                  onChange={(e) => setWerewolfDate(e.target.value)}
                  className="w-full min-h-[44px] bg-white border border-[#C7BDA8] rounded-xl p-3 text-stone-900 focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-stone-600">
                    {werewolfDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {werewolfDate && (
                    <button
                      type="button"
                      onClick={handleClearWerewolfDate}
                      className="text-xs font-bold text-rose-700 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-white hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#DED6C6]">
              <label htmlFor="schedule-uno" className="block text-lg font-bold text-green-800 mb-2">
                Jadwal UNO Sedulur 16
              </label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="schedule-uno"
                  type="datetime-local" 
                  value={unoDate}
                  onChange={(e) => setUnoDate(e.target.value)}
                  className="w-full min-h-[44px] bg-white border border-[#C7BDA8] rounded-xl p-3 text-stone-900 focus:border-amber-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-mono text-stone-600">
                    {unoDate ? 'Status: Terjadwal Aktif' : 'Status: Menunggu Jadwal'}
                  </span>
                  {unoDate && (
                    <button
                      type="button"
                      onClick={handleClearUnoDate}
                      className="text-xs font-bold text-rose-700 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-white hover:bg-rose-700 transition-colors"
                    >
                      Reset Jadwal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#DED6C6] md:col-span-2">
              <h2 className="text-lg font-bold text-amber-700 mb-2">
                Visibilitas Klasemen Angkatan
              </h2>
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#DED6C6] mt-3">
                <label htmlFor="toggle-scoreboard" className="font-bold text-stone-800 cursor-pointer">
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
                  <div className="w-14 h-7 bg-[#E7DFCE] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:left-[2px] after:bg-white after:border-[#C7BDA8] after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            <div className="bg-[#FAF6EE] p-5 rounded-xl border border-[#DED6C6] md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-green-900">
                    Pengaturan Uji Coba (Early Access)
                  </h2>
                  <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
                    Pilih alumni yang diizinkan menguji semua permainan sebelum jadwal rilis. Selama periode uji coba aktif, sesi yang dimainkan Admin bersama penerima Early Access tidak masuk ke penilaian database klasemen.
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                    earlyAccessStatus === 'active'
                      ? 'bg-green-100 text-green-900 border-green-300'
                      : earlyAccessStatus === 'scheduled'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : earlyAccessStatus === 'expired'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-white text-stone-600 border-[#DED6C6]'
                  }`}
                >
                  {earlyAccessStatus === 'active'
                    ? 'Status: Uji Coba Aktif'
                    : earlyAccessStatus === 'scheduled'
                      ? 'Status: Terjadwal'
                      : earlyAccessStatus === 'expired'
                        ? 'Status: Durasi Berakhir'
                        : 'Status: Nonaktif'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ea-start-date" className="block text-xs font-bold text-stone-800 mb-1.5">
                    Mulai Uji Coba
                  </label>
                  <input
                    id="ea-start-date"
                    type="datetime-local"
                    value={earlyAccessStart}
                    onChange={(e) => setEarlyAccessStart(e.target.value)}
                    className="w-full min-h-[44px] bg-white border border-[#C7BDA8] rounded-xl p-3 text-stone-900 focus:border-green-800"
                  />
                </div>
                <div>
                  <label htmlFor="ea-end-date" className="block text-xs font-bold text-stone-800 mb-1.5">
                    Berakhir Uji Coba
                  </label>
                  <input
                    id="ea-end-date"
                    type="datetime-local"
                    value={earlyAccessEnd}
                    onChange={(e) => setEarlyAccessEnd(e.target.value)}
                    className="w-full min-h-[44px] bg-white border border-[#C7BDA8] rounded-xl p-3 text-stone-900 focus:border-green-800"
                  />
                </div>
              </div>

              {(earlyAccessStart || earlyAccessEnd) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEarlyAccessStart('');
                      setEarlyAccessEnd('');
                    }}
                    className="text-xs font-bold text-rose-700 hover:text-white px-3 py-2 min-h-[44px] rounded-lg bg-white hover:bg-rose-700 border border-[#DED6C6] transition-colors"
                  >
                    Reset Durasi Uji Coba
                  </button>
                </div>
              )}

              <div className="bg-white p-4 rounded-xl border border-[#DED6C6] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">
                    Penerima Early Access ({earlyAccessNims.length} alumni dipilih)
                  </span>
                  {earlyAccessNims.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEarlyAccessNims([])}
                      className="text-xs font-bold text-rose-700 hover:underline min-h-[44px] px-2"
                    >
                      Kosongkan Pilihan
                    </button>
                  )}
                </div>

                {earlyAccessNims.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {earlyAccessNims.map((nim) => {
                      const found = alumniRoster.find((a) => a.nim === nim);
                      return (
                        <span
                          key={nim}
                          className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-lg bg-green-50 border border-green-300 text-xs font-semibold text-green-900"
                        >
                          <span>{found ? `${found.nama} (${nim})` : nim}</span>
                          <button
                            type="button"
                            onClick={() => toggleEarlyAccessNim(nim)}
                            aria-label={`Hapus ${found?.nama || nim} dari Early Access`}
                            className="min-w-[28px] min-h-[28px] rounded-md hover:bg-green-200 text-green-900 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div>
                  <label htmlFor="ea-search-alumni" className="sr-only">
                    Cari alumni untuk Early Access
                  </label>
                  <input
                    id="ea-search-alumni"
                    type="text"
                    value={earlyAccessSearch}
                    onChange={(e) => setEarlyAccessSearch(e.target.value)}
                    placeholder="Cari nama atau NIM alumni..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF6EE] border border-[#C7BDA8] text-sm text-stone-900 placeholder:text-stone-500"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-[#EDE6D8] border border-[#DED6C6] rounded-xl">
                  {filteredRoster.length === 0 ? (
                    <p className="p-4 text-center text-xs text-stone-600">
                      Tidak ada alumni yang cocok dengan pencarian.
                    </p>
                  ) : (
                    filteredRoster.map((person) => {
                      const checked = earlyAccessNims.includes(person.nim);
                      return (
                        <label
                          key={person.nim}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[44px] cursor-pointer transition-colors ${
                            checked ? 'bg-green-50/70' : 'hover:bg-[#FAF6EE]'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="block text-xs sm:text-sm font-bold text-stone-900 truncate">
                              {person.nama}
                            </span>
                            <span className="block text-[11px] font-mono text-stone-600">
                              NIM {person.nim}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEarlyAccessNim(person.nim)}
                            className="w-5 h-5 accent-[#14532D] shrink-0 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="bg-[#FAF6EE] p-6 rounded-xl border border-[#DED6C6] w-full mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Pemantau Pengisian Kapsul Waktu
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Pantau progres alumni yang sudah dan belum mengirim foto 2026 beserta pesan angkatan sebelum hari H.
                </p>
              </div>
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-mono font-bold text-2xl text-[#14532D]">
                  {capsuleStats.filled.length}/{capsuleStats.total}
                </span>
                <span className="text-xs font-mono font-semibold text-stone-600">
                  ({capsuleStats.pct}% terisi)
                </span>
              </div>
            </div>

            <div
              aria-label={`Progres kapsul waktu ${capsuleStats.pct} persen`}
              className="w-full h-2.5 rounded-full bg-[#E5DFD2] overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-[#14532D] transition-[width] duration-300"
                style={{ width: `${capsuleStats.pct}%` }}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div role="group" aria-label="Filter status kapsul waktu" className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-pressed={capsuleFilter === 'unfilled'}
                  onClick={() => setCapsuleFilter('unfilled')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    capsuleFilter === 'unfilled'
                      ? 'bg-[#14532D] text-white border-[#14532D]'
                      : 'bg-white text-stone-800 border-[#DED6C6] hover:bg-[#F3EDE0]'
                  }`}
                >
                  Belum Mengisi ({capsuleStats.unfilled.length})
                </button>
                <button
                  type="button"
                  aria-pressed={capsuleFilter === 'filled'}
                  onClick={() => setCapsuleFilter('filled')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    capsuleFilter === 'filled'
                      ? 'bg-[#14532D] text-white border-[#14532D]'
                      : 'bg-white text-stone-800 border-[#DED6C6] hover:bg-[#F3EDE0]'
                  }`}
                >
                  Sudah Mengisi ({capsuleStats.filled.length})
                </button>
                {capsuleStats.unfilled.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyUnfilledList}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      copiedUnfilled
                        ? 'bg-green-100 border-green-300 text-green-900'
                        : 'bg-white hover:bg-[#F3EDE0] border-[#C7BDA8] text-amber-800'
                    }`}
                  >
                    {copiedUnfilled ? 'Daftar Disalin untuk WA!' : 'Salin Daftar Belum Mengisi'}
                  </button>
                )}
              </div>

              <div className="w-full md:w-64">
                <label htmlFor="capsule-search-input" className="sr-only">
                  Cari alumni di pemantau kapsul waktu
                </label>
                <input
                  id="capsule-search-input"
                  type="text"
                  value={capsuleSearch}
                  onChange={(e) => setCapsuleSearch(e.target.value)}
                  placeholder="Cari nama atau NIM..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#C7BDA8] text-sm text-stone-900 placeholder:text-stone-500"
                />
              </div>
            </div>

            <div className="bg-white border border-[#DED6C6] rounded-xl max-h-60 overflow-y-auto divide-y divide-[#EDE6D8]">
              {displayedCapsuleList.length === 0 ? (
                <p className="p-5 text-center text-xs text-stone-600">
                  {capsuleSearch.trim()
                    ? 'Tidak ada nama yang cocok dengan kata kunci pencarian.'
                    : capsuleFilter === 'unfilled'
                      ? 'Semua alumni sudah mengisi Kapsul Waktu!'
                      : 'Belum ada alumni yang mengirim Kapsul Waktu.'}
                </p>
              ) : (
                displayedCapsuleList.map((person, idx) => (
                  <div
                    key={person.nim}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        <span className="font-mono text-stone-500 mr-2">{idx + 1}.</span>
                        {person.nama}
                      </div>
                      <div className="text-[11px] font-mono text-stone-600">
                        NIM {person.nim}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border shrink-0 ${
                        person.hasPhoto && person.hasMsg
                          ? 'bg-green-50 text-green-900 border-green-300'
                          : person.hasPhoto || person.hasMsg
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-[#FAF6EE] text-stone-700 border-[#DED6C6]'
                      }`}
                    >
                      {person.hasPhoto && person.hasMsg
                        ? 'Foto & Pesan'
                        : person.hasPhoto
                          ? 'Baru Foto'
                          : person.hasMsg
                            ? 'Baru Pesan'
                            : 'Belum Isi'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#FAF6EE] p-6 rounded-xl border border-[#DED6C6] w-full mb-8">
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Pratinjau Jadwal Kejutan Acara
            </h2>
            <p className="text-xs text-stone-600 mb-5">
              Tabel ini otomatis menyesuaikan tanggal yang diatur di atas. Kosongkan tanggal jika permainan masih ingin disimpan sebagai kejutan.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-800">
                <thead className="bg-white text-xs uppercase text-stone-600">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Bulan</th>
                    <th className="px-4 py-3">Minggu</th>
                    <th className="px-4 py-3">Permainan</th>
                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {autoRoadmap.map((item) => (
                    <tr key={item.id} className="hover:bg-white/60">
                      <td className="px-4 py-3 font-bold text-stone-900">{item.month}</td>
                      <td className="px-4 py-3 text-stone-600">{item.week}</td>
                      <td className="px-4 py-3 font-bold text-stone-900">{item.game}</td>
                      <td className="px-4 py-3">
                        {item.status === 'released' && (
                          <span className="text-green-900 font-bold text-xs bg-green-100 border border-emerald-500/40 px-2.5 py-1 rounded-md">
                            Sudah Dibuka
                          </span>
                        )}
                        {item.status === 'upcoming' && (
                          <span className="text-amber-800 font-bold text-xs bg-amber-950/80 border border-amber-400/40 px-2.5 py-1 rounded-md">
                            Terjadwal
                          </span>
                        )}
                        {item.status === 'secret' && (
                          <span className="text-stone-600 font-bold text-xs bg-white px-2.5 py-1 rounded-md border border-[#DED6C6]">
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

          <div className="bg-[#FAF6EE] p-6 rounded-xl border border-[#DED6C6] w-full mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Data Koordinat Tombol Misteri ({mysteryCoords.length} Peserta)
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Hanya tampil di Ruang Panitia. Setiap peserta hanya bisa menekan tombol ini satu kali.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchSettings}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#F3EDE0] border border-[#DED6C6] text-xs font-bold text-stone-800 transition-colors"
              >
                Segarkan
              </button>
            </div>

            {mysteryCoords.length === 0 ? (
              <p className="text-xs text-stone-600 bg-white border border-[#DED6C6] rounded-xl p-4">
                Belum ada peserta yang menekan Tombol Misteri (atau kolom mystery_location belum dibuat di Supabase).
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#DED6C6] bg-white">
                <table className="w-full text-left text-xs sm:text-sm text-stone-800">
                  <thead className="bg-[#F3EDE0] text-xs font-bold text-stone-700 border-b border-[#DED6C6]">
                    <tr>
                      <th className="px-4 py-3">Peserta</th>
                      <th className="px-4 py-3">Koordinat</th>
                      <th className="px-4 py-3">Akurasi</th>
                      <th className="px-4 py-3">Peta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE6D8]">
                    {mysteryCoords.map((item) => {
                      const loc = item.mystery_location || {};
                      return (
                        <tr key={item.nim} className="hover:bg-[#FAF6EE]">
                          <td className="px-4 py-3">
                            <div className="font-bold text-stone-900">{item.nama}</div>
                            <div className="font-mono text-xs text-stone-500">{item.nim}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-stone-800">
                            {loc.lat}, {loc.lng}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-stone-600">
                            {loc.accuracy_m ? `±${loc.accuracy_m}m` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-green-900 underline"
                            >
                              Buka Peta
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              type="button"
              onClick={() => setSecretMode(true)}
              className="min-h-[44px] bg-[#FAF6EE] border border-[#DED6C6] hover:border-amber-400 text-stone-800 hover:text-amber-700 px-6 py-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-colors"
            >
              Buka Catatan Pengembang & Panitia
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DED6C6] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-green-800 font-mono text-sm min-h-[24px]">{saveStatus}</p>
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
