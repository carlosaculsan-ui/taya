import { useState, useCallback, createContext, useContext } from 'react';

const S = {
  tl: {
    // Home
    subtitle: 'Hulaan   \xb7   Iskor   \xb7   Magjaya',
    modeDaily: '📅 Taya ng Araw',
    modeEndless: '∞ Endless Mode',
    // Navigation
    goHome: '← Umuwi',
    dayLabel: 'ARAW',
    // Gameplay
    questionHint: 'Mas mataas o mas mababa ang kanan?',
    btnHigher: '▲ Taas',
    btnLower: '▼ Baba',
    btnNext: 'Susunod →',
    btnViewScore: 'Tingnan ang Score',
    btnViewResult: 'Tingnan ang resulta',
    // Lifeline
    lifelineBtn: '💡 Tanong sa Madla',
    lifelineUsed: 'GAMIT NA',
    lifelineLoading: 'Hinahanap ang madla…',
    lifelineNoData: 'Wala pang datos, bahala ka na',
    lifelineStat: (tp, bp, n) => `Madla: ${tp}% TAAS · ${bp}% BABA (${n})`,
    // Feedback
    feedbackCorrect: 'Tama ka! 🎉',
    feedbackWrong: 'Ay! Mali! 😬',
    // Crowd stats
    crowdFirst: 'Ikaw ang unang tumaya!',
    crowdLine: (pct, dir, n) => `${pct}% ng bayan pumili ng ${dir} · ${n} tumaya`,
    dirHigher: 'TAAS',
    dirLower: 'BABA',
    // Daily done
    doneDone: 'Tapos ka na!',
    doneBack: 'Pwede na. Balik bukas!',
    gridAria: 'Mga sagot',
    shareBtn: 'I-share ang Resulta',
    shareCopied: '✓ Nakopya!',
    // Endless idle
    pickCategory: 'Piliin ang kategorya',
    startBtn: 'Simulan!',
    // Ticket stub
    ticketStreak: 'streak',
    ticketBest: 'best',
    // Game over
    gameoverAy: 'AY!',
    gameoverOver: 'TAPOS KA NA!',
    gameoverLupit: 'LUPIT MO!',
    gameoverTitle: ['Walang', 'Iyakan!'],
    gameoverStreakLabel: 'Streak mo',
    gameoverBestLabel: 'Pinakamataas',
    againBtn: 'Ulit!',
    goHomeBtn: 'Umuwi',
    // Share text (parameterised function)
    shareText: (day, score, total, grid) =>
      `TAYA! — Taya ng Araw #${day}\n${score}/${total}\n\n${grid}\n\nTaya ka na!`,
    // Category labels (keyed by category id)
    catLabels: { presyo: 'Presyo', lungsod: 'Lungsod', isla: 'Isla', takilya: 'Takilya' },
    // Card metric labels (keyed by category id)
    metrics: { presyo: 'presyo ngayon', lungsod: 'populasyon (2020)', isla: 'lawak ng lupa (km²)', takilya: 'kita sa takilya (₱M)' },
  },

  en: {
    // Home
    subtitle: 'Guess   \xb7   Score   \xb7   Bet',
    modeDaily: '📅 Daily Bet',
    modeEndless: '∞ Endless Mode',
    // Navigation
    goHome: '← Home',
    dayLabel: 'DAY',
    // Gameplay
    questionHint: 'Is the right one higher or lower?',
    btnHigher: '▲ Higher',
    btnLower: '▼ Lower',
    btnNext: 'Next →',
    btnViewScore: 'See Score',
    btnViewResult: 'See Result',
    // Lifeline
    lifelineBtn: '💡 Ask the Crowd',
    lifelineUsed: 'USED',
    lifelineLoading: 'Asking the crowd…',
    lifelineNoData: "No data yet, you're on your own",
    lifelineStat: (tp, bp, n) => `Crowd: ${tp}% HIGHER · ${bp}% LOWER (${n})`,
    // Feedback
    feedbackCorrect: 'Correct! 🎉',
    feedbackWrong: 'Oof! Wrong! 😬',
    // Crowd stats
    crowdFirst: "You're the first to bet!",
    crowdLine: (pct, dir, n) => `${pct}% of players picked ${dir} · ${n} bets`,
    dirHigher: 'HIGHER',
    dirLower: 'LOWER',
    // Daily done
    doneDone: 'Game Over!',
    doneBack: 'Come back tomorrow!',
    gridAria: 'Your answers',
    shareBtn: 'Share Result',
    shareCopied: '✓ Copied!',
    // Endless idle
    pickCategory: 'Pick a category',
    startBtn: 'Start!',
    // Ticket stub
    ticketStreak: 'streak',
    ticketBest: 'best',
    // Game over
    gameoverAy: 'OOF!',
    gameoverOver: 'GAME OVER!',
    gameoverLupit: "YOU'RE ON FIRE!",
    gameoverTitle: ['No', 'Crying!'],
    gameoverStreakLabel: 'Your Streak',
    gameoverBestLabel: 'Best',
    againBtn: 'Again!',
    goHomeBtn: 'Home',
    // Share text (parameterised function)
    shareText: (day, score, total, grid) =>
      `TAYA! — Daily Bet #${day}\n${score}/${total}\n\n${grid}\n\nYour turn to bet!`,
    // Category labels (keyed by category id)
    catLabels: { presyo: 'Prices', lungsod: 'Cities', isla: 'Islands', takilya: 'Box Office' },
    // Card metric labels (keyed by category id)
    metrics: { presyo: 'price today', lungsod: 'population (2020)', isla: 'land area (km²)', takilya: 'box office (₱M)' },
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('taya_lang') || 'tl'
  );

  const setLang = useCallback((l) => {
    localStorage.setItem('taya_lang', l);
    setLangState(l);
  }, []);

  // t(key) → string | array
  // t(key, ...args) → calls string[key](...args) when value is a function
  const t = useCallback(
    (key, ...args) => {
      const val = (S[lang] ?? S.tl)[key] ?? S.tl[key] ?? key;
      return typeof val === 'function' ? val(...args) : val;
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
