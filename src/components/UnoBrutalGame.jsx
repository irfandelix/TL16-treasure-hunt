import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CARD_COLORS = [
  { name: 'Merah', bg: 'bg-rose-700', border: 'border-rose-400', text: 'text-white' },
  { name: 'Kuning', bg: 'bg-amber-400', border: 'border-amber-200', text: 'text-slate-950' },
  { name: 'Hijau', bg: 'bg-emerald-700', border: 'border-emerald-400', text: 'text-white' },
  { name: 'Biru', bg: 'bg-sky-700', border: 'border-sky-400', text: 'text-white' },
];

const CARD_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'Skip', 'Titip Absen'];

const generateRandomCard = () => {
  const color = CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  return { id: `${Date.now()}-${Math.random()}`, color, value };
};

export default function UnoBrutalGame() {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomStatus, setRoomStatus] = useState('waiting');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [topCard, setTopCard] = useState(() => generateRandomCard());
  const [myHand, setMyHand] = useState([]);
  const [statusNotice, setStatusNotice] = useState('');

  useEffect(() => {
    const nim = localStorage.getItem('user_nim');
    const nama = localStorage.getItem('user_nama');
    if (nim && nama) {
      setUser({ nim, nama });
    }
  }, []);

  useEffect(() => {
    if (!currentRoom) return;

    const fetchRoomState = async () => {
      const { data: pData } = await supabase
        .from('uno_players')
        .select('*')
        .eq('room_code', currentRoom)
        .order('joined_at', { ascending: true });
      if (pData) setPlayers(pData);

      const { data: rData } = await supabase
        .from('uno_rooms')
        .select('status')
        .eq('room_code', currentRoom)
        .single();
      if (rData?.status) {
        setRoomStatus(rData.status);
      }
    };
    fetchRoomState();

    const playerSubscription = supabase
      .channel(`public:uno_players:${currentRoom}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'uno_players', filter: `room_code=eq.${currentRoom}` },
        () => {
          fetchRoomState();
        }
      )
      .subscribe();

    const roomSubscription = supabase
      .channel(`public:uno_rooms:${currentRoom}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'uno_rooms', filter: `room_code=eq.${currentRoom}` },
        (payload) => {
          if (payload.new?.status) {
            setRoomStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(roomSubscription);
    };
  }, [currentRoom]);

  useEffect(() => {
    if (roomStatus === 'playing' && myHand.length === 0) {
      const initialHand = Array.from({ length: 5 }, () => generateRandomCard());
      setMyHand(initialHand);
      setStatusNotice('Permainan dimulai! Pilih kartu dengan warna atau angka yang senada.');
    }
  }, [roomStatus]);

  const createRoom = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    
    const code = Math.random().toString(36).substring(2, 6).toUpperCase(); 

    try {
      const { error: roomError } = await supabase
        .from('uno_rooms')
        .insert([{ room_code: code, host_nim: user.nim, status: 'waiting' }]);
      if (roomError) throw roomError;

      const { error: playerError } = await supabase
        .from('uno_players')
        .insert([{ room_code: code, nim: user.nim, nama: user.nama, is_host: true }]);
      if (playerError) throw playerError;

      setRoomStatus('waiting');
      setCurrentRoom(code);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal membuat meja baru. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode || !user) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('uno_rooms')
        .select('status')
        .eq('room_code', roomCode)
        .single();
      
      if (roomError || !roomData) throw new Error('Meja tidak ditemukan. Periksa kembali kode meja.');
      if (roomData.status !== 'waiting') throw new Error('Permainan di meja ini sudah dimulai atau selesai.');

      const { error: playerError } = await supabase
        .from('uno_players')
        .insert([{ room_code: roomCode, nim: user.nim, nama: user.nama, is_host: false }]);
      
      if (playerError && playerError.code !== '23505') throw playerError; 

      setRoomStatus(roomData.status);
      setCurrentRoom(roomCode);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal bergabung ke meja.');
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!currentRoom) return;
    if (players.length < 2) {
      setErrorMsg('Minimal 2 pemain diperlukan di meja untuk memulai permainan.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('uno_rooms')
        .update({ status: 'playing' })
        .eq('room_code', currentRoom);
      if (error) throw error;
      setRoomStatus('playing');
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memulai permainan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayCard = (card) => {
    const isMatch =
      card.color.name === topCard.color.name ||
      card.value === topCard.value ||
      card.value === 'Titip Absen';

    if (!isMatch) {
      setStatusNotice(`Kartu ${card.color.name} (${card.value}) belum cocok dengan kartu di meja.`);
      return;
    }

    setTopCard(card);
    const remaining = myHand.filter((c) => c.id !== card.id);
    setMyHand(remaining);
    if (remaining.length === 0) {
      setStatusNotice('UNO Habis! Selamat, kamu berhasil menghabiskan semua kartu di tangan!');
    } else {
      setStatusNotice(`Berhasil mengeluarkan kartu ${card.color.name} (${card.value})!`);
    }
  };

  const handleDrawCard = () => {
    const newCard = generateRandomCard();
    setMyHand((prev) => [...prev, newCard]);
    setStatusNotice(`Mengambil 1 kartu tambahan: ${newCard.color.name} (${newCard.value}).`);
  };

  const leaveRoom = async () => {
    if (currentRoom && user) {
      await supabase.from('uno_players').delete().match({ room_code: currentRoom, nim: user.nim });
    }
    setCurrentRoom(null);
    setRoomStatus('waiting');
    setPlayers([]);
    setMyHand([]);
    setRoomCode('');
    setErrorMsg('');
  };

  if (!currentRoom) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <div className="text-center mb-8">
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            Permainan Kartu Seru
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
            UNO Sedulur 16
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Adu cepat habiskan kartu bersama teman satu angkatan dengan kartu spesial ala kuliah.
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="bg-rose-950/60 border border-rose-500/40 text-rose-300 p-4 rounded-xl mb-6 text-center font-semibold text-sm">
            {errorMsg}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-md flex flex-col justify-between text-center">
            <div>
              <p className="text-xs font-mono font-bold text-amber-400 uppercase mb-1">Pembuat Meja</p>
              <h2 className="text-2xl font-bold text-white mb-2">Buka Meja Baru</h2>
              <p className="text-slate-300 text-sm mb-6">
                Buat kode meja 4 karakter dan ajak teman-teman Sedulur 16 bergabung.
              </p>
            </div>
            <button 
              type="button"
              onClick={createRoom}
              disabled={loading}
              className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Membuat Meja...' : 'Buat Meja Baru'}
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-md flex flex-col justify-between text-center">
            <div>
              <p className="text-xs font-mono font-bold text-emerald-400 uppercase mb-1">Pemain Tamu</p>
              <h2 className="text-2xl font-bold text-white mb-2">Gabung ke Meja</h2>
              <p className="text-slate-300 text-sm mb-4">
                Masukkan 4 karakter kode meja yang dibagikan oleh temanmu.
              </p>
            </div>
            <form onSubmit={joinRoom} className="w-full flex flex-col gap-3">
              <label htmlFor="uno-room-code" className="sr-only">
                Kode Meja 4 Karakter
              </label>
              <input 
                id="uno-room-code"
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="KODE 4 DIGIT"
                maxLength={4}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3.5 text-center text-xl font-mono font-bold text-white tracking-widest focus:border-amber-400 placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal uppercase"
              />
              <button 
                type="submit"
                disabled={loading || roomCode.length < 4}
                className="w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Bergabung...' : 'Masuk ke Meja'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-amber-400 font-bold mb-4 text-base">
            Aturan Seru UNO Sedulur 16
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <h4 className="font-bold text-white mb-1">Tumpuk Kartu +2</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Kartu +2 dapat ditumpuk dengan kartu +2 lainnya agar giliran berikutnya menarik lebih banyak kartu.
              </p>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <h4 className="font-bold text-white mb-1">Cocok Warna atau Angka</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Keluarkan kartu yang memiliki warna atau nilai yang sama dengan kartu teratas di meja.
              </p>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <h4 className="font-bold text-white mb-1">Kartu Titip Absen</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Kartu bebas (Wild) khas anak kuliah yang dapat dimainkan di atas warna kartu apa saja.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isHost = players.find(p => p.nim === user?.nim)?.is_host;

  return (
    <div className="max-w-5xl mx-auto min-h-[75vh] flex flex-col bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-md relative">
      
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex flex-wrap justify-between items-center gap-3 z-20">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold text-lg">UNO Sedulur 16</span>
          <span className="bg-slate-800 text-slate-200 px-3 py-1 rounded-lg font-mono text-sm font-bold border border-slate-700">
            Meja: <span className="text-amber-400">{currentRoom}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={leaveRoom}
          className="text-xs bg-slate-800 text-slate-200 border border-slate-600 hover:bg-rose-700 hover:text-white hover:border-rose-600 px-4 py-2 min-h-[44px] rounded-xl transition-colors font-bold"
        >
          Keluar Meja
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="m-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold text-center">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 p-6 flex flex-col justify-between bg-slate-900/50 gap-6">
        
        <div className="flex flex-wrap gap-3">
          {players.map((p) => (
            <div key={p.nim} className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl flex flex-col items-center min-w-[100px] shadow-sm">
              <span className="text-xs font-mono text-amber-400 mb-0.5">
                {p.is_host ? 'Host Meja' : 'Pemain'}
              </span>
              <span className="font-bold text-white text-sm truncate max-w-[140px]">
                {p.nama.split(' ')[0]}
              </span>
              <span className="mt-1 text-xs font-mono text-emerald-300 bg-slate-900 border border-emerald-500/30 px-2 py-0.5 rounded">
                {roomStatus === 'playing' ? 'Sedang Bermain' : 'Siap'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center my-4">
          <div className="flex gap-6 items-center">
            <button
              type="button"
              onClick={roomStatus === 'playing' ? handleDrawCard : undefined}
              disabled={roomStatus !== 'playing'}
              className="w-28 h-40 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 rounded-xl shadow-md flex flex-col items-center justify-center p-3 transition-colors disabled:opacity-60"
            >
              <span className="text-amber-400 font-bold text-lg">AMBIL</span>
              <span className="text-slate-300 text-xs font-mono mt-1">Tumpukan Kartu</span>
            </button>

            {roomStatus === 'playing' ? (
              <div className={`w-28 h-40 ${topCard.color.bg} ${topCard.color.text} border-2 ${topCard.color.border} rounded-xl shadow-md flex flex-col items-center justify-between p-3`}>
                <span className="text-xs font-mono font-bold self-start">{topCard.color.name}</span>
                <span className="text-2xl font-bold text-center">{topCard.value}</span>
                <span className="text-xs font-mono font-bold self-end">TL16</span>
              </div>
            ) : (
              <div className="w-28 h-40 bg-slate-800 border-2 border-slate-700 border-dashed rounded-xl flex items-center justify-center p-3">
                <span className="text-slate-300 text-xs text-center font-mono">
                  Menunggu Permainan Dimulai
                </span>
              </div>
            )}
          </div>

          {statusNotice && (
            <p className="mt-4 text-sm text-amber-300 font-medium text-center bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
              {statusNotice}
            </p>
          )}
        </div>

        {roomStatus === 'waiting' ? (
          <div className="flex flex-col items-center justify-center pb-4">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={startGame}
                  disabled={loading}
                  className="min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-10 py-3.5 rounded-xl text-lg shadow-md transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memulai Permainan...' : 'Mulai Permainan Kartu'}
                </button>
                <p className="text-slate-300 text-xs text-center mt-2 font-mono">
                  Minimal 2 pemain di dalam meja untuk memulai ({players.length} pemain hadir)
                </p>
              </>
            ) : (
              <p className="text-slate-300 text-sm font-mono text-center">
                Menunggu Host memulai permainan...
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-white">Kartu di Tanganmu ({myHand.length})</h2>
              <button
                type="button"
                onClick={handleDrawCard}
                className="text-xs font-bold bg-slate-900 hover:bg-slate-700 text-amber-400 border border-slate-600 px-3 py-2 min-h-[44px] rounded-lg transition-colors"
              >
                + Ambil 1 Kartu
              </button>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {myHand.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handlePlayCard(card)}
                  className={`w-24 h-36 ${card.color.bg} ${card.color.text} border-2 ${card.color.border} rounded-xl shadow-sm hover:-translate-y-1 transition-transform flex flex-col items-center justify-between p-2.5`}
                >
                  <span className="text-[11px] font-mono font-bold self-start">{card.color.name}</span>
                  <span className="text-lg font-bold text-center leading-tight">{card.value}</span>
                  <span className="text-[10px] font-mono self-end">Mainkan</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
