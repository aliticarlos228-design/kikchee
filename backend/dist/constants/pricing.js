"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VEHICLE_SURCHARGE = exports.PRICING_CONFIG = void 0;
exports.getWeightTierSurcharge = getWeightTierSurcharge;
exports.getVehicleSurcharge = getVehicleSurcharge;
/** Tarifs publics visibles (base + distance). Les suppléments poids/véhicule sont appliqués en interne. */
exports.PRICING_CONFIG = {
    tarifBase: 1500,
    coefDistanceParKm: 400,
    supplementZoneLointaine: 2500,
    distanceZoneLointaineKm: 15,
};
/** Supplément véhicule (intégré au prix final, non affiché au client). */
exports.VEHICLE_SURCHARGE = {
    MOTO: 0,
    TAXI: 1500,
    FOURGON: 2000,
};
/** Supplément poids par tranche (intégré au prix final, non affiché au client). */
function getWeightTierSurcharge(weightKg) {
    if (weightKg <= 2)
        return 500;
    if (weightKg <= 5)
        return 1000;
    return 1500;
}
function getVehicleSurcharge(vehicleType) {
    return exports.VEHICLE_SURCHARGE[vehicleType] ?? exports.VEHICLE_SURCHARGE.TAXI;
}
