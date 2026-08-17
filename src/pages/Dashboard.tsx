import React, { useState } from 'react';
import { Zap, ChevronDown, ShieldAlert, ShieldCheck, Cpu, MemoryStick, FolderTree, Check, Snowflake, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { REGIONS } from '../constants';
import { formatBytes } from '../utils/format';
import { colorForLevel } from '../utils/trayIcon';

const SECTION_META = [
  { key: 'physical', icon: MemoryStick, color: 'var(--accent)' },
  { key: 'pagefile', icon: FolderTree, color: 'var(--cyan)' },
  { key: 'cache', icon: Cpu, color: 'var(--amber)' },
] as const;

function MemCard({ section, meta }: { section: 'physical' | 'pagefile' | 'cache'; meta: (typeof SECTION_META)[number] }) {
  const { stats, t } = useApp();
  const data = stats?.[section];
  const Icon = meta.icon;
  const percent = data?.percent ?? 0;
  const total = 'total' in (data ?? {}) ? (data as { total: number }).total : 0;
  const available = 'available' in (data ?? {}) ? (data as { available: number }).available : 0;
  const used = 'used' in (data ?? {}) ? (data as { used: number }).used : 0;
  const labelKey = section === 'physical' ? 'dashboard.physicalMemory' : section === 'pagefile' ? 'dashboard.pagefile' : 'dashboard.systemWorkingSet';

  return (
    <div className="card group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.015]" data-tour={section === 'physical' ? 'memcard' : undefined}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 blur-[50px] transition-opacity duration-500 group-hover:opacity-100" style={{ background: `color-mix(in srgb, ${meta.color} 15%, transparent)` }} />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color }}>
              <Icon size={17} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{t(labelKey)}</span>
          </div>
          <span className="font-mono text-lg font-black tabular-nums" style={{ color: meta.color, textShadow: `0 0 12px color-mix(in srgb, ${meta.color} 50%, transparent)` }}>
            {percent.toFixed(1)}%
          </span>
        </div>

        <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--text-faint) 20%, transparent)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, percent)}%`,
              background: `linear-gradient(90deg, ${meta.color}, color-mix(in srgb, ${meta.color} 60%, var(--accent-2)))`,
              boxShadow: `0 0 10px color-mix(in srgb, ${meta.color} 55%, transparent)`,
            }}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('dashboard.usage')}</div>
            <div className="mt-0.5 font-mono text-xs font-semibold tabular-nums" style={{ color: 'var(--text-dim)' }}>{formatBytes(used)}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('dashboard.available')}</div>
            <div className="mt-0.5 font-mono text-xs font-semibold tabular-nums" style={{ color: 'var(--text-dim)' }}>{formatBytes(available)}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('dashboard.totalAvailable')}</div>
            <div className="mt-0.5 font-mono text-xs font-semibold tabular-nums" style={{ color: 'var(--text-dim)' }}>{formatBytes(total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats, settings, t, runClean, cleaning, lastResult, setSetting, isRTL } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);

  if (!settings) return null;
  const pct = stats?.physical?.percent ?? 0;
  const mask = parseInt(settings.ReductMask2, 10) || 0xe7;
  const isAdmin = settings.isAdmin;
  const { css: levelCss, level } = colorForLevel(stats, settings);
  const ringColor = levelCss || 'var(--accent)';

  const radius = 62;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(1, pct / 100));

  const selectedRegions = REGIONS.filter((r) => (mask & r.bit) !== 0 && r.supported !== false);
  const autoText = settings.bool.AutoreductEnable
    ? `${t('dashboard.autoCleanAbove')} ${settings.num.AutoreductValue}%`
    : settings.bool.AutoreductIntervalEnable
      ? `${t('dashboard.autoCleanEvery')} ${settings.num.AutoreductIntervalValue} ${t('misc.minutes')}`
      : t('dashboard.autoCleanOff');
  const lastCleanTs = settings.num.StatisticLastReduct;

  return (
    <div className="page-stagger h-full overflow-y-auto neon-scrollbar p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{t('dashboard.overview')}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-faint)' }}>
              {t('dashboard.regionsHint')}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <span className={`font-mono text-xs font-bold uppercase tracking-wider ${settings.bool.AutoreductEnable || settings.bool.AutoreductIntervalEnable ? '' : 'opacity-50'}`} style={{ color: 'var(--green)' }}>
              {autoText}
            </span>
          </div>
        </div>

        {/* hero row */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* ring hero */}
          <div className="card relative overflow-hidden p-6 lg:col-span-7">
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full blur-[90px]" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }} />
            <div className="relative flex flex-col items-center gap-8 sm:flex-row">
              <div className="relative h-44 w-44 shrink-0">
                <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
                  <defs>
                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--accent-2)" />
                    </linearGradient>
                  </defs>
                  <circle cx="88" cy="88" r={radius} fill="none" stroke="color-mix(in srgb, var(--text-faint) 18%, transparent)" strokeWidth="10" />
                  <circle
                    className="ring-animate"
                    cx="88" cy="88" r={radius} fill="none"
                    stroke="url(#ring-grad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ filter: `drop-shadow(0 0 8px ${ringColor})`, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1), stroke 0.4s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-4xl font-black tabular-nums" style={{ color: 'var(--text)', textShadow: `0 0 20px color-mix(in srgb, ${ringColor} 60%, transparent)` }}>
                    {pct.toFixed(1)}
                    <span className="text-xl" style={{ color: ringColor }}>%</span>
                  </span>
                  <span className="mt-1 text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{t('dashboard.usage')}</span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('dashboard.available')}</div>
                    <div className="mt-1 font-mono text-lg font-bold tabular-nums" style={{ color: 'var(--green)' }}>{formatBytes(stats?.physical?.available ?? 0)}</div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('dashboard.totalAvailable')}</div>
                    <div className="mt-1 font-mono text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>{formatBytes(stats?.physical?.total ?? 0)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  {isAdmin ? <ShieldCheck size={16} style={{ color: 'var(--green)' }} /> : <ShieldAlert size={16} style={{ color: 'var(--amber)' }} />}
                  <span className="text-xs font-medium" style={{ color: isAdmin ? 'var(--green)' : 'var(--amber)' }}>
                    {isAdmin ? 'Administrator' : `${t('dashboard.adminRequired')} — ${t('dashboard.relaunching')}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* clean panel */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="card relative overflow-hidden p-6">
              <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full blur-[70px]" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }} />
              <div className="relative">
                <div className="mb-4 text-sm font-bold" style={{ color: 'var(--text)' }}>{t('dashboard.cleanMemory')}</div>

                {/* split button */}
                <div className="relative" data-tour="clean">
                  <div className="flex overflow-hidden rounded-2xl" style={{ border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)', boxShadow: cleaning ? '0 0 30px var(--accent-glow)' : '0 0 18px color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                    <button
                      onClick={() => void runClean(mask, { confirm: true })}
                      disabled={cleaning}
                      className="flex flex-1 items-center justify-center gap-2.5 px-6 py-4 text-base font-black tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                        backgroundSize: '200% 200%',
                        animation: cleaning ? 'gradient-x 1.2s ease infinite' : undefined,
                      }}
                    >
                      <Zap size={20} className={cleaning ? 'animate-spin' : ''} />
                      {cleaning ? t('dashboard.cleanNow') : t('dashboard.cleanMemory')}
                      {!isAdmin && <ShieldAlert size={15} />}
                    </button>
                    <button
                      onClick={() => { setRegionMenuOpen(!regionMenuOpen); setMenuOpen(false); }}
                      className="flex w-14 items-center justify-center text-white transition-all hover:brightness-110 active:scale-95"
                      style={{ background: 'linear-gradient(90deg, var(--accent-2), var(--secondary, #be123c))' }}
                    >
                      <ChevronDown size={18} className={`transition-transform duration-300 ${regionMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {regionMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setRegionMenuOpen(false)} />
                      <div
                        className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl animate-scale-in"
                        style={{ background: 'var(--card-solid)', border: '1px solid var(--border-strong)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
                      >
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{t('dashboard.cleanAreas')}</span>
                          <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{selectedRegions.length}/8</span>
                        </div>
                        <div className="border-t pb-1" style={{ borderColor: 'var(--border)' }}>
                          {REGIONS.map((r) => {
                            const on = (mask & r.bit) !== 0;
                            const supported = r.supported !== false;
                            return (
                              <button
                                key={r.key}
                                disabled={!supported}
                                onClick={() => {
                                  const newMask = on ? mask & ~r.bit : mask | r.bit;
                                  setSetting('ReductMask2', String(newMask));
                                  setRegionMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${supported ? 'hover:opacity-80' : 'opacity-35'}`}
                                style={{ color: 'var(--text)' }}
                              >
                                <span
                                  className="flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded-md transition-all"
                                  style={{
                                    background: on ? 'var(--accent)' : 'transparent',
                                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                                    boxShadow: on ? '0 0 8px var(--accent-glow)' : undefined,
                                  }}
                                >
                                  {on && <Check size={12} className="text-white" />}
                                </span>
                                <span className="flex-1 text-left" dir={isRTL ? 'rtl' : 'ltr'}>{t(`regions.${r.key}`)}</span>
                                {r.freeze && <Snowflake size={12} style={{ color: 'var(--cyan)' }} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* last result */}
                <div className="mt-5 rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('dashboard.lastClean')}</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        {lastResult
                          ? `${formatBytes(lastResult.freed)} · ${lastResult.durationMs} ms`
                          : lastCleanTs
                            ? new Date(lastCleanTs * 1000).toLocaleString()
                            : t('dashboard.never')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('dashboard.freed')}</div>
                      <div className="mt-0.5 font-mono text-lg font-black tabular-nums" style={{ color: 'var(--green)', textShadow: '0 0 12px rgba(16,185,129,0.5)' }}>
                        {lastResult ? formatBytes(lastResult.freed) : '0 B'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* auto-clean mini card */}
            <div className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--green) 12%, transparent)', color: 'var(--green)' }}>
                  <RotateCcw size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{t('dashboard.autoClean')}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{autoText}</div>
                </div>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${settings.bool.AutoreductEnable || settings.bool.AutoreductIntervalEnable ? 'animate-pulse' : ''}`} style={{ background: settings.bool.AutoreductEnable || settings.bool.AutoreductIntervalEnable ? 'var(--green)' : 'var(--text-faint)', boxShadow: settings.bool.AutoreductEnable || settings.bool.AutoreductIntervalEnable ? '0 0 10px var(--green)' : 'none' }} />
            </div>
          </div>
        </div>

        {/* memory sections */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SECTION_META.map((meta) => (
            <MemCard key={meta.key} section={meta.key} meta={meta} />
          ))}
        </div>
      </div>
    </div>
  );
}