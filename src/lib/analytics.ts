/** Aggregate analytics across all loads, derived from the SQLite data. */
import dayjs from 'dayjs';
import { listLoads } from '@/db/queries/loads';
import { listEvents } from '@/db/queries/events';
import { countIncidents, countIncidentsByType } from '@/db/queries/incidents';
import { computeDetention } from './detention';
import { INCIDENT_META } from '@/types/catalog';

export interface AnalyticsSummary {
  loadsLogged: number;
  activeLoads: number;
  completedLoads: number;
  hoursDetainedMs: number;
  incidentsRecorded: number;
  reportsGenerated: number;
  avgFacilityTimeMs: number | null;
  mostCommonDelay: string | null;
  totalHoursLoggedMs: number;
}

export function computeAnalytics(reportsGenerated: number): AnalyticsSummary {
  const loads = listLoads();
  let detainedMs = 0;
  let facilitySum = 0;
  let facilityCount = 0;
  let hoursLogged = 0;

  for (const load of loads) {
    const events = listEvents(load.id);
    if (events.length === 0) continue;
    const d = computeDetention(events);
    detainedMs += d.totalPotentialDetentionMs;
    if (d.totalOnSiteMs != null) {
      hoursLogged += d.totalOnSiteMs;
      if (!d.ongoing) {
        facilitySum += d.totalOnSiteMs;
        facilityCount += 1;
      }
    }
  }

  const byType = countIncidentsByType();
  const mostCommonDelay = byType.length ? INCIDENT_META[byType[0].type]?.label ?? null : null;

  return {
    loadsLogged: loads.length,
    activeLoads: loads.filter((l) => l.status === 'active').length,
    completedLoads: loads.filter((l) => l.status === 'completed').length,
    hoursDetainedMs: detainedMs,
    incidentsRecorded: countIncidents(),
    reportsGenerated,
    avgFacilityTimeMs: facilityCount > 0 ? facilitySum / facilityCount : null,
    mostCommonDelay,
    totalHoursLoggedMs: hoursLogged,
  };
}

// ---------------------------------------------------------------------------
// Advanced (Pro) visual analytics
// ---------------------------------------------------------------------------

export interface WeekPoint {
  label: string;
  weekStart: number;
  loads: number;
  detentionMs: number;
}

export interface AdvancedAnalytics {
  weekly: WeekPoint[];
  pickupAvgMs: number | null;
  deliveryAvgMs: number | null;
  cleanLoads: number; // completed with no detention at either stop
  detainedLoads: number; // had potential detention at a stop
}

/** Single pass over all loads producing the chartable advanced metrics. */
export function computeAdvancedAnalytics(weeks = 8): AdvancedAnalytics {
  const loads = listLoads();

  const startOfThisWeek = dayjs().startOf('week');
  const weekly: WeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = startOfThisWeek.subtract(i, 'week');
    weekly.push({ label: ws.format('M/D'), weekStart: ws.valueOf(), loads: 0, detentionMs: 0 });
  }

  let pickupSum = 0;
  let pickupCount = 0;
  let deliverySum = 0;
  let deliveryCount = 0;
  let cleanLoads = 0;
  let detainedLoads = 0;

  for (const load of loads) {
    const events = listEvents(load.id);
    if (events.length === 0) continue;
    const d = computeDetention(events);

    const weekStart = dayjs(load.createdAt).startOf('week').valueOf();
    const bucket = weekly.find((w) => w.weekStart === weekStart);
    if (bucket) {
      bucket.loads += 1;
      bucket.detentionMs += d.totalPotentialDetentionMs;
    }

    if (d.pickup.onSiteMs != null && !d.pickup.ongoing) {
      pickupSum += d.pickup.onSiteMs;
      pickupCount += 1;
    }
    if (d.delivery.onSiteMs != null && !d.delivery.ongoing) {
      deliverySum += d.delivery.onSiteMs;
      deliveryCount += 1;
    }

    // On-time vs detained, only for loads that have finished a stop.
    const finished = !d.ongoing && d.totalOnSiteMs != null;
    if (finished) {
      if (d.totalPotentialDetentionMs > 0) detainedLoads += 1;
      else cleanLoads += 1;
    }
  }

  return {
    weekly,
    pickupAvgMs: pickupCount > 0 ? pickupSum / pickupCount : null,
    deliveryAvgMs: deliveryCount > 0 ? deliverySum / deliveryCount : null,
    cleanLoads,
    detainedLoads,
  };
}
