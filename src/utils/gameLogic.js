// Mulberry32 seeded PRNG — used for daily mode determinism
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr) {
  // '2026-06-11' → 20260611, safely within int32 positive range
  return parseInt(dateStr.replace(/-/g, ''), 10) % 2147483647;
}

// Never surface a pair where either item is unverified and values are within 25%
// of each other — those are disputed close calls not fit for play.
function isPairSafe(a, b) {
  if (a.verified !== false && b.verified !== false) return true;
  const higher = Math.max(a.value, b.value);
  return Math.abs(a.value - b.value) / higher > 0.25;
}

export function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDayNumber(dateStr) {
  const base = new Date('2025-01-01T00:00:00Z');
  const date = new Date(dateStr + 'T00:00:00Z');
  return Math.floor((date - base) / 86400000) + 1;
}

export function getAllItems(categories) {
  return categories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryId: cat.id, category: cat }))
  );
}

export function pickRandomPair(items, rng) {
  const byCat = {};
  for (const item of items) {
    if (!byCat[item.categoryId]) byCat[item.categoryId] = [];
    byCat[item.categoryId].push(item);
  }

  const validIds = Object.keys(byCat).filter((id) => byCat[id].length >= 2);
  if (!validIds.length) return null;

  const catId = validIds[Math.floor(rng() * validIds.length)];
  const pool = byCat[catId];

  for (let i = 0; i < 100; i++) {
    const a = Math.floor(rng() * pool.length);
    const b = Math.floor(rng() * pool.length);
    if (a !== b && pool[a].value !== pool[b].value && isPairSafe(pool[a], pool[b])) {
      return { left: pool[a], right: pool[b] };
    }
  }
  return null;
}

export function pickNextPair(newLeft, items, rng) {
  const candidates = items.filter(
    (item) =>
      item.categoryId === newLeft.categoryId &&
      item.id !== newLeft.id &&
      item.value !== newLeft.value &&
      isPairSafe(newLeft, item)
  );

  if (!candidates.length) return pickRandomPair(items, rng);

  return { left: newLeft, right: candidates[Math.floor(rng() * candidates.length)] };
}

export function generateDailyPairs(categories, dateStr, count = 10) {
  const rng = mulberry32(dateToSeed(dateStr));
  const all = getAllItems(categories);
  const pairs = [];
  for (let i = 0; i < count; i++) {
    const pair = pickRandomPair(all, rng);
    if (pair) pairs.push(pair);
  }
  return pairs;
}

export function checkGuess(guess, left, right) {
  const rightIsHigher = right.value > left.value;
  return guess === 'taas' ? rightIsHigher : !rightIsHigher;
}
