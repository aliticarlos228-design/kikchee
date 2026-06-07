export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  onlineUsers: number;
  totalOrders: number;
  completedDeliveries: number;
  paidOrdersCount: number;
  averageDeliveryMinutes: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  ordersByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
  commissionRate: number;
  totalRevenue: number;
  totalCommission: number;
  totalDriverPayout: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  vehicleType: string | null;
  active: boolean;
  online: boolean;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface DriverTrip {
  orderId: string;
  deliveryId: string | null;
  client: { name: string; email: string | null } | null;
  amount: number;
  commission: number;
  driverNet: number;
  paymentMethod: string;
  completedAt: string | null;
  createdAt: string;
}

export interface DriverLedger {
  commissionRate: number;
  completedDeliveries: number;
  paidTripsCount: number;
  totalCollected: number;
  totalCommissionDue: number;
  totalDriverNet: number;
  trips: DriverTrip[];
}

export interface AdminUserDetail {
  user: AdminUser;
  ledger: DriverLedger | null;
}

export interface FinancialTransaction {
  orderId: string;
  deliveryId: string | null;
  amount: number;
  commission: number;
  driverNet: number;
  paymentMethod: string;
  client: { name: string; email: string } | null;
  merchant: string | null;
  driver: { id: string; name: string; email: string } | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  status: string;
  weight: number;
  description: string | null;
  estimatedPrice: number | null;
  estimatedMinutes: number | null;
  paymentStatus: string;
  paymentMethod: string;
  commissionAmount: number | null;
  driverPayout: number | null;
  createdAt: string;
  client: { name: string; email: string } | null;
  merchant: string | null;
  pickup: string;
  delivery: string;
  deliveryStatus: string | null;
  driver: { id: string; name: string } | null;
  packageStatus: string | null;
}

export interface AdminDelivery {
  id: string;
  orderId: string;
  status: string;
  acceptedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  client: string;
  pickup: string;
  delivery: string;
  orderStatus: string;
  estimatedPrice: number | null;
  paymentStatus: string;
  commissionAmount: number | null;
  driverPayout: number | null;
  driver: { id: string; name: string; email: string } | null;
}

export const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  merchant: 'Commerçant',
  driver: 'Livreur',
  admin: 'Administrateur',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Non payé',
  COLLECTED: 'Payé',
};
