// Nothing here may say anything about what runs on the server.

/** The line under the lamp. One is picked at random on each visit. */
export const TAGLINES = [
  'it lives in the lamp now.',
  'boo.',
  'nothing to see here.',
  'groovy. nothing else.',
  'this page intentionally left haunted.',
  'no vacancies. one ghost.',
  'please do not tap the glass.',
  'lights on. nobody home.',
  'you found it. it is nothing.',
  'haunted since forever.',
  'the ghost says hi.',
];

/** What the ghost says now and then, in a speech bubble. */
export const SAYINGS = [
  'boo',
  'boo!',
  'boo?',
  'oh, hi',
  'shh',
  'hello',
  'wooo',
  'still here',
  'nothing to see',
  'is it warm in here?',
  'i live here',
  'you again',
  'peekaboo',
  'blub',
  'nice cursor',
  "don't tap the glass",
  'zzz',
  'go on, click me',
  ':)',
  'hmm',
];

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
