// Generates every MONY brand asset (SVG + PNG + ICO) from one inline SVG, using sharp (bundled with Next.js).
//   node scripts/generate-icons.mjs
//
// Outputs
//   public/brand/mony-mark.svg          app-icon tile (rounded, dark ink + aurora glow)
//   public/brand/mony-glyph.svg         the bare mark, aurora gradient, transparent background
//   public/brand/mony-glyph-dark.svg    the bare mark, near-black (for light backgrounds)
//   public/brand/mony-glyph-light.svg   the bare mark, off-white (for dark backgrounds)
//   public/brand/mony-logo-dark.svg     horizontal lockup (tile + wordmark), dark text
//   public/brand/mony-logo-light.svg    horizontal lockup, light text
//   public/icons/icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png, favicon-16.png, favicon-32.png
//   src/app/favicon.ico                 16 / 32 / 48 px (PNG-compressed ICO)
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const TEAL = "#2dd4bf";
const LIME = "#a3e635";
const INK = "#0b1220";
const INK_2 = "#182234";

/** The mark: the letter M drawn as a rising trend line that ends in an arrow. Centered in a 512 box. */
const MARK_PATH = "M126 368 V200 L242 304 L386 146 M314 146 H386 V218";
const mark = (stroke, width = 56) =>
  `<path d="${MARK_PATH}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

const auroraDefs = (id) =>
  `<linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${TEAL}"/><stop offset="1" stop-color="${LIME}"/></linearGradient>`;

/** Rounded app tile. `maskable` fills the whole square and shrinks the mark into the safe zone. */
const tile = ({ maskable = false, radius = 118 } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${INK_2}"/><stop offset="1" stop-color="${INK}"/></linearGradient>
    <radialGradient id="glow-a" cx="1" cy="0" r="0.95"><stop offset="0" stop-color="${TEAL}" stop-opacity="0.42"/><stop offset="0.6" stop-color="${TEAL}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow-b" cx="0" cy="1" r="0.75"><stop offset="0" stop-color="${LIME}" stop-opacity="0.16"/><stop offset="0.6" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
    ${auroraDefs("aurora")}
    <clipPath id="clip"><rect width="512" height="512" rx="${maskable ? 0 : radius}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="512" height="512" fill="url(#ink)"/>
    <rect width="512" height="512" fill="url(#glow-a)"/>
    <rect width="512" height="512" fill="url(#glow-b)"/>
  </g>
  <g transform="translate(256 256) scale(${maskable ? 0.78 : 1}) translate(-256 -256)">${mark("url(#aurora)")}</g>
</svg>`;

/** Bare glyph on a transparent background, cropped tight around the mark. */
const glyph = (fill) => `
<svg xmlns="http://www.w3.org/2000/svg" width="336" height="296" viewBox="88 108 336 296">
  <defs>${auroraDefs("aurora")}</defs>
  ${mark(fill)}
</svg>`;

/** Horizontal lockup: tile + wordmark. Text relies on the app font being installed (falls back to a bold sans). */
const lockup = (textColor) => `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200">
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${INK_2}"/><stop offset="1" stop-color="${INK}"/></linearGradient>
    <radialGradient id="glow-a" cx="1" cy="0" r="0.95"><stop offset="0" stop-color="${TEAL}" stop-opacity="0.42"/><stop offset="0.6" stop-color="${TEAL}" stop-opacity="0"/></radialGradient>
    ${auroraDefs("aurora")}
  </defs>
  <g transform="translate(20 20) scale(0.3125)">
    <rect width="512" height="512" rx="118" fill="url(#ink)"/>
    <rect width="512" height="512" rx="118" fill="url(#glow-a)"/>
    ${mark("url(#aurora)")}
  </g>
  <text x="212" y="146" font-family="'Plus Jakarta Sans', 'Segoe UI', Inter, Arial, sans-serif" font-weight="800" font-size="124" letter-spacing="-5" fill="${textColor}">MONY</text>
</svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

/** Packs PNG buffers into a single .ico (PNG-in-ICO is supported by every modern browser and Windows Vista+). */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dir = [];
  let offset = 6 + 16 * entries.length;
  for (const { size, data } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]);
}

await mkdir("public/icons", { recursive: true });
await mkdir("public/brand", { recursive: true });

const appTile = tile();
const maskTile = tile({ maskable: true });

// Brand SVGs
await writeFile("public/brand/mony-mark.svg", appTile.trim());
await writeFile("public/brand/mony-glyph.svg", glyph("url(#aurora)").trim());
await writeFile("public/brand/mony-glyph-dark.svg", glyph("#12141a").trim());
await writeFile("public/brand/mony-glyph-light.svg", glyph("#f7f7f5").trim());
await writeFile("public/brand/mony-logo-dark.svg", lockup("#12141a").trim());
await writeFile("public/brand/mony-logo-light.svg", lockup("#f7f7f5").trim());

// PWA / platform icons
await writeFile("public/icons/icon.svg", appTile.trim());
await writeFile("public/icons/icon-192.png", await png(appTile, 192));
await writeFile("public/icons/icon-512.png", await png(appTile, 512));
await writeFile("public/icons/icon-maskable-512.png", await png(maskTile, 512));
// iOS rounds the corners itself, so the apple icon is the full-bleed variant.
await writeFile("public/icons/apple-touch-icon.png", await png(maskTile, 180));
await writeFile("public/icons/favicon-32.png", await png(appTile, 32));
await writeFile("public/icons/favicon-16.png", await png(appTile, 16));

// favicon.ico (Next.js picks it up automatically from src/app)
const icoSizes = [16, 32, 48];
await writeFile(
  "src/app/favicon.ico",
  ico(await Promise.all(icoSizes.map(async (size) => ({ size, data: await png(appTile, size) })))),
);

console.log("MONY brand assets generated → public/brand, public/icons, src/app/favicon.ico");
