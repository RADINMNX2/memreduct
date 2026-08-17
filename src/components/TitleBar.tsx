import React, { useEffect, useState } from 'react';
import { LayoutDashboard, BarChart3, Settings as SettingsIcon, Minus, Square, Copy, X, Zap, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Page } from '../types';

export default function TitleBar() {
  const { page, setPage, stats, t, isRTL } = useApp();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.memReduct.getWindowState().then((s) => setMaximized(s.maximized));
  }, []);

const tabs: { id: Page; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} />, color: 'var(--accent)' },
  { id: 'statistics', label: t('nav.statistics'), icon: <BarChart3 size={18} />, color: 'var(--cyan)' },
  { id: 'settings', label: t('nav.settings'), icon: <SettingsIcon size={18} />, color: 'var(--amber)' },
];

const dragRegion = { WebkitAppRegion: 'drag' } as unknown as React.CSSProperties;
const noDrag = { WebkitAppRegion: 'no-drag' } as unknown as React.CSSProperties;

  const pct = stats?.physical?.percent ?? 0;

  return (
    <div
      className="relative z-[100] flex h-16 w-full items-center px-6"
      style={{
        background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
        backdropFilter: 'blur(20px)',
        ...dragRegion,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* left: brand + status */}
      <div className="flex w-1/3 items-center gap-4">
        <div className="flex items-center gap-3" data-tour="logo" style={dragRegion}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 0 16px var(--accent-glow)' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest">
              <span className="neon-text">Mem</span> <span style={{ color: 'var(--text)' }}>Reduct</span>
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              {t('tagline')}
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1"
          style={{ background: 'color-mix(in srgb, var(--surface) 60%, transparent)', border: '1px solid var(--border)', borderLeft: '2px solid var(--green)' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: 'var(--green)' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--green)' }} />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            {t('systemOnline')}
          </span>
        </div>
      </div>

      {/* center: tabs */}
      <div
        className="flex flex-1 items-center justify-center"
        style={noDrag}
      >
        <div
          className="flex gap-2 rounded-2xl p-2"
          style={{ background: 'color-mix(in srgb, var(--surface) 80%, transparent)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
        >
          {tabs.map((tab) => {
            const active = page === tab.id;
            return (
              <button
                key={tab.id}
                data-tour={tab.id === 'statistics' ? 'stats' : tab.id === 'settings' ? 'settings' : undefined}
                onClick={() => setPage(tab.id)}
                className={`relative flex items-center gap-2 rounded-xl px-6 py-2 transition-all duration-300 ${active ? 'tab-active' : 'hover:opacity-80'}`}
                style={{
                  background: active ? 'color-mix(in srgb, var(--surface) 100%, transparent)' : 'transparent',
                  border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                  color: active ? 'var(--text)' : 'var(--text-dim)',
                }}
              >
                <span style={{ color: active ? tab.color : undefined, transform: active ? 'scale(1.1)' : undefined, transition: 'transform 0.3s' }}>
                  {tab.icon}
                </span>
                <span className="text-sm font-bold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* right: window controls */}
      <div className="flex w-1/3 items-center justify-end gap-2" style={noDrag}>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest"
          style={{ background: 'color-mix(in srgb, var(--surface) 60%, transparent)', border: '1px solid var(--border)', color: pct >= 90 ? 'var(--accent)' : pct >= 70 ? 'var(--amber)' : 'var(--text-dim)' }}
        >
          <Activity size={12} />
          {t('ramPill')} {pct.toFixed(1)}%
        </div>
        {[
          { icon: <Minus size={16} />, action: () => window.memReduct.minimize(), hover: 'rgba(245,158,11,0.12)', hoverIcon: '#f59e0b', label: t('titlebar.minimize') },
          { icon: maximized ? <Copy size={14} /> : <Square size={14} />, action: () => window.memReduct.maximizeToggle(), hover: 'rgba(16,185,129,0.12)', hoverIcon: '#10b981', label: t('titlebar.maximize') },
        ].map((btn, i) => (
          <button
            key={i}
            title={btn.label}
            onClick={btn.action}
            className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 hover:-rotate-6 active:scale-90"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = btn.hover; e.currentTarget.style.color = btn.hoverIcon; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; }}
          >
            {btn.icon}
          </button>
        ))}
        <button
          title={t('titlebar.close')}
          onClick={() => window.memReduct.close()}
          className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 hover:rotate-90 hover:scale-110 active:scale-75 active:rotate-180"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}