import React, { useEffect, useState } from 'react';
import { DownloadCloud, Sparkles } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';

export default function UpdateModal() {
  const { t, updateInfo, setUpdateInfo } = useApp();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (updateInfo?.available && !dismissed) {
      // show automatically once
    }
  }, [updateInfo, dismissed]);

  if (!updateInfo || !updateInfo.available || dismissed) return null;

  return (
    <Modal
      open
      onClose={() => { setDismissed(true); setUpdateInfo(null); }}
      title={t('dialogs.updateTitle')}
      icon={<Sparkles size={20} />}
      accent="var(--green)"
    >
      <div className="mb-2 flex items-center gap-2">
        <DownloadCloud size={18} style={{ color: 'var(--green)' }} />
        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {t('dialogs.updateNewVersion')}{' '}
          <span className="font-mono font-bold" style={{ color: 'var(--green)' }}>v{updateInfo.version}</span>
        </span>
      </div>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-faint)' }}>{t('dialogs.updateDownload')}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => { setDismissed(true); setUpdateInfo(null); }}
          className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80 active:scale-95"
          style={{ color: 'var(--text-dim)', background: 'color-mix(in srgb, var(--surface) 60%, transparent)', border: '1px solid var(--border)' }}
        >
          {t('confirm.no')}
        </button>
        <button
          onClick={() => { if (updateInfo.url) window.memReduct.openExternal(updateInfo.url); setDismissed(true); setUpdateInfo(null); }}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95"
          style={{ background: 'linear-gradient(90deg, var(--green), #34d399)', boxShadow: '0 0 20px rgba(16,185,129,0.5)' }}
        >
          {t('confirm.yes')}
        </button>
      </div>
    </Modal>
  );
}