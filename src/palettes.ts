export interface Palette {
  /** Background, bottom and top. */
  bg0: string;
  bg1: string;
  /** Wax colour, low in the lamp and high in the lamp. */
  wax0: string;
  wax1: string;
  /** Hot core of thick wax. */
  core: string;
  /** The ghost's glow. */
  glow: string;
  /** The "p", which is always a different colour from "host". */
  p: string;
  /** Small text (the tagline). */
  text: string;
}

// One is picked at random on each visit.
export const PALETTES: Record<string, Palette> = {
  haunted: { bg0: '#0a0314', bg1: '#1a0833', wax0: '#7333ff', wax1: '#1acce6', core: '#d9f2ff', glow: '#a0b4ff', p: '#ffc95e', text: '#e6ecff' },
  seventies: { bg0: '#14030f', bg1: '#40081f', wax0: '#ff5a1a', wax1: '#ff2673', core: '#ffd98a', glow: '#ffc8a0', p: '#fff27a', text: '#ffe6d0' },
  ectoplasm: { bg0: '#020a06', bg1: '#08261a', wax0: '#3cff8c', wax1: '#c8ff3c', core: '#f0ffd0', glow: '#9cffc0', p: '#ff6bd6', text: '#e4ffee' },
  midnight: { bg0: '#01030c', bg1: '#071a3a', wax0: '#1f4fff', wax1: '#00d0ff', core: '#cfe8ff', glow: '#8fb8ff', p: '#ffd166', text: '#d6e4ff' },
  bubblegum: { bg0: '#12061a', bg1: '#3a1040', wax0: '#ff6fd8', wax1: '#6fd8ff', core: '#fff0fa', glow: '#ffc0f0', p: '#7dffd4', text: '#ffe6f7' },
  ember: { bg0: '#070202', bg1: '#1f0606', wax0: '#b3001b', wax1: '#ff7a00', core: '#ffe0a0', glow: '#ffb080', p: '#9fe8ff', text: '#ffe2cc' },
  mono: { bg0: '#050505', bg1: '#1a1a1a', wax0: '#9a9a9a', wax1: '#ffffff', core: '#ffffff', glow: '#ffffff', p: '#ff3b3b', text: '#e6e6e6' },
};

/** '#rrggbb' to [r, g, b] in 0..1. */
export function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}
