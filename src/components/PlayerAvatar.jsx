import React, { useMemo, useId, useState, useEffect } from 'react';
import {
  renderOpeepsSvg,
  generateSeedAvatarConfig,
  normalizeAvatarConfig
} from '../lib/avatarHelper';

const AVATAR_RASTER_SIZE = 256;
const MAX_RASTER_CACHE = 120;
const avatarRasterCache = new Map();

function rasterizeSvgToOpaqueJpeg(svgDataUri, fallbackBg) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_RASTER_SIZE;
        canvas.height = AVATAR_RASTER_SIZE;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(svgDataUri);
          return;
        }
        ctx.fillStyle = fallbackBg || '#D1FAE5';
        ctx.fillRect(0, 0, AVATAR_RASTER_SIZE, AVATAR_RASTER_SIZE);
        ctx.drawImage(img, 0, 0, AVATAR_RASTER_SIZE, AVATAR_RASTER_SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(svgDataUri);
      }
    };
    img.onerror = () => resolve(svgDataUri);
    img.src = svgDataUri;
  });
}

/**
 * Open Peeps avatar rasterized to an opaque JPEG portrait in the browser so
 * mobile Force Dark engines treat it as a photo and keep facial ink intact.
 */
export default function PlayerAvatar({ config, seed = '', className = 'w-12 h-12', alt = 'Karakter Pemain' }) {
  const reactId = useId();

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

  const [rasterSrc, setRasterSrc] = useState(() => avatarRasterCache.get(cacheKey) || '');

  useEffect(() => {
    const cached = avatarRasterCache.get(cacheKey);
    if (cached) {
      setRasterSrc(cached);
      return;
    }

    let cancelled = false;
    setRasterSrc('');

    rasterizeSvgToOpaqueJpeg(svgDataUri, bgHex).then((jpegUrl) => {
      if (cancelled) return;
      if (jpegUrl.startsWith('data:image/jpeg')) {
        if (avatarRasterCache.size >= MAX_RASTER_CACHE) {
          const oldestKey = avatarRasterCache.keys().next().value;
          if (oldestKey !== undefined) avatarRasterCache.delete(oldestKey);
        }
        avatarRasterCache.set(cacheKey, jpegUrl);
      }
      setRasterSrc(jpegUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, svgDataUri, bgHex]);

  return (
    <div
      className={`avatar-photo-lock inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${className}`}
    >
      <img
        src={rasterSrc || svgDataUri}
        alt={alt}
        width="380"
        height="380"
        draggable={false}
        className="w-full h-full block object-cover select-none"
      />
    </div>
  );
}
