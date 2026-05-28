import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LayarDiskusi({ pemain, isHidup, currentUser }) {
  const [pesan, setPesan] = useState('');
  const [daftarChat, setDaftarChat] = useState([]);
  const [sayaSiapSkip, setSayaSiapSkip] = useState(false);
  
  const chatEndRef = useRef(null);

  // Hitung pemain hidup dan berapa orang yang sudah klik skip
  const pemainHidup = pemain.filter(p => p.is_hidup);
  const jumlahSiapSkip = pemain.filter(p => p.siap_skip).length;

  useEffect(() => {
    // 1. Ambil data chat awal
    const fetchChat = async () => {
      const { data } = await supabase
        .from('dosen_killer_chat')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) setDaftarChat(data);
    };
    fetchChat();

    // 2. Ambil status tombol skip milik pribadi
    const mhsKu = pemain.find(p => p.nim === currentUser.nim);
    if (mhsKu) setSayaSiapSkip(mhsKu.siap_skip || false);

    // 3. Radar Realtime untuk pesan chat baru masuk
    const chatSub = supabase.channel('public:dosen_killer_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dosen_killer_chat' }, (payload) => {
        setDaftarChat(prev => [...prev, payload.new]);
      }).subscribe();

    return () => supabase.removeChannel(chatSub);
  }, [pemain]);

  useEffect(() => {
    // Auto scroll chat ke baris paling bawah saat ada pesan baru
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [daftarChat]);

  const KirimPesan = async (e) => {
    e.preventDefault();
    if (!pesan.trim() || !isHidup) return;

    await supabase.from('dosen_killer_chat').insert([{
      room_code: currentUser.roomCode, // <-- Wajib ikut dikirim agar chat masuk ke room yang benar
      nim: currentUser.nim,
      nama: currentUser.nama,
      pesan: pesan
    }]);

    setPesan('');
  };

  const handleToggleSkip = async () => {
    if (!isHidup) return;
    const statusBaru = !sayaSiapSkip;
    setSayaSiapSkip(statusBaru);

    await supabase
      .from('mahasiswa_roles')
      .update({ siap_skip: statusBaru })
      .eq('room_code', currentUser.roomCode) // <-- Tambahan penyaring room
      .eq('nim', currentUser.nim);
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[75vh] shadow-2xl overflow-hidden animate-in fade-in duration-300">
      
      {/* HEADER: KONTROL BAR KESEPAKATAN SKIP VOTING */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-white font-bold text-sm">💬 Ruang Sidang Angkatan</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            {jumlahSiapSkip} / {pemainHidup.length} Sepakat Langsung Voting
          </p>
        </div>

        {isHidup ? (
          <button 
            onClick={handleToggleSkip}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              sayaSiapSkip 
                ? 'bg-slate-800 border border-slate-700 text-slate-400' 
                : 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/10 hover:bg-yellow-400'
            }`}
          >
            {sayaSiapSkip ? '❌ Batal Skip' : '⏩ Siap Voting'}
          </button>
        ) : (
          <span className="text-xs text-red-500 font-bold font-mono">SILENT MODE (DEAD)</span>
        )}
      </div>

      {/* ISI KOTAK LIVE CHAT */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/50">
        {daftarChat.map(c => {
          const isMe = c.nim === currentUser.nim;
          return (
            <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-mono">{c.nama}</span>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe 
                  ? 'bg-red-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
              }`}>
                {c.pesan}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT FORM KETIK CHAT */}
      <form onSubmit={KirimPesan} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          disabled={!isHidup}
          placeholder={isHidup ? "Ketik alibi atau tuduhanmu di sini..." : "Anda sudah di-DO, dilarang mengetik."}
          className="flex-1 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          disabled={!isHidup || !pesan.trim()}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}