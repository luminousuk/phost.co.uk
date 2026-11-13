// Wraps a PNG in an .ico container (modern browsers accept PNG data inside .ico).
// Usage: node tools/make-ico.mjs favicon-96.png public/favicon.ico
import { readFile, writeFile } from 'node:fs/promises';

const [, , src, dest] = process.argv;
if (!src || !dest) { console.error('Usage: node tools/make-ico.mjs <in.png> <out.ico>'); process.exit(1); }
const png = await readFile(src);
const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0);            // reserved
head.writeUInt16LE(1, 2);            // type: icon
head.writeUInt16LE(1, 4);            // one image
head.writeUInt8(w >= 256 ? 0 : w, 6);
head.writeUInt8(h >= 256 ? 0 : h, 7);
head.writeUInt8(0, 8);               // no palette
head.writeUInt8(0, 9);
head.writeUInt16LE(1, 10);           // colour planes
head.writeUInt16LE(32, 12);          // bits per pixel
head.writeUInt32LE(png.length, 14);
head.writeUInt32LE(22, 18);          // data offset
await writeFile(dest, Buffer.concat([head, png]));
console.log(`Wrote ${dest} (${w}x${h})`);
