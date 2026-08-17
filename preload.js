// Mem Reduct — preload (context bridge)
const { contextBridge, ipcRenderer } = require('electron');

const listeners = new Map();

function on(channel, callback) {
  const sub = (e, ...args) => callback(...args);
  ipcRenderer.on(channel, sub);
  if (!listeners.has(channel)) listeners.set(channel, []);
  listeners.get(channel).push({ sub, callback });
  return () => off(channel, callback);
}

function off(channel, callback) {
  const arr = listeners.get(channel) || [];
  const idx = arr.findIndex((x) => x.callback === callback);
  if (idx !== -1) {
    ipcRenderer.removeListener(channel, arr[idx].sub);
    arr.splice(idx, 1);
  }
}

contextBridge.exposeInMainWorld('memReduct', {
  // init / stats
  init: () => ipcRenderer.invoke('app:init'),
  getStats: () => ipcRenderer.invoke('stats:get'),
  onStats: (cb) => on('stats', cb),

  // window
  minimize: () => ipcRenderer.send('window:minimize'),
  maximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
  close: () => ipcRenderer.send('window:close'),
  hide: () => ipcRenderer.send('window:hide'),
  show: () => ipcRenderer.send('window:show'),
  quit: () => ipcRenderer.send('app:quit'),
  getWindowState: () => ipcRenderer.invoke('window:state'),

  // cleaning
  clean: (mask) => ipcRenderer.invoke('clean:run', mask),
  onCleanResult: (cb) => on('clean-result', cb),
  onCleanFailed: (cb) => on('clean-failed', cb),
  onConfirmClean: (cb) => on('confirm-clean', cb),
  onRegionWarning: (cb) => on('region-warning', cb),
  regionWarningResponse: (res) => ipcRenderer.send('region-warning-response', res),

  // settings
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  onSettingsChanged: (cb) => on('settings-changed', cb),

  // admin / system
  isAdmin: () => ipcRenderer.invoke('admin:is'),
  relaunchAdmin: () => ipcRenderer.invoke('admin:relaunch'),
  getSkipUac: () => ipcRenderer.invoke('admin:skipuac-get'),
  setSkipUac: (enabled) => ipcRenderer.invoke('admin:skipuac-set', enabled),
  getAutorun: () => ipcRenderer.invoke('autorun:get'),
  setAutorun: (enabled) => ipcRenderer.invoke('autorun:set', enabled),

  // update
  checkUpdates: () => ipcRenderer.invoke('update:check'),
  onUpdateAvailable: (cb) => on('update-available', cb),

  // tray
  setTrayIcon: (dataUrl, tooltip) => ipcRenderer.send('tray:icon', { dataUrl, tooltip }),
  refreshTray: () => ipcRenderer.send('tray:refresh'),

  // events from main
  onHotkeyClean: (cb) => on('hotkey-clean', cb),
  onOpenSettings: (cb) => on('open-settings', cb),
  onOpenAbout: (cb) => on('open-about', cb),

  // misc
  openExternal: (url) => ipcRenderer.send('open-external', url),
});