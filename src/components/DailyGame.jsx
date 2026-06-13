import { useState, useEffect, useCallback } from 'react';
import { useDailyGame } from '../hooks/useDailyGame';
import Card from './Card';
import GuessButtons from './GuessButtons';
import BulbRow from './BulbRow';
import Banderitas from './Banderitas';
import { useLang } from '../i18n/strings';
import { checkGuess } from '../utils/gameLogic';
import { getDailyQuestionId, recordGuess, fetchStats } from '../utils/stats';
import { pickBarkerLine } from '../data/barkerLines';

export default function DailyGame({ categories, onHome }) {
  const { lang, t } = useLang();
  const { phase, current, idx, answers, score, total, dayNumber, guess, next, shareText } =
    useDailyGame(categories);

  const [copied, setCopied] = useState(false);
  const [bulbState, setBulbState] = useState('idle');

  // ── Crowd stats (post-reveal) ──────────────────────────────────
  const [currentPick, setCurrentPick] = useState(null);
  const [crowdStats, setCrowdStats] = useState(null);

  // ── Lifeline ───────────────────────────────────────────────────
  const lifelineKey = `taya_lifeline_${dayNumber}`;
  const [lifelineUsed, setLifelineUsed] = useState(() => !!localStorage.getItem(lifelineKey));
  const [lifelineDisplay, setLifelineDisplay] = useState(null);

  // ── Reveal timing ──────────────────────────────────────────────
  const [revealComplete, setRevealComplete] = useState(false);
  const [susunodReady, setSusunodReady] = useState(false);

  // ── Barker lines ───────────────────────────────────────────────
  const [barkerLine, setBarkerLine] = useState('');
  const [finalLine, setFinalLine] = useState('');

  // Reset per-question state when moving to a new question
  useEffect(() => {
    setCurrentPick(null);
    setCrowdStats(null);
    setLifelineDisplay(null);
    setRevealComplete(false);
    setSusunodReady(false);
    setBarkerLine('');
  }, [idx]);

  // After guess, wait for scramble (450ms) before showing feedback
  useEffect(() => {
    if (phase !== 'revealed') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setRevealComplete(true), prefersReduced ? 0 : 450);
    return () => clearTimeout(timer);
  }, [phase]);

  // After feedback appears, delay SUSUNOD by 400ms
  useEffect(() => {
    if (!revealComplete) return;
    const timer = setTimeout(() => setSusunodReady(true), 400);
    return () => clearTimeout(timer);
  }, [revealComplete]);

  const lastAnswer = answers[answers.length - 1];

  useEffect(() => {
    if (phase !== 'revealed') return;
    setBulbState(lastAnswer ? 'chasing' : 'dark');
    const timer = setTimeout(() => setBulbState('idle'), 750);
    return () => clearTimeout(timer);
  }, [phase, lastAnswer]);

  const handleGuess = useCallback(async (direction) => {
    if (phase !== 'playing' || !current) return;
    setCurrentPick(direction);
    const isCorrect = checkGuess(direction, current.left, current.right);
    setBarkerLine(pickBarkerLine(isCorrect ? 'correctLow' : 'wrongLow', lang));
    guess(direction);
    const qId = getDailyQuestionId(dayNumber, idx);
    const stats = await recordGuess(qId, direction, isCorrect);
    setCrowdStats(stats);
  }, [phase, current, guess, dayNumber, idx, lang]);

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

  const handleNext = useCallback(() => {
    next();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [next]);

  useEffect(() => {
    if (phase === 'done') setFinalLine(pickBarkerLine('dailyFinal', lang));
  }, [phase, lang]);

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
          <button className="nav-back" onClick={onHome}>{t('goHome')}</button>
          <span
            className="f-bungee"
            style={{ color: 'var(--yellow)', fontSize: '0.82rem', letterSpacing: '0.1em' }}
          >
            {t('dayLabel')} #{dayNumber}
          </span>
          <span style={{ minWidth: '3rem' }} />
        </div>
      </header>

      <Banderitas />

      <main className="flex-1 flex flex-col items-center gap-5 p-4 max-w-[45rem] mx-auto w-full" style={{ paddingBottom: '5.5rem' }}>

        {/* ── Playing / Revealed ── */}
        {(phase === 'playing' || phase === 'revealed') && current && (
          <section className="flex flex-col gap-4 w-full">
            {/* Progress dots — decorative only, not interactive */}
            <div className="flex gap-1.5 justify-center" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={[
                    'progress-dot',
                    i < answers.length ? 'answered' : '',
                    i === answers.length ? 'current' : '',
                  ].join(' ').trim()}
                />
              ))}
            </div>

            {/* Barker prompt */}
            <p className="question-hint">{t('questionHint')}</p>

            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <Card item={current.left} />
              <div className="flex items-center justify-center self-center shrink-0 py-2">
                <span className="vs-badge">VS</span>
              </div>
              <Card
                item={current.right}
                hidden={phase === 'playing'}
                result={phase === 'revealed' ? (lastAnswer ? 'correct' : 'wrong') : undefined}
              />
            </div>

            {/* Lifeline — playing phase only */}
            {phase === 'playing' && (
              <div className="flex justify-center" style={{ minHeight: '2rem' }}>
                {!lifelineDisplay && !lifelineUsed && (
                  <button className="lifeline-btn" onClick={handleLifeline}>
                    {t('lifelineBtn')}
                  </button>
                )}
                {lifelineUsed && !lifelineDisplay && (
                  <p className="lifeline-used">{t('lifelineUsed')}</p>
                )}
                {lifelineDisplay === 'loading' && (
                  <p className="crowd-line">{t('lifelineLoading')}</p>
                )}
                {lifelineDisplay?.noData && (
                  <p className="crowd-line">{t('lifelineNoData')}</p>
                )}
                {lifelineDisplay?.stats && (
                  <p className="crowd-line">
                    {t('lifelineStat',
                      Math.round(lifelineDisplay.stats.taas / lifelineDisplay.stats.total * 100),
                      Math.round(lifelineDisplay.stats.baba / lifelineDisplay.stats.total * 100),
                      lifelineDisplay.stats.total
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Feedback — reserved space, visible only after scramble lands */}
            {phase === 'revealed' && (
              <div
                className="flex flex-col items-center gap-2"
                style={{ visibility: revealComplete ? 'visible' : 'hidden' }}
              >
                <p className={`feedback-text ${lastAnswer ? 'correct' : `wrong${revealComplete ? ' animate' : ''}`}`}>
                  {barkerLine || (lastAnswer ? t('feedbackCorrect') : t('feedbackWrong'))}
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
          </section>
        )}

        {/* ── Done ── */}
        {phase === 'done' && (
          <section className="flex flex-col items-center gap-5 text-center">
            <p className="done-tagline" style={{ letterSpacing: '0.35em' }}>
              {t('doneDone')}
            </p>
            <p className="big-score">
              {score}
              <span className="score-denom">/{total}</span>
            </p>
            <div className="emoji-grid" aria-label={t('gridAria')}>
              {answers.map((a, i) => (
                <span key={i}>{a ? '🟩' : '🟥'}</span>
              ))}
            </div>
            <p className="done-tagline">{finalLine || t('doneBack')}</p>
            <div className="flex flex-col gap-2.5 w-full max-w-xs mt-1">
              <button className="action-btn" onClick={handleShare}>
                {copied ? t('shareCopied') : t('shareBtn')}
              </button>
              <button className="ghost-btn" onClick={onHome}>{t('goHomeBtn')}</button>
            </div>
          </section>
        )}

      </main>

      {/* Fixed CTA bar */}
      {(phase === 'playing' || phase === 'revealed') && current && (
        <div className="cta-bar">
          <div className="cta-bar-inner">
            {phase === 'playing'
              ? <GuessButtons onGuess={handleGuess} />
              : <button
                  className={`action-btn${susunodReady ? ' susunod-enter' : ' susunod-hidden'}`}
                  style={{ width: '100%' }}
                  onClick={handleNext}
                >
                  {idx + 1 < total ? t('btnNext') : t('btnViewScore')}
                </button>
            }
          </div>
        </div>
      )}
    </div>
  );
}
