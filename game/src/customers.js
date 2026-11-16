// The regulars: who they are, what they order, and how their patience runs out.
// Drawing lives in render.js; this file is the data and the rules.
import { CUSTOMER_TYPES, INGREDIENTS, PATIENCE, SLOT_X, SLOT_Y, SLOTS } from './config.js';
import { pick, randFloat, randInt, shuffle } from './random.js';

/** Build one customer's order: `size` distinct ingredients, shuffled. */
export function makeOrder(rng, size) {
  const ids = shuffle(rng, INGREDIENTS.map((i) => i.id));
  return ids.slice(0, size).sort();
}

/** The cup's contents, sorted, as a comparable key. */
export function cupKey(cup) {
  return cup.slice().sort().join('+');
}

/** True when the cup holds exactly the order, no more and no less. */
export function orderMatches(cup, order) {
  return cupKey(cup) === order.slice().sort().join('+');
}

/** A new customer for `slot`, with a type and an order sized by the day's difficulty. */
export function createCustomer(rng, slot, difficulty) {
  const type = pick(rng, CUSTOMER_TYPES);
  const orderSize = Math.min(3, type.orderSize + (difficulty > 0.66 && rng() < 0.4 ? 1 : 0));
  const patience = randFloat(rng, PATIENCE.min, PATIENCE.max) * (type.patience / 21);
  return {
    slot,
    type,
    order: makeOrder(rng, orderSize),
    patience,
    maxPatience: patience,
    state: 'walking', // walking | waiting | happy | angry
    x: -140,
    targetX: SLOT_X[slot],
    y: SLOT_Y,
    bob: rng() * Math.PI * 2,
    servedDrink: null,
    mood: 'ok', // ok | impatient | furious
  };
}

/** The next free counter slot, or -1 when the counter is full. */
export function freeSlot(customers) {
  for (let slot = 0; slot < SLOTS; slot += 1) {
    if (!customers.some((c) => c.slot === slot && (c.state === 'walking' || c.state === 'waiting'))) return slot;
  }
  return -1;
}

/** One fixed step of a customer's life. Returns 'walkout' when they storm out. */
export function updateCustomer(c, dt, drainScale) {
  c.bob += dt * 6;
  if (c.state === 'walking') {
    c.x += 520 * dt;
    if (c.x >= c.targetX) {
      c.x = c.targetX;
      c.state = 'waiting';
    }
    return null;
  }
  if (c.state === 'waiting') {
    c.patience -= dt * drainScale;
    const left = c.patience / c.maxPatience;
    c.mood = left < 0.25 ? 'furious' : left < 0.55 ? 'impatient' : 'ok';
    if (c.patience <= 0) {
      c.patience = 0;
      c.state = 'angry';
      return 'walkout';
    }
    return null;
  }
  if (c.state === 'happy' || c.state === 'angry') {
    c.x += (c.state === 'happy' ? 520 : -520) * dt;
    if (c.x > 1420 || c.x < -260) return 'gone';
    return null;
  }
  return null;
}

/** A customer's tip multiplier: Gran Marnie pays double, everyone else pays single. */
export function tipMultiplier(c) {
  return c.type.tip;
}

/** A one-line summary of a customer, for the end-of-day tally. */
export function describeCustomer(c) {
  return `${c.type.name} (${c.order.length} ingredients)`;
}

/** The day's first customers, so the counter is never empty at the bell. */
export function openingRush(rng) {
  const first = createCustomer(rng, 0, 0);
  first.x = first.targetX;
  first.state = 'waiting';
  const second = createCustomer(rng, 1, 0);
  second.x = second.targetX;
  second.state = 'waiting';
  return [first, second];
}

/** A random small number, for a tip's cents. */
export function randomCents(rng) {
  return randInt(rng, 0, 40) / 100;
}
