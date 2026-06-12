import { useState, useEffect, useRef } from 'react';
import { formatValue } from '../utils/formatters';

const DIGITS = '0123456789';

function scrambleFormat(str) {
  return str.replace(/\d/g, () => DIGITS[Math.floor(Math.random() * 10)]);
}

export default function Card({ item, hidden = false, result }) {
  const { category } = item;
  const value = formatValue(item.value, category.formatter);

  const [displayValue, setDisplayValue] = useState(value);
  const [popping, setPopping] = useState(false);
  const wasHiddenRef = useRef(hidden);

  useEffect(() => {
    const wasHidden = wasHiddenRef.current;
    wasHiddenRef.current = hidden;

    if (!wasHidden || hidden) return;

    // Transition: hidden → revealed — slot-machine scramble
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplayValue(value);
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 120);
      return () => clearTimeout(t);
    }

    const duration = 450;
    const interval = 40;
    const start = Date.now();

    // Show scrambled digits immediately (first frame)
    setDisplayValue(scrambleFormat(value));

    const timer = setInterval(() => {
      if (Date.now() - start >= duration) {
        clearInterval(timer);
        setDisplayValue(value);
        setPopping(true);
        setTimeout(() => setPopping(false), 120);
        return;
      }
      setDisplayValue(scrambleFormat(value));
    }, interval);

    return () => clearInterval(timer);
  }, [hidden, value]);

  return (
    <article
      data-result={result}
      className="perya-card flex flex-col items-center justify-center gap-1.5 p-4 md:p-6 min-h-40 md:min-h-52 flex-1 text-center"
    >
      <span className="card-label">{category.label}</span>
      <h2 className="card-name">{item.name}</h2>
      <p className="card-metric">{category.metric}</p>
      <p className={hidden ? 'card-hidden' : `card-value${popping ? ' card-value-pop' : ''}`}>
        {hidden ? '???' : displayValue}
      </p>
    </article>
  );
}
