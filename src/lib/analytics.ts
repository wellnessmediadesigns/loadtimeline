/** Aggregate analytics across all loads, derived from the SQLite data. */
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
