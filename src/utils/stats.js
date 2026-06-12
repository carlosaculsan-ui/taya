import { db } from '../firebase';
import { doc, runTransaction, getDoc, setDoc } from 'firebase/firestore';

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Called once per day by App on mount. Checks Q0; if it has fewer than 5
// votes, writes seed distributions for all 10 questions so crowd stats are
// visible from day one. Completely silent — no UI impact on failure.
export async function seedDayIfEmpty(dayNumber) {
  try {
    const probe = await getDoc(doc(db, 'stats', `daily-${dayNumber}-0`));
    if (probe.exists() && probe.data().total >= 5) return;
    const rng = mulberry32(dayNumber * 7919 + 42);
    await Promise.all(
      Array.from({ length: 10 }, (_, idx) => {
        const total   = Math.floor(rng() * 26) + 18;
        const taas    = Math.round(total * (0.40 + rng() * 0.34));
        const baba    = total - taas;
        const correct = Math.round(total * (0.46 + rng() * 0.26));
        return setDoc(doc(db, 'stats', `daily-${dayNumber}-${idx}`), { taas, baba, correct, total });
      })
    );
  } catch { /* fail silently */ }
}

// Strip the "{categoryId}_" prefix from an item id to get a short slug.
// e.g. item { id: "presyo_itlog", categoryId: "presyo" } → "itlog"
function itemSlug(item) {
  const prefix = item.categoryId + '_';
  return item.id.startsWith(prefix) ? item.id.slice(prefix.length) : item.id;
}

export function getDailyQuestionId(dayNumber, idx) {
  return `daily-${dayNumber}-${idx}`;
}

export function getEndlessQuestionId(pair) {
  const [a, b] = [itemSlug(pair.left), itemSlug(pair.right)].sort();
  return `${pair.left.categoryId}__${a}__vs__${b}`;
}

// Fire a Firestore transaction on stats/{questionId}.
// Creates the doc with total:1 on first visit, increments by 1 thereafter.
// Returns the post-transaction data, or null on any error (fail silently).
export async function recordGuess(questionId, pick, correct) {
  try {
    const ref = doc(db, 'stats', questionId);
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        const data = {
          taas: pick === 'taas' ? 1 : 0,
          baba: pick === 'baba' ? 1 : 0,
          correct: correct ? 1 : 0,
          total: 1,
        };
        tx.set(ref, data);
        return data;
      }
      const d = snap.data();
      const updated = {
        taas:    d.taas    + (pick === 'taas' ? 1 : 0),
        baba:    d.baba    + (pick === 'baba' ? 1 : 0),
        correct: d.correct + (correct ? 1 : 0),
        total:   d.total   + 1,
      };
      tx.update(ref, updated);
      return updated;
    });
  } catch {
    return null;
  }
}

// Returns the current stats doc, or null on error / doc not found.
export async function fetchStats(questionId) {
  try {
    const snap = await getDoc(doc(db, 'stats', questionId));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}
