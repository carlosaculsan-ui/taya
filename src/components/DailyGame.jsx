import { useState, useEffect, useCallback } from 'react';
import { useDailyGame } from '../hooks/useDailyGame';
import Card from './Card';
import GuessButtons from './GuessButtons';
import BulbRow from './BulbRow';
import { checkGuess } from '../utils/gameLogic';
import { getDailyQuestionId, recordGuess, fetchStats } from '../utils/stats';

export default function DailyGame({ categories, onHome }) {
  const { phase, current, idx, answers, score, total, dayNumber, guess, next, shareText } =
    useDailyGame(categories);

  const [copied, setCopied] = useState(false);
  const [bulbState, setBulbState] = useState('idle');

  // ── Crowd stats (post-reveal) ──────────────────────────────────
  const [currentPick, setCurrentPick] = useState(null);
  const [crowdStats, setCrowdStats] = useState(null); // null = nothing to show yet

  // ── Lifeline ───────────────────────────────────────────────────
  const lifelineKey = `taya_lifeline_${dayNumber}`;
  const [lifelineUsed, setLifelineUsed] = useState(() => !!localStorage.getItem(lifelineKey));
  // null | 'loading' | { noData: true } | { stats: {...} }
  const [lifelineDisplay, setLifelineDisplay] = useState(null);

  // Reset per-question state when moving to a new question
  useEffect(() => {
    setCurrentPick(null);
    setCrowdStats(null);
    setLifelineDisplay(null);
  }, [idx]);

  const lastAnswer = answers[answers.length - 1];

  useEffect(() => {
    if (phase !== 'revealed') return;
    setBulbState(lastAnswer ? 'chasing' : 'dark');
    const t = setTimeout(() => setBulbState('idle'), 750);
    return () => clearTimeout(t);
  }, [phase, lastAnswer]);

  // Intercept guess to capture pick + fire stats transaction
  const handleGuess = useCallback(async (direction) => {
    if (phase !== 'playing' || !current) return;
    setCurrentPick(direction);
    guess(direction);
    const isCorrect = checkGuess(direction, current.left, current.right);
    const qId = getDailyQuestionId(dayNumber, idx);
    const stats = await recordGuess(qId, direction, isCorrect);
    setCrowdStats(stats); // null on network failure → nothing shown
  }, [phase, current, guess, dayNumber, idx]);

  // Lifeline: fetch stats before the player answers
  const handleLifeline = useCallback(async () => {
    if (lifelineUsed || lifelineDisplay) return;
    setLifelineDisplay('loading');
    const qId = getDailyQuestionId(dayNumber, idx);
    const stats = await fetchStats(qId);
    localStorage.setItem(lifelineKey, '1');
    setLifelineUsed(true);
    if (!stats || stats.total < 5) {
      setLifelineDisplay({ noData: true });
      return;
    }
    setLifelineDisplay({ stats });
  }, [lifelineUsed, lifelineDisplay, dayNumber, idx, lifelineKey]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch { /* cancelled or unavailable */ }
  };

  return (
    <div className="min-h-screen flex flex-col">

      <header className="perya-header">
        <BulbRow state={bulbState} count={32} />
        <div className="flex items-center justify-between px-4 py-2">
          <button className="nav-back" onClick={onHome}>← Umuwi</button>
          <span
            className="f-bungee"
            style={{ color: 'var(--yellow)', fontSize: '0.82rem', letterSpacing: '0.1em' }}
          >
            ARAW #{dayNumber}
          </span>
          <span style={{ minWidth: '3rem' }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-5 p-4 max-w-2xl mx-auto w-full">

        {/* ── Playing / Revealed ── */}
        {(phase === 'playing' || phase === 'revealed') && current && (
          <section className="flex flex-col gap-4 w-full">
            {/* Progress dots */}
            <div className="flex gap-1.5 justify-center">
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={[
                    'progress-dot',
                    i < answers.length ? 'answered' : '',
                    i === answers.length ? 'current' : '',
                  ]
                    .join(' ')
                    .trim()}
                />
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <Card item={current.left} />
              <div className="flex items-center justify-center self-center shrink-0 py-2">
                <span className="vs-badge">VS</span>
              </div>
              <Card
                item={current.right}
                hidden={phase === 'playing'}
                result={
                  phase === 'revealed' ? (lastAnswer ? 'correct' : 'wrong') : undefined
                }
              />
            </div>

            <p className="question-hint">Mas mataas o mas mababa ang kanan?</p>

            {/* Lifeline — playing phase only */}
            {phase === 'playing' && (
              <div className="flex justify-center" style={{ minHeight: '2rem' }}>
                {!lifelineDisplay && !lifelineUsed && (
                  <button className="lifeline-btn" onClick={handleLifeline}>
                    💡 Tanong sa Madla
                  </button>
                )}
                {lifelineDisplay === 'loading' && (
                  <p className="crowd-line">Hinahanap ang madla…</p>
                )}
                {lifelineDisplay?.noData && (
                  <p className="crowd-line">Wala pang datos, bahala ka na</p>
                )}
                {lifelineDisplay?.stats && (
                  <p className="crowd-line">
                    Madla: {Math.round(lifelineDisplay.stats.taas / lifelineDisplay.stats.total * 100)}% TAAS
                    &nbsp;·&nbsp;
                    {Math.round(lifelineDisplay.stats.baba / lifelineDisplay.stats.total * 100)}% BABA
                    &nbsp;({lifelineDisplay.stats.total})
                  </p>
                )}
              </div>
            )}

            <GuessButtons onGuess={handleGuess} disabled={phase === 'revealed'} />

            {phase === 'revealed' && (
              <div className="flex flex-col items-center gap-2">
                <p className={`feedback-text ${lastAnswer ? 'correct' : 'wrong'}`}>
                  {lastAnswer ? 'Tama ka! 🎉' : 'Ay! Mali! 😬'}
                </p>

                {/* Crowd stats — min-height prevents Susunod button from jumping */}
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
                  {idx + 1 < total ? 'Susunod →' : 'Tingnan ang Score'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Done ── */}
        {phase === 'done' && (
          <section className="flex flex-col items-center gap-5 text-center">
            <p className="done-tagline" style={{ letterSpacing: '0.35em' }}>
              Tapos ka na!
            </p>
            <p className="big-score">
              {score}
              <span className="score-denom">/{total}</span>
            </p>
            <div className="emoji-grid" aria-label="Mga sagot">
              {answers.map((a, i) => (
                <span key={i}>{a ? '🟩' : '🟥'}</span>
              ))}
            </div>
            <p className="done-tagline">Pwede na. Balik bukas!</p>
            <div className="flex flex-col gap-2.5 w-full max-w-xs mt-1">
              <button className="action-btn" onClick={handleShare}>
                {copied ? '✓ Nakopya!' : 'I-share ang Resulta'}
              </button>
              <button className="ghost-btn" onClick={onHome}>Umuwi</button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
