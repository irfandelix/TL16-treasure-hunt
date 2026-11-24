import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRoomConnection, pickActiveCoordinator, shouldBotControlPlayer } from '../lib/useRoomConnection';
import StoryShareButton from './StoryShareButton';
import InviteLinkButton from './InviteLinkButton';
import RoomStatusScreen from './RoomStatusScreen';
import SoloGamePrepScreen from './SoloGamePrepScreen';
import { UnoCard, UnoDeckBack, UnoMiniBack, UnoDirectionRing, UnoCardCatalog } from './UnoCard';
import { getLocalAvatarConfig } from '../lib/avatarHelper';
import { cleanupFinishedRooms, isFinishedRoomExpired } from '../lib/roomCleanup';
import { checkShouldSkipRoomScoring, awardAlumniPoints } from '../lib/earlyAccess';
import {
  CARD_COLORS,
  CARD_SUBLABELS,
  INITIAL_HAND_SIZE,
  MERCY_LIMIT,
  buildUnoStandings,
  formatUnoPoints,
  generateInitialTopCard,
  generateRandomCard,
  getActivePlayers,
  getDrawPower,
  getNextActivePlayerNim,
  getRoomMeta,
  getUnoRankReward,
  isCardPlayable,
  isPlayerEliminated,
  isPlayerFinished,
  isWildCard,
  normalizeCardColor,
  pickBestWildColor,
  pickBotUnoCard
} from '../lib/unoBrutalRules';

const shortName = (nama) => (nama ? String(nama).split(' ')[0] : 'Pemain');

const COLOR_HEX_MAP = {
  Merah: '#BE123C',
  Kuning: '#EAB308',
  Hijau: '#15803D',
  Biru: '#0369A1',
  Bebas: '#1C1917'
};

function getTableSeats(players = [], myNim) {
  if (!Array.isArray(players) || players.length <= 1) {
    return { allOpponents: [], left: null, top: [], right: null };
  }
  const myIdx = players.findIndex((p) => p.nim === myNim);
  const rotated =
    myIdx >= 0
      ? [...players.slice(myIdx + 1), ...players.slice(0, myIdx)]
      : players.filter((p) => p.nim !== myNim);

  if (rotated.length === 1) {
    return { allOpponents: rotated, left: null, top: [rotated[0]], right: null };
  }
  if (rotated.length === 2) {
    return { allOpponents: rotated, left: rotated[0], top: [], right: rotated[1] };
  }
  return {
    allOpponents: rotated,
    left: rotated[0],
    top: rotated.slice(1, rotated.length - 1),
    right: rotated[rotated.length - 1]
  };
}

function launchFlyingCardGhost(fromRect, toRect, { bg = '#1C1917', label = 'TL16', isBack = false, duration = 300 } = {}) {
  if (typeof window === 'undefined' || !fromRect || !toRect) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ghost = document.createElement('div');
  ghost.className = 'uno-fly-card';
  ghost.style.left = `${fromRect.left}px`;
  ghost.style.top = `${fromRect.top}px`;
  ghost.style.width = `${fromRect.width}px`;
  ghost.style.height = `${fromRect.height}px`;

  const cardEl = document.createElement('div');
  cardEl.className = 'uno-card flex items-center justify-center p-2';
  cardEl.style.width = '100%';
  cardEl.style.height = '100%';
  cardEl.style.background = isBack ? '#1C1917' : bg;
  cardEl.style.color = bg === '#EAB308' ? '#1C1917' : '#FFFFFF';
  cardEl.innerHTML = isBack
    ? '<div class="uno-card-oval bg-[#14532D] border-2 border-[#D97706]"></div><span class="relative z-10 text-[#FEF3C7] font-black text-sm -rotate-12">TL16</span>'
    : `<div class="uno-card-oval" style="background:rgba(255,255,255,0.18)"></div><span class="relative z-10 font-black text-xl">${label}</span>`;
  ghost.appendChild(cardEl);
  document.body.appendChild(ghost);

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
  const sx = toRect.width / Math.max(1, fromRect.width);
  const sy = toRect.height / Math.max(1, fromRect.height);

  ghost.style.transform = 'translate3d(0,0,0) scale(1) rotate(-4deg)';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ghost.style.transform = `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy}) rotate(4deg)`;
    });
  });

  setTimeout(() => ghost.remove(), duration + 30);
}

export default function UnoBrutalGame({ initialRoomCode = '', onBack }) {
  const [hasPassedPrep, setHasPassedPrep] = useState(() => Boolean(initialRoomCode));
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomIssue, setRoomIssue] = useState(null);
  const autoJoinedRef = useRef(false);
  const [roomStatus, setRoomStatus] = useState('waiting');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [topCard, setTopCard] = useState(() => generateInitialTopCard());
  const [currentTurn, setCurrentTurn] = useState(null);
  const [direction, setDirection] = useState(1);
  const [myHand, setMyHand] = useState([]);
  const [statusNotice, setStatusNotice] = useState('');
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [pendingSwapCard, setPendingSwapCard] = useState(null);
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [deckKickTick, setDeckKickTick] = useState(0);
  const [handScrollState, setHandScrollState] = useState({ overflows: false, canLeft: false, canRight: false });

  const deckBtnRef = useRef(null);
  const topCardSlotRef = useRef(null);
  const handScrollRef = useRef(null);
  const handRailRef = useRef(null);
  const didDragHandRef = useRef(false);

  const roomMeta = getRoomMeta(topCard);
  const eliminatedNims = roomMeta.eliminatedNims;
  const finishedNims = roomMeta.finishedNims;
  const finishedNames = roomMeta.finishedNames;
  const activePlayers = getActivePlayers(players, eliminatedNims, finishedNims);
  const mePlayer = players.find((p) => p.nim === user?.nim);
  const amIEliminated = Boolean(mePlayer && isPlayerEliminated(mePlayer, eliminatedNims));
  const myFinishRankIdx = user?.nim ? finishedNims.indexOf(user.nim) : -1;
  const amIFinished = myFinishRankIdx >= 0;
  const isMyTurn = roomStatus === 'playing' && !amIEliminated && !amIFinished && currentTurn === user?.nim;

  useEffect(() => {
    cleanupFinishedRooms('unobrutal');
    const nim = localStorage.getItem('user_nim');
    const nama = localStorage.getItem('user_nama');
    if (nim && nama) {
      setUser({ nim, nama });
      const savedUnoRoom = localStorage.getItem(`uno_room_${nim}`);
      if (savedUnoRoom && !initialRoomCode) {
        supabase
          .from('uno_players')
          .select('room_code')
          .match({ room_code: savedUnoRoom, nim })
          .single()
          .then(({ data }) => {
            if (data?.room_code) {
              setCurrentRoom(data.room_code);
            } else {
              localStorage.removeItem(`uno_room_${nim}`);
            }
          });
      }
    }
  }, [initialRoomCode]);

  const fetchRoomState = useCallback(async () => {
    if (!currentRoom) return;
    const { data: pData } = await supabase
      .from('uno_players')
      .select('*')
      .eq('room_code', currentRoom)
      .order('joined_at', { ascending: true });
    if (pData) {
      setPlayers(pData);
      const me = pData.find((p) => p.nim === (user?.nim || localStorage.getItem('user_nim')));
      if (me && Array.isArray(me.hand)) {
        setMyHand(me.hand.map(normalizeCardColor));
      }
    }

    const { data: rData } = await supabase
      .from('uno_rooms')
      .select('status, top_card, current_turn, direction')
      .eq('room_code', currentRoom)
      .single();
    if (rData) {
      if (rData.status) setRoomStatus(rData.status);
      if (rData.top_card) {
        const normalized = normalizeCardColor(rData.top_card);
        setTopCard(normalized);
        const syncedEvent = getRoomMeta(normalized).lastEvent;
        if (syncedEvent) setStatusNotice(syncedEvent);
      }
      setCurrentTurn(rData.current_turn || null);
      if (rData.direction) setDirection(rData.direction);
    } else {
      const nimKey = user?.nim || localStorage.getItem('user_nim');
      if (nimKey) localStorage.removeItem(`uno_room_${nimKey}`);
      const missingCode = currentRoom;
      setCurrentRoom(null);
      setPlayers([]);
      setMyHand([]);
      setRoomStatus('waiting');
      setRoomIssue({ status: 'cancelled', code: missingCode });
    }
  }, [currentRoom, user?.nim]);

  const { onlineNims, connectionStatus } = useRoomConnection({
    channelName: currentRoom ? `uno_presence:${currentRoom}` : '',
    nim: user?.nim,
    enabled: Boolean(currentRoom && user?.nim),
    onSync: fetchRoomState
  });

  useEffect(() => {
    if (!currentRoom) return;
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
          if (payload.new) {
            if (payload.new.status) setRoomStatus(payload.new.status);
            if (payload.new.top_card) {
              const normalized = normalizeCardColor(payload.new.top_card);
              setTopCard(normalized);
              const syncedEvent = getRoomMeta(normalized).lastEvent;
              if (syncedEvent) setStatusNotice(syncedEvent);
            }
            setCurrentTurn(payload.new.current_turn || null);
            if (payload.new.direction) setDirection(payload.new.direction);
          }
          fetchRoomState();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(roomSubscription);
    };
  }, [currentRoom, fetchRoomState]);

  const finishMatch = useCallback(
    async (finalFinishedNims, finalFinishedNames, finalTopCard, winEventText, nextDirection = direction) => {
      const uniqueFinishedNims = Array.from(new Set(finalFinishedNims.filter(Boolean)));
      const roomNims = Array.from(
        new Set([...players.map((p) => p.nim), ...uniqueFinishedNims].filter(Boolean))
      );
      const skipDb = await checkShouldSkipRoomScoring('uno', roomNims);
      setIsTrialSession(skipDb);
      const winnerNim = uniqueFinishedNims[0] || currentTurn || null;

      const cardWithMeta = {
        ...normalizeCardColor(finalTopCard),
        finishedAt: new Date().toISOString(),
        meta: {
          ...getRoomMeta(finalTopCard),
          pendingDraw: 0,
          pendingMinPower: 0,
          finishedNims: uniqueFinishedNims,
          finishedNames: finalFinishedNames,
          unoVulnerableNim: null,
          lastEvent: skipDb ? `${winEventText} (Mode Uji Coba: poin tidak dicatat)` : winEventText
        }
      };

      const { data: closedRows } = await supabase
        .from('uno_rooms')
        .update({
          top_card: cardWithMeta,
          status: 'finished',
          current_turn: winnerNim,
          direction: nextDirection
        })
        .eq('room_code', currentRoom)
        .eq('status', 'playing')
        .select('room_code');

      // Only the client that atomically closes the room awards leaderboard points to prevent duplicates.
      if (!skipDb && closedRows && closedRows.length > 0) {
        await Promise.all(
          uniqueFinishedNims.map((nim, idx) => {
            const reward = getUnoRankReward(idx);
            return reward > 0 ? awardAlumniPoints(nim, 'skor_uno', reward) : Promise.resolve();
          })
        );
      }

      setTopCard(cardWithMeta);
      setCurrentTurn(winnerNim);
      setDirection(nextDirection);
      setRoomStatus('finished');
      setStatusNotice(cardWithMeta.meta.lastEvent);
    },
    [currentRoom, currentTurn, direction, players]
  );

  const applyDrawForPlayer = useCallback(
    async (targetPlayer, drawCount, customReason = '', advanceTurn = true) => {
      const currentHand = Array.isArray(targetPlayer.hand) ? targetPlayer.hand.map(normalizeCardColor) : [];
      const drawnCards = Array.from({ length: drawCount }, () => generateRandomCard());
      const updatedHand = [...currentHand, ...drawnCards];

      if (targetPlayer.nim === user?.nim) {
        setMyHand(updatedHand);
      }

      await supabase
        .from('uno_players')
        .update({ hand: updatedHand })
        .match({ room_code: currentRoom, nim: targetPlayer.nim });

      const updatedPlayers = players.map((p) =>
        p.nim === targetPlayer.nim ? { ...p, hand: updatedHand } : p
      );

      const meta = getRoomMeta(topCard);
      const nextEliminated = new Set(meta.eliminatedNims);
      const justEliminated = updatedHand.length >= MERCY_LIMIT;
      if (justEliminated) {
        nextEliminated.add(targetPlayer.nim);
      }
      const nextEliminatedList = Array.from(nextEliminated);
      const survivors = getActivePlayers(updatedPlayers, nextEliminatedList, meta.finishedNims);

      const actorFirst = shortName(targetPlayer.nama);

      if (justEliminated && survivors.length <= 1) {
        const nextFinishedNims = [...meta.finishedNims];
        const nextFinishedNames = { ...meta.finishedNames };
        let winText = `${actorFirst} tembus ${updatedHand.length} kartu dan GUGUR (DO)! Permainan selesai.`;

        if (survivors.length === 1) {
          const survivor = survivors[0];
          if (!nextFinishedNims.includes(survivor.nim)) {
            nextFinishedNims.push(survivor.nim);
          }
          nextFinishedNames[survivor.nim] = survivor.nama;
          const rankNum = nextFinishedNims.indexOf(survivor.nim) + 1;
          const reward = getUnoRankReward(rankNum - 1);
          winText = `${actorFirst} tembus ${updatedHand.length} kartu dan GUGUR (DO)! ${shortName(survivor.nama)} bertahan paling akhir di peringkat #${rankNum} (+${formatUnoPoints(reward)} poin)!`;
        }

        await finishMatch(
          nextFinishedNims,
          nextFinishedNames,
          { ...topCard, meta: { ...meta, eliminatedNims: nextEliminatedList } },
          winText,
          direction
        );
        return;
      }

      const nextTurnNim = advanceTurn
        ? getNextActivePlayerNim(updatedPlayers, targetPlayer.nim, direction, 1, nextEliminatedList, meta.finishedNims)
        : currentTurn;

      const eventText = justEliminated
        ? `${actorFirst} kena +${drawCount} (total ${updatedHand.length} kartu) dan langsung GUGUR (DO)!`
        : customReason ||
          (drawCount > 1
            ? `${actorFirst} menelan bom +${drawCount} kartu! (Total ${updatedHand.length}/${MERCY_LIMIT} kartu)`
            : `${actorFirst} menarik 1 kartu (${updatedHand.length}/${MERCY_LIMIT}).`);

      const nextTopCard = {
        ...normalizeCardColor(topCard),
        meta: {
          ...meta,
          pendingDraw: advanceTurn ? 0 : meta.pendingDraw,
          pendingMinPower: advanceTurn ? 0 : meta.pendingMinPower,
          eliminatedNims: nextEliminatedList,
          unoVulnerableNim:
            meta.unoVulnerableNim === targetPlayer.nim || advanceTurn ? null : meta.unoVulnerableNim,
          lastEvent: eventText
        }
      };

      setTopCard(nextTopCard);
      if (advanceTurn) setCurrentTurn(nextTurnNim);
      setStatusNotice(eventText);

      await supabase
        .from('uno_rooms')
        .update({
          top_card: nextTopCard,
          current_turn: nextTurnNim
        })
        .eq('room_code', currentRoom);
    },
    [currentRoom, currentTurn, direction, finishMatch, players, topCard, user?.nim]
  );

  const executeCardPlay = useCallback(
    async (actorPlayer, card, chosenColor = null, chosenSwapNim = null) => {
      const actorHand = Array.isArray(actorPlayer.hand) ? actorPlayer.hand.map(normalizeCardColor) : [];
      const meta = getRoomMeta(topCard);
      const playedColor = isWildCard(card) ? chosenColor || pickBestWildColor(actorHand) : normalizeCardColor(card).color;
      const playedBase = { ...normalizeCardColor(card), color: playedColor };
      const actorFirst = shortName(actorPlayer.nama);

      let remaining = actorHand.filter((c) => c.id !== card.id);
      let dumpedExtraCount = 0;

      if (card.value === 'Sapu Bersih') {
        const beforeLen = remaining.length;
        remaining = remaining.filter((c) => isWildCard(c) || c.color?.name !== playedColor.name);
        dumpedExtraCount = beforeLen - remaining.length;
      }

      let updatedPlayers = players.map((p) =>
        p.nim === actorPlayer.nim ? { ...p, hand: remaining } : p
      );

      // Update actor hand first (may be swapped right below if Tukar KTM)
      if (actorPlayer.nim === user?.nim) setMyHand(remaining);
      await supabase
        .from('uno_players')
        .update({ hand: remaining })
        .match({ room_code: currentRoom, nim: actorPlayer.nim });

      const power = getDrawPower(card);

      // Handle player emptying their hand: rank them and either end match or continue if 2+ active remain.
      if (remaining.length === 0) {
        const nextFinishedNims = meta.finishedNims.includes(actorPlayer.nim)
          ? [...meta.finishedNims]
          : [...meta.finishedNims, actorPlayer.nim];
        const nextFinishedNames = { ...meta.finishedNames, [actorPlayer.nim]: actorPlayer.nama };
        const rankNum = nextFinishedNims.indexOf(actorPlayer.nim) + 1;
        const reward = getUnoRankReward(rankNum - 1);
        const rewardTag = `+${formatUnoPoints(reward)} poin`;
        const remainingActive = getActivePlayers(updatedPlayers, meta.eliminatedNims, nextFinishedNims);

        if (remainingActive.length <= 1) {
          const finishReason =
            card.value === 'Sapu Bersih' && dumpedExtraCount > 0
              ? `${actorFirst} menyapu bersih ${dumpedExtraCount + 1} kartu ${playedColor.name} dan finis #${rankNum} (${rewardTag})!`
              : `Habis ke-${rankNum}! ${actorFirst} menyelesaikan kartu (${rewardTag})! Permainan meja selesai.`;
          await finishMatch(
            nextFinishedNims,
            nextFinishedNames,
            { ...playedBase, meta: { ...meta, eliminatedNims: meta.eliminatedNims } },
            finishReason,
            direction
          );
          return;
        }

        let nextDirection = direction;
        let nextPendingDraw = meta.pendingDraw;
        let nextPendingMinPower = meta.pendingMinPower;
        let stepCount = 1;

        if (power > 0) {
          nextPendingDraw = meta.pendingDraw + power;
          nextPendingMinPower = Math.max(meta.pendingMinPower, power);
        } else if (card.value === 'Reverse') {
          nextDirection = direction === 1 ? -1 : 1;
        } else if (card.value === 'Skip') {
          stepCount = 2;
        }

        const nextTurnNim = getNextActivePlayerNim(
          updatedPlayers,
          actorPlayer.nim,
          nextDirection,
          stepCount,
          meta.eliminatedNims,
          nextFinishedNims
        );
        const nextPlayer = updatedPlayers.find((p) => p.nim === nextTurnNim);
        const eventText =
          power > 0
            ? `Peringkat #${rankNum}! ${actorFirst} habis kartu (${rewardTag}) sambil lempar bom +${nextPendingDraw} ke ${shortName(nextPlayer?.nama)}! Lanjut cari #${rankNum + 1}.`
            : `Peringkat #${rankNum}! ${actorFirst} habis kartu (${rewardTag})! Permainan lanjut memperebutkan #${rankNum + 1}.`;

        const nextTopCard = {
          ...playedBase,
          meta: {
            pendingDraw: nextPendingDraw,
            pendingMinPower: nextPendingMinPower,
            eliminatedNims: meta.eliminatedNims,
            finishedNims: nextFinishedNims,
            finishedNames: nextFinishedNames,
            unoVulnerableNim: null,
            lastEvent: eventText
          }
        };

        setTopCard(nextTopCard);
        setDirection(nextDirection);
        setCurrentTurn(nextTurnNim);
        setStatusNotice(eventText);

        await supabase
          .from('uno_rooms')
          .update({
            top_card: nextTopCard,
            current_turn: nextTurnNim,
            direction: nextDirection
          })
          .eq('room_code', currentRoom);
        return;
      }

      let nextDirection = direction;
      let nextPendingDraw = meta.pendingDraw;
      let nextPendingMinPower = meta.pendingMinPower;
      let nextTurnNim = getNextActivePlayerNim(
        updatedPlayers,
        actorPlayer.nim,
        nextDirection,
        1,
        meta.eliminatedNims,
        meta.finishedNims
      );
      let nextUnoVulnerable = remaining.length === 1 ? actorPlayer.nim : null;
      let eventText = `${actorFirst} menurunkan ${playedColor.name} (${card.value}).`;

      const activeCount = getActivePlayers(updatedPlayers, meta.eliminatedNims, meta.finishedNims).length;

      if (power > 0) {
        nextPendingDraw = meta.pendingDraw + power;
        nextPendingMinPower = Math.max(meta.pendingMinPower, power);
        const targetPlayer = updatedPlayers.find((p) => p.nim === nextTurnNim);
        eventText =
          meta.pendingDraw > 0
            ? `TUMPUK BRUTAL! ${actorFirst} menimpa ${card.value} (${playedColor.name})! Bom sekarang +${nextPendingDraw} untuk ${shortName(targetPlayer?.nama)}!`
            : `Serangan ${card.value} (${playedColor.name}) dari ${actorFirst}! ${shortName(targetPlayer?.nama)} harus tangkis >= +${power} atau telan +${nextPendingDraw} kartu!`;
      } else if (card.value === 'Skip') {
        const skipped = updatedPlayers.find((p) => p.nim === nextTurnNim);
        nextTurnNim = getNextActivePlayerNim(
          updatedPlayers,
          actorPlayer.nim,
          nextDirection,
          2,
          meta.eliminatedNims,
          meta.finishedNims
        );
        eventText = `Skip! Giliran ${shortName(skipped?.nama)} dilewati oleh ${actorFirst}.`;
      } else if (card.value === 'Skip Semua') {
        nextTurnNim = actorPlayer.nim;
        eventText = `Jam Kosong (Skip Semua)! ${actorFirst} melewati semua lawan dan jalan lagi!`;
      } else if (card.value === 'Reverse') {
        nextDirection = direction === 1 ? -1 : 1;
        if (activeCount <= 2) {
          nextTurnNim = actorPlayer.nim;
          eventText = `Putar Balik! Karena tinggal 2 pemain aktif, ${actorFirst} langsung jalan lagi!`;
        } else {
          nextTurnNim = getNextActivePlayerNim(
            updatedPlayers,
            actorPlayer.nim,
            nextDirection,
            1,
            meta.eliminatedNims,
            meta.finishedNims
          );
          eventText = `Putar Balik! ${actorFirst} membalik arah giliran meja.`;
        }
      } else if (card.value === 'Sapu Bersih') {
        eventText =
          dumpedExtraCount > 0
            ? `Sapu Bersih ${playedColor.name}! ${actorFirst} membuang ${dumpedExtraCount + 1} kartu sekaligus!`
            : `${actorFirst} menurunkan Sapu Bersih ${playedColor.name}.`;
      } else if (card.value === 'Tukar KTM') {
        const opponents = getActivePlayers(updatedPlayers, meta.eliminatedNims, meta.finishedNims).filter(
          (p) => p.nim !== actorPlayer.nim
        );
        const swapTarget =
          opponents.find((p) => p.nim === chosenSwapNim) ||
          [...opponents].sort((a, b) => (a.hand?.length || 99) - (b.hand?.length || 99))[0];

        if (swapTarget) {
          const targetOldHand = Array.isArray(swapTarget.hand) ? swapTarget.hand.map(normalizeCardColor) : [];
          const actorNewHand = targetOldHand;
          const targetNewHand = remaining;

          if (actorPlayer.nim === user?.nim) setMyHand(actorNewHand);
          if (swapTarget.nim === user?.nim) setMyHand(targetNewHand);

          await Promise.all([
            supabase
              .from('uno_players')
              .update({ hand: actorNewHand })
              .match({ room_code: currentRoom, nim: actorPlayer.nim }),
            supabase
              .from('uno_players')
              .update({ hand: targetNewHand })
              .match({ room_code: currentRoom, nim: swapTarget.nim })
          ]);

          updatedPlayers = updatedPlayers.map((p) => {
            if (p.nim === actorPlayer.nim) return { ...p, hand: actorNewHand };
            if (p.nim === swapTarget.nim) return { ...p, hand: targetNewHand };
            return p;
          });

          if (actorNewHand.length === 0) {
            const nextFinishedNims = meta.finishedNims.includes(actorPlayer.nim)
              ? [...meta.finishedNims]
              : [...meta.finishedNims, actorPlayer.nim];
            const nextFinishedNames = { ...meta.finishedNames, [actorPlayer.nim]: actorPlayer.nama };
            const rankNum = nextFinishedNims.indexOf(actorPlayer.nim) + 1;
            const reward = getUnoRankReward(rankNum - 1);
            const remainingActiveAfterSwap = getActivePlayers(updatedPlayers, meta.eliminatedNims, nextFinishedNims);
            if (remainingActiveAfterSwap.length <= 1) {
              await finishMatch(
                nextFinishedNims,
                nextFinishedNames,
                { ...playedBase, meta: { ...meta, eliminatedNims: meta.eliminatedNims } },
                `${actorFirst} menukar KTM dengan ${shortName(swapTarget.nama)} dan finis #${rankNum} (+${formatUnoPoints(reward)} poin)!`,
                nextDirection
              );
              return;
            }
            const nextTurnAfterSwap = getNextActivePlayerNim(
              updatedPlayers,
              actorPlayer.nim,
              nextDirection,
              1,
              meta.eliminatedNims,
              nextFinishedNims
            );
            const swapFinishEvent = `Peringkat #${rankNum}! ${actorFirst} menukar KTM dengan ${shortName(swapTarget.nama)} dan langsung habis kartu (+${formatUnoPoints(reward)} poin)! Lanjut cari #${rankNum + 1}.`;
            const nextTopAfterSwap = {
              ...playedBase,
              meta: {
                pendingDraw: nextPendingDraw,
                pendingMinPower: nextPendingMinPower,
                eliminatedNims: meta.eliminatedNims,
                finishedNims: nextFinishedNims,
                finishedNames: nextFinishedNames,
                unoVulnerableNim: targetNewHand.length === 1 ? swapTarget.nim : null,
                lastEvent: swapFinishEvent
              }
            };
            setTopCard(nextTopAfterSwap);
            setDirection(nextDirection);
            setCurrentTurn(nextTurnAfterSwap);
            setStatusNotice(swapFinishEvent);
            await supabase
              .from('uno_rooms')
              .update({ top_card: nextTopAfterSwap, current_turn: nextTurnAfterSwap, direction: nextDirection })
              .eq('room_code', currentRoom);
            return;
          }

          nextUnoVulnerable =
            actorNewHand.length === 1
              ? actorPlayer.nim
              : targetNewHand.length === 1
              ? swapTarget.nim
              : null;

          eventText = `Tukar KTM! ${actorFirst} menukar seluruh kartunya (${targetNewHand.length}) dengan ${shortName(swapTarget.nama)} (${actorNewHand.length})!`;
        }
      } else if (card.value === 'Titip Absen') {
        eventText = `${actorFirst} pakai Titip Absen dan mengganti warna aktif ke ${playedColor.name}!`;
      }

      const nextTopCard = {
        ...playedBase,
        meta: {
          pendingDraw: nextPendingDraw,
          pendingMinPower: nextPendingMinPower,
          eliminatedNims: meta.eliminatedNims,
          finishedNims: meta.finishedNims,
          finishedNames: meta.finishedNames,
          unoVulnerableNim: nextUnoVulnerable,
          lastEvent: eventText
        }
      };

      setTopCard(nextTopCard);
      setDirection(nextDirection);
      setCurrentTurn(nextTurnNim);
      setStatusNotice(eventText);

      await supabase
        .from('uno_rooms')
        .update({
          top_card: nextTopCard,
          current_turn: nextTurnNim,
          direction: nextDirection
        })
        .eq('room_code', currentRoom);
    },
    [currentRoom, direction, finishMatch, players, topCard, user?.nim]
  );

  const originalHostNim = players.find((p) => p.is_host)?.nim;
  const actingHostNim = pickActiveCoordinator(players, onlineNims, originalHostNim);
  const isHost = Boolean(
    actingHostNim
      ? actingHostNim === user?.nim
      : players.find((p) => p.nim === user?.nim)?.is_host
  );

  // Auto-bot takes a single valid No Mercy move when the current turn player is offline.
  useEffect(() => {
    if (roomStatus !== 'playing' || !currentRoom || !currentTurn || actingHostNim !== user?.nim) return;
    const turnPlayer = players.find((p) => p.nim === currentTurn);
    if (!turnPlayer || turnPlayer.nim === user?.nim || !shouldBotControlPlayer(turnPlayer, onlineNims)) return;
    if (isPlayerEliminated(turnPlayer, eliminatedNims) || isPlayerFinished(turnPlayer, finishedNims)) return;

    const timer = setTimeout(async () => {
      const targetHand = Array.isArray(turnPlayer.hand) ? turnPlayer.hand.map(normalizeCardColor) : [];
      const chosenCard = pickBotUnoCard(targetHand, topCard, roomMeta);

      if (!chosenCard) {
        const count = roomMeta.pendingDraw > 0 ? roomMeta.pendingDraw : 1;
        await applyDrawForPlayer(
          turnPlayer,
          count,
          `Bot menarik ${count} kartu menggantikan ${shortName(turnPlayer.nama)} yang terputus.`,
          true
        );
        return;
      }

      const chosenColor = isWildCard(chosenCard) ? pickBestWildColor(targetHand.filter((c) => c.id !== chosenCard.id)) : null;
      const opponents = getActivePlayers(players, eliminatedNims, finishedNims).filter((p) => p.nim !== turnPlayer.nim);
      const swapTarget = [...opponents].sort((a, b) => (a.hand?.length || 99) - (b.hand?.length || 99))[0];
      await executeCardPlay(turnPlayer, chosenCard, chosenColor, swapTarget?.nim || null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    roomStatus,
    currentRoom,
    currentTurn,
    actingHostNim,
    user?.nim,
    players,
    topCard,
    onlineNims,
    eliminatedNims,
    finishedNims,
    roomMeta,
    applyDrawForPlayer,
    executeCardPlay
  ]);

  const syncHandScrollState = useCallback(() => {
    const wrap = handScrollRef.current;
    if (!wrap) return;
    const overflows = wrap.scrollWidth > wrap.clientWidth + 4;
    const canLeft = wrap.scrollLeft > 2;
    const canRight = wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 2;
    setHandScrollState((prev) =>
      prev.overflows === overflows && prev.canLeft === canLeft && prev.canRight === canRight
        ? prev
        : { overflows, canLeft, canRight }
    );
  }, []);

  useEffect(() => {
    const wrap = handScrollRef.current;
    if (!wrap || roomStatus !== 'playing') return;

    syncHandScrollState();
    const onScroll = () => syncHandScrollState();
    const onWheel = (e) => {
      if (wrap.scrollWidth <= wrap.clientWidth + 4) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        wrap.scrollLeft += e.deltaY;
      }
    };

    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse') return;
      isDown = true;
      didDragHandRef.current = false;
      startX = e.clientX;
      startScroll = wrap.scrollLeft;
    };
    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) {
        didDragHandRef.current = true;
        wrap.scrollLeft = startScroll - dx;
      }
    };
    const onPointerUp = () => {
      if (!isDown) return;
      isDown = false;
      setTimeout(() => {
        didDragHandRef.current = false;
      }, 0);
    };

    wrap.addEventListener('scroll', onScroll, { passive: true });
    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onScroll);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onScroll);
      ro.observe(wrap);
      if (handRailRef.current) ro.observe(handRailRef.current);
    }

    return () => {
      wrap.removeEventListener('scroll', onScroll);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onScroll);
      if (ro) ro.disconnect();
    };
  }, [roomStatus, myHand.length, syncHandScrollState]);

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
        .insert([{ room_code: code, nim: user.nim, nama: user.nama, is_host: true, hand: [] }]);
      if (playerError) throw playerError;

      localStorage.setItem(`uno_room_${user.nim}`, code);
      setRoomStatus('waiting');
      setCurrentRoom(code);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal membuat meja baru. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const joinRoomByCode = useCallback(async (rawCode) => {
    const cleanCode = String(rawCode || '').trim().toUpperCase();
    if (!cleanCode || !user) return;
    setLoading(true);
    setErrorMsg('');
    setRoomIssue(null);

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('uno_rooms')
        .select('*')
        .eq('room_code', cleanCode)
        .single();

      if (roomError || !roomData) {
        setRoomIssue({ status: 'not_found', code: cleanCode });
        return;
      }
      if (roomData.status === 'finished') {
        if (isFinishedRoomExpired('unobrutal', roomData)) {
          await cleanupFinishedRooms('unobrutal');
          setRoomIssue({ status: 'not_found', code: cleanCode });
          return;
        }
        setRoomIssue({ status: 'finished', code: cleanCode });
        return;
      }
      if (roomData.status !== 'waiting') {
        setRoomIssue({ status: 'started', code: cleanCode });
        return;
      }

      const { error: playerError } = await supabase
        .from('uno_players')
        .insert([{ room_code: cleanCode, nim: user.nim, nama: user.nama, is_host: false, hand: [] }]);

      if (playerError && playerError.code !== '23505') throw playerError;

      localStorage.setItem(`uno_room_${user.nim}`, cleanCode);
      setRoomStatus(roomData.status);
      setCurrentRoom(cleanCode);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal bergabung ke meja.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const joinRoom = async (e) => {
    e.preventDefault();
    await joinRoomByCode(roomCode);
  };

  useEffect(() => {
    if (!initialRoomCode || autoJoinedRef.current || !user?.nim || currentRoom) return;
    autoJoinedRef.current = true;
    setRoomCode(initialRoomCode);
    joinRoomByCode(initialRoomCode);
  }, [initialRoomCode, user?.nim, currentRoom, joinRoomByCode]);

  const startGame = async () => {
    if (!currentRoom) return;
    if (players.length < 2) {
      setErrorMsg('Minimal 2 pemain diperlukan di meja untuk memulai permainan.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setPendingWildCard(null);
    setPendingSwapCard(null);
    try {
      const initialTopCard = generateInitialTopCard();
      const firstPlayerNim = players[0]?.nim || user?.nim;

      await Promise.all(
        players.map((p) => {
          const initialHand = Array.from({ length: INITIAL_HAND_SIZE }, () => generateRandomCard());
          if (p.nim === user?.nim) setMyHand(initialHand);
          return supabase
            .from('uno_players')
            .update({ hand: initialHand })
            .match({ room_code: currentRoom, nim: p.nim });
        })
      );

      const { error } = await supabase
        .from('uno_rooms')
        .update({
          status: 'playing',
          top_card: initialTopCard,
          current_turn: firstPlayerNim,
          direction: 1
        })
        .eq('room_code', currentRoom);
      if (error) throw error;

      setTopCard(initialTopCard);
      setCurrentTurn(firstPlayerNim);
      setDirection(1);
      setRoomStatus('playing');
      setStatusNotice(initialTopCard.meta.lastEvent);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memulai permainan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayCard = async (card, chosenColor = null, chosenSwapNim = null, sourceEl = null) => {
    if (roomStatus !== 'playing' || actionBusy || !mePlayer || amIEliminated || amIFinished) return;
    if (currentTurn && currentTurn !== user?.nim) {
      const activePlayer = players.find((p) => p.nim === currentTurn);
      setStatusNotice(`Tunggu giliranmu! Saat ini giliran ${shortName(activePlayer?.nama)}.`);
      return;
    }

    if (!isCardPlayable(card, topCard, roomMeta)) {
      if (roomMeta.pendingDraw > 0) {
        setStatusNotice(
          `Sedang ada bom +${roomMeta.pendingDraw}! Tangkis dengan kartu tambah minimal +${roomMeta.pendingMinPower}, atau klik Telan +${roomMeta.pendingDraw} Kartu.`
        );
      } else {
        setStatusNotice(
          `Kartu ${card.color.name} (${card.value}) belum cocok dengan ${topCard.color.name} (${topCard.value}).`
        );
      }
      return;
    }

    if (isWildCard(card) && !chosenColor) {
      setPendingSwapCard(null);
      setPendingWildCard(card);
      return;
    }

    const remainingAfterPlay = myHand.filter((c) => c.id !== card.id);
    if (card.value === 'Tukar KTM' && remainingAfterPlay.length > 0 && !chosenSwapNim) {
      const opponents = activePlayers.filter((p) => p.nim !== user.nim);
      if (opponents.length > 1) {
        setPendingWildCard(null);
        setPendingSwapCard(card);
        return;
      }
      chosenSwapNim = opponents[0]?.nim || null;
    }

    if (topCardSlotRef.current) {
      const fromRect =
        sourceEl?.getBoundingClientRect?.() || handScrollRef.current?.getBoundingClientRect?.();
      const toRect = topCardSlotRef.current.getBoundingClientRect();
      const colorName = isWildCard(card) ? 'Bebas' : card.color?.name;
      launchFlyingCardGhost(fromRect, toRect, {
        bg: COLOR_HEX_MAP[colorName] || '#1C1917',
        label: card.value,
        isBack: false
      });
    }

    setPendingWildCard(null);
    setPendingSwapCard(null);
    setActionBusy(true);
    try {
      await executeCardPlay({ ...mePlayer, hand: myHand }, card, chosenColor, chosenSwapNim);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDrawCard = async () => {
    if (roomStatus !== 'playing' || actionBusy || !mePlayer || amIEliminated || amIFinished) return;
    if (currentTurn && currentTurn !== user?.nim) {
      const activePlayer = players.find((p) => p.nim === currentTurn);
      setStatusNotice(`Bukan giliranmu! Sekarang giliran ${shortName(activePlayer?.nama)}.`);
      return;
    }

    setPendingWildCard(null);
    setPendingSwapCard(null);
    setActionBusy(true);
    try {
      const drawCount = roomMeta.pendingDraw > 0 ? roomMeta.pendingDraw : 1;
      setDeckKickTick((t) => t + 1);
      if (deckBtnRef.current && handScrollRef.current) {
        const deckRect = deckBtnRef.current.getBoundingClientRect();
        const handRect = handScrollRef.current.getBoundingClientRect();
        const animCount = Math.min(drawCount, 6);
        for (let i = 0; i < animCount; i++) {
          setTimeout(() => {
            launchFlyingCardGhost(
              deckRect,
              {
                left: handRect.left + handRect.width / 2 - 42,
                top: handRect.top + 16,
                width: 84,
                height: 126
              },
              { isBack: true, duration: 240 }
            );
          }, i * 70);
        }
      }
      await applyDrawForPlayer({ ...mePlayer, hand: myHand }, drawCount, '', true);
    } finally {
      setActionBusy(false);
    }
  };

  const handleShoutUno = async () => {
    if (roomStatus !== 'playing' || actionBusy || roomMeta.unoVulnerableNim !== user?.nim) return;
    setActionBusy(true);
    try {
      const eventText = `${shortName(user?.nama)} berteriak UNO! (Kartu tinggal 1 dan aman!)`;
      const nextTopCard = {
        ...normalizeCardColor(topCard),
        meta: {
          ...roomMeta,
          unoVulnerableNim: null,
          lastEvent: eventText
        }
      };
      setTopCard(nextTopCard);
      setStatusNotice(eventText);
      await supabase
        .from('uno_rooms')
        .update({ top_card: nextTopCard })
        .eq('room_code', currentRoom);
    } finally {
      setActionBusy(false);
    }
  };

  const handleCatchUno = async () => {
    const culpritNim = roomMeta.unoVulnerableNim;
    if (roomStatus !== 'playing' || actionBusy || !culpritNim || culpritNim === user?.nim || amIEliminated || amIFinished) return;
    const culprit = players.find((p) => p.nim === culpritNim);
    if (!culprit) return;

    setActionBusy(true);
    try {
      await applyDrawForPlayer(
        culprit,
        2,
        `TERTANGKAP! ${shortName(user?.nama)} mencegat ${shortName(culprit.nama)} yang lupa teriak UNO! Hukuman +2 kartu!`,
        false
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleSkipDisconnectedTurn = async () => {
    if (roomStatus !== 'playing' || !currentTurn || !currentRoom) return;
    if (onlineNims.size === 0 || onlineNims.has(currentTurn)) return;

    const candidateNext = getNextActivePlayerNim(players, currentTurn, direction, 1, eliminatedNims, finishedNims);
    const onlineFallback = activePlayers.find((p) => p.nim !== currentTurn && onlineNims.has(p.nim))?.nim;
    const resolvedNext = onlineNims.has(candidateNext) ? candidateNext : onlineFallback || candidateNext;

    const skippedPlayer = players.find((p) => p.nim === currentTurn);
    const eventText = `Giliran ${shortName(skippedPlayer?.nama)} dilewati karena koneksi terputus.`;
    const nextTopCard = {
      ...normalizeCardColor(topCard),
      meta: { ...roomMeta, lastEvent: eventText }
    };
    setCurrentTurn(resolvedNext);
    setTopCard(nextTopCard);
    setStatusNotice(eventText);

    await supabase
      .from('uno_rooms')
      .update({ current_turn: resolvedNext, top_card: nextTopCard })
      .eq('room_code', currentRoom)
      .eq('current_turn', currentTurn);
  };

  const leaveRoom = async () => {
    if (currentRoom && user) {
      if (roomStatus === 'playing' && currentTurn === user.nim && activePlayers.length > 1) {
        const nextTurnNim = getNextActivePlayerNim(players, user.nim, direction, 1, eliminatedNims, finishedNims);
        if (nextTurnNim && nextTurnNim !== user.nim) {
          await supabase
            .from('uno_rooms')
            .update({ current_turn: nextTurnNim })
            .eq('room_code', currentRoom)
            .eq('current_turn', user.nim);
        }
      }
      await supabase.from('uno_players').delete().match({ room_code: currentRoom, nim: user.nim });
      if (roomStatus === 'waiting') {
        const { data: remaining } = await supabase
          .from('uno_players')
          .select('nim')
          .eq('room_code', currentRoom);
        if (!remaining || remaining.length === 0) {
          await supabase.from('uno_rooms').delete().eq('room_code', currentRoom);
        }
      }
      localStorage.removeItem(`uno_room_${user.nim}`);
    }
    setPendingWildCard(null);
    setPendingSwapCard(null);
    setCurrentRoom(null);
    setRoomStatus('waiting');
    setCurrentTurn(null);
    setPlayers([]);
    setMyHand([]);
    setRoomCode('');
    setErrorMsg('');
  };

  if (roomIssue) {
    return (
      <RoomStatusScreen
        gameName="UNO Sedulur 16: No Mercy"
        status={roomIssue.status}
        roomCode={roomIssue.code}
        onBackToLobby={() => {
          setRoomIssue(null);
          setRoomCode('');
          setErrorMsg('');
        }}
        onBackHome={onBack}
      />
    );
  }

  if (!currentRoom && !hasPassedPrep && !initialRoomCode) {
    return (
      <div className="py-4 sm:py-6">
        <SoloGamePrepScreen
          title="UNO Sedulur 16: No Mercy"
          subtitle="Edisi brutal tanpa ampun bareng teman seangkatan! Tumpuk serangan +2/+4/+6, tukar seluruh kartu lawan, dan hindari batas gugur 20 kartu."
          artworkSrc="/games/uno.webp"
          artworkAlt="Ilustrasi kartu UNO Sedulur 16"
          stats={[
            { value: '7', label: 'Kartu Awal' },
            { value: `${MERCY_LIMIT} Kartu`, label: 'Batas Gugur (DO)' },
            { value: '+4.000', label: 'Juara #1' }
          ]}
          steps={[
            'Buat meja baru lalu bagikan kode atau link undangan, atau masukkan kode meja dari temanmu.',
            'Tumpuk kartu penalti (+2, +4, +6) dengan kartu tambah yang sama atau lebih besar untuk melempar bom ke lawan berikutnya.',
            'Manfaatkan Reverse, Jam Kosong (Skip Semua), Sapu Bersih (buang 1 warna), Tukar KTM (tukar tangan), dan jangan lupa tekan UNO saat kartu tinggal 1!'
          ]}
          scoringTiers={[
            { condition: 'Habis ke-1 (Juara #1)', points: '+4.000 poin' },
            { condition: 'Habis ke-2 (Juara #2)', points: '+2.500 poin' },
            { condition: 'Habis ke-3 (Juara #3)', points: '+1.500 poin' },
            { condition: 'Habis ke-4 (Juara #4)', points: '+750 poin' },
            { condition: 'Habis ke-5 (Juara #5)', points: '+500 poin' },
            { condition: 'Ke-6 s.d. Terakhir / Gugur (DO)', points: '+0 poin' }
          ]}
          scoringNote="Ronde berjalan terus sampai tersisa 1 pemain di meja agar urutan habis ke-1 sampai ke-5 masing-masing memperoleh poin klasemen."
          startLabel="Masuk ke Lobi UNO No Mercy"
          onStart={() => setHasPassedPrep(true)}
          onBack={onBack}
        />
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-2">
            UNO Sedulur 16: No Mercy
          </h1>
          <p className="text-stone-600 text-sm md:text-base">
            Tumpuk serangan +2/+4/+6, tukar seluruh isi tangan lawan, dan selamat dari batas gugur 20 kartu.
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="bg-rose-50 border border-rose-500/40 text-rose-700 p-4 rounded-xl mb-6 text-center font-semibold text-sm">
            {errorMsg}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#DED6C6] p-6 md:p-8 rounded-2xl shadow-md flex flex-col justify-between text-center">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Buka Meja Baru</h2>
              <p className="text-stone-600 text-sm mb-6">
                Buat kode meja 4 karakter dan ajak teman-teman Sedulur 16 masuk ke arena No Mercy.
              </p>
            </div>
            <button
              type="button"
              onClick={createRoom}
              disabled={loading}
              className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Membuat Meja...' : 'Buat Meja Baru'}
            </button>
          </div>

          <div className="bg-white border border-[#DED6C6] p-6 md:p-8 rounded-2xl shadow-md flex flex-col justify-between text-center">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Gabung ke Meja</h2>
              <p className="text-stone-600 text-sm mb-4">
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
                className="w-full bg-[#FAF6EE] border border-[#C7BDA8] rounded-xl p-3.5 text-center text-xl font-mono font-bold text-stone-900 tracking-widest focus:border-amber-400 placeholder:text-stone-500 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal uppercase"
              />
              <button
                type="submit"
                disabled={loading || roomCode.length < 4}
                className="w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Bergabung...' : 'Masuk ke Meja'}
              </button>
            </form>
          </div>
        </div>

        <section aria-labelledby="uno-guide-heading" className="mt-8 bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-[#FAF6EE] border-b border-[#DED8CA] flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="uno-guide-heading" className="text-lg font-bold text-zinc-900">
              Kartu &amp; Aturan UNO No Mercy TL 2016
            </h3>
            <span className="text-xs text-zinc-600">
              Mulai 7 kartu, gugur otomatis (DO) saat tembus {MERCY_LIMIT} kartu
            </span>
          </div>

          <div className="divide-y divide-[#EDE6D8] text-sm text-zinc-700">
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-5">
              <strong className="sm:w-52 shrink-0 text-rose-800">Tumpuk Bom (+2 / +4 / +6)</strong>
              <p className="leading-relaxed">
                Kartu <strong>+2</strong>, <strong>+4 (Revisi Mayor)</strong>, dan <strong>+6 (Mengulang MK)</strong> bisa ditangkis sekaligus ditumpuk dengan kartu tambah yang nilainya sama atau lebih besar. Yang tidak punya penangkal wajib menelan seluruh total tumpukan.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-5">
              <strong className="sm:w-52 shrink-0 text-amber-800">Reverse &amp; Jam Kosong</strong>
              <p className="leading-relaxed">
                <strong>Reverse</strong> membalik arah putaran meja (jika tersisa 2 pemain aktif, kamu langsung jalan lagi). <strong>Skip Semua (Jam Kosong)</strong> melewati seluruh lawan sehingga giliran langsung kembali ke kamu.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-5">
              <strong className="sm:w-52 shrink-0 text-[#14532D]">Sapu Bersih &amp; Tukar KTM</strong>
              <p className="leading-relaxed">
                <strong>Sapu Bersih</strong> langsung membuang semua kartu di tanganmu yang warnanya sama dalam sekali jalan. <strong>Tukar KTM</strong> menukar seluruh isi tanganmu dengan 1 lawan pilihanmu.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-5">
              <strong className="sm:w-52 shrink-0 text-zinc-900">Teriak UNO!, Batas DO &amp; Poin</strong>
              <p className="leading-relaxed">
                Saat kartu tinggal 1, segera klik <strong>Teriak UNO!</strong> sebelum lawan menekan <strong>Tangkap (+2)</strong>. Tangan yang tembus <strong>{MERCY_LIMIT} kartu</strong> langsung gugur (DO). Ronde terus berjalan sampai tersisa 1 pemain: <strong>Habis ke-1 (+4.000)</strong>, <strong>ke-2 (+2.500)</strong>, <strong>ke-3 (+1.500)</strong>, <strong>ke-4 (+750)</strong>, <strong>ke-5 (+500)</strong>, dan ke-6 sampai terakhir/DO <strong>(+0)</strong>.
              </p>
            </div>
          </div>
        </section>
        <div className="mt-8">
          <UnoCardCatalog heading="Katalog 10 Jenis Kartu UNO No Mercy" />
        </div>
      </div>
    );
  }

  const isCurrentTurnOffline =
    roomStatus === 'playing' &&
    Boolean(currentTurn) &&
    currentTurn !== user?.nim &&
    onlineNims.size > 0 &&
    !onlineNims.has(currentTurn);

  const normalizedTop = normalizeCardColor(topCard);
  const unoVulnerablePlayer = roomMeta.unoVulnerableNim
    ? players.find((p) => p.nim === roomMeta.unoVulnerableNim)
    : null;
  const tableSeats = getTableSeats(players, user?.nim);
  const currentTurnPlayer = players.find((p) => p.nim === currentTurn);

  const renderOpponentPod = (op, compact = false) => {
    if (!op) return null;
    const finishIdx = roomStatus !== 'waiting' ? finishedNims.indexOf(op.nim) : -1;
    const isFinished = finishIdx >= 0;
    const finishReward = isFinished ? getUnoRankReward(finishIdx) : 0;
    const isElim = roomStatus !== 'waiting' && !isFinished && isPlayerEliminated(op, eliminatedNims);
    const isTurn = roomStatus === 'playing' && !isElim && !isFinished && currentTurn === op.nim;
    const isDisconnected = onlineNims.size > 0 && !onlineNims.has(op.nim);
    const count = Array.isArray(op.hand) ? op.hand.length : 0;
    const maxVisible = compact ? 4 : 8;
    const visibleCards = isElim || isFinished ? 0 : Math.min(count, maxVisible);
    const extraCount = isElim || isFinished ? 0 : Math.max(0, count - visibleCards);
    const isDanger = !isElim && !isFinished && count >= MERCY_LIMIT - 4;

    return (
      <div key={op.nim} className="flex flex-col items-center">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
            isFinished
              ? 'bg-[#ECFDF5] text-[#14532D] border-[#14532D]/40'
              : isElim
              ? 'bg-rose-50 text-rose-800 border-rose-300 opacity-75'
              : isTurn
              ? 'bg-[#14532D] text-white border-[#14532D]'
              : 'bg-[#FFFDF9] text-[#1C1917] border-[#D4CCB8]'
          }`}
        >
          <span className={`font-bold text-xs truncate max-w-[68px] sm:max-w-[110px] ${isElim ? 'line-through' : ''}`}>
            {shortName(op.nama)}
            {isDisconnected ? ' (Off)' : ''}
          </span>
          <span
            className={`font-mono text-[11px] font-bold tabular-nums shrink-0 ${
              isFinished
                ? 'text-[#14532D]'
                : isElim
                ? 'text-rose-800'
                : isTurn
                ? 'text-[#FEF3C7]'
                : isDanger
                ? 'text-[#BE123C]'
                : 'text-[#57534E]'
            }`}
          >
            {isFinished ? `#${finishIdx + 1}` : isElim ? 'DO' : `${count}/${MERCY_LIMIT}`}
          </span>
        </div>

        <div
          className={`flex items-center justify-center pt-1.5 min-h-[40px] sm:min-h-[54px] transition-transform ${
            isTurn ? '-translate-y-1' : ''
          }`}
        >
          {isFinished ? (
            <span className="text-[10px] font-mono font-bold text-[#14532D] bg-[#ECFDF5] border border-[#BBF7D0] px-2 py-0.5 rounded tabular-nums">
              {compact ? `Habis #${finishIdx + 1}` : `Habis #${finishIdx + 1} (+${formatUnoPoints(finishReward)})`}
            </span>
          ) : isElim ? (
            <span className="text-[10px] font-mono font-bold text-[#BE123C] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              Gugur ({count})
            </span>
          ) : (
            <>
              {Array.from({ length: visibleCards }).map((_, idx) => {
                const angle = (idx - (visibleCards - 1) / 2) * 3.2;
                return (
                  <div key={idx} className={idx > 0 ? (compact ? '-ml-2.5' : '-ml-3.5') : ''}>
                    <UnoMiniBack angle={angle} />
                  </div>
                );
              })}
              {extraCount > 0 && (
                <span className="ml-1 font-mono text-[10px] font-bold text-[#BE123C]">+{extraCount}</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (roomStatus === 'waiting') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="bg-[#FFFDF9] border border-[#DED6C6] rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 bg-[#FAF6EE] border-b border-[#DED6C6] flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[#1C1917] font-bold text-base sm:text-lg">
                Meja <span className="font-mono text-[#14532D]">{currentRoom}</span>
              </span>
              <span aria-hidden="true" className="text-[#D4CCB8]">|</span>
              <span className="text-xs font-mono text-[#57534E]">
                Ruang Tunggu &middot; 7 Kartu Awal &middot; DO {MERCY_LIMIT} Kartu
              </span>
              {connectionStatus !== 'online' && (
                <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-xs font-mono font-bold">
                  {connectionStatus === 'offline' ? 'Koneksi terputus' : 'Menyinkronkan...'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <InviteLinkButton gameKey="unobrutal" roomCode={currentRoom} />
              <button
                type="button"
                onClick={leaveRoom}
                className="text-xs bg-white text-[#BE123C] border border-rose-300 hover:bg-[#BE123C] hover:text-white px-4 py-2 min-h-[44px] rounded-xl transition-colors font-bold cursor-pointer"
              >
                {players.length <= 1 ? 'Batalkan Meja' : 'Keluar Meja'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div role="alert" className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-500/40 text-rose-700 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-6 bg-[#F1EBE0]">
            <div>
              <div className="text-xs font-mono font-bold text-[#57534E] mb-2.5">
                Pemain di Meja ({players.length} hadir)
              </div>
              <div className="flex flex-wrap gap-2.5">
                {players.map((p) => {
                  const isDisconnected = onlineNims.size > 0 && !onlineNims.has(p.nim);
                  return (
                    <div
                      key={p.nim}
                      className="bg-[#FFFDF9] border border-[#D4CCB8] px-3.5 py-2 rounded-xl flex items-center gap-2"
                    >
                      <span className="font-bold text-sm text-[#1C1917]">
                        {shortName(p.nama)} {p.nim === user?.nim ? '(Kamu)' : ''}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#14532D] bg-[#ECFDF5] border border-[#BBF7D0] px-2 py-0.5 rounded">
                        {p.is_host ? 'Host' : 'Siap'}
                        {isDisconnected ? ' · Off' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#DFD7C6] flex flex-col items-center text-center gap-2">
              {isHost ? (
                <>
                  <button
                    type="button"
                    onClick={startGame}
                    disabled={loading}
                    className="min-h-[48px] bg-[#14532D] hover:bg-[#166534] text-white font-bold px-8 py-3 rounded-xl text-sm sm:text-base transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Membagikan Kartu...' : 'Mulai UNO No Mercy'}
                  </button>
                  <p className="text-[#57534E] text-xs font-mono">
                    Minimal 2 pemain di meja untuk mulai bermain ({players.length} pemain siap)
                  </p>
                </>
              ) : (
                <p className="text-[#57534E] text-sm font-medium py-2">
                  Menunggu Host menekan tombol Mulai. Sambil menunggu, intip katalog kartu No Mercy di bawah ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Catalog shown strictly while waiting in room before host starts */}
        <UnoCardCatalog heading="Katalog 10 Jenis Kartu No Mercy" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col bg-[#FFFDF9] border border-[#DED6C6] rounded-2xl overflow-hidden relative">
      {/* Compact Editorial Arena Status Bar */}
      <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-[#FFFDF9] border-b border-[#DED6C6] flex flex-wrap items-center justify-between gap-2 text-xs z-20">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[#57534E] min-w-0">
          <span className="font-bold text-[#1C1917] text-xs sm:text-sm shrink-0">
            Meja <span className="font-mono">{currentRoom}</span>
          </span>
          <span aria-hidden="true" className="text-[#D4CCB8]">|</span>
          <span className="font-mono font-semibold text-[#14532D] tabular-nums">
            {direction === 1 ? 'Searah ⟳' : 'Berbalik ⟲'}
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-[#D4CCB8]">|</span>
          <span className="hidden sm:inline font-mono tabular-nums">DO: {MERCY_LIMIT}</span>
          {connectionStatus !== 'online' && (
            <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-mono font-bold">
              {connectionStatus === 'offline' ? 'Terputus' : 'Sinkron...'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {roomStatus === 'playing' && (
            <span className="font-mono font-bold text-[#14532D] bg-[#ECFDF5] border border-[#BBF7D0] px-2.5 py-1 rounded-lg tabular-nums">
              Giliran: {currentTurn === user?.nim ? 'Kamu' : shortName(currentTurnPlayer?.nama)}
            </span>
          )}
          <button
            type="button"
            onClick={leaveRoom}
            className="text-xs bg-white text-[#BE123C] border border-rose-300 hover:bg-[#BE123C] hover:text-white px-3 py-1.5 min-h-[40px] rounded-xl transition-colors font-bold cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-500/40 text-rose-700 text-xs font-semibold text-center">
          {errorMsg}
        </div>
      )}

      {/* Warm Linen 2D Tabletop Playmat */}
      <div className="relative bg-[#F1EBE0] px-3 sm:px-6 py-4 sm:py-6 flex flex-col justify-between gap-3 sm:gap-5">
        <div
          aria-hidden="true"
          className="pointer-events-none hidden md:block absolute inset-4 rounded-[36px] border border-[#DFD7C6]"
        />

        {/* Mobile Opponent Rail (< md) */}
        {tableSeats.allOpponents.length > 0 && (
          <div className="flex md:hidden items-start justify-around gap-2 overflow-x-auto uno-no-scrollbar pb-1 relative z-10">
            {tableSeats.allOpponents.map((op) => (
              <div key={op.nim} className="min-w-[96px] shrink-0 flex flex-col items-center">
                {renderOpponentPod(op, true)}
              </div>
            ))}
          </div>
        )}

        {/* Desktop Top Opponent(s) */}
        {tableSeats.top.length > 0 && (
          <div className="hidden md:flex justify-center flex-wrap gap-6 relative z-10">
            {tableSeats.top.map((op) => renderOpponentPod(op, false))}
          </div>
        )}

        {/* Middle Row: Desktop Left | Center Deck + Discard + Direction Ring | Desktop Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 relative z-10 py-1 sm:py-2">
          <div className="hidden md:flex md:col-span-3 justify-center">
            {tableSeats.left && (
              <div className="-rotate-4 origin-center">{renderOpponentPod(tableSeats.left, false)}</div>
            )}
          </div>

          <div className="md:col-span-6 flex flex-col items-center justify-center relative min-h-[246px] sm:min-h-[312px] py-4 sm:py-7">
            <UnoDirectionRing direction={direction} isDanger={roomMeta.pendingDraw > 0} />

            {roomStatus === 'playing' && roomMeta.pendingDraw > 0 && (
              <div className="uno-stack-alert relative z-20 mb-2.5 px-3 py-1.5 rounded-lg bg-[#BE123C] text-white font-mono text-[11px] sm:text-xs font-bold tracking-tight text-center">
                Bom Tumpukan +{roomMeta.pendingDraw} Kartu: tangkis minimal +{roomMeta.pendingMinPower} atau telan dek
              </div>
            )}

            {roomStatus === 'playing' && unoVulnerablePlayer && (
              <div className="relative z-20 mb-2.5 flex flex-wrap items-center justify-center gap-2">
                {unoVulnerablePlayer.nim === user?.nim ? (
                  <button
                    type="button"
                    onClick={handleShoutUno}
                    disabled={actionBusy}
                    className="uno-stack-alert min-h-[44px] px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-700 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    TERIAK UNO! (Kartu Tinggal 1)
                  </button>
                ) : !amIEliminated && !amIFinished ? (
                  <button
                    type="button"
                    onClick={handleCatchUno}
                    disabled={actionBusy}
                    className="uno-stack-alert min-h-[44px] px-4 py-2 rounded-xl bg-[#BE123C] hover:bg-[#9F1239] text-white border border-rose-300 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    Tangkap {shortName(unoVulnerablePlayer.nama)} Lupa UNO! (+2)
                  </button>
                ) : null}
              </div>
            )}

            <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-8">
              <div className="flex flex-col items-center gap-1.5">
                <UnoDeckBack
                  key={`deck-${deckKickTick}`}
                  buttonRef={deckBtnRef}
                  pendingDraw={roomMeta.pendingDraw}
                  disabled={!isMyTurn || actionBusy}
                  kicked={deckKickTick > 0}
                  onClick={roomStatus === 'playing' ? handleDrawCard : undefined}
                />
                <span
                  className={`text-[11px] font-mono px-1.5 rounded bg-[#F1EBE0]/90 ${
                    roomMeta.pendingDraw > 0 ? 'font-bold text-[#BE123C]' : 'font-semibold text-[#57534E]'
                  }`}
                >
                  {roomMeta.pendingDraw > 0 ? `Telan +${roomMeta.pendingDraw}` : 'Tumpukan Ambil'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -rotate-9 -translate-x-1 translate-y-1 opacity-55"
                  >
                    <div className="uno-card" style={{ background: '#0369A1' }} />
                  </div>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rotate-7 translate-x-1 translate-y-0.5 opacity-65"
                  >
                    <div className="uno-card" style={{ background: '#D97706' }} />
                  </div>
                  <div ref={topCardSlotRef} className="relative z-20">
                    <UnoCard key={normalizedTop.id || normalizedTop.value} card={normalizedTop} className="uno-card-slap" />
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#1C1917] bg-[#F1EBE0]/90 px-1.5 rounded">
                  Warna: {normalizedTop.color?.name || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-3 justify-center">
            {tableSeats.right && (
              <div className="rotate-4 origin-center">{renderOpponentPod(tableSeats.right, false)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Event Feed Strip (Never overlaps cards or arrows) */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#FAF6EE] border-t border-b border-[#DED6C6] flex flex-wrap items-center justify-center gap-3">
        <p className="text-xs sm:text-sm text-[#1C1917] font-medium text-center leading-snug">
          {statusNotice || 'Pilih kartu yang terangkat di tanganmu untuk turun ke meja.'}
        </p>
        {isCurrentTurnOffline && (
          <button
            type="button"
            onClick={handleSkipDisconnectedTurn}
            className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Lewati Giliran (Terputus)
          </button>
        )}
      </div>

      {/* Bottom Area: Finished Summary, Finished-Early Banner, Eliminated Banner, or 4-Way Scrollable Hand */}
      {roomStatus === 'finished' ? (
        (() => {
          const standings = buildUnoStandings(players, finishedNims, eliminatedNims, finishedNames);
          const champion = standings[0];
          const myStanding = standings.find((s) => s.nim === user?.nim);
          return (
            <div className="bg-[#FFFDF9] p-5 sm:p-6 text-center space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#14532D]">Permainan Selesai!</h2>
                <p className="text-[#1C1917] text-sm">
                  Juara #1 Meja No Mercy:{' '}
                  <strong className="text-amber-800">{champion?.nama || 'Sedulur 16'}</strong>
                </p>
                <p className="text-xs font-mono font-bold text-[#57534E]">
                  {isTrialSession
                    ? 'Mode Uji Coba: poin peringkat tidak masuk papan klasemen.'
                    : 'Poin peringkat otomatis ditambahkan ke papan klasemen.'}
                </p>
              </div>

              <div className="max-w-lg mx-auto border border-[#DED6C6] rounded-xl overflow-hidden text-left divide-y divide-[#EDE6D8] bg-[#FAF6EE]">
                {standings.map((entry) => {
                  const isMe = entry.nim === user?.nim;
                  const statusLabel =
                    entry.status === 'finished'
                      ? `Habis ke-${entry.rank}`
                      : entry.status === 'eliminated'
                      ? `Gugur DO (${entry.cardCount} kartu)`
                      : `Terakhir (${entry.cardCount} kartu)`;
                  return (
                    <div
                      key={entry.nim}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-3 ${
                        isMe ? 'bg-[#ECFDF5]' : 'bg-[#FFFDF9]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0 tabular-nums ${
                            entry.rank === 1
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : entry.points > 0
                              ? 'bg-[#ECFDF5] text-[#14532D] border border-[#BBF7D0]'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#1C1917] truncate">
                            {entry.nama} {isMe ? '(Kamu)' : ''}
                          </div>
                          <div className="text-[11px] font-mono text-[#57534E]">{statusLabel}</div>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs sm:text-sm font-bold shrink-0 tabular-nums ${
                          entry.points > 0 ? 'text-[#14532D]' : 'text-[#78716C]'
                        }`}
                      >
                        {isTrialSession ? 'Uji Coba' : `+${formatUnoPoints(entry.points)}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <StoryShareButton
                  label="Bagikan Hasil Meja ke IG Story"
                  variant="primary"
                  getPayload={() => {
                    const isMeWinner = champion?.nim === user?.nim;
                    return {
                      variant: 'session',
                      badge: 'UNO NO MERCY TL 2016',
                      name: user?.nama || 'Alumni TL 2016',
                      subtitle: `Meja ${currentRoom || '-'}  |  ${standings.length} Pemain`,
                      nim: user?.nim || '',
                      avatarConfig: getLocalAvatarConfig(user?.nim),
                      accent: isMeWinner ? '#B45309' : '#14532D',
                      ringColor: isMeWinner ? '#D97706' : '#14532D',
                      scoreText: myStanding
                        ? `PERINGKAT #${myStanding.rank} (+${formatUnoPoints(myStanding.points)})`
                        : `JUARA #1: ${shortName(champion?.nama)}`,
                      scoreLabel: isMeWinner
                        ? 'Juara #1 Meja UNO No Mercy'
                        : `Juara #1: ${shortName(champion?.nama)} (+4.000 poin)`,
                      sessionTitle: 'KLASEMEN AKHIR MEJA',
                      sessionPlayers: standings.map((entry) => ({
                        rank: `#${entry.rank}`,
                        nama: entry.nama,
                        meta:
                          entry.status === 'finished'
                            ? `Habis ke-${entry.rank}`
                            : entry.status === 'eliminated'
                            ? `Gugur DO (${entry.cardCount})`
                            : `Terakhir (${entry.cardCount} kartu)`,
                        scoreText: `+${formatUnoPoints(entry.points)}`,
                        isMe: entry.nim === user?.nim
                      })),
                      filename: `uno-nomercy-tl16-${currentRoom || 'meja'}.png`,
                      shareTitle: 'Hasil Meja UNO No Mercy TL 2016',
                      shareText: `Selesai main UNO No Mercy TL 2016 di meja ${currentRoom} bareng ${standings.length} teman angkatan!`
                    };
                  }}
                />
                {isHost && (
                  <button
                    type="button"
                    onClick={startGame}
                    disabled={loading}
                    className="min-h-[48px] bg-[#14532D] hover:bg-[#166534] text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Main Lagi di Meja Ini
                  </button>
                )}
              </div>
            </div>
          );
        })()
      ) : amIFinished ? (
        <div className="bg-[#ECFDF5] px-5 py-6 text-center space-y-1.5">
          <h2 className="text-lg font-bold text-[#14532D]">
            Kartumu Habis! Kamu di Peringkat #{myFinishRankIdx + 1} (+{formatUnoPoints(getUnoRankReward(myFinishRankIdx))} poin)
          </h2>
          <p className="text-xs sm:text-sm text-[#166534]">
            Menunggu pemain lain menyelesaikan ronde sampai tersisa 1 pemain di meja.
          </p>
        </div>
      ) : amIEliminated ? (
        <div className="bg-rose-50 px-5 py-6 text-center space-y-1.5">
          <h2 className="text-lg font-bold text-[#BE123C]">
            Kamu Gugur (DO): Tembus {myHand.length} Kartu!
          </h2>
          <p className="text-xs sm:text-sm text-rose-800">
            Kamu sekarang jadi penonton sampai meja menemukan pemenang terakhir.
          </p>
        </div>
      ) : (
        <div className="px-3 sm:px-6 pt-3 pb-4 bg-[#FFFDF9]">
          {pendingWildCard && (
            <div className="mb-3 p-3.5 rounded-xl bg-[#FAF6EE] border border-[#D97706]/50 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#1C1917]">
                  Pilih Warna Aktif untuk {pendingWildCard.value}:
                </span>
                <button
                  type="button"
                  onClick={() => setPendingWildCard(null)}
                  className="text-xs font-bold text-[#57534E] hover:text-[#1C1917] px-2 py-1 cursor-pointer"
                >
                  Batal
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handlePlayCard(pendingWildCard, c)}
                    className={`min-h-[44px] rounded-xl ${c.bg} ${c.text} border ${c.border} font-bold text-xs transition-opacity hover:opacity-90 cursor-pointer`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {pendingSwapCard && (
            <div className="mb-3 p-3.5 rounded-xl bg-[#FAF6EE] border border-[#14532D]/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#1C1917]">
                  Tukar KTM: Pilih lawan untuk ditukar seluruh kartunya!
                </span>
                <button
                  type="button"
                  onClick={() => setPendingSwapCard(null)}
                  className="text-xs font-bold text-[#57534E] hover:text-[#1C1917] px-2 py-1 cursor-pointer"
                >
                  Batal
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activePlayers
                  .filter((p) => p.nim !== user?.nim)
                  .map((op) => (
                    <button
                      key={op.nim}
                      type="button"
                      onClick={() => handlePlayCard(pendingSwapCard, null, op.nim)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#DED6C6] hover:border-[#14532D] text-[#1C1917] font-bold text-xs flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{shortName(op.nama)}</span>
                      <span className="font-mono text-[#14532D] shrink-0 ml-2">
                        {Array.isArray(op.hand) ? op.hand.length : 0} kartu
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-bold text-[#1C1917]">Kartu Kamu</h2>
              <span className="text-xs font-mono font-semibold text-[#57534E] tabular-nums">
                {myHand.length} / {MERCY_LIMIT}
              </span>
              {handScrollState.overflows && (
                <span className="text-[11px] text-[#78716C]">&middot; geser</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleDrawCard}
              disabled={!isMyTurn || actionBusy}
              className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 ${
                isMyTurn && roomMeta.pendingDraw > 0
                  ? 'bg-[#BE123C] hover:bg-[#9F1239] text-white'
                  : 'bg-[#F3EDE0] hover:bg-[#EAE2D0] border border-[#D4CCB8] text-[#1C1917]'
              }`}
            >
              {roomMeta.pendingDraw > 0 ? `Telan +${roomMeta.pendingDraw} Kartu` : 'Ambil 1 Kartu'}
            </button>
          </div>

          <div className="relative flex items-center gap-1.5">
            {handScrollState.overflows && (
              <button
                type="button"
                aria-label="Geser kartu ke kiri"
                disabled={!handScrollState.canLeft}
                onClick={() => handScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                className="shrink-0 min-w-[38px] min-h-[44px] rounded-xl bg-[#F3EDE0] hover:bg-[#EAE2D0] border border-[#D4CCB8] text-[#1C1917] font-bold text-base flex items-center justify-center cursor-pointer disabled:opacity-35"
              >
                &lsaquo;
              </button>
            )}
            <div ref={handScrollRef} className="uno-hand-scroll flex-1 min-w-0">
              <div ref={handRailRef} className="uno-hand-rail min-h-[154px] sm:min-h-[172px]">
                {myHand.map((rawCard) => {
                  const card = normalizeCardColor(rawCard);
                  const playable = isMyTurn && isCardPlayable(card, topCard, roomMeta);
                  return (
                    <UnoCard
                      key={card.id}
                      card={card}
                      interactive
                      playable={playable}
                      disabled={!isMyTurn || actionBusy}
                      className="uno-card-receive"
                      onClick={(e) => {
                        if (didDragHandRef.current) return;
                        handlePlayCard(card, null, null, e.currentTarget);
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {handScrollState.overflows && (
              <button
                type="button"
                aria-label="Geser kartu ke kanan"
                disabled={!handScrollState.canRight}
                onClick={() => handScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                className="shrink-0 min-w-[38px] min-h-[44px] rounded-xl bg-[#F3EDE0] hover:bg-[#EAE2D0] border border-[#D4CCB8] text-[#1C1917] font-bold text-base flex items-center justify-center cursor-pointer disabled:opacity-35"
              >
                &rsaquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
