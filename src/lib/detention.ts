/**
 * Detention / facility-time analytics derived purely from timeline events.
 *
 * Definitions:
 *  - Time On Site:   ARRIVED -> DEPARTED (or now, if still on site)
 *  - Wait Time:      ARRIVED -> AT_DOCK (time before getting to a door)
 *  - Loading Time:   AT_DOCK -> LOADED
 *  - Unloading Time: AT_DOCK -> UNLOADED
 *  - Potential Detention: time on site beyond the free window (default 2h)
 */
import type { EventType, LoadEvent } from '@/types';

export const DEFAULT_FREE_MINUTES = 120;

export type DetentionLevel = 'normal' | 'watch' | 'significant';

export interface DetentionSummary {
  arrivedAt: number | null;
  departedAt: number | null;
  ongoing: boolean;
  onSiteMs: number | null;
  waitMs: number | null;
  loadingMs: number | null;
  unloadingMs: number | null;
  freeMinutes: number;
  potentialDetentionMs: number;
}

function firstOf(events: LoadEvent[], type: EventType): LoadEvent | undefined {
  return events.find((e) => e.type === type);
}

export function computeDetention(
  events: LoadEvent[],
  freeMinutes: number = DEFAULT_FREE_MINUTES,
): DetentionSummary {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const arrived = firstOf(sorted, 'ARRIVED');
  const atDock = firstOf(sorted, 'AT_DOCK');
  const loaded = firstOf(sorted, 'LOADED');
  const unloaded = firstOf(sorted, 'UNLOADED');
  const departed = firstOf(sorted, 'DEPARTED');

  const arrivedAt = arrived?.timestamp ?? null;
  const departedAt = departed?.timestamp ?? null;
  const ongoing = arrivedAt != null && departedAt == null;

  let onSiteMs: number | null = null;
  if (arrivedAt != null) {
    const end = departedAt ?? Date.now();
    onSiteMs = Math.max(0, end - arrivedAt);
  }

  const waitMs =
    arrivedAt != null && atDock ? Math.max(0, atDock.timestamp - arrivedAt) : null;

  const dockTs = atDock?.timestamp ?? null;
  const loadingMs =
    dockTs != null && loaded ? Math.max(0, loaded.timestamp - dockTs) : null;
  const unloadingMs =
    dockTs != null && unloaded ? Math.max(0, unloaded.timestamp - dockTs) : null;

  const freeMs = freeMinutes * 60000;
  const potentialDetentionMs = onSiteMs != null ? Math.max(0, onSiteMs - freeMs) : 0;

  return {
    arrivedAt,
    departedAt,
    ongoing,
    onSiteMs,
    waitMs,
    loadingMs,
    unloadingMs,
    freeMinutes,
    potentialDetentionMs,
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
