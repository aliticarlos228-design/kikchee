import { haversineKm } from '../utils/haversine';

export interface WithPickupCoords {
  pickupLatitude: number;
  pickupLongitude: number;
}

export function sortByProximity<T extends WithPickupCoords>(
  driverLat: number | null | undefined,
  driverLng: number | null | undefined,
  items: T[]
): (T & { distanceKm: number | null })[] {
  const enriched = items.map((item) => {
    if (driverLat == null || driverLng == null) {
      return { ...item, distanceKm: null };
    }
    const distanceKm = haversineKm(
      driverLat,
      driverLng,
      item.pickupLatitude,
      item.pickupLongitude
    );
    return { ...item, distanceKm };
  });

  return enriched.sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });
}

export function findNearestDriver<T extends { latitude: number | null; longitude: number | null; id: string }>(
  pickupLat: number,
  pickupLng: number,
  drivers: T[]
): (T & { distanceKm: number }) | null {
  const withCoords = drivers.filter((d) => d.latitude != null && d.longitude != null);
  if (withCoords.length === 0) return null;

  let nearest: (T & { distanceKm: number }) | null = null;
  for (const driver of withCoords) {
    const distanceKm = haversineKm(pickupLat, pickupLng, driver.latitude!, driver.longitude!);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { ...driver, distanceKm };
    }
  }
  return nearest;
}
