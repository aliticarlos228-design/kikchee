import { Bike, Car, Truck } from 'lucide-react';
import type { VehicleType } from '../constants/vehicles';

export default function VehicleIcon({
  type,
  className = 'h-5 w-5',
}: {
  type: VehicleType;
  className?: string;
}) {
  switch (type) {
    case 'MOTO':
      return <Bike className={className} strokeWidth={2} />;
    case 'TAXI':
      return <Car className={className} strokeWidth={2} />;
    case 'FOURGON':
      return <Truck className={className} strokeWidth={2} />;
  }
}
