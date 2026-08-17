import React, { useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { REGIONS } from '../constants';
import { ModernCheckbox } from './controls';

export default function ConfirmCleanModal() {
  const { t, settings, confirmCleanOpen, setConfirmCleanOpen, pendingConfirmMask, setPendingConfirmMask, runClean, setBool, cleaning } = useApp();
  const [dontAsk, setDontAsk] = useState(false);
  if (!settings) return null;

  const mask = pendingConfirmMask ?? (parseInt(settings.ReductMask2, 10) || 0xe7);
  const selected = REGIONS.filter((r) => (mask & r.bit) !== 0 && r.supported !== false);

  const onConfirm = () => {
    setConfirmCleanOpen(false);
    const m = pendingConfirmMask;
    setPendingConfirmMask(null);
    void runClean(m ?? mask, { confirm: false });
  };

  return (
    <Modal
      open={confirmCleanOpen}
      onClose={() => { setConfirmCleanOpen(false); setPendingConfirmMask(null); }}
      closable={!cleaning}
    >
      <div className="flex flex-col items-center text-center">
        {/* icon with halo rings */}
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-2xl opacity-20" style={{ background: 'var(--accent)' }} />
          <span className="absolute -inset-2 rounded-3xl" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', filter: 'blur(14px)', animation: 'halo-breathe 2.4s ease-in-out infinite' }} />
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 0 28px var(--accent-glow)', animation: 'ring-spin 10s linear infinite' }}
          >
            <Zap size={28} className="text-white" />
          </div>
        </div>

        <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{t('dialogs.confirmCleanTitle')}</h2>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t('dialogs.confirmCleanText')}</p>

        {/* region chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {selected.map((r, i) => (
            <span
              key={r.key}
              className="page-stagger animate-scale-in rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                boxShadow: '0 0 10px color-mix(in srgb, var(--accent) 12%, transparent)',
                animationDelay: `${i * 45}ms`,
              }}
            >
              {t(`regions.${r.key}`)}
            </span>
          ))}
        </div>

        <div className="mt-6 flex w-full items-center justify-center">
          <ModernCheckbox
            label={t('dialogs.dontAskAgain')}
            checked={dontAsk}
            onChange={(v) => { setDontAsk(v); if (v) setBool('IsShowReductConfirmation', false); }}
          />
        </div>

        <div className="mt-7 flex w-full justify-center gap-3">
          <button
            onClick={() => { setConfirmCleanOpen(false); setPendingConfirmMask(null); }}
            disabled={cleaning}
            className="rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-40"
            style={{ color: 'var(--text-dim)', background: 'color-mix(in srgb, var(--surface) 60%, transparent)', border: '1px solid var(--border)' }}
          >
            {t('confirm.no')}
          </button>
          <button
            onClick={onConfirm}
            disabled={cleaning}
            className="relative flex min-w-[140px] items-center justify-center gap-2 overflow-hidden rounded-xl px-7 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.04] active:scale-95 disabled:opacity-80"
            style={{
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
              backgroundSize: '200% 100%',
              boxShadow: '0 0 24px var(--accent-glow)',
            }}
          >
            <span className="absolute inset-0 animate-gradient-x" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)', backgroundSize: '200% 100%' }} />
            {cleaning ? <span className="mr-spinner relative h-4 w-4" /> : <Sparkles size={15} className="relative" />}
            <span className="relative">{cleaning ? t('confirm.cleaning') : t('confirm.yes')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
