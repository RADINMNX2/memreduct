import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { CleanResult, Lang, Page, Settings, Stats, Theme, UpdateInfo } from '../types';
import { translate } from '../utils/translations';
import { drawTrayIcon, trayTooltipText } from '../utils/trayIcon';

export interface FreezeWarning {
  key: string;
  freeze: boolean;
  onAllow?: () => void;
}

interface AppContextValue {
  settings: Settings | null;
  stats: Stats | null;
  page: Page;
  setPage: (p: Page) => void;
  lang: Lang;
  isRTL: boolean;
  theme: Theme;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setSetting: (key: string, value: string) => void;
  setBool: (key: string, value: boolean) => void;
  setNum: (key: string, value: number) => void;
  resetSettings: () => void;
  runClean: (mask: number, opts?: { confirm?: boolean }) => Promise<CleanResult | null>;
  cleaning: boolean;
  lastResult: CleanResult | null;
  history: CleanResult[];
  loading: boolean;
  updateInfo: UpdateInfo | null;
  setUpdateInfo: (v: UpdateInfo | null) => void;
  checkUpdates: () => Promise<void>;
  aboutOpen: boolean;
  setAboutOpen: (v: boolean) => void;
  confirmCleanOpen: boolean;
  setConfirmCleanOpen: (v: boolean) => void;
  pendingConfirmMask: number | null;
  setPendingConfirmMask: (v: number | null) => void;
  relaunchingAdmin: boolean;
  freezeWarning: FreezeWarning | null;
  setFreezeWarning: (v: FreezeWarning | null) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPageState] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [lastResult, setLastResult] = useState<CleanResult | null>(null);
  const [history, setHistory] = useState<CleanResult[]>([]);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [confirmCleanOpen, setConfirmCleanOpen] = useState(false);
  const [pendingConfirmMask, setPendingConfirmMask] = useState<number | null>(null);
  const [relaunchingAdmin, setRelaunchingAdmin] = useState(false);
  const [freezeWarning, setFreezeWarning] = useState<FreezeWarning | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef<Settings | null>(null);
  const statsRef = useRef<Stats | null>(null);
  settingsRef.current = settings;
  statsRef.current = stats;

  const lang: Lang = (settings?.Language as Lang) || 'en';
  const isRTL = lang === 'fa';
  const theme: Theme = (settings?.Theme as Theme) || 'neon';

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [isRTL, lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // init
  useEffect(() => {
    let mounted = true;
    const api = window.memReduct;
    api.init().then((s) => {
      if (!mounted) return;
      setSettings(s);
      setPage(s.num.SettingsLastPage >= 0 && s.num.SettingsLastPage <= 2 ? (['dashboard', 'statistics', 'settings'][s.num.SettingsLastPage] as Page) : 'dashboard');
      setLoading(false);
      const bootTimer = setTimeout(() => setLoading(false), 2200);
      return () => clearTimeout(bootTimer);
    });

    api.onStats((st) => {
      if (!mounted) return;
      setStats(st);
      syncTray(st, settingsRef.current);
    });
    api.onSettingsChanged((s) => setSettings(s));
    api.onCleanResult((r) => {
      setLastResult(r);
      setHistory((h) => [r, ...h].slice(0, 30));
      setCleaning(false);
    });
    api.onCleanFailed((r) => {
      setCleaning(false);
      if (r.reason === 'admin') {
        setRelaunchingAdmin(true);
        setTimeout(() => setRelaunchingAdmin(false), 3500);
      } else {
        showToast(t('clean.failedReason'));
      }
    });
    api.onHotkeyClean(() => {
      void runCleanRef.current(settingsRef.current ? parseInt(settingsRef.current.ReductMask2, 10) || 0xe7 : 0xe7, { confirm: false });
    });
    api.onConfirmClean(() => {
      setPendingConfirmMask(settingsRef.current ? parseInt(settingsRef.current.ReductMask2, 10) || 0xe7 : 0xe7);
      setConfirmCleanOpen(true);
    });
    api.onRegionWarning((r) => {
      setFreezeWarning(r);
    });
    api.onOpenSettings(() => setPageState('settings'));
    api.onOpenAbout(() => setAboutOpen(true));
    api.onUpdateAvailable((u) => setUpdateInfo(u));

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tray sync on settings change too
  useEffect(() => {
    if (settings) syncTray(statsRef.current, settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const syncTray = useCallback((st: Stats | null, s: Settings | null) => {
    if (!s || !window.memReduct) return;
    const dataUrl = drawTrayIcon(st, s);
    const tooltip = trayTooltipText(st, {
      physical: translate(s.Language as Lang, 'tray.physical'),
      pagefile: translate(s.Language as Lang, 'tray.pagefile'),
      cache: translate(s.Language as Lang, 'tray.systemWorkingSet'),
    });
    if (dataUrl) window.memReduct.setTrayIcon(dataUrl, tooltip);
  }, []);

  const setSetting = useCallback((key: string, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    window.memReduct.setSetting(key, value).then((ok) => {
      if (!ok) console.warn('setSetting failed', key, value);
    });
  }, []);

  const setBool = useCallback((key: string, value: boolean) => setSetting(key, value ? '1' : '0'), [setSetting]);
  const setNum = useCallback((key: string, value: number) => setSetting(key, String(value)), [setSetting]);

  const resetSettings = useCallback(() => {
    window.memReduct.resetSettings().then((s) => {
      setSettings(s);
      showToast(t('settings.title'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const runClean = useCallback(
    async (mask: number, opts?: { confirm?: boolean }) => {
      const s = settingsRef.current;
      if (!s) return null;
      const wantConfirm = opts?.confirm ?? s.bool.IsShowReductConfirmation;
      if (wantConfirm) {
        setPendingConfirmMask(mask);
        setConfirmCleanOpen(true);
        return null;
      }
      setCleaning(true);
      const result = await window.memReduct.clean(mask);
      if (result && !result.failed) {
        setLastResult(result);
        setHistory((h) => [result, ...h].slice(0, 30));
      }
      setCleaning(false);
      if (result?.failed && result.reason === 'admin') {
        setRelaunchingAdmin(true);
        setTimeout(() => setRelaunchingAdmin(false), 3500);
      }
      return result;
    },
    [],
  );

  const runCleanRef = useRef(runClean);
  runCleanRef.current = runClean;

  const checkUpdates = useCallback(async () => {
    const res = await window.memReduct.checkUpdates();
    setUpdateInfo(res);
  }, []);

  const setPage = useCallback((p: Page) => {
    setPageState(p);
    setSetting('SettingsLastPage', String(['dashboard', 'statistics', 'settings'].indexOf(p)));
  }, [setSetting]);

  return (
    <AppContext.Provider
      value={{
        settings, stats, page, setPage, lang, isRTL, theme, t,
        setSetting, setBool, setNum, resetSettings,
        runClean, cleaning, lastResult, history, loading,
        updateInfo, setUpdateInfo, checkUpdates,
        aboutOpen, setAboutOpen,
        confirmCleanOpen, setConfirmCleanOpen, pendingConfirmMask, setPendingConfirmMask,
        relaunchingAdmin, freezeWarning, setFreezeWarning, toast, showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}