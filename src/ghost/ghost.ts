import { GHOST } from '../settings';
import { rgb, type Palette } from '../palettes';
import { SAYINGS, pick } from '../words';
import { SHAPES, SHAPE_NAMES, type Face, type ShapeName } from './shapes';

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * The ghost: follows the pointer but keeps its distance, wanders when left alone, is startled by a
 * click or tap, changes into the next kind of ghost when clicked itself, and talks now and then.
 */
export class Ghost {
  x: number;
  y: number;
  private vx = 0;
  private vy = 0;
  private readonly g: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private pointer = { x: 0, y: 0, at: -Infinity, inside: false };
  private spooked = 0;
  private blink = 0;
  private nextBlink = 2;
  private saying = '';
  private sayUntil = 0;
  private nextSay = rand(5, 9);
  private puffs: Puff[] = [];
  private readonly puff: HTMLCanvasElement;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly palette: Palette,
    private shape: ShapeName,
    private readonly still: boolean,
    /** Called when something changes while the page is still (reduced motion), to redraw. */
    private readonly changed: () => void,
  ) {
    const g = canvas.getContext('2d');
    if (!g) throw new Error('No 2D canvas');
    this.g = g;
    this.x = innerWidth / 2;
    this.y = innerHeight * 0.3;
    this.puff = this.makePuff();

    addEventListener('pointermove', (e) => this.point(e));
    addEventListener('mouseout', (e) => {
      if (!e.relatedTarget) this.pointer.inside = false;
    });
    canvas.addEventListener('pointerdown', (e) => {
      this.point(e);
      if (Math.hypot(e.clientX - this.x, e.clientY - (this.y + 15 * GHOST.size)) < 50 * GHOST.size) {
        this.shape = SHAPE_NAMES[(SHAPE_NAMES.indexOf(this.shape) + 1) % SHAPE_NAMES.length];
      } else {
        this.spooked = 1;
      }
      this.changed();
    });
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.still) {
      // Parked above the word.
      this.x = width / 2;
      this.y = height * 0.3;
    }
  }

  /** Moves the ghost on by dt seconds (t is the page time in seconds). */
  update(t: number, dt: number): void {
    const step = dt * 60; // the tuning below was done per 60 Hz frame
    let tx: number;
    let ty: number;
    if (this.pointer.inside && t - this.pointer.at < 4) {
      const dx = this.x - this.pointer.x;
      const dy = this.y - this.pointer.y;
      const d = Math.hypot(dx, dy) || 1;
      const keep = GHOST.keepAway * Math.sqrt(GHOST.size) + this.spooked * 260;
      tx = this.pointer.x + (dx / d) * keep;
      ty = this.pointer.y + (dy / d) * keep;
    } else {
      tx = this.width / 2 + Math.sin(t * 0.27) * this.width * 0.3;
      ty = this.height * 0.45 + Math.sin(t * 0.41) * this.height * 0.25;
    }
    const pull = 0.006 - 0.0048 * GHOST.laziness;
    const damping = Math.pow(0.94, step);
    this.vx = (this.vx + (tx - this.x) * pull * step) * damping;
    this.vy = (this.vy + (ty - this.y) * pull * step) * damping;
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.spooked *= Math.pow(0.97, step);

    if (t > this.nextBlink) {
      this.blink = 1;
      this.nextBlink = t + rand(2.5, 6.5);
    }
    this.blink *= Math.pow(0.8, step);

    if (t > this.nextSay) {
      this.saying = pick(SAYINGS.filter((s) => s !== this.saying));
      this.sayUntil = t + 1.8;
      this.nextSay = t + rand(12, 25);
    }

    if (this.shape === 'wisp') this.emitPuffs();
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vy -= 0.006 * step;
      p.life -= p.decay * step;
      p.size *= Math.pow(1.006, step);
      if (p.life <= 0) this.puffs.splice(i, 1);
    }
  }

  draw(t: number): void {
    const g = this.g;
    const s = GHOST.size;
    g.clearRect(0, 0, this.width, this.height);

    g.globalCompositeOperation = 'lighter';
    for (const p of this.puffs) {
      g.globalAlpha = p.life * 0.5;
      g.drawImage(this.puff, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    const bob = this.still ? 0 : Math.sin(t * 2.1) * 6 * s;
    const face: Face = {
      blink: this.blink,
      spooked: this.spooked,
      vx: this.vx,
      lookX: clamp((this.pointer.x - this.x) / 300, -1, 1) * 4,
      lookY: clamp((this.pointer.y - this.y) / 300, -1, 1) * 4,
    };
    g.save();
    g.translate(this.x, this.y + bob);
    g.rotate(clamp(this.vx * 0.03, -0.35, 0.35));
    g.scale(s, s);
    g.shadowColor = this.palette.glow;
    g.shadowBlur = 40 * Math.min(1.5, GHOST.glow);
    SHAPES[this.shape](g, t, face);
    g.restore();

    if (t < this.sayUntil) this.drawSaying(t, bob);
  }

  private drawSaying(t: number, bob: number): void {
    const g = this.g;
    const fade = Math.min(1, (this.sayUntil - t) / 0.4, (t - this.sayUntil + 1.8) / 0.2);
    g.font = '600 14px system-ui, sans-serif';
    const w = g.measureText(this.saying).width + 18;
    const x = clamp(this.x + 38 * GHOST.size, 8, this.width - w - 8);
    const y = clamp(this.y - 52 * GHOST.size + bob, 20, this.height - 20);
    g.globalAlpha = Math.max(0, fade);
    g.fillStyle = 'rgba(245,248,255,0.92)';
    g.beginPath();
    // roundRect is missing in older Safari
    if ('roundRect' in g) g.roundRect(x, y - 13, w, 26, 13);
    else (g as CanvasRenderingContext2D).rect(x, y - 13, w, 26);
    g.fill();
    g.beginPath();
    g.moveTo(x + 8, y + 10);
    g.lineTo(x - 2, y + 18);
    g.lineTo(x + 16, y + 12);
    g.fill();
    g.fillStyle = '#140820';
    g.fillText(this.saying, x + 9, y + 5);
    g.globalAlpha = 1;
  }

  private point(e: PointerEvent): void {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    this.pointer.at = performance.now() / 1000;
    this.pointer.inside = true;
  }

  private emitPuffs(): void {
    const s = GHOST.size;
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 20 * s;
      this.puffs.push({
        x: this.x + Math.cos(a) * r,
        y: this.y + 20 * s + Math.random() * 20 * s,
        vx: -this.vx * 0.25 + (Math.random() - 0.5) * 0.6,
        vy: -this.vy * 0.25 + 0.2 + Math.random() * 0.5,
        life: 1,
        decay: rand(0.008, 0.02),
        size: rand(18, 58) * s,
      });
    }
  }

  /** A soft round sprite in the palette's glow colour, for the wisp's smoke. */
  private makePuff(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    if (g) {
      const [r, gr, b] = rgb(this.palette.glow).map((v) => Math.round(v * 255));
      const fill = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      fill.addColorStop(0, 'rgba(240,245,255,0.6)');
      fill.addColorStop(0.4, `rgba(${r},${gr},${b},0.2)`);
      fill.addColorStop(1, `rgba(${r},${gr},${b},0)`);
      g.fillStyle = fill;
      g.fillRect(0, 0, 64, 64);
    }
    return c;
  }
}
