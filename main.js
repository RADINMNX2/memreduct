// Mem Reduct — Electron main process (neon UI rebuild)
const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, Notification, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

const APP_NAME = 'Mem Reduct';
const APP_VERSION = '1.0.0';
const REPO = 'RADINMNX2/memreduct';
const INI_SECTION = 'memreduct';
const AUTOREDUCT_COOLDOWN_MS = 30000;
const HOTKEY_ID = 1337;

// --- regions bit map (matches legacy) ---
const REGIONS = [
  { bit: 0x01, key: 'workingset' },
  { bit: 0x02, key: 'filecache' },
  { bit: 0x10, key: 'modifiedlist', freeze: true },
  { bit: 0x08, key: 'standbylist', freeze: true },
  { bit: 0x04, key: 'standbypriority0' },
  { bit: 0x80, key: 'modifiedfilecache' },
  { bit: 0x40, key: 'registrycache', minVer: '6.3' },
  { bit: 0x20, key: 'combinelists', minVer: '10' },
];
const DEFAULT_MASK = 0xE7;

// ============================= INI persistence =============================
function iniPath() {
  const portable = fs.existsSync(path.join(process.execPath, '..', 'portable.dat'));
  if (portable) return path.join(path.dirname(process.execPath), 'memreduct.ini');
  return path.join(app.getPath('appData'), 'Henry++', 'Mem Reduct', 'memreduct.ini');
}

function parseIni(text) {
  const data = {};
  let section = '__root__';
  data[section] = data[section] || {};
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1).trim();
      data[section] = data[section] || {};
      continue;
    }
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    data[section][key] = val;
  }
  return data;
}

function serializeIni(data) {
  let out = '';
  for (const section of Object.keys(data)) {
    out += `[${section}]\r\n`;
    for (const key of Object.keys(data[section])) {
      out += `${key}=${data[section][key]}\r\n`;
    }
    out += '\r\n';
  }
  return out;
}

const DEFAULTS = {
  AlwaysOnTop: '0',
  IsStartMinimized: '0',
  IsShowReductConfirmation: '1',
  IsShowWarningConfirmation: '1',
  IsAllowStandbyListCleanup: '0',
  IsNotificationsSound: '1',
  BalloonCleanResults: '1',
  LogCleanResults: '0',
  AutoreductEnable: '0',
  AutoreductValue: '90',
  AutoreductIntervalEnable: '0',
  AutoreductIntervalValue: '30',
  HotkeyCleanEnable: '0',
  HotkeyClean: 'Ctrl+F1',
  ReductMask2: String(DEFAULT_MASK),
  TrayUseTransparency: '0',
  TrayShowBorder: '0',
  TrayRoundCorners: '0',
  TrayChangeBg: '1',
  TrayUseAntialiasing: '0',
  TrayColorText: '#FFFFFF',
  TrayColorBg: '#008040',
  TrayColorWarning: '#FF8040',
  TrayColorDanger: '#EC1C24',
  TrayFont: 'Lucida Console',
  TrayLevelWarning: '70',
  TrayLevelDanger: '90',
  TrayActionDc: '0',
  TrayActionMc: '1',
  Language: 'en',
  Theme: 'neon',
  CheckUpdatesPeriod: '6',
  CheckUpdatesLast: '0',
  StatisticLastReduct: '0',
  SettingsLastPage: '0',
  TourSeen: '0',
  IsMinimizeToTray: '1',
  IsCloseToTray: '1',
};

function loadConfig() {
  let data = {};
  try {
    data = parseIni(fs.readFileSync(iniPath(), 'utf8'));
  } catch (e) { data = {}; }
  const root = { ...DEFAULTS, ...(data[INI_SECTION] || {}) };
  const win = data[INI_SECTION + '\\window'] || {};
  const cfg = { ...root, window: win };
  cfg.num = {};
  for (const k of ['AutoreductValue', 'AutoreductIntervalValue', 'ReductMask2', 'TrayLevelWarning', 'TrayLevelDanger', 'TrayActionDc', 'TrayActionMc', 'CheckUpdatesPeriod', 'CheckUpdatesLast', 'StatisticLastReduct', 'SettingsLastPage']) {
    cfg.num[k] = parseInt(root[k], 10) || 0;
  }
  cfg.bool = {};
  for (const k of ['AlwaysOnTop', 'IsStartMinimized', 'IsShowReductConfirmation', 'IsShowWarningConfirmation', 'IsAllowStandbyListCleanup', 'IsNotificationsSound', 'BalloonCleanResults', 'LogCleanResults', 'AutoreductEnable', 'AutoreductIntervalEnable', 'HotkeyCleanEnable', 'TrayUseTransparency', 'TrayShowBorder', 'TrayRoundCorners', 'TrayChangeBg', 'TrayUseAntialiasing', 'TourSeen', 'IsMinimizeToTray', 'IsCloseToTray']) {
    cfg.bool[k] = root[k] === '1' || root[k] === 'true';
  }
  return cfg;
}

function saveConfig(cfg) {
  try {
    const dir = path.dirname(iniPath());
    fs.mkdirSync(dir, { recursive: true });
    const data = {};
    data[INI_SECTION] = {};
    for (const k of Object.keys(DEFAULTS)) data[INI_SECTION][k] = String(cfg[k]);
    data[INI_SECTION + '\\window'] = { ...(cfg.window || {}) };
    fs.writeFileSync(iniPath(), serializeIni(data), 'utf8');
  } catch (e) {
    console.error('saveConfig failed:', e);
  }
}

let config = loadConfig();

// ============================= state =============================
let mainWindow = null;
let tray = null;
let isQuitting = false;
let isAdmin = false;
let statsProcess = null;
let lastStats = null;
let lastTrayImage = null;
let pendingRegionWarning = null;

const isDev = !app.isPackaged;

// ============================= helpers =============================
function send(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, ...args);
}

function debugLog(text) {
  if (!config.bool.LogCleanResults) return;
  try {
    fs.appendFileSync(path.join(path.dirname(iniPath()), 'memreduct_debug.log'), `[${new Date().toISOString()}] ${text}\r\n`);
  } catch (e) {}
}

function runPowerShell(args, timeoutMs) {
  return new Promise((resolve) => {
    let proc;
    try {
      proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', ...args], { windowsHide: true });
    } catch (e) { return resolve({ stdout: '', stderr: String(e), code: -1 }); }
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    const timer = setTimeout(() => { try { proc.kill(); } catch (e) {} }, timeoutMs || 60000);
    proc.on('close', (code) => { clearTimeout(timer); resolve({ stdout, stderr, code }); });
    proc.on('error', (err) => { clearTimeout(timer); resolve({ stdout, stderr: String(err), code: -1 }); });
  });
}

function scriptPath(name) {
  return isDev ? path.join(__dirname, 'scripts', name) : path.join(process.resourcesPath, 'scripts', name);
}

function checkAdmin() {
  return runPowerShell(['-Command', "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"], 15000)
    .then((r) => (r.stdout.trim() === 'True' || r.stdout.trim() === 'true'));
}

function balloon(title, body) {
  try {
    new Notification({ title, body, silent: !config.bool.IsNotificationsSound, icon: trayImageFallback() }).show();
  } catch (e) {}
}

// ============================= tray icon =============================
let TRAY_FALLBACK = null;
function trayImageFallback() {
  if (!TRAY_FALLBACK) {
    const candidates = [
      path.join(__dirname, 'build', 'tray.png'),
      path.join(__dirname, 'public', 'tray.png'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) { TRAY_FALLBACK = c; break; }
    }
  }
  return TRAY_FALLBACK;
}

function openTaskManager() {
  try { spawn('taskmgr.exe', [], { windowsHide: true, detached: true }).unref(); } catch (e) {}
}

function setTrayImage(dataUrl) {
  if (!tray || !dataUrl) return;
  try {
    const img = require('electron').nativeImage.createFromDataURL(dataUrl);
    if (!img.isEmpty()) {
      tray.setImage(img);
      lastTrayImage = dataUrl;
    }
  } catch (e) {}
}

function trayTooltip() {
  const s = lastStats;
  if (!s) return APP_NAME;
  const fmt = (v) => (v == null ? '--' : v.toFixed(2));
  return `Physical memory: ${fmt(s.physical?.percent)}%\nPagefile: ${fmt(s.pagefile?.percent)}%\nSystem working set: ${fmt(s.cache?.percent)}%`;
}

function buildTrayMenu() {
  if (!tray) return;
  const mask = config.num.ReductMask2;

  const regionItems = REGIONS.map((r) => ({
    label: r.key,
    type: 'checkbox',
    checked: (mask & r.bit) !== 0,
    enabled: isAdmin && !(r.minVer && !osAtLeast(r.minVer)),
    click: (item) => {
      const nowOn = (config.num.ReductMask2 & r.bit) !== 0;
      if (!nowOn && r.freeze) {
        pendingRegionWarning = { region: r, wantOn: true };
        send('region-warning', { key: r.key, freeze: true });
        return;
      }
      setRegion(r.bit, !nowOn, true);
    },
  }));

  const aboveItems = [
    { label: 'Disable', type: 'radio', checked: !config.bool.AutoreductEnable, click: () => { setSetting('AutoreductEnable', '0'); refreshTray(); } },
  ];
  const levels = new Set([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  const v = config.num.AutoreductValue;
  for (let i = Math.max(5, v - 2); i <= Math.min(99, v + 2); i++) levels.add(i);
  for (const lvl of Array.from(levels).sort((a, b) => a - b)) {
    aboveItems.push({
      label: `${lvl}%`,
      type: 'radio',
      checked: config.bool.AutoreductEnable && config.num.AutoreductValue === lvl,
      enabled: isAdmin,
      click: () => { setSetting('AutoreductEnable', '1'); setSetting('AutoreductValue', String(lvl)); refreshTray(); },
    });
  }

  const everyItems = [
    { label: 'Disable', type: 'radio', checked: !config.bool.AutoreductIntervalEnable, click: () => { setSetting('AutoreductIntervalEnable', '0'); refreshTray(); } },
  ];
  const mins = new Set([10, 20, 30, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 780, 840, 900, 960, 1020, 1080, 1140, 1200, 1260, 1320, 1380, 1440]);
  const iv = config.num.AutoreductIntervalValue;
  for (let i = Math.max(1, iv - 2); i <= Math.min(1440, iv + 2); i++) mins.add(i);
  for (const m of Array.from(mins).sort((a, b) => a - b)) {
    everyItems.push({
      label: `${m} min.`,
      type: 'radio',
      checked: config.bool.AutoreductIntervalEnable && config.num.AutoreductIntervalValue === m,
      enabled: isAdmin,
      click: () => { setSetting('AutoreductIntervalEnable', '1'); setSetting('AutoreductIntervalValue', String(m)); refreshTray(); },
    });
  }

  const menu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => toggleWindow() },
    { label: 'Clean memory...', enabled: isAdmin, click: () => send('confirm-clean') },
    { label: 'Clean areas', submenu: regionItems },
    { label: 'Clean when above', submenu: aboveItems },
    { label: 'Clean every', submenu: everyItems },
    { type: 'separator' },
    { label: 'Settings...', click: () => { showWindow(); send('open-settings'); } },
    { label: 'Website', click: () => shell.openExternal(`https://github.com/${REPO}`) },
    { label: 'About', click: () => { showWindow(); send('open-about'); } },
    { type: 'separator' },
    { label: 'Exit', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function setRegion(bit, on, updateIni) {
  let mask = config.num.ReductMask2;
  mask = on ? (mask | bit) : (mask & ~bit);
  config.num.ReductMask2 = mask;
  config.ReductMask2 = String(mask);
  if (updateIni) saveConfig(config);
  send('settings-changed', publicSettings());
  refreshTray();
}

function refreshTray() {
  if (tray) {
    tray.setToolTip(trayTooltip());
    buildTrayMenu();
  }
}

function osAtLeast(ver) {
  const v = require('os').release();
  const m = v.match(/^(\d+)\.(\d+)/);
  if (!m) return true;
  const major = parseInt(m[1], 10);
  const minor = parseInt(m[2], 10);
  const target = ver.split('.').map(Number);
  return major > target[0] || (major === target[0] && minor >= (target[1] || 0));
}

// ============================= window =============================
function createWindow() {
  const w = config.window || {};
  const pos = (w.Position || 'center').split(',').map(Number);
  const size = (w.Size || '1200,800').split(',').map(Number);
  mainWindow = new BrowserWindow({
    width: size[0] || 1200,
    height: size[1] || 800,
    minWidth: 900,
    minHeight: 600,
    x: pos.length === 2 && !isNaN(pos[0]) ? pos[0] : undefined,
    y: pos.length === 2 && !isNaN(pos[1]) ? pos[1] : undefined,
    frame: false,
    show: false,
    backgroundColor: '#050505',
    icon: isDev ? path.join(__dirname, 'build', 'icon.png') : path.join(process.resourcesPath, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, 'build', 'index.html').replace(/\\/g, '/')}`;
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const lvl = event?.level ?? level;
      const msg = event?.message ?? message;
      const src = event?.sourceId ?? sourceId;
      const ln = event?.lineNumber ?? line;
      console.log(`[renderer:${lvl}] ${msg} (${src}:${ln})`);
    });
    mainWindow.webContents.on('render-process-gone', (e, details) => {
      console.error('[renderer-gone]', details.reason);
    });
  }

  if (config.bool.AlwaysOnTop) mainWindow.setAlwaysOnTop(true, 'floating');

  mainWindow.on('close', (event) => {
    if (!isQuitting && config.bool.IsCloseToTray) {
      event.preventDefault();
      mainWindow.hide();
      if (!tray) createTray();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  mainWindow.once('ready-to-show', () => {
    if (!shouldStartMinimized()) mainWindow.show();
    else if (isDev) mainWindow.show();
  });
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const b = mainWindow.getBounds();
  config.window = { Position: `${Math.round(b.x)},${Math.round(b.y)}`, Size: `${Math.round(b.width)},${Math.round(b.height)}` };
  saveConfig(config);
}

function shouldStartMinimized() {
  return process.argv.includes('-minimized') || config.bool.IsStartMinimized;
}

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) mainWindow.hide();
    else mainWindow.focus();
  } else showWindow();
}

// ============================= stats daemon =============================
function startStatsDaemon() {
  if (statsProcess) try { statsProcess.kill(); } catch (e) {}
  statsProcess = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath('stats.ps1')], { windowsHide: true });
  let buf = '';
  statsProcess.stdout.on('data', (d) => {
    buf += d.toString();
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      try {
        const stats = JSON.parse(line);
        if (stats && !stats.error) {
          lastStats = stats;
          send('stats', stats);
          runAutoClean();
        }
      } catch (e) {}
    }
  });
  statsProcess.on('exit', () => {
    statsProcess = null;
    if (!isQuitting) setTimeout(startStatsDaemon, 3000);
  });
}

// ============================= cleaning =============================
function autoMask() {
  let mask = config.num.ReductMask2;
  if (!config.bool.IsAllowStandbyListCleanup) mask &= ~(0x08 | 0x10);
  return mask;
}

function runAutoClean() {
  if (!isAdmin || !lastStats) return;
  const now = Date.now();
  const last = config.num.StatisticLastReduct * 1000;
  const phys = lastStats.physical?.percent ?? 0;
  const mask = autoMask();
  if (mask === 0) return;
  if (config.bool.AutoreductEnable && phys >= config.num.AutoreductValue && now - last >= AUTOREDUCT_COOLDOWN_MS) {
    cleanNow(mask, 'auto');
  } else if (config.bool.AutoreductIntervalEnable && now - last >= config.num.AutoreductIntervalValue * 60000) {
    cleanNow(mask, 'auto');
  }
}

async function cleanNow(mask, source) {
  if (!isAdmin) {
    send('clean-failed', { source, reason: 'admin' });
    relaunchAdmin();
    return;
  }
  const res = await runPowerShell(['-File', scriptPath('clean.ps1'), '-Mask', String(mask)], 120000);
  let data = null;
  try { data = JSON.parse(res.stdout.trim().split('\n').pop()); } catch (e) {}
  const nowSec = Math.floor(Date.now() / 1000);
  config.num.StatisticLastReduct = nowSec;
  config.StatisticLastReduct = String(nowSec);
  saveConfig(config);
  if (data) {
    debugLog(`[${source}] cleaned=${data.freed} bytes (mask=${data.mask}, ${data.durationMs}ms, ${data.results})`);
    send('clean-result', { ...data, source });
    if (config.bool.BalloonCleanResults) {
      const mb = (data.freed / (1024 * 1024)).toFixed(2);
      balloon(`Mem Reduct — ${mb} MB released`, `Memory was released with ${mb} MB result.`);
    }
  } else {
    debugLog(`[${source}] clean failed: ${res.stderr.slice(0, 300)}`);
    send('clean-failed', { source, reason: 'error' });
  }
  refreshTray();
}

function relaunchAdmin() {
  const args = process.argv.slice(1).filter((a) => !a.startsWith('--') || a === '-minimized' || a === '-clean' || a.startsWith('-clean:'));
  const quoted = JSON.stringify([...args].map((a) => `"${a}"`).join(' '));
  const cmd = `Start-Process -FilePath "${process.execPath}" -ArgumentList ${quoted} -Verb RunAs`;
  spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true });
  setTimeout(() => { if (!isQuitting) { isQuitting = true; app.quit(); } }, 1500);
}

// ============================= settings =============================
function publicSettings() {
  return {
    ...config,
    isAdmin,
    version: APP_VERSION,
    appName: APP_NAME,
    regions: REGIONS.map((r) => ({ ...r, supported: !r.minVer || osAtLeast(r.minVer) })),
  };
}

function setSetting(key, value) {
  config[key] = String(value);
  const numKeys = ['AutoreductValue', 'AutoreductIntervalValue', 'ReductMask2', 'TrayLevelWarning', 'TrayLevelDanger', 'TrayActionDc', 'TrayActionMc', 'CheckUpdatesPeriod', 'CheckUpdatesLast', 'StatisticLastReduct', 'SettingsLastPage'];
  const boolKeys = ['AlwaysOnTop', 'IsStartMinimized', 'IsShowReductConfirmation', 'IsShowWarningConfirmation', 'IsAllowStandbyListCleanup', 'IsNotificationsSound', 'BalloonCleanResults', 'LogCleanResults', 'AutoreductEnable', 'AutoreductIntervalEnable', 'HotkeyCleanEnable', 'TrayUseTransparency', 'TrayShowBorder', 'TrayRoundCorners', 'TrayChangeBg', 'TrayUseAntialiasing', 'TourSeen', 'IsMinimizeToTray', 'IsCloseToTray'];
  if (numKeys.includes(key)) config.num[key] = parseInt(value, 10) || 0;
  if (boolKeys.includes(key)) config.bool[key] = value === '1' || value === 'true';
  saveConfig(config);
  applySetting(key);
}

function applySetting(key) {
  switch (key) {
    case 'AlwaysOnTop':
      if (mainWindow) mainWindow.setAlwaysOnTop(config.bool.AlwaysOnTop, 'floating');
      break;
    case 'HotkeyCleanEnable':
    case 'HotkeyClean':
      registerHotkey();
      break;
    case 'TrayColorText':
    case 'TrayColorBg':
    case 'TrayColorWarning':
    case 'TrayColorDanger':
    case 'TrayLevelWarning':
    case 'TrayLevelDanger':
    case 'TrayUseTransparency':
    case 'TrayShowBorder':
    case 'TrayRoundCorners':
    case 'TrayChangeBg':
    case 'TrayUseAntialiasing':
    case 'TrayFont':
      refreshTray();
      break;
    case 'ReductMask2':
    case 'AutoreductEnable':
    case 'AutoreductValue':
    case 'AutoreductIntervalEnable':
    case 'AutoreductIntervalValue':
      refreshTray();
      break;
    default:
      break;
  }
}

// ============================= hotkey =============================
function acceleratorFromHotkey(hk) {
  const parts = String(hk || 'Ctrl+F1').split('+');
  const mods = [];
  const key = parts.pop();
  if (parts.includes('Ctrl')) mods.push('CommandOrControl');
  if (parts.includes('Alt')) mods.push('Alt');
  if (parts.includes('Shift')) mods.push('Shift');
  return [...mods, key].join('+');
}

function registerHotkey() {
  globalShortcut.unregisterAll();
  if (!isAdmin || !config.bool.HotkeyCleanEnable) return;
  try {
    globalShortcut.register(acceleratorFromHotkey(config.HotkeyClean), () => {
      send('hotkey-clean');
    });
  } catch (e) {
    console.error('hotkey register failed', e);
  }
}

// ============================= autorun / skip uac =============================
async function getAutorun() {
  const r = await runPowerShell(['-Command', "(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'Mem Reduct' -ErrorAction SilentlyContinue).'Mem Reduct'"], 15000);
  return r.stdout.trim().length > 0;
}

async function setAutorun(enabled) {
  if (enabled) {
    const cmd = `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'Mem Reduct' -Value '"${process.execPath}" -minimized'`;
    await runPowerShell(['-Command', cmd], 15000);
  } else {
    const cmd = "Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'Mem Reduct' -ErrorAction SilentlyContinue";
    await runPowerShell(['-Command', cmd], 15000);
  }
}

async function getSkipUac() {
  const r = await runPowerShell(['-Command', "schtasks /query /tn memreductTask 2>$null | Select-String 'memreductTask'"], 15000);
  return r.stdout.includes('memreductTask');
}

async function setSkipUac(enabled) {
  if (enabled) {
    const cmd = `schtasks /create /tn memreductTask /tr "\\"${process.execPath}\\" -skipuac" /sc onlogon /rl highest /f`;
    await runPowerShell(['-Command', cmd], 20000);
  } else {
    await runPowerShell(['-Command', 'schtasks /delete /tn memreductTask /f 2>$null'], 15000);
  }
}

// ============================= update check =============================
function checkForUpdates() {
  return new Promise((resolve) => {
    const req = https.get(`https://raw.githubusercontent.com/${REPO}/main/VERSION`, { timeout: 15000, headers: { 'User-Agent': `MemReduct/${APP_VERSION}` } }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d.toString(); });
      res.on('end', () => {
        const m = body.match(/memreduct=([\d.]+)\|(\S+)/);
        if (m && m[1] !== APP_VERSION) resolve({ available: true, version: m[1], url: m[2] });
        else resolve({ available: false, version: m ? m[1] : APP_VERSION, url: m ? m[2] : '' });
      });
      res.on('error', () => resolve({ error: 'server' }));
    });
    req.on('error', () => resolve({ error: 'server' }));
    req.setTimeout(15000, () => { try { req.destroy(); } catch (e) {} resolve({ error: 'timeout' }); });
  });
}

// ============================= tray =============================
function createTray() {
  if (tray) return;
  try {
    tray = new Tray(trayImageFallback());
    tray.setToolTip(APP_NAME);
    tray.on('click', () => {
      const action = config.num.TrayActionDc;
      if (action === 1) { send('confirm-clean'); }
      else if (action === 2) { openTaskManager(); }
      else toggleWindow();
    });
    tray.on('middle-click', () => {
      const action = config.num.TrayActionMc;
      if (action === 1) { send('confirm-clean'); }
      else if (action === 2) { openTaskManager(); }
      else toggleWindow();
    });
    tray.on('double-click', () => showWindow());
    buildTrayMenu();
  } catch (e) {
    tray = null;
  }
}

// ============================= IPC =============================
function registerIpc() {
  ipcMain.handle('app:init', () => publicSettings());
  ipcMain.handle('stats:get', () => lastStats);

  ipcMain.on('window:minimize', () => {
    if (!mainWindow) return;
    if (config.bool.IsMinimizeToTray) { mainWindow.hide(); if (!tray) createTray(); }
    else mainWindow.minimize();
  });
  ipcMain.on('window:maximize-toggle', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', () => { if (mainWindow) mainWindow.close(); });
  ipcMain.on('window:hide', () => { if (mainWindow) mainWindow.hide(); });
  ipcMain.on('window:show', () => showWindow());
  ipcMain.on('app:quit', () => { isQuitting = true; app.quit(); });

  ipcMain.on('tray:icon', (e, payload) => {
    if (!payload) return;
    setTrayImage(payload.dataUrl);
    if (payload.tooltip) tray.setToolTip(payload.tooltip);
  });

  ipcMain.on('tray:refresh', () => refreshTray());

  ipcMain.handle('clean:run', async (e, mask) => {
    const m = typeof mask === 'number' ? mask : config.num.ReductMask2;
    if (!isAdmin) {
      relaunchAdmin();
      return { failed: true, reason: 'admin' };
    }
    const res = await runPowerShell(['-File', scriptPath('clean.ps1'), '-Mask', String(m)], 120000);
    let data = null;
    try { data = JSON.parse(res.stdout.trim().split('\n').pop()); } catch (err) {}
    const nowSec = Math.floor(Date.now() / 1000);
    config.num.StatisticLastReduct = nowSec;
    config.StatisticLastReduct = String(nowSec);
    saveConfig(config);
    if (data) {
      debugLog(`[manual] cleaned=${data.freed} bytes (mask=${data.mask}, ${data.durationMs}ms, ${data.results})`);
      refreshTray();
      return { ...data, source: 'manual' };
    }
    debugLog(`[manual] clean failed: ${res.stderr.slice(0, 300)}`);
    return { failed: true, reason: 'error', stderr: res.stderr.slice(0, 300) };
  });

  ipcMain.handle('settings:set', (e, key, value) => {
    if (!(key in DEFAULTS) && key !== 'window') return false;
    setSetting(key, value);
    send('settings-changed', publicSettings());
    return true;
  });

  ipcMain.handle('settings:reset', () => {
    config = loadConfig();
    for (const k of Object.keys(DEFAULTS)) config[k] = DEFAULTS[k];
    config.num = {};
    for (const k of ['AutoreductValue', 'AutoreductIntervalValue', 'ReductMask2', 'TrayLevelWarning', 'TrayLevelDanger', 'TrayActionDc', 'TrayActionMc', 'CheckUpdatesPeriod', 'CheckUpdatesLast', 'StatisticLastReduct', 'SettingsLastPage']) {
      config.num[k] = parseInt(DEFAULTS[k], 10) || 0;
    }
    config.bool = {};
    for (const k of ['AlwaysOnTop', 'IsStartMinimized', 'IsShowReductConfirmation', 'IsShowWarningConfirmation', 'IsAllowStandbyListCleanup', 'IsNotificationsSound', 'BalloonCleanResults', 'LogCleanResults', 'AutoreductEnable', 'AutoreductIntervalEnable', 'HotkeyCleanEnable', 'TrayUseTransparency', 'TrayShowBorder', 'TrayRoundCorners', 'TrayChangeBg', 'TrayUseAntialiasing', 'TourSeen', 'IsMinimizeToTray', 'IsCloseToTray']) {
      config.bool[k] = DEFAULTS[k] === '1';
    }
    saveConfig(config);
    setAutorun(false);
    setSkipUac(false);
    registerHotkey();
    if (mainWindow) mainWindow.setAlwaysOnTop(config.bool.AlwaysOnTop, 'floating');
    refreshTray();
    send('settings-changed', publicSettings());
    return publicSettings();
  });

  ipcMain.handle('admin:is', () => isAdmin);
  ipcMain.handle('admin:relaunch', () => { relaunchAdmin(); return true; });
  ipcMain.handle('admin:skipuac-get', () => getSkipUac());
  ipcMain.handle('admin:skipuac-set', (e, enabled) => setSkipUac(enabled));
  ipcMain.handle('autorun:get', () => getAutorun());
  ipcMain.handle('autorun:set', (e, enabled) => setAutorun(enabled));

  ipcMain.handle('update:check', () => checkForUpdates());

  ipcMain.handle('window:state', () => {
    if (!mainWindow) return { maximized: false };
    return { maximized: mainWindow.isMaximized() };
  });

  ipcMain.on('region-warning-response', (e, res) => {
    if (pendingRegionWarning) {
      if (res.dontAskAgain) setSetting('IsShowWarningConfirmation', '0');
      if (res.allow) setRegion(pendingRegionWarning.region.bit, true, true);
      pendingRegionWarning = null;
    }
  });

  ipcMain.on('open-external', (e, url) => shell.openExternal(url));
}

// ============================= app lifecycle =============================
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());

  app.whenReady().then(async () => {
    isAdmin = await checkAdmin();
    registerIpc();
    createWindow();
    createTray();
    startStatsDaemon();
    registerHotkey();

    if (config.bool.CheckUpdatesPeriod > 0) {
      const now = Math.floor(Date.now() / 1000);
      if (now - config.num.CheckUpdatesLast > config.num.CheckUpdatesPeriod * 3600) {
        checkForUpdates().then((res) => {
          if (res.available) {
            config.num.CheckUpdatesLast = now;
            config.CheckUpdatesLast = String(now);
            saveConfig(config);
            send('update-available', res);
          }
        });
      }
    }

    const args = process.argv;
    if (args.includes('-clean') || args.some((a) => a.startsWith('-clean:'))) {
      const full = args.some((a) => a.startsWith('-clean:full'));
      const mask = full ? 0xFF : config.num.ReductMask2;
      if (isAdmin) {
        await cleanNow(mask, 'commandline');
        setTimeout(() => { isQuitting = true; app.quit(); }, 2500);
      } else {
        relaunchAdmin();
      }
    }
  });

  app.on('before-quit', () => { isQuitting = true; });
  app.on('will-quit', () => {
    try { if (statsProcess) statsProcess.kill(); } catch (e) {}
    globalShortcut.unregisterAll();
  });
  app.on('window-all-closed', () => {
    // keep running in tray
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}