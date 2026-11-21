// audio.js — the observatory's small sounds, synthesised with WebAudio.
//
// There are no audio files: a find is two bright notes and a wooden pop, a
// misclick a low thud, a hint a little shimmer of harmonics, the last ten
// seconds tick, and the round endings get a phrase each. The context is
// created lazily on the first user gesture, as browsers require, and every
// function is silent when muted or when no gesture has unlocked audio yet.

let context = null;
let muted = false;

export function unlockAudio() {
  if (!context) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) context = new AC();
  }
  if (context && context.state === 'suspended') context.resume();
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone(freq, start, duration, type, gainPeak, glideTo) {
  if (!context || muted) return;
  const t0 = context.currentTime + start;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0008, t0 + duration);
  osc.connect(gain).connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function pop(start) {
  if (!context || muted) return;
  const t0 = context.currentTime + start;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, t0);
  osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.09);
  gain.gain.setValueAtTime(0.22, t0);
  gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.1);
  osc.connect(gain).connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + 0.12);
}

// A find: a pop as the marker lands, then a two-note brass chime.
export function playFind() {
  pop(0);
  tone(880, 0.02, 0.16, 'triangle', 0.16);
  tone(1318, 0.09, 0.22, 'triangle', 0.14);
}

// A misclick: a dull thud that falls away.
export function playMiss() {
  tone(150, 0, 0.16, 'sine', 0.22, 70);
}

// A hint: a gentle upward shimmer, nothing so crude as a buzzer.
export function playHint() {
  tone(660, 0, 0.3, 'sine', 0.07);
  tone(990, 0.07, 0.3, 'sine', 0.06);
  tone(1320, 0.14, 0.34, 'sine', 0.05);
}

// One tick of the last-ten-seconds countdown.
export function playTick() {
  tone(1180, 0, 0.05, 'square', 0.045);
}

// A button press, for menus and the start of a round.
export function playClick() {
  tone(440, 0, 0.07, 'triangle', 0.1, 330);
}

// A round cleared: a small fanfare of four notes.
export function playRoundClear() {
  tone(523, 0, 0.16, 'triangle', 0.14);
  tone(659, 0.11, 0.16, 'triangle', 0.14);
  tone(784, 0.22, 0.16, 'triangle', 0.14);
  tone(1046, 0.33, 0.3, 'triangle', 0.16);
}

// The whole night cleared: the fanfare, finished with a chord.
export function playNightClear() {
  playRoundClear();
  tone(523, 0.5, 0.5, 'triangle', 0.08);
  tone(659, 0.5, 0.5, 'triangle', 0.08);
  tone(784, 0.5, 0.5, 'triangle', 0.08);
}

// Time run out: three notes guttering down like the candles.
export function playGameOver() {
  tone(392, 0, 0.22, 'triangle', 0.13);
  tone(330, 0.2, 0.22, 'triangle', 0.12);
  tone(262, 0.4, 0.4, 'triangle', 0.12, 196);
}
