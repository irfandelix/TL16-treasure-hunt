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
    if (!currentUser?.roomCode) return;

    const fetchChat = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('dosen_killer_chat')
          .select('*')
          .eq('room_code', currentUser.roomCode)
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

    const chatSub = supabase
      .channel(`dosen_killer_chat:${currentUser.roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dosen_killer_chat',
          filter: `room_code=eq.${currentUser.roomCode}`
        },
        (payload) => {
          setDaftarChat(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(chatSub);
  }, [currentUser?.roomCode]);

  useEffect(() => {
    const mhsKu = pemain.find(p => p.nim === currentUser.nim);
    if (mhsKu) setSayaSiapSkip(Boolean(mhsKu.siap_skip));
  }, [pemain, currentUser.nim]);

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
    <div className="max-w-xl mx-auto bg-white border border-[#DED6C6] rounded-2xl flex flex-col h-[75vh] overflow-hidden">
      
      <div className="bg-[#F3EDE0] p-4 border-b border-[#DED6C6] flex justify-between items-center gap-3">
        <div>
          <h2 className="text-stone-900 font-bold text-base">Ruang Diskusi Kelas</h2>
          <p className="text-xs text-stone-600 font-mono mt-0.5">
            {jumlahSiapSkip} / {pemainHidup.length} Mahasiswa Siap Pemungutan Suara
          </p>
        </div>

        {isHidup ? (
          <button 
            type="button"
            onClick={handleToggleSkip}
            className={`px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
              sayaSiapSkip 
                ? 'bg-white border border-[#C7BDA8] text-stone-800' 
                : 'bg-green-900 hover:bg-green-800 text-white'
            }`}
          >
            {sayaSiapSkip ? 'Batal Lewati Diskusi' : 'Siap Pemungutan Suara'}
          </button>
        ) : (
          <span className="text-xs text-rose-700 font-bold font-mono">Mode Penonton</span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF6EE]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-stone-600 text-sm font-mono">
            Memuat percakapan kelas...
          </div>
        ) : errorMsg ? (
          <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs text-center">
            {errorMsg}
          </div>
        ) : daftarChat.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-stone-900 font-bold text-sm mb-1">Belum Ada Pesan Diskusi</p>
            <p className="text-stone-600 text-xs max-w-xs">
              Mulai percakapan untuk berbagi petunjuk dan menemukan siapa Dosen Killer di kelas ini!
            </p>
          </div>
        ) : (
          daftarChat.map(c => {
            const isMe = c.nim === currentUser.nim;
            return (
              <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-stone-600 mb-0.5 px-1 font-mono">{c.nama}</span>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe 
                    ? 'bg-green-900 text-white rounded-tr-none' 
                    : 'bg-white text-stone-900 rounded-tl-none border border-[#DED6C6]'
                }`}>
                  {c.pesan}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={KirimPesan} className="p-3 bg-white border-t border-[#DED6C6] flex gap-2">
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
          className="flex-1 min-h-[44px] bg-[#FAF6EE] border border-[#C7BDA8] text-stone-900 px-4 py-2.5 rounded-xl text-sm focus:border-green-800 focus:bg-white placeholder:text-stone-400 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!isHidup || !pesan.trim()}
          className="min-h-[44px] bg-green-900 hover:bg-green-800 text-white font-bold px-5 rounded-xl transition-colors disabled:bg-stone-300 disabled:text-stone-600"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
