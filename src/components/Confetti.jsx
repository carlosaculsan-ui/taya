import { useMemo } from 'react';

const COLORS = ['#C8102E', '#0038A8', '#FFD100', '#FFF3B0', '#F2E6C9', '#ffffff'];

// Deterministic positions based on index — no Math.random() in render
const PIECES = Array.from({ length: 54 }, (_, i) => ({
  id: i,
  left: `${((i * 1.87 + Math.sin(i * 0.9) * 18 + 8) % 92) + 2}%`,
  color: COLORS[i % COLORS.length],
  delay: `${((i * 0.038) % 0.55).toFixed(2)}s`,
  dur: `${(0.75 + (i % 8) * 0.12).toFixed(2)}s`,
  size: `${7 + (i % 3) * 2}px`,
}));

export default function Confetti({ active }) {
  if (!active) return null;
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {PIECES.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            '--delay': p.delay,
            '--dur': p.dur,
          }}
        />
      ))}
    </div>
  );
}
