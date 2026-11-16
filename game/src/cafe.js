// The cafe itself: the day's state, the rules, and one fixed step of play.
// Input arrives as small action objects ({ add, serve, clear, select, start, restart });
// the step returns the events that happened, so the caller can play sounds and
// flash the screen. The same step drives the live game and the staged screenshots.
import {
  DAY_SECONDS,
  TARGET_EARNINGS,
  STRIKES_TO_CLOSE,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  DRINK_NAMES,
  TIP_MAX,
  SPAWN,
  RUSH,
  BEST_KEY,
} from './config.js';
import { makeRng, randFloat } from './random.js';
import {
  createCustomer,
  freeSlot,
  updateCustomer,
  orderMatches,
  cupKey,
  tipMultiplier,
  openingRush,
  randomCents,
} from './customers.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** The name of the drink in the cup, when it matches one. */
export function drinkName(cup) {
  return DRINK_NAMES[cupKey(cup)] ?? null;
}

/** What the cup is worth, before tip. */
export function cupPrice(cup) {
  return cup.reduce((sum, id) => sum + INGREDIENT_BY_ID[id].price, 0);
}

/** A fresh day. `seed` drives every random choice, so a replayed day plays the same. */
export function createWorld(seed) {
  const rng = makeRng(seed);
  const world = {
    seed,
    rng,
    screen: SCREEN_TITLE,
    time: 0,
    money: 0,
    target: TARGET_EARNINGS,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    lost: 0,
    tips: 0,
    cup: [],
    selected: 0,
    customers: [],
    spawnTimer: SPAWN.first,
    flash: null, // { kind: 'good' | 'bad' | 'rush', until }
    lastServe: null, // { name, amount, tip, combo } for the floating "+$3.50"
    best: 0,
    dayOver: false,
  };
  try {
    world.best = Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch (e) {
    world.best = 0;
  }
  return world;
}

/** Put a world back at the title screen, keeping its best day. */
export function resetWorld(world) {
  const best = world.best;
  const fresh = createWorld(world.seed);
  fresh.best = best;
  Object.assign(world, fresh);
  world.screen = SCREEN_TITLE;
}

function startDay(world) {
  world.screen = SCREEN_PLAY;
  world.time = 0;
  world.money = 0;
  world.strikes = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.served = 0;
  world.lost = 0;
  world.tips = 0;
  world.cup = [];
  world.selected = 0;
  world.customers = openingRush(world.rng);
  world.spawnTimer = SPAWN.start;
  world.flash = null;
  world.lastServe = null;
  world.dayOver = false;
}

function saveBest(world) {
  if (world.money > world.best) {
    world.best = Math.floor(world.money);
    try {
      localStorage.setItem(BEST_KEY, String(world.best));
    } catch (e) {
      // A private window is fine: the best day just does not persist.
    }
  }
}

function endDay(world, won) {
  world.dayOver = true;
  world.screen = won ? SCREEN_WIN : SCREEN_OVER;
  world.customers = [];
  world.cup = [];
  saveBest(world);
}

/** How far into the day we are, 0 at the bell and 1 at closing time. */
export function dayProgress(world) {
  return Math.min(1, world.time / DAY_SECONDS);
}

/** True during rush hour. */
export function isRush(world) {
  return world.time >= RUSH.from && world.time <= RUSH.to;
}

/** The current spawn gap, shrinking as the day goes on. */
function spawnGap(world) {
  const p = dayProgress(world);
  let gap = SPAWN.start + (SPAWN.end - SPAWN.start) * p;
  if (isRush(world)) gap *= RUSH.spawnScale;
  return Math.max(SPAWN.min, gap);
}

/** The patience drain multiplier right now. */
function drainScale(world) {
  return isRush(world) ? RUSH.drainScale : 1;
}

function serveCup(world, events) {
  if (world.cup.length === 0) return;
  const waiting = world.customers.filter((c) => c.state === 'waiting');
  if (waiting.length === 0) return;
  const target = waiting.find((c) => c.slot === world.selected) ?? waiting[0];
  if (orderMatches(world.cup, target.order)) {
    const base = cupPrice(world.cup);
    const patienceLeft = target.patience / target.maxPatience;
    // A streak sweetens the tip: +10% a serve, up to +60%.
    const combo = 1 + Math.min(world.combo, 6) * 0.1;
    const tip = Math.round((TIP_MAX * patienceLeft * tipMultiplier(target) * combo + randomCents(world.rng)) * 100) / 100;
    const amount = Math.round((base + tip) * 100) / 100;
    world.money = Math.round((world.money + amount) * 100) / 100;
    world.tips = Math.round((world.tips + tip) * 100) / 100;
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.served += 1;
    world.lastServe = { name: target.type.name, amount, tip, combo: world.combo };
    world.flash = { kind: 'good', until: world.time + 0.5 };
    target.state = 'happy';
    target.servedDrink = world.cup.slice();
    world.cup = [];
    events.push('serve');
    events.push('coins');
    if (world.money >= world.target) endDay(world, true);
  } else {
    world.combo = 0;
    target.patience = Math.max(0.5, target.patience - 4);
    target.mood = 'furious';
    world.flash = { kind: 'bad', until: world.time + 0.4 };
    world.lastServe = { name: target.type.name, amount: 0, tip: 0, combo: 0, wrong: true };
    world.cup = [];
    events.push('wrong');
  }
}

/**
 * One fixed step of the cafe. `actions` is an object with any of:
 * add (ingredient id), serve (bool), clear (bool), select (slot index),
 * start (bool), restart (bool). Returns the events that happened.
 */
export function stepWorld(world, dt, actions = {}) {
  const events = [];
  if (world.screen === SCREEN_TITLE) {
    if (actions.start) {
      startDay(world);
      events.push('start');
    }
    return events;
  }
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_OVER) {
    if (actions.restart) {
      resetWorld(world);
      startDay(world);
      events.push('start');
    }
    return events;
  }

  world.time += dt;
  const drain = drainScale(world);

  if (actions.select !== undefined && actions.select !== null) {
    world.selected = actions.select;
  }
  if (actions.selectDelta) {
    const slots = world.customers.filter((c) => c.state === 'waiting').map((c) => c.slot).sort((a, b) => a - b);
    if (slots.length > 0) {
      const at = slots.indexOf(world.selected);
      world.selected = slots[((at < 0 ? 0 : at) + actions.selectDelta + slots.length) % slots.length];
    }
  }
  if (actions.add && world.cup.length < 4) {
    world.cup.push(actions.add);
    events.push('pour');
  }
  if (actions.clear) {
    world.cup = [];
    events.push('clear');
  }
  if (actions.serve) serveCup(world, events);
  if (world.dayOver) return events;

  for (let i = world.customers.length - 1; i >= 0; i -= 1) {
    const c = world.customers[i];
    const result = updateCustomer(c, dt, drain);
    if (result === 'walkout') {
      world.strikes += 1;
      world.lost += 1;
      world.combo = 0;
      world.flash = { kind: 'bad', until: world.time + 0.6 };
      events.push('walkout');
      if (world.strikes >= STRIKES_TO_CLOSE) {
        endDay(world, false);
        events.push('lose');
        return events;
      }
    } else if (result === 'gone') {
      world.customers.splice(i, 1);
    }
  }

  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    const slot = freeSlot(world.customers);
    if (slot >= 0) {
      world.customers.push(createCustomer(world.rng, slot, dayProgress(world)));
      events.push('doorbell');
    }
    world.spawnTimer = spawnGap(world) * randFloat(world.rng, 0.85, 1.15);
  }

  if (world.time >= DAY_SECONDS) {
    endDay(world, world.money >= world.target);
    events.push(world.screen === SCREEN_WIN ? 'win' : 'lose');
  }
  return events;
}

/** The ingredient ids the game accepts, in button order. */
export function ingredientIds() {
  return INGREDIENTS.map((i) => i.id);
}
