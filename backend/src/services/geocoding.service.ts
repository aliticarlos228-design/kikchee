/** Géocodage OpenStreetMap Nominatim — Lomé & Togo */

import { APP_NAME } from '../constants/brand';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': `${APP_NAME}/1.0 (delivery app, Togo)` };

export interface GeocodeResult {
  street: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  label: string;
}

function parseNominatimItem(item: {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
}): GeocodeResult {
  const addr = item.address ?? {};
  const city =
    addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Lomé';
  const street =
    addr.road || addr.neighbourhood || addr.quarter || addr.amenity || item.display_name.split(',')[0];
  return {
    street: street.trim(),
    city: city.trim(),
    postalCode: addr.postcode || 'BP',
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    label: item.display_name.split(',').slice(0, 2).join(', '),
  };
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const q = query.includes('Togo') ? query : `${query}, Lomé, Togo`;
  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '6',
    countrycodes: 'tg',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM}/search?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error('Géocodage indisponible');

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
  }>;

  return data.map(parseNominatimItem);
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM}/reverse?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error('Géocodage inverse indisponible');

  const data = (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
  };

  return parseNominatimItem(data);
}
