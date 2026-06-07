"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VEHICLE_OPTIONS = void 0;
exports.applyVehicleCoef = applyVehicleCoef;
exports.VEHICLE_OPTIONS = {
    MOTO: {
        label: 'Moto',
        icon: '🏍️',
        description: 'Petits colis, rapide en ville',
        coef: 0.75,
    },
    TAXI: {
        label: 'Taxi / Voiture',
        icon: '🚕',
        description: 'Colis moyens, confort standard',
        coef: 1,
    },
    FOURGON: {
        label: 'Fourgon',
        icon: '🚐',
        description: 'Gros volumes, marchandises lourdes',
        coef: 1.45,
    },
};
function applyVehicleCoef(price, vehicleType) {
    return Math.round(price * exports.VEHICLE_OPTIONS[vehicleType].coef);
}
