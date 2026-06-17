/** Display metadata for event and incident enums (labels, icons, colors). */
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { EventType, IncidentType, Severity } from './index';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface EventMeta {
  type: EventType;
  label: string;
  icon: IoniconName;
}

/** Ordered as the load progresses; drives the action-button grid + timeline. */
export const EVENT_CATALOG: EventMeta[] = [
  { type: 'ARRIVED', label: 'Arrived', icon: 'location' },
  { type: 'CHECKED_IN', label: 'Checked In', icon: 'clipboard' },
  { type: 'AT_DOCK', label: 'At Dock', icon: 'enter' },
  { type: 'LOADED', label: 'Loaded', icon: 'cube' },
  { type: 'UNLOADED', label: 'Unloaded', icon: 'file-tray-full' },
  { type: 'DEPARTED', label: 'Departed', icon: 'exit' },
];

export const EVENT_META: Record<EventType, EventMeta> = Object.fromEntries(
  EVENT_CATALOG.map((e) => [e.type, e]),
) as Record<EventType, EventMeta>;

export interface IncidentMeta {
  type: IncidentType;
  label: string;
  icon: IoniconName;
}

export const INCIDENT_CATALOG: IncidentMeta[] = [
  { type: 'DAMAGED_FREIGHT', label: 'Damaged Freight', icon: 'warning' },
  { type: 'MISSING_FREIGHT', label: 'Missing Freight', icon: 'help-circle' },
  { type: 'SHORTAGE', label: 'Shortage', icon: 'remove-circle' },
  { type: 'OVERAGE', label: 'Overage', icon: 'add-circle' },
  { type: 'SEAL_ISSUE', label: 'Seal Issue', icon: 'lock-open' },
  { type: 'REJECTED_FREIGHT', label: 'Rejected Freight', icon: 'close-circle' },
  { type: 'LATE_PICKUP', label: 'Late Pickup', icon: 'time' },
  { type: 'LATE_DELIVERY', label: 'Late Delivery', icon: 'alarm' },
  { type: 'APPOINTMENT_DELAY', label: 'Appointment Delay', icon: 'calendar' },
  { type: 'LUMPER_FEE', label: 'Lumper Fee', icon: 'cash' },
  { type: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal-circle' },
];

export const INCIDENT_META: Record<IncidentType, IncidentMeta> = Object.fromEntries(
  INCIDENT_CATALOG.map((i) => [i.type, i]),
) as Record<IncidentType, IncidentMeta>;

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
