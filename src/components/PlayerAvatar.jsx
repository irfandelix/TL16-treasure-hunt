import React, { useMemo, useId } from 'react';
import {
  renderOpeepsSvg,
  generateSeedAvatarConfig,
  normalizeAvatarConfig
} from '../lib/avatarHelper';

/**
 * Crisp scalable Open Peeps avatar component backed by custom or seed config.
 */
export default function PlayerAvatar({ config, seed = '', className = 'w-12 h-12', alt = 'Karakter Pemain' }) {
  const reactId = useId();

  const svgMarkup = useMemo(() => {
    const resolved = config ? normalizeAvatarConfig(config) : generateSeedAvatarConfig(seed || reactId);
    return renderOpeepsSvg(resolved, `${reactId}_${seed || 'av'}`);
  }, [config, seed, reactId]);

  return (
    <div
      role="img"
      aria-label={alt}
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 [&_svg]:w-full [&_svg]:h-full [&_svg]:block ${className}`}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
