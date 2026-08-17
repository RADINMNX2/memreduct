import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  icon,
  accent,
  children,
  maxWidth = 'max-w-md',
  closable = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
  maxWidth?: string;
  closable?: boolean;
}) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (!closable) return;
    setClosing(true);
    setTimeout(onClose, 160);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in" style={{ background: 'color-mix(in srgb, var(--bg-deep) 80%, transparent)', backdropFilter: 'blur(8px)' }} onClick={handleClose} />
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-3xl shadow-2xl ${closing ? 'animate-modal-out' : 'animate-scale-in'}`}
        style={{
          background: 'var(--card-solid)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="absolute left-0 right-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${accent || 'var(--accent)'}, var(--accent-2), ${accent || 'var(--accent)'})`, boxShadow: `0 0 12px ${accent || 'var(--accent-glow)'}` }}
        />
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full blur-[80px]" style={{ background: `color-mix(in srgb, ${accent || 'var(--accent)'} 10%, transparent)` }} />
        <div className="relative z-10 p-8">
          {closable && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-lg p-2 transition-all hover:scale-110 hover:rotate-90 active:scale-90"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--surface) 80%, transparent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <X size={20} />
            </button>
          )}
          {(title || icon) && (
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${accent || 'var(--accent)'} 12%, transparent)`, color: accent || 'var(--accent)' }}>
                    {icon}
                  </div>
                )}
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}