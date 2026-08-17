export function formatBytes(bytes: number, precision = 2): string {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const p = i === 0 ? 0 : precision;
  return `${v.toFixed(p)} ${units[i]}`;
}

export function formatPct(v: number | undefined | null, digits = 1): string {
  if (v == null || isNaN(v)) return '--';
  return `${v.toFixed(digits)}%`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatTime(tsSeconds: number): string {
  if (!tsSeconds) return '';
  const d = new Date(tsSeconds * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function levelColor(percent: number, settings: {
  TrayLevelWarning: string;
  TrayLevelDanger: string;
  TrayColorWarning: string;
  TrayColorDanger: string;
}): { level: 'normal' | 'warning' | 'danger'; color: string } {
  const warn = parseInt(settings.TrayLevelWarning, 10) || 70;
  const danger = parseInt(settings.TrayLevelDanger, 10) || 90;
  if (percent >= danger) return { level: 'danger', color: settings.TrayColorDanger };
  if (percent >= warn) return { level: 'warning', color: settings.TrayColorWarning };
  return { level: 'normal', color: '' };
}