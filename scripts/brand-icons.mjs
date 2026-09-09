/**
 * Regenerate the S3V clover icon set and social card for w.s3v.no.
 *
 * Fork-local. The master mark is worldview's transparent 500x500 clover, which is
 * the reusable original across every s3v.no property - do not trace a new one.
 * Run: node scripts/brand-icons.mjs
 */
import sharp from "sharp";
import { writeFile } from 'node:fs/promises';

const MASTER = '/srv/filer/kode/worldview/public/3-klover-removebg-preview.png';
const OUT = '/srv/filer/kode/gods-eye-view/public';
const BG = '#0a0a0f';          // --bg-dark, this app's own background
const ACCENT = '#00d4ff';      // --accent, this app's own cyan

// Transparent mark for the in-app header and boot splash.
await sharp(MASTER).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png().toFile(`${OUT}/s3v-clover.png`);

// Square icons: clover at 78% of a solid tile, matching s3v.no's own icon scale.
for (const size of [16, 32, 180, 192, 512]) {
  const inner = Math.round(size * 0.78);
  const pad = Math.round((size - inner) / 2);
  const mark = await sharp(MASTER).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: mark, top: pad, left: pad }])
    .png().toFile(`${OUT}/icon-${size}.png`);
}

// Social card: clover beside the wordmark, the pair centred as one block.
const CARD_MARK = 360, CARD_LEFT = 148, TEXT_LEFT = CARD_LEFT + CARD_MARK + 60;
const cardMark = await sharp(MASTER).resize(CARD_MARK, CARD_MARK, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
// Sized so the 20-character tagline fits inside 1200px at this letter-spacing:
// DejaVu Sans Mono advances 0.602em, so 20 * (32 * 0.602 + 5) = 484px.
const wordmark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <text x="${TEXT_LEFT}" y="325" font-family="DejaVu Sans Mono, monospace" font-size="150" font-weight="bold" fill="#e8f6ff"
    >S<tspan fill="${ACCENT}">3</tspan>V</text>
  <text x="${TEXT_LEFT + 4}" y="382" font-family="DejaVu Sans Mono, monospace" font-size="32" letter-spacing="5" fill="#7c8fa5"
    >NO PLACE LEFT BEHIND</text>
</svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: BG } })
  .composite([{ input: cardMark, top: (630 - CARD_MARK) / 2, left: CARD_LEFT }, { input: wordmark, top: 0, left: 0 }])
  .png().toFile(`${OUT}/og-image.png`);

console.log('done');
