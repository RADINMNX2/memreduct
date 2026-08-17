import React, { useEffect, useMemo, useState } from 'react';
import { Zap, BarChart3, Settings as SettingsIcon, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Step {
  title: string;
  text: string;
  target: () => HTMLElement | null;
}

export default function TourOverlay({ onDone }: { onDone: () => void }) {
  const { t, isRTL, settings, setSetting, setPage } = useApp();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const steps: Step[] = useMemo(() => [
    {
      title: t('tour.step1Title'),
      text: t('tour.step1Text'),
      target: () => document.querySelector('[data-tour="logo"]') as HTMLElement | null,
    },
    {
      title: t('tour.step2Title'),
      text: t('tour.step2Text'),
      target: () => document.querySelector('[data-tour="clean"]') as HTMLElement | null,
    },
    {
      title: t('tour.step3Title'),
      text: t('tour.step3Text'),
      target: () => document.querySelector('[data-tour="stats"]') as HTMLElement | null,
    },
    {
      title: t('tour.step4Title'),
      text: t('tour.step4Text'),
      target: () => document.querySelector('[data-tour="settings"]') as HTMLElement | null,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  useEffect(() => {
    const el = steps[step]?.target();
    setTargetRect(el ? el.getBoundingClientRect() : null);
  }, [step, steps, mounted]);

  useEffect(() => {
    const onResize = () => {
      const el = steps[step]?.target();
      setTargetRect(el ? el.getBoundingClientRect() : null);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [step, steps]);

  const finish = () => {
    setSetting('TourSeen', '1');
    onDone();
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  const isLast = step === steps.length - 1;
  const rect = targetRect;

  // spotlight hole
  const hole = rect
    ? `M0 0 H${window.innerWidth} V${window.innerHeight} H0 Z M${Math.max(0, rect.x - 8)} ${Math.max(0, rect.y - 8)} h${Math.min(rect.width + 16, window.innerWidth)} v${rect.height + 16} h${-Math.min(rect.width + 16, window.innerWidth)} z`
    : '';

  // card position: above target if target in lower half
  const cardW = 320;
  const cardX = rect ? Math.min(Math.max(20, rect.x + rect.width / 2 - cardW / 2), window.innerWidth - cardW - 20) : 20;
  const placeAbove = rect ? rect.y > window.innerHeight / 2 : true;
  const cardY = rect ? (placeAbove ? rect.y - 16 - 200 : rect.y + rect.height + 16) : 100;

  return (
    <div className="fixed inset-0 z-[9999]" onClick={next}>
      {rect && (
        <svg className="absolute inset-0 h-full w-full">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <path d={hole} fill="black" fillRule="evenodd" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" style={{ backdropFilter: 'blur(2px)' }} />
        </svg>
      )}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl border-2 transition-all duration-500"
          style={{
            left: rect.x - 8,
            top: rect.y - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderColor: 'var(--accent)',
            boxShadow: '0 0 30px var(--accent-glow)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      )}

      {/* card */}
      <div
        className="absolute w-80 animate-slide-up"
        style={{
          left: cardX,
          top: Math.max(10, cardY),
          background: 'var(--card-solid)',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          borderRadius: '1rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-[40px]" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }} />
        <div className="relative p-6">
          <div className="mb-1 text-xs font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            {step + 1} / {steps.length}
          </div>
          <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--text)' }}>{steps[step].title}</h3>
          <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{steps[step].text}</p>
          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-lg p-2 transition-colors"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
                {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={next}
              className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-black shadow-lg transition-all hover:bg-gray-200 active:scale-95"
            >
              {isLast ? t('confirm.close') : t('confirm.next')}
            </button>
          </div>
        </div>
      </div>

      {/* skip */}
      <button
        onClick={(e) => { e.stopPropagation(); finish(); }}
        className="fixed top-6 z-[10000] flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
        style={{
          [isRTL ? 'left' : 'right']: 24,
          background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-dim)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <X size={13} />
        {t('confirm.skip')}
      </button>
    </div>
  );
}