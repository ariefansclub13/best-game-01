// Kopi Panic! — one tiny cafe, too many thirsty strangers.
// Bootstrap: the canvas, the fixed-step loop, the input, and the screenshot mode.
import { FIELD, STEP } from './config.js';
import { createWorld, stepWorld, SCREEN_TITLE } from './cafe.js';
import { drawWorld } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';
import {
  unlockAudio,
  soundPour,
  soundServe,
  soundCoins,
  soundWrong,
  soundWalkout,
  soundDoorbell,
  soundWin,
  soundLose,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedRaw = params.get('seed');
const seed = seedRaw === null ? (Date.now() % 2147483647) : (Number(seedRaw) || 7);

let world;
let screen = SCREEN_TITLE;

if (shotName) {
  // Screenshot mode: stage a scene from the real rules and draw it once.
  const staged = stageShot(shotName, seed);
  world = staged.world;
  screen = staged.screen;
  drawWorld(ctx, world, 0);
  window.__shotReady = true;
} else {
  world = createWorld(seed);
  screen = world.screen;
  window.__shotReady = false;
}

const pending = [];
bindInput(canvas, (action) => pending.push(action), () => world.screen);

function playEvents(events) {
  for (const event of events) {
    if (event === 'pour') soundPour();
    else if (event === 'serve') soundServe();
    else if (event === 'coins') soundCoins();
    else if (event === 'wrong') soundWrong();
    else if (event === 'walkout') soundWalkout();
    else if (event === 'doorbell') soundDoorbell();
    else if (event === 'win') soundWin();
    else if (event === 'lose') soundLose();
  }
}

let last = performance.now();
let accumulator = 0;
let bootTime = last;

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    accumulator -= STEP;
    const actions = {};
    while (pending.length > 0) {
      const action = pending.shift();
      if (action.add) actions.add = action.add;
      if (action.serve) actions.serve = true;
      if (action.clear) actions.clear = true;
      if (action.select !== undefined) actions.select = action.select;
      if (action.selectDelta) actions.selectDelta = action.selectDelta;
      if (action.start) actions.start = true;
      if (action.restart) actions.restart = true;
    }
    const events = stepWorld(world, STEP, actions);
    playEvents(events);
  }
  const seconds = (now - bootTime) / 1000;
  drawWorld(ctx, world, seconds);
  window.__shotReady = true;
}

if (!shotName) {
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  requestAnimationFrame(frame);
}

// For the play-tests and the curious: the live world, right there on the window.
window.__kopi = { get world() { return world; } };
