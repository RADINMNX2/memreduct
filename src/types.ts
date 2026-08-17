export interface MemSection {
  total: number;
  available: number;
  used: number;
  percent: number;
}

export interface Stats {
  time: number;
  physical: MemSection;
  pagefile: MemSection;
  cache: { used: number; percent: number };
}

export interface Region {
  bit: number;
  key: string;
  freeze?: boolean;
  minVer?: string;
  supported?: boolean;
}

export interface CleanResult {
  before: number;
  after: number;
  freed: number;
  durationMs: number;
  mask: number;
  results: string;
  source: string;
  time?: number;
  failed?: boolean;
  reason?: string;
}

export type Lang = 'en' | 'fa';
export type Theme = 'neon' | 'frost';
export type Page = 'dashboard' | 'statistics' | 'settings';

export interface Settings {
  [key: string]: string | boolean | number | object | undefined;
  AlwaysOnTop: string;
  IsStartMinimized: string;
  IsShowReductConfirmation: string;
  IsShowWarningConfirmation: string;
  IsAllowStandbyListCleanup: string;
  IsNotificationsSound: string;
  BalloonCleanResults: string;
  LogCleanResults: string;
  AutoreductEnable: string;
  AutoreductValue: string;
  AutoreductIntervalEnable: string;
  AutoreductIntervalValue: string;
  HotkeyCleanEnable: string;
  HotkeyClean: string;
  ReductMask2: string;
  TrayUseTransparency: string;
  TrayShowBorder: string;
  TrayRoundCorners: string;
  TrayChangeBg: string;
  TrayUseAntialiasing: string;
  TrayColorText: string;
  TrayColorBg: string;
  TrayColorWarning: string;
  TrayColorDanger: string;
  TrayFont: string;
  TrayLevelWarning: string;
  TrayLevelDanger: string;
  TrayActionDc: string;
  TrayActionMc: string;
  Language: string;
  Theme: string;
  CheckUpdatesPeriod: string;
  CheckUpdatesLast: string;
  StatisticLastReduct: string;
  SettingsLastPage: string;
  TourSeen: string;
  IsMinimizeToTray: string;
  IsCloseToTray: string;
  num: Record<string, number>;
  bool: Record<string, boolean>;
  window: Record<string, string>;
  isAdmin: boolean;
  version: string;
  appName: string;
  regions: Region[];
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  url?: string;
  error?: string;
}

declare global {
  interface Window {
    memReduct: {
      init: () => Promise<Settings>;
      getStats: () => Promise<Stats | null>;
      onStats: (cb: (stats: Stats) => void) => () => void;
      minimize: () => void;
      maximizeToggle: () => void;
      close: () => void;
      hide: () => void;
      show: () => void;
      quit: () => void;
      getWindowState: () => Promise<{ maximized: boolean }>;
      clean: (mask: number) => Promise<CleanResult>;
      onCleanResult: (cb: (r: CleanResult) => void) => () => void;
      onCleanFailed: (cb: (r: { source: string; reason: string }) => void) => () => void;
      onConfirmClean: (cb: () => void) => () => void;
      onRegionWarning: (cb: (r: { key: string; freeze: boolean }) => void) => () => void;
      regionWarningResponse: (res: { allow: boolean; dontAskAgain: boolean }) => void;
      setSetting: (key: string, value: string) => Promise<boolean>;
      resetSettings: () => Promise<Settings>;
      onSettingsChanged: (cb: (s: Settings) => void) => () => void;
      isAdmin: () => Promise<boolean>;
      relaunchAdmin: () => Promise<boolean>;
      getSkipUac: () => Promise<boolean>;
      setSkipUac: (enabled: boolean) => Promise<void>;
      getAutorun: () => Promise<boolean>;
      setAutorun: (enabled: boolean) => Promise<void>;
      checkUpdates: () => Promise<UpdateInfo>;
      onUpdateAvailable: (cb: (u: UpdateInfo) => void) => () => void;
      setTrayIcon: (dataUrl: string, tooltip: string) => void;
      refreshTray: () => void;
      onHotkeyClean: (cb: () => void) => () => void;
      onOpenSettings: (cb: () => void) => () => void;
      onOpenAbout: (cb: () => void) => () => void;
      openExternal: (url: string) => void;
    };
  }
}