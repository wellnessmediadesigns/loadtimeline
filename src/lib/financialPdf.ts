/**
 * Financial (detention pay) summary PDF — separate from per-load reports.
 * Share-only; it is intentionally NOT saved to the load Reports library.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import dayjs from 'dayjs';
import { brand } from '@/theme/colors';
import { computeFinancials, formatMoney, PERIOD_LABEL, STATUS_LABEL, type Period } from './payments';

function esc(v: string | null | undefined): string {
  if (v == null) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#6B7280',
  partial: brand.warning,
  paid: brand.success,
  refused: brand.danger,
};

function buildHtml(defaultRate: number, period: Period): string {
  const fin = computeFinancials(defaultRate, period);
  const generated = dayjs().format('MMM D, YYYY · h:mm A');

  const stat = (label: string, value: string, color?: string) =>
    `<div class="stat"><div class="stat-v" style="${color ? `color:${color}` : ''}">${esc(value)}</div><div class="stat-l">${esc(label)}</div></div>`;

  const topRows = fin.topPaid
    .map(
      (r) =>
        `<tr><td>${esc(r.load.loadNumber ? `Load ${r.load.loadNumber}` : 'Load')}</td><td class="r">${esc(formatMoney(r.received))}</td></tr>`,
    )
    .join('') || '<tr><td colspan="2" class="muted">No payments received yet.</td></tr>';

  const rows = fin.rows
    .map((r) => {
      const route = [r.load.shipper, r.load.receiver].filter(Boolean).join(' → ') || '—';
      return `<tr>
        <td>${esc(r.load.loadNumber ? `Load ${r.load.loadNumber}` : 'Load')}<div class="sub">${esc(route)}</div></td>
        <td class="r">${r.detentionHours.toFixed(2)}h</td>
        <td class="r">${esc(formatMoney(r.anticipated))}</td>
        <td class="r">${esc(formatMoney(r.received))}</td>
        <td><span class="badge" style="background:${STATUS_COLOR[r.status]}">${esc(STATUS_LABEL[r.status])}</span></td>
      </tr>`;
    })
    .join('');

  const collection = fin.collectionRate != null ? `${Math.round(fin.collectionRate * 100)}%` : '—';

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: letter; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111827; font-size: 13px; }
    .header { background: ${brand.navy}; color: #F8FAFC; padding: 26px 32px; }
    .brand { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #94A3B8; font-weight: 700; }
    .app { font-size: 24px; font-weight: 800; margin: 8px 0 2px; }
    .sub2 { font-size: 12px; color: #94A3B8; }
    .content { padding: 22px 32px 40px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; color: ${brand.navy}; margin: 22px 0 11px; }
    .stats { display: flex; flex-wrap: wrap; gap: 10px; }
    .stat { border: 1px solid #E5E7EB; border-radius: 12px; padding: 12px 14px; min-width: 130px; flex: 1; background: #fff; }
    .stat-v { font-size: 20px; font-weight: 800; }
    .stat-l { font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; padding: 8px 10px; border-bottom: 2px solid #E5E7EB; }
    td { padding: 10px; font-size: 12.5px; border-bottom: 1px solid #F1F5F9; vertical-align: top; }
    td.r, th.r { text-align: right; }
    .sub { font-size: 10.5px; color: #6B7280; margin-top: 2px; }
    .badge { color: #fff; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; text-transform: uppercase; }
    .muted { color: #6B7280; }
    .footer { margin-top: 28px; border-top: 1px solid #E5E7EB; padding-top: 14px; font-size: 10.5px; color: #94A3B8; text-align: center; }
  </style></head><body>
    <div class="header">
      <div class="brand">Organized Freight · LoadTimeline</div>
      <div class="app">Detention Pay Summary</div>
      <div class="sub2">${esc(PERIOD_LABEL[period])} · Generated ${esc(generated)}</div>
    </div>
    <div class="content">
      <div class="stats">
        ${stat('Anticipated', formatMoney(fin.totalAnticipated))}
        ${stat('Received', formatMoney(fin.totalReceived), brand.success)}
        ${stat('Outstanding', formatMoney(fin.totalOutstanding), fin.totalOutstanding > 0 ? brand.danger : undefined)}
        ${stat('Collection Rate', collection)}
      </div>

      <h2>Top Paying Loads</h2>
      <table><tbody>${topRows}</tbody></table>

      <h2>All Detention Loads (${fin.rows.length})</h2>
      <table>
        <thead><tr><th>Load</th><th class="r">Detention</th><th class="r">Anticipated</th><th class="r">Received</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="muted">No detention loads in this period.</td></tr>'}</tbody>
      </table>

      <div class="footer">Generated by <b>LoadTimeline</b> — A Product by Organized Freight · Documentation Made Simple</div>
    </div>
  </body></html>`;
}

export async function shareFinancialReport(defaultRate: number, period: Period): Promise<void> {
  const html = buildHtml(defaultRate, period);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  let shareUri = uri;
  try {
    const dest = new File(Paths.cache, `LoadTimeline-Detention-${period}.pdf`);
    if (dest.exists) dest.delete();
    new File(uri).move(dest);
    shareUri = dest.uri;
  } catch {
    // use temp uri
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', dialogTitle: 'Share Detention Pay Summary', UTI: 'com.adobe.pdf' });
  }
}
