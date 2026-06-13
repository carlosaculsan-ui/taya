const lines = {
  correctLow: {
    tl: [
      'Tama! Matalim talaga ang mata mo!',
      'Sinasakto mo yan! Tuloy!',
      'Aba, mahusay! Tumpak na tumpak!',
      'Boom! Tama ka ulit!',
      'Ay, tama ka! Sige, sunod!',
    ],
    en: [
      "That's right! Sharp eyes!",
      'Boom! You nailed it!',
      'Correct! Keep going!',
      "Nice one! You've got this!",
      'Right again! Stay focused!',
    ],
  },
  correctHigh: {
    tl: [
      'Sunog ka na! Walang makakatigil sa iyo!',
      'Grabe! Sunod-sunod ka! Hindi mapigilan!',
      'Kaloka! Stable ka pa rin!',
      'Napakagaling! Tara pa!',
      'Laglag sila sa iyo! Wala silang nagagawa!',
    ],
    en: [
      "You're on fire! Nobody's stopping you!",
      "Incredible! The crowd can't believe it!",
      'Still going strong! Unstoppable!',
      'Call the champion — it might be you!',
      "They can't touch you! Keep rolling!",
    ],
  },
  milestone: {
    tl: [
      (n) => `${n} SUNUD-SUNOD! Kampeon na ito!`,
      (n) => `${n} NA! Grabe! Hindi ito normal!`,
      (n) => `${n} TAMA! Nag-aapoy na ang entablado!`,
    ],
    en: [
      (n) => `${n} IN A ROW! We have a champion here!`,
      (n) => `${n}! Unbelievable! This isn't normal!`,
      (n) => `${n} CORRECT! The stage is on fire!`,
    ],
  },
  wrongLow: {
    tl: [
      'Ay! Mali! Tara, ulit!',
      'Oops! Malapit ka na, try ulit!',
      'Ay nako! Susunod ay mas matalino ka!',
      'Nasabog! Pero okay lang, tayo na!',
      'Hala! Mali pala! Laban pa!',
    ],
    en: [
      'Oof! Wrong one! Try again!',
      'Oops! So close, though!',
      "Ay! That wasn't it! Next one!",
      'Busted! But shake it off!',
      'Nope! Tough luck! Keep going!',
    ],
  },
  wrongHigh: {
    tl: [
      'Ay! Nasira ang streak! Kaya mo pa yan!',
      'Sayang ang streak! Huwag sumuko!',
      'Ay, nag-collapse! Pero laban pa!',
      'Bumaba! Pero ikaw pa rin ang bituin ngayon!',
    ],
    en: [
      'Oof! Streak broken! You had a great run!',
      'The streak ends here! But you can rebuild!',
      "Down goes the streak! Don't give up!",
      'Big drop! But you still impressed everyone!',
    ],
  },
  dailyFinal: {
    tl: [
      'Yan na ang iyong Taya ngayon! Bukas ulit!',
      'Tapos na ang laro! Tingnan mo ang score mo!',
      'Handa ka na ba bukas? I-share mo muna!',
      'Game over ngayon! Mas mahusay bukas!',
    ],
    en: [
      "That's a wrap! Come back tomorrow!",
      "Game done! That's your score for today!",
      'See you tomorrow for another round!',
      'Finished! Rest up and come back stronger!',
    ],
  },
};

// Per (pool, lang) last-picked index — prevents back-to-back repeats
const lastPicked = {};

export function pickBarkerLine(pool, lang = 'tl', n) {
  const poolData = lines[pool];
  if (!poolData) return '';
  const poolLines = poolData[lang] ?? poolData.tl ?? [];
  if (!poolLines.length) return '';

  const key = `${pool}_${lang}`;
  const last = lastPicked[key] ?? -1;

  const candidates = poolLines
    .map((item, i) => ({ item, i }))
    .filter(({ i }) => i !== last);
  const { item: picked, i: pickedIdx } =
    candidates[Math.floor(Math.random() * candidates.length)];

  lastPicked[key] = pickedIdx;

  return typeof picked === 'function' ? picked(n) : picked;
}
