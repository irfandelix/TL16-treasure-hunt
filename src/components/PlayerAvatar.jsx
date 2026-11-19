import React, { useId, useRef, useEffect } from 'react';
import { renderAvatarCanvas } from '../lib/avatarCanvas';

const AVATAR_CANVAS_SIZE = 320;

/**
 * Open Peeps avatar painted synchronously via Canvas2D + Path2D so mobile
 * Force Dark engines cannot alter facial or hair ink.
 */
export default function PlayerAvatar({ config, seed = '', className = 'w-12 h-12', alt = 'Karakter Pemain' }) {
  const reactId = useId();
  const canvasRef = useRef(null);
  const configKey = config ? JSON.stringify(config) : '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const offscreen = renderAvatarCanvas(config, seed || reactId, AVATAR_CANVAS_SIZE);
    if (offscreen) {
      ctx.drawImage(offscreen, 0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
    }
  }, [configKey, seed, reactId]);

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
