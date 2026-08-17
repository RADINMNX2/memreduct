import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import LoadingScreen from './components/LoadingScreen';
import TitleBar from './components/TitleBar';
import Toast from './components/Toast';
import ConfirmCleanModal from './components/ConfirmCleanModal';
import FreezeWarningModal from './components/FreezeWarningModal';
import AboutModal from './components/AboutModal';
import UpdateModal from './components/UpdateModal';
import TourOverlay from './components/TourOverlay';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

export default function App() {
  const { loading, page, settings, stats, lastResult, setPage } = useApp();
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [displayPage, setDisplayPage] = useState(page);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (settings && settings.TourSeen !== '1') {
      const timer = setTimeout(() => setShowTour(true), 1400);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  useEffect(() => {
    if (page === displayPage) return;
    setTransitionPhase('exit');
    const t1 = setTimeout(() => {
      setDisplayPage(page);
      setTransitionPhase('enter');
    }, 160);
    const t2 = setTimeout(() => setTransitionPhase('idle'), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const shellClass =
    transitionPhase === 'exit' ? 'page-exit' : transitionPhase === 'enter' ? 'page-enter' : 'page-active';

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden border border-[color:var(--border)] rounded-lg"
      style={{ background: 'var(--bg)' }}
    >
      <TitleBar />
      <main
        className="relative flex-1 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg) 98%, var(--accent) 2%), var(--bg) 40%)' }}
      >
        {transitionPhase !== 'idle' && <div className="page-glow-sweep" />}
        {transitionPhase !== 'idle' && <div className="page-indicator" />}
        <div key={displayPage} className={`page-shell ${shellClass}`}>
          {displayPage === 'dashboard' && <Dashboard />}
          {displayPage === 'statistics' && <Statistics />}
          {displayPage === 'settings' && <Settings />}
        </div>
      </main>

      {loading && <LoadingScreen />}
      <Toast />
      <ConfirmCleanModal />
      <FreezeWarningModal />
      <AboutModal />
      <UpdateModal />
      {showTour && <TourOverlay onDone={() => setShowTour(false)} />}
    </div>
  );
}