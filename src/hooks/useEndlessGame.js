import { useState, useCallback, useMemo } from 'react';
import { getAllItems, pickRandomPair, pickNextPair, checkGuess } from '../utils/gameLogic';

export function useEndlessGame(categories) {
  const [enabledCats, setEnabledCats] = useState(
    () => new Set(categories.map((c) => c.id))
  );

  const [game, setGame] = useState({
    phase: 'idle',   // idle | playing | revealed | gameover
    pair: null,
    streak: 0,
    best: 0,
    correct: null,
  });

  const items = useMemo(
    () => getAllItems(categories).filter((item) => enabledCats.has(item.categoryId)),
    [categories, enabledCats]
  );

  const start = useCallback(() => {
    const pair = pickRandomPair(items, Math.random);
    setGame((g) => ({ phase: 'playing', pair, streak: 0, best: g.best, correct: null }));
  }, [items]);

  const guess = useCallback((direction) => {
    setGame((g) => {
      if (g.phase !== 'playing' || !g.pair) return g;
      const correct = checkGuess(direction, g.pair.left, g.pair.right);
      const streak = correct ? g.streak + 1 : g.streak;
      return { ...g, phase: 'revealed', correct, streak, best: Math.max(g.best, streak) };
    });
  }, []);

  const next = useCallback(() => {
    setGame((g) => {
      if (g.phase !== 'revealed') return g;
      if (!g.correct) return { ...g, phase: 'gameover' };
      const pair = pickNextPair(g.pair.right, items, Math.random);
      return { ...g, phase: 'playing', pair, correct: null };
    });
  }, [items]);

  const toggleCat = useCallback((id) => {
    setEnabledCats((prev) => {
      if (prev.has(id) && prev.size === 1) return prev; // keep at least one active
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return { game, enabledCats, start, guess, next, toggleCat };
}
