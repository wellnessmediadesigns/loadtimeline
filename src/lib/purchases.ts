/**
 * In-app purchase layer for the one-time "Pro" unlock (StoreKit via
 * react-native-iap).
 *
 * The native module only exists in a real dev/production build — NOT in Expo
 * Go — so it's loaded lazily and every call degrades gracefully. The paywall
 * uses these helpers and falls back to a local unlock only in __DEV__ so the
 * flow stays testable in Expo Go.
 *
 * TO GO LIVE:
 *   1. In App Store Connect, create a Non-Consumable IAP with product id
 *      `PRO_PRODUCT_ID` below and a price.
 *   2. Build with EAS (`eas build -p ios`) — react-native-iap needs a real
 *      build; it does nothing in Expo Go.
 *   3. Test the purchase + restore with a Sandbox Apple ID via TestFlight.
 */
import { Platform } from 'react-native';

export const PRO_PRODUCT_ID = 'com.organizedfreight.loadtimeline.pro';

// Lazily required so a missing native module never crashes Expo Go.
let mod: any;
let loaded = false;
function iap(): any | null {
  if (!loaded) {
    loaded = true;
    try {
      mod = require('react-native-iap');
    } catch {
      mod = null;
    }
  }
  return mod ?? null;
}

let connected = false;
async function connect(m: any): Promise<boolean> {
  if (connected) return true;
  try {
    await m.initConnection();
    connected = true;
    return true;
  } catch {
    return false;
  }
}

/** True only on a real build where StoreKit is reachable. */
export async function isIapAvailable(): Promise<boolean> {
  const m = iap();
  if (!m || Platform.OS !== 'ios') return false;
  return connect(m);
}

/** Localized store price (e.g. "$6.99"), or null if the store is unavailable. */
export async function getProPrice(): Promise<string | null> {
  const m = iap();
  if (!m || !(await connect(m))) return null;
  try {
    const products = await m.getProducts({ skus: [PRO_PRODUCT_ID] });
    return products?.[0]?.localizedPrice ?? null;
  } catch {
    return null;
  }
}

/** Launches the StoreKit purchase. Resolves true on success, false if the
 *  user cancelled. Throws if the store is unavailable (caught by caller). */
export async function purchasePro(): Promise<boolean> {
  const m = iap();
  if (!m || !(await connect(m))) {
    throw new Error('In-app purchases are not available on this device.');
  }
  return new Promise<boolean>((resolve, reject) => {
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      sub?.remove();
      errSub?.remove();
      fn();
    };
    const sub = m.purchaseUpdatedListener(async (purchase: any) => {
      if (purchase?.productId !== PRO_PRODUCT_ID) return;
      try {
        await m.finishTransaction({ purchase, isConsumable: false });
        finish(() => resolve(true));
      } catch (e) {
        finish(() => reject(e));
      }
    });
    const errSub = m.purchaseErrorListener((err: any) => {
      if (err?.code === 'E_USER_CANCELLED') finish(() => resolve(false));
      else finish(() => reject(new Error(err?.message || 'Purchase failed')));
    });
    m.requestPurchase({ sku: PRO_PRODUCT_ID }).catch((e: any) => finish(() => reject(e)));
  });
}

/** Restores a previous Pro purchase. Returns true if found. */
export async function restorePro(): Promise<boolean> {
  const m = iap();
  if (!m || !(await connect(m))) return false;
  try {
    const purchases = await m.getAvailablePurchases();
    return Array.isArray(purchases) && purchases.some((p: any) => p.productId === PRO_PRODUCT_ID);
  } catch {
    return false;
  }
}
