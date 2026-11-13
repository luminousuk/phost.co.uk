import { MAX_BLOBS, WAX } from '../settings';
import { rgb, type Palette } from '../palettes';
import { createProgram, uniformLocations } from './gl';
import quadVert from './shaders/quad.vert';
import waxFrag from './shaders/wax.frag';

const UNIFORMS = [
  'uRes', 'uTime', 'uBlobs', 'uCount', 'uGhost', 'uBg0', 'uBg1', 'uWax0', 'uWax1', 'uCore', 'uGlowCol', 'uP',
  'uTextCol', 'uSoft', 'uGlow', 'uCoreAmt', 'uHue', 'uGrain', 'uVig', 'uGlass', 'uText', 'uHalo', 'uGhostGlow', 'uLetters',
] as const;

interface Blob {
  phase: number;
  rate: number;
  x: number;
  radius: number;
  lastY: number | null;
  /** Current vertical stretch, eased towards the target so it never jumps. */
  stretch: number;
}

export interface GhostInWax {
  /** Position in CSS px. */
  x: number;
  y: number;
  pull: number;
  glow: number;
}

export interface Wax {
  /** Sizes the drawing buffer; returns device pixels per CSS pixel. */
  resize(width: number, height: number): number;
  setLetters(letters: TexImageSource): void;
  /** Advances the wax by dt seconds and draws a frame. */
  render(time: number, dt: number, hue: number, ghost: GhostInWax): void;
}

/** Returns null when WebGL isn't available. */
export function createWax(canvas: HTMLCanvasElement, palette: Palette): Wax | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return null;

  let program: WebGLProgram;
  try {
    program = createProgram(gl, quadVert, waxFrag);
  } catch (err) {
    console.warn(err);
    return null;
  }
  gl.useProgram(program);
  const u = uniformLocations(gl, program, UNIFORMS);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // The word texture starts empty (black) and is filled in once the font has loaded.
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.uniform1i(u.uLetters, 0);
  let hasLetters = false;

  // Fixed per visit.
  gl.uniform3fv(u.uBg0, rgb(palette.bg0));
  gl.uniform3fv(u.uBg1, rgb(palette.bg1));
  gl.uniform3fv(u.uWax0, rgb(palette.wax0));
  gl.uniform3fv(u.uWax1, rgb(palette.wax1));
  gl.uniform3fv(u.uCore, rgb(palette.core));
  gl.uniform3fv(u.uGlowCol, rgb(palette.glow));
  gl.uniform3fv(u.uP, rgb(palette.p));
  gl.uniform3fv(u.uTextCol, rgb(palette.text));
  gl.uniform1f(u.uSoft, WAX.softness);
  gl.uniform1f(u.uGlow, WAX.glow);
  gl.uniform1f(u.uCoreAmt, WAX.core);
  gl.uniform1f(u.uGrain, WAX.grain);
  gl.uniform1f(u.uVig, WAX.vignette);
  gl.uniform1f(u.uGlass, WAX.glass);
  gl.uniform1f(u.uHalo, WAX.halo);
  gl.uniform1i(u.uCount, WAX.blobs);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const blobs: Blob[] = Array.from({ length: Math.min(WAX.blobs, MAX_BLOBS) }, () => ({
    phase: rand(0, Math.PI * 2),
    rate: rand(0.05, 0.12),
    x: Math.random(),
    radius: rand(0.05, 0.12),
    lastY: null,
    stretch: 1,
  }));
  const data = new Float32Array(MAX_BLOBS * 4);

  let cssWidth = 1;
  let cssHeight = 1;
  let waxTime = 0;

  function place(dt: number): void {
    const aspect = cssWidth / cssHeight;
    blobs.forEach((b, i) => {
      const s = Math.sin(waxTime * b.rate + b.phase);
      // Viscous wax lingers at the top and bottom: sin(s * pi/2) flattens the ends of the swing. It has a
      // finite slope everywhere, so the speed (and the stretch below) changes smoothly.
      const swing = s + (Math.sin((s * Math.PI) / 2) - s) * WAX.viscosity;
      const y = 0.5 + 0.55 * swing;
      const x = (b.x * 0.8 + 0.1) * aspect + Math.sin(waxTime * 0.3 + b.phase) * 0.05;
      // Stretched while moving. Skip tiny time steps, where the speed estimate is all noise.
      if (b.lastY !== null && dt > 0.002) {
        const vy = (y - b.lastY) / dt;
        const target = 1 + Math.min(1.5, Math.abs(vy) * WAX.viscosity * 10);
        b.stretch += (target - b.stretch) * Math.min(1, dt * 3);
      }
      b.lastY = y;
      data[i * 4] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = b.radius * WAX.size * (1 + 0.15 * Math.sin(waxTime + i));
      data[i * 4 + 3] = b.stretch;
    });
  }

  return {
    resize(width, height) {
      cssWidth = width;
      cssHeight = height;
      // Soft wax doesn't need full resolution; cap the pixel count for slower devices.
      let scale = Math.min(window.devicePixelRatio || 1, 1.5);
      const maxPixels = 2_600_000;
      if (width * height * scale * scale > maxPixels) scale = Math.sqrt(maxPixels / (width * height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      return canvas.width / width;
    },

    setLetters(letters) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, letters);
      hasLetters = true;
    },

    render(time, dt, hue, ghost) {
      waxTime += dt * WAX.speed * (1 - 0.6 * WAX.viscosity);
      place(dt);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uHue, hue);
      gl.uniform4fv(u.uBlobs, data);
      gl.uniform3f(u.uGhost, ghost.x / cssHeight, 1 - ghost.y / cssHeight, ghost.pull);
      gl.uniform1f(u.uGhostGlow, ghost.glow);
      gl.uniform1f(u.uText, hasLetters ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
