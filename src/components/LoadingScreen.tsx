import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

const PHRASES = [
  { en: 'initializing', fa: 'loading.initializing' },
  { en: 'reading', fa: 'loading.reading' },
  { en: 'calibrating', fa: 'loading.calibrating' },
  { en: 'ready', fa: 'loading.ready' },
];

export default function LoadingScreen() {
  const { lang } = useApp();
  const [progress, setProgress] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setProgress(p);
      setPhraseIdx(Math.min(PHRASES.length - 1, Math.floor(p * PHRASES.length)));
      if (p >= 1) {
        clearInterval(interval);
        setTimeout(() => setVisible(false), 500);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const phraseKey = PHRASES[phraseIdx][lang as 'en' | 'fa'] ?? PHRASES[phraseIdx].en;
  const { t } = useApp();
  const phrase = phraseKey.startsWith('loading.') ? t(phraseKey) : phraseKey;

  const pct = Math.round(progress * 100);
  const ticks = Array.from({ length: 8 }, (_, i) => i);
  const particles = [
    { left: '18%', delay: '0s', color: 'rgba(239,68,68,0.4)' },
    { left: '26%', delay: '1.2s', color: 'rgba(34,211,238,0.4)' },
    { left: '34%', delay: '2.1s', color: 'rgba(239,68,68,0.4)' },
    { left: '66%', delay: '0.6s', color: 'rgba(239,68,68,0.4)' },
    { left: '74%', delay: '1.8s', color: 'rgba(34,211,238,0.4)' },
    { left: '82%', delay: '2.6s', color: 'rgba(239,68,68,0.4)' },
  ];

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-all duration-1000 ${visible ? 'opacity-100' : 'opacity-0 scale-110'}`}
      style={{ background: 'var(--bg)', pointerEvents: 'none' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at center, color-mix(in srgb, var(--accent) 8%, transparent), transparent 65%)' }}
      />
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-1/2 w-1 h-1 rounded-full"
          style={{ left: p.left, background: p.color, animation: `particle-rise 2.8s ${p.delay} ease-out infinite` }}
        />
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-10">
        <div className="flex items-center gap-12">
          {/* left ring */}
          <div className="relative w-28 h-28">
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed"
              style={{ borderColor: 'var(--text-faint)', animation: 'ring-spin 14s linear infinite' }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ animation: 'halo-spin-slow 22s linear infinite reverse' }}
            >
              {ticks.map((i) => (
                <div
                  key={i}
                  className="absolute w-px h-3"
                  style={{
                    left: '50%',
                    top: '50%',
                    background: i < Math.ceil(pct / 12.5) ? 'var(--accent)' : 'var(--text-faint)',
                    transform: `rotate(${i * 45}deg) translateY(-46px)`,
                    boxShadow: i < Math.ceil(pct / 12.5) ? '0 0 6px var(--accent)' : 'none',
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-3 h-3 rounded-full animate-pulse-glow"
                style={{ background: 'var(--accent)' }}
              />
            </div>
          </div>

          {/* center EQ */}
          <div className="flex items-center gap-1.5 h-12">
            {[0.55, 0.85, 1, 0.85, 0.55].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full"
                style={{
                  height: `${h * 48}px`,
                  background: progress > 0.15 ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 50%, transparent)',
                  boxShadow: progress > 0.15 ? '0 0 12px var(--accent-glow)' : '0 0 8px color-mix(in srgb, var(--accent) 40%, transparent)',
                  animation: `audio-bounce 1.1s ${i * 120}ms ease-in-out infinite`,
                  transformOrigin: 'center bottom',
                }}
              />
            ))}
          </div>

          {/* right halo */}
          <div className="relative w-32 h-32" style={{ animation: 'halo-breathe 2.4s ease-in-out infinite' }}>
            <div
              className="absolute inset-0 rounded-full border border-dashed"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}
            />
            <div className="absolute inset-4 rounded-full border" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }} />
            <div className="absolute inset-10 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }} />
            <div
              className="absolute inset-0 m-auto w-3 h-3 rounded-full"
              style={{ background: 'var(--accent)', boxShadow: '0 0 20px var(--accent)' }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div
            className="font-mono font-black tabular-nums tracking-tighter"
            style={{ fontSize: 60, color: 'var(--text)', textShadow: `0 0 ${10 + progress * 10}px var(--accent)` }}
          >
            {pct}
            <span className="text-3xl" style={{ color: 'var(--accent)' }}>%</span>
          </div>
          <div className="flex items-center gap-1 h-5">
            <span
              key={phraseIdx}
              className="text-xs font-mono uppercase tracking-[0.35em]"
              style={{ color: 'var(--accent)', animation: 'phrase-in 0.5s ease-out both' }}
            >
              {phrase}
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--cyan)', animation: 'cursor-blink 0.9s steps(1) infinite' }}>
              ▍
            </span>
          </div>
        </div>

        <div className="w-64 h-[3px] rounded-full" style={{ background: 'color-mix(in srgb, var(--text) 8%, transparent)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'var(--accent)',
              boxShadow: '0 0 8px var(--accent)',
              transition: 'width 100ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}