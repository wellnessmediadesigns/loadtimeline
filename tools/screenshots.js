/* App Store screenshot generator for LoadTimeline.
 * Renders faithful UI mockups (exact palette + real Ionicons) to 1290x2796 PNGs.
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('/tmp/node_modules/@resvg/resvg-js');

const PROJ = '/home/user/loadtimeline';
const ION_TTF = path.join(PROJ, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
const GLYPHS = require(path.join(PROJ, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'));
const OUT = path.join(PROJ, 'store-screenshots');
fs.mkdirSync(OUT, { recursive: true });

const W = 430, H = 932, SCALE = 3;
const SANS = 'FreeSans'; // Helvetica-like

const C = {
  bg: '#F8FAFC', card: '#FFFFFF', cardAlt: '#F1F5F9', text: '#111827', sec: '#6B7280',
  border: '#E5E7EB', accent: '#2563EB', accentSoft: '#DBEAFE', navy: '#0F172A',
  slate: '#1E293B', success: '#22C55E', successSoft: '#DCFCE7', warning: '#F59E0B',
  warningSoft: '#FEF3C7', danger: '#EF4444', dangerSoft: '#FEE2E2', white: '#FFFFFF',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rect(x, y, w, h, r, fill, o = {}) {
  const stroke = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : '';
  const op = o.opacity != null ? ` opacity="${o.opacity}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"${stroke}${op}/>`;
}
function txt(x, y, s, o = {}) {
  const size = o.size || 15, weight = o.weight || 400, fill = o.fill || C.text;
  const anchor = o.anchor || 'start', family = o.family || SANS;
  const ls = o.ls != null ? ` letter-spacing="${o.ls}"` : '';
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls}>${esc(s)}</text>`;
}
function icon(cx, cy, name, size, fill) {
  const code = GLYPHS[name];
  if (!code) return '';
  const ch = `&#${code};`;
  return `<text x="${cx}" y="${cy}" font-family="Ionicons" font-size="${size}" fill="${fill}" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
}
// Soft subtle shadow behind a card.
function card(x, y, w, h, r = 16, fill = C.card, o = {}) {
  const shadow = rect(x + 0, y + 3, w, h, r, C.navy, { opacity: 0.05 });
  return shadow + rect(x, y, w, h, r, fill, { stroke: o.stroke || C.border, sw: o.sw || 1 });
}
function iconChip(x, y, sz, bg, name, glyphColor, gsz) {
  return rect(x, y, sz, sz, sz * 0.3, bg) + icon(x + sz / 2, y + sz / 2, name, gsz || sz * 0.55, glyphColor);
}

function statusBar(dark = true) {
  const col = dark ? C.text : C.white;
  return (
    txt(30, 34, '9:41', { size: 15, weight: 700, fill: col }) +
    // signal dots
    `<g fill="${col}">` +
    rect(352, 24, 4, 9, 1, col) + rect(359, 21, 4, 12, 1, col) + rect(366, 18, 4, 15, 1, col) +
    `</g>` +
    // battery
    rect(384, 21, 22, 11, 3, 'none', { stroke: col, sw: 1.2 }) +
    rect(386, 23, 16, 7, 1.5, col) +
    `<rect x="407" y="24" width="2" height="5" rx="1" fill="${col}"/>`
  );
}
function homeIndicator(dark = true) {
  return rect(W / 2 - 67, H - 12, 134, 5, 2.5, dark ? C.navy : C.white, { opacity: 0.85 });
}

function frame(inner, bg = C.bg, dark = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    rect(0, 0, W, H, 0, bg) + statusBar(dark) + inner + homeIndicator(dark) + `</svg>`;
}

function overline(x, y, s) { return txt(x, y, s.toUpperCase(), { size: 11, weight: 700, fill: C.sec, ls: 1.2 }); }

// Centered icon + label group for buttons (avoids overlap).
function btnLabel(cx, cy, iconName, label, size, color) {
  const charW = size * 0.56;
  const tw = label.length * charW;
  const gap = 12, isz = size * 1.15;
  const total = isz + gap + tw;
  const startX = cx - total / 2;
  let s = icon(startX + isz / 2, cy, iconName, isz, color);
  s += txt(startX + isz + gap, cy + size * 0.36, label, { size, weight: 700, fill: color });
  return s;
}

// ---------- shared pieces ----------
function header(title, subtitle) {
  let s = '';
  s += iconChip(16, 50, 40, C.cardAlt, 'chevron-back', C.text, 22);
  s += txt(W / 2, 66, title, { size: 17, weight: 700, anchor: 'middle' });
  if (subtitle) s += txt(W / 2, 82, subtitle, { size: 12, weight: 600, fill: C.sec, anchor: 'middle' });
  s += iconChip(W - 16 - 40, 50, 40, C.cardAlt, 'document-text', C.accent, 20);
  s += iconChip(W - 16 - 40 - 46, 50, 40, C.cardAlt, 'ellipsis-horizontal', C.text, 20);
  return s;
}

// Modal-style header: centered title, "Cancel" on the right, no back chevron.
function modalHeader(title, subtitle) {
  let s = txt(W / 2, 66, title, { size: 17, weight: 700, anchor: 'middle' });
  if (subtitle) s += txt(W / 2, 82, subtitle, { size: 12, weight: 600, fill: C.sec, anchor: 'middle' });
  s += txt(W - 24, 70, 'Cancel', { size: 14, weight: 600, fill: C.accent, anchor: 'end' });
  return s;
}

function statCard(x, y, w, h, label, value, opt = {}) {
  const fg = opt.fg || C.success, bg = opt.bg || C.successSoft;
  let s = card(x, y, w, h);
  if (opt.icon) s += iconChip(x + 14, y + 14, 34, bg, opt.icon, fg, 18);
  s += txt(x + 14, y + h - 26, value, { size: 22, weight: 800 });
  s += txt(x + 14, y + h - 9, label.toUpperCase(), { size: 10, weight: 700, fill: C.sec, ls: 0.5 });
  return s;
}

// ===================== SCREEN 1: DASHBOARD =====================
function dashboard() {
  let s = '';
  let y = 70;
  s += overline(20, y + 8, 'Organized Freight');
  s += txt(20, y + 38, 'LoadTimeline', { size: 30, weight: 800 });
  s += txt(20, y + 60, 'If It Happened, Prove It.', { size: 14, weight: 600, fill: C.accent });

  // stat grid 2 cols x 3
  const gx = 20, gw = (W - 40 - 10) / 2, gh = 88;
  const stats = [
    ['Active Loads', '3', 'cube', C.accent, C.accentSoft],
    ['Completed', '12', 'checkmark-done', C.accent, C.accentSoft],
    ['Reports', '7', 'document-text', C.accent, C.accentSoft],
    ['Hours Logged', '41.5h', 'time', C.accent, C.accentSoft],
    ['Incidents', '2', 'warning', C.warning, C.warningSoft],
    ['Detention', '3.2h', 'hourglass', C.danger, C.dangerSoft],
  ];
  let sy = y + 86;
  stats.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s += statCard(gx + col * (gw + 10), sy + row * (gh + 10), gw, gh, st[0], st[1], { icon: st[2], fg: st[3], bg: st[4] });
  });

  // NEW LOAD button
  let by = sy + 3 * (gh + 10) + 6;
  s += rect(20, by, W - 40, 60, 16, C.accent);
  s += btnLabel(W / 2, by + 30, 'add-circle', 'NEW LOAD', 18, C.white);
  s += txt(W / 2, by + 82, '18 of 25 free loads remaining', { size: 12, weight: 600, fill: C.sec, anchor: 'middle' });

  // Active Loads section
  let ly = by + 108;
  s += overline(20, ly, 'Active Loads');
  const loadCard = (yy, num, cust, evt, dur, durColor, incid) => {
    let c = card(20, yy, W - 40, 88);
    c += txt(36, yy + 28, `Load ${num}`, { size: 16, weight: 700 });
    c += txt(36, yy + 47, cust, { size: 11, weight: 600, fill: C.sec });
    // status pill
    c += rect(W - 36 - 70, yy + 16, 70, 22, 11, C.accentSoft);
    c += txt(W - 36 - 35, yy + 31, 'ACTIVE', { size: 10, weight: 700, fill: C.accent, anchor: 'middle' });
    // meta row
    c += icon(44, yy + 67, 'flag', 13, C.sec) + txt(54, yy + 71, evt, { size: 11, weight: 600 });
    c += icon(150, yy + 67, 'time', 13, durColor) + txt(160, yy + 71, dur, { size: 11, weight: 600 });
    if (incid) { c += icon(232, yy + 67, 'warning', 13, C.danger) + txt(242, yy + 71, incid, { size: 11, weight: 600 }); }
    c += txt(W - 36, yy + 71, 'Today', { size: 11, weight: 600, fill: C.sec, anchor: 'end' });
    return c;
  };
  s += loadCard(ly + 14, '48213', 'Costco Wholesale · TQL', 'At Dock', '6h 51m', C.danger, '1');
  s += loadCard(ly + 14 + 100, '48219', 'Walmart DC · RXO', 'Arrived', '22m', C.success, null);
  return frame(s);
}

// ===================== SCREEN 2: ACTIVE LOAD (one-tap) =====================
function activeLoad() {
  let s = header('Load 48213', 'Costco Wholesale · TQL');
  // route card
  let ry = 102;
  s += card(20, ry, W - 40, 92);
  s += icon(44, ry + 28, 'arrow-up-circle', 20, C.accent);
  s += txt(64, ry + 24, 'PICKUP', { size: 10, weight: 700, fill: C.sec, ls: 0.5 });
  s += txt(64, ry + 40, 'Ontario, CA · Costco DC', { size: 14, weight: 600 });
  s += icon(44, ry + 66, 'arrow-down-circle', 20, C.accent);
  s += txt(64, ry + 62, 'DELIVERY', { size: 10, weight: 700, fill: C.sec, ls: 0.5 });
  s += txt(64, ry + 78, 'Phoenix, AZ · Costco #1108', { size: 14, weight: 600 });

  // RECORD EVENT
  let ey = ry + 116;
  s += overline(20, ey, 'Record Event');
  const events = [
    ['Arrived', 'location', true], ['Checked In', 'clipboard', true],
    ['At Dock', 'enter', true], ['Loaded', 'cube', false],
    ['Unloaded', 'file-tray-full', false], ['Departed', 'exit', false],
  ];
  const bw = (W - 40 - 10) / 2, bh = 104;
  let by = ey + 14;
  events.forEach((e, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 20 + col * (bw + 10), yy = by + row * (bh + 10);
    const recorded = e[2];
    s += rect(x + 0, yy + 3, bw, bh, 16, C.navy, { opacity: 0.05 });
    s += rect(x, yy, bw, bh, 16, recorded ? C.successSoft : C.card, { stroke: recorded ? C.success : C.border, sw: 1.5 });
    s += iconChip(x + 14, yy + 14, 44, recorded ? C.success : C.accentSoft, recorded ? 'checkmark' : e[1], recorded ? C.white : C.accent, 22);
    s += txt(x + 14, yy + 80, e[0], { size: 16, weight: 700 });
    s += txt(x + 14, yy + 96, recorded ? 'Recorded' : 'Tap to log', { size: 11, weight: 600, fill: C.sec });
  });

  // DETENTION (2 hero cards)
  let dy = by + 3 * (bh + 10) + 6;
  s += overline(20, dy, 'Detention');
  const dw = (W - 40 - 10) / 2, dh = 96;
  s += statCard(20, dy + 14, dw, dh, 'Time On Site', '6h 51m', { icon: 'time', fg: C.danger, bg: C.dangerSoft });
  s += txt(34, dy + 14 + 14, '', {});
  s += statCard(20 + dw + 10, dy + 14, dw, dh, 'Potential Detention', '4h 51m', { icon: 'alert-circle', fg: C.danger, bg: C.dangerSoft });
  return frame(s);
}

// ===================== SCREEN 3: TIMELINE + DETENTION =====================
function timeline() {
  let s = header('Load 48213', 'Timeline & Detention');
  // detention 2x2
  let dy = 104;
  s += overline(20, dy, 'Detention');
  const dw = (W - 40 - 10) / 2, dh = 92;
  s += statCard(20, dy + 12, dw, dh, 'Time On Site', '6h 51m', { icon: 'time', fg: C.danger, bg: C.dangerSoft });
  s += statCard(20 + dw + 10, dy + 12, dw, dh, 'Wait Time', '2h 10m', { icon: 'hourglass', fg: C.warning, bg: C.warningSoft });
  s += statCard(20, dy + 12 + dh + 10, dw, dh, 'Loading', '4h 23m', { icon: 'cube', fg: C.success, bg: C.successSoft });
  s += statCard(20 + dw + 10, dy + 12 + dh + 10, dw, dh, 'Unloading', '—', { icon: 'file-tray-full', fg: C.success, bg: C.successSoft });

  // TIMELINE
  let ty = dy + 12 + 2 * (dh + 10) + 14;
  s += overline(20, ty, 'Timeline');
  let cy = ty + 14;
  const rows = [
    ['8:01 AM', 'Arrived', 'Ontario, CA · Costco DC', 'location'],
    ['8:07 AM', 'Checked In', 'Guard shack · Door assigned', 'clipboard'],
    ['10:11 AM', 'At Dock', 'Door 42', 'enter'],
    ['2:34 PM', 'Loaded', '24 pallets · Seal #884201', 'cube'],
    ['2:52 PM', 'Departed', 'Ontario, CA', 'exit'],
  ];
  const rowH = 82;
  s += card(20, cy, W - 40, rows.length * rowH + 16);
  const railX = 120;
  rows.forEach((r, i) => {
    const yy = cy + 24 + i * rowH;
    // time
    s += txt(104, yy + 4, r[0], { size: 13, weight: 700, anchor: 'end' });
    // rail line
    if (i < rows.length - 1) s += `<line x1="${railX}" y1="${yy}" x2="${railX}" y2="${yy + rowH}" stroke="${C.border}" stroke-width="2"/>`;
    // dot
    s += `<circle cx="${railX}" cy="${yy}" r="12" fill="${C.accent}"/>`;
    s += icon(railX, yy, r[3], 12, C.white);
    // body
    s += txt(railX + 22, yy + 4, r[1], { size: 16, weight: 700 });
    s += txt(railX + 22, yy + 24, r[2], { size: 12, weight: 500, fill: C.sec });
  });
  return frame(s);
}

// ===================== SCREEN 4: INCIDENT CENTER =====================
function incidents() {
  let s = modalHeader('Document Incident', 'Load 48213');
  let y = 104;
  s += overline(20, y, 'Type');
  const types = [
    ['Damaged Freight', true], ['Shortage', false], ['Seal Issue', false],
    ['Rejected', false], ['Lumper Fee', false], ['Late Delivery', false],
  ];
  // chips wrap
  let cx = 20, cy = y + 14;
  const chipH = 38;
  types.forEach((tp) => {
    const tw = 28 + tp[0].length * 8.2;
    if (cx + tw > W - 20) { cx = 20; cy += chipH + 10; }
    s += rect(cx, cy, tw, chipH, 19, tp[1] ? C.accent : C.card, { stroke: tp[1] ? C.accent : C.border });
    s += txt(cx + tw / 2, cy + 25, tp[0], { size: 13, weight: 600, fill: tp[1] ? C.white : C.text, anchor: 'middle' });
    cx += tw + 10;
  });

  // Title field
  let fy = cy + chipH + 22;
  s += txt(20, fy, 'TITLE', { size: 11, weight: 700, fill: C.sec, ls: 0.5 });
  s += card(20, fy + 10, W - 40, 52);
  s += txt(36, fy + 42, 'Crushed pallets — front 4 rows', { size: 14, weight: 600 });

  // Notes
  fy += 80;
  s += txt(20, fy, 'NOTES', { size: 11, weight: 700, fill: C.sec, ls: 0.5 });
  s += card(20, fy + 10, W - 40, 96);
  s += txt(36, fy + 38, 'Forklift damage noted at door 42 before', { size: 14, weight: 500 });
  s += txt(36, fy + 60, 'loading. Driver flagged to checker and', { size: 14, weight: 500 });
  s += txt(36, fy + 82, 'broker. Photos attached.', { size: 14, weight: 500 });

  // Severity
  fy += 124;
  s += txt(20, fy, 'SEVERITY', { size: 11, weight: 700, fill: C.sec, ls: 0.5 });
  const sevs = [['Low', false, C.success], ['Medium', false, C.warning], ['High', true, C.danger]];
  let sx = 20;
  sevs.forEach((sv) => {
    const tw = 80;
    s += rect(sx, fy + 10, tw, 38, 19, sv[1] ? C.accent : C.card, { stroke: sv[1] ? C.accent : C.border });
    s += txt(sx + tw / 2, fy + 35, sv[0], { size: 13, weight: 600, fill: sv[1] ? C.white : C.text, anchor: 'middle' });
    sx += tw + 10;
  });

  // Photos
  fy += 66;
  s += txt(20, fy, 'PHOTOS', { size: 11, weight: 700, fill: C.sec, ls: 0.5 });
  let py = fy + 10;
  // two photo thumbs (simulated) + camera + library
  const ph = 84;
  s += rect(20, py, ph, ph, 12, '#C7CDD6', { stroke: C.border });
  s += icon(20 + ph / 2, py + ph / 2, 'cube', 30, '#8A93A2');
  s += rect(20 + ph + 10, py, ph, ph, 12, '#B9C0CA', { stroke: C.border });
  s += icon(20 + ph + 10 + ph / 2, py + ph / 2, 'cube', 30, '#8A93A2');
  // add buttons (dashed)
  const addX = 20 + 2 * (ph + 10);
  s += rect(addX, py, ph, ph, 12, C.cardAlt, { stroke: C.border });
  s += icon(addX + ph / 2, py + ph / 2 - 8, 'camera', 22, C.accent);
  s += txt(addX + ph / 2, py + ph / 2 + 22, 'Camera', { size: 11, weight: 600, fill: C.sec, anchor: 'middle' });

  // Save button
  s += rect(20, H - 86, W - 40, 60, 16, C.accent);
  s += btnLabel(W / 2, H - 56, 'checkmark', 'Save Incident', 18, C.white);
  return frame(s);
}

// ===================== SCREEN 5: REPORT =====================
function report() {
  let s = header('Generate Report', 'Load 48213');
  // hero card with navy badge
  let y = 104;
  s += card(20, y, W - 40, 150);
  s += rect(36, y + 16, W - 72, 92, 16, C.navy);
  s += txt(52, y + 40, 'ORGANIZED FREIGHT', { size: 10, weight: 700, fill: '#94A3B8', ls: 1 });
  s += txt(52, y + 66, 'LoadTimeline Report', { size: 20, weight: 700, fill: C.white });
  s += txt(52, y + 88, 'If It Happened, Prove It.', { size: 12, weight: 600, fill: '#60A5FA' });
  s += txt(W / 2, y + 134, 'Premium report template', { size: 13, weight: 500, fill: C.sec, anchor: 'middle' });

  // includes card
  let iy = y + 168;
  s += card(20, iy, W - 40, 300);
  s += txt(36, iy + 28, 'THIS REPORT INCLUDES', { size: 11, weight: 700, fill: C.sec, ls: 0.5 });
  const rows = [
    'Load details', 'Timeline · 5 events', 'GPS & arrival/departure records',
    'Detention summary · 6h 51m on site', 'Incident log · 1', 'Photos · 6 (full gallery)',
  ];
  rows.forEach((r, i) => {
    const ry = iy + 58 + i * 40;
    s += icon(44, ry, 'checkmark-circle', 20, C.success);
    s += txt(64, ry + 5, r, { size: 14, weight: 500 });
  });

  // share + print buttons
  s += rect(20, H - 150, W - 40, 60, 16, C.accent);
  s += btnLabel(W / 2, H - 120, 'share-social', 'Share / Email / Save PDF', 16, C.white);
  s += rect(20, H - 82, W - 40, 56, 16, C.cardAlt, { stroke: C.border });
  s += btnLabel(W / 2, H - 54, 'print', 'Print', 16, C.text);
  return frame(s);
}

// ===================== SCREEN 6: ANALYTICS =====================
function analytics() {
  let s = '';
  let y = 70;
  s += txt(20, y + 22, 'Analytics', { size: 30, weight: 800 });
  s += txt(20, y + 46, 'Your documentation at a glance.', { size: 14, weight: 500, fill: C.sec });

  const gx = 20, gw = (W - 40 - 10) / 2, gh = 88;
  const stats = [
    ['Loads Logged', '15', 'cube', C.accent, C.accentSoft],
    ['Hours Detained', '3.2h', 'hourglass', C.danger, C.dangerSoft],
    ['Incidents', '2', 'warning', C.warning, C.warningSoft],
    ['Reports', '7', 'document-text', C.accent, C.accentSoft],
    ['Avg Facility Time', '3h 18m', 'time', C.accent, C.accentSoft],
    ['Top Delay', 'Detention', 'alert-circle', C.warning, C.warningSoft],
  ];
  let sy = y + 70;
  stats.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s += statCard(gx + col * (gw + 10), sy + row * (gh + 10), gw, gh, st[0], st[1], { icon: st[2], fg: st[3], bg: st[4] });
  });

  // incidents by type bar chart
  let by = sy + 3 * (gh + 10) + 14;
  s += overline(20, by, 'Incidents by Type');
  s += card(20, by + 14, W - 40, 230);
  const bars = [
    ['Damaged Freight', 5], ['Detention', 4], ['Seal Issue', 3], ['Lumper Fee', 2], ['Shortage', 1],
  ];
  const max = 5;
  bars.forEach((b, i) => {
    const ry = by + 50 + i * 38;
    s += txt(40, ry + 4, b[0], { size: 12, weight: 600 });
    const trackX = 190, trackW = W - 40 - 190 - 40;
    s += rect(trackX, ry - 6, trackW, 10, 5, C.cardAlt);
    s += rect(trackX, ry - 6, trackW * (b[1] / max), 10, 5, C.accent);
    s += txt(W - 40, ry + 4, String(b[1]), { size: 13, weight: 700, anchor: 'end' });
  });
  return frame(s);
}

// ---------- render ----------
const screens = [
  ['01-dashboard', dashboard()],
  ['02-active-load', activeLoad()],
  ['03-timeline', timeline()],
  ['04-incident-center', incidents()],
  ['05-report', report()],
  ['06-analytics', analytics()],
];

for (const [name, svg] of screens) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: W * SCALE },
    font: { fontFiles: [ION_TTF], loadSystemFonts: true, defaultFontFamily: SANS },
    background: C.bg,
  });
  const png = r.render().asPng();
  fs.writeFileSync(path.join(OUT, `${name}.png`), png);
  console.log('wrote', name, png.length, 'bytes');
}
console.log('done ->', OUT);
