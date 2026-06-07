import { VehicleType } from '@prisma/client';
import { estimateMinutes, haversineKm } from '../utils/haversine';
import {
  PRICING_CONFIG,
  getVehicleSurcharge,
  getWeightTierSurcharge,
} from '../constants/pricing';

export { PRICING_CONFIG, getVehicleSurcharge, getWeightTierSurcharge };

export interface PricingResult {
  distanceKm: number;
  estimatedPrice: number;
  estimatedMinutes: number;
  currency: 'XOF';
}

export function calculatePrice(
  pickup: { latitude: number; longitude: number },
  delivery: { latitude: number; longitude: number },
  weightKg: number,
  vehicleType: VehicleType = VehicleType.TAXI
): PricingResult {
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
  const weightSurcharge = getWeightTierSurcharge(weightKg);
  const vehicleSurcharge = getVehicleSurcharge(vehicleType);

  const estimatedPrice =
    tarifBase + partDistance + supplementZone + weightSurcharge + vehicleSurcharge;

  return {
    distanceKm,
    estimatedPrice,
    estimatedMinutes: estimateMinutes(distanceKm),
    currency: 'XOF',
  };
}

export function getPricingConfig() {
  return { ...PRICING_CONFIG, currency: 'XOF' as const };
}
