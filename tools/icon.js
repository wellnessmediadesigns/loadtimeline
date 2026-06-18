/* Generates app icon / splash assets with the Organized Freight blocks mark. */
const zlib = require('zlib');
const fs = require('fs');

function crc(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const cb = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(cb) >>> 0); return Buffer.concat([len, cb, c]); }

const NAVY = [15, 23, 42];
const ACCENT = [37, 99, 235];
function blend(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
const DIM = blend(NAVY, ACCENT, 0.55);

function makePng(size, bg, transparent) {
  const channels = transparent ? 4 : 3;
  const colorType = transparent ? 6 : 2;
  const px = Buffer.alloc(size * size * channels);
  // fill background
  for (let i = 0; i < size * size; i++) {
    const o = i * channels;
    if (transparent) { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 0; }
    else { px[o] = bg[0]; px[o + 1] = bg[1]; px[o + 2] = bg[2]; }
  }

  // blocks grid
  const G = Math.round(size * 0.5);
  const gap = Math.round(size * 0.045);
  const cell = Math.round((G - gap) / 2);
  const radius = Math.round(cell * 0.28);
  const ox = Math.round((size - G) / 2);
  const oy = Math.round((size - G) / 2);
  const cells = [
    { x: ox, y: oy, c: ACCENT },
    { x: ox + cell + gap, y: oy, c: DIM },
    { x: ox, y: oy + cell + gap, c: DIM },
    { x: ox + cell + gap, y: oy + cell + gap, c: ACCENT },
  ];

  const inRounded = (lx, ly) => {
    // rounded-rect hit test within a cell of width/height = cell
    if (lx >= radius && lx < cell - radius) return true;
    if (ly >= radius && ly < cell - radius) return true;
    const cornersX = lx < radius ? radius : cell - radius - 1;
    const cornersY = ly < radius ? radius : cell - radius - 1;
    const dx = lx - cornersX, dy = ly - cornersY;
    return dx * dx + dy * dy <= radius * radius;
  };

  for (const cl of cells) {
    for (let y = 0; y < cell; y++) {
      for (let x = 0; x < cell; x++) {
        if (!inRounded(x, y)) continue;
        const px_x = cl.x + x, px_y = cl.y + y;
        const o = (px_y * size + px_x) * channels;
        px[o] = cl.c[0]; px[o + 1] = cl.c[1]; px[o + 2] = cl.c[2];
        if (transparent) px[o + 3] = 255;
      }
    }
  }

  // add filter byte 0 per row
  const stride = size * channels;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = colorType; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

fs.writeFileSync('assets/icon.png', makePng(1024, NAVY, false));
fs.writeFileSync('assets/adaptive-icon.png', makePng(1024, NAVY, false));
fs.writeFileSync('assets/splash-icon.png', makePng(512, NAVY, true));
fs.writeFileSync('assets/favicon.png', makePng(64, NAVY, true));
console.log('icons written');
