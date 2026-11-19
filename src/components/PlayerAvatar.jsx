import React, { useMemo, useId, useRef, useEffect } from 'react';
import {
  renderOpeepsSvg,
  generateSeedAvatarConfig,
  normalizeAvatarConfig
} from '../lib/avatarHelper';

const AVATAR_CANVAS_SIZE = 320;
const MAX_CANVAS_CACHE = 120;
const avatarCanvasCache = new Map();
const pendingRenders = new Map();

function getOrRenderAvatarCanvas(cacheKey, svgDataUri, fallbackBg) {
  const existing = avatarCanvasCache.get(cacheKey);
  if (existing) return Promise.resolve(existing);

  const inflight = pendingRenders.get(cacheKey);
  if (inflight) return inflight;

  const task = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = AVATAR_CANVAS_SIZE;
        offscreen.height = AVATAR_CANVAS_SIZE;
        const ctx = offscreen.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = fallbackBg || '#D1FAE5';
        ctx.fillRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
        ctx.drawImage(img, 0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);

        if (avatarCanvasCache.size >= MAX_CANVAS_CACHE) {
          const oldestKey = avatarCanvasCache.keys().next().value;
          if (oldestKey !== undefined) avatarCanvasCache.delete(oldestKey);
        }
        avatarCanvasCache.set(cacheKey, offscreen);
        resolve(offscreen);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = svgDataUri;
  }).finally(() => {
    pendingRenders.delete(cacheKey);
  });

  pendingRenders.set(cacheKey, task);
  return task;
}

/**
 * Open Peeps avatar drawn directly onto a 2D canvas element so mobile
 * Force Dark image classifiers (which invert <img>/<svg>) preserve true colors.
 */
export default function PlayerAvatar({ config, seed = '', className = 'w-12 h-12', alt = 'Karakter Pemain' }) {
  const reactId = useId();
  const canvasRef = useRef(null);

  const { cacheKey, svgDataUri, bgHex } = useMemo(() => {
    const resolved = config ? normalizeAvatarConfig(config) : generateSeedAvatarConfig(seed || reactId);
    const key = JSON.stringify(resolved);
    const svgMarkup = renderOpeepsSvg(resolved, `${reactId}_${seed || 'av'}`).trim();
    return {
      cacheKey: key,
      svgDataUri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`,
      bgHex: resolved.circleBg
    };
  }, [config, seed, reactId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cached = avatarCanvasCache.get(cacheKey);
    if (cached) {
      ctx.drawImage(cached, 0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
      return;
    }

    ctx.fillStyle = bgHex || '#D1FAE5';
    ctx.fillRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);

    let cancelled = false;
    getOrRenderAvatarCanvas(cacheKey, svgDataUri, bgHex).then((offscreen) => {
      if (cancelled || !offscreen || !canvasRef.current) return;
      const targetCtx = canvasRef.current.getContext('2d', { alpha: false });
      if (!targetCtx) return;
      targetCtx.drawImage(offscreen, 0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, svgDataUri, bgHex]);

  return (
    <div
      className={`avatar-photo-lock inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={AVATAR_CANVAS_SIZE}
        height={AVATAR_CANVAS_SIZE}
        role="img"
        aria-label={alt}
        className="w-full h-full block select-none"
      />
    </div>
  );
}
