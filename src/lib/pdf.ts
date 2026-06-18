/**
 * Branded PDF report generation via expo-print (HTML -> PDF) + expo-sharing.
 * Produces professional documentation suitable for customers, dispatchers,
 * claims, detention requests, and broker paperwork.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { brand } from '@/theme/colors';
import { computeDetention, detentionLevel, DetentionLevel, onSiteLevel, StopDetention } from './detention';
import { formatDate, formatDateTime, formatDuration, formatTime, shortCoords } from './format';
import { toDataUri } from './photos';
import { EVENT_META, INCIDENT_META, SEVERITY_LABEL, STOP_META, STOP_ORDER } from '@/types/catalog';
import type { LoadEvent } from '@/types';
import { getLoad } from '@/db/queries/loads';
import { listEvents } from '@/db/queries/events';
import { listIncidents } from '@/db/queries/incidents';
import { listPhotos, listPhotosForLoad } from '@/db/queries/photos';

function esc(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type ReportStops = 'pickup' | 'delivery' | 'both';

export interface ReportFields {
  driver: boolean;
  broker: boolean;
  customer: boolean;
  reference: boolean;
  trailer: boolean;
  status: boolean;
  notes: boolean;
}

export const DEFAULT_REPORT_FIELDS: ReportFields = {
  driver: true,
  broker: true,
  customer: true,
  reference: true,
  trailer: true,
  status: true,
  notes: true,
};

interface ReportOptions {
  stops?: ReportStops;
  fields?: Partial<ReportFields>;
  driverName?: string | null;
  company?: string | null;
}

function buildHtml(loadId: string, opts: ReportOptions): string | null {
  const load = getLoad(loadId);
  if (!load) return null;

  const stops = opts.stops ?? 'both';
  const includeStop = (s: 'pickup' | 'delivery') => stops === 'both' || stops === s;
  const f: ReportFields = { ...DEFAULT_REPORT_FIELDS, ...opts.fields };

  const events = listEvents(loadId);
  const incidents = listIncidents(loadId);
  const detention = computeDetention(events);

  const title = load.loadNumber ? `Load ${esc(load.loadNumber)}` : 'Load Documentation';
  const accent = brand.accent;

  // Load Number, Pickup and Delivery are always included; the rest are
  // optional so a driver can withhold who the customer/broker is.
  const detailRows: [string, string | null][] = [
    ['Load Number', load.loadNumber],
    ['Pickup', load.pickupLocation],
    ['Delivery', load.deliveryLocation],
    ...(f.driver ? ([['Driver', opts.driverName ?? null]] as [string, string | null][]) : []),
    ...(f.driver ? ([['Company', opts.company ?? null]] as [string, string | null][]) : []),
    ...(f.broker ? ([['Broker', load.brokerName]] as [string, string | null][]) : []),
    ...(f.customer ? ([['Customer', load.customerName]] as [string, string | null][]) : []),
    ...(f.reference ? ([['Reference #', load.referenceNumber]] as [string, string | null][]) : []),
    ...(f.trailer ? ([['Trailer #', load.trailerNumber]] as [string, string | null][]) : []),
    ...(f.status ? ([['Status', load.status === 'active' ? 'Active' : 'Completed']] as [string, string | null][]) : []),
  ];
  const detailsHtml = detailRows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`,
    )
    .join('');

  const eventRow = (e: LoadEvent) => {
    const meta = EVENT_META[e.type];
    const photos = listPhotos('event', e.id);
    const photoHtml = photos
      .map((p) => {
        const data = toDataUri(p.thumbUri);
        return data ? `<img class="thumb" src="${data}" />` : '';
      })
      .join('');
    const coords = shortCoords(e.latitude, e.longitude);
    return `
      <div class="tl-row">
        <div class="tl-time">${esc(formatTime(e.timestamp))}<span class="tl-date">${esc(formatDate(e.timestamp))}</span></div>
        <div class="tl-dot"></div>
        <div class="tl-body">
          <div class="tl-label">${esc(meta?.label ?? e.type)}</div>
          ${e.address ? `<div class="tl-sub">${esc(e.address)}</div>` : ''}
          ${coords ? `<div class="tl-coords">GPS: ${esc(coords)}</div>` : ''}
          ${e.notes ? `<div class="tl-note">${esc(e.notes)}</div>` : ''}
          ${photoHtml ? `<div class="thumbs">${photoHtml}</div>` : ''}
        </div>
      </div>`;
  };

  const timelineHtml = STOP_ORDER.filter(includeStop).map((s) => {
    const stopEvents = events.filter((e) => e.stop === s);
    if (stopEvents.length === 0) return '';
    const meta = STOP_META[s];
    const loc = s === 'pickup' ? load.pickupLocation : load.deliveryLocation;
    return `<div class="stop-group">
      <div class="stop-head">${esc(meta.label)}${loc ? ` — ${esc(loc)}` : ''}</div>
      <div class="stop-body">${stopEvents.map(eventRow).join('')}</div>
    </div>`;
  }).join('') || '<div class="muted">No events recorded for the selected stops.</div>';

  const statCard = (label: string, value: string, level?: DetentionLevel) =>
    `<div class="stat${level ? ` lvl-${level}` : ''}"><div class="stat-v">${esc(value)}</div><div class="stat-l">${esc(label)}</div></div>`;

  const detentionValue = (ms: number) => (ms > 0 ? formatDuration(ms) : 'None');

  const stopDetentionHtml = (sd: StopDetention) => {
    const meta = STOP_META[sd.stop];
    return `<div class="stop-group">
      <div class="stop-head">${esc(meta.label)}</div>
      <div class="stop-body"><div class="stats">
        ${statCard('Time On Site', formatDuration(sd.onSiteMs), onSiteLevel(sd.onSiteMs))}
        ${statCard('Wait Time', formatDuration(sd.waitMs), onSiteLevel(sd.waitMs))}
        ${statCard(meta.serviceLabel, formatDuration(sd.serviceMs))}
        ${statCard('Potential Detention', detentionValue(sd.potentialDetentionMs), detentionLevel(sd.potentialDetentionMs))}
      </div></div>
    </div>`;
  };

  const showPickupDet = includeStop('pickup') && detention.pickup.hasActivity;
  const showDeliveryDet = includeStop('delivery') && detention.delivery.hasActivity;
  const anyDetention = showPickupDet || showDeliveryDet;
  // Combined totals scoped to the included stops.
  const scopedDetentionMs =
    (showPickupDet ? detention.pickup.potentialDetentionMs : 0) +
    (showDeliveryDet ? detention.delivery.potentialDetentionMs : 0);
  const detentionHtml = `
    ${showPickupDet ? stopDetentionHtml(detention.pickup) : ''}
    ${showDeliveryDet ? stopDetentionHtml(detention.delivery) : ''}
    ${showPickupDet && showDeliveryDet ? `<div class="combined">${scopedDetentionMs > 0 ? `Combined potential detention: <b>${formatDuration(scopedDetentionMs)}</b>` : '<b>No detention incurred</b> across either stop.'}</div>` : ''}
    ${anyDetention ? `<div class="muted small">Free window: ${detention.pickup.freeMinutes / 60}h per stop. Potential detention is time on site beyond the free window.</div>` : '<div class="muted">No detention data for the selected stops.</div>'}
  `;

  // Trip summary band (page 1): first included-stop arrival -> last departure.
  const includedStops = STOP_ORDER.filter(includeStop).map((s) => (s === 'pickup' ? detention.pickup : detention.delivery));
  const arrivals = includedStops.map((sd) => sd.arrivedAt).filter((v): v is number => v != null);
  const departures = includedStops.map((sd) => sd.departedAt).filter((v): v is number => v != null);
  const tripOngoing = includedStops.some((sd) => sd.ongoing);
  const tripStart = arrivals.length ? Math.min(...arrivals) : null;
  const tripEnd = tripOngoing || departures.length === 0 ? Date.now() : Math.max(...departures);
  const tripMs = tripStart != null ? Math.max(0, tripEnd - tripStart) : null;
  const tripOnSiteMs =
    (showPickupDet ? detention.pickup.onSiteMs ?? 0 : 0) + (showDeliveryDet ? detention.delivery.onSiteMs ?? 0 : 0);

  const tripBandHtml = tripStart != null
    ? `<div class="tripband">
        <div class="stats">
          ${statCard('Total Trip', formatDuration(tripMs))}
          ${statCard('On Site', formatDuration(tripOnSiteMs), onSiteLevel(tripOnSiteMs))}
          ${statCard('Potential Detention', detentionValue(scopedDetentionMs), detentionLevel(scopedDetentionMs))}
        </div>
        <div class="trip-sub">Arrived ${esc(formatDateTime(tripStart))} ${tripOngoing ? '· on site now' : `→ Departed ${esc(formatDateTime(tripEnd))}`}</div>
      </div>`
    : '';

  const incidentsHtml = incidents.length
    ? incidents
        .map((i) => {
          const meta = INCIDENT_META[i.type];
          const photos = listPhotos('incident', i.id);
          const photoHtml = photos
            .map((p) => {
              const data = toDataUri(p.thumbUri);
              return data ? `<img class="thumb" src="${data}" />` : '';
            })
            .join('');
          const coords = shortCoords(i.latitude, i.longitude);
          return `
            <div class="incident sev-${esc(i.severity)}">
              <div class="incident-head">
                <span class="incident-title">${esc(i.title || meta?.label || 'Incident')}</span>
                <span class="badge badge-${esc(i.severity)}">● ${esc(SEVERITY_LABEL[i.severity])}</span>
              </div>
              <div class="incident-meta">${esc(meta?.label ?? i.type)} · ${esc(formatDateTime(i.timestamp))}</div>
              ${i.address ? `<div class="tl-sub">${esc(i.address)}</div>` : ''}
              ${coords ? `<div class="tl-coords">GPS: ${esc(coords)}</div>` : ''}
              ${i.notes ? `<div class="tl-note">${esc(i.notes)}</div>` : ''}
              ${photoHtml ? `<div class="thumbs">${photoHtml}</div>` : ''}
            </div>`;
        })
        .join('')
    : '<div class="muted">No incidents recorded for this load.</div>';

  const allPhotos = listPhotosForLoad(loadId);
  const galleryInner = allPhotos.length
    ? `<div class="gallery">${allPhotos
        .map((p) => {
          const data = toDataUri(p.uri) ?? toDataUri(p.thumbUri);
          return data ? `<img class="gal" src="${data}" />` : '';
        })
        .join('')}</div>`
    : '<div class="muted">No photos captured.</div>';
  const galleryHtml = `<div class="section"><h2>Photo Evidence</h2>${galleryInner}</div>`;

  const scopeLabel = stops === 'both' ? 'Pickup & Delivery' : stops === 'pickup' ? 'Pickup only' : 'Delivery only';
  const tplLabel = scopeLabel;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111827; margin: 0; padding: 0 28px 40px; }
  .header { background: ${brand.navy}; color: #F8FAFC; margin: 0 -28px 24px; padding: 28px; }
  .brandrow { display: flex; align-items: center; gap: 9px; margin-bottom: 2px; }
  .of-mark { display: flex; flex-direction: column; gap: 3px; }
  .of-mark .ofr { display: flex; gap: 3px; }
  .of-mark .sq { width: 9px; height: 9px; border-radius: 2px; }
  .of-mark .bar { width: 21px; height: 9px; border-radius: 2px; }
  .of-mark .blue { background: #4773D6; }
  .of-mark .cyan { background: #5BC8E8; }
  .brand { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #94A3B8; }
  .app { font-size: 26px; font-weight: 800; margin: 4px 0 2px; }
  .tagline { font-size: 13px; color: ${accent === brand.accent ? '#60A5FA' : '#60A5FA'}; font-weight: 600; }
  .doc-title { font-size: 20px; font-weight: 700; margin-top: 14px; }
  .doc-sub { font-size: 12px; color: #94A3B8; margin-top: 2px; }
  .section { margin-top: 26px; page-break-inside: avoid; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: ${accent}; border-bottom: 2px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 0; font-size: 13px; vertical-align: top; }
  td.k { color: #6B7280; width: 140px; font-weight: 600; }
  td.v { color: #111827; font-weight: 600; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; }
  .stat { border: 1px solid #E5E7EB; border-left: 4px solid #E5E7EB; border-radius: 12px; padding: 12px 14px; min-width: 120px; flex: 1; }
  .stat-v { font-size: 20px; font-weight: 800; }
  .stat-l { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .stat.lvl-normal { border-left-color: ${brand.success}; }
  .stat.lvl-normal .stat-v { color: ${brand.success}; }
  .stat.lvl-watch { border-left-color: ${brand.warning}; }
  .stat.lvl-watch .stat-v { color: ${brand.warning}; }
  .stat.lvl-significant { border-left-color: ${brand.danger}; }
  .stat.lvl-significant .stat-v { color: ${brand.danger}; }
  .tripband { background: #F8FAFC; border: 1px solid #E5E7EB; border-left: 4px solid ${accent}; border-radius: 14px; padding: 16px; }
  .trip-sub { font-size: 12px; color: #6B7280; margin-top: 10px; font-weight: 600; }
  .stop-group { margin-bottom: 16px; page-break-inside: avoid; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; }
  .stop-head { font-size: 12px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; color: #fff; background: ${brand.navy}; border-left: 4px solid ${accent}; padding: 9px 12px; }
  .stop-body { padding: 6px 14px 10px; }
  .combined { margin-top: 10px; font-size: 13px; color: #111827; }
  .tl-row { display: flex; gap: 12px; padding: 8px 0; border-left: 0; }
  .tl-time { width: 96px; font-size: 13px; font-weight: 700; }
  .tl-date { display: block; font-size: 10px; color: #6B7280; font-weight: 500; }
  .tl-dot { width: 12px; height: 12px; border-radius: 6px; background: ${accent}; margin-top: 4px; flex: none; }
  .tl-body { flex: 1; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px; }
  .tl-label { font-size: 15px; font-weight: 700; }
  .tl-sub { font-size: 12px; color: #374151; margin-top: 2px; }
  .tl-coords { font-size: 11px; color: #6B7280; margin-top: 1px; font-family: monospace; }
  .tl-note { font-size: 12px; color: #111827; margin-top: 4px; background: #F8FAFC; padding: 6px 8px; border-radius: 8px; }
  .thumbs { margin-top: 6px; }
  .thumb { width: 84px; height: 84px; object-fit: cover; border-radius: 8px; margin: 4px 4px 0 0; border: 1px solid #E5E7EB; }
  .incident { border: 1px solid #E5E7EB; border-left: 4px solid #9CA3AF; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
  .incident.sev-low { border-left-color: ${brand.success}; }
  .incident.sev-medium { border-left-color: ${brand.warning}; }
  .incident.sev-high { border-left-color: ${brand.danger}; }
  .incident-head { display: flex; justify-content: space-between; align-items: center; }
  .incident-title { font-size: 15px; font-weight: 700; }
  .incident-meta { font-size: 12px; color: #6B7280; margin-top: 2px; }
  .badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; }
  .badge-low { background: ${brand.success}; color: #fff; }
  .badge-medium { background: ${brand.warning}; color: #fff; }
  .badge-high { background: ${brand.danger}; color: #fff; }
  .gallery { display: flex; flex-wrap: wrap; gap: 8px; }
  .gal { width: 160px; height: 160px; object-fit: cover; border-radius: 10px; border: 1px solid #E5E7EB; }
  .muted { color: #6B7280; font-size: 13px; }
  .small { font-size: 11px; margin-top: 6px; }
  .footer { margin-top: 40px; border-top: 2px solid #E5E7EB; padding-top: 14px; font-size: 11px; color: #6B7280; text-align: center; }
  .footer b { color: ${brand.navy}; }
</style>
</head>
<body>
  <div class="header">
    <div class="brandrow">
      <div class="of-mark">
        <div class="ofr"><span class="sq blue"></span><span class="bar cyan"></span></div>
        <div class="ofr"><span class="bar cyan"></span><span class="sq blue"></span></div>
        <div class="ofr"><span class="sq blue"></span><span class="bar cyan"></span></div>
      </div>
      <div class="brand">Organized Freight</div>
    </div>
    <div class="app">LoadTimeline</div>
    <div class="tagline">If It Happened, Prove It.</div>
    <div class="doc-title">${esc(title)}</div>
    <div class="doc-sub">${tplLabel} · Generated ${esc(formatDateTime(Date.now()))}</div>
  </div>

  ${tripBandHtml ? `<div class="section" style="margin-top:0"><h2>Trip Summary</h2>${tripBandHtml}</div>` : ''}

  <div class="section"><h2>Load Details</h2><table>${detailsHtml || '<tr><td class="muted">No load details entered.</td></tr>'}</table></div>

  <div class="section"><h2>Detention Summary</h2>${detentionHtml}</div>

  <div class="section"><h2>Timeline</h2>${timelineHtml || '<div class="muted">No events recorded.</div>'}</div>

  <div class="section"><h2>Incident Log</h2>${incidentsHtml}</div>

  ${f.notes && load.driverNotes ? `<div class="section"><h2>Driver Notes</h2><div class="tl-note">${esc(load.driverNotes)}</div></div>` : ''}

  ${galleryHtml}

  <div class="footer">
    Generated by <b>LoadTimeline</b> — A Product by <b>Organized Freight</b><br/>
    OrganizedFreight.com · If It Happened, Prove It.
  </div>
</body>
</html>`;
}

export interface GenerateResult {
  uri: string;
}

/** Builds the PDF and returns its local file uri. */
export async function generateReport(
  loadId: string,
  opts: ReportOptions = {},
): Promise<GenerateResult> {
  const html = buildHtml(loadId, opts);
  if (!html) throw new Error('Load not found');
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return { uri };
}

/** Builds the PDF and opens the native share sheet (share/email/save/print). */
export async function shareReport(loadId: string, opts: ReportOptions = {}): Promise<void> {
  const { uri } = await generateReport(loadId, opts);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Load Report',
      UTI: 'com.adobe.pdf',
    });
  }
}

/** Sends the generated PDF directly to the OS print dialog. */
export async function printReport(loadId: string, opts: ReportOptions = {}): Promise<void> {
  const html = buildHtml(loadId, opts);
  if (!html) throw new Error('Load not found');
  await Print.printAsync({ html });
}
