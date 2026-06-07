import { VehicleType } from '@prisma/client';

/** Tarifs publics visibles (base + distance). Les suppléments poids/véhicule sont appliqués en interne. */
export const PRICING_CONFIG = {
  tarifBase: 1500,
  coefDistanceParKm: 400,
  supplementZoneLointaine: 2500,
  distanceZoneLointaineKm: 15,
};

/** Supplément véhicule (intégré au prix final, non affiché au client). */
export const VEHICLE_SURCHARGE: Record<VehicleType, number> = {
  MOTO: 0,
  TAXI: 1500,
  FOURGON: 2000,
};

/** Supplément poids par tranche (intégré au prix final, non affiché au client). */
export function getWeightTierSurcharge(weightKg: number): number {
  if (weightKg <= 2) return 500;
  if (weightKg <= 5) return 1000;
  return 1500;
}

export function getVehicleSurcharge(vehicleType: VehicleType): number {
  return VEHICLE_SURCHARGE[vehicleType] ?? VEHICLE_SURCHARGE.TAXI;
}
