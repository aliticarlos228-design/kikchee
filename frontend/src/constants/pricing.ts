import type { VehicleType } from './vehicles';
import { haversineKm, estimateMinutes } from '../utils/haversine';

export const PRICING_CONFIG = {
  tarifBase: 1500,
  coefDistanceParKm: 400,
  supplementZoneLointaine: 2500,
  distanceZoneLointaineKm: 15,
};

const VEHICLE_SURCHARGE: Record<VehicleType, number> = {
  MOTO: 0,
  TAXI: 1500,
  FOURGON: 2000,
};

export function getWeightTierSurcharge(weightKg: number): number {
  if (weightKg <= 2) return 500;
  if (weightKg <= 5) return 1000;
  return 1500;
}

function getVehicleSurcharge(vehicleType: VehicleType): number {
  return VEHICLE_SURCHARGE[vehicleType] ?? VEHICLE_SURCHARGE.TAXI;
}

/** Même formule que le backend — suppléments poids/véhicule inclus dans le total affiché. */
export function calculateDeliveryPrice(
  pickup: { latitude: number; longitude: number },
  delivery: { latitude: number; longitude: number },
  weightKg: number,
  vehicleType: VehicleType = 'TAXI'
) {
  const { tarifBase, coefDistanceParKm, supplementZoneLointaine, distanceZoneLointaineKm } =
    PRICING_CONFIG;

  const distanceKm = haversineKm(
    pickup.latitude,
    pickup.longitude,
    delivery.latitude,
    delivery.longitude
  );

  const partDistance = Math.round(distanceKm * coefDistanceParKm);
  const supplementZone = distanceKm > distanceZoneLointaineKm ? supplementZoneLointaine : 0;

  const estimatedPrice =
    tarifBase +
    partDistance +
    supplementZone +
    getWeightTierSurcharge(weightKg) +
    getVehicleSurcharge(vehicleType);

  return {
    distanceKm,
    estimatedPrice,
    estimatedMinutes: estimateMinutes(distanceKm),
  };
}
