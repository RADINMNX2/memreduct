import type { Stats, Settings } from '../types';
import { clamp } from './format';

// Draws the tray icon exactly like the legacy Win32 version:
// a small bitmap with the integer percent, optional bg/border/round corners
// and level-based recoloring (bg change or text change).
export function drawTrayIcon(stats: Stats | null, s: Settings): string | null {
  const canvas = document.createElement('canvas');
  const scale = 2;
  const size = 16 * scale;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const percent = stats ? Math.round(stats.physical.percent) : 0;
  const useTransparency = s.bool.TrayUseTransparency;
  const showBorder = s.bool.TrayShowBorder;
  const roundCorners = s.bool.TrayRoundCorners;
  const changeBg = s.bool.TrayChangeBg;
  const warn = parseInt(s.TrayLevelWarning, 10) || 70;
  const danger = parseInt(s.TrayLevelDanger, 10) || 90;

  const level = percent >= danger ? 'danger' : percent >= warn ? 'warning' : 'normal';
  const levelColor = level === 'danger' ? s.TrayColorDanger : level === 'warning' ? s.TrayColorWarning : '';

  ctx.clearRect(0, 0, size, size);

  const inset = showBorder ? 0.5 * scale : 0;
  const drawBg = () => {
    const bg = changeBg && level !== 'normal' ? levelColor : s.TrayColorBg;
    ctx.fillStyle = bg;
    const x = inset;
    const y = inset;
    const w = size - inset * 2;
    const h = size - inset * 2;
    if (roundCorners) {
      const r = 3.5 * scale;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
    if (showBorder) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
    }
  };

  if (!useTransparency) drawBg();

  const textColor = !changeBg && level !== 'normal' ? levelColor : s.TrayColorText;
  ctx.fillStyle = textColor;
  ctx.font = `bold ${6.5 * scale}px "${s.TrayFont || 'Lucida Console'}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(percent), size / 2, size / 2 + 0.5 * scale);

  return canvas.toDataURL('image/png');
}

export function trayTooltipText(stats: Stats | null, labels: { physical: string; pagefile: string; cache: string }): string {
  if (!stats) return 'Mem Reduct';
  const fmt = (v?: number) => (v == null ? '--' : v.toFixed(2));
  return [
    `${labels.physical}: ${fmt(stats.physical?.percent)}%`,
    `${labels.pagefile}: ${fmt(stats.pagefile?.percent)}%`,
    `${labels.cache}: ${fmt(stats.cache?.percent)}%`,
  ].join('\n');
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function colorForLevel(stats: Stats | null, s: Settings | null): { level: 'normal' | 'warning' | 'danger'; css: string } {
  const p = stats?.physical?.percent ?? 0;
  const warn = parseInt(s?.TrayLevelWarning || '70', 10) || 70;
  const danger = parseInt(s?.TrayLevelDanger || '90', 10) || 90;
  if (p >= danger) return { level: 'danger', css: s?.TrayColorDanger || '' };
  if (p >= warn) return { level: 'warning', css: s?.TrayColorWarning || '' };
  return { level: 'normal', css: '' };
}

export function clampTo(v: number, min: number, max: number): number {
  return clamp(v, min, max);
}