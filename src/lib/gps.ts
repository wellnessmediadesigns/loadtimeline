/**
 * GPS capture for events/incidents. Requests permission, grabs a single
 * fix, and reverse-geocodes it to a readable address for the timeline + PDF.
 * Never blocks event recording — on failure it returns nulls so the user can
 * still document the moment.
 */
import * as Location from 'expo-location';
import type { GeoStamp } from '@/types';

export const EMPTY_GEO: GeoStamp = { latitude: null, longitude: null, address: null };

function formatPlace(p: Location.LocationGeocodedAddress): string | null {
  const street = [p.streetNumber, p.street].filter(Boolean).join(' ');
  const parts = [street || p.name, p.city, p.region].filter(Boolean);
  const line = parts.join(', ');
  return line || p.postalCode || null;
}

export async function captureGeo(): Promise<GeoStamp> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return EMPTY_GEO;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;

    let address: string | null = null;
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (places.length > 0) address = formatPlace(places[0]);
    } catch {
      // Reverse geocode is best-effort; coordinates are still recorded.
    }

    return { latitude, longitude, address };
  } catch {
    return EMPTY_GEO;
  }
}
