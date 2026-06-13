import { useState, useEffect } from 'react';
import EndlessGame from './components/EndlessGame';
import DailyGame from './components/DailyGame';
import BulbRow from './components/BulbRow';
import categoriesData from './data/taas-o-baba-dataset.json';
import { getDayNumber, getTodayString } from './utils/gameLogic';
import { seedDayIfEmpty } from './utils/stats';
import { useLang } from './i18n/strings';
import { initAudio, isMuted, toggleMute as sfxToggleMute } from './audio/sfx';

const { categories } = categoriesData;

export default function App() {
  const [mode, setMode] = useState(null);
  const { lang, t, setLang } = useLang();
  const [muted, setMuted] = useState(isMuted);

  const handleMuteToggle = () => {
    initAudio();
    setMuted(sfxToggleMute());
  };

  useEffect(() => {
    seedDayIfEmpty(getDayNumber(getTodayString()));
  }, []);

  if (mode === 'endless') {
    return <EndlessGame categories={categories} onHome={() => setMode(null)} />;
  }
  if (mode === 'daily') {
    return <DailyGame categories={categories} onHome={() => setMode(null)} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      {/* Painted marquee sign */}
      <div className="perya-sign w-full max-w-sm overflow-hidden">
        <BulbRow count={30} />
        <div className="px-5 py-5 text-center">
          <h1
            className="f-bungee"
            style={{
              fontSize: 'clamp(2.2rem, 8vw, 3rem)',
              color: 'var(--cream)',
              textShadow: '3px 3px 0 rgba(0,0,0,0.45)',
              letterSpacing: '0.03em',
              lineHeight: 1.1,
            }}
          >
            TAYA!
          </h1>
          <p
            className="label-caps mt-2"
            style={{ color: 'var(--yellow)', opacity: 0.92, letterSpacing: '0.28em' }}
          >
            {t('subtitle')}
          </p>
        </div>
        <BulbRow count={30} />
      </div>

      {/* Mode selection */}
      <nav className="flex flex-col gap-3 w-full max-w-xs">
        <button className="home-btn" onClick={() => { initAudio(); setMode('daily'); }}>
          {t('modeDaily')}
        </button>
        <button className="home-btn" onClick={() => { initAudio(); setMode('endless'); }}>
          {t('modeEndless')}
        </button>
      </nav>

      {/* Language toggle + mute */}
      <div className="flex gap-2 justify-center items-center">
        <button className="lang-btn" aria-pressed={lang === 'tl'} onClick={() => setLang('tl')}>
          TAGALOG
        </button>
        <button className="lang-btn" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
          ENGLISH
        </button>
        <button
          className="mute-btn"
          onClick={handleMuteToggle}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-pressed={muted}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </main>
  );
}
