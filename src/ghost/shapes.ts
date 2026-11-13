// The six ghosts. Each draws itself centred on (0, 0), roughly 60px wide, onto a context that the
// caller has already moved, tilted and scaled. The caller also sets a glow (shadowBlur) before the
// call; each shape turns it off once its body is drawn, so the face stays crisp.

export interface Face {
  /** 0 = open, 1 = shut. */
  blink: number;
  /** 0 = calm, 1 = just been startled. */
  spooked: number;
  /** Where the eyes look, in px. */
  lookX: number;
  lookY: number;
  /** Horizontal speed, for swaying parts. */
  vx: number;
}

export type GhostShape = (g: CanvasRenderingContext2D, t: number, face: Face) => void;

const INK = '#140820';
const TAU = Math.PI * 2;

function body(g: CanvasRenderingContext2D, top: number, bottom: number): CanvasGradient {
  const fill = g.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, 'rgba(245,248,255,0.93)');
  fill.addColorStop(1, 'rgba(190,200,255,0.25)');
  return fill;
}

function eyes(g: CanvasRenderingContext2D, f: Face, apart = 11, y = -2, rx = 4.5, ry = 6.5): void {
  g.fillStyle = INK;
  for (const side of [-apart, apart]) {
    g.beginPath();
    g.ellipse(side + f.lookX, y + f.lookY, rx + f.spooked * 2, ry * (1 - f.blink) + 0.6 + f.spooked * 4, 0, 0, TAU);
    g.fill();
  }
  if (f.spooked > 0.2) {
    g.beginPath();
    g.ellipse(f.lookX, y + 18 + f.lookY, 5 * f.spooked, 7 * f.spooked, 0, 0, TAU);
    g.fill();
  }
}

/** A dome with a wavy hem. */
function sheet(g: CanvasRenderingContext2D, t: number, r: number, hem: number, waves: number, amp: number, speed: number): void {
  g.beginPath();
  g.arc(0, 0, r, Math.PI, 0);
  g.lineTo(r, hem);
  const steps = waves * 8;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    g.lineTo(r - u * 2 * r, hem + Math.sin(u * waves * TAU + t * speed) * amp);
  }
  g.closePath();
  g.fillStyle = body(g, -r, hem);
  g.fill();
  g.shadowBlur = 0;
}

const classic: GhostShape = (g, t, f) => {
  sheet(g, t, 30, 46, 4, 5, 6);
  eyes(g, f);
};

const blob: GhostShape = (g, t, f) => {
  const r = 30;
  const tipX = Math.sin(t * 2) * 10 - f.vx * 5;
  const tipY = r * 2.1;
  g.beginPath();
  g.moveTo(-r, 0);
  g.arc(0, 0, r, Math.PI, 0);
  g.bezierCurveTo(r, r * 0.9, tipX + 12, tipY - 14, tipX, tipY);
  g.bezierCurveTo(tipX - 8, tipY - 20, -r, r, -r, 0);
  g.fillStyle = body(g, -r, tipY);
  g.fill();
  g.shadowBlur = 0;
  eyes(g, f, 10, 0, 4, 6);
};

const cute: GhostShape = (g, t, f) => {
  sheet(g, t, 32, 24, 3, 4, 5);
  g.fillStyle = 'rgba(255,120,170,0.45)';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(side * 19 + f.lookX, 9 + f.lookY, 6, 3.5, 0, 0, TAU);
    g.fill();
  }
  if (f.spooked > 0.2) {
    eyes(g, f, 11, 0, 4, 5);
    return;
  }
  // happy closed eyes and a small smile
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.lineCap = 'round';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.arc(side * 11 + f.lookX, 3 + f.lookY, 5, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
  }
  g.beginPath();
  g.arc(f.lookX, 10 + f.lookY, 3, 0.1 * Math.PI, 0.9 * Math.PI);
  g.stroke();
};

/** Someone in a bedsheet, with their shoes showing. */
const bedsheet: GhostShape = (g, t, f) => {
  const r = 28;
  const hem = 72;
  const flare = 1.3;
  const step = Math.sin(t * 8) * Math.min(1, Math.abs(f.vx) * 0.4);
  g.fillStyle = '#1a1220';
  g.beginPath();
  g.ellipse(-12, hem + 4 - Math.max(0, step) * 4, 8, 4.5, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(12, hem + 4 - Math.max(0, -step) * 4, 8, 4.5, 0, 0, TAU);
  g.fill();

  g.beginPath();
  g.arc(0, 0, r, Math.PI, 0);
  g.quadraticCurveTo(r * 1.05, hem * 0.6, r * flare, hem);
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    g.lineTo(r * flare - u * 2 * r * flare, hem + Math.sin(u * 9 + t * 1.5) * 3);
  }
  g.quadraticCurveTo(-r * 1.05, hem * 0.6, -r, 0);
  g.fillStyle = body(g, -r, hem);
  g.fill();
  g.shadowBlur = 0;

  g.strokeStyle = 'rgba(140,150,200,0.35)';
  g.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * 14, 18);
    g.quadraticCurveTo(side * 22, 45, side * 18 + Math.sin(t * 1.5) * 2, hem - 4);
    g.stroke();
  }
  // eye holes cut in the sheet
  g.fillStyle = '#0d0812';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(side * 10, -2, 5, 6.5 * (1 - f.blink * 0.9) + f.spooked * 3, 0, 0, TAU);
    g.fill();
  }
};

// 12 x 11 pixel ghost: X body, E eye, M mouth (shown when startled). The last row alternates.
const PIXELS = [
  '....XXXX....',
  '..XXXXXXXX..',
  '.XXXXXXXXXX.',
  '.XXEEXXEEXX.',
  '.XXEEXXEEXX.',
  'XXXXXXXXXXXX',
  'XXXXXMMXXXXX',
  '.XXXXXXXXXX.',
  '.XXXXXXXXXX.',
  '.XXXXXXXXXX.',
];
const HEMS = ['.X.XX.XX.XX.', '.XX.XX.XX.X.'];

const pixel: GhostShape = (g, t, f) => {
  const p = 5.5;
  const rows = [...PIXELS, HEMS[Math.floor(t * 4) % 2]];
  const shift = Math.round(f.lookX / 3) * 1.5;
  g.save();
  g.translate((-12 * p) / 2, (-rows.length * p) / 2 + 8);
  rows.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      let colour = 'rgba(240,244,255,0.95)';
      if (ch === 'E' && !(f.blink > 0.5 && j === 3)) colour = INK;
      if (ch === 'M' && f.spooked > 0.2) colour = INK;
      g.fillStyle = colour;
      g.fillRect(i * p + (ch === 'E' ? shift : 0), j * p, p + 0.5, p + 0.5);
    });
  });
  g.restore();
  g.shadowBlur = 0;
};

/** Just a soft glow and a pair of eyes; the smoke trail is drawn by the ghost itself. */
const wisp: GhostShape = (g, _t, f) => {
  g.shadowBlur = 0;
  const glow = g.createRadialGradient(0, 8, 0, 0, 8, 40);
  glow.addColorStop(0, 'rgba(245,248,255,0.75)');
  glow.addColorStop(1, 'rgba(200,210,255,0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(0, 8, 40, 0, TAU);
  g.fill();
  eyes(g, f, 10, 2, 4, 6);
};

export const SHAPES = { classic, blob, cute, bedsheet, pixel, wisp } as const;
export type ShapeName = keyof typeof SHAPES;
export const SHAPE_NAMES = Object.keys(SHAPES) as ShapeName[];
