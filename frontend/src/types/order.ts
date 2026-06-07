export interface AddressInput {
  street: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  label?: string;
}

export interface OrderSummary {
  id: string;
  status: string;
  weight: number;
  description: string | null;
  estimatedPrice: number | null;
  estimatedMinutes: number | null;
  createdAt: string;
  pickup: string;
  delivery: string;
  deliveryStatus: string | null;
}

export interface OrderDetail {
  id: string;
  status: string;
  weight: number;
  description: string | null;
  vehicleType?: string;
  estimatedPrice: number | null;
  estimatedMinutes: number | null;
  paymentMethod?: string;
  paymentStatus?: string;
  commissionAmount?: number | null;
  driverPayout?: number | null;
  createdAt: string;
  pickupAddress: AddressInput;
  deliveryAddress: AddressInput;
  timeline: { status: string; note: string | null; at: string }[];
  deliveryInfo: {
    status: string;
    acceptedAt: string | null;
    completedAt: string | null;
    driverLat?: number | null;
    driverLng?: number | null;
    lastPingAt?: string | null;
    driver: { firstName: string; lastName: string; phone: string | null; vehicleType?: string | null } | null;
  } | null;
}

export interface PricingEstimate {
  distanceKm: number;
  estimatedPrice: number;
  estimatedMinutes: number;
  currency?: string;
  breakdown?: {
    tarifBase: number;
    partDistance: number;
    partPoids: number;
    supplementZone: number;
    distanceKm: number;
    weightKg: number;
  };
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  ASSIGNED: 'Assignée',
  IN_TRANSIT: 'En cours de livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  AVAILABLE: 'Disponible',
  ACCEPTED: 'Acceptée',
  IN_PROGRESS: 'En route',
  COMPLETED: 'Terminée',
  FAILED: 'Échec',
};
