/* Generates premium app icon / splash / favicon assets with the Organized
 * Freight stacked-blocks mark on a branded gradient. Pure Node (no native
 * deps): renders at 3x and box-downsamples for anti-aliased edges. */
const zlib = require('zlib');
const fs = require('fs');

function crc(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const cb = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(cb) >>> 0); return Buffer.concat([len, cb, c]); }

// Brand palette
const DEEP = [30, 58, 138];   // #1E3A8A deep blue (top-left)
const NAVY = [15, 23, 42];    // #0F172A navy (bottom-right)
const ACCENT = [37, 99, 235]; // #2563EB glow
const CYAN = [91, 200, 232];
const BLUE = [71, 115, 214];

const SS = 3; // supersample factor

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

/** Renders one image at the final pixel size, supersampled internally. */
function makeImage(size, { opaque }) {
  const N = size * SS;
  const channels = opaque ? 3 : 4;
  const hi = Buffer.alloc(N * N * channels);

  const cx = (N - 1) / 2, cy = (N - 1) / 2;
  const maxD = Math.hypot(cx, cy);

  // Background: diagonal gradient + soft centered accent glow.
  if (opaque) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const t = (x + y) / (2 * (N - 1));
        const d = Math.hypot(x - cx, y - cy) / maxD;
        const glow = Math.max(0, 1 - d * 1.4) * 0.22;
        const o = (y * N + x) * channels;
        for (let c = 0; c < 3; c++) {
          const base = DEEP[c] + (NAVY[c] - DEEP[c]) * t;
          hi[o + c] = clamp(base + (ACCENT[c] - base) * glow);
        }
      }
    }
  }

  // Stacked-freight mark geometry: total = 3u + 2g (square), bar = 2u + g.
  const G = Math.round(N * 0.5);
  const u = G / 3.36;
  const gap = u * 0.18;
  const radius = u * 0.28;
  const ox = Math.round((N - G) / 2);
  const oy = Math.round((N - G) / 2);
  const bar = 2 * u + gap;
  const rowY = (i) => oy + i * (u + gap);
  const blocks = [
    [ox, rowY(0), u, BLUE],
    [ox + u + gap, rowY(0), bar, CYAN],
    [ox, rowY(1), bar, CYAN],
    [ox + 2 * u + 2 * gap, rowY(1), u, BLUE],
    [ox, rowY(2), u, BLUE],
    [ox + u + gap, rowY(2), bar, CYAN],
  ];

  const drawRoundRect = (bx, by, bw, bh, rad, color) => {
    bx = Math.round(bx); by = Math.round(by); bw = Math.round(bw); bh = Math.round(bh); rad = Math.round(rad);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        let inside = true;
        if (x < rad && y < rad) inside = (rad - x) ** 2 + (rad - y) ** 2 <= rad * rad;
        else if (x >= bw - rad && y < rad) inside = (x - (bw - rad - 1)) ** 2 + (rad - y) ** 2 <= rad * rad;
        else if (x < rad && y >= bh - rad) inside = (rad - x) ** 2 + (y - (bh - rad - 1)) ** 2 <= rad * rad;
        else if (x >= bw - rad && y >= bh - rad) inside = (x - (bw - rad - 1)) ** 2 + (y - (bh - rad - 1)) ** 2 <= rad * rad;
        if (!inside) continue;
        const X = bx + x, Y = by + y;
        if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        const o = (Y * N + X) * channels;
        hi[o] = color[0]; hi[o + 1] = color[1]; hi[o + 2] = color[2];
        if (!opaque) hi[o + 3] = 255;
      }
    }
  };
  for (const [bx, by, bw, color] of blocks) drawRoundRect(bx, by, bw, u, radius, color);

  // Box-downsample SSxSS -> final.
  const px = Buffer.alloc(size * size * channels);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const o = (((y * SS + sy) * N) + (x * SS + sx)) * channels;
          for (let c = 0; c < channels; c++) acc[c] += hi[o + c];
        }
      }
      const o = (y * size + x) * channels;
      const n = SS * SS;
      for (let c = 0; c < channels; c++) px[o + c] = Math.round(acc[c] / n);
    }
  }

  const stride = size * channels;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = opaque ? 2 : 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

fs.writeFileSync('assets/icon.png', makeImage(1024, { opaque: true }));
fs.writeFileSync('assets/adaptive-icon.png', makeImage(1024, { opaque: true }));
fs.writeFileSync('assets/splash-icon.png', makeImage(512, { opaque: false }));
fs.writeFileSync('assets/favicon.png', makeImage(64, { opaque: false }));
console.log('icons written');
