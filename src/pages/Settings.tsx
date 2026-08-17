import React, { useEffect, useRef, useState } from 'react';
import {
  Settings as SettingsIcon, MemoryStick, Palette, PanelTop, SlidersHorizontal,
  Snowflake, Check, Languages, Sun, Moon, RotateCcw, AlertTriangle, Type,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { REGIONS, FONTS, THEMES, TRAY_ACTIONS, UPDATE_PERIODS } from '../constants';
import { CheckboxRow, SettingRow, Select, NumberField, HotkeyInput, ColorField, Toggle } from '../components/controls';
import Modal from '../components/Modal';
import { drawTrayIcon } from '../utils/trayIcon';
import { LANGS } from '../utils/translations';

const PAGES = [
  { id: 'general', icon: SettingsIcon, color: 'var(--accent)' },
  { id: 'memory', icon: MemoryStick, color: 'var(--green)' },
  { id: 'appearance', icon: Palette, color: 'var(--pink, #ec4899)' },
  { id: 'tray', icon: PanelTop, color: 'var(--cyan)' },
  { id: 'advanced', icon: SlidersHorizontal, color: 'var(--amber)' },
] as const;

type PageId = (typeof PAGES)[number]['id'];

export default function Settings() {
  const { t, settings, setSetting, setBool, setNum, resetSettings, isRTL } = useApp();
  const [page, setPage] = useState<PageId>(PAGES[settings?.num.SettingsLastPage ?? 0]?.id ?? 'general');
  const [resetOpen, setResetOpen] = useState(false);

  if (!settings) return null;

  return (
    <div className="page-stagger h-full overflow-y-auto neon-scrollbar p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{t('settings.title')}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-faint)' }}>memreduct.ini</p>
          </div>
          <button
            onClick={() => setResetOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            style={{ background: 'color-mix(in srgb, var(--amber) 10%, transparent)', color: 'var(--amber)', border: '1px solid color-mix(in srgb, var(--amber) 30%, transparent)' }}
          >
            <RotateCcw size={15} />
            {t('settings.reset')}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* nav */}
          <div className="lg:col-span-3">
            <div
              className="flex gap-2 overflow-x-auto rounded-2xl p-2 lg:flex-col scrollbar-none"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}
            >
              {PAGES.map((p) => {
                const Icon = p.icon;
                const active = page === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPage(p.id);
                      setSetting('SettingsLastPage', String(PAGES.findIndex((x) => x.id === p.id)));
                    }}
                    className={`relative flex min-w-[140px] items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 lg:min-w-0 ${active ? 'tab-active' : 'hover:opacity-80'}`}
                    style={{
                      background: active ? 'color-mix(in srgb, var(--surface) 90%, transparent)' : 'transparent',
                      border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                      color: active ? 'var(--text)' : 'var(--text-dim)',
                    }}
                  >
                    <span style={{ color: active ? p.color : undefined }}><Icon size={17} /></span>
                    <span className="text-sm font-bold">{t(`settings.${p.id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* content */}
          <div className="lg:col-span-9">
            {page === 'general' && <GeneralPage />}
            {page === 'memory' && <MemoryPage />}
            {page === 'appearance' && <AppearancePage />}
            {page === 'tray' && <TrayPage />}
            {page === 'advanced' && <AdvancedPage />}
          </div>
        </div>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={t('dialogs.resetTitle')} icon={<AlertTriangle size={20} />} accent="var(--amber)">
        <p className="mb-6 text-sm" style={{ color: 'var(--text-dim)' }}>{t('dialogs.resetText')}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setResetOpen(false)}
            className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80 active:scale-95"
            style={{ color: 'var(--text-dim)', background: 'color-mix(in srgb, var(--surface) 60%, transparent)', border: '1px solid var(--border)' }}
          >
            {t('confirm.no')}
          </button>
          <button
            onClick={() => {
              resetSettings();
              setResetOpen(false);
              setPage('general');
            }}
            className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95"
            style={{ background: 'linear-gradient(90deg, var(--amber), #f97316)', boxShadow: '0 0 20px rgba(245,158,11,0.5)' }}
          >
            {t('confirm.yes')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, icon, color, children }: { title: string; icon?: React.ReactNode; color?: string; children: React.ReactNode }) {
  return (
    <div className="card relative mb-6 overflow-hidden p-6" style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)', backdropFilter: 'blur(14px)' }}>
      {color && <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full blur-[60px]" style={{ background: `color-mix(in srgb, ${color} 9%, transparent)` }} />}
      <div className="relative mb-4 flex items-center gap-3">
        {icon && <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color || 'var(--accent)'} 12%, transparent)`, color: color || 'var(--accent)' }}>{icon}</div>}
        <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>{title}</span>
      </div>
      <div className="relative space-y-1">{children}</div>
    </div>
  );
}

// ==================== General ====================
function GeneralPage() {
  const { t, settings, setBool, setSetting } = useApp();
  const [autorun, setAutorun] = useState<boolean | null>(null);
  const [skipUac, setSkipUac] = useState<boolean | null>(null);
  const isAdmin = settings?.isAdmin;

  useEffect(() => {
    window.memReduct.getAutorun().then(setAutorun);
    window.memReduct.getSkipUac().then(setSkipUac);
  }, []);

  if (!settings) return null;

  return (
    <div className="animate-slide-up">
      <Section title={t('settings.generalConfig')} icon={<SettingsIcon size={16} />} color="var(--accent)">
        <CheckboxRow label={t('settings.alwaysOnTop')} checked={settings.bool.AlwaysOnTop} onChange={(v) => setBool('AlwaysOnTop', v)} />
        <CheckboxRow label={t('settings.loadOnStartup')} checked={autorun ?? false} onChange={(v) => { setAutorun(v); window.memReduct.setAutorun(v); }} />
        <CheckboxRow label={t('settings.startMinimized')} checked={settings.bool.IsStartMinimized} onChange={(v) => setBool('IsStartMinimized', v)} />
        <CheckboxRow label={t('settings.confirmReduct')} checked={settings.bool.IsShowReductConfirmation} onChange={(v) => setBool('IsShowReductConfirmation', v)} />
        <CheckboxRow
          label={t('settings.skipUac')}
          checked={skipUac ?? false}
          disabled={!isAdmin}
          onChange={(v) => { setSkipUac(v); window.memReduct.setSkipUac(v); }}
        />
        <CheckboxRow
          label={t('settings.checkUpdates')}
          checked={settings.num.CheckUpdatesPeriod > 0}
          onChange={(v) => setSetting('CheckUpdatesPeriod', v ? '6' : '0')}
        />
      </Section>

      <Section title={t('settings.language')} icon={<Languages size={16} />} color="var(--cyan)">
        <SettingRow label={t('settings.language')}>
          <Select
            value={settings.Language}
            options={LANGS.map((l) => ({ value: l.id, label: l.label }))}
            onChange={(v) => setSetting('Language', String(v))}
          />
        </SettingRow>
      </Section>

      <Section title={t('settings.theme')} icon={settings.Theme === 'frost' ? <Sun size={16} /> : <Moon size={16} />} color="var(--amber)">
        <div className="grid grid-cols-2 gap-4 py-2">
          {THEMES.map((th) => {
            const active = settings.Theme === th.id;
            const isFrost = th.id === 'frost';
            return (
              <button
                key={th.id}
                onClick={() => setSetting('Theme', th.id)}
                className="relative flex items-center justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                style={{
                  background: isFrost ? 'linear-gradient(135deg, #e8f1fa, #ffffff)' : 'linear-gradient(135deg, #0a0a0a, #18181b)',
                  border: `2px solid ${active ? (isFrost ? '#0ea5e9' : 'var(--accent)') : 'var(--border)'}`,
                  boxShadow: active ? `0 0 24px ${isFrost ? 'rgba(14,165,233,0.4)' : 'var(--accent-glow)'}` : 'none',
                }}
              >
                <span className="text-left">
                  <span className="block text-sm font-black" style={{ color: isFrost ? '#0f172a' : '#fff' }}>{t(`theme${th.id === 'neon' ? 'Neon' : 'Frost'}`)}</span>
                  <span className="mt-0.5 block text-[10px] font-mono uppercase tracking-wider" style={{ color: isFrost ? '#64748b' : '#71717a' }}>
                    {th.id}
                  </span>
                </span>
                {active && <Check size={18} style={{ color: isFrost ? '#0ea5e9' : 'var(--accent)' }} />}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ==================== Memory ====================
function MemoryPage() {
  const { t, settings, setBool, setNum, setSetting, setFreezeWarning } = useApp();
  if (!settings) return null;
  const isAdmin = settings.isAdmin;
  const mask = settings.num.ReductMask2;

  const toggleRegion = (bit: number, currentlyOn: boolean) => {
    const newMask = currentlyOn ? mask & ~bit : mask | bit;
    setSetting('ReductMask2', String(newMask));
  };

  return (
    <div className="animate-slide-up">
      <Section title={t('settings.memoryRegions')} icon={<MemoryStick size={16} />} color="var(--green)">
        <div className="flex flex-col gap-1.5 py-2">
          {REGIONS.map((r) => {
            const on = (mask & r.bit) !== 0;
            const supported = r.supported !== false;
            const disabled = !isAdmin || !supported;
            return (
              <button
                key={r.key}
                disabled={disabled}
                onClick={() => {
                  if (r.freeze && !on) {
                    if (settings.bool.IsShowWarningConfirmation) {
                      setFreezeWarning({ key: r.key, freeze: true, onAllow: () => toggleRegion(r.bit, on) });
                    } else {
                      toggleRegion(r.bit, on);
                    }
                    return;
                  }
                  toggleRegion(r.bit, on);
                }}
                className="group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: on ? 'color-mix(in srgb, var(--green) 8%, transparent)' : 'transparent',
                  border: `1px solid ${on ? 'color-mix(in srgb, var(--green) 30%, transparent)' : 'var(--border)'}`,
                  opacity: disabled ? 0.35 : 1,
                }}
              >
                <span
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-md transition-all"
                  style={{
                    background: on ? 'var(--green)' : 'transparent',
                    border: `1px solid ${on ? 'var(--green)' : 'var(--border-strong)'}`,
                    boxShadow: on ? '0 0 8px rgba(16,185,129,0.6)' : undefined,
                  }}
                >
                  {on && <Check size={12} className="text-white" />}
                </span>
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{t(`regions.${r.key}`)}</span>
                {r.freeze && <Snowflake size={13} style={{ color: 'var(--cyan)' }} />}
                {r.minVer && <span className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase" style={{ background: 'var(--card)', color: 'var(--text-faint)' }}>{r.minVer}+</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>{t('settings.freezeHint')}</p>
      </Section>

      <Section title={t('settings.memoryManagement')} icon={<SlidersHorizontal size={16} />} color="var(--accent)">
        <div className={isAdmin ? '' : 'pointer-events-none opacity-40'}>
          <SettingRow label={t('settings.cleanWhenAbove')}>
            <div className="flex items-center gap-3">
              <Toggle on={settings.bool.AutoreductEnable} onChange={(v) => setBool('AutoreductEnable', v)} disabled={!isAdmin} />
              <NumberField value={settings.num.AutoreductValue} onChange={(v) => setNum('AutoreductValue', v)} min={0} max={100} disabled={!settings.bool.AutoreductEnable} />
            </div>
          </SettingRow>
          <SettingRow label={t('settings.cleanEvery')}>
            <div className="flex items-center gap-3">
              <Toggle on={settings.bool.AutoreductIntervalEnable} onChange={(v) => setBool('AutoreductIntervalEnable', v)} disabled={!isAdmin} />
              <NumberField value={settings.num.AutoreductIntervalValue} onChange={(v) => setNum('AutoreductIntervalValue', v)} min={1} max={1440} disabled={!settings.bool.AutoreductIntervalEnable} />
            </div>
          </SettingRow>
        </div>
      </Section>

      <Section title={t('settings.hotkeys')} icon={<Type size={16} />} color="var(--cyan)">
        <div className={isAdmin ? '' : 'pointer-events-none opacity-40'}>
          <SettingRow label={t('settings.cleanHotkey')}>
            <div className="flex items-center gap-3">
              <Toggle on={settings.bool.HotkeyCleanEnable} onChange={(v) => setBool('HotkeyCleanEnable', v)} disabled={!isAdmin} />
              <HotkeyInput value={settings.HotkeyClean} onChange={(v) => setSetting('HotkeyClean', v)} disabled={!settings.bool.HotkeyCleanEnable} />
            </div>
          </SettingRow>
        </div>
      </Section>
    </div>
  );
}

// ==================== Appearance ====================
function AppearancePage() {
  const { t, settings, setBool, setSetting } = useApp();
  if (!settings) return null;

  return (
    <div className="animate-slide-up">
      <Section title={t('settings.style')} icon={<Palette size={16} />} color="#ec4899">
        <CheckboxRow label={t('settings.trayTransparency')} checked={settings.bool.TrayUseTransparency} onChange={(v) => setBool('TrayUseTransparency', v)} />
        <CheckboxRow label={t('settings.trayBorder')} checked={settings.bool.TrayShowBorder} onChange={(v) => setBool('TrayShowBorder', v)} />
        <CheckboxRow label={t('settings.trayCorners')} checked={settings.bool.TrayRoundCorners} onChange={(v) => setBool('TrayRoundCorners', v)} />
        <CheckboxRow label={t('settings.trayChangeBg')} checked={settings.bool.TrayChangeBg} onChange={(v) => setBool('TrayChangeBg', v)} />
        <CheckboxRow label={t('settings.trayAntialiasing')} checked={settings.bool.TrayUseAntialiasing} onChange={(v) => setBool('TrayUseAntialiasing', v)} />
      </Section>

      <Section title={t('settings.font')} icon={<Type size={16} />} color="var(--cyan)">
        <SettingRow label={t('settings.font')}>
          <Select
            value={settings.TrayFont}
            options={FONTS.map((f) => ({ value: f, label: f }))}
            onChange={(v) => setSetting('TrayFont', String(v))}
          />
        </SettingRow>
      </Section>

      <Section title={t('settings.colors')} icon={<Palette size={16} />} color="var(--accent)">
        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{t('settings.colorText')}</span>
            <ColorField label={t('settings.colorText')} value={settings.TrayColorText} onChange={(v) => setSetting('TrayColorText', v)} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{t('settings.colorBg')}</span>
            <ColorField label={t('settings.colorBg')} value={settings.TrayColorBg} onChange={(v) => setSetting('TrayColorBg', v)} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{t('settings.colorWarning')}</span>
            <ColorField label={t('settings.colorWarning')} value={settings.TrayColorWarning} onChange={(v) => setSetting('TrayColorWarning', v)} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{t('settings.colorDanger')}</span>
            <ColorField label={t('settings.colorDanger')} value={settings.TrayColorDanger} onChange={(v) => setSetting('TrayColorDanger', v)} />
          </div>
        </div>
      </Section>
    </div>
  );
}

// ==================== Tray ====================
function TrayPage() {
  const { t, settings, setBool, setNum, setSetting } = useApp();
  const [preview, setPreview] = useState<string | null>(null);
  const [pct, setPct] = useState(43);

  useEffect(() => {
    if (!settings) return;
    const fakeStats = {
      time: Date.now(),
      physical: { total: 0, available: 0, used: 0, percent: pct },
      pagefile: { total: 0, available: 0, used: 0, percent: 25 },
      cache: { used: 0, percent: 30 },
    };
    setPreview(drawTrayIcon(fakeStats, settings));
  }, [settings, pct]);

  if (!settings) return null;

  return (
    <div className="animate-slide-up">
      <Section title={t('settings.trayPreview')} icon={<PanelTop size={16} />} color="var(--cyan)">
        <div className="flex items-center gap-6 py-2">
          {preview && (
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <img src={preview} alt="tray preview" className="h-16 w-16" style={{ imageRendering: 'pixelated' }} />
            </div>
          )}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>%</span>
            <input type="range" className="mr-slider w-44" min={0} max={100} value={pct} onChange={(e) => setPct(parseInt(e.target.value, 10))} />
          </div>
        </div>
      </Section>

      <Section title={t('settings.colorIndication')} icon={<Palette size={16} />} color="var(--amber)">
        <SettingRow label={t('settings.warningLevel')}>
          <NumberField value={settings.num.TrayLevelWarning} onChange={(v) => setNum('TrayLevelWarning', v)} min={0} max={100} />
        </SettingRow>
        <SettingRow label={t('settings.dangerLevel')}>
          <NumberField value={settings.num.TrayLevelDanger} onChange={(v) => setNum('TrayLevelDanger', v)} min={0} max={100} />
        </SettingRow>
      </Section>

      <Section title={t('settings.mouseControl')} icon={<PanelTop size={16} />} color="var(--green)">
        <SettingRow label={t('settings.singleClick')}>
          <Select
            value={settings.num.TrayActionDc}
            options={TRAY_ACTIONS.map((a) => ({ value: a.value, label: t(a.label) }))}
            onChange={(v) => setNum('TrayActionDc', Number(v))}
          />
        </SettingRow>
        <SettingRow label={t('settings.middleClick')}>
          <Select
            value={settings.num.TrayActionMc}
            options={TRAY_ACTIONS.map((a) => ({ value: a.value, label: t(a.label) }))}
            onChange={(v) => setNum('TrayActionMc', Number(v))}
          />
        </SettingRow>
      </Section>

      <Section title={t('settings.balloonTips')} icon={<PanelTop size={16} />} color="#ec4899">
        <CheckboxRow label={t('settings.showCleanResult')} checked={settings.bool.BalloonCleanResults} onChange={(v) => setBool('BalloonCleanResults', v)} />
        <CheckboxRow label={t('settings.notificationSound')} checked={settings.bool.IsNotificationsSound} onChange={(v) => setBool('IsNotificationsSound', v)} />
      </Section>
    </div>
  );
}

// ==================== Advanced ====================
function AdvancedPage() {
  const { t, settings, setBool } = useApp();
  if (!settings) return null;

  return (
    <div className="animate-slide-up">
      <Section title={t('settings.advanced')} icon={<SlidersHorizontal size={16} />} color="var(--amber)">
        <CheckboxRow
          label={t('settings.allowStandbyCleanup')}
          checked={settings.bool.IsAllowStandbyListCleanup}
          onChange={(v) => setBool('IsAllowStandbyListCleanup', v)}
        />
        <CheckboxRow
          label={t('settings.logResults')}
          checked={settings.bool.LogCleanResults}
          onChange={(v) => setBool('LogCleanResults', v)}
        />
      </Section>

      <div className="card p-6" style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
            <MemoryStick size={16} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{settings.appName}</div>
            <div className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
              v{settings.version} · {settings.isAdmin ? 'Administrator' : `${t('misc.elevationNeeded')}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}