// Everything the player sees, drawn on one canvas. The scene is a tiny cafe:
// a sunny wall, a wooden counter, four regulars, and the cup you are building.
// All art is drawn with canvas shapes — no image files, no network.
import {
  FIELD,
  DAY_SECONDS,
  TARGET_EARNINGS,
  STRIKES_TO_CLOSE,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  LAYOUT,
  SLOT_X,
  SLOT_Y,
  PALETTE,
  FONT,
} from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_OVER, drinkName, cupPrice, isRush } from './cafe.js';
import { isMuted } from './audio.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function money(n) {
  return `$${n.toFixed(2)}`;
}

function clock(seconds) {
  const left = Math.max(0, Math.ceil(DAY_SECONDS - seconds));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** A little icon for one ingredient, drawn at (x, y) with radius r. */
function drawIngredientIcon(ctx, id, x, y, r) {
  const ing = INGREDIENT_BY_ID[id];
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (id === 'espresso') {
    ctx.fillStyle = '#fff6e5';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.35, y + r * 0.25, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'milk') {
    ctx.fillStyle = '#c9a86a';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y + r * 0.4);
    ctx.quadraticCurveTo(x, y - r * 0.7, x + r * 0.5, y + r * 0.4);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'sugar') {
    ctx.fillStyle = '#d9c9a8';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
    ctx.restore();
  } else if (id === 'ice') {
    ctx.fillStyle = '#5aa9d6';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.7);
    ctx.lineTo(x + r * 0.55, y);
    ctx.lineTo(x, y + r * 0.7);
    ctx.lineTo(x - r * 0.55, y);
    ctx.closePath();
    ctx.fill();
  }
}

/** The cafe room: sunny wall, window, shelves of cups, wooden counter, floor. */
function drawRoom(ctx, now) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, 420);
  ctx.fillStyle = PALETTE.wallStripe;
  for (let x = 0; x < FIELD.width; x += 80) ctx.fillRect(x, 0, 26, 420);
  // A window with a lazy sun and a drifting cloud.
  ctx.fillStyle = '#bfe6f2';
  roundRect(ctx, 60, 24, 240, 120, 16);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(112, 66, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  const cx = 190 + Math.sin(now * 0.1) * 14;
  ctx.beginPath();
  ctx.arc(cx, 52, 14, 0, Math.PI * 2);
  ctx.arc(cx + 18, 57, 11, 0, Math.PI * 2);
  ctx.arc(cx + 36, 52, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  roundRect(ctx, 60, 24, 240, 120, 16);
  ctx.stroke();
  // A chalk menu on the wall, clear of the HUD bar above it.
  ctx.fillStyle = '#22303c';
  roundRect(ctx, 1050, 76, 180, 114, 12);
  ctx.fill();
  text(ctx, 'MENU', 1140, 100, 18, '#f4b400', 'center', 800);
  text(ctx, 'espresso $2 · milk $1', 1140, 122, 12, '#fff6e5', 'center', 600);
  text(ctx, 'sugar 50c · ice 50c', 1140, 142, 12, '#fff6e5', 'center', 600);
  text(ctx, 'tips if they smile!', 1140, 164, 12, '#f4b400', 'center', 600);
  // One shelf of cups, low enough to stay clear of the serve banner.
  ctx.fillStyle = PALETTE.shelf;
  ctx.fillRect(380, 150, 520, 14);
  for (let i = 0; i < 6; i += 1) {
    const x = 400 + i * 82;
    ctx.fillStyle = ['#e76f51', '#2a9d8f', '#f4b400', '#7b5ea7', '#e76f51', '#2a9d8f'][i];
    roundRect(ctx, x, 118, 34, 32, 6);
    ctx.fill();
  }
  // Floor and counter.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 600, FIELD.width, 120);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 0; x < FIELD.width; x += 120) ctx.fillRect(x, 600, 4, 120);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, 420, FIELD.width, 18);
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(0, 438, FIELD.width, 162);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = 40; x < FIELD.width; x += 160) ctx.fillRect(x, 438, 6, 162);
  // A little plant on the counter, between the second and third seats.
  ctx.fillStyle = '#2e8b57';
  ctx.beginPath();
  ctx.arc(868, 396, 15, 0, Math.PI * 2);
  ctx.arc(852, 406, 10, 0, Math.PI * 2);
  ctx.arc(884, 406, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e76f51';
  roundRect(ctx, 856, 406, 26, 14, 4);
  ctx.fill();
  // A tip jar on the counter, set well inside the right edge so it reads as
  // a deliberate prop, never a clipped one.
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  roundRect(ctx, 1110, 372, 52, 48, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, 1110, 372, 52, 48, 8);
  ctx.stroke();
  ctx.fillStyle = '#f4b400';
  ctx.fillRect(1118, 400, 36, 12);
  text(ctx, 'TIPS', 1136, 368, 13, PALETTE.ink, 'center', 800);
}

/** One regular, drawn by type, with their mood on their face. */
function drawCustomer(ctx, c, now) {
  const x = c.x;
  const y = c.y + Math.sin(c.bob) * 2;
  const t = c.type;
  const angry = c.mood === 'furious';
  const worried = c.mood === 'impatient';
  // Body.
  ctx.fillStyle = t.body;
  ctx.beginPath();
  ctx.ellipse(x, y + 78, 58, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.belly;
  ctx.beginPath();
  ctx.ellipse(x, y + 92, 38, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head.
  ctx.fillStyle = t.body;
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.fill();
  if (c.type.id === 'pigeon') {
    // A tiny tie, because Pip is a professional.
    ctx.fillStyle = '#e76f51';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 34);
    ctx.lineTo(x + 8, y + 34);
    ctx.lineTo(x, y + 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#22303c';
    ctx.beginPath();
    ctx.arc(x - 14, y - 8, 5, 0, Math.PI * 2);
    ctx.arc(x + 14, y - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4b400';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 2);
    ctx.lineTo(x + 6, y + 2);
    ctx.lineTo(x, y + 12);
    ctx.closePath();
    ctx.fill();
  } else if (c.type.id === 'robot') {
    ctx.fillStyle = '#22303c';
    ctx.fillRect(x - 26, y - 18, 52, 8);
    ctx.fillStyle = angry ? '#e76f51' : '#7df9c8';
    ctx.beginPath();
    ctx.arc(x - 14, y - 6, 6, 0, Math.PI * 2);
    ctx.arc(x + 14, y - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22303c';
    ctx.fillRect(x - 12, y + 12, 24, 4);
    ctx.fillStyle = '#f4b400';
    ctx.fillRect(x - 3, y - 52, 6, 12);
    ctx.beginPath();
    ctx.arc(x, y - 56, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.type.id === 'gran') {
    ctx.fillStyle = '#7b5ea7';
    ctx.beginPath();
    ctx.ellipse(x, y - 26, 52, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 30, y - 62, 60, 38);
    ctx.fillStyle = '#f4b400';
    ctx.fillRect(x - 30, y - 30, 60, 8);
    ctx.fillStyle = '#22303c';
    ctx.beginPath();
    ctx.arc(x - 14, y - 4, 4, 0, Math.PI * 2);
    ctx.arc(x + 14, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#22303c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 10, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (c.type.id === 'cat') {
    ctx.fillStyle = t.body;
    ctx.beginPath();
    ctx.moveTo(x - 34, y - 22);
    ctx.lineTo(x - 26, y - 52);
    ctx.lineTo(x - 8, y - 30);
    ctx.closePath();
    ctx.moveTo(x + 34, y - 22);
    ctx.lineTo(x + 26, y - 52);
    ctx.lineTo(x + 8, y - 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(x - 24, y + 34, 48, 12);
    ctx.fillStyle = '#22303c';
    ctx.beginPath();
    ctx.arc(x - 14, y - 6, 4, 0, Math.PI * 2);
    ctx.arc(x + 14, y - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e76f51';
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x + 5, y + 4);
    ctx.lineTo(x, y + 11);
    ctx.closePath();
    ctx.fill();
  } else if (c.type.id === 'duck') {
    ctx.fillStyle = '#f4b400';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e07a2f';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22303c';
    ctx.beginPath();
    ctx.arc(x - 14, y - 10, 4, 0, Math.PI * 2);
    ctx.arc(x + 14, y - 10, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Omar, the office zombie: droopy eyes, a crooked tie, no sleep.
    ctx.fillStyle = '#22303c';
    ctx.beginPath();
    ctx.arc(x - 14, y - 6, 5, 0, Math.PI * 2);
    ctx.arc(x + 14, y - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#22303c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 16);
    ctx.lineTo(x + 18, y + 16);
    ctx.stroke();
    ctx.fillStyle = '#5b7a8c';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 34);
    ctx.lineTo(x + 6, y + 34);
    ctx.lineTo(x + 2, y + 58);
    ctx.lineTo(x - 4, y + 58);
    ctx.closePath();
    ctx.fill();
  }
  // Mood eyebrows when they are losing patience.
  if (worried || angry) {
    ctx.strokeStyle = '#22303c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 22, y - (angry ? 14 : 20));
    ctx.lineTo(x - 6, y - (angry ? 20 : 16));
    ctx.moveTo(x + 22, y - (angry ? 14 : 20));
    ctx.lineTo(x + 6, y - (angry ? 20 : 16));
    ctx.stroke();
  }
  if (c.state === 'happy') {
    text(ctx, '♪', x + 52, y - 34, 26, PALETTE.teal, 'center', 800);
  }
  if (c.state === 'angry') {
    text(ctx, '💢', x + 52, y - 34, 24, PALETTE.coral, 'center', 800);
  }
}

/** The order bubble above a waiting customer, with its ingredient icons. */
function drawOrderBubble(ctx, c) {
  if (c.state !== 'waiting') return;
  const x = c.x;
  const y = c.y - 96;
  const w = 30 + c.order.length * 36;
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, x - w / 2, y, w, 52, 14);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 50);
  ctx.lineTo(x + 10, y + 50);
  ctx.lineTo(x, y + 64);
  ctx.closePath();
  ctx.fillStyle = '#fffdf6';
  ctx.fill();
  ctx.stroke();
  c.order.forEach((id, i) => {
    drawIngredientIcon(ctx, id, x - w / 2 + 30 + i * 36, y + 26, 13);
  });
  // Patience bar under the bubble.
  const left = Math.max(0, c.patience / c.maxPatience);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, x - 44, y + 60, 88, 8, 4);
  ctx.fill();
  ctx.fillStyle = left < 0.25 ? '#e76f51' : left < 0.55 ? '#f4b400' : '#2a9d8f';
  roundRect(ctx, x - 44, y + 60, 88 * left, 8, 4);
  ctx.fill();
  text(ctx, c.type.name, x, y - 8, 14, PALETTE.ink, 'center', 800);
}

/** The cup station on the counter: the cup, its layers, and its drink name. */
function drawCupStation(ctx, world) {
  const r = LAYOUT.cup;
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'YOUR CUP', r.x + 16, r.y + 24, 13, PALETTE.muted, 'left', 800);
  const name = drinkName(world.cup);
  text(ctx, name ?? (world.cup.length ? 'a mystery brew…' : 'empty — pick a drink!'), r.x + 16, r.y + 46, 15, PALETTE.ink, 'left', 700);
  // The cup itself, with a layer per ingredient.
  const cx = r.x + 34;
  const cy = r.y + 62;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 44, cy);
  ctx.lineTo(cx + 40, cy + 40);
  ctx.lineTo(cx + 4, cy + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 46, cy + 20, 9, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  world.cup.forEach((id, i) => {
    const ing = INGREDIENT_BY_ID[id];
    ctx.fillStyle = ing.color;
    const y = cy + 38 - (i + 1) * 9;
    ctx.fillRect(cx + 5, y, 34, 8);
  });
  // Little icons of what is inside, in order.
  world.cup.forEach((id, i) => {
    drawIngredientIcon(ctx, id, r.x + 108 + i * 26, r.y + 84, 10);
  });
  if (world.cup.length > 0) {
    text(ctx, money(cupPrice(world.cup)), r.x + r.w - 14, r.y + 46, 15, PALETTE.teal, 'right', 800);
  }
}

/** The four ingredient buttons, serve and clear. */
function drawControls(ctx, world) {
  INGREDIENTS.forEach((ing, i) => {
    const r = LAYOUT.ingredients[i];
    const inCup = world.cup.includes(ing.id);
    ctx.fillStyle = inCup ? '#ffe9a8' : '#fffdf6';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.stroke();
    drawIngredientIcon(ctx, ing.id, r.x + 24, r.y + 28, 12);
    text(ctx, ing.name, r.x + 44, r.y + 24, 15, PALETTE.ink, 'left', 700);
    text(ctx, `${money(ing.price)}  ·  key ${ing.key}`, r.x + 44, r.y + 44, 12, PALETTE.muted, 'left', 600);
  });
  const serve = LAYOUT.serve;
  ctx.fillStyle = world.cup.length ? PALETTE.teal : '#b9b2a4';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'SERVE  (space)', serve.x + serve.w / 2, serve.y + 35, 17, '#ffffff', 'center', 800);
  const clear = LAYOUT.clear;
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, clear.x, clear.y, clear.w, clear.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Dump it', clear.x + clear.w / 2, clear.y + 35, 15, PALETTE.ink, 'center', 700);
}

/** The top bar: money against the target, the clock, strikes, combo. */
function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(34,48,60,0.92)';
  roundRect(ctx, 12, 12, 1256, 56, 14);
  ctx.fill();
  text(ctx, `EARNED ${money(world.money)}`, 32, 48, 22, '#fff6e5', 'left', 800);
  const p = Math.min(1, world.money / world.target);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 260, 26, 300, 20, 10);
  ctx.fill();
  ctx.fillStyle = p >= 1 ? '#7df9c8' : '#f4b400';
  roundRect(ctx, 260, 26, 300 * p, 20, 10);
  ctx.fill();
  text(ctx, `target ${money(world.target)}`, 570, 42, 14, '#fff6e5', 'left', 600);
  text(ctx, isRush(world) ? '⚡ RUSH HOUR' : `⏱ ${clock(world.time)}`, 760, 48, 22, isRush(world) ? '#f4b400' : '#fff6e5', 'left', 800);
  // Strikes: three cups that crack as customers walk out. They sit in their
  // own zone, clear of the streak label to their right.
  for (let i = 0; i < STRIKES_TO_CLOSE; i += 1) {
    const x = 980 + i * 36;
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(i < world.strikes ? '💔' : '☕', x, 50);
  }
  // The streak label gets its own reserved run, right-aligned just left of
  // the mute button, so it never slides under the cups or the button.
  text(ctx, world.combo > 1 ? `🔥 x${world.combo} streak` : 'no streak yet', 1208, 42, 14, '#f4b400', 'right', 700);
  if (world.lastServe) {
    const s = world.lastServe;
    const str = s.wrong ? `${s.name} sent it back!` : `+${money(s.amount)} from ${s.name}${s.tip > 0 ? ` (tip ${money(s.tip)})` : ''}`;
    ctx.font = `700 16px ${FONT}`;
    const w = ctx.measureText(str).width + 28;
    ctx.fillStyle = 'rgba(34,48,60,0.88)';
    roundRect(ctx, 640 - w / 2, 78, w, 30, 15);
    ctx.fill();
    text(ctx, str, 640, 99, 16, s.wrong ? '#ffb3a3' : '#7df9c8', 'center', 700);
  }
  // Mute button.
  ctx.fillStyle = 'rgba(34,48,60,0.92)';
  roundRect(ctx, LAYOUT.mute.x, LAYOUT.mute.y, LAYOUT.mute.w, LAYOUT.mute.h, 10);
  ctx.fill();
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isMuted() ? '🔇' : '🔊', LAYOUT.mute.x + 22, LAYOUT.mute.y + 31);
}

function drawButton(ctx, rect, label, sub) {
  ctx.fillStyle = PALETTE.sunny;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 16);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + 40, 24, PALETTE.ink, 'center', 800);
  if (sub) text(ctx, sub, rect.x + rect.w / 2, rect.y + rect.h + 28, 15, PALETTE.cream, 'center', 600);
}

function drawTitle(ctx, world, now) {
  drawRoom(ctx, now);
  ctx.fillStyle = 'rgba(34,48,60,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'KOPI PANIC!', 640, 158, 84, '#f4b400', 'center', 900);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  text(ctx, 'one tiny café · too many thirsty strangers', 640, 200, 24, '#fff6e5', 'center', 600);
  // The mascot: a smiling coffee cup with arms akimbo.
  const cx = 640;
  const cy = 330;
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 60, cy - 30);
  ctx.lineTo(cx + 60, cy - 30);
  ctx.lineTo(cx + 50, cy + 40);
  ctx.lineTo(cx - 50, cy + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 66, cy, 18, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = '#4a2c1a';
  ctx.fillRect(cx - 52, cy - 22, 104, 12);
  ctx.fillStyle = '#22303c';
  ctx.beginPath();
  ctx.arc(cx - 20, cy - 2, 6, 0, Math.PI * 2);
  ctx.arc(cx + 20, cy - 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#22303c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 16, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Steam, wiggling.
  ctx.strokeStyle = 'rgba(255,246,229,0.9)';
  ctx.lineWidth = 4;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 26, cy - 40);
    ctx.quadraticCurveTo(cx + i * 26 + Math.sin(now * 2 + i) * 8, cy - 62, cx + i * 26, cy - 82);
    ctx.stroke();
  }
  text(ctx, 'Brew what each customer orders. Serve it before their patience runs dry.', 640, 420, 20, '#fff6e5', 'center', 600);
  text(ctx, 'Click the ingredients (or press 1–4), then click the customer to serve. 3 walk-outs closes the café.', 640, 450, 20, '#fff6e5', 'center', 600);
  text(ctx, `Earn ${money(TARGET_EARNINGS)} in ${DAY_SECONDS} seconds to win the day.`, 640, 480, 20, '#f4b400', 'center', 700);
  drawButton(ctx, LAYOUT.titleButton, '☕ OPEN THE CAFÉ', 'click or press Enter');
  if (world.best > 0) text(ctx, `Best day so far: ${money(world.best)}`, 640, 640, 18, '#fff6e5', 'center', 700);
}

function drawEndPanel(ctx, world, won) {
  ctx.fillStyle = 'rgba(34,48,60,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.paper;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 90, 600, 400, 20);
  ctx.fill();
  ctx.stroke();
  if (won) {
    text(ctx, '🎉 DAY COMPLETE!', 640, 170, 44, PALETTE.teal, 'center', 900);
    text(ctx, 'The café survived, and the regulars are happy.', 640, 210, 19, PALETTE.ink, 'center', 600);
  } else {
    text(ctx, '🚪 CLOSED EARLY', 640, 170, 44, PALETTE.coral, 'center', 900);
    text(ctx, 'Three customers stormed out. The café shutters are down.', 640, 210, 19, PALETTE.ink, 'center', 600);
  }
  const rows = [
    ['Money earned', money(world.money)],
    ['Target', money(world.target)],
    ['Drinks served', String(world.served)],
    ['Customers lost', String(world.lost)],
    ['Tips collected', money(world.tips)],
    ['Best streak', `x${world.bestCombo}`],
    ['Best day ever', money(world.best)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 258 + i * 30;
    text(ctx, label, 400, y, 18, PALETTE.muted, 'left', 600);
    text(ctx, value, 880, y, 18, PALETTE.ink, 'right', 800);
  });
  drawButton(ctx, LAYOUT.againButton, won ? '☕ OPEN AGAIN' : '🔁 TRY ANOTHER DAY', 'click or press R');
}

/** Draw the whole game for this frame. `now` is seconds since boot, for animation. */
export function drawWorld(ctx, world, now) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world, now);
    return;
  }
  drawRoom(ctx, now);
  const selected = world.customers.find((c) => c.slot === world.selected && c.state === 'waiting');
  if (world.screen === SCREEN_PLAY && selected) {
    ctx.strokeStyle = PALETTE.sunny;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.ellipse(selected.x, selected.y + 82, 74, 70, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  world.customers.forEach((c) => drawCustomer(ctx, c, now));
  world.customers.forEach((c) => drawOrderBubble(ctx, c));
  drawCupStation(ctx, world);
  drawControls(ctx, world);
  drawHud(ctx, world);
  if (world.flash && world.time < world.flash.until) {
    ctx.fillStyle = world.flash.kind === 'good' ? 'rgba(46,139,87,0.12)' : 'rgba(231,111,81,0.16)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
  if (world.screen === SCREEN_WIN) drawEndPanel(ctx, world, true);
  if (world.screen === SCREEN_OVER) drawEndPanel(ctx, world, false);
}
