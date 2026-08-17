import React, { useState } from 'react';
import { Snowflake, ShieldAlert } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { ModernCheckbox } from './controls';

export default function FreezeWarningModal() {
  const { t, setBool, freezeWarning, setFreezeWarning } = useApp();
  const [dontAsk, setDontAsk] = useState(false);
  const open = freezeWarning !== null;

  const respond = (allow: boolean) => {
    if (allow && freezeWarning?.onAllow) freezeWarning.onAllow();
    window.memReduct.regionWarningResponse({ allow, dontAskAgain: dontAsk });
    setFreezeWarning(null);
    setDontAsk(false);
  };

  return (
    <Modal
      open={open}
      onClose={() => respond(false)}
    >
      <div className="flex flex-col items-center text-center">
        {/* icon with halo rings */}
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-2xl opacity-20" style={{ background: 'var(--amber)' }} />
          <span className="absolute -inset-2 rounded-3xl" style={{ background: 'color-mix(in srgb, var(--amber) 14%, transparent)', filter: 'blur(14px)', animation: 'halo-breathe 2.4s ease-in-out infinite' }} />
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, var(--amber), #f97316)', boxShadow: '0 0 28px rgba(245,158,11,0.55)' }}
          >
            <Snowflake size={28} className="text-white" />
          </div>
        </div>

        <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{t('dialogs.freezeTitle')}</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{t('dialogs.freezeText')}</p>

        <div className="mt-5 flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: 'color-mix(in srgb, var(--amber) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--amber) 25%, transparent)' }}>
          <ShieldAlert size={14} style={{ color: 'var(--amber)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>{t('dialogs.freezeHint')}</span>
        </div>

        <div className="mt-6 flex w-full items-center justify-center">
          <ModernCheckbox
            label={t('dialogs.dontAskAgain')}
            checked={dontAsk}
            onChange={(v) => { setDontAsk(v); if (v) setBool('IsShowWarningConfirmation', false); }}
          />
        </div>

        <div className="mt-7 flex w-full justify-center gap-3">
          <button
            onClick={() => respond(false)}
            className="rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
            style={{ color: 'var(--text-dim)', background: 'color-mix(in srgb, var(--surface) 60%, transparent)', border: '1px solid var(--border)' }}
          >
            {t('confirm.no')}
          </button>
          <button
            onClick={() => respond(true)}
            className="relative min-w-[140px] overflow-hidden rounded-xl px-7 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.04] active:scale-95"
            style={{ background: 'linear-gradient(90deg, var(--amber), #f97316)', boxShadow: '0 0 24px rgba(245,158,11,0.5)' }}
          >
            <span className="absolute inset-0 animate-gradient-x" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)', backgroundSize: '200% 100%' }} />
            <span className="relative">{t('confirm.yes')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
