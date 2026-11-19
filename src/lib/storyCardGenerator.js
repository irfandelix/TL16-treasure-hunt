import { supabase } from './supabaseClient';
import { isAdminSession } from './adminAuth';
import { renderAvatarCanvas } from './avatarCanvas';
import { getLocalAvatarConfig } from './avatarHelper';

const STORY_W = 1080;
const STORY_H = 1920;

let logoImagePromise = null;

function loadBrandLogo() {
  if (logoImagePromise) return logoImagePromise;
  logoImagePromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = '/Asset 2.webp';
  });
  return logoImagePromise;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(ctx, text, maxWidth) {
  const safe = String(text || '');
  if (ctx.measureText(safe).width <= maxWidth) return safe;
  let out = safe;
  while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
}

/**
 * Build the 3-row closest-competitors ladder (above, me, below) from a ranked list.
 * When revealNames is false, competitor names and rank numbers are redacted.
 */
export function buildNeighborsLadder(rankedList, currentNim, revealNames) {
  if (!Array.isArray(rankedList) || rankedList.length === 0 || !currentNim) {
    return { title: 'PERSAINGAN TERDEKAT', rows: [], myRank: null, totalCount: 0 };
  }

  const myIndex = rankedList.findIndex((item) => item.nim === currentNim);
  if (myIndex === -1) {
    return { title: 'PERSAINGAN TERDEKAT', rows: [], myRank: null, totalCount: rankedList.length };
  }

  const me = rankedList[myIndex];
  const myScore = Number(me.score || 0);
  const totalCount = rankedList.length;
  const isTop = myIndex === 0;
  const isLast = myIndex === totalCount - 1;

  let indices = [];
  if (totalCount <= 3) {
    indices = rankedList.map((_, idx) => idx);
  } else if (isTop) {
    indices = [0, 1, 2];
  } else if (isLast) {
    indices = [totalCount - 3, totalCount - 2, totalCount - 1];
  } else {
    indices = [myIndex - 1, myIndex, myIndex + 1];
  }

  const rows = indices.map((idx) => {
    const entry = rankedList[idx];
    const isMe = entry.nim === currentNim;
    const entryScore = Number(entry.score || 0);
    const diff = entryScore - myScore;
    let tag = 'POSISIMU';
    if (!isMe) {
      tag = idx < myIndex ? 'DI ATASMU' : 'DI BAWAHMU';
    } else if (isTop && revealNames) {
      tag = 'PUNCAK';
    }

    return {
      rankLabel: revealNames ? `#${idx + 1}` : '#??',
      tag,
      name: isMe ? entry.nama : (revealNames ? entry.nama : ''),
      redacted: !isMe && !revealNames,
      scoreText: String(entryScore),
      diffText: isMe ? 'KAMU' : (diff >= 0 ? `+${diff} poin` : `${diff} poin`),
      diffPositive: !isMe && diff > 0,
      isMe
    };
  });

  const title = !revealNames
    ? 'PERSAINGAN TERDEKAT (RAHASIA)'
    : isTop
      ? 'PENGEJAR TERDEKAT'
      : 'PERSAINGAN TERDEKAT';

  return { title, rows, myRank: myIndex + 1, totalCount };
}

/**
 * Fetch live neighbors for a solo quiz column (skor_muka or skor_peta) while
 * respecting show_scoreboard privacy settings.
 */
export async function fetchSoloQuizStoryContext(scoreColumn, currentNim, fallbackScore) {
  const myNama = localStorage.getItem('user_nama') || 'Alumni TL 2016';
  const myAvatar = getLocalAvatarConfig(currentNim);
  const admin = isAdminSession();

  try {
    const [{ data: settings }, { data: alumniData }] = await Promise.all([
      supabase.from('app_settings').select('show_scoreboard').eq('id', 1).single(),
      supabase.from('alumni').select('nim, nama, skor_peta, skor_muka')
    ]);

    const revealNames = admin || Boolean(settings?.show_scoreboard);
    if (!Array.isArray(alumniData) || alumniData.length === 0) {
      return {
        nama: myNama,
        avatarConfig: myAvatar,
        revealNames,
        neighborsTitle: '',
        neighbors: [],
        myRank: null,
        totalCount: 0
      };
    }

    const ranked = alumniData
      .map((person) => {
        const dbVal = Number(person[scoreColumn] || 0);
        const effectiveScore =
          person.nim === currentNim ? Math.max(dbVal, Number(fallbackScore || 0)) : dbVal;
        return {
          nim: person.nim,
          nama: person.nama,
          score: effectiveScore
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.nim.localeCompare(b.nim);
      });

    const ladder = buildNeighborsLadder(ranked, currentNim, revealNames);
    const meRecord = alumniData.find((p) => p.nim === currentNim);

    return {
      nama: meRecord?.nama || myNama,
      avatarConfig: myAvatar,
      revealNames,
      neighborsTitle: ladder.title,
      neighbors: ladder.rows,
      myRank: ladder.myRank,
      totalCount: ladder.totalCount
    };
  } catch {
    return {
      nama: myNama,
      avatarConfig: myAvatar,
      revealNames: admin,
      neighborsTitle: '',
      neighbors: [],
      myRank: null,
      totalCount: 0
    };
  }
}

/**
 * Generate a 1080x1920 PNG Blob matching the Warm Paper & Ink 1 Dekade aesthetic.
 */
export async function generateStoryCardBlob(options) {
  const {
    variant = 'ladder',
    badge = 'KLASEMEN SEDULUR 16',
    name = 'Alumni TL 2016',
    subtitle = '',
    nim = '',
    avatarConfig = null,
    rankText = '',
    redactedRank = false,
    accent = '#14532D',
    ringColor = '#14532D',
    scoreText = '0',
    scoreLabel = 'TOTAL POIN',
    breakdownLine = '',
    neighborsTitle = 'PERSAINGAN TERDEKAT',
    neighbors = [],
    sessionTitle = 'PESERTA SESI INI',
    sessionSubtitle = '',
    sessionPlayers = []
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas tidak tersedia di browser ini.');

  const logoImg = await loadBrandLogo();

  // Warm yearbook paper base + safe-zone header/footer bands
  ctx.fillStyle = '#F8F6F1';
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  ctx.fillStyle = '#F1ECE0';
  ctx.fillRect(0, 0, STORY_W, 200);
  ctx.fillRect(0, STORY_H - 205, STORY_W, 205);

  // Main editorial paper sheet inside Instagram safe area
  drawRoundedRect(ctx, 64, 224, STORY_W - 128, 1468, 44);
  ctx.fillStyle = '#FFFDF9';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#DED8CA';
  ctx.stroke();

  // Brand logo
  ctx.textAlign = 'center';
  if (logoImg) {
    const targetH = 104;
    const targetW = Math.min(360, (logoImg.width / Math.max(1, logoImg.height)) * targetH);
    ctx.drawImage(logoImg, (STORY_W - targetW) / 2, 260, targetW, targetH);
  } else {
    ctx.fillStyle = '#14532D';
    ctx.font = '800 32px system-ui, -apple-system, sans-serif';
    ctx.fillText('1 DEKADE TL 2016', STORY_W / 2, 326);
  }

  // Mode heading
  ctx.fillStyle = accent;
  ctx.font = '700 25px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(badge.toUpperCase(), STORY_W / 2, 412);

  // Sharer avatar drawn via Canvas2D Path2D
  const avX = STORY_W / 2;
  const avY = variant === 'session' ? 536 : 548;
  const avRadius = variant === 'session' ? 88 : 100;

  ctx.beginPath();
  ctx.arc(avX, avY, avRadius + 10, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFDF9';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = ringColor;
  ctx.stroke();

  const avatarOffscreen = renderAvatarCanvas(avatarConfig, nim || name, 256);
  if (avatarOffscreen) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX, avY, avRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarOffscreen, avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
    ctx.restore();
  }

  if (variant === 'session') {
    // Multiplayer session card layout
    ctx.fillStyle = '#18181B';
    ctx.font = '800 44px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillText(truncateText(ctx, name, STORY_W - 210), STORY_W / 2, 696);

    if (subtitle) {
      ctx.fillStyle = '#52525B';
      ctx.font = '600 25px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(truncateText(ctx, subtitle, STORY_W - 220), STORY_W / 2, 740);
    }

    // Highlighted session outcome box
    drawRoundedRect(ctx, 124, 774, STORY_W - 248, 124, 24);
    ctx.fillStyle = accent === '#B45309' ? '#FEF7E6' : '#ECFDF5';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = accent === '#B45309' ? '#D97706' : '#86EFAC';
    ctx.stroke();

    ctx.fillStyle = accent === '#B45309' ? '#92400E' : '#14532D';
    ctx.font = '800 40px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillText(truncateText(ctx, scoreText, STORY_W - 300), STORY_W / 2, 836);

    ctx.fillStyle = '#52525B';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.fillText(truncateText(ctx, scoreLabel || sessionSubtitle, STORY_W - 300), STORY_W / 2, 876);

    // Session roster list ("Yang Main di Sesi Ini")
    ctx.textAlign = 'left';
    ctx.fillStyle = '#52525B';
    ctx.font = '700 23px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(sessionTitle.toUpperCase(), 124, 954);

    const maxVisible = 7;
    const shown = sessionPlayers.slice(0, maxVisible);
    const extraCount = Math.max(0, sessionPlayers.length - maxVisible);
    const listStartY = 978;
    const availH = extraCount > 0 ? 604 : 656;
    const count = Math.max(1, shown.length);
    const rowGap = count > 5 ? 12 : 16;
    const rowH = Math.min(116, Math.floor((availH - rowGap * (count - 1)) / count));
    const rowX = 124;
    const rowW = STORY_W - 248;

    shown.forEach((p, idx) => {
      const y = listStartY + idx * (rowH + rowGap);
      drawRoundedRect(ctx, rowX, y, rowW, rowH, 20);
      ctx.fillStyle = p.isMe ? '#ECFDF5' : (idx === 0 ? '#FEF7E6' : '#F8F6F1');
      ctx.fill();
      ctx.lineWidth = p.isMe ? 3 : 2;
      ctx.strokeStyle = p.isMe ? '#14532D' : (idx === 0 ? '#D97706' : '#DED8CA');
      ctx.stroke();

      const badgeW = 78;
      const badgeH = Math.min(54, rowH - 22);
      const badgeY = y + (rowH - badgeH) / 2;
      drawRoundedRect(ctx, rowX + 18, badgeY, badgeW, badgeH, 12);
      ctx.fillStyle = p.isMe ? '#14532D' : (idx === 0 ? '#B45309' : '#F1ECE0');
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = (p.isMe || idx === 0) ? '#FFFFFF' : '#52525B';
      ctx.font = '700 24px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(p.rank || `#${idx + 1}`, rowX + 18 + badgeW / 2, badgeY + badgeH * 0.66);

      ctx.textAlign = 'left';
      const nameFontSize = rowH < 86 ? 25 : 29;
      ctx.fillStyle = '#18181B';
      ctx.font = `700 ${nameFontSize}px system-ui, sans-serif`;
      const nameLabel = p.isMe ? `${p.nama} (Kamu)` : p.nama;
      const nameY = p.meta ? y + rowH * 0.46 : y + rowH * 0.6;
      ctx.fillText(truncateText(ctx, nameLabel, rowW - 320), rowX + 114, nameY);

      if (p.meta) {
        ctx.fillStyle = '#52525B';
        ctx.font = '600 20px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(truncateText(ctx, p.meta, rowW - 320), rowX + 114, y + rowH * 0.78);
      }

      if (p.scoreText) {
        ctx.textAlign = 'right';
        ctx.fillStyle = p.isMe ? '#14532D' : '#18181B';
        ctx.font = `700 ${rowH < 86 ? 24 : 28}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillText(truncateText(ctx, p.scoreText, 200), rowX + rowW - 22, y + rowH * 0.58);
      }
    });

    if (extraCount > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#52525B';
      ctx.font = '600 23px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(`+ ${extraCount} peserta lain ikut bermain di sesi ini`, STORY_W / 2, 1648);
    }
  } else {
    // ScoreBoard & Solo Quiz card layout with "Di Atasmu & Di Bawahmu"
    ctx.fillStyle = '#18181B';
    ctx.font = '800 44px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillText(truncateText(ctx, name, STORY_W - 200), STORY_W / 2, 718);

    if (subtitle) {
      ctx.fillStyle = '#52525B';
      ctx.font = '600 26px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(truncateText(ctx, subtitle, STORY_W - 220), STORY_W / 2, 762);
    }

    // Rank pill or detective black redaction bar
    if (redactedRank) {
      drawRoundedRect(ctx, STORY_W / 2 - 205, 792, 410, 56, 14);
      ctx.fillStyle = '#F1ECE0';
      ctx.fill();
      ctx.strokeStyle = '#DED8CA';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#52525B';
      ctx.font = '700 24px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText('PERINGKAT', STORY_W / 2 - 84, 829);

      drawRoundedRect(ctx, STORY_W / 2 + 10, 806, 150, 28, 6);
      ctx.fillStyle = '#09090B';
      ctx.fill();
    } else if (rankText) {
      drawRoundedRect(ctx, STORY_W / 2 - 225, 792, 450, 56, 14);
      ctx.fillStyle = accent === '#B45309' ? '#FEF3C7' : '#DCFCE7';
      ctx.fill();
      ctx.strokeStyle = accent === '#B45309' ? '#D97706' : '#86EFAC';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = accent === '#B45309' ? '#92400E' : '#14532D';
      ctx.font = '700 25px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(truncateText(ctx, rankText, 410), STORY_W / 2, 829);
    }

    // Focal score number
    ctx.fillStyle = '#14532D';
    ctx.font = '800 132px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(String(scoreText), STORY_W / 2, 988);

    ctx.fillStyle = '#52525B';
    ctx.font = '700 25px system-ui, sans-serif';
    ctx.fillText(scoreLabel.toUpperCase(), STORY_W / 2, 1034);

    if (breakdownLine) {
      ctx.fillStyle = '#52525B';
      ctx.font = '700 25px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(truncateText(ctx, breakdownLine, STORY_W - 180), STORY_W / 2, 1090);
    }

    // Hairline divider
    ctx.beginPath();
    ctx.moveTo(124, 1136);
    ctx.lineTo(STORY_W - 124, 1136);
    ctx.strokeStyle = '#E5DFD2';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (neighbors.length > 0) {
      ctx.fillStyle = '#52525B';
      ctx.font = '700 23px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(neighborsTitle.toUpperCase(), 124, 1188);

      const rowX = 124;
      const rowW = STORY_W - 248;
      const rowH = 124;
      const rowGap = 20;
      const startY = 1218;

      neighbors.slice(0, 3).forEach((row, idx) => {
        const y = startY + idx * (rowH + rowGap);
        drawRoundedRect(ctx, rowX, y, rowW, rowH, 24);
        ctx.fillStyle = row.isMe ? '#ECFDF5' : '#F8F6F1';
        ctx.fill();
        ctx.lineWidth = row.isMe ? 3.5 : 2;
        ctx.strokeStyle = row.isMe ? '#14532D' : '#DED8CA';
        ctx.stroke();

        // Rank badge
        drawRoundedRect(ctx, rowX + 24, y + 32, 92, 60, 14);
        ctx.fillStyle = row.isMe ? '#14532D' : '#F1ECE0';
        ctx.fill();
        ctx.fillStyle = row.isMe ? '#FFFFFF' : '#B45309';
        ctx.font = '700 28px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(row.rankLabel, rowX + 70, y + 72);

        // Tag + name or detective black redaction bar
        ctx.textAlign = 'left';
        ctx.fillStyle = row.isMe ? '#14532D' : '#52525B';
        ctx.font = '700 20px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(row.tag, rowX + 138, y + 48);

        if (row.redacted) {
          drawRoundedRect(ctx, rowX + 138, y + 62, 310, 32, 6);
          ctx.fillStyle = '#09090B';
          ctx.fill();
        } else {
          ctx.fillStyle = '#18181B';
          ctx.font = '700 29px system-ui, sans-serif';
          ctx.fillText(truncateText(ctx, row.name, rowW - 350), rowX + 138, y + 89);
        }

        // Right score + gap
        ctx.textAlign = 'right';
        ctx.fillStyle = row.isMe ? '#14532D' : '#18181B';
        ctx.font = '800 38px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(row.scoreText, rowX + rowW - 28, y + 64);

        ctx.fillStyle = row.isMe ? '#14532D' : (row.diffPositive ? '#B45309' : '#52525B');
        ctx.font = '700 22px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(row.diffText, rowX + rowW - 28, y + 98);
      });
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#52525B';
      ctx.font = '600 28px system-ui, sans-serif';
      ctx.fillText('Ayo ajak teman seangkatan TL 2016 ikut bermain!', STORY_W / 2, 1360);
    }
  }

  // Footer stamp inside bottom safe area
  ctx.textAlign = 'center';
  ctx.fillStyle = '#18181B';
  ctx.font = '700 28px system-ui, sans-serif';
  ctx.fillText('1 DEKADE SEDULUR 16 (2016 - 2026)', STORY_W / 2, STORY_H - 115);
  ctx.fillStyle = '#52525B';
  ctx.font = '500 23px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText('Teknik Lingkungan UPN "Veteran" Yogyakarta', STORY_W / 2, STORY_H - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal membuat gambar PNG.'));
    }, 'image/png');
  });
}

function triggerPngDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Generate the 9:16 story card and share via Web Share API (mobile IG Story)
 * with automatic PNG download fallback for desktop or in-app browsers.
 */
export async function shareOrDownloadStoryCard(options) {
  const blob = await generateStoryCardBlob(options);
  const safeName = (options.filename || 'sedulur16-story.png').replace(/[^a-zA-Z0-9._-]/g, '-');
  const file = new File([blob], safeName, { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: options.shareTitle || '1 Dekade Sedulur 16 (TL 2016)',
        text: options.shareText || 'Skor kenangan 1 Dekade Teknik Lingkungan 2016!'
      });
      return { status: 'shared' };
    } catch (err) {
      if (err?.name === 'AbortError') {
        return { status: 'cancelled' };
      }
      // Fallback to download if WebView / browser rejects file share
    }
  }

  triggerPngDownload(blob, safeName);
  return { status: 'downloaded' };
}
