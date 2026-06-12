import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateDailyPairs, checkGuess, getDayNumber, getTodayString } from '../utils/gameLogic';

export function useDailyGame(categories) {
  const today = getTodayString();
  const dayNumber = getDayNumber(today);
  const pairs = useMemo(() => generateDailyPairs(categories, today, 10), [categories, today]);

  const dailyKey = `taya_daily_${dayNumber}`;

  const [answers, setAnswers] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(dailyKey) || 'null');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [idx, setIdx] = useState(() => (answers.length > 0 ? Math.min(answers.length, 9) : 0));
  const [phase, setPhase] = useState(() => (answers.length >= 10 ? 'done' : 'playing')); // playing | revealed | done

  useEffect(() => {
    localStorage.setItem(dailyKey, JSON.stringify(answers));
  }, [dailyKey, answers]);

  const current = pairs[idx] ?? null;

  const guess = useCallback(
    (direction) => {
      if (phase !== 'playing' || !current) return;
      const correct = checkGuess(direction, current.left, current.right);
      setAnswers((a) => [...a, correct]);
      setPhase('revealed');
    },
    [phase, current]
  );

  const next = useCallback(() => {
    if (idx + 1 >= pairs.length) {
      setPhase('done');
    } else {
      setIdx((i) => i + 1);
      setPhase('playing');
    }
  }, [idx, pairs.length]);

  const score = answers.filter(Boolean).length;

  const shareText = useMemo(() => {
    const grid = answers.map((a) => (a ? '🟩' : '🟥')).join('');
    return `TAYA! — Taya ng Araw #${dayNumber}\n${score}/${pairs.length}\n\n${grid}\n\nTaya ka na!`;
  }, [answers, score, pairs.length, dayNumber]);

  return {
    phase,
    current,
    idx,
    answers,
    score,
    total: pairs.length,
    dayNumber,
    guess,
    next,
    shareText,
  };
}
