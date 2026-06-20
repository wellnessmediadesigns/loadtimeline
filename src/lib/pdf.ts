/**
 * Branded PDF report generation via expo-print (HTML -> PDF) + expo-sharing.
 * Produces professional documentation suitable for customers, dispatchers,
 * claims, detention requests, and broker paperwork.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { brand } from '@/theme/colors';
import { computeDetention, detentionLevel, DetentionLevel, onSiteLevel, StopDetention } from './detention';
import { detentionText, formatDate, formatDateTime, formatDuration, formatTime, shortCoords } from './format';
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
  parties: boolean;
  reference: boolean;
  trailer: boolean;
  status: boolean;
  notes: boolean;
}

export const DEFAULT_REPORT_FIELDS: ReportFields = {
  driver: true,
  broker: true,
  parties: true,
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
  const statusLabel = load.status === 'active' ? 'Active' : 'Completed';
  const routeFrom = load.shipper || load.pickupLocation;
  const routeTo = load.receiver || load.deliveryLocation;
  const routeHtml = routeFrom || routeTo
    ? `${esc(routeFrom ?? '—')} <span class="arw">&rarr;</span> ${esc(routeTo ?? '—')}`
    : '';

  // Load Number, Pickup and Delivery are always included; the rest are
  // optional so a driver can withhold who the customer/broker is.
  const detailRows: [string, string | null][] = [
    ['Load Number', load.loadNumber],
    ['Pickup', load.pickupLocation],
    ['Delivery', load.deliveryLocation],
    ...(f.driver ? ([['Driver', opts.driverName ?? null]] as [string, string | null][]) : []),
    ...(f.driver ? ([['Company', opts.company ?? null]] as [string, string | null][]) : []),
    ...(f.parties ? ([['Shipper', load.shipper]] as [string, string | null][]) : []),
    ...(f.parties ? ([['Receiver', load.receiver]] as [string, string | null][]) : []),
    ...(f.broker ? ([['Broker', load.brokerName]] as [string, string | null][]) : []),
    ...(f.reference ? ([['Reference #', load.referenceNumber]] as [string, string | null][]) : []),
    ...(f.trailer ? ([['Trailer #', load.trailerNumber]] as [string, string | null][]) : []),
    ...(f.status ? ([['Status', statusLabel]] as [string, string | null][]) : []),
  ];
  const detailsHtml = detailRows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<div class="dcell"><div class="dk">${esc(k)}</div><div class="dv">${esc(v)}</div></div>`,
    )
    .join('');

  const statCard = (label: string, value: string, level?: DetentionLevel) =>
    `<div class="stat${level ? ` lvl-${level}` : ''}"><div class="stat-v">${esc(value)}</div><div class="stat-l">${esc(label)}</div></div>`;

  const eventRow = (e: LoadEvent, isLast: boolean) => {
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
      <div class="tl-row${isLast ? ' tl-last' : ''}">
        <div class="tl-rail"><div class="tl-dot"></div></div>
        <div class="tl-main">
          <div class="tl-top">
            <div class="tl-label">${esc(meta?.label ?? e.type)}</div>
            <div class="tl-time">${esc(formatTime(e.timestamp))} <span class="tl-date">· ${esc(formatDate(e.timestamp))}</span></div>
          </div>
          ${e.address ? `<div class="tl-sub"><span class="pin">&#9679;</span>${esc(e.address)}</div>` : ''}
          ${coords ? `<div class="tl-coords">GPS ${esc(coords)}</div>` : ''}
          ${e.notes ? `<div class="tl-note">${esc(e.notes)}</div>` : ''}
          ${photoHtml ? `<div class="thumbs">${photoHtml}</div>` : ''}
        </div>
      </div>`;
  };

  // One consolidated card per stop: detention stats + that stop's timeline.
  const stopCardHtml = (s: 'pickup' | 'delivery') => {
    const stopEvents = events.filter((e) => e.stop === s);
    if (stopEvents.length === 0) return '';
    const meta = STOP_META[s];
    const sd = s === 'pickup' ? detention.pickup : detention.delivery;
    const loc = (s === 'pickup' ? load.pickupLocation : load.deliveryLocation) || stopEvents.find((e) => e.address)?.address || null;
    const span = sd.arrivedAt != null
      ? `${esc(formatDateTime(sd.arrivedAt))}${sd.departedAt != null ? ` &rarr; ${esc(formatTime(sd.departedAt))}` : sd.ongoing ? ' &rarr; on site now' : ''}`
      : '';
    return `<div class="stopcard">
      <div class="stopcard-head">
        <div class="sc-l"><span class="sc-name">${esc(meta.label)}</span>${loc ? `<span class="sc-loc">${esc(loc)}</span>` : ''}</div>
        ${span ? `<div class="sc-span">${span}</div>` : ''}
      </div>
      <div class="stopcard-stats">
        ${statCard('Time On Site', formatDuration(sd.onSiteMs), onSiteLevel(sd.onSiteMs))}
        ${statCard('Wait Time', formatDuration(sd.waitMs), onSiteLevel(sd.waitMs))}
        ${statCard(meta.serviceLabel, formatDuration(sd.serviceMs))}
        ${statCard('Potential Detention', detentionText(sd.potentialDetentionMs), detentionLevel(sd.potentialDetentionMs))}
      </div>
      <div class="stopcard-tl">${stopEvents.map((e, i) => eventRow(e, i === stopEvents.length - 1)).join('')}</div>
    </div>`;
  };

  const showPickupDet = includeStop('pickup') && detention.pickup.hasActivity;
  const showDeliveryDet = includeStop('delivery') && detention.delivery.hasActivity;
  const anyDetention = showPickupDet || showDeliveryDet;
  // Combined totals scoped to the included stops.
  const scopedDetentionMs =
    (showPickupDet ? detention.pickup.potentialDetentionMs : 0) +
    (showDeliveryDet ? detention.delivery.potentialDetentionMs : 0);

  const stopsHtml = STOP_ORDER.filter(includeStop).map(stopCardHtml).join('')
    || '<div class="muted">No events recorded for the selected stops.</div>';

  const detentionFootHtml = anyDetention
    ? `<div class="det-foot">
        ${showPickupDet && showDeliveryDet ? `<div class="combined">${scopedDetentionMs > 0 ? `Combined potential detention: <b class="det">${formatDuration(scopedDetentionMs)}</b>` : '<b class="ok">No detention incurred</b> across either stop.'}</div>` : ''}
        <div class="muted small">Free window: ${detention.pickup.freeMinutes / 60}h per stop. Potential detention is time on site beyond the free window.</div>
      </div>`
    : '';

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
          ${statCard('Combined On Site', formatDuration(tripOnSiteMs), onSiteLevel(tripOnSiteMs))}
          ${statCard('Potential Detention', detentionText(scopedDetentionMs), detentionLevel(scopedDetentionMs))}
        </div>
        <div class="trip-sub">Arrived ${esc(formatDateTime(tripStart))} ${tripOngoing ? '· on site now' : `&rarr; Departed ${esc(formatDateTime(tripEnd))}`}</div>
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
  @page { size: letter; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111827; font-size: 13px; }
  .content { padding: 22px 32px 40px; }

  /* Letterhead */
  .header { background: ${brand.navy}; color: #F8FAFC; padding: 26px 32px; display: flex; justify-content: space-between; align-items: flex-start; }
  .head-l { display: flex; flex-direction: column; }
  .brandrow { display: flex; align-items: center; gap: 9px; }
  .of-mark { display: flex; flex-direction: column; gap: 3px; }
  .of-mark .ofr { display: flex; gap: 3px; }
  .of-mark .sq { width: 9px; height: 9px; border-radius: 2px; }
  .of-mark .bar { width: 21px; height: 9px; border-radius: 2px; }
  .of-mark .blue { background: #4773D6; }
  .of-mark .cyan { background: #5BC8E8; }
  .brand { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #94A3B8; font-weight: 700; }
  .app { font-size: 25px; font-weight: 800; margin: 10px 0 1px; letter-spacing: -0.3px; }
  .tagline { font-size: 12px; color: #60A5FA; font-weight: 600; }
  .head-r { text-align: right; max-width: 48%; }
  .doc-kicker { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94A3B8; font-weight: 700; }
  .doc-title { font-size: 22px; font-weight: 800; margin: 2px 0 8px; letter-spacing: -0.3px; }
  .hstatus { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; }
  .hstatus.active { background: ${accent}; color: #fff; }
  .hstatus.completed { background: ${brand.success}; color: #fff; }
  .hroute { font-size: 13px; font-weight: 700; color: #E2E8F0; margin-top: 9px; }
  .hroute .arw { color: #60A5FA; padding: 0 2px; }
  .hgen { font-size: 10px; color: #94A3B8; margin-top: 6px; }

  /* Sections */
  .section { margin-top: 22px; page-break-inside: avoid; }
  .section.tight { margin-top: 16px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; color: ${brand.navy}; margin: 0 0 11px; display: flex; align-items: center; gap: 8px; }
  h2:before { content: ''; width: 3px; height: 14px; background: ${accent}; border-radius: 2px; display: inline-block; }

  /* Detail grid */
  .dgrid { display: flex; flex-wrap: wrap; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; }
  .dcell { width: 33.33%; padding: 11px 14px; border-bottom: 1px solid #EEF1F5; border-right: 1px solid #EEF1F5; }
  .dk { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.6px; color: #94A3B8; font-weight: 700; }
  .dv { font-size: 13.5px; font-weight: 700; color: #111827; margin-top: 3px; }

  /* Stat cards */
  .stats { display: flex; flex-wrap: wrap; gap: 9px; }
  .stat { border: 1px solid #E5E7EB; border-top: 3px solid #CBD5E1; border-radius: 10px; padding: 10px 12px; min-width: 110px; flex: 1; background: #fff; }
  .stat-v { font-size: 19px; font-weight: 800; letter-spacing: -0.3px; }
  .stat-l { font-size: 9.5px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; font-weight: 700; }
  .stat.lvl-normal { border-top-color: ${brand.success}; }
  .stat.lvl-normal .stat-v { color: ${brand.success}; }
  .stat.lvl-watch { border-top-color: ${brand.warning}; }
  .stat.lvl-watch .stat-v { color: ${brand.warning}; }
  .stat.lvl-significant { border-top-color: ${brand.danger}; }
  .stat.lvl-significant .stat-v { color: ${brand.danger}; }

  /* Trip band */
  .tripband { background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 14px; padding: 14px; }
  .tripband .stat { background: #fff; }
  .trip-sub { font-size: 11.5px; color: #475569; margin-top: 11px; font-weight: 600; text-align: center; }

  /* Stop cards (detention + timeline consolidated) */
  .stopcard { border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 16px; page-break-inside: avoid; }
  .stopcard-head { background: ${brand.navy}; border-left: 4px solid ${accent}; color: #fff; padding: 10px 14px; display: flex; justify-content: space-between; align-items: baseline; }
  .sc-name { font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  .sc-loc { font-size: 12px; color: #CBD5E1; font-weight: 600; margin-left: 8px; }
  .sc-span { font-size: 10.5px; color: #94A3B8; font-weight: 600; }
  .stopcard-stats { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 14px; border-bottom: 1px solid #EEF1F5; background: #FBFCFE; }
  .stopcard-tl { padding: 6px 14px 4px; }

  /* Timeline rail */
  .tl-row { display: flex; gap: 12px; }
  .tl-rail { position: relative; width: 12px; flex: none; }
  .tl-rail:before { content: ''; position: absolute; left: 5px; top: 0; bottom: 0; width: 2px; background: #E5E7EB; }
  .tl-row.tl-last .tl-rail:before { bottom: auto; height: 16px; }
  .tl-dot { position: absolute; left: 0; top: 14px; width: 12px; height: 12px; border-radius: 6px; background: ${accent}; border: 2px solid #fff; box-shadow: 0 0 0 1px ${accent}; }
  .tl-main { flex: 1; padding: 11px 0; border-bottom: 1px solid #F1F5F9; }
  .tl-row.tl-last .tl-main { border-bottom: 0; }
  .tl-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .tl-label { font-size: 14px; font-weight: 800; color: #0F172A; }
  .tl-time { font-size: 12px; font-weight: 700; color: #111827; white-space: nowrap; }
  .tl-date { color: #94A3B8; font-weight: 500; }
  .tl-sub { font-size: 11.5px; color: #374151; margin-top: 3px; }
  .tl-sub .pin { color: ${accent}; font-size: 8px; vertical-align: middle; margin-right: 5px; }
  .tl-coords { font-size: 10px; color: #94A3B8; margin-top: 2px; font-family: 'SFMono-Regular', Menlo, monospace; letter-spacing: 0.2px; }
  .tl-note { font-size: 11.5px; color: #111827; margin-top: 6px; background: #F8FAFC; border-left: 2px solid ${accent}; padding: 6px 9px; border-radius: 6px; }
  .thumbs { margin-top: 6px; }
  .thumb { width: 84px; height: 84px; object-fit: cover; border-radius: 8px; margin: 4px 4px 0 0; border: 1px solid #E5E7EB; }

  /* Detention footer */
  .det-foot { margin-top: 2px; }
  .combined { font-size: 13px; color: #111827; margin-bottom: 4px; }
  .combined .det { color: ${brand.danger}; }
  .combined .ok { color: ${brand.success}; }

  /* Incidents */
  .incident { border: 1px solid #E5E7EB; border-left: 4px solid #9CA3AF; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; page-break-inside: avoid; }
  .incident.sev-low { border-left-color: ${brand.success}; }
  .incident.sev-medium { border-left-color: ${brand.warning}; }
  .incident.sev-high { border-left-color: ${brand.danger}; }
  .incident-head { display: flex; justify-content: space-between; align-items: center; }
  .incident-title { font-size: 14px; font-weight: 800; }
  .incident-meta { font-size: 11.5px; color: #6B7280; margin-top: 2px; }
  .badge { font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.4px; }
  .badge-low { background: ${brand.success}; color: #fff; }
  .badge-medium { background: ${brand.warning}; color: #fff; }
  .badge-high { background: ${brand.danger}; color: #fff; }

  /* Gallery */
  .gallery { display: flex; flex-wrap: wrap; gap: 8px; }
  .gal { width: 160px; height: 160px; object-fit: cover; border-radius: 10px; border: 1px solid #E5E7EB; }

  .muted { color: #6B7280; font-size: 12.5px; }
  .small { font-size: 10.5px; margin-top: 5px; }
  .footer { margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 14px; font-size: 10.5px; color: #94A3B8; text-align: center; }
  .footer b { color: ${brand.navy}; }
</style>
</head>
<body>
  <div class="header">
    <div class="head-l">
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
    </div>
    <div class="head-r">
      <div class="doc-kicker">Load Documentation</div>
      <div class="doc-title">${esc(title)}</div>
      ${f.status ? `<span class="hstatus ${load.status === 'active' ? 'active' : 'completed'}">${esc(statusLabel)}</span>` : ''}
      ${routeHtml ? `<div class="hroute">${routeHtml}</div>` : ''}
      <div class="hgen">${esc(tplLabel)} · ${esc(formatDateTime(Date.now()))}</div>
    </div>
  </div>

  <div class="content">
    ${tripBandHtml ? `<div class="section tight"><h2>Trip Summary</h2>${tripBandHtml}</div>` : ''}

    <div class="section"><h2>Load Details</h2><div class="dgrid">${detailsHtml || '<div class="dcell"><div class="muted">No load details entered.</div></div>'}</div></div>

    <div class="section"><h2>Stops &amp; Detention</h2>${stopsHtml}${detentionFootHtml}</div>

    <div class="section"><h2>Incident Log</h2>${incidentsHtml}</div>

    ${f.notes && load.driverNotes ? `<div class="section"><h2>Driver Notes</h2><div class="tl-note">${esc(load.driverNotes)}</div></div>` : ''}

    ${galleryHtml}

    <div class="footer">
      Generated by <b>LoadTimeline</b> — A Product by <b>Organized Freight</b><br/>
      OrganizedFreight.com · If It Happened, Prove It.
    </div>
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
