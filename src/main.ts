import './styles.css';
import { PALETTES } from './palettes';
import { GHOST, WAX } from './settings';
import { TAGLINES, pick } from './words';
import { createWax } from './wax/wax';
import { drawLetters, fontReady } from './wax/letters';
import { Ghost } from './ghost/ghost';
import { SHAPE_NAMES } from './ghost/shapes';

// A different colour scheme, ghost and tagline on every visit.
const palette = PALETTES[pick(Object.keys(PALETTES))];
const root = document.documentElement;
for (const key of ['bg0', 'bg1', 'wax0', 'wax1', 'p', 'text'] as const) root.style.setProperty(`--${key}`, palette[key]);
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.bg0);

const tagline = document.querySelector<HTMLElement>('#tagline');
if (tagline) tagline.textContent = pick(TAGLINES);

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const waxCanvas = document.querySelector<HTMLCanvasElement>('#wax');
const ghostCanvas = document.querySelector<HTMLCanvasElement>('#ghost');

const wax = waxCanvas ? createWax(waxCanvas, palette) : null;
if (!wax) root.classList.add('no-gl');

let ghost: Ghost | null = null;
if (ghostCanvas) {
  try {
    ghost = new Ghost(ghostCanvas, palette, pick(SHAPE_NAMES), still, () => {
      if (still) drawStill();
    });
  } catch (err) {
    console.warn(err);
  }
}

let fontLoaded = false;
let waxScale = 1;

function layout(): void {
  const w = innerWidth;
  const h = innerHeight;
  if (wax) waxScale = wax.resize(w, h);
  ghost?.resize(w, h);
  if (wax && fontLoaded) wax.setLetters(drawLetters(w, h, waxScale));
  if (still) drawStill();
}

/** With reduced motion: one frame, redrawn only when something changes. */
const STILL_TIME = 20;
function drawStill(): void {
  wax?.render(STILL_TIME, 0, 0, ghostInWax());
  ghost?.draw(STILL_TIME);
}

function ghostInWax() {
  return { x: ghost?.x ?? -1e4, y: ghost?.y ?? -1e4, pull: ghost ? GHOST.pull : 0, glow: ghost ? GHOST.glow : 0 };
}

let resizeTimer = 0;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(layout, 100);
});
layout();
fontReady().then(() => {
  fontLoaded = true;
  layout();
});

if (!still) {
  let last = performance.now();
  let hue = 0;
  let lastFilter = 0;
  const tinted = [ghostCanvas, tagline].filter((el): el is HTMLCanvasElement | HTMLElement => !!el);
  const frame = (now: number) => {
    const t = now / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    hue += dt * WAX.hueDrift * 0.4;
    ghost?.update(t, dt);
    wax?.render(t, dt, hue, ghostInWax());
    ghost?.draw(t);
    // keep the ghost's glow and the tagline drifting with the wax colours (a few times a second is plenty)
    if (now - lastFilter > 200) {
      lastFilter = now;
      for (const el of tinted) el.style.filter = `hue-rotate(${hue.toFixed(3)}rad)`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
