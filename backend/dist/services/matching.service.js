"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByProximity = sortByProximity;
exports.findNearestDriver = findNearestDriver;
const haversine_1 = require("../utils/haversine");
function sortByProximity(driverLat, driverLng, items) {
    const enriched = items.map((item) => {
        if (driverLat == null || driverLng == null) {
            return { ...item, distanceKm: null };
        }
        const distanceKm = (0, haversine_1.haversineKm)(driverLat, driverLng, item.pickupLatitude, item.pickupLongitude);
        return { ...item, distanceKm };
    });
    return enriched.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null)
            return 0;
        if (a.distanceKm == null)
            return 1;
        if (b.distanceKm == null)
            return -1;
        return a.distanceKm - b.distanceKm;
    });
}
function findNearestDriver(pickupLat, pickupLng, drivers) {
    const withCoords = drivers.filter((d) => d.latitude != null && d.longitude != null);
    if (withCoords.length === 0)
        return null;
    let nearest = null;
    for (const driver of withCoords) {
        const distanceKm = (0, haversine_1.haversineKm)(pickupLat, pickupLng, driver.latitude, driver.longitude);
        if (!nearest || distanceKm < nearest.distanceKm) {
            nearest = { ...driver, distanceKm };
        }
    }
    return nearest;
}
