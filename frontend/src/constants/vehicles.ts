export type VehicleType = 'MOTO' | 'TAXI' | 'FOURGON';

export const VEHICLE_OPTIONS: Record<
  VehicleType,
  { label: string; icon: string; description: string; coef: number }
> = {
  MOTO: { label: 'Moto', icon: '🛵', description: 'Petits colis (sac de riz, enveloppe…)', coef: 0.75 },
  TAXI: { label: 'Voiture', icon: '🚗', description: 'Colis moyen', coef: 1 },
  FOURGON: { label: 'Fourgon', icon: '🚚', description: 'Gros volumes', coef: 1.45 },
};

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  MOTO: 'Moto',
  TAXI: 'Voiture',
  FOURGON: 'Fourgon',
};

export function applyVehicleCoef(price: number, vehicleType: VehicleType): number {
  return Math.round(price * VEHICLE_OPTIONS[vehicleType].coef);
}
