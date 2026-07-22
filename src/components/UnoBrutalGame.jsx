// src/components/UnoBrutalGame.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function UnoBrutalGame() {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Ambil data user dari localStorage
  useEffect(() => {
    const nim = localStorage.getItem('user_nim');
    const nama = localStorage.getItem('user_nama');
    if (nim && nama) {
      setUser({ nim, nama });
    }
  }, []);

  // 2. Efek Realtime Subscription (Aktif kalau sedang di dalam room)
  useEffect(() => {
    if (!currentRoom) return;

    // Tarik data pemain yang sudah ada di meja saat ini
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('uno_players')
        .select('*')
        .eq('room_code', currentRoom)
        .order('joined_at', { ascending: true });
      if (data) setPlayers(data);
    };
    fetchPlayers();

    // Berlangganan (Subscribe) perubahan di tabel uno_players
    const playerSubscription = supabase
      .channel('public:uno_players')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'uno_players', filter: `room_code=eq.${currentRoom}` },
        (payload) => {
          console.log('Perubahan Pemain:', payload);
          fetchPlayers(); // Ambil ulang data kalau ada yang join/leave
        }
      )
      .subscribe();

    // Bersihkan langganan kalau keluar room
    return () => {
      supabase.removeChannel(playerSubscription);
    };
  }, [currentRoom]);

  // 3. Fungsi Membuat Meja (Create Room)
  const createRoom = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    
    // Bikin kode acak 4 huruf/angka (Contoh: A4B2)
    const code = Math.random().toString(36).substring(2, 6).toUpperCase(); 

    try {
      // Bikin room di tabel uno_rooms
      const { error: roomError } = await supabase
        .from('uno_rooms')
        .insert([{ room_code: code, host_nim: user.nim, status: 'waiting' }]);
      if (roomError) throw roomError;

      // Masukkan diri sendiri sbg Host ke tabel uno_players
      const { error: playerError } = await supabase
        .from('uno_players')
        .insert([{ room_code: code, nim: user.nim, nama: user.nama, is_host: true }]);
      if (playerError) throw playerError;

      setCurrentRoom(code);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal bikin meja, coba lagi!');
    } finally {
      setLoading(false);
    }
  };

  // 4. Fungsi Gabung Meja (Join Room)
  const joinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode || !user) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // Cek apakah roomnya ada dan masih waiting
      const { data: roomData, error: roomError } = await supabase
        .from('uno_rooms')
        .select('status')
        .eq('room_code', roomCode)
        .single();
      
      if (roomError || !roomData) throw new Error('Meja tidak ditemukan!');
      if (roomData.status !== 'waiting') throw new Error('Game sudah dimulai atau selesai!');

      // Masukkan diri sendiri ke tabel uno_players
      const { error: playerError } = await supabase
        .from('uno_players')
        .insert([{ room_code: roomCode, nim: user.nim, nama: user.nama, is_host: false }]);
      
      // Abaikan error kalau ternyata sebelumnya udah pernah join (refresh browser)
      if (playerError && playerError.code !== '23505') throw playerError; 

      setCurrentRoom(roomCode);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal masuk meja!');
    } finally {
      setLoading(false);
    }
  };

  // 5. Fungsi Keluar Meja
  const leaveRoom = async () => {
    if (currentRoom && user) {
      // Hapus data pemain dari tabel
      await supabase.from('uno_players').delete().match({ room_code: currentRoom, nim: user.nim });
    }
    setCurrentRoom(null);
    setPlayers([]);
    setRoomCode('');
  };


  // ==============================================================
  // TAMPILAN 1: LOBBY (BELUM MASUK ROOM)
  // ==============================================================
  if (!currentRoom) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-500 pb-20">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] mb-2 uppercase">
            UNO Brutal
          </h1>
          <p className="text-slate-400 font-mono text-sm">Hancurkan pertemanan sedulur 16 hanya dalam 5 menit.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-xl mb-6 text-center font-bold animate-bounce">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-red-900/50 p-8 rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.15)] flex flex-col items-center text-center">
            <div className="text-6xl mb-6 drop-shadow-lg">🔥</div>
            <h2 className="text-2xl font-bold text-white mb-2">Bikin Meja Baru</h2>
            <p className="text-slate-400 text-sm mb-8">Jadi bandar. Undang kawan-kawan buat main aturan brutal.</p>
            <button 
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-lg py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'MEMBUAT MEJA...' : 'CREATE ROOM'}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl flex flex-col items-center text-center">
            <div className="text-6xl mb-6 drop-shadow-lg">🃏</div>
            <h2 className="text-2xl font-bold text-white mb-2">Gabung Meja</h2>
            <p className="text-slate-400 text-sm mb-8">Masukkan kode meja dari temanmu dan bersiaplah menderita.</p>
            <form onSubmit={joinRoom} className="w-full flex flex-col gap-4">
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="KODE 4 DIGIT"
                maxLength={4}
                className="w-full bg-slate-950 border border-slate-600 rounded-xl p-4 text-center text-2xl font-black text-white tracking-[0.5em] focus:border-red-500 focus:outline-none placeholder:text-slate-700 placeholder:font-normal placeholder:tracking-normal uppercase"
              />
              <button 
                type="submit"
                disabled={loading || roomCode.length < 4}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black text-lg py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'MENYUSUP...' : 'JOIN ROOM'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 bg-red-950/20 border border-red-900/30 rounded-2xl p-6">
          <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2">
            <span>⚠️</span> HOUSE RULES (ATURAN BRUTAL)
          </h3>
          <ul className="text-slate-400 text-sm space-y-2 list-disc list-inside">
            <li><strong className="text-slate-300">Stacking:</strong> +2 bisa ditumpuk +2. +4 bisa ditumpuk +4. Mampus yang terakhir.</li>
            <li><strong className="text-slate-300">Potong Jalan:</strong> Punya kartu yang sama persis? Lempar aja walau bukan giliranmu!</li>
            <li><strong className="text-slate-300">Kartu Titip Absen:</strong> Efek rahasia khusus yang cuma ada di versi ini.</li>
          </ul>
        </div>
      </div>
    );
  }

  // ==============================================================
  // TAMPILAN 2: DALAM ROOM (WAITING / PLAYING)
  // ==============================================================
  const isHost = players.find(p => p.nim === user?.nim)?.is_host;

  return (
    <div className="max-w-5xl mx-auto h-[80vh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in duration-300">
      
      {/* ROOM HEADER */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center z-20">
        <div>
          <span className="text-red-500 font-black text-xl tracking-widest uppercase md:inline hidden">UNO BRUTAL</span>
          <span className="md:ml-4 bg-slate-800 text-slate-300 px-3 py-1 rounded-md font-mono text-sm font-bold tracking-widest border border-slate-600">
            ROOM: <span className="text-yellow-400">{currentRoom}</span>
          </span>
        </div>
        <button onClick={leaveRoom} className="text-xs bg-slate-800 text-slate-300 border border-slate-600 hover:bg-red-900 hover:text-white hover:border-red-500 px-4 py-2 rounded-lg transition-colors font-bold">
          KABUR 🏃
        </button>
      </div>

      {/* GAME BOARD AREA */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
        
        {/* PUSAT MEJA (Tumpukan Kartu & Deck) */}
        <div className="relative flex gap-8 items-center z-10 scale-90 md:scale-100">
          <div className="w-24 h-36 bg-slate-950 border-2 border-red-900 rounded-xl shadow-[5px_5px_0_rgba(153,27,27,1)] flex items-center justify-center opacity-50">
            <span className="text-red-900 font-black text-2xl -rotate-45">UNO</span>
          </div>
          <div className="w-24 h-36 bg-slate-800 border-2 border-slate-600 border-dashed rounded-xl flex items-center justify-center rotate-6">
            <span className="text-slate-500 text-xs text-center font-mono">Menunggu<br/>Game Mulai</span>
          </div>
        </div>

        {/* LIST PEMAIN (REALTIME DARI SUPABASE) */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 md:gap-4 max-w-[70%]">
          {players.map((p) => (
            <div key={p.nim} className="bg-slate-800/90 backdrop-blur border border-slate-600 px-3 py-2 rounded-xl flex flex-col items-center min-w-[80px] md:min-w-[100px] shadow-lg animate-in slide-in-from-top-4">
              <span className="text-[10px] text-slate-400 mb-1">{p.is_host ? '👑 Bandar' : 'Pemain'}</span>
              <span className="font-bold text-white text-xs md:text-sm truncate w-full text-center">{p.nama.split(' ')[0]}</span>
              {/* Nanti jumlah kartu diambil dari p.hand.length */}
              <span className="mt-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Menunggu</span>
            </div>
          ))}
        </div>

        {/* TOMBOL MULAI (KHUSUS HOST) */}
        {isHost && (
          <div className="absolute bottom-24 z-20">
            <button className="bg-green-600 hover:bg-green-500 text-white font-black px-12 py-4 rounded-full text-xl shadow-[0_0_30px_rgba(22,163,74,0.4)] animate-bounce transition-transform active:scale-95">
              MULAI BANTAI!
            </button>
            <p className="text-slate-400 text-xs text-center mt-3 font-mono">Minimal butuh 2 pemain</p>
          </div>
        )}

      </div>

    </div>
  );
}