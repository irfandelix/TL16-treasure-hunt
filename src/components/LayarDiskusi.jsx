import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LayarDiskusi({ pemain, isHidup, currentUser }) {
  const [pesan, setPesan] = useState('');
  const [daftarChat, setDaftarChat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [sayaSiapSkip, setSayaSiapSkip] = useState(false);
  
  const chatEndRef = useRef(null);

  const pemainHidup = pemain.filter(p => p.is_hidup);
  const jumlahSiapSkip = pemain.filter(p => p.siap_skip).length;

  useEffect(() => {
    const fetchChat = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('dosen_killer_chat')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (data) setDaftarChat(data);
      } catch (err) {
        console.error('Gagal memuat pesan diskusi:', err.message);
        setErrorMsg('Gagal memuat riwayat percakapan.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchChat();

    const mhsKu = pemain.find(p => p.nim === currentUser.nim);
    if (mhsKu) setSayaSiapSkip(mhsKu.siap_skip || false);

    const chatSub = supabase.channel('public:dosen_killer_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dosen_killer_chat' }, (payload) => {
        setDaftarChat(prev => [...prev, payload.new]);
      }).subscribe();

    return () => supabase.removeChannel(chatSub);
  }, [pemain]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [daftarChat]);

  const KirimPesan = async (e) => {
    e.preventDefault();
    if (!pesan.trim() || !isHidup) return;

    await supabase.from('dosen_killer_chat').insert([{
      room_code: currentUser.roomCode,
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
      .eq('room_code', currentUser.roomCode)
      .eq('nim', currentUser.nim);
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl flex flex-col h-[75vh] shadow-md overflow-hidden">
      
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center gap-3">
        <div>
          <h2 className="text-white font-bold text-base">Ruang Diskusi Kelas</h2>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            {jumlahSiapSkip} / {pemainHidup.length} Mahasiswa Siap Pemungutan Suara
          </p>
        </div>

        {isHidup ? (
          <button 
            type="button"
            onClick={handleToggleSkip}
            className={`px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
              sayaSiapSkip 
                ? 'bg-slate-800 border border-slate-600 text-slate-200' 
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            }`}
          >
            {sayaSiapSkip ? 'Batal Lewati Diskusi' : 'Siap Pemungutan Suara'}
          </button>
        ) : (
          <span className="text-xs text-rose-400 font-bold font-mono">Mode Penonton</span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/50">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-300 text-sm font-mono">
            Memuat percakapan kelas...
          </div>
        ) : errorMsg ? (
          <div role="alert" className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs text-center">
            {errorMsg}
          </div>
        ) : daftarChat.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-slate-200 font-bold text-sm mb-1">Belum Ada Pesan Diskusi</p>
            <p className="text-slate-300 text-xs max-w-xs">
              Mulai percakapan untuk berbagi petunjuk dan menemukan siapa Dosen Killer di kelas ini!
            </p>
          </div>
        ) : (
          daftarChat.map(c => {
            const isMe = c.nim === currentUser.nim;
            return (
              <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-slate-300 mb-0.5 px-1 font-mono">{c.nama}</span>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe 
                    ? 'bg-emerald-700 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                }`}>
                  {c.pesan}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={KirimPesan} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
        <label htmlFor="diskusi-chat-input" className="sr-only">
          Tulis pesan diskusi
        </label>
        <input
          id="diskusi-chat-input"
          type="text"
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          disabled={!isHidup}
          placeholder={isHidup ? "Tulis pendapat atau petunjukmu di sini..." : "Kamu sedang menjadi penonton."}
          className="flex-1 min-h-[44px] bg-slate-800 border border-slate-600 text-white px-4 py-2.5 rounded-xl text-sm focus:border-amber-400 placeholder:text-slate-400 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!isHidup || !pesan.trim()}
          className="min-h-[44px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 rounded-xl transition-colors disabled:bg-slate-700 disabled:text-slate-300"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
