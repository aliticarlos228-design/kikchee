import { DeliveryStatus, OrderStatus, PaymentMethod, VehicleType } from '@prisma/client';
import { prisma } from '../config/database';
import { calculatePrice } from './pricing.service';

type AddressInput = {
  street: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  label?: string;
};

async function createAddress(userId: string, data: AddressInput) {
  return prisma.address.create({
    data: {
      userId,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      label: data.label,
    },
  });
}

export async function estimateOrder(data: {
  pickupAddress: AddressInput;
  deliveryAddress: AddressInput;
  weight: number;
  vehicleType?: VehicleType;
}) {
  return calculatePrice(
    data.pickupAddress,
    data.deliveryAddress,
    data.weight,
    data.vehicleType ?? VehicleType.TAXI
  );
}

export async function createOrder(
  clientId: string,
  data: {
    pickupAddress: AddressInput;
    deliveryAddress: AddressInput;
    weight: number;
    description?: string;
    vehicleType?: VehicleType;
    paymentMethod?: PaymentMethod;
  }
) {
  const vehicleType = data.vehicleType ?? VehicleType.TAXI;
  const pricing = calculatePrice(
    data.pickupAddress,
    data.deliveryAddress,
    data.weight,
    vehicleType
  );

  const pickup = await createAddress(clientId, data.pickupAddress);
  const delivery = await createAddress(clientId, data.deliveryAddress);

  const order = await prisma.order.create({
    data: {
      clientId,
      pickupAddressId: pickup.id,
      deliveryAddressId: delivery.id,
      weight: data.weight,
      description: data.description,
      vehicleType,
      paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
      estimatedPrice: pricing.estimatedPrice,
      estimatedMinutes: pricing.estimatedMinutes,
      status: OrderStatus.PENDING,
      statusHistory: {
        create: { status: OrderStatus.PENDING, note: 'Commande créée' },
      },
      delivery: {
        create: { status: 'AVAILABLE' },
      },
    },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      delivery: true,
    },
  });

  return formatOrder(order);
}

export async function listClientOrders(clientId: string) {
  const orders = await prisma.order.findMany({
    where: { clientId },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      delivery: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return orders.map(formatOrderSummary);
}

export async function getClientOrder(clientId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      delivery: {
        include: {
          driver: { select: { firstName: true, lastName: true, phone: true, vehicleType: true } },
        },
      },
    },
  });

  if (!order) {
    throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
  }

  return formatOrder(order);
}

export async function cancelOrder(clientId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
    include: { delivery: true },
  });

  if (!order) {
    throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
  }
  if (order.status !== OrderStatus.PENDING) {
    throw { status: 409, message: 'Commande déjà prise en charge, annulation impossible', code: 'ORDER_NOT_CANCELLABLE' };
  }

  return prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
    });
    if (order.delivery) {
      await tx.delivery.update({
        where: { id: order.delivery.id },
        data: { status: DeliveryStatus.FAILED },
      });
    }
    await tx.statusHistory.create({
      data: { orderId, status: OrderStatus.CANCELLED, note: 'Commande annulée par le client' },
    });
    return { success: true };
  });
}

export async function trackOrder(clientId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
    select: {
      id: true,
      status: true,
      estimatedPrice: true,
      estimatedMinutes: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      delivery: { select: { status: true, acceptedAt: true, completedAt: true } },
    },
  });

  if (!order) {
    throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
  }

  return order;
}

function formatOrderSummary(order: {
  id: string;
  status: OrderStatus;
  weight: number;
  description: string | null;
  estimatedPrice: number | null;
  estimatedMinutes: number | null;
  createdAt: Date;
  pickupAddress: { city: string; street: string };
  deliveryAddress: { city: string; street: string };
  delivery: { status: string } | null;
}) {
  return {
    id: order.id,
    status: order.status,
    weight: order.weight,
    description: order.description,
    estimatedPrice: order.estimatedPrice,
    estimatedMinutes: order.estimatedMinutes,
    createdAt: order.createdAt,
    pickup: `${order.pickupAddress.street}, ${order.pickupAddress.city}`,
    delivery: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`,
    deliveryStatus: order.delivery?.status ?? null,
  };
}

function formatOrder(order: {
  id: string;
  status: OrderStatus;
  weight: number;
  description: string | null;
  vehicleType?: string;
  estimatedPrice: number | null;
  estimatedMinutes: number | null;
  paymentMethod?: string;
  paymentStatus?: string;
  commissionAmount?: number | null;
  driverPayout?: number | null;
  createdAt: Date;
  pickupAddress: { street: string; city: string; postalCode: string; latitude: number; longitude: number };
  deliveryAddress: { street: string; city: string; postalCode: string; latitude: number; longitude: number };
  statusHistory: { status: string; note: string | null; createdAt: Date }[];
  delivery?: {
    status: string;
    acceptedAt: Date | null;
    completedAt: Date | null;
    driverLat?: number | null;
    driverLng?: number | null;
    lastPingAt?: Date | null;
    driver?: { firstName: string; lastName: string; phone: string | null; vehicleType?: string | null } | null;
  } | null;
}) {
  return {
    id: order.id,
    status: order.status,
    weight: order.weight,
    description: order.description,
    vehicleType: order.vehicleType,
    estimatedPrice: order.estimatedPrice,
    estimatedMinutes: order.estimatedMinutes,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    commissionAmount: order.commissionAmount,
    driverPayout: order.driverPayout,
    createdAt: order.createdAt,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    timeline: order.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      at: h.createdAt,
    })),
    deliveryInfo: order.delivery
      ? {
          status: order.delivery.status,
          acceptedAt: order.delivery.acceptedAt,
          completedAt: order.delivery.completedAt,
          driverLat: order.delivery.driverLat ?? null,
          driverLng: order.delivery.driverLng ?? null,
          lastPingAt: order.delivery.lastPingAt ?? null,
          driver: order.delivery.driver
            ? {
                firstName: order.delivery.driver.firstName,
                lastName: order.delivery.driver.lastName,
                phone: order.delivery.driver.phone,
                vehicleType: order.delivery.driver.vehicleType ?? null,
              }
            : null,
        }
      : null,
  };
}
