export interface PackageItem {
  id: string;
  weight: number;
  length: number | null;
  width: number | null;
  height: number | null;
  category: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  orderId: string | null;
  order: {
    id: string;
    status: string;
    pickup?: string;
    delivery?: string;
    recipientName?: string | null;
    recipientPhone?: string | null;
    isExternalCustomer?: boolean;
    vehicleType?: string;
    estimatedPrice?: number | null;
    estimatedMinutes?: number | null;
    deliveryStatus?: string | null;
    hasDriver?: boolean;
  } | null;
}

export interface MerchantOrderDetail {
  id: string;
  status: string;
  weight: number;
  description: string | null;
  vehicleType?: string;
  estimatedPrice: number | null;
  estimatedMinutes: number | null;
  paymentMethod?: string;
  paymentStatus?: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  isExternalCustomer?: boolean;
  client?: { firstName: string; lastName: string; phone: string | null } | null;
  createdAt: string;
  pickupAddress: {
    street: string;
    city: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    label?: string | null;
  };
  deliveryAddress: {
    street: string;
    city: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    label?: string | null;
  };
  timeline: { status: string; note: string | null; at: string }[];
  deliveryInfo: {
    status: string;
    acceptedAt: string | null;
    completedAt: string | null;
    driverLat?: number | null;
    driverLng?: number | null;
    lastPingAt?: string | null;
    driver: {
      firstName: string;
      lastName: string;
      phone: string | null;
      vehicleType?: string | null;
    } | null;
  } | null;
}

export interface PackageDetail extends PackageItem {
  orderDetail: MerchantOrderDetail | null;
}

export interface LinkableOrder {
  id: string;
  weight: number;
  description: string | null;
  estimatedPrice: number | null;
  createdAt: string;
  client: string;
  pickup: string;
  delivery: string;
}

export interface AvailableDelivery {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
  distanceKm: number | null;
  pickupLatitude?: number;
  pickupLongitude?: number;
  suggestedDriver: {
    id: string;
    name: string;
    distanceKm: number;
    isYou: boolean;
  } | null;
  order: {
    weight: number;
    description: string | null;
    estimatedPrice: number | null;
    estimatedMinutes: number | null;
    status: string;
    client: string;
    pickup: string;
    delivery: string;
    packageReady: boolean;
    vehicleType?: string;
    myBid?: { id: string; proposedPrice: number; status: string } | null;
  };
}

export interface DriverDelivery {
  id: string;
  orderId: string;
  status: string;
  acceptedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  order: {
    weight: number;
    description: string | null;
    estimatedPrice: number | null;
    estimatedMinutes: number | null;
    status: string;
    client?: string;
    pickup: string;
    delivery: string;
  };
  timeline?: { status: string; note: string | null; at: string }[];
  clientPhone?: string | null;
  pickupCoords?: { lat: number; lng: number };
  deliveryCoords?: { lat: number; lng: number };
  payment?: {
    method: string;
    status: string;
    price: number | null;
    commissionAmount: number | null;
    driverPayout: number | null;
  };
}

export const PACKAGE_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Créé',
  READY: 'Prêt',
  PICKED_UP: 'Enlevé',
  DELIVERED: 'Livré',
};
