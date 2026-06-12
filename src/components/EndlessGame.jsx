import { useState, useEffect, useCallback } from 'react';
import { useEndlessGame } from '../hooks/useEndlessGame';
import Card from './Card';
import GuessButtons from './GuessButtons';
import CategoryFilter from './CategoryFilter';
import BulbRow from './BulbRow';
import Confetti from './Confetti';
import { checkGuess } from '../utils/gameLogic';
import { getEndlessQuestionId, recordGuess } from '../utils/stats';

export default function EndlessGame({ categories, onHome }) {
  const { game, enabledCats, start, guess, next, toggleCat } = useEndlessGame(categories);
  const { phase, pair, streak, best, correct } = game;

  const [bulbState, setBulbState] = useState('idle');
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Crowd stats (post-reveal) ──────────────────────────────────
  const [currentPick, setCurrentPick] = useState(null);
  const [crowdStats, setCrowdStats] = useState(null);

  // Reset when a new question starts
  useEffect(() => {
    if (phase === 'playing') {
      setCurrentPick(null);
      setCrowdStats(null);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'revealed') return;

    const timers = [];

    if (correct) {
      setBulbState('chasing');
      timers.push(setTimeout(() => setBulbState('idle'), 750));
      if ([5, 10, 20].includes(streak)) {
        setShowConfetti(true);
        timers.push(setTimeout(() => setShowConfetti(false), 2400));
      }
    } else {
      setBulbState('dark');
      timers.push(setTimeout(() => setBulbState('idle'), 750));
    }

    return () => timers.forEach(clearTimeout);
  }, [phase, correct, streak]);

  // Intercept guess to capture pick + fire stats transaction
  const handleGuess = useCallback(async (direction) => {
    if (!pair) return;
    setCurrentPick(direction);
    guess(direction);
    const isCorrect = checkGuess(direction, pair.left, pair.right);
    const qId = getEndlessQuestionId(pair);
    const stats = await recordGuess(qId, direction, isCorrect);
    setCrowdStats(stats);
  }, [pair, guess]);

  const isPlaying = phase === 'playing' || phase === 'revealed';

  return (
    <div className="min-h-screen flex flex-col">
      <Confetti active={showConfetti} />

      <header className="perya-header">
        <BulbRow state={bulbState} count={32} />
        <div className="flex items-center justify-between px-4 py-2">
          <button className="nav-back" onClick={onHome}>← Umuwi</button>
          <span
            className="f-bungee"
            style={{ color: 'var(--yellow)', fontSize: '0.82rem', letterSpacing: '0.14em' }}
          >
            ENDLESS
          </span>
          <div className="ticket-stub">
            <span className="ticket-label">{isPlaying ? 'streak' : 'best'}</span>
            <span className={`ticket-num${isPlaying ? '' : ' dim'}`}>
              {isPlaying ? streak : best}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-5 p-4 max-w-2xl mx-auto w-full">

        {/* ── Idle ── */}
        {phase === 'idle' && (
          <section className="flex flex-col items-center gap-6 w-full">
            <p className="label-caps" style={{ opacity: 0.5, letterSpacing: '0.3em', fontSize: '0.72rem' }}>
              Piliin ang kategorya
            </p>
            <CategoryFilter categories={categories} enabled={enabledCats} onToggle={toggleCat} />
            <button
              className="action-btn"
              style={{ fontSize: '1.05rem', padding: '0.75rem 2.5rem' }}
              onClick={start}
            >
              Simulan!
            </button>
          </section>
        )}

        {/* ── Playing / Revealed ── */}
        {isPlaying && pair && (
          <section className="flex flex-col gap-4 w-full">
            <CategoryFilter categories={categories} enabled={enabledCats} onToggle={toggleCat} />

            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <Card item={pair.left} />
              <div className="flex items-center justify-center self-center shrink-0 py-2">
                <span className="vs-badge">VS</span>
              </div>
              <Card
                item={pair.right}
                hidden={phase === 'playing'}
                result={
                  phase === 'revealed' ? (correct ? 'correct' : 'wrong') : undefined
                }
              />
            </div>

            <p className="question-hint">Mas mataas o mas mababa ang kanan?</p>

            <GuessButtons onGuess={handleGuess} disabled={phase === 'revealed'} />

            {phase === 'revealed' && (
              <div className="flex flex-col items-center gap-2">
                <p className={`feedback-text ${correct ? 'correct' : 'wrong'}`}>
                  {correct ? 'Tama ka! 🎉' : 'Ay! Mali! 😬'}
                </p>

                {/* Crowd stats — min-height prevents button from jumping */}
                <div style={{ minHeight: '1.5rem' }}>
                  {crowdStats !== null && (
                    crowdStats.total < 5
                      ? <p className="crowd-line">Ikaw ang unang tumaya!</p>
                      : (
                        <p className="crowd-line">
                          {Math.round(
                            (currentPick === 'taas' ? crowdStats.taas : crowdStats.baba)
                            / crowdStats.total * 100
                          )}% ng bayan pumili ng {currentPick === 'taas' ? 'TAAS' : 'BABA'}
                          &nbsp;·&nbsp;{crowdStats.total} tumaya
                        </p>
                      )
                  )}
                </div>

                <button className="action-btn" onClick={next}>
                  {correct ? 'Susunod →' : 'Tingnan ang resulta'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Game over ── */}
        {phase === 'gameover' && (
          <section className="flex flex-col items-center gap-5 text-center">
            <p className="label-caps" style={{ opacity: 0.42, letterSpacing: '0.38em' }}>
              tapos ka na!
            </p>
            <h2 className="gameover-title">
              Walang<br />Iyakan!
            </h2>
            <div className="flex gap-10">
              <div className="text-center">
                <p className="gameover-stat-label">Streak mo</p>
                <p className="gameover-num">{streak}</p>
              </div>
              <div className="text-center">
                <p className="gameover-stat-label">Pinakamataas</p>
                <p className="gameover-num dim">{best}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className="action-btn" onClick={start}>Ulit!</button>
              <button className="ghost-btn" onClick={onHome}>Umuwi</button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
