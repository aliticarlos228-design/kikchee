"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineKm = haversineKm;
exports.estimateMinutes = estimateMinutes;
const R = 6371;
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
function haversineKm(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
}
function estimateMinutes(distanceKm) {
    const VITESSE_MOYENNE_KMH = 25;
    const MARGE_PREPARATION_MIN = 15;
    return Math.ceil((distanceKm / VITESSE_MOYENNE_KMH) * 60 + MARGE_PREPARATION_MIN);
}
