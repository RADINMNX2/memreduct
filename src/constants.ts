import type { Region } from './types';

export const APP_NAME = 'Mem Reduct';

export const REGIONS: Region[] = [
  { bit: 0x01, key: 'workingset' },
  { bit: 0x02, key: 'filecache' },
  { bit: 0x10, key: 'modifiedlist', freeze: true },
  { bit: 0x08, key: 'standbylist', freeze: true },
  { bit: 0x04, key: 'standbypriority0' },
  { bit: 0x80, key: 'modifiedfilecache' },
  { bit: 0x40, key: 'registrycache', minVer: '6.3' },
  { bit: 0x20, key: 'combinelists', minVer: '10' },
];

export const DEFAULT_MASK = 0xe7;

export const TRAY_ACTIONS = [
  { value: 0, label: 'trayActionShow' },
  { value: 1, label: 'trayActionClean' },
  { value: 2, label: 'trayActionTaskMgr' },
];

export const FONTS = [
  'Lucida Console',
  'Consolas',
  'Courier New',
  'Segoe UI',
  'Arial',
  'Tahoma',
  'Verdana',
  'Impact',
  'Times New Roman',
  'Comic Sans MS',
];

export const THEMES: { id: 'neon' | 'frost'; labelKey: string }[] = [
  { id: 'neon', labelKey: 'themeNeon' },
  { id: 'frost', labelKey: 'themeFrost' },
];

export const UPDATE_PERIODS = [
  { value: 0, label: 'updateOff' },
  { value: 1, label: 'update1day' },
  { value: 3, label: 'update3days' },
  { value: 6, label: 'update6days' },
  { value: 14, label: 'update14days' },
  { value: 30, label: 'update30days' },
];