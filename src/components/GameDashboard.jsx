import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';
import Login from './Login';
import RoadmapModal from './RoadmapModal';
import PlayerAvatar from './PlayerAvatar';
import AvatarDesigner from './AvatarDesigner';
import RedactedText from './RedactedText';
import {
  getLocalAvatarConfig,
  loadPlayerAvatar,
  savePlayerAvatar,
  generateSeedAvatarConfig,
  hasLocalSavedAvatar,
  hasSavedPlayerAvatar
} from '../lib/avatarHelper';
import { isAdminSession, setAdminSessionVerified } from '../lib/adminAuth';
import { extractEarlyAccessConfig, hasActiveEarlyAccess, isPubliclyReleased } from '../lib/earlyAccess';
import { captureInviteFromUrl, readPendingInvite, clearPendingInvite } from '../lib/roomInvite';

const TreasureHunt = lazy(() => import('./TreasureHunt'));
const FaceGame = lazy(() => import('./FaceGame'));
const ScoreBoard = lazy(() => import('./ScoreBoard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const FormKapsulWaktu = lazy(() => import('./FormKapsulWaktu'));
const WheelOfFamily = lazy(() => import('./WheelOfFamily'));
const MonopoliBoard = lazy(() => import('./MonopoliBoard'));
const DosenKillerGame = lazy(() => import('./DosenKillerGame'));
const UnoBrutalGame = lazy(() => import('./UnoBrutalGame'));
const MagicalAthleteGame = lazy(() => import('./MagicalAthleteGame'));
const UpdatesPage = lazy(() => import('./UpdatesPage'));

const LoadingScreen = ({ label = 'Memuat halaman permainan...' }) => (
  <div className="min-h-[60vh] bg-[#F8F6F1] flex flex-col justify-center items-center gap-3 text-zinc-700 p-6">
    <span
      aria-hidden="true"
      className="w-9 h-9 border-3 border-[#DED8CA] border-t-[#14532D] rounded-full animate-spin"
    />
    <p className="text-sm font-semibold">{label}</p>
  </div>
);

const IconMap = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#14532D] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconUsers = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#14532D] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBoard = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#B45309] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
  </svg>
);

const IconClass = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#B45309] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconCards = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#B45309] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4" width="12" height="16" rx="2" />
    <path d="M9 2h10a2 2 0 0 1 2 2v14" />
  </svg>
);

const IconFlag = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#B45309] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22V4" />
    <path d="M4 5h12l-2 4 2 4H4" />
  </svg>
);

const ALLOWED_VIEWS = [
  'dashboard',
  'map',
  'face',
  'kapsul',
  'wheel',
  'monopoli',
  'dosenkiller',
  'unobrutal',
  'athlete',
  'updates',
  'admin'
];

function getBasePathUrl() {
  return window.location.pathname + window.location.search;
}

function getViewHashUrl(view) {
  const base = getBasePathUrl();
  return view && view !== 'dashboard' ? `${base}#${view}` : base;
}

function parseViewFromHash(hashValue) {
  const clean = String(hashValue || '').replace(/^#/, '').trim().toLowerCase();
  if (clean === 'avatar') return 'avatar';
  return ALLOWED_VIEWS.includes(clean) ? clean : '';
}

export default function GameDashboard() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showAnniversary, setShowAnniversary] = useState(false);

  const [avatarConfig, setAvatarConfig] = useState(null);
  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const [targetDate, setTargetDate] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [wheelUnlocked, setWheelUnlocked] = useState(false);

  const [isMonopoliUnlocked, setIsMonopoliUnlocked] = useState(false);
  const [isWerewolfUnlocked, setIsWerewolfUnlocked] = useState(false);
  const [isUnoUnlocked, setIsUnoUnlocked] = useState(false);

  const [monopoliApproaching, setMonopoliApproaching] = useState(false);
  const [werewolfApproaching, setWerewolfApproaching] = useState(false);
  const [unoApproaching, setUnoApproaching] = useState(false);
  const [gameDates, setGameDates] = useState(null);
  const [earlyAccessConfig, setEarlyAccessConfig] = useState(null);
  const [isEarlyAccessActive, setIsEarlyAccessActive] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState(null);
  const activeViewRef = useRef('dashboard');
  const needsGestureAnchorRef = useRef(false);

  const [mysteryLocked, setMysteryLocked] = useState(false);
  const [showMysteryConfirm, setShowMysteryConfirm] = useState(false);
  const [mysteryBusy, setMysteryBusy] = useState(false);
  const [mysteryNotice, setMysteryNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    captureInviteFromUrl();
  }, []);

  useEffect(() => {
    let active = true;

    const initSession = async () => {
      if (localStorage.getItem('is_admin') === 'true' && !isAdminSession()) {
        localStorage.removeItem('user_nim');
        localStorage.removeItem('user_nama');
        localStorage.removeItem('is_admin');
        setAdminSessionVerified(false);
        if (active) setIsChecking(false);
        return;
      }

      const savedNim = localStorage.getItem('user_nim');
      const savedNama = localStorage.getItem('user_nama');
      const isAdmin = isAdminSession();

      if (savedNim) {
        setUser({ nim: savedNim, nama: savedNama, is_admin: isAdmin });
        setAvatarConfig(getLocalAvatarConfig(savedNim) || generateSeedAvatarConfig(savedNim));

        const hashView = parseViewFromHash(window.location.hash);
        const savedView = localStorage.getItem(`active_view_${savedNim}`);
        const candidateView = hashView && hashView !== 'avatar' ? hashView : savedView;
        let resolvedView = 'dashboard';
        if (
          candidateView &&
          ALLOWED_VIEWS.includes(candidateView) &&
          ((candidateView !== 'admin' && candidateView !== 'athlete') || isAdmin)
        ) {
          resolvedView = candidateView;
          setActiveView(candidateView);
        }

        activeViewRef.current = resolvedView;
        if (resolvedView !== 'dashboard') {
          // Push a distinct hash URL on load AND re-anchor on first user gesture
          // so Chrome's History Manipulation Intervention does not skip dashboard on Back.
          window.history.replaceState({ sedulurView: 'dashboard', sedulurBase: true }, '', getBasePathUrl());
          window.history.pushState({ sedulurView: resolvedView, sedulurPushed: true }, '', getViewHashUrl(resolvedView));
          needsGestureAnchorRef.current = true;
        } else {
          window.history.replaceState({ sedulurView: 'dashboard', sedulurBase: true }, '', getBasePathUrl());
          needsGestureAnchorRef.current = false;
        }

        if (resolvedView === 'dashboard') {
          const alreadySaved = hasLocalSavedAvatar(savedNim) || (await hasSavedPlayerAvatar(savedNim));
          if (active && !alreadySaved) {
            setShowAvatarDesigner(true);
            setIsEditingAvatar(false);
          }
        }
      }
      if (active) setIsChecking(false);
    };

    initSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.nim) return;
    let active = true;
    loadPlayerAvatar(user.nim).then((loaded) => {
      if (active && loaded) {
        setAvatarConfig(loaded);
      }
    });

    if (localStorage.getItem(`mystery_location_${user.nim}`) === 'locked') {
      setMysteryLocked(true);
    }

    supabase
      .from('alumni')
      .select('mystery_location')
      .eq('nim', user.nim)
      .single()
      .then(({ data, error }) => {
        if (!active || error || !data || !('mystery_location' in data)) return;
        if (data.mystery_location) {
          localStorage.setItem(`mystery_location_${user.nim}`, 'locked');
          setMysteryLocked(true);
        } else {
          localStorage.removeItem(`mystery_location_${user.nim}`);
          setMysteryLocked(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.nim]);

  useEffect(() => {
    if (!showMysteryConfirm) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !mysteryBusy) {
        setShowMysteryConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMysteryConfirm, mysteryBusy]);

  const handleActivateMystery = async () => {
    if (mysteryLocked || mysteryBusy || !user?.nim) return;
    setMysteryBusy(true);
    setMysteryNotice({ type: '', text: '' });

    try {
      const { data: existing, error: checkErr } = await supabase
        .from('alumni')
        .select('mystery_location')
        .eq('nim', user.nim)
        .single();

      if (!checkErr && existing?.mystery_location) {
        localStorage.setItem(`mystery_location_${user.nim}`, 'locked');
        setMysteryLocked(true);
        setShowMysteryConfirm(false);
        setMysteryBusy(false);
        return;
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setShowMysteryConfirm(false);
        setMysteryNotice({
          type: 'error',
          text: 'Peramban tidak mendukung layanan lokasi. Tombol belum terkunci.'
        });
        setMysteryBusy(false);
        return;
      }

      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const payload = {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
        accuracy_m: Math.round(pos.coords.accuracy || 0),
        recorded_at: new Date().toISOString()
      };

      const { error: saveErr } = await supabase
        .from('alumni')
        .update({ mystery_location: payload })
        .eq('nim', user.nim)
        .is('mystery_location', null);

      if (saveErr) throw saveErr;

      localStorage.setItem(`mystery_location_${user.nim}`, 'locked');
      setMysteryLocked(true);
      setShowMysteryConfirm(false);
      setMysteryNotice({
        type: 'success',
        text: 'Berhasil! Tombol misteri sudah digunakan dan terkunci permanen.'
      });
    } catch (err) {
      setShowMysteryConfirm(false);
      if (err?.code === 1) {
        setMysteryNotice({
          type: 'error',
          text: 'Izin lokasi ditolak. Tombol belum terpakai, aktifkan izin lokasi lalu coba lagi.'
        });
      } else if (err?.code === 2 || err?.code === 3) {
        setMysteryNotice({
          type: 'error',
          text: 'Koordinat lokasi belum terbaca. Coba lagi di tempat dengan sinyal lebih baik.'
        });
      } else {
        setMysteryNotice({
          type: 'error',
          text: 'Gagal menyimpan ke server, tombol belum terkunci. Silakan coba lagi.'
        });
      }
    } finally {
      setMysteryBusy(false);
    }
  };

  useEffect(() => {
    activeViewRef.current = activeView;
    if (!user?.nim) return;
    if (activeView === 'dashboard') {
      localStorage.removeItem(`active_view_${user.nim}`);
    } else {
      localStorage.setItem(`active_view_${user.nim}`, activeView);
    }
  }, [activeView, user?.nim]);

  useEffect(() => {
    if (!user) return;

    const anchorHistoryOnUserGesture = () => {
      if (!needsGestureAnchorRef.current) return;
      needsGestureAnchorRef.current = false;
      const current = activeViewRef.current;
      if (current && current !== 'dashboard') {
        window.history.replaceState({ sedulurView: 'dashboard', sedulurBase: true }, '', getBasePathUrl());
        window.history.pushState({ sedulurView: current, sedulurPushed: true }, '', getViewHashUrl(current));
      }
    };

    const syncFromBrowserHistory = (event) => {
      needsGestureAnchorRef.current = false;
      const next = event?.state?.sedulurView || parseViewFromHash(window.location.hash) || 'dashboard';
      if (next === 'avatar') {
        setIsEditingAvatar(true);
        setShowAvatarDesigner(true);
        return;
      }

      setShowAvatarDesigner(false);
      setIsEditingAvatar(false);

      if (
        next &&
        ALLOWED_VIEWS.includes(next) &&
        (next !== 'admin' || user.is_admin) &&
        (next !== 'athlete' || user.is_admin || isEarlyAccessActive)
      ) {
        activeViewRef.current = next;
        setActiveView(next);
      } else {
        setPendingJoinCode(null);
        activeViewRef.current = 'dashboard';
        setActiveView('dashboard');
      }
    };

    window.addEventListener('pointerdown', anchorHistoryOnUserGesture, true);
    window.addEventListener('keydown', anchorHistoryOnUserGesture, true);
    window.addEventListener('popstate', syncFromBrowserHistory);
    window.addEventListener('hashchange', syncFromBrowserHistory);
    return () => {
      window.removeEventListener('pointerdown', anchorHistoryOnUserGesture, true);
      window.removeEventListener('keydown', anchorHistoryOnUserGesture, true);
      window.removeEventListener('popstate', syncFromBrowserHistory);
      window.removeEventListener('hashchange', syncFromBrowserHistory);
    };
  }, [user, isEarlyAccessActive]);

  const navigateToView = (nextView) => {
    needsGestureAnchorRef.current = false;
    if (nextView === 'dashboard') {
      setPendingJoinCode(null);
      if (window.history.state?.sedulurPushed && !window.history.state?.sedulurBase) {
        window.history.back();
        return;
      }
      setShowAvatarDesigner(false);
      setIsEditingAvatar(false);
      activeViewRef.current = 'dashboard';
      setActiveView('dashboard');
      window.history.replaceState({ sedulurView: 'dashboard', sedulurBase: true }, '', getBasePathUrl());
      return;
    }

    if (window.history.state?.sedulurView !== nextView) {
      window.history.pushState({ sedulurView: nextView, sedulurPushed: true }, '', getViewHashUrl(nextView));
    }
    setShowAvatarDesigner(false);
    setIsEditingAvatar(false);
    activeViewRef.current = nextView;
    setActiveView(nextView);
  };

  const openAvatarEditor = () => {
    needsGestureAnchorRef.current = false;
    if (window.history.state?.sedulurView !== 'avatar') {
      window.history.pushState({ sedulurView: 'avatar', sedulurPushed: true }, '', getViewHashUrl('avatar'));
    }
    setIsEditingAvatar(true);
    setShowAvatarDesigner(true);
  };

  const closeAvatarEditor = () => {
    if (window.history.state?.sedulurView === 'avatar' && window.history.state?.sedulurPushed) {
      window.history.back();
      return;
    }
    setShowAvatarDesigner(false);
    setIsEditingAvatar(false);
  };

  const handleLoginSuccess = (loggedInUser) => {
    const localOrSeed =
      loggedInUser.avatar_config ||
      getLocalAvatarConfig(loggedInUser.nim) ||
      generateSeedAvatarConfig(loggedInUser.nim);
    const alreadySaved = Boolean(loggedInUser.avatar_config) || hasLocalSavedAvatar(loggedInUser.nim);
    setAvatarConfig(localOrSeed);
    setUser(loggedInUser);
    activeViewRef.current = 'dashboard';
    setActiveView('dashboard');
    needsGestureAnchorRef.current = false;
    window.history.replaceState({ sedulurView: 'dashboard', sedulurBase: true }, '', getBasePathUrl());
    setIsEditingAvatar(false);
    setShowAvatarDesigner(!alreadySaved);
  };

  const handleSaveAvatar = async (nextConfig) => {
    if (!user?.nim) return;
    const { config: saved } = await savePlayerAvatar(user.nim, nextConfig);
    setAvatarConfig(saved);
    closeAvatarEditor();
  };

  const closeAnniversary = () => {
    setShowAnniversary(false);
    if (user) localStorage.setItem(`has_seen_anniversary_${user.nim}`, 'true');
  };

  useEffect(() => {
    if (!showAnniversary) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAnniversary();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnniversary, user]);

  useEffect(() => {
    if (user && user.nim !== 'guest' && !showAvatarDesigner) {
      const hasSeen = localStorage.getItem(`has_seen_anniversary_${user.nim}`);
      if (!hasSeen) {
        setShowAnniversary(true);
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#34d399', '#f8fafc']
          });
        }
      }
    }
  }, [user, showAvatarDesigner]);

  useEffect(() => {
    if (!user) return;

    const updateGameStatus = (data) => {
      setTargetDate(data.wheel_unlock_date ? new Date(data.wheel_unlock_date) : null);
      if (!data.wheel_unlock_date) setWheelUnlocked(false);

      setGameDates({
        monopoli: data.monopoli_unlock_date,
        werewolf: data.werewolf_unlock_date,
        uno: data.uno_unlock_date
      });
      setEarlyAccessConfig(extractEarlyAccessConfig(data));
    };

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('wheel_unlock_date, monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date, patch_notes')
          .eq('id', 1)
          .single();

        if (error) throw error;
        if (data) {
          updateGameStatus(data);
        }
      } catch (error) {
        console.error('Gagal memeriksa jadwal:', error.message);
      }
    };

    fetchSettings();

    const subscription = supabase
      .channel('public:app_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
        (payload) => {
          updateGameStatus(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      const now = Date.now();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        setWheelUnlocked(true);
        setTimeLeft(null);
      } else {
        setWheelUnlocked(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  useEffect(() => {
    if (!user || !gameDates) return;

    const checkLocalTime = () => {
      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const eaActive = !user.is_admin && hasActiveEarlyAccess(earlyAccessConfig, user.nim, now);
      setIsEarlyAccessActive(eaActive);
      const hasPreviewAccess = Boolean(user.is_admin || eaActive);

      if (hasPreviewAccess) {
        setIsMonopoliUnlocked(true);
        setMonopoliApproaching(false);
      } else if (gameDates.monopoli) {
        const unlockTimeMono = new Date(gameDates.monopoli).getTime();
        setIsMonopoliUnlocked(now >= unlockTimeMono);
        setMonopoliApproaching(now < unlockTimeMono && unlockTimeMono - now <= THIRTY_DAYS_MS);
      } else {
        setIsMonopoliUnlocked(false);
        setMonopoliApproaching(false);
      }

      if (hasPreviewAccess) {
        setIsWerewolfUnlocked(true);
        setWerewolfApproaching(false);
      } else if (gameDates.werewolf) {
        const unlockTimeWolf = new Date(gameDates.werewolf).getTime();
        setIsWerewolfUnlocked(now >= unlockTimeWolf);
        setWerewolfApproaching(now < unlockTimeWolf && unlockTimeWolf - now <= THIRTY_DAYS_MS);
      } else {
        setIsWerewolfUnlocked(false);
        setWerewolfApproaching(false);
      }

      if (hasPreviewAccess) {
        setIsUnoUnlocked(true);
        setUnoApproaching(false);
      } else if (gameDates.uno) {
        const unlockTimeUno = new Date(gameDates.uno).getTime();
        setIsUnoUnlocked(now >= unlockTimeUno);
        setUnoApproaching(now < unlockTimeUno && unlockTimeUno - now <= THIRTY_DAYS_MS);
      } else {
        setIsUnoUnlocked(false);
        setUnoApproaching(false);
      }
    };

    checkLocalTime();
    const interval = setInterval(checkLocalTime, 1000);
    return () => clearInterval(interval);
  }, [user, gameDates, earlyAccessConfig]);

  useEffect(() => {
    if (!user || !gameDates) return;
    const invite = readPendingInvite();
    if (!invite) return;

    clearPendingInvite();
    const now = Date.now();
    const eaActive = !user.is_admin && hasActiveEarlyAccess(earlyAccessConfig, user.nim, now);
    const hasPreview = Boolean(user.is_admin || eaActive);
    const allowed =
      (invite.game === 'monopoli' && (hasPreview || isPubliclyReleased(gameDates.monopoli, now))) ||
      (invite.game === 'dosenkiller' && (hasPreview || isPubliclyReleased(gameDates.werewolf, now))) ||
      (invite.game === 'unobrutal' && (hasPreview || isPubliclyReleased(gameDates.uno, now))) ||
      (invite.game === 'athlete' && hasPreview);

    if (!allowed) return;

    setPendingJoinCode(invite);
    setShowAvatarDesigner(false);
    setIsEditingAvatar(false);
    activeViewRef.current = invite.game;
    if (window.history.state?.sedulurView !== invite.game) {
      window.history.replaceState({ sedulurView: 'dashboard', sedulurBase: true }, '', getBasePathUrl());
      window.history.pushState({ sedulurView: invite.game, sedulurPushed: true }, '', getViewHashUrl(invite.game));
      needsGestureAnchorRef.current = true;
    }
    setActiveView(invite.game);
  }, [user, gameDates, earlyAccessConfig]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (isChecking) {
    return (
      <main className="min-h-[100dvh] bg-[#F8F6F1] flex justify-center items-center p-4 text-zinc-700 font-semibold text-center">
        Memuat Portal Perayaan 1 Dekade TL 2016...
      </main>
    );
  }

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  if (showAvatarDesigner) {
    return (
      <AvatarDesigner
        user={user}
        initialConfig={avatarConfig}
        isEditing={isEditingAvatar}
        isMonopoliUnlocked={isMonopoliUnlocked}
        onSave={handleSaveAvatar}
        onCancel={closeAvatarEditor}
      />
    );
  }

  const renderSubView = (Component, props = {}) => (
    <div className="min-h-[100dvh] bg-[#F8F6F1] text-zinc-900 p-4 sm:p-6 md:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-5xl mx-auto">
        <nav aria-label="Navigasi kembali" className="mb-5 sm:mb-6 pb-4 border-b border-[#DED8CA] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigateToView('dashboard')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#DED8CA] text-[#14532D] hover:bg-[#EFE9DC] font-bold text-sm transition-colors"
          >
            &larr; Kembali ke Beranda Perayaan
          </button>
          <div className="hidden sm:flex items-center gap-2.5 bg-[#FFFDF9] border border-[#DED8CA] px-3 py-1.5 rounded-xl">
            <PlayerAvatar config={avatarConfig} seed={user.nim} className="w-7 h-7" alt={user.nama} />
            <span className="text-xs font-bold text-zinc-800">{user.nama}</span>
          </div>
        </nav>
        <main>
          <Suspense fallback={<LoadingScreen />}>
            <Component onBack={() => navigateToView('dashboard')} {...props} />
          </Suspense>
        </main>
      </div>
    </div>
  );

  const hasTestAccess = Boolean(user.is_admin || isEarlyAccessActive);

  if (activeView === 'map') return renderSubView(TreasureHunt);
  if (activeView === 'face') return renderSubView(FaceGame);
  if (activeView === 'kapsul') return renderSubView(FormKapsulWaktu, { userLocal: user });
  if (activeView === 'wheel') return renderSubView(WheelOfFamily);
  if (activeView === 'monopoli') {
    return renderSubView(MonopoliBoard, {
      myAvatarConfig: avatarConfig,
      initialRoomCode: pendingJoinCode?.game === 'monopoli' ? pendingJoinCode.code : ''
    });
  }
  if (activeView === 'dosenkiller') {
    return renderSubView(DosenKillerGame, {
      initialRoomCode: pendingJoinCode?.game === 'dosenkiller' ? pendingJoinCode.code : ''
    });
  }
  if (activeView === 'unobrutal') {
    return renderSubView(UnoBrutalGame, {
      initialRoomCode: pendingJoinCode?.game === 'unobrutal' ? pendingJoinCode.code : ''
    });
  }
  if (activeView === 'athlete' && hasTestAccess) {
    return renderSubView(MagicalAthleteGame, {
      initialRoomCode: pendingJoinCode?.game === 'athlete' ? pendingJoinCode.code : ''
    });
  }

  if (activeView === 'updates') {
    return (
      <Suspense fallback={<LoadingScreen label="Memuat catatan pembaruan..." />}>
        <UpdatesPage onBack={() => navigateToView('dashboard')} />
      </Suspense>
    );
  }

  if (activeView === 'admin' && user.is_admin) {
    return (
      <Suspense fallback={<LoadingScreen label="Memuat ruang panitia..." />}>
        <AdminDashboard onBack={() => navigateToView('dashboard')} />
      </Suspense>
    );
  }

  const redactedDetail = (
    <span className="inline-flex flex-wrap items-center gap-1.5 pt-0.5">
      <RedactedText revealed={false} widthClass="w-52" srLabel="detail permainan dirahasiakan" />
      <RedactedText revealed={false} widthClass="w-32" srLabel="" />
    </span>
  );

  const multiplayerGames = [];
  if (isMonopoliUnlocked || monopoliApproaching) {
    multiplayerGames.push({
      id: 'monopoli',
      title: (
        <>
          <RedactedText revealed={isMonopoliUnlocked} widthClass="w-20">
            Monopoli
          </RedactedText>{' '}
          TL16
        </>
      ),
      unlocked: isMonopoliUnlocked,
      icon: <IconBoard />,
      description: isMonopoliUnlocked
        ? 'Kelilingi petak kampus memakai bidak karaktermu, beli properti kontrakan, dan jawab tantangan Truth or Dare.'
        : redactedDetail,
      ctaLabel: 'Buka Papan Monopoli',
      onClick: () => navigateToView('monopoli')
    });
  }
  if (isWerewolfUnlocked || werewolfApproaching) {
    multiplayerGames.push({
      id: 'dosenkiller',
      title: (
        <RedactedText revealed={isWerewolfUnlocked} widthClass="w-28">
          Dosen Killer
        </RedactedText>
      ),
      unlocked: isWerewolfUnlocked,
      icon: <IconClass />,
      description: isWerewolfUnlocked
        ? 'Permainan tebak peran ala kelas kuliah: temukan siapa Dosen Killer sebelum satu kelas kena remedial.'
        : redactedDetail,
      ctaLabel: 'Masuk Ruang Kelas',
      onClick: () => navigateToView('dosenkiller')
    });
  }
  if (isUnoUnlocked || unoApproaching) {
    multiplayerGames.push({
      id: 'unobrutal',
      title: (
        <RedactedText revealed={isUnoUnlocked} widthClass="w-28">
          UNO Seru TL16
        </RedactedText>
      ),
      unlocked: isUnoUnlocked,
      icon: <IconCards />,
      description: isUnoUnlocked
        ? 'Buka meja kartu bersama teman-teman angkatan dengan aturan tumpuk kartu yang meriah.'
        : redactedDetail,
      ctaLabel: 'Gabung Meja Kartu',
      onClick: () => navigateToView('unobrutal')
    });
  }
  if (hasTestAccess) {
    multiplayerGames.push({
      id: 'athlete',
      title: 'Magical Athlete TL16',
      unlocked: true,
      icon: <IconFlag />,
      description:
        'Bursa draft atlet berkarakter dan balapan 4 ronde lintas petak bersama teman atau bot.',
      ctaLabel: 'Masuk Arena Balap',
      onClick: () => navigateToView('athlete')
    });
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8F6F1] text-zinc-900 relative pb-[max(3.5rem,env(safe-area-inset-bottom))]">
      {showAnniversary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anniv-welcome-title"
          className="fixed inset-0 z-50 bg-zinc-950/60 flex flex-col items-center justify-center p-4"
        >
          <div className="bg-[#FFFDF9] border border-[#DED8CA] p-8 md:p-10 rounded-2xl max-w-lg w-full text-center shadow-xl">
            <h2 id="anniv-welcome-title" className="flex justify-center mb-5">
              <img
                src="/Asset 2.webp"
                alt="Happy Anniversary Teknik Lingkungan 2016"
                width="280"
                height="109"
                className="w-full max-w-[260px] h-auto"
              />
            </h2>
            <p className="text-zinc-700 text-base mb-8 leading-relaxed">
              Selamat datang kembali, <strong className="text-zinc-900">{user.nama}</strong>! Mari rayakan satu dekade Teknik Lingkungan 2016 dengan mengisi kapsul kenangan dan bermain bersama.
            </p>
            <button
              type="button"
              onClick={closeAnniversary}
              className="min-h-[48px] px-8 py-3 bg-[#14532D] hover:bg-[#166534] text-white font-bold rounded-xl transition-colors text-base"
            >
              Mulai Rayakan Sekarang
            </button>
          </div>
        </div>
      )}

      {showMysteryConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mystery-confirm-title"
          className="fixed inset-0 z-50 bg-zinc-950/60 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="bg-[#FFFDF9] border border-[#DED8CA] p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-xl space-y-5">
            <div className="space-y-2">
              <h2 id="mystery-confirm-title" className="text-xl font-bold text-zinc-900">
                Peringatan Tombol Misteri
              </h2>
              <p className="text-sm text-zinc-700 leading-relaxed">
                Tombol ini hanya dapat digunakan <strong>1 kali</strong> dan hasilnya tidak dapat diubah atau diulang kembali.
              </p>
              <p className="text-sm text-zinc-700 leading-relaxed">
                Saat kamu melanjutkan, peramban akan meminta izin akses lokasi untuk mencatat titik koordinat keberadaanmu sekarang. Tujuan penggunaannya tetap dirahasiakan sebagai kejutan acara.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                disabled={mysteryBusy}
                onClick={() => setShowMysteryConfirm(false)}
                className="sm:w-1/3 min-h-[46px] px-4 py-2.5 rounded-xl bg-[#F1ECE0] hover:bg-[#E5DFD2] border border-[#DED8CA] text-zinc-900 font-bold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={mysteryBusy}
                onClick={handleActivateMystery}
                className={`sm:flex-1 min-h-[46px] px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  mysteryBusy
                    ? 'bg-[#E5DFD2] text-zinc-800'
                    : 'bg-[#14532D] hover:bg-[#166534] text-white'
                }`}
              >
                {mysteryBusy ? 'Mengambil Titik Lokasi...' : 'Ya, Aktifkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER NAVIGASI BERSIH */}
      <header className="sticky top-0 z-30 bg-[#FFFDF9] border-b border-[#DED8CA] pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <PlayerAvatar
              config={avatarConfig}
              seed={user.nim}
              className="w-11 h-11 border border-[#C7BDA8]"
              alt={`Karakter ${user.nama}`}
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight truncate">
                Halo, {user.nama}!
              </h1>
              <p className="text-zinc-600 text-xs">
                NIM <span className="font-mono font-semibold text-[#14532D]">{user.nim}</span>
              </p>
            </div>
          </div>

          <nav aria-label="Menu pengguna" className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={openAvatarEditor}
              className="min-h-[44px] text-xs whitespace-nowrap bg-[#F1ECE0] hover:bg-[#E5DFD2] border border-[#DED8CA] text-zinc-900 px-3.5 py-2 rounded-xl font-bold transition-colors"
            >
              Edit Karakter
            </button>
            <RoadmapModal />
            <button
              type="button"
              onClick={() => navigateToView('updates')}
              className="min-h-[44px] text-xs whitespace-nowrap bg-[#FFFDF9] hover:bg-[#F1ECE0] px-3.5 py-2 rounded-xl border border-[#DED8CA] text-zinc-800 font-bold transition-colors"
            >
              Catatan Update
            </button>
            {user.is_admin && (
              <button
                type="button"
                onClick={() => navigateToView('admin')}
                className="min-h-[44px] text-xs whitespace-nowrap bg-[#14532D] hover:bg-[#166534] text-white px-3.5 py-2 rounded-xl font-bold transition-colors"
              >
                Ruang Panitia
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] text-xs whitespace-nowrap bg-[#FFFDF9] px-3.5 py-2 rounded-xl border border-[#DED8CA] hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800 text-zinc-700 font-semibold transition-colors ml-auto lg:ml-0"
            >
              Keluar
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <main className="space-y-10 sm:space-y-12">
          {isEarlyAccessActive && (
            <div
              role="status"
              className="px-4 py-3.5 rounded-2xl bg-[#FEF7E6] border border-[#D97706] text-stone-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <strong className="text-amber-900">Akses Uji Coba (Early Access) Aktif:</strong>{' '}
                kamu bisa menguji seluruh permainan bersama panitia. Skor permainan uji coba tidak masuk penilaian database klasemen.
              </div>
              {earlyAccessConfig?.end_at && (
                <span className="font-mono text-[11px] font-bold text-amber-900 shrink-0">
                  Berlaku s.d.{' '}
                  {new Date(earlyAccessConfig.end_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          )}

          {/* BAGIAN 1: AGENDA UTAMA & PROFIL + WHEEL OF FAMILY (EDITORIAL 2-KOLOM) */}
          <section aria-labelledby="highlight-heading">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-stretch">
              <article className="md:col-span-7 bg-[#FFFDF9] p-5 sm:p-6 lg:p-8 rounded-2xl border border-[#DED8CA] flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <img
                    src="/Asset 2.webp"
                    alt="Happy Anniversary Teknik Lingkungan 2016"
                    width="220"
                    height="86"
                    fetchPriority="high"
                    className="w-40 sm:w-48 h-auto"
                  />
                  <div>
                    <h2 id="highlight-heading" className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
                      Kapsul Waktu 2016 ke 2026
                    </h2>
                    <p className="text-zinc-600 text-sm sm:text-base mt-2 leading-relaxed max-w-xl">
                      Unggah satu foto terbaikmu di tahun 2026 beserta pesan hangat atau cerita lucu masa kuliah untuk{' '}
                      <RedactedText revealed={Boolean(user.is_admin || wheelUnlocked)} widthClass="w-48">
                        diputar bersama pada puncak acara Wheel of Family
                      </RedactedText>
                      .
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => navigateToView('kapsul')}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-[#14532D] hover:bg-[#166534] rounded-xl font-bold text-white text-sm sm:text-base transition-colors"
                  >
                    Isi Kapsul Waktu Sekarang
                  </button>
                </div>
              </article>

              <article className="md:col-span-5 bg-[#F1ECE0] p-5 sm:p-6 lg:p-8 rounded-2xl border border-[#DED8CA] flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between gap-3 pb-5 border-b border-[#D8D0C0]">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar
                      config={avatarConfig}
                      seed={user.nim}
                      className="w-14 h-14 border border-[#C7BDA8]"
                      alt={`Karakter ${user.nama}`}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-base truncate">
                        {user.nama}
                      </p>
                      <p className="text-xs font-mono text-zinc-600 mt-0.5">
                        NIM {user.nim}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openAvatarEditor}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFFDF9] hover:bg-white border border-[#DED8CA] text-zinc-800 text-xs font-bold transition-colors shrink-0"
                  >
                    Ubah
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-4">
                  {hasTestAccess ? (
                    <>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1.5">Wheel of Family</h3>
                        <p className="text-zinc-700 text-sm leading-relaxed">
                          {user.is_admin
                            ? (targetDate
                              ? 'Hitung mundur untuk peserta sedang berjalan. Panitia dapat menguji roda putar kapan saja.'
                              : 'Jadwal pembukaan roda putar belum diatur di Ruang Panitia.')
                            : 'Akses uji coba (Early Access) aktif. Kamu bisa menguji roda putar bersama panitia.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToView('wheel')}
                        className="w-full min-h-[46px] py-2.5 px-5 bg-[#FFFDF9] hover:bg-white border border-[#CEC6B6] rounded-xl font-bold text-zinc-900 text-sm transition-colors"
                      >
                        Buka Roda Putar
                      </button>
                    </>
                  ) : !targetDate ? (
                    <div className="space-y-2.5">
                      <h3 className="text-lg font-bold text-zinc-900">
                        <RedactedText revealed={false} widthClass="w-32">
                          Wheel of Family
                        </RedactedText>
                      </h3>
                      <div className="space-y-1.5 text-sm leading-relaxed">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <RedactedText revealed={false} widthClass="w-44" srLabel="detail agenda puncak dirahasiakan" />
                          <RedactedText revealed={false} widthClass="w-20" srLabel="" />
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          <RedactedText revealed={false} widthClass="w-36" srLabel="" />
                        </span>
                      </div>
                    </div>
                  ) : !wheelUnlocked && timeLeft ? (
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">
                          <RedactedText revealed={false} widthClass="w-32">
                            Wheel of Family
                          </RedactedText>{' '}
                          Segera Dibuka
                        </h3>
                        <p className="text-zinc-600 text-xs mt-1 flex items-center gap-1">
                          <span>Hitung mundur</span>
                          <RedactedText revealed={false} widthClass="w-36" srLabel="detail agenda puncak dirahasiakan" />
                          <span>:</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-zinc-900">{timeLeft.days}</span>
                          <span className="block text-[11px] text-zinc-600 font-medium">Hari</span>
                        </div>
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-zinc-900">{timeLeft.hours}</span>
                          <span className="block text-[11px] text-zinc-600 font-medium">Jam</span>
                        </div>
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-zinc-900">{timeLeft.minutes}</span>
                          <span className="block text-[11px] text-zinc-600 font-medium">Menit</span>
                        </div>
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-[#14532D]">{timeLeft.seconds}</span>
                          <span className="block text-[11px] text-[#14532D] font-medium">Detik</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1.5">Wheel of Family</h3>
                        <p className="text-zinc-700 text-sm leading-relaxed">
                          Saatnya memutar roda kenangan dan melihat transformasi teman-teman Sedulur 16 dari 2016 ke 2026!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToView('wheel')}
                        className="w-full min-h-[46px] py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl font-bold text-sm transition-colors"
                      >
                        Buka Roda Kenangan
                      </button>
                    </>
                  )}
                </div>
              </article>
            </div>
          </section>

          {/* TOMBOL MISTERI SEKALI PAKAI */}
          <section aria-labelledby="mystery-button-heading" className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 id="mystery-button-heading" className="text-lg font-bold text-zinc-900">
                Tombol Misteri
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {mysteryLocked
                  ? 'Tombol ini sudah digunakan satu kali dan kini terkunci permanen di akunmu.'
                  : 'Hanya dapat ditekan 1 kali seumur hidup akunmu dan tidak dapat diubah kembali setelah aktif.'}
              </p>
              {mysteryNotice.text && (
                <p
                  role="alert"
                  className={`text-xs font-semibold pt-1 ${
                    mysteryNotice.type === 'success' ? 'text-[#14532D]' : 'text-rose-800'
                  }`}
                >
                  {mysteryNotice.text}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={mysteryLocked}
              onClick={() => {
                setMysteryNotice({ type: '', text: '' });
                setShowMysteryConfirm(true);
              }}
              className={`w-full sm:w-auto shrink-0 min-h-[48px] px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
                mysteryLocked
                  ? 'bg-[#E5DFD2] text-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {mysteryLocked ? 'Sudah Digunakan & Terkunci' : 'Buka Tombol Misteri'}
            </button>
          </section>

          {/* BAGIAN 2: KUIS KENANGAN KAMPUS (PEMBAGIAN 2-KOLOM DALAM SATU LEMBAR) */}
          <section aria-labelledby="solo-games-heading" className="space-y-4">
            <div>
              <h2 id="solo-games-heading" className="text-xl sm:text-2xl font-bold text-zinc-900">
                Kuis Kenangan Kampus (Main Sendiri)
              </h2>
              <p className="text-zinc-600 text-sm mt-0.5">
                Kumpulkan poin klasemen angkatan dengan menebak lokasi kampus dan foto masa maba.
              </p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5DFD2]">
              <article className="p-6 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <IconMap />
                      <h3 className="text-lg font-bold text-zinc-900">Digital Treasure Hunt</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#14532D]">20 Lokasi</span>
                  </div>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Napak tilas titik-titik kenangan di sekitar kampus dan tempat nongkrong legendaris angkatan 2016.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => navigateToView('map')}
                    className="w-full sm:w-auto min-h-[46px] bg-[#14532D] hover:bg-[#166534] py-2.5 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                  >
                    Mulai Tebak Lokasi
                  </button>
                </div>
              </article>

              <article className="p-6 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <IconUsers />
                      <h3 className="text-lg font-bold text-zinc-900">Tebak Muka Blur</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#14532D]">20 Foto</span>
                  </div>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Seberapa hafal kamu dengan wajah teman seangkatan tahun 2016? Semakin cepat menebak, semakin tinggi poinnya.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => navigateToView('face')}
                    className="w-full sm:w-auto min-h-[46px] bg-[#14532D] hover:bg-[#166534] py-2.5 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                  >
                    Mulai Tebak Foto
                  </button>
                </div>
              </article>
            </div>
          </section>

          {/* BAGIAN 3: ARENA MAIN BARENG MULTIPLAYER (DAFTAR INDEKS BERNOMOR) */}
          {multiplayerGames.length > 0 && (
            <section aria-labelledby="party-games-heading" className="space-y-4">
              <div>
                <h2 id="party-games-heading" className="text-xl sm:text-2xl font-bold text-zinc-900">
                  Arena Main Bareng (Multiplayer)
                </h2>
                <p className="text-zinc-600 text-sm mt-0.5">
                  Permainan seru bersama satu tongkrongan memakai karakter yang sudah kamu desain.
                </p>
              </div>

              <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl divide-y divide-[#E5DFD2]">
                {multiplayerGames.map((game, index) => (
                  <article
                    key={game.id}
                    className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      game.unlocked ? '' : 'bg-[#F8F6F1]/70'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-500 pt-1 shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="pt-0.5 shrink-0">{game.icon}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 mb-1">
                          <h3 className="text-lg font-bold text-zinc-900">{game.title}</h3>
                          <span
                            className={`text-xs font-bold ${
                              game.unlocked ? 'text-[#14532D]' : 'text-amber-800'
                            }`}
                          >
                            {game.unlocked ? 'Siap Dimainkan' : 'Segera Dibuka'}
                          </span>
                        </div>
                        <p className="text-zinc-600 text-sm leading-relaxed max-w-xl">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    {game.unlocked && (
                      <button
                        type="button"
                        onClick={game.onClick}
                        className="w-full sm:w-auto shrink-0 min-h-[46px] bg-amber-400 hover:bg-amber-300 py-2.5 px-5 rounded-xl font-bold text-zinc-950 text-sm transition-colors"
                      >
                        {game.ctaLabel}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* BAGIAN 4: PAPAN KLASEMEN */}
          <Suspense
            fallback={
              <div className="text-center p-8 text-zinc-600 bg-[#FFFDF9] rounded-2xl border border-[#DED8CA]">
                Memuat Papan Klasemen...
              </div>
            }
          >
            <ScoreBoard currentNim={user.nim} currentAvatarConfig={avatarConfig} />
          </Suspense>
        </main>

        <footer className="mt-14 pt-8 border-t border-[#DED8CA] text-center text-zinc-600 text-xs space-y-1">
          <p className="font-semibold text-zinc-800">Perayaan 1 Dekade Teknik Lingkungan Angkatan 2016 (Sedulur 16)</p>
          <p>2016 - 2026 | Kebersamaan Satu Dekade</p>
        </footer>
      </div>
    </div>
  );
}
