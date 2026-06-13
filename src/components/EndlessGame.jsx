import { useState, useEffect, useCallback, useRef } from 'react';
import { useEndlessGame } from '../hooks/useEndlessGame';
import Card from './Card';
import GuessButtons from './GuessButtons';
import CategoryFilter from './CategoryFilter';
import BulbRow from './BulbRow';
import Banderitas from './Banderitas';
import Confetti from './Confetti';
import { useLang } from '../i18n/strings';
import { checkGuess } from '../utils/gameLogic';
import { pickBarkerLine } from '../data/barkerLines';
import {
  initAudio, isMuted, toggleMute as sfxToggleMute,
  playPress, playReveal, playCorrect, playWrong, playMilestone,
  playGameoverLow, playGameoverHigh,
} from '../audio/sfx';
import { getEndlessQuestionId, recordGuess } from '../utils/stats';

export default function EndlessGame({ categories, onHome }) {
  const { lang, t } = useLang();
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
  const [ticketAnim, setTicketAnim] = useState(null);

  // ── Barker lines ───────────────────────────────────────────────
  const [barkerLine, setBarkerLine] = useState('');

  // ── Mute toggle ────────────────────────────────────────────────
  const [muted, setMuted] = useState(isMuted);
  const handleMuteToggle = useCallback(() => {
    initAudio();
    setMuted(sfxToggleMute());
  }, []);

  // Reset reveal state each time a new question starts
  useEffect(() => {
    if (phase === 'playing') {
      setCurrentPick(null);
      setCrowdStats(null);
      setRevealComplete(false);
      setSusunodReady(false);
      setBarkerLine('');
    }
  }, [phase]);

  // Wait for card scramble (450ms) before showing feedback
  useEffect(() => {
    if (phase !== 'revealed') return;
    playReveal();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setRevealComplete(true), prefersReduced ? 0 : 450);
    return () => clearTimeout(timer);
  }, [phase]);

  // After feedback appears, play sound and delay Next button by 400ms
  useEffect(() => {
    if (!revealComplete) return;
    if (correct) {
      if (![5, 10, 20].includes(streak)) playCorrect(); // milestone already fired with confetti
    } else {
      playWrong();
    }
    const timer = setTimeout(() => setSusunodReady(true), 400);
    return () => clearTimeout(timer);
  }, [revealComplete, correct, streak]);

  // Ticket stamp on increment, shake on reset
  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;
    if (streak > prev) {
      setTicketAnim('stamp');
      const timer = setTimeout(() => setTicketAnim(null), 200);
      return () => clearTimeout(timer);
    }
    if (streak === 0 && prev > 0) {
      setTicketAnim('shake');
      const timer = setTimeout(() => setTicketAnim(null), 300);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  useEffect(() => {
    if (phase !== 'revealed') return;
    const timers = [];
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (correct) {
      setBulbState('chasing');
      timers.push(setTimeout(() => setBulbState('idle'), 750));
      if ([5, 10, 20].includes(streak)) {
        playMilestone(); // audio is independent of motion preference
        if (!noMotion) {
          setShowConfetti(true);
          timers.push(setTimeout(() => setShowConfetti(false), 2400));
        }
      }
    } else {
      setBulbState('dark');
      timers.push(setTimeout(() => setBulbState('idle'), 750));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, correct, streak]);

  // Gameover: confetti + sound, branched by streak
  useEffect(() => {
    if (phase !== 'gameover') return;
    if (streak >= 5) {
      playGameoverHigh();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 2400);
        return () => clearTimeout(timer);
      }
    } else {
      playGameoverLow();
    }
  }, [phase, streak]);

  const handleGuess = useCallback(async (direction) => {
    if (!pair) return;
    initAudio();
    playPress();
    setCurrentPick(direction);
    const isCorrect = checkGuess(direction, pair.left, pair.right);
    const newStreak = isCorrect ? streak + 1 : 0;
    let pool;
    if (isCorrect) {
      if ([5, 10, 20].includes(newStreak)) pool = 'milestone';
      else if (newStreak >= 5) pool = 'correctHigh';
      else pool = 'correctLow';
    } else {
      pool = streak >= 5 ? 'wrongHigh' : 'wrongLow';
    }
    setBarkerLine(pickBarkerLine(pool, lang, pool === 'milestone' ? newStreak : undefined));
    guess(direction);
    const qId = getEndlessQuestionId(pair);
    const stats = await recordGuess(qId, direction, isCorrect);
    setCrowdStats(stats);
  }, [pair, guess, streak, lang]);

  const handleNext = useCallback(() => {
    next();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [next]);

  const isPlaying = phase === 'playing' || phase === 'revealed';
  const goTitle = t('gameoverTitle'); // ['Walang', 'Iyakan!'] or ['No', 'Crying!']

  return (
    <div className="min-h-screen flex flex-col">
      <Confetti active={showConfetti} />

      <header className="perya-header">
        <BulbRow state={bulbState} count={32} />
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <button className="nav-back" onClick={onHome}>{t('goHome')}</button>
            <button
              className="mute-btn"
              onClick={handleMuteToggle}
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
              aria-pressed={muted}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
          <span
            className="f-bungee"
            style={{ color: 'var(--yellow)', fontSize: '0.82rem', letterSpacing: '0.14em' }}
          >
            ENDLESS
          </span>
          <div className={`ticket-stub${ticketAnim ? ` ${ticketAnim}` : ''}`}>
            <span className="ticket-label">{isPlaying ? t('ticketStreak') : t('ticketBest')}</span>
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
              {t('pickCategory')}
            </p>
            <CategoryFilter categories={categories} enabled={enabledCats} onToggle={toggleCat} />
            <button
              className="action-btn"
              style={{ fontSize: '1.05rem', padding: '0.75rem 2.5rem' }}
              onClick={start}
            >
              {t('startBtn')}
            </button>
          </section>
        )}

        {/* ── Playing / Revealed ── */}
        {isPlaying && pair && (
          <section className="flex flex-col gap-4 w-full">
            {/* Barker prompt */}
            <p className="question-hint">{t('questionHint')}</p>

            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <Card item={pair.left} />
              <div className="flex items-center justify-center self-center shrink-0 py-2">
                <span className="vs-badge">VS</span>
              </div>
              <Card
                item={pair.right}
                hidden={phase === 'playing'}
                result={phase === 'revealed' ? (correct ? 'correct' : 'wrong') : undefined}
              />
            </div>

            {/* Feedback — reserved space, visible only after scramble lands */}
            {phase === 'revealed' && (
              <div
                className="flex flex-col items-center gap-2"
                style={{ visibility: revealComplete ? 'visible' : 'hidden', minHeight: '8rem' }}
              >
                <p className={`feedback-text ${correct ? 'correct' : `wrong${revealComplete ? ' animate' : ''}`}`}>
                  {barkerLine || (correct ? t('feedbackCorrect') : t('feedbackWrong'))}
                </p>

                {/* Crowd stats */}
                <div style={{ minHeight: '1.5rem' }}>
                  {crowdStats !== null && (
                    crowdStats.total < 5
                      ? <p className="crowd-line">{t('crowdFirst')}</p>
                      : (
                        <p className="crowd-line">
                          {t('crowdLine',
                            Math.round(
                              (currentPick === 'taas' ? crowdStats.taas : crowdStats.baba)
                              / crowdStats.total * 100
                            ),
                            t(currentPick === 'taas' ? 'dirHigher' : 'dirLower'),
                            crowdStats.total
                          )}
                        </p>
                      )
                  )}
                </div>
              </div>
            )}

            {/* Filter chips — thumb-reachable zone on mobile */}
            <CategoryFilter categories={categories} enabled={enabledCats} onToggle={toggleCat} />
          </section>
        )}

        {/* ── Game over ── */}
        {phase === 'gameover' && (
          <section className="flex flex-col items-center gap-5 text-center">
            {streak < 5 ? (
              <>
                <p className="gameover-ay">{t('gameoverAy')}</p>
                <p className="label-caps" style={{ opacity: 0.42, letterSpacing: '0.38em' }}>
                  {t('gameoverOver')}
                </p>
              </>
            ) : (
              <>
                <p className="label-caps" style={{ color: 'var(--yellow)', opacity: 0.88, letterSpacing: '0.28em' }}>
                  {t('gameoverLupit')}
                </p>
                <p className="gameover-hero-num">{streak}</p>
              </>
            )}
            <h2 className="gameover-title">
              {goTitle[0]}<br />{goTitle[1]}
            </h2>
            <div className="flex gap-10">
              <div className="text-center">
                <p className="gameover-stat-label">{t('gameoverStreakLabel')}</p>
                <p className="gameover-num">{streak}</p>
              </div>
              <div className="text-center">
                <p className="gameover-stat-label">{t('gameoverBestLabel')}</p>
                <p className="gameover-num dim">{best}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className="action-btn" onClick={start}>{t('againBtn')}</button>
              <button className="ghost-btn" onClick={onHome}>{t('goHomeBtn')}</button>
            </div>
          </section>
        )}

      </main>

      {/* Fixed CTA bar */}
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
                  {correct ? t('btnNext') : t('btnViewResult')}
                </button>
            }
          </div>
        </div>
      )}
    </div>
  );
}
