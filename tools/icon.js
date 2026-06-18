/* Generates app icon / splash assets with the Organized Freight blocks mark. */
const zlib = require('zlib');
const fs = require('fs');

function crc(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const cb = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(cb) >>> 0); return Buffer.concat([len, cb, c]); }

const NAVY = [15, 23, 42];
const CYAN = [91, 200, 232];
const BLUE = [71, 115, 214];

function makePng(size, bg, transparent) {
  const channels = transparent ? 4 : 3;
  const colorType = transparent ? 6 : 2;
  const px = Buffer.alloc(size * size * channels);
  for (let i = 0; i < size * size; i++) {
    const o = i * channels;
    if (transparent) { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 0; }
    else { px[o] = bg[0]; px[o + 1] = bg[1]; px[o + 2] = bg[2]; }
  }

  // Stacked-freight mark: total = 3u + 2g (square), bar = 2u + g.
  const G = Math.round(size * 0.52);
  const u = G / 3.36;
  const gap = u * 0.18;
  const radius = Math.round(u * 0.28);
  const ox = Math.round((size - G) / 2);
  const oy = Math.round((size - G) / 2);
  const bar = 2 * u + gap;
  const rowY = (i) => oy + Math.round(i * (u + gap));
  const blocks = [
    [ox, rowY(0), u, BLUE],
    [ox + u + gap, rowY(0), bar, CYAN],
    [ox, rowY(1), bar, CYAN],
    [ox + 2 * u + 2 * gap, rowY(1), u, BLUE],
    [ox, rowY(2), u, BLUE],
    [ox + u + gap, rowY(2), bar, CYAN],
  ];

  const drawRoundRect = (bx, by, bw, bh, rad, color) => {
    bx = Math.round(bx); by = Math.round(by); bw = Math.round(bw); bh = Math.round(bh);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        // rounded-corner test
        let inside = true;
        if (x < rad && y < rad) inside = (rad - x) ** 2 + (rad - y) ** 2 <= rad * rad;
        else if (x >= bw - rad && y < rad) inside = (x - (bw - rad - 1)) ** 2 + (rad - y) ** 2 <= rad * rad;
        else if (x < rad && y >= bh - rad) inside = (rad - x) ** 2 + (y - (bh - rad - 1)) ** 2 <= rad * rad;
        else if (x >= bw - rad && y >= bh - rad) inside = (x - (bw - rad - 1)) ** 2 + (y - (bh - rad - 1)) ** 2 <= rad * rad;
        if (!inside) continue;
        const px_x = bx + x, px_y = by + y;
        if (px_x < 0 || px_y < 0 || px_x >= size || px_y >= size) continue;
        const o = (px_y * size + px_x) * channels;
        px[o] = color[0]; px[o + 1] = color[1]; px[o + 2] = color[2];
        if (transparent) px[o + 3] = 255;
      }
    }
  };

  for (const [bx, by, bw, color] of blocks) drawRoundRect(bx, by, bw, u, radius, color);

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
