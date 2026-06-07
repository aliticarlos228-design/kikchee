"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeightTierSurcharge = exports.getVehicleSurcharge = exports.PRICING_CONFIG = void 0;
exports.calculatePrice = calculatePrice;
exports.getPricingConfig = getPricingConfig;
const client_1 = require("@prisma/client");
const haversine_1 = require("../utils/haversine");
const pricing_1 = require("../constants/pricing");
Object.defineProperty(exports, "PRICING_CONFIG", { enumerable: true, get: function () { return pricing_1.PRICING_CONFIG; } });
Object.defineProperty(exports, "getVehicleSurcharge", { enumerable: true, get: function () { return pricing_1.getVehicleSurcharge; } });
Object.defineProperty(exports, "getWeightTierSurcharge", { enumerable: true, get: function () { return pricing_1.getWeightTierSurcharge; } });
function calculatePrice(pickup, delivery, weightKg, vehicleType = client_1.VehicleType.TAXI) {
    const { tarifBase, coefDistanceParKm, supplementZoneLointaine, distanceZoneLointaineKm } = pricing_1.PRICING_CONFIG;
    const distanceKm = (0, haversine_1.haversineKm)(pickup.latitude, pickup.longitude, delivery.latitude, delivery.longitude);
    const partDistance = Math.round(distanceKm * coefDistanceParKm);
    const supplementZone = distanceKm > distanceZoneLointaineKm ? supplementZoneLointaine : 0;
    const weightSurcharge = (0, pricing_1.getWeightTierSurcharge)(weightKg);
    const vehicleSurcharge = (0, pricing_1.getVehicleSurcharge)(vehicleType);
    const estimatedPrice = tarifBase + partDistance + supplementZone + weightSurcharge + vehicleSurcharge;
    return {
        distanceKm,
        estimatedPrice,
        estimatedMinutes: (0, haversine_1.estimateMinutes)(distanceKm),
        currency: 'XOF',
    };
}
function getPricingConfig() {
    return { ...pricing_1.PRICING_CONFIG, currency: 'XOF' };
}
