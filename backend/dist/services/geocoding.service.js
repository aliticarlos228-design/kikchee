"use strict";
/** Géocodage OpenStreetMap Nominatim — Lomé & Togo */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAddress = searchAddress;
exports.reverseGeocode = reverseGeocode;
const brand_1 = require("../constants/brand");
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': `${brand_1.APP_NAME}/1.0 (delivery app, Togo)` };
function parseNominatimItem(item) {
    const addr = item.address ?? {};
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Lomé';
    const street = addr.road || addr.neighbourhood || addr.quarter || addr.amenity || item.display_name.split(',')[0];
    return {
        street: street.trim(),
        city: city.trim(),
        postalCode: addr.postcode || 'BP',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        label: item.display_name.split(',').slice(0, 2).join(', '),
    };
}
async function searchAddress(query) {
    const q = query.includes('Togo') ? query : `${query}, Lomé, Togo`;
    const params = new URLSearchParams({
        q,
        format: 'json',
        limit: '6',
        countrycodes: 'tg',
        addressdetails: '1',
    });
    const res = await fetch(`${NOMINATIM}/search?${params}`, { headers: HEADERS });
    if (!res.ok)
        throw new Error('Géocodage indisponible');
    const data = (await res.json());
    return data.map(parseNominatimItem);
}
async function reverseGeocode(lat, lng) {
    const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: 'json',
        addressdetails: '1',
    });
    const res = await fetch(`${NOMINATIM}/reverse?${params}`, { headers: HEADERS });
    if (!res.ok)
        throw new Error('Géocodage inverse indisponible');
    const data = (await res.json());
    return parseNominatimItem(data);
}
