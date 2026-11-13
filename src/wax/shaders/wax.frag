// The lava lamp. Each blob adds r^2 / d^2 to a field; wax is wherever the field passes 1, so blobs
// that come close bulge towards each other and merge (metaballs). The word adds to the same field,
// which makes it wax too, plus a wide halo so it reaches out to blobs like a blob does. The ghost adds
// a capped pull: never enough to make wax on its own, but enough to draw nearby wax out towards it.
precision highp float;

#define MAX_BLOBS 12

uniform vec2 uRes;
uniform float uTime;
uniform vec4 uBlobs[MAX_BLOBS]; // x, y, radius, vertical stretch (all in units of screen height)
uniform int uCount;
uniform vec3 uGhost;            // x, y, pull strength (1 = peak of about 0.7, below the wax threshold)
uniform vec3 uBg0, uBg1, uWax0, uWax1, uCore, uGlowCol, uP, uTextCol;
uniform float uSoft, uGlow, uCoreAmt, uHue, uGrain, uVig, uGlass, uText, uHalo, uGhostGlow;
uniform sampler2D uLetters;     // red: the whole word, green: "host" only (so red minus green is the "p"), blue: wide halo

// Rotates a colour around the grey axis (a cheap hue shift).
vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float y = gl_FragCoord.y / uRes.y;

  float f = 0.0;
  for (int i = 0; i < MAX_BLOBS; i++) {
    if (i >= uCount) break;
    vec2 d = uv - uBlobs[i].xy;
    d.y /= uBlobs[i].w;
    f += uBlobs[i].z * uBlobs[i].z / dot(d, d);
  }

  vec2 dg = uv - uGhost.xy;
  float g2 = dot(dg, dg);
  f += uGhost.z * 0.0056 / (g2 + 0.008);

  vec4 letters = texture2D(uLetters, gl_FragCoord.xy / uRes);
  f += (smoothstep(0.3, 0.7, letters.r) * 2.0 + letters.b * uHalo) * uText;
  float pMask = clamp((letters.r - letters.g) * 2.0, 0.0, 1.0) * uText;

  vec3 bg = mix(uBg0, uBg1, y);
  vec3 hot = mix(uWax0, uWax1, clamp(y + 0.25 * sin(uTime * 0.15), 0.0, 1.0));
  hot = mix(hot, uP, pMask);
  // a faint lighter shade inside the letters, so the word still reads when a blob swallows it
  float inLetter = smoothstep(0.35, 0.65, letters.r) * uText;
  hot = mix(hot, uTextCol, inLetter * (1.0 - pMask) * 0.3);

  float edge = smoothstep(1.0 - uSoft, 1.0 + uSoft, f);
  float core = smoothstep(1.2, 9.0, f);
  vec3 col = mix(bg, hot, edge);
  col = mix(col, uCore, core * uCoreAmt);
  col += hot * 0.25 * uGlow * smoothstep(0.3, 1.0, f) * (1.0 - edge);
  // the ghost's own glow, softer over wax so it doesn't bleach it white
  col += uGlowCol * uGhostGlow * 0.02 / (g2 + 0.01) * (1.0 - 0.6 * edge);
  col = hueShift(col, uHue);

  col += uGlass * 0.06 * smoothstep(0.02, 0.0, abs(gl_FragCoord.x / uRes.x - 0.2));

  vec2 q = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - uVig * dot(q, q) * 2.0;
  col += (fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 100.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * uGrain;

  gl_FragColor = vec4(col, 1.0);
}
