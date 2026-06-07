import { TOGO_LOCATIONS, TOGO_CENTER } from '../constants/togo';
import { calculateDeliveryPrice } from '../constants/pricing';
import type { VehicleType } from '../constants/vehicles';
import type { AddressInput } from '../types/order';

const R = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function estimateMinutes(distanceKm: number): number {
  const VITESSE_MOYENNE_KMH = 25;
  const MARGE_PREPARATION_MIN = 15;
  return Math.ceil((distanceKm / VITESSE_MOYENNE_KMH) * 60 + MARGE_PREPARATION_MIN);
}

type TogoLoc = (typeof TOGO_LOCATIONS)[number];

export function locToAddress(loc: TogoLoc): AddressInput {
  return {
    street: loc.street,
    city: loc.city,
    postalCode: loc.postalCode,
    latitude: loc.latitude,
    longitude: loc.longitude,
    label: loc.name,
  };
}

/** Recherche un lieu Lomé à partir du texte saisi (nom, rue, alias) */
export function findLocationFromText(...parts: string[]): TogoLoc | null {
  const query = parts
    .join(' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  if (query.length < 2) return null;

  let best: { loc: TogoLoc; score: number } | null = null;

  for (const loc of TOGO_LOCATIONS) {
    const name = loc.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const street = loc.street.toLowerCase();
    const id = loc.id.replace(/-/g, ' ');
    const aliases = 'aliases' in loc ? loc.aliases : [];

    let score = 0;
    if (name === query || id === query) score = 100;
    else if (name.includes(query) || query.includes(name)) score = 80;
    else if (street.includes(query) || query.includes(street)) score = 60;
    else if (aliases.some((a) => a.toLowerCase().includes(query) || query.includes(a.toLowerCase()))) score = 90;
    else if (name.split(/\s+/).some((w) => w.length > 2 && query.includes(w))) score = 50;

    if (score > 0 && (!best || score > best.score)) {
      best = { loc, score };
    }
  }

  return best?.loc ?? null;
}

export function findNearestLocation(lat: number, lng: number): TogoLoc | null {
  let nearest: TogoLoc | null = null;
  let minKm = Infinity;

  for (const loc of TOGO_LOCATIONS) {
    const km = haversineKm(lat, lng, loc.latitude, loc.longitude);
    if (km < minKm) {
      minKm = km;
      nearest = loc;
    }
  }

  return minKm <= 2.5 ? nearest : null;
}

export function syncAddressFromText(
  current: AddressInput,
  street: string,
  city: string
): AddressInput {
  const matched = findLocationFromText(street, city);
  if (matched) {
    return {
      ...locToAddress(matched),
      street: matched.street,
      city: matched.city,
    };
  }
  return { ...current, street, city };
}

export function addressFromManualText(street: string, city: string): AddressInput {
  const matched = findLocationFromText(street, city);
  if (matched) {
    const addr = locToAddress(matched);
    return { ...addr, street: street.trim() || addr.street, city: city.trim() || addr.city };
  }
  return {
    street: street.trim(),
    city: city.trim() || 'Lomé',
    postalCode: 'BP',
    latitude: TOGO_CENTER.lat,
    longitude: TOGO_CENTER.lng,
    label: `${street.trim()}, ${city.trim() || 'Lomé'}`,
  };
}

export function isAddressReady(street: string, city: string): boolean {
  return street.trim().length >= 2 && city.trim().length >= 1;
}

export function addressFromMapClick(lat: number, lng: number): AddressInput {
  const nearest = findNearestLocation(lat, lng);
  if (nearest) {
    return locToAddress(nearest);
  }
  return {
    street: `Point carte (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    city: 'Lomé',
    postalCode: 'BP',
    latitude: lat,
    longitude: lng,
    label: 'Position personnalisée',
  };
}

/** @deprecated Utiliser calculateDeliveryPrice depuis constants/pricing */
export function calculateLocalPrice(
  pickup: { latitude: number; longitude: number },
  delivery: { latitude: number; longitude: number },
  weightKg: number,
  vehicleType: VehicleType = 'TAXI'
) {
  return calculateDeliveryPrice(pickup, delivery, weightKg, vehicleType);
}
