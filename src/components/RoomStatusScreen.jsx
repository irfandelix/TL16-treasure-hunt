import React from 'react';

export const ROOM_STATUS_COPY = {
  not_found: {
    badge: 'Ruangan Tidak Ditemukan',
    title: 'Kode ruangan tidak ditemukan',
    description:
      'Ruangan mungkin sudah dibatalkan oleh pembuat ruangan, kedaluwarsa, atau kode yang dimasukkan keliru.',
    tone: 'neutral'
  },
  finished: {
    badge: 'Permainan Selesai',
    title: 'Permainan di ruangan ini sudah selesai',
    description:
      'Sesi di ruangan ini telah berakhir. Silakan buat ruangan baru di lobi atau bergabung ke ruangan lain yang masih terbuka.',
    tone: 'amber'
  },
  expired: {
    badge: 'Sesi Berakhir',
    title: 'Sesi ruangan sudah kedaluwarsa',
    description:
      'Ruangan ini tidak lagi aktif karena melewati batas waktu sesi. Silakan buat ruangan baru untuk bermain lagi.',
    tone: 'neutral'
  },
  started: {
    badge: 'Sedang Berlangsung',
    title: 'Permainan sudah dimulai',
    description:
      'Pemain lain sedang bertanding di ruangan ini sehingga pemain baru belum bisa bergabung. Tunggu sesi berikutnya atau buat ruangan baru.',
    tone: 'amber'
  },
  full: {
    badge: 'Ruangan Penuh',
    title: 'Kuota pemain ruangan sudah penuh',
    description:
      'Jumlah peserta di ruangan ini telah mencapai batas maksimal. Kamu bisa membuat ruangan baru untuk mengajak teman lainnya.',
    tone: 'amber'
  },
  cancelled: {
    badge: 'Ruangan Dibatalkan',
    title: 'Ruangan ini telah dibatalkan',
    description:
      'Ruangan ditutup sebelum permainan dimulai. Kembali ke lobi untuk membuat atau masuk ke ruangan lain.',
    tone: 'neutral'
  }
};

function StatusIcon({ status }) {
  const isFinishedOrActive = status === 'finished' || status === 'started' || status === 'full';
  const colorClass = isFinishedOrActive ? 'text-[#B45309] bg-amber-50 border-amber-200' : 'text-zinc-700 bg-[#F1ECE0] border-[#DED8CA]';

  return (
    <div
      aria-hidden="true"
      className={`w-14 h-14 mx-auto mb-5 rounded-2xl border flex items-center justify-center ${colorClass}`}
    >
      {status === 'finished' ? (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22V4" />
          <path d="M4 5h12l-2 4 2 4H4" />
        </svg>
      ) : status === 'full' ? (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ) : status === 'expired' || status === 'started' ? (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
      ) : (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8.5" y1="8.5" x2="13.5" y2="13.5" />
          <line x1="13.5" y1="8.5" x2="8.5" y2="13.5" />
        </svg>
      )}
    </div>
  );
}

export default function RoomStatusScreen({
  gameName = 'Permainan',
  status = 'not_found',
  roomCode = '',
  onBackToLobby,
  onBackHome
}) {
  const copy = ROOM_STATUS_COPY[status] || ROOM_STATUS_COPY.not_found;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[65vh] p-4">
      <div className="w-full max-w-md bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl p-6 sm:p-8 text-center shadow-sm">
        <StatusIcon status={status} />

        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#B45309] mb-1.5">
          {gameName}
        </p>

        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-3">
          {copy.title}
        </h1>

        {roomCode && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] font-mono text-xs font-bold text-zinc-800 mb-4">
            <span>Kode Ruangan:</span>
            <span className="text-zinc-950 tracking-wider">{roomCode}</span>
          </div>
        )}

        <p className="text-sm text-zinc-700 leading-relaxed mb-7">
          {copy.description}
        </p>

        <div className="flex flex-col gap-2.5">
          {onBackToLobby && (
            <button
              type="button"
              onClick={onBackToLobby}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-bold text-sm transition-colors"
            >
              Kembali ke Lobi {gameName}
            </button>
          )}
          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#F1ECE0] hover:bg-[#E5DFD2] border border-[#DED8CA] text-zinc-900 font-bold text-sm transition-colors"
            >
              Kembali ke Beranda Perayaan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
