import { VehicleType } from '@prisma/client';

export const VEHICLE_OPTIONS: Record<
  VehicleType,
  { label: string; icon: string; description: string; coef: number }
> = {
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

export function applyVehicleCoef(price: number, vehicleType: VehicleType): number {
  return Math.round(price * VEHICLE_OPTIONS[vehicleType].coef);
}
