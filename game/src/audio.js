// All sound is synthesised with WebAudio: no audio files, no network request.
// The context starts on the player's first gesture, as browsers require.
let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

/** A tiny bouncy bass line and a plucky melody, one bar of each, looped. */
const BASS = [130.81, 0, 130.81, 0, 98.0, 0, 146.83, 0, 130.81, 0, 130.81, 0, 110.0, 0, 123.47, 0];
const MELODY = [523.25, 0, 659.25, 783.99, 0, 659.25, 0, 523.25, 587.33, 0, 698.46, 0, 783.99, 0, 659.25, 0];
const STEP_SECONDS = 0.21;

function ensureContext() {
  if (ctx) return ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  ctx = new AudioContext();
  return ctx;
}

/** Start audio on a user gesture (click or key). Safe to call often. */
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  if (c && !musicTimer) startMusic();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopMusic();
  else if (ctx) startMusic();
  return muted;
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

function startMusic() {
  if (musicTimer || !ctx) return;
  musicStep = 0;
  musicTimer = setInterval(() => {
    if (muted || !ctx) return;
    const when = ctx.currentTime + 0.05;
    const bass = BASS[musicStep % BASS.length];
    const note = MELODY[musicStep % MELODY.length];
    if (bass) tone(bass, STEP_SECONDS * 0.9, 'triangle', 0.05, when);
    if (note) tone(note, STEP_SECONDS * 0.6, 'square', 0.018, when);
    musicStep += 1;
  }, STEP_SECONDS * 1000);
}

function tone(freq, duration, type, volume, when) {
  if (!ctx || muted) return;
  const t = when ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function slide(from, to, duration, type, volume) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** A plip when an ingredient lands in the cup. */
export function soundPour() {
  slide(420, 180, 0.14, 'sine', 0.12);
}

/** The register's happy ding when a drink is served right. */
export function soundServe() {
  if (!ctx || muted) return;
  tone(880, 0.12, 'sine', 0.1);
  tone(1318.5, 0.18, 'sine', 0.1, ctx.currentTime + 0.09);
}

/** A coin arpeggio for a tip. */
export function soundCoins() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  [1046.5, 1318.5, 1568].forEach((f, i) => tone(f, 0.1, 'triangle', 0.07, t + i * 0.06));
}

/** A flat buzz for the wrong drink. */
export function soundWrong() {
  slide(220, 110, 0.25, 'sawtooth', 0.06);
}

/** A sad little slide when a customer storms out. */
export function soundWalkout() {
  slide(392, 196, 0.5, 'triangle', 0.09);
}

/** A doorbell when a new customer walks in. */
export function soundDoorbell() {
  if (!ctx || muted) return;
  tone(1174.66, 0.1, 'sine', 0.06);
  tone(987.77, 0.16, 'sine', 0.06, ctx.currentTime + 0.1);
}

/** A rising fanfare for a won day. */
export function soundWin() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.25, 'triangle', 0.09, t + i * 0.12));
}

/** A slow descent for a closed-early day. */
export function soundLose() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  [392, 349.23, 311.13, 261.63].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, t + i * 0.18));
}
