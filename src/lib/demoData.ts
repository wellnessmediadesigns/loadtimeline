/**
 * Demo data seeder. Populates the (separate) demo database with a realistic,
 * varied set of loads so a prospect can explore every feature — clean trips,
 * detention situations, and loads with incidents — all from one fake driver.
 *
 * Uses raw inserts inside a transaction because the normal query helpers stamp
 * `Date.now()`; the demo needs backdated events to craft realistic durations.
 */
import { getDb, newId } from '../db/client';
import type { EventType, IncidentType, Severity, StopType } from '@/types';

export const DEMO_DRIVER = 'Marcus Hale';
export const DEMO_COMPANY = 'Summit Line Logistics';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

interface Place {
  city: string;
  lat: number;
  lng: number;
  addr: string;
}

const PLACES: Place[] = [
  { city: 'Dallas, TX', lat: 32.7767, lng: -96.797, addr: '2400 Industrial Blvd, Dallas, TX' },
  { city: 'Atlanta, GA', lat: 33.749, lng: -84.388, addr: '1100 Fulton Industrial Blvd, Atlanta, GA' },
  { city: 'Memphis, TN', lat: 35.1495, lng: -90.049, addr: '3820 Distribution Dr, Memphis, TN' },
  { city: 'Chicago, IL', lat: 41.8781, lng: -87.6298, addr: '5600 W 73rd St, Bedford Park, IL' },
  { city: 'Kansas City, MO', lat: 39.0997, lng: -94.5786, addr: '1701 N Topping Ave, Kansas City, MO' },
  { city: 'Phoenix, AZ', lat: 33.4484, lng: -112.074, addr: '4400 S 40th St, Phoenix, AZ' },
  { city: 'Denver, CO', lat: 39.7392, lng: -104.9903, addr: '5500 Havana St, Denver, CO' },
  { city: 'Columbus, OH', lat: 39.9612, lng: -82.9988, addr: '2550 Rohr Rd, Groveport, OH' },
  { city: 'Charlotte, NC', lat: 35.2271, lng: -80.8431, addr: '3500 Performance Rd, Charlotte, NC' },
  { city: 'Nashville, TN', lat: 36.1627, lng: -86.7816, addr: '1200 Antioch Pike, Nashville, TN' },
  { city: 'Indianapolis, IN', lat: 39.7684, lng: -86.1581, addr: '6300 Southeastern Ave, Indianapolis, IN' },
  { city: 'Houston, TX', lat: 29.7604, lng: -95.3698, addr: '8800 Market St, Houston, TX' },
  { city: 'Louisville, KY', lat: 38.2527, lng: -85.7585, addr: '4000 Bishop Ln, Louisville, KY' },
  { city: 'St. Louis, MO', lat: 38.627, lng: -90.1994, addr: '3300 Hall St, St. Louis, MO' },
];

const SHIPPERS = [
  'Riverside Foods Co.', 'Cardinal Manufacturing', 'Pinnacle Beverage', 'Ironwood Building Supply',
  'Crown Paper Products', 'Vertex Electronics', 'Harvest Grocers DC', 'Blue Ridge Plastics',
  'Apex Auto Parts', 'Golden Plains Mills', 'Summit Outdoor Goods', 'Delta Chemical',
];
const RECEIVERS = [
  'Walmart DC #6094', 'Target RDC', 'Kroger Distribution', 'Home Depot RDC',
  'Costco Depot', 'Amazon FC IND2', 'Lowe’s RDC', 'Publix Warehouse',
  'Albertsons DC', 'Dollar General DC', 'Tractor Supply DC', 'US Foods',
];
const BROKERS = ['TQL', 'CH Robinson', 'Echo Global', 'Coyote Logistics', 'RXO', 'Arrive Logistics'];

type IncidentSpec = { type: IncidentType; title: string; severity: Severity; notes: string; stop: StopType };

interface StopPlan {
  /** minutes from arrival to AT_DOCK (wait at the gate). */
  waitMin: number;
  /** minutes from AT_DOCK to service (loading/unloading). */
  serviceMin: number;
  /** minutes from service to DEPARTED. */
  departMin: number;
}

interface LoadSpec {
  daysAgo: number;
  pickup: number; // index into PLACES
  delivery: number;
  pickupPlan: StopPlan;
  /** delivery plan, or null when the load is still in progress at delivery. */
  deliveryPlan: StopPlan | null;
  /** hours in transit between pickup departure and delivery arrival. */
  transitH: number;
  /** when set, the load is active and only this stop's opening events exist. */
  ongoing?: 'pickup' | 'delivery';
  incidents?: IncidentSpec[];
}

const CLEAN: StopPlan = { waitMin: 20, serviceMin: 35, departMin: 10 }; // ~65m on site
const BUSY: StopPlan = { waitMin: 45, serviceMin: 70, departMin: 15 }; // ~130m, just over free
const DETAINED: StopPlan = { waitMin: 90, serviceMin: 180, departMin: 40 }; // ~5h10m on site

// 19 loads: ~8 clean, ~5 detained, ~4 with incidents, 2 active.
const SPECS: LoadSpec[] = [
  // clean & completed
  { daysAgo: 58, pickup: 0, delivery: 1, pickupPlan: CLEAN, deliveryPlan: CLEAN, transitH: 12 },
  { daysAgo: 54, pickup: 3, delivery: 7, pickupPlan: CLEAN, deliveryPlan: CLEAN, transitH: 6 },
  { daysAgo: 49, pickup: 4, delivery: 10, pickupPlan: CLEAN, deliveryPlan: CLEAN, transitH: 8 },
  { daysAgo: 45, pickup: 2, delivery: 9, pickupPlan: CLEAN, deliveryPlan: BUSY, transitH: 5 },
  { daysAgo: 40, pickup: 11, delivery: 0, pickupPlan: CLEAN, deliveryPlan: CLEAN, transitH: 4 },
  { daysAgo: 33, pickup: 8, delivery: 1, pickupPlan: CLEAN, deliveryPlan: CLEAN, transitH: 5 },
  { daysAgo: 21, pickup: 6, delivery: 5, pickupPlan: CLEAN, deliveryPlan: CLEAN, transitH: 14 },
  { daysAgo: 9, pickup: 13, delivery: 3, pickupPlan: CLEAN, deliveryPlan: CLEAN, transitH: 5 },
  // detention
  { daysAgo: 52, pickup: 5, delivery: 6, pickupPlan: DETAINED, deliveryPlan: CLEAN, transitH: 13 },
  { daysAgo: 37, pickup: 1, delivery: 8, pickupPlan: CLEAN, deliveryPlan: DETAINED, transitH: 4 },
  { daysAgo: 28, pickup: 7, delivery: 4, pickupPlan: DETAINED, deliveryPlan: DETAINED, transitH: 7 },
  { daysAgo: 16, pickup: 9, delivery: 2, pickupPlan: BUSY, deliveryPlan: DETAINED, transitH: 5 },
  { daysAgo: 6, pickup: 10, delivery: 11, pickupPlan: CLEAN, deliveryPlan: DETAINED, transitH: 16 },
  // incidents (some also detained)
  {
    daysAgo: 47, pickup: 12, delivery: 5, pickupPlan: CLEAN, deliveryPlan: BUSY, transitH: 10,
    incidents: [{ type: 'DAMAGED_FREIGHT', title: 'Crushed top cases', severity: 'high', notes: 'Two pallets crushed in transit — photographed at the dock before unloading.', stop: 'delivery' }],
  },
  {
    daysAgo: 31, pickup: 0, delivery: 6, pickupPlan: DETAINED, deliveryPlan: CLEAN, transitH: 12,
    incidents: [{ type: 'APPOINTMENT_DELAY', title: 'Held 5h at shipper', severity: 'medium', notes: 'Dock backed up; no door until well past the free window.', stop: 'pickup' }],
  },
  {
    daysAgo: 24, pickup: 4, delivery: 9, pickupPlan: CLEAN, deliveryPlan: BUSY, transitH: 6,
    incidents: [{ type: 'SHORTAGE', title: 'Short 3 cartons', severity: 'medium', notes: 'Receiver count came up 3 short vs BOL; noted on paperwork.', stop: 'delivery' }],
  },
  {
    daysAgo: 12, pickup: 2, delivery: 8, pickupPlan: CLEAN, deliveryPlan: DETAINED, transitH: 5,
    incidents: [
      { type: 'LUMPER_FEE', title: 'Lumper $185', severity: 'low', notes: 'Forced lumper; receipt retained for reimbursement.', stop: 'delivery' },
      { type: 'LATE_DELIVERY', title: 'Missed appt window', severity: 'medium', notes: 'Arrived 40m late due to dock congestion upstream.', stop: 'delivery' },
    ],
  },
  // active / in-progress
  { daysAgo: 0, pickup: 3, delivery: 7, pickupPlan: CLEAN, deliveryPlan: null, transitH: 4, ongoing: 'delivery' },
  { daysAgo: 0, pickup: 11, delivery: 0, pickupPlan: CLEAN, deliveryPlan: null, transitH: 0, ongoing: 'pickup' },
];

const PICKUP_SEQ: EventType[] = ['ARRIVED', 'CHECKED_IN', 'AT_DOCK', 'LOADED', 'DEPARTED'];
const DELIVERY_SEQ: EventType[] = ['ARRIVED', 'CHECKED_IN', 'AT_DOCK', 'UNLOADED', 'DEPARTED'];

/** Seeds the demo DB if it has no loads yet. */
export function seedDemoData(): void {
  const db = getDb();
  const existing = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM loads');
  if ((existing?.c ?? 0) > 0) return;
  generate(db);
}

/** Wipes and regenerates the demo data (used by "Reset sample data"). */
export function resetDemoData(): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM loads');
    db.runSync('DELETE FROM events');
    db.runSync('DELETE FROM incidents');
    db.runSync('DELETE FROM photos');
  });
  generate(db);
}

function generate(db: ReturnType<typeof getDb>): void {
  const now = Date.now();

  db.withTransactionSync(() => {
    SPECS.forEach((spec, i) => {
      const loadId = newId();
      const pickupPlace = PLACES[spec.pickup];
      const deliveryPlace = PLACES[spec.delivery];

      // Pickup arrival anchored at ~08:00 on the start day.
      const pickupArrive = now - spec.daysAgo * DAY - 16 * HOUR;

      const events: { stop: StopType; type: EventType; ts: number; place: Place }[] = [];
      const incidents: { spec: IncidentSpec; ts: number; place: Place }[] = [];

      const addStop = (
        stop: StopType,
        seq: EventType[],
        arrive: number,
        plan: StopPlan,
        place: Place,
        partialUpTo?: EventType,
      ) => {
        const dock = arrive + plan.waitMin * MIN;
        const service = dock + plan.serviceMin * MIN;
        const depart = service + plan.departMin * MIN;
        const tsByType: Record<string, number> = {
          ARRIVED: arrive,
          CHECKED_IN: arrive + 8 * MIN,
          AT_DOCK: dock,
          LOADED: service,
          UNLOADED: service,
          DEPARTED: depart,
        };
        for (const type of seq) {
          if (partialUpTo && seq.indexOf(type) > seq.indexOf(partialUpTo)) break;
          events.push({ stop, type, ts: tsByType[type], place });
        }
        return depart;
      };

      let lastTs = pickupArrive;
      let status: 'active' | 'completed' = 'completed';

      if (spec.ongoing === 'pickup') {
        // Still loading at the shipper right now.
        const arrive = now - 3 * HOUR;
        addStop('pickup', PICKUP_SEQ, arrive, spec.pickupPlan, pickupPlace, 'AT_DOCK');
        lastTs = arrive + spec.pickupPlan.waitMin * MIN;
        status = 'active';
      } else {
        const pickupDepart = addStop('pickup', PICKUP_SEQ, pickupArrive, spec.pickupPlan, pickupPlace);
        lastTs = pickupDepart;

        if (spec.ongoing === 'delivery') {
          // On site at the receiver right now.
          const arrive = now - 95 * MIN;
          addStop('delivery', DELIVERY_SEQ, arrive, spec.deliveryPlan ?? CLEAN, deliveryPlace, 'AT_DOCK');
          lastTs = arrive + (spec.deliveryPlan ?? CLEAN).waitMin * MIN;
          status = 'active';
        } else if (spec.deliveryPlan) {
          const deliveryArrive = pickupDepart + spec.transitH * HOUR;
          const deliveryDepart = addStop('delivery', DELIVERY_SEQ, deliveryArrive, spec.deliveryPlan, deliveryPlace);
          lastTs = deliveryDepart;
        }
      }

      for (const inc of spec.incidents ?? []) {
        const place = inc.stop === 'pickup' ? pickupPlace : deliveryPlace;
        const base = events.filter((e) => e.stop === inc.stop).map((e) => e.ts);
        const ts = base.length ? base[base.length - 1] : lastTs;
        incidents.push({ spec: inc, ts, place });
      }

      insertLoad(db, {
        id: loadId,
        loadNumber: `SL-${4200 + i}`,
        broker: BROKERS[i % BROKERS.length],
        shipper: SHIPPERS[i % SHIPPERS.length],
        receiver: RECEIVERS[i % RECEIVERS.length],
        pickup: pickupPlace.city,
        delivery: deliveryPlace.city,
        reference: `PO${90000 + i * 7}`,
        trailer: `${53000 + i}`,
        notes: i % 4 === 0 ? 'Driver-load. Appointment required at delivery.' : null,
        status,
        createdAt: events.length ? events[0].ts : pickupArrive,
        updatedAt: lastTs,
      });

      for (const e of events) insertEvent(db, loadId, e.stop, e.type, e.ts, e.place);
      for (const inc of incidents) insertIncident(db, loadId, inc.spec, inc.ts, inc.place);
    });
  });

  seedPayments(db);
}

/** Adds varied detention-payment records (paid / partial / refused / pending). */
function seedPayments(db: ReturnType<typeof getDb>): void {
  const RATE = 50;
  const loads = db.getAllSync<{ id: string }>(`SELECT id FROM loads ORDER BY created_at DESC`);
  let i = 0;
  db.withTransactionSync(() => {
    for (const { id } of loads) {
      const rows = db.getAllSync<{ stop: StopType; type: EventType; timestamp: number }>(
        `SELECT stop, type, timestamp FROM events WHERE load_id = ?`,
        [id],
      );
      const detMs = detentionMsFromRows(rows);
      if (detMs <= 0) continue;
      const anticipated = (detMs / 3_600_000) * RATE;
      const variant = i % 4;
      i++;
      let status: string;
      let amount: number | null;
      if (variant === 0) { status = 'paid'; amount = Math.round(anticipated * 100) / 100; }
      else if (variant === 1) { status = 'partial'; amount = Math.round(anticipated * 0.5 * 100) / 100; }
      else if (variant === 2) { status = 'refused'; amount = 0; }
      else { continue; } // pending — leave un-recorded
      db.runSync(
        `INSERT OR REPLACE INTO payments (load_id, rate, amount_paid, paid_hours, paid_rate, status, note, updated_at)
         VALUES (?, NULL, ?, NULL, NULL, ?, NULL, ?)`,
        [id, amount, status, Date.now()],
      );
    }
  });
}

/** Mirror of computeStopDetention's "beyond free window" math for raw rows. */
function detentionMsFromRows(rows: { stop: StopType; type: EventType; timestamp: number }[]): number {
  const FREE = 120 * 60_000;
  let total = 0;
  for (const stop of ['pickup', 'delivery'] as StopType[]) {
    const ev = rows.filter((r) => r.stop === stop);
    const arrived = ev.find((e) => e.type === 'ARRIVED')?.timestamp;
    const departed = ev.find((e) => e.type === 'DEPARTED')?.timestamp;
    if (arrived != null && departed != null) {
      total += Math.max(0, departed - arrived - FREE);
    }
  }
  return total;
}

function insertLoad(
  db: ReturnType<typeof getDb>,
  l: {
    id: string; loadNumber: string; broker: string; shipper: string; receiver: string;
    pickup: string; delivery: string; reference: string; trailer: string; notes: string | null;
    status: 'active' | 'completed'; createdAt: number; updatedAt: number;
  },
): void {
  db.runSync(
    `INSERT INTO loads
      (id, load_number, broker_name, shipper, receiver, pickup_location, delivery_location,
       reference_number, trailer_number, driver_notes, driver_name, company, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      l.id, l.loadNumber, l.broker, l.shipper, l.receiver, l.pickup, l.delivery,
      l.reference, l.trailer, l.notes, DEMO_DRIVER, DEMO_COMPANY, l.status, l.createdAt, l.updatedAt,
    ],
  );
}

function insertEvent(
  db: ReturnType<typeof getDb>,
  loadId: string,
  stop: StopType,
  type: EventType,
  ts: number,
  place: Place,
): void {
  db.runSync(
    `INSERT INTO events (id, load_id, stop, type, timestamp, latitude, longitude, address, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId(), loadId, stop, type, ts, place.lat, place.lng, place.addr, null, ts],
  );
}

function insertIncident(
  db: ReturnType<typeof getDb>,
  loadId: string,
  spec: IncidentSpec,
  ts: number,
  place: Place,
): void {
  db.runSync(
    `INSERT INTO incidents
      (id, load_id, type, title, notes, timestamp, latitude, longitude, address, severity, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId(), loadId, spec.type, spec.title, spec.notes, ts, place.lat, place.lng, place.addr, spec.severity, ts],
  );
}
