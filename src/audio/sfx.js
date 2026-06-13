let ctx = null;
let master = null;
let _muted = localStorage.getItem('taya_muted') === '1';

function boot() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.25;
  master.connect(ctx.destination);
}

// Call on first user gesture to unlock audio on mobile
export function initAudio() {
  boot();
  if (ctx.state === 'suspended') ctx.resume();
}

export function isMuted() { return _muted; }

export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem('taya_muted', _muted ? '1' : '0');
  return _muted;
}

function play(fn) {
  if (_muted || !ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  try { fn(ctx, master); } catch {}
}

function note(c, dest, freq, type, t0, dur, vol = 0.6) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.01);
}

// Very short click on guess button press
export function playPress() {
  play((c, dest) => {
    note(c, dest, 300, 'square', c.currentTime, 0.05, 0.28);
  });
}

// Rising sweep during scramble (matches 450ms scramble duration)
export function playReveal() {
  play((c, dest) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.4);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.32, c.currentTime + 0.06);
    g.gain.setValueAtTime(0.32, c.currentTime + 0.32);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.44);
    osc.connect(g);
    g.connect(dest);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.47);
  });
}

// 3-note ascending arpeggio — marimba-ish (C5, E5, G5)
export function playCorrect() {
  play((c, dest) => {
    [523, 659, 784].forEach((freq, i) => {
      note(c, dest, freq, 'triangle', c.currentTime + i * 0.08, 0.14, 0.55);
    });
  });
}

// 2-note descending buzz — gentle (A4, F4)
export function playWrong() {
  play((c, dest) => {
    [[440, 0], [349, 0.1]].forEach(([freq, delay]) => {
      note(c, dest, freq, 'sawtooth', c.currentTime + delay, 0.1, 0.12);
    });
  });
}

// 5-note ascending flourish — fires with milestone confetti (C5, E5, G5, C6, E6)
export function playMilestone() {
  play((c, dest) => {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      note(c, dest, freq, 'triangle', c.currentTime + i * 0.07, 0.14, 0.5);
    });
  });
}

// Descending phrase for low-streak gameover (G4, E4, C4)
export function playGameoverLow() {
  play((c, dest) => {
    [[392, 0], [330, 0.13], [262, 0.26]].forEach(([freq, delay]) => {
      note(c, dest, freq, 'triangle', c.currentTime + delay, 0.18, 0.4);
    });
  });
}

// Triumphant ascending phrase for high-streak gameover (C5, E5, G5, C6)
export function playGameoverHigh() {
  play((c, dest) => {
    [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]].forEach(([freq, delay]) => {
      note(c, dest, freq, 'triangle', c.currentTime + delay, delay < 0.3 ? 0.14 : 0.35, 0.5);
    });
  });
}
