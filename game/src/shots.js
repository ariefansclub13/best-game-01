// The screenshot scenes behind ?shot=start|play|win|over. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot, so the frame is what a real game looks like and the same seed always
// gives the same frame. The win scene's pilot serves every order right; the
// game-over scene's pilot never serves at all, so the regulars walk out.
import { STEP } from './config.js';
import { createWorld, stepWorld, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, SCREEN_OVER } from './cafe.js';
import { orderMatches } from './customers.js';

const PLAY_SECONDS = 45;
const LIMIT_SECONDS = 600;
const SAMPLE = STEP;

/** The pilot's move: pour the next missing ingredient of the first waiting
 * customer's order, or serve when the cup already matches it. `delay` is how
 * many steps the pilot waits between moves, so a queue can build up like a
 * human player's would. */
function goodPilot(world, delay) {
  return function pilot(stepCount) {
    if (stepCount % delay !== 0) return {};
    const waiting = world.customers.filter((c) => c.state === 'waiting');
    if (waiting.length === 0) return {};
    const target = waiting[0];
    if (orderMatches(world.cup, target.order)) return { select: target.slot, serve: true };
    for (const id of target.order) {
      if (!world.cup.includes(id)) return { add: id };
    }
    return { clear: true };
  };
}

/** The careless pilot: nothing. The customers leave on their own. */
function idlePilot() {
  return function pilot() {
    return {};
  };
}

/**
 * Set `world` to the named scene (start, play, win or over; any other name is
 * start) and return the screen to draw over it.
 */
export function stageShot(name, seed) {
  const world = createWorld(seed);
  if (name !== 'play' && name !== 'win' && name !== 'over') {
    return { world, screen: SCREEN_TITLE };
  }
  stepWorld(world, 0, { start: true });
  const pilot = name === 'over' ? idlePilot() : name === 'play' ? goodPilot(world, 90) : goodPilot(world, 1);
  const limit = LIMIT_SECONDS;
  let stepCount = 0;
  for (let t = 0; t < limit; t += SAMPLE) {
    stepCount += 1;
    stepWorld(world, SAMPLE, pilot(stepCount));
    if (name === 'play' && t >= PLAY_SECONDS) break;
    if (name === 'win' && world.screen === SCREEN_WIN) break;
    if (name === 'over' && world.screen === SCREEN_OVER) break;
  }
  if (world.screen === SCREEN_WIN) return { world, screen: SCREEN_WIN };
  if (world.screen === SCREEN_OVER) return { world, screen: SCREEN_OVER };
  return { world, screen: SCREEN_PLAY };
}
