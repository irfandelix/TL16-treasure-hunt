import {
  renderOpeepsSvg,
  generateSeedAvatarConfig,
  normalizeAvatarConfig,
  shadeHex
} from './avatarHelper';

const DEFAULT_CANVAS_SIZE = 320;
const SVG_VIEWBOX_SIZE = 380;
const MAX_CANVAS_CACHE = 120;
const avatarCanvasCache = new Map();

function parseSvgTransform(transformStr) {
  const matrix = new DOMMatrix();
  if (!transformStr) return matrix;

  const regex = /(translate|rotate|scale)\s*\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(transformStr)) !== null) {
    const fn = match[1];
    const nums = match[2]
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    if (fn === 'translate' && nums.length >= 1) {
      matrix.translateSelf(nums[0], nums[1] || 0);
    } else if (fn === 'scale' && nums.length >= 1) {
      matrix.scaleSelf(nums[0], nums.length >= 2 ? nums[1] : nums[0]);
    } else if (fn === 'rotate' && nums.length >= 1) {
      const [deg, cx = 0, cy = 0] = nums;
      if (cx !== 0 || cy !== 0) {
        matrix.translateSelf(cx, cy);
        matrix.rotateSelf(deg);
        matrix.translateSelf(-cx, -cy);
      } else {
        matrix.rotateSelf(deg);
      }
    }
  }
  return matrix;
}

function buildElementPath(el) {
  const tag = el.tagName.toLowerCase();
  if (tag === 'path') {
    const d = el.getAttribute('d');
    return d ? new Path2D(d) : null;
  }
  const p = new Path2D();
  if (tag === 'circle') {
    const cx = parseFloat(el.getAttribute('cx') || '0');
    const cy = parseFloat(el.getAttribute('cy') || '0');
    const r = parseFloat(el.getAttribute('r') || '0');
    p.arc(cx, cy, r, 0, Math.PI * 2);
    return p;
  }
  if (tag === 'ellipse') {
    const cx = parseFloat(el.getAttribute('cx') || '0');
    const cy = parseFloat(el.getAttribute('cy') || '0');
    const rx = parseFloat(el.getAttribute('rx') || '0');
    const ry = parseFloat(el.getAttribute('ry') || '0');
    p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    return p;
  }
  if (tag === 'rect') {
    const x = parseFloat(el.getAttribute('x') || '0');
    const y = parseFloat(el.getAttribute('y') || '0');
    const w = parseFloat(el.getAttribute('width') || '0');
    const h = parseFloat(el.getAttribute('height') || '0');
    p.rect(x, y, w, h);
    return p;
  }
  return null;
}

function extractUrlRefId(val) {
  if (!val) return null;
  const match = val.match(/url\(#([^)]+)\)/);
  return match ? match[1] : null;
}

function applyClipFromDef(ctx, defEl) {
  if (!defEl) return;
  const combined = new Path2D();
  let hasShape = false;
  let clipRule = 'nonzero';

  for (const child of Array.from(defEl.children)) {
    const rawPath = buildElementPath(child);
    if (!rawPath) continue;
    const rule = child.getAttribute('clip-rule') || child.getAttribute('fill-rule');
    if (rule === 'evenodd') clipRule = 'evenodd';
    const childTransform = child.getAttribute('transform');
    if (childTransform) {
      combined.addPath(rawPath, parseSvgTransform(childTransform));
    } else {
      combined.addPath(rawPath);
    }
    hasShape = true;
  }

  if (hasShape) {
    ctx.clip(combined, clipRule);
  }
}

function drawSvgNode(ctx, el, defsMap, inheritedFill) {
  const tag = el.tagName.toLowerCase();
  if (tag === 'defs' || tag === 'mask' || tag === 'clippath') return;

  const style = (el.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase();
  if (style.includes('display:none')) return;

  ctx.save();

  const transformAttr = el.getAttribute('transform');
  if (transformAttr) {
    const m = parseSvgTransform(transformAttr);
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  const opacityAttr = el.getAttribute('opacity');
  if (opacityAttr !== null) {
    const op = parseFloat(opacityAttr);
    if (!Number.isNaN(op)) ctx.globalAlpha *= op;
  }

  if (style.includes('mix-blend-mode:multiply')) {
    ctx.globalCompositeOperation = 'multiply';
  }

  const clipId = extractUrlRefId(el.getAttribute('clip-path'));
  if (clipId) applyClipFromDef(ctx, defsMap.get(clipId));

  const maskId = extractUrlRefId(el.getAttribute('mask'));
  if (maskId) applyClipFromDef(ctx, defsMap.get(maskId));

  const ownFill = el.getAttribute('fill');
  const effectiveFill = ownFill !== null ? ownFill : inheritedFill;

  if (tag === 'g' || tag === 'svg') {
    for (const child of Array.from(el.children)) {
      drawSvgNode(ctx, child, defsMap, effectiveFill);
    }
  } else {
    const path = buildElementPath(el);
    if (path) {
      if (effectiveFill && effectiveFill !== 'none' && !effectiveFill.startsWith('url(')) {
        const fillRule = el.getAttribute('fill-rule') === 'evenodd' ? 'evenodd' : 'nonzero';
        ctx.fillStyle = effectiveFill;
        ctx.fill(path, fillRule);
      }

      const stroke = el.getAttribute('stroke');
      if (stroke && stroke !== 'none') {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = parseFloat(el.getAttribute('stroke-width') || '1');
        ctx.lineCap = el.getAttribute('stroke-linecap') || 'butt';
        ctx.lineJoin = el.getAttribute('stroke-linejoin') || 'miter';
        ctx.stroke(path);
      }
    }
  }

  ctx.restore();
}

/**
 * Render an Open Peeps avatar directly onto a cached 2D canvas via Path2D,
 * bypassing SVGImage so mobile Force Dark engines preserve exact colors.
 */
export function renderAvatarCanvas(config, seed = '', size = DEFAULT_CANVAS_SIZE) {
  const resolved = config ? normalizeAvatarConfig(config) : generateSeedAvatarConfig(seed || 'av');
  const cacheKey = `${size}:${JSON.stringify(resolved)}`;
  const existing = avatarCanvasCache.get(cacheKey);
  if (existing) return existing;

  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d', { alpha: false });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const bg = resolved.circleBg || '#D1FAE5';
  const grad = ctx.createRadialGradient(
    size * 0.42,
    size * 0.34,
    size * 0.06,
    size * 0.5,
    size * 0.5,
    size * 0.72
  );
  grad.addColorStop(0, shadeHex(bg, 6));
  grad.addColorStop(1, shadeHex(bg, -18));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  try {
    const svgMarkup = renderOpeepsSvg(resolved, `c_${seed || 'av'}`).trim();
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    const svgEl = doc.documentElement;
    if (svgEl && svgEl.tagName.toLowerCase() === 'svg') {
      const defsMap = new Map();
      for (const defNode of Array.from(svgEl.querySelectorAll('mask[id], clipPath[id]'))) {
        const id = defNode.getAttribute('id');
        if (id) defsMap.set(id, defNode);
      }

      ctx.save();
      const scale = size / SVG_VIEWBOX_SIZE;
      ctx.scale(scale, scale);

      for (const child of Array.from(svgEl.children)) {
        if (child.tagName.toLowerCase() === 'circle') continue;
        drawSvgNode(ctx, child, defsMap, svgEl.getAttribute('fill') || 'none');
      }
      ctx.restore();
    }
  } catch (err) {
    console.error('Gagal menggambar avatar pada canvas:', err);
  }

  if (avatarCanvasCache.size >= MAX_CANVAS_CACHE) {
    const oldestKey = avatarCanvasCache.keys().next().value;
    if (oldestKey !== undefined) avatarCanvasCache.delete(oldestKey);
  }
  avatarCanvasCache.set(cacheKey, offscreen);
  return offscreen;
}
