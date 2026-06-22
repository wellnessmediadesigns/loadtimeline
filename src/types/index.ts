/** Core domain types for LoadTimeline. */

export type LoadStatus = 'active' | 'completed';

/** A load has two stops: the shipper (pickup) and the receiver (delivery). */
export type StopType = 'pickup' | 'delivery';

export type EventType =
  | 'ARRIVED'
  | 'CHECKED_IN'
  | 'AT_DOCK'
  | 'LOADED'
  | 'UNLOADED'
  | 'DEPARTED';

export type IncidentType =
  | 'DAMAGED_FREIGHT'
  | 'MISSING_FREIGHT'
  | 'SHORTAGE'
  | 'OVERAGE'
  | 'SEAL_ISSUE'
  | 'REJECTED_FREIGHT'
  | 'LATE_PICKUP'
  | 'LATE_DELIVERY'
  | 'APPOINTMENT_DELAY'
  | 'LUMPER_FEE'
  | 'OTHER';

export type Severity = 'low' | 'medium' | 'high';

export type PhotoParent = 'event' | 'incident';

export interface Load {
  id: string;
  loadNumber: string | null;
  brokerName: string | null;
  shipper: string | null;
  receiver: string | null;
  pickupLocation: string | null;
  deliveryLocation: string | null;
  referenceNumber: string | null;
  trailerNumber: string | null;
  driverNotes: string | null;
  driverName: string | null;
  company: string | null;
  status: LoadStatus;
  createdAt: number;
  updatedAt: number;
}

export interface LoadEvent {
  id: string;
  loadId: string;
  stop: StopType;
  type: EventType;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  createdAt: number;
}

export interface Incident {
  id: string;
  loadId: string;
  type: IncidentType;
  title: string;
  notes: string | null;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  severity: Severity;
  createdAt: number;
}

export interface Photo {
  id: string;
  parentType: PhotoParent;
  parentId: string;
  uri: string;
  thumbUri: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface Report {
  id: string;
  loadId: string | null;
  loadNumber: string | null;
  title: string;
  scope: string | null;
  fileUri: string;
  createdAt: number;
}

/** A coordinate + reverse-geocoded address captured for an event/incident. */
export interface GeoStamp {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}
