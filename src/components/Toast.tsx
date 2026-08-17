import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (toast) {
      setMsg(toast);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3600);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-8 z-[200] flex w-full justify-center"
      style={{ left: 0, right: 0 }}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl px-6 py-3.5 transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{
          background: 'var(--card-solid)',
          border: '1px solid var(--border-strong)',
          borderLeft: '3px solid var(--accent)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 20px color-mix(in srgb, var(--accent) 20%, transparent)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{msg}</span>
      </div>
    </div>
  );
}