<div align="center">

# Mem Reduct

**A modern, neon-styled memory cleaner for Windows.** Real-time memory statistics, one-click cleaning, system tray integration, hotkeys, and a beautiful glassmorphic UI — rebuilt from scratch on Electron + React.

![License](https://img.shields.io/badge/license-GPL--3.0-red) ![Electron](https://img.shields.io/badge/Electron-33-blue) ![React](https://img.shields.io/badge/React-18-cyan) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![Windows](https://img.shields.io/badge/Platform-Windows-0078d6) ![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)

</div>

---

## Features

- ⚡ **Real memory cleaning** — uses Windows native APIs (`NtSetSystemInformation` with `SystemMemoryListInformation`) via an embedded PowerShell/C# engine
- 📊 **Live statistics** — physical memory, pagefile and system working set, sampled every second, with a real-time chart
- 🌗 **Two themes** — neon (dark red) and frost (light sky)
- 🌐 **Bilingual** — English and فارسی (RTL)
- 🗔 **Custom frameless UI** — glassmorphism, animated page transitions, glow effects
- 🧊 **Tray integration** — live percentage tray icon with configurable colors/levels, click & middle-click actions, context menu
- ⌨️ **Hotkey** — global clean hotkey (Ctrl+F1 default)
- ⏰ **Auto-clean** — clean when usage is above a threshold, or every N minutes
- 🛡️ **Admin elevation** — automatic relaunch as administrator when needed, optional "skip UAC" scheduled task
- 💾 **Settings persistence** — INI file compatible with the classic Mem Reduct layout (`%APPDATA%\Henry++\Mem Reduct\memreduct.ini`)
- 🚀 **CLI flags** — `-clean`, `-clean:full`, `-minimized`

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Electron 33 |
| UI | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS 3 + custom design tokens (CSS variables) |
| Icons | lucide-react |
| Packaging | electron-builder (NSIS installer) |
| Cleaning engine | PowerShell + C# P/Invoke (Windows APIs) |

## Getting Started

```bash
npm install
npm run electron:dev   # launch app with hot reload
```

Build the production bundle and the Windows installer:

```bash
npm run electron:build # outputs NSIS installer to dist/
```

> **Note**: `npm` blocks postinstall scripts by default on newer versions — if `npm install` reports blocked scripts, run `npm approve-scripts electron esbuild` once.

## GitHub Actions

Pushing a tag like `v1.0.0` automatically builds the Windows installer and publishes a **GitHub Release** with the `.exe` attached. Every push to `main` also builds and uploads the installer as a build artifact.

## Cleanable Memory Regions

| Region | Bit |
|---|---|
| Working set | 0x01 |
| File cache | 0x02 |
| Modified page list | 0x10 |
| Standby list | 0x08 |
| Standby priority 0 | 0x04 |
| Modified file cache | 0x80 |
| Registry cache (Win 8.1+) | 0x40 |
| Combine lists (Win 10+) | 0x20 |

## Project Structure

```
src/
  components/   UI building blocks (TitleBar, modals, controls, toast, tour…)
  pages/        Dashboard, Statistics, Settings
  context/      Global app state (settings, stats, cleaning, tray sync)
  utils/        i18n (en/fa), formatting, tray icon drawing
  assets/       Inter & Vazirmatn fonts
scripts/        PowerShell engines (stats.ps1, clean.ps1)
main.js         Electron main process (tray, IPC, auto-clean, INI persistence)
legacy/         Original Win32/C++ source (archived)
```

## License

GPL-3.0 — this project is a UI rewrite of the open-source [Mem Reduct](https://github.com/henrypp/memreduct) concept, which is also GPL-3.0. See [LICENSE](LICENSE).
