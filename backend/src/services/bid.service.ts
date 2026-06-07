import { BidStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../config/database';

export async function submitDriverBid(driverId: string, orderId: string, proposedPrice: number) {
  const driver = await prisma.user.findFirst({
    where: { id: driverId, role: 'driver', active: true },
  });
  if (!driver) {
    throw { status: 403, message: 'Compte livreur requis', code: 'FORBIDDEN' };
  }

  const delivery = await prisma.delivery.findFirst({
    where: { orderId, status: 'AVAILABLE', driverId: null },
    include: { order: true },
  });
  if (!delivery) {
    throw { status: 404, message: 'Mission indisponible', code: 'DELIVERY_UNAVAILABLE' };
  }
  if (delivery.order.status !== OrderStatus.PENDING) {
    throw { status: 409, message: 'Commande déjà assignée', code: 'ORDER_NOT_PENDING' };
  }
  if (driver.vehicleType && driver.vehicleType !== delivery.order.vehicleType) {
    throw {
      status: 403,
      message: 'Cette mission ne correspond pas à votre type de véhicule',
      code: 'VEHICLE_MISMATCH',
    };
  }

  const bid = await prisma.driverBid.upsert({
    where: { orderId_driverId: { orderId, driverId } },
    create: { orderId, driverId, proposedPrice },
    update: { proposedPrice, status: BidStatus.PENDING },
    include: {
      driver: { select: { firstName: true, lastName: true, phone: true, vehicleType: true } },
    },
  });

  await prisma.statusHistory.create({
    data: {
      orderId,
      status: OrderStatus.PENDING,
      note: `Offre ${proposedPrice} FCFA par ${driver.firstName} ${driver.lastName}`,
    },
  });

  return {
    id: bid.id,
    orderId: bid.orderId,
    proposedPrice: bid.proposedPrice,
    status: bid.status,
    createdAt: bid.createdAt,
    driver: {
      name: `${bid.driver.firstName} ${bid.driver.lastName}`,
      phone: bid.driver.phone,
      vehicleType: bid.driver.vehicleType,
    },
  };
}

export async function listOrderBids(clientId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
  });
  if (!order) {
    throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
  }

  const bids = await prisma.driverBid.findMany({
    where: { orderId, status: BidStatus.PENDING },
    include: {
      driver: { select: { firstName: true, lastName: true, phone: true, vehicleType: true } },
    },
    orderBy: { proposedPrice: 'asc' },
  });

  return bids.map((b) => ({
    id: b.id,
    proposedPrice: b.proposedPrice,
    createdAt: b.createdAt,
    driver: {
      name: `${b.driver.firstName} ${b.driver.lastName}`,
      phone: b.driver.phone,
      vehicleType: b.driver.vehicleType,
    },
  }));
}

export async function selectDriverBid(clientId: string, orderId: string, bidId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId, status: OrderStatus.PENDING },
    include: { delivery: true },
  });
  if (!order || !order.delivery) {
    throw { status: 404, message: 'Commande introuvable ou déjà assignée', code: 'ORDER_NOT_FOUND' };
  }

  const bid = await prisma.driverBid.findFirst({
    where: { id: bidId, orderId, status: BidStatus.PENDING },
  });
  if (!bid) {
    throw { status: 404, message: 'Offre introuvable', code: 'BID_NOT_FOUND' };
  }

  return prisma.$transaction(async (tx) => {
    await tx.driverBid.update({
      where: { id: bidId },
      data: { status: BidStatus.ACCEPTED },
    });
    await tx.driverBid.updateMany({
      where: { orderId, id: { not: bidId } },
      data: { status: BidStatus.REJECTED },
    });
    await tx.delivery.update({
      where: { id: order.delivery!.id },
      data: {
        driverId: bid.driverId,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ASSIGNED, estimatedPrice: bid.proposedPrice },
    });
    await tx.statusHistory.create({
      data: {
        orderId,
        status: OrderStatus.ASSIGNED,
        note: `Client a choisi l'offre à ${bid.proposedPrice} FCFA`,
      },
    });
    return { success: true, orderId, bidId, driverId: bid.driverId, price: bid.proposedPrice };
  });
}

export async function getDriverBidForOrder(driverId: string, orderId: string) {
  return prisma.driverBid.findUnique({
    where: { orderId_driverId: { orderId, driverId } },
  });
}
