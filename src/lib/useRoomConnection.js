import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

/**
 * Deterministically picks one online non-bot coordinator so rooms keep moving when the host disconnects.
 */
export function pickActiveCoordinator(candidates = [], onlineNims = new Set(), preferredNim = null) {
  if (!onlineNims || onlineNims.size === 0) return null;

  const humans = (candidates || []).filter((c) => c && c.nim && !c.is_bot && onlineNims.has(c.nim));
  if (humans.length === 0) return null;

  if (preferredNim && humans.some((c) => c.nim === preferredNim)) {
    return preferredNim;
  }

  const sorted = [...humans].sort((a, b) => {
    const slotA = typeof a.slot_number === 'number' ? a.slot_number : Number.MAX_SAFE_INTEGER;
    const slotB = typeof b.slot_number === 'number' ? b.slot_number : Number.MAX_SAFE_INTEGER;
    if (slotA !== slotB) return slotA - slotB;
    return String(a.nim).localeCompare(String(b.nim));
  });

  return sorted[0].nim;
}

/**
 * Returns true when a permanent bot OR a temporarily disconnected human player needs bot takeover.
 * Automatically returns false once the human player reconnects to presence.
 */
export function shouldBotControlPlayer(player, onlineNims = new Set()) {
  if (!player) return false;
  if (player.is_bot) return true;
  return Boolean(onlineNims && onlineNims.size > 0 && player.nim && !onlineNims.has(player.nim));
}

/**
 * Tracks room presence, online status, visibility/network reconnect resyncs, and fallback polling.
 */
export function useRoomConnection({
  channelName,
  nim,
  meta = {},
  enabled = true,
  onSync,
  syncIntervalMs = 5000
}) {
  const [onlineNims, setOnlineNims] = useState(() => new Set());
  const [onlineMetaMap, setOnlineMetaMap] = useState(() => ({}));
  const [connectionStatus, setConnectionStatus] = useState(() =>
    typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online'
  );

  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const metaJson = JSON.stringify(meta || {});

  useEffect(() => {
    if (!enabled || !channelName || !nim) {
      setOnlineNims(new Set());
      setOnlineMetaMap({});
      return;
    }

    let active = true;
    const parsedMeta = JSON.parse(metaJson);

    const channel = supabase.channel(channelName, {
      config: { presence: { key: nim } }
    });

    const refreshPresenceState = () => {
      if (!active) return;
      const state = channel.presenceState();
      const nextSet = new Set();
      const nextMeta = {};
      Object.keys(state).forEach((key) => {
        const entries = state[key];
        if (Array.isArray(entries) && entries.length > 0) {
          nextSet.add(key);
          nextMeta[key] = entries[entries.length - 1];
        }
      });
      setOnlineNims(nextSet);
      setOnlineMetaMap(nextMeta);
    };

    const trackSelf = async () => {
      try {
        await channel.track({
          nim,
          ...parsedMeta,
          online_at: new Date().toISOString()
        });
      } catch {
        // Presence track retries on next reconnect event
      }
    };

    channel
      .on('presence', { event: 'sync' }, refreshPresenceState)
      .on('presence', { event: 'join' }, refreshPresenceState)
      .on('presence', { event: 'leave' }, refreshPresenceState)
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setConnectionStatus(navigator.onLine === false ? 'offline' : 'online');
          trackSelf();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionStatus(navigator.onLine === false ? 'offline' : 'reconnecting');
        }
      });

    const handleOnline = () => {
      setConnectionStatus('reconnecting');
      trackSelf().finally(() => {
        if (active) setConnectionStatus('online');
      });
      if (typeof onSyncRef.current === 'function') {
        onSyncRef.current();
      }
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        trackSelf();
        if (typeof onSyncRef.current === 'function') {
          onSyncRef.current();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine !== false) {
        if (typeof onSyncRef.current === 'function') {
          onSyncRef.current();
        }
      }
    }, syncIntervalMs);

    return () => {
      active = false;
      clearInterval(pollTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [channelName, nim, enabled, metaJson, syncIntervalMs]);

  return { onlineNims, onlineMetaMap, connectionStatus };
}
