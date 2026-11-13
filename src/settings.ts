// The look of the page, tuned in the prototype lab. Everything random is picked in main.ts.

export const WAX = {
  /** Number of blobs (the shader allows up to MAX_BLOBS). */
  blobs: 9,
  /** Blob radius multiplier. */
  size: 0.9,
  /** Overall speed of the rise and fall. */
  speed: 0.8,
  /** 0 to 1: slower, lingers at top and bottom, stretches while moving. */
  viscosity: 0.55,
  /** Width of the soft edge around the wax. */
  softness: 0.1,
  /** Halo around the wax. */
  glow: 1.2,
  /** Long-range pull of the word, so blobs and the ghost draw bridges to it. */
  halo: 0.7,
  /** Bright core inside thick wax. */
  core: 0.35,
  /** Film grain. */
  grain: 0.04,
  /** Darkening towards the corners. */
  vignette: 0.25,
  /** The faint vertical highlight, like light on the lamp glass. */
  glass: 1,
  /** How fast the colours drift around the hue wheel. */
  hueDrift: 0.12,
} as const;

export const MAX_BLOBS = 12;

export const GHOST = {
  /** Scale of the ghost drawing. */
  size: 1,
  /** Halo strength. */
  glow: 1,
  /** How far (px) the ghost keeps from the cursor. */
  keepAway: 130,
  /** 0 to 1: how slowly it follows. */
  laziness: 0.5,
  /** How strongly it pulls nearby wax towards itself. Above about 1.4 it would make wax on its own. */
  pull: 0.85,
} as const;

export const TYPE = {
  family: 'Unbounded',
  weight: 600,
  /** The word's size is the smaller of these, as a fraction of the viewport width and height. */
  width: 0.12,
  narrowWidth: 0.16,
  height: 0.216,
  /** Letter spacing in em. */
  tracking: -0.02,
} as const;
