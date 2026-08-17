import React, { useEffect, useRef, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, History as HistoryIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBytes } from '../utils/format';

const MAX_POINTS = 360;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ffffff';
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Statistics() {
  const { stats, t, history } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<number[]>([]);
  const [average, setAverage] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);

  useEffect(() => {
    if (!stats) return;
    const arr = pointsRef.current;
    arr.push(stats.physical.percent);
    if (arr.length > MAX_POINTS) arr.shift();
    setAverage(arr.reduce((a, b) => a + b, 0) / arr.length);
    setMin(Math.min(...arr));
    setMax(Math.max(...arr));
  }, [stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = withAlpha(cssVar('--text-faint'), 0.14);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const arr = pointsRef.current;
    if (arr.length < 2) {
      ctx.fillStyle = cssVar('--text-faint');
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('...', w / 2, h / 2);
      return;
    }

    const step = w / (MAX_POINTS - 1);
    const yFor = (v: number) => h - (Math.min(100, Math.max(0, v)) / 100) * (h - 12) - 6;

    // area gradient
    const accent = cssVar('--accent');
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, withAlpha(accent, 0.35));
    grad.addColorStop(1, withAlpha(accent, 0.02));
    ctx.beginPath();
    ctx.moveTo(0, h);
    arr.forEach((v, i) => ctx.lineTo(i * step, yFor(v)));
    ctx.lineTo((arr.length - 1) * step, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    arr.forEach((v, i) => {
      if (i === 0) ctx.moveTo(i * step, yFor(v));
      else ctx.lineTo(i * step, yFor(v));
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // live dot
    const last = arr[arr.length - 1];
    const lx = (arr.length - 1) * step;
    const ly = yFor(last);
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [stats]);

  const current = stats?.physical?.percent ?? 0;
  const lastRes = history[0];

  const kpis = [
    { label: t('statistics.current'), value: `${current.toFixed(1)}%`, icon: Activity, color: 'var(--accent)' },
    { label: t('statistics.average'), value: `${average.toFixed(1)}%`, icon: Minus, color: 'var(--cyan)' },
    { label: t('statistics.min'), value: `${min.toFixed(1)}%`, icon: TrendingDown, color: 'var(--green)' },
    { label: t('statistics.max'), value: `${max.toFixed(1)}%`, icon: TrendingUp, color: 'var(--amber)' },
  ];

  return (
    <div className="page-stagger h-full overflow-y-auto neon-scrollbar p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{t('statistics.title')}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-faint)' }}>{t('statistics.sampling')}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>{t('statistics.live')}</span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="card group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-[40px] transition-opacity group-hover:opacity-100" style={{ background: `color-mix(in srgb, ${k.color} 18%, transparent)` }} />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{k.label}</div>
                    <div className="mt-1.5 font-mono text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{k.value}</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${k.color} 12%, transparent)`, color: k.color }}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* chart */}
        <div className="card relative mb-6 overflow-hidden p-6">
          <div className="absolute -left-20 top-0 h-48 w-48 rounded-full blur-[80px]" style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)' }} />
          <div className="relative mb-4 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{t('statistics.physicalUsage')}</span>
            <span className="font-mono text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{current.toFixed(1)}%</span>
          </div>
          <div className="relative h-56 w-full">
            <canvas ref={canvasRef} className="h-full w-full" />
          </div>
        </div>

        {/* history */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <HistoryIcon size={16} style={{ color: 'var(--cyan)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{t('statistics.cleanupHistory')}</span>
          </div>
          {history.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm" style={{ color: 'var(--text-faint)' }}>{t('statistics.noHistory')}</div>
          ) : (
            <div className="max-h-72 overflow-y-auto neon-scrollbar">
              {history.map((h, i) => (
                <div
                  key={`${h.time}-${i}`}
                  className="flex items-center justify-between px-6 py-3.5 transition-colors"
                  style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
                    <div>
                      <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatBytes(h.freed)}
                      </div>
                      <div className="text-[11px] font-mono" style={{ color: 'var(--text-faint)' }}>
                        {new Date().toLocaleTimeString()} · {t(`clean.source${h.source.charAt(0).toUpperCase() + h.source.slice(1)}`)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-dim)' }}>{h.durationMs} ms</div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--text-faint)' }}>mask 0x{h.mask.toString(16).toUpperCase().padStart(2, '0')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}