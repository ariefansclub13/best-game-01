// A tiny seeded random source (mulberry32), so a staged screenshot and a replayed
// day always play the same way. The live game seeds it from the clock.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number in [min, max], from `rng`. */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** A float in [min, max), from `rng`. */
export function randFloat(rng, min, max) {
  return min + rng() * (max - min);
}

/** One element of `list`, from `rng`. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** A shuffled copy of `list`, from `rng`. */
export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
