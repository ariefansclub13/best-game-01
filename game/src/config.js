// Every tuning number, colour and layout rect in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One working day: 90 seconds to earn the target, or the cafe closes early on 3 walk-outs. */
export const DAY_SECONDS = 90;
export const TARGET_EARNINGS = 60;
export const STRIKES_TO_CLOSE = 3;

/** The four things a barista can put in a cup. Price is what the drink is worth. */
export const INGREDIENTS = [
  { id: 'espresso', name: 'Espresso', key: '1', price: 2.0, color: '#4a2c1a', ink: '#fff6e5', blurb: 'a dark shot' },
  { id: 'milk', name: 'Steamed milk', key: '2', price: 1.0, color: '#f3e3c2', ink: '#4a2c1a', blurb: 'cloud-soft' },
  { id: 'sugar', name: 'Sugar', key: '3', price: 0.5, color: '#ffffff', ink: '#4a2c1a', blurb: 'one sweet cube' },
  { id: 'ice', name: 'Ice', key: '4', price: 0.5, color: '#9fd8ef', ink: '#22303c', blurb: 'extra cold' },
];
export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

/** Named drinks, for the little label that appears when a cup matches one. */
export const DRINK_NAMES = {
  'espresso': 'A Lone Shot',
  'espresso+ice': 'Iced Americano',
  'espresso+milk': 'Flat White',
  'espresso+milk+sugar': 'Honey Hug Latte',
  'espresso+milk+ice': 'Iced Latte',
  'espresso+sugar': 'Sweet Shot',
  'espresso+milk+sugar+ice': 'The Everything',
  'milk': 'Warm Milk, Plain',
  'milk+sugar': 'Sweet Milk',
  'milk+ice': 'Iced Milk',
  'ice': 'A Glass of Ice',
};

/** Tip for a perfect serve, scaled by the patience left; a streak sweetens it. */
export const TIP_MAX = 2.0;

/** Patience, in seconds, before a customer storms out. */
export const PATIENCE = { min: 16, max: 26 };
/** Rush hour (the middle of the day): faster spawns, faster draining. */
export const RUSH = { from: 38, to: 62, spawnScale: 0.55, drainScale: 1.4 };
/** Spawn gap between customers, in seconds, from the day's start to its end. */
export const SPAWN = { first: 1.0, start: 4.5, end: 2.6, min: 1.8 };

/** The regulars. Each one is a little absurd, and each one is picky in their own way. */
export const CUSTOMER_TYPES = [
  { id: 'pigeon', name: 'Pip the Pigeon', title: 'wears a tie, tips in crumbs', patience: 16, orderSize: 2, tip: 1.0, body: '#8d99ae', belly: '#e9ecef', accent: '#e76f51' },
  { id: 'robot', name: 'Bolt the Robot', title: 'runs on coffee, literally', patience: 26, orderSize: 3, tip: 1.0, body: '#2a9d8f', belly: '#b7e4de', accent: '#f4b400' },
  { id: 'gran', name: 'Gran Marnie', title: 'knows every barista by name', patience: 26, orderSize: 2, tip: 2.0, body: '#7b5ea7', belly: '#e6dcf2', accent: '#f4b400' },
  { id: 'cat', name: 'Mochi the Cat', title: 'judges your latte art', patience: 18, orderSize: 2, tip: 1.0, body: '#e07a2f', belly: '#ffe3c2', accent: '#2a9d8f' },
  { id: 'duck', name: 'Dara the Duck', title: 'quacks when the foam is wrong', patience: 20, orderSize: 3, tip: 1.0, body: '#f4b400', belly: '#fff3c4', accent: '#e76f51' },
  { id: 'zombie', name: 'Omar the Office Zombie', title: 'has not slept since Tuesday', patience: 22, orderSize: 3, tip: 1.0, body: '#8a9a7b', belly: '#dfe8d5', accent: '#22303c' },
];

/** Four counter slots, left to right, where customers stand. */
export const SLOTS = 4;
export const SLOT_X = [150, 420, 690, 960];
export const SLOT_Y = 300;

/** Where things sit on the 1280x720 field. Input and render share these rects. */
export const LAYOUT = {
  counterTop: 420,
  counterHeight: 180,
  cup: { x: 540, y: 440, w: 200, h: 120 },
  serve: { x: 980, y: 620, w: 220, h: 56 },
  clear: { x: 740, y: 620, w: 120, h: 56 },
  ingredients: [
    { x: 60, y: 620, w: 150, h: 56 },
    { x: 230, y: 620, w: 150, h: 56 },
    { x: 400, y: 620, w: 150, h: 56 },
    { x: 570, y: 620, w: 150, h: 56 },
  ],
  slotHit: { w: 220, h: 240 },
  titleButton: { x: 490, y: 520, w: 300, h: 64 },
  againButton: { x: 490, y: 520, w: 300, h: 64 },
  mute: { x: 1220, y: 16, w: 44, h: 44 },
};

export const PALETTE = {
  wall: '#ffe9c9',
  wallStripe: '#ffd9a0',
  floor: '#e8b07d',
  counter: '#8a5a3b',
  counterTop: '#b07a4e',
  shelf: '#7b4a2d',
  ink: '#22303c',
  cream: '#fff6e5',
  paper: '#fffdf6',
  teal: '#2a9d8f',
  coral: '#e76f51',
  sunny: '#f4b400',
  lilac: '#7b5ea7',
  muted: '#8a7a66',
  good: '#2e8b57',
  bad: '#c0392b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best day is kept between visits (this browser only). */
export const BEST_KEY = 'kopi-panic-best-day';
