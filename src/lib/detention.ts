/**
 * Detention / facility-time analytics derived purely from timeline events.
 * Each stop (pickup at the shipper, delivery at the receiver) is its own
 * cycle, because detention can occur independently at either end.
 *
 * Per stop:
 *  - Time On Site:        ARRIVED -> DEPARTED (or now, if still on site)
 *  - Wait Time:           ARRIVED -> AT_DOCK (time before getting to a door)
 *  - Service Time:        AT_DOCK -> LOADED (pickup) or UNLOADED (delivery)
 *  - Potential Detention: time on site beyond the free window (default 2h)
 */
import type { EventType, LoadEvent, StopType } from '@/types';

export const DEFAULT_FREE_MINUTES = 120;

export type DetentionLevel = 'normal' | 'watch' | 'significant';

export interface StopDetention {
  stop: StopType;
  arrivedAt: number | null;
  departedAt: number | null;
  ongoing: boolean;
  hasActivity: boolean;
  onSiteMs: number | null;
  waitMs: number | null;
  serviceMs: number | null;
  freeMinutes: number;
  potentialDetentionMs: number;
}

export interface LoadDetention {
  pickup: StopDetention;
  delivery: StopDetention;
  totalOnSiteMs: number | null;
  totalPotentialDetentionMs: number;
  ongoing: boolean;
}

function firstOf(events: LoadEvent[], type: EventType): LoadEvent | undefined {
  return events.find((e) => e.type === type);
}

export function computeStopDetention(
  allEvents: LoadEvent[],
  stop: StopType,
  freeMinutes: number = DEFAULT_FREE_MINUTES,
): StopDetention {
  const events = allEvents
    .filter((e) => e.stop === stop)
    .sort((a, b) => a.timestamp - b.timestamp);

  const arrived = firstOf(events, 'ARRIVED');
  const atDock = firstOf(events, 'AT_DOCK');
  const serviced = firstOf(events, stop === 'pickup' ? 'LOADED' : 'UNLOADED');
  const departed = firstOf(events, 'DEPARTED');

  const arrivedAt = arrived?.timestamp ?? null;
  const departedAt = departed?.timestamp ?? null;
  const ongoing = arrivedAt != null && departedAt == null;

  let onSiteMs: number | null = null;
  if (arrivedAt != null) {
    const end = departedAt ?? Date.now();
    onSiteMs = Math.max(0, end - arrivedAt);
  }

  const waitMs = arrivedAt != null && atDock ? Math.max(0, atDock.timestamp - arrivedAt) : null;
  const dockTs = atDock?.timestamp ?? null;
  const serviceMs = dockTs != null && serviced ? Math.max(0, serviced.timestamp - dockTs) : null;

  const freeMs = freeMinutes * 60000;
  const potentialDetentionMs = onSiteMs != null ? Math.max(0, onSiteMs - freeMs) : 0;

  return {
    stop,
    arrivedAt,
    departedAt,
    ongoing,
    hasActivity: events.length > 0,
    onSiteMs,
    waitMs,
    serviceMs,
    freeMinutes,
    potentialDetentionMs,
  };
}

export function computeDetention(
  events: LoadEvent[],
  freeMinutes: number = DEFAULT_FREE_MINUTES,
): LoadDetention {
  const pickup = computeStopDetention(events, 'pickup', freeMinutes);
  const delivery = computeStopDetention(events, 'delivery', freeMinutes);

  const sites = [pickup.onSiteMs, delivery.onSiteMs].filter((v): v is number => v != null);
  const totalOnSiteMs = sites.length ? sites.reduce((a, b) => a + b, 0) : null;
  const totalPotentialDetentionMs = pickup.potentialDetentionMs + delivery.potentialDetentionMs;

  return {
    pickup,
    delivery,
    totalOnSiteMs,
    totalPotentialDetentionMs,
    ongoing: pickup.ongoing || delivery.ongoing,
  };
}

/** Color level for a duration against watch/significant thresholds (minutes). */
export function levelForMinutes(
  minutes: number | null,
  watch: number,
  significant: number,
): DetentionLevel {
  if (minutes == null) return 'normal';
  if (minutes >= significant) return 'significant';
  if (minutes >= watch) return 'watch';
  return 'normal';
}

export function onSiteLevel(ms: number | null): DetentionLevel {
  if (ms == null) return 'normal';
  return levelForMinutes(ms / 60000, 120, 180);
}

export function detentionLevel(ms: number): DetentionLevel {
  if (ms <= 0) return 'normal';
  return levelForMinutes(ms / 60000, 1, 60);
}
