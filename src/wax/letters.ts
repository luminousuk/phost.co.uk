import { TYPE } from '../settings';

/** Font size in CSS px for a viewport of this size. */
export function wordSize(width: number, height: number): number {
  const across = width < 600 ? TYPE.narrowWidth : TYPE.width;
  return Math.min(width * across, height * TYPE.height);
}

/**
 * Draws the word, softly blurred, for the shader to turn into wax: red is the whole word and green is
 * "host" only, so the shader can tell the "p" apart and colour it differently. `scale` is device pixels
 * per CSS pixel of the WebGL canvas.
 */
export function drawLetters(width: number, height: number, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const g = canvas.getContext('2d');
  if (!g) return canvas;

  const size = wordSize(width, height) * scale;
  g.fillStyle = '#000';
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.font = `${TYPE.weight} ${size}px ${TYPE.family}`;
  g.textBaseline = 'middle';
  // Not every browser supports letterSpacing on a canvas; without it the word is just a touch wider.
  if ('letterSpacing' in g) g.letterSpacing = `${TYPE.tracking * size}px`;

  const pWidth = g.measureText('p').width;
  const total = pWidth + g.measureText('host').width;
  const x = (canvas.width - total) / 2;
  const y = canvas.height / 2;

  // The blur gives the letters soft, melted edges once the shader thresholds them.
  g.filter = `blur(${size * 0.03}px)`;
  g.fillStyle = '#ff0000';
  g.fillText('p', x, y);
  g.fillStyle = '#ffffff';
  g.fillText('host', x + pWidth, y);
  return canvas;
}

/** Resolves once the word's font is ready (or straight away if it can't be loaded). */
export function fontReady(): Promise<unknown> {
  return document.fonts.load(`${TYPE.weight} 100px ${TYPE.family}`, 'phost').catch(() => undefined);
}
