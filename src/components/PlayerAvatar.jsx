import React, { useMemo, useId } from 'react';
import {
  renderOpeepsSvg,
  generateSeedAvatarConfig,
  normalizeAvatarConfig
} from '../lib/avatarHelper';

/**
 * Crisp scalable Open Peeps avatar component rendered as an SVG data image
 * so mobile Force Dark / Auto Dark Mode cannot invert facial stroke colors.
 */
export default function PlayerAvatar({ config, seed = '', className = 'w-12 h-12', alt = 'Karakter Pemain' }) {
  const reactId = useId();

  const svgDataUri = useMemo(() => {
    const resolved = config ? normalizeAvatarConfig(config) : generateSeedAvatarConfig(seed || reactId);
    const svgMarkup = renderOpeepsSvg(resolved, `${reactId}_${seed || 'av'}`).trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  }, [config, seed, reactId]);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${className}`}
    >
      <img
        src={svgDataUri}
        alt={alt}
        width="380"
        height="380"
        draggable={false}
        className="w-full h-full block object-cover select-none"
      />
    </div>
  );
}
