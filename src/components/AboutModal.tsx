import React, { useState } from 'react';
import { Info, Heart, ExternalLink, Github } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';

export default function AboutModal() {
  const { t, aboutOpen, setAboutOpen, settings, checkUpdates, updateInfo } = useApp();
  const [showThanks, setShowThanks] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!settings) return null;

  const onCheck = async () => {
    setChecking(true);
    await checkUpdates();
    setChecking(false);
  };

  return (
    <Modal
      open={aboutOpen}
      onClose={() => setAboutOpen(false)}
      title={t('dialogs.aboutTitle')}
      icon={<Info size={20} />}
      accent="var(--accent)"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 0 30px var(--accent-glow)' }}
        >
          <span className="text-2xl font-black text-white">MR</span>
        </div>
        <div>
          <div className="text-xl font-black tracking-wide">
            <span className="neon-text">Mem</span> Reduct
          </div>
          <div className="mt-1 text-sm font-mono" style={{ color: 'var(--text-dim)' }}>
            {t('dialogs.aboutVersion', { v: settings.version })}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>
            {t('dialogs.aboutCopyright')}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.memReduct.openExternal('https://github.com/RADINMNX2/memreduct')}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}
          >
            <Github size={15} />
            {t('dialogs.aboutWebsite')}
          </button>
          <button
            onClick={() => setShowThanks(!showThanks)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{ background: 'color-mix(in srgb, var(--green) 12%, transparent)', color: 'var(--green)', border: '1px solid color-mix(in srgb, var(--green) 25%, transparent)' }}
          >
            <Heart size={15} />
            {t('dialogs.aboutGiveThanks')}
          </button>
          <button
            onClick={() => void onCheck()}
            disabled={checking}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{ background: 'color-mix(in srgb, var(--cyan) 12%, transparent)', color: 'var(--cyan)', border: '1px solid color-mix(in srgb, var(--cyan) 25%, transparent)', opacity: checking ? 0.6 : 1 }}
          >
            <ExternalLink size={15} />
            {checking ? t('dialogs.updateChecking') : t('dialogs.aboutCheckUpdates')}
          </button>
        </div>

        {showThanks && (
          <div className="w-full rounded-2xl p-4 text-left animate-scale-in" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="mb-2 text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              {t('dialogs.aboutGiveThanks')}
            </div>
            <div className="space-y-1.5 font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
              <div>BTC: bc1q8d5y2q3k4v8m0x9n7t5r2w6j4p1c0h9a3b5e7f</div>
              <div>ETH: 0x8D5A2F3B6C9E1D4A7B5C8E2F9A3D6B1C4E7F9A2D</div>
              <div>PayPal: https://paypal.me/radinmnx2</div>
            </div>
          </div>
        )}

        {updateInfo && (
          <div className="w-full rounded-2xl p-4 text-left animate-scale-in" style={{ background: updateInfo.error ? 'color-mix(in srgb, var(--amber) 8%, transparent)' : 'var(--accent-soft)', border: '1px solid var(--border)' }}>
            {updateInfo.error && <div className="text-xs" style={{ color: 'var(--amber)' }}>{t('dialogs.updateError')}</div>}
            {!updateInfo.error && updateInfo.available && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {t('dialogs.updateNewVersion')} <span className="font-bold" style={{ color: 'var(--accent)' }}>v{updateInfo.version}</span>
                </div>
                <button
                  onClick={() => updateInfo.url && window.memReduct.openExternal(updateInfo.url)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
                >
                  {t('dialogs.updateDownload')}
                </button>
              </div>
            )}
            {!updateInfo.error && !updateInfo.available && (
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{t('dialogs.updateNone')}</div>
            )}
          </div>
        )}

        <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          GPL-3.0 · Neon UI rebuild
        </div>
      </div>
    </Modal>
  );
}