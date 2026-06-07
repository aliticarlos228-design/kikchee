import { DeliveryStatus, OrderStatus, PackageStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { computeCommission } from '../constants/payment';
import { APP_NAME } from '../constants/brand';
import { getDriverLedger } from './commission.service';
import { validOrderOwnerFilter } from './order-cleanup.service';
import { findNearestDriver, sortByProximity } from './matching.service';

export async function listAvailableDeliveries(driverId: string) {
  const driver = await prisma.user.findUnique({ where: { id: driverId } });
  if (!driver?.vehicleType) {
    return [];
  }

  const deliveries = await prisma.delivery.findMany({
    where: {
      status: DeliveryStatus.AVAILABLE,
      driverId: null,
      order: {
        status: OrderStatus.PENDING,
        vehicleType: driver.vehicleType,
        OR: [{ clientId: { not: null } }, { merchantId: { not: null } }],
      },
    },
    include: {
      order: {
        include: {
          pickupAddress: true,
          deliveryAddress: true,
          package: { select: { status: true } },
          client: { select: { firstName: true, lastName: true } },
          bids: { where: { driverId }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const items = deliveries.map((d) => ({
    id: d.id,
    orderId: d.orderId,
    status: d.status,
    createdAt: d.createdAt,
    order: {
      weight: d.order.weight,
      description: d.order.description,
      estimatedPrice: d.order.estimatedPrice,
      estimatedMinutes: d.order.estimatedMinutes,
      status: d.order.status,
      client: d.order.client
        ? `${d.order.client.firstName} ${d.order.client.lastName}`
        : 'Client',
      pickup: `${d.order.pickupAddress.street}, ${d.order.pickupAddress.city}`,
      delivery: `${d.order.deliveryAddress.street}, ${d.order.deliveryAddress.city}`,
      packageReady: d.order.package?.status === PackageStatus.READY,
      vehicleType: d.order.vehicleType,
      myBid: d.order.bids[0] ?? null,
    },
    pickupLatitude: d.order.pickupAddress.latitude,
    pickupLongitude: d.order.pickupAddress.longitude,
  }));

  const sorted = sortByProximity(driver?.latitude, driver?.longitude, items);

  const activeDrivers = await prisma.user.findMany({
    where: { role: 'driver', active: true },
    select: { id: true, firstName: true, lastName: true, latitude: true, longitude: true },
  });

  return sorted.map((item) => {
    const suggested = findNearestDriver(
      item.pickupLatitude,
      item.pickupLongitude,
      activeDrivers
    );
    return {
      id: item.id,
      orderId: item.orderId,
      status: item.status,
      createdAt: item.createdAt,
      distanceKm: item.distanceKm,
      pickupLatitude: item.pickupLatitude,
      pickupLongitude: item.pickupLongitude,
      suggestedDriver: suggested
        ? {
            id: suggested.id,
            name: `${suggested.firstName} ${suggested.lastName}`,
            distanceKm: suggested.distanceKm,
            isYou: suggested.id === driverId,
          }
        : null,
      order: item.order,
    };
  });
}

export async function acceptDelivery(driverId: string, orderId: string) {
  const driver = await prisma.user.findUnique({ where: { id: driverId } });
  if (!driver || driver.role !== 'driver') {
    throw { status: 403, message: 'Compte livreur requis', code: 'FORBIDDEN' };
  }

  const delivery = await prisma.delivery.findFirst({
    where: { orderId, status: DeliveryStatus.AVAILABLE, driverId: null },
    include: { order: true },
  });

  if (!delivery) {
    throw { status: 409, message: 'Livraison déjà prise ou indisponible', code: 'DELIVERY_UNAVAILABLE' };
  }

  if (driver.vehicleType && driver.vehicleType !== delivery.order.vehicleType) {
    throw {
      status: 403,
      message: 'Cette mission ne correspond pas à votre type de véhicule',
      code: 'VEHICLE_MISMATCH',
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedDelivery = await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        driverId,
        status: DeliveryStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        order: {
          include: {
            pickupAddress: true,
            deliveryAddress: true,
          },
        },
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ASSIGNED },
    });

    await tx.statusHistory.create({
      data: {
        orderId,
        status: OrderStatus.ASSIGNED,
        note: 'Livraison acceptée par un livreur',
      },
    });

    return updatedDelivery;
  });

  return formatDelivery(result);
}

export async function updateDeliveryStatus(
  driverId: string,
  deliveryId: string,
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, driverId },
    include: { order: { include: { package: true } } },
  });

  if (!delivery) {
    throw { status: 404, message: 'Livraison introuvable', code: 'DELIVERY_NOT_FOUND' };
  }

  const allowed: Record<string, DeliveryStatus[]> = {
    ACCEPTED: [DeliveryStatus.IN_PROGRESS],
    IN_PROGRESS: [DeliveryStatus.COMPLETED, DeliveryStatus.FAILED],
  };

  const nextStatuses = allowed[delivery.status];
  if (!nextStatuses?.includes(status as DeliveryStatus)) {
    throw {
      status: 400,
      message: `Transition impossible depuis ${delivery.status}`,
      code: 'INVALID_STATUS_TRANSITION',
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData: {
      status: DeliveryStatus;
      completedAt?: Date;
    } = { status: status as DeliveryStatus };

    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    const updated = await tx.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: {
        order: {
          include: {
            pickupAddress: true,
            deliveryAddress: true,
          },
        },
      },
    });

    if (status === 'IN_PROGRESS') {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.IN_TRANSIT },
      });
      await tx.statusHistory.create({
        data: {
          orderId: delivery.orderId,
          status: OrderStatus.IN_TRANSIT,
          note: 'Livreur en route',
        },
      });
      if (delivery.order.package) {
        await tx.package.update({
          where: { id: delivery.order.package.id },
          data: { status: PackageStatus.PICKED_UP },
        });
      }
    }

    if (status === 'COMPLETED') {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.DELIVERED },
      });
      await tx.statusHistory.create({
        data: {
          orderId: delivery.orderId,
          status: OrderStatus.DELIVERED,
          note: 'Colis livré avec succès',
        },
      });
      if (delivery.order.package) {
        await tx.package.update({
          where: { id: delivery.order.package.id },
          data: { status: PackageStatus.DELIVERED },
        });
      }
    }

    if (status === 'FAILED') {
      await tx.statusHistory.create({
        data: {
          orderId: delivery.orderId,
          status: delivery.order.status,
          note: 'Incident signalé par le livreur',
        },
      });
    }

    return updated;
  });

  return formatDelivery(result);
}

export async function updateDeliveryLocation(
  driverId: string,
  deliveryId: string,
  latitude: number,
  longitude: number
) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, driverId },
  });
  if (!delivery) {
    throw { status: 404, message: 'Livraison introuvable', code: 'DELIVERY_NOT_FOUND' };
  }
  if (delivery.status !== DeliveryStatus.ACCEPTED && delivery.status !== DeliveryStatus.IN_PROGRESS) {
    throw { status: 409, message: 'Course non active', code: 'DELIVERY_NOT_ACTIVE' };
  }

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { driverLat: latitude, driverLng: longitude, lastPingAt: new Date() },
  });
  // Met aussi à jour la position de base du livreur (pour le matching).
  await prisma.user.update({
    where: { id: driverId },
    data: { latitude, longitude },
  });

  return { success: true };
}

export async function confirmDeliveryPayment(driverId: string, deliveryId: string) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, driverId },
    include: { order: true },
  });
  if (!delivery) {
    throw { status: 404, message: 'Livraison introuvable', code: 'DELIVERY_NOT_FOUND' };
  }
  if (delivery.order.paymentStatus === PaymentStatus.COLLECTED) {
    throw { status: 409, message: 'Paiement déjà confirmé', code: 'PAYMENT_ALREADY_COLLECTED' };
  }

  const price = delivery.order.estimatedPrice ?? 0;
  const { commissionAmount, driverPayout } = computeCommission(price);

  await prisma.order.update({
    where: { id: delivery.orderId },
    data: {
      paymentStatus: PaymentStatus.COLLECTED,
      commissionAmount,
      driverPayout,
    },
  });
  await prisma.statusHistory.create({
    data: {
      orderId: delivery.orderId,
      status: delivery.order.status,
      note: `Paiement encaissé (${price} FCFA) — commission ${APP_NAME} ${commissionAmount} FCFA, net livreur ${driverPayout} FCFA`,
    },
  });

  return { success: true, price, commissionAmount, driverPayout };
}

export async function listDriverDeliveries(driverId: string) {
  const deliveries = await prisma.delivery.findMany({
    where: {
      driverId,
      order: validOrderOwnerFilter,
    },
    include: {
      order: {
        include: {
          pickupAddress: true,
          deliveryAddress: true,
          client: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return deliveries.map(formatDelivery);
}

export async function getDriverRedevance(driverId: string) {
  return getDriverLedger(driverId);
}

export async function getDriverDelivery(driverId: string, deliveryId: string) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, driverId },
    include: {
      order: {
        include: {
          pickupAddress: true,
          deliveryAddress: true,
          client: { select: { firstName: true, lastName: true, phone: true } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  });

  if (!delivery) {
    throw { status: 404, message: 'Livraison introuvable', code: 'DELIVERY_NOT_FOUND' };
  }

  const price = delivery.order.estimatedPrice ?? 0;
  const payment =
    delivery.order.paymentStatus === PaymentStatus.COLLECTED
      ? {
          status: delivery.order.paymentStatus,
          method: delivery.order.paymentMethod,
          amount: price,
          commissionAmount: delivery.order.commissionAmount ?? 0,
          driverPayout: delivery.order.driverPayout ?? 0,
        }
      : {
          status: delivery.order.paymentStatus,
          method: delivery.order.paymentMethod,
          amount: price,
          commissionAmount: null as number | null,
          driverPayout: null as number | null,
        };

  return {
    ...formatDelivery(delivery),
    payment,
    pickupCoords: {
      lat: delivery.order.pickupAddress.latitude,
      lng: delivery.order.pickupAddress.longitude,
    },
    deliveryCoords: {
      lat: delivery.order.deliveryAddress.latitude,
      lng: delivery.order.deliveryAddress.longitude,
    },
    timeline: delivery.order.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      at: h.createdAt,
    })),
    clientPhone: delivery.order.client?.phone ?? null,
  };
}

function formatDelivery(delivery: {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  acceptedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  order: {
    weight: number;
    description: string | null;
    estimatedPrice: number | null;
    estimatedMinutes: number | null;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: string;
    commissionAmount?: number | null;
    driverPayout?: number | null;
    pickupAddress: { street: string; city: string; postalCode: string };
    deliveryAddress: { street: string; city: string; postalCode: string };
    client?: { firstName: string; lastName: string; phone?: string | null } | null;
  };
}) {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    status: delivery.status,
    acceptedAt: delivery.acceptedAt,
    completedAt: delivery.completedAt,
    createdAt: delivery.createdAt,
    order: {
      weight: delivery.order.weight,
      description: delivery.order.description,
      estimatedPrice: delivery.order.estimatedPrice,
      estimatedMinutes: delivery.order.estimatedMinutes,
      status: delivery.order.status,
      paymentStatus: delivery.order.paymentStatus,
      paymentMethod: delivery.order.paymentMethod,
      client: delivery.order.client
        ? `${delivery.order.client.firstName} ${delivery.order.client.lastName}`
        : undefined,
      pickup: `${delivery.order.pickupAddress.street}, ${delivery.order.pickupAddress.city}`,
      delivery: `${delivery.order.deliveryAddress.street}, ${delivery.order.deliveryAddress.city}`,
    },
  };
}
