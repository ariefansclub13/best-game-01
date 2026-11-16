// Keyboard and mouse, both first-class: every action the game needs is on a key
// and on a button. This file turns DOM events into the action objects cafe.js
// understands, and owns the click regions (shared with render.js via config).
import { INGREDIENTS, LAYOUT, SLOTS, SLOT_X } from './config.js';
import { unlockAudio, toggleMute } from './audio.js';

function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** The field point under a mouse event, or null when the pointer missed the canvas. */
function fieldPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 1280;
  const y = ((event.clientY - rect.top) / rect.height) * 720;
  return { x, y };
}

/**
 * Bind the canvas and the window. `onAction` receives the action objects;
 * `getScreen` tells us which screen is up, so clicks mean the right thing.
 * Returns a detach function (unused by the game, handy for tests).
 */
export function bindInput(canvas, onAction, getScreen) {
  function click(event) {
    unlockAudio();
    const point = fieldPoint(canvas, event);
    const screen = getScreen();
    if (inside(point.x, point.y, LAYOUT.mute)) {
      toggleMute();
      return;
    }
    if (screen === 'title') {
      if (inside(point.x, point.y, LAYOUT.titleButton)) onAction({ start: true });
      return;
    }
    if (screen === 'win' || screen === 'over') {
      if (inside(point.x, point.y, LAYOUT.againButton)) onAction({ restart: true });
      return;
    }
    // Play: pick a customer, pour an ingredient, serve, or clear the cup.
    for (let slot = 0; slot < SLOTS; slot += 1) {
      const hit = {
        x: SLOT_X[slot] - 110,
        y: 180,
        w: LAYOUT.slotHit.w,
        h: LAYOUT.slotHit.h,
      };
      if (inside(point.x, point.y, hit)) {
        onAction({ select: slot });
        onAction({ serve: true });
        return;
      }
    }
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (inside(point.x, point.y, LAYOUT.ingredients[i])) {
        onAction({ add: INGREDIENTS[i].id });
        return;
      }
    }
    if (inside(point.x, point.y, LAYOUT.serve)) {
      onAction({ serve: true });
      return;
    }
    if (inside(point.x, point.y, LAYOUT.clear)) {
      onAction({ clear: true });
    }
  }

  function key(event) {
    const screen = getScreen();
    if (event.key === 'm' || event.key === 'M') {
      toggleMute();
      return;
    }
    unlockAudio();
    if (screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onAction({ start: true });
      return;
    }
    if ((screen === 'win' || screen === 'over') && (event.key === 'r' || event.key === 'R' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onAction({ restart: true });
      return;
    }
    if (screen !== 'play') return;
    const ingredient = INGREDIENTS.find((i) => i.key === event.key);
    if (ingredient) {
      onAction({ add: ingredient.id });
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onAction({ serve: true });
      return;
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      onAction({ clear: true });
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      onAction({ selectDelta: event.key === 'ArrowLeft' ? -1 : 1 });
    }
  }

  canvas.addEventListener('click', click);
  window.addEventListener('keydown', key);
  return () => {
    canvas.removeEventListener('click', click);
    window.removeEventListener('keydown', key);
  };
}
