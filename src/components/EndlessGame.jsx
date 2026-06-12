import { useState, useEffect, useCallback, useRef } from 'react';
import { useEndlessGame } from '../hooks/useEndlessGame';
import Card from './Card';
import GuessButtons from './GuessButtons';
import CategoryFilter from './CategoryFilter';
import BulbRow from './BulbRow';
import Banderitas from './Banderitas';
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

  // ── Reveal timing ──────────────────────────────────────────────
  const [revealComplete, setRevealComplete] = useState(false);
  const [susunodReady, setSusunodReady] = useState(false);

  // ── Ticket stub animation ──────────────────────────────────────
  const prevStreakRef = useRef(streak);
  const [ticketAnim, setTicketAnim] = useState(null); // 'stamp' | 'shake' | null

  // Reset reveal state each time a new question starts
  useEffect(() => {
    if (phase === 'playing') {
      setCurrentPick(null);
      setCrowdStats(null);
      setRevealComplete(false);
      setSusunodReady(false);
    }
  }, [phase]);

  // Wait for card scramble (450ms) before showing feedback
  useEffect(() => {
    if (phase !== 'revealed') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setRevealComplete(true), prefersReduced ? 0 : 450);
    return () => clearTimeout(t);
  }, [phase]);

  // After feedback appears, delay SUSUNOD by 400ms
  useEffect(() => {
    if (!revealComplete) return;
    const t = setTimeout(() => setSusunodReady(true), 400);
    return () => clearTimeout(t);
  }, [revealComplete]);

  // Ticket stamp on increment, shake on reset
  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;
    if (streak > prev) {
      setTicketAnim('stamp');
      const t = setTimeout(() => setTicketAnim(null), 200);
      return () => clearTimeout(t);
    }
    if (streak === 0 && prev > 0) {
      setTicketAnim('shake');
      const t = setTimeout(() => setTicketAnim(null), 300);
      return () => clearTimeout(t);
    }
  }, [streak]);

  useEffect(() => {
    if (phase !== 'revealed') return;

    const timers = [];
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (correct) {
      setBulbState('chasing');
      timers.push(setTimeout(() => setBulbState('idle'), 750));
      if ([5, 10, 20].includes(streak) && !noMotion) {
        setShowConfetti(true);
        timers.push(setTimeout(() => setShowConfetti(false), 2400));
      }
    } else {
      setBulbState('dark');
      timers.push(setTimeout(() => setBulbState('idle'), 750));
    }

    return () => timers.forEach(clearTimeout);
  }, [phase, correct, streak]);

  // Celebration confetti burst when landing on the gameover screen with a high streak
  useEffect(() => {
    if (phase !== 'gameover' || streak < 5) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 2400);
    return () => clearTimeout(t);
  }, [phase, streak]);

  const handleGuess = useCallback(async (direction) => {
    if (!pair) return;
    setCurrentPick(direction);
    guess(direction);
    const isCorrect = checkGuess(direction, pair.left, pair.right);
    const qId = getEndlessQuestionId(pair);
    const stats = await recordGuess(qId, direction, isCorrect);
    setCrowdStats(stats);
  }, [pair, guess]);

  const handleNext = useCallback(() => {
    next();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [next]);

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
          <div className={`ticket-stub${ticketAnim ? ` ${ticketAnim}` : ''}`}>
            <span className="ticket-label">{isPlaying ? 'streak' : 'best'}</span>
            <span className={`ticket-num${isPlaying ? '' : ' dim'}${ticketAnim === 'shake' ? ' flash-loss' : ''}`}>
              {isPlaying ? streak : best}
            </span>
          </div>
        </div>
      </header>

      <Banderitas />

      <main className="flex-1 flex flex-col items-center gap-5 p-4 max-w-[45rem] mx-auto w-full" style={{ paddingBottom: '5.5rem' }}>

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
            {/* Barker prompt — first thing the eye reads each round */}
            <p className="question-hint">Mas mataas o mas mababa ang kanan?</p>

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

            {/* Feedback — reserved space, visible only after scramble lands */}
            {phase === 'revealed' && (
              <div
                className="flex flex-col items-center gap-2"
                style={{ visibility: revealComplete ? 'visible' : 'hidden' }}
              >
                <p className={`feedback-text ${correct ? 'correct' : `wrong${revealComplete ? ' animate' : ''}`}`}>
                  {correct ? 'Tama ka! 🎉' : 'Ay! Mali! 😬'}
                </p>

                {/* Crowd stats */}
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
              </div>
            )}

            {/* Filter chips below cards — thumb-reachable zone on mobile */}
            <CategoryFilter categories={categories} enabled={enabledCats} onToggle={toggleCat} />
          </section>
        )}

        {/* ── Game over ── */}
        {phase === 'gameover' && (
          <section className="flex flex-col items-center gap-5 text-center">
            {streak < 5 ? (
              <>
                <p className="gameover-ay">AY!</p>
                <p className="label-caps" style={{ opacity: 0.42, letterSpacing: '0.38em' }}>
                  TAPOS KA NA!
                </p>
              </>
            ) : (
              <>
                <p className="label-caps" style={{ color: 'var(--yellow)', opacity: 0.88, letterSpacing: '0.28em' }}>
                  LUPIT MO!
                </p>
                <p className="gameover-hero-num">{streak}</p>
              </>
            )}
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

      {/* Fixed CTA bar — always on-screen regardless of viewport height */}
      {isPlaying && pair && (
        <div className="cta-bar">
          <div className="cta-bar-inner">
            {phase === 'playing'
              ? <GuessButtons onGuess={handleGuess} />
              : <button
                  className={`action-btn${susunodReady ? ' susunod-enter' : ' susunod-hidden'}`}
                  style={{ width: '100%' }}
                  onClick={correct ? handleNext : next}
                >
                  {correct ? 'Susunod →' : 'Tingnan ang resulta'}
                </button>
            }
          </div>
        </div>
      )}
    </div>
  );
}
