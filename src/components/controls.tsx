import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

// ================= Toggle =================
export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`mr-toggle ${on ? 'on' : 'off'} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
      aria-pressed={on}
    >
      <span className="knob" />
    </button>
  );
}

// ================= SettingRow (label + control) =================
export function SettingRow({
  label,
  hint,
  children,
  disabled,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2.5 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
        {hint && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ================= CheckboxRow =================
export function CheckboxRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <SettingRow label={label} hint={hint} disabled={disabled}>
      <Toggle on={checked} onChange={onChange} disabled={disabled} />
    </SettingRow>
  );
}

// ================= Select =================
export function Select<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select className="mr-select" value={String(value)} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
      ))}
    </select>
  );
}

// ================= NumberField with slider =================
export function NumberField({
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        className="mr-slider w-40"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ accentColor: 'var(--accent)' }}
      />
      <input
        type="number"
        className="mr-input w-20 text-right font-mono tabular-nums"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
      />
    </div>
  );
}

// ================= ModernCheckbox =================
export function ModernCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`mr-check ${disabled ? 'opacity-40' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="box">
        <svg viewBox="0 0 24 24">
          <path d="M4.5 12.5l5 5 10-11" />
        </svg>
      </span>
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</span>
    </label>
  );
}

// ================= HotkeyInput =================
export function HotkeyInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [capturing, setCapturing] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const { t } = useApp();

  useEffect(() => {
    if (!capturing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setCapturing(false);
        return;
      }
      const mods: string[] = [];
      if (e.ctrlKey) mods.push('Ctrl');
      if (e.altKey) mods.push('Alt');
      if (e.shiftKey) mods.push('Shift');
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key === ' ' ? 'Space' : e.key.replace('Arrow', '');
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        onChange([...mods, key].join('+'));
        setCapturing(false);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [capturing, onChange]);

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={() => setCapturing(true)}
      className={`mr-input w-44 text-center font-mono text-sm ${capturing ? '' : ''}`}
      style={{
        borderColor: capturing ? 'var(--accent)' : undefined,
        boxShadow: capturing ? '0 0 14px var(--accent-glow)' : undefined,
        animation: capturing ? 'pulse-glow 1.2s ease-in-out infinite' : undefined,
      }}
    >
      {capturing ? t('settings.clickToSetHotkey') : value}
    </button>
  );
}

// ================= ColorSwatchPicker =================
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const presets = ['#FFFFFF', '#008040', '#FF8040', '#EC1C24', '#000000', '#FFD700', '#00BFFF', '#FF69B4', '#32CD32', '#8B00FF'];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all active:scale-95"
        style={{ background: 'var(--card-solid)', border: '1px solid var(--border-strong)' }}
      >
        <span className="h-5 w-5 rounded-md" style={{ background: value, boxShadow: `0 0 8px ${value}80` }} />
        <span className="font-mono text-xs uppercase" style={{ color: 'var(--text-dim)' }}>{value}</span>
      </button>
      {show && (
        <div
          className="absolute z-50 mt-2 w-48 rounded-2xl p-3 animate-scale-in"
          style={{
            background: 'var(--card-solid)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            ...(document.documentElement.dir === 'rtl' ? { left: 0 } : { right: 0 }),
          }}
        >
          <div className="mb-2 text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</div>
          <div className="grid grid-cols-5 gap-2">
            {presets.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setShow(false); }}
                className="h-6 w-6 rounded-lg transition-all hover:scale-125"
                style={{ background: c, boxShadow: value.toLowerCase() === c.toLowerCase() ? `0 0 10px ${c}` : `0 0 4px ${c}60` }}
              />
            ))}
          </div>
          <input
            type="text"
            className="mr-input mt-2 w-full font-mono uppercase"
            value={value}
            onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v); }}
          />
        </div>
      )}
    </div>
  );
}