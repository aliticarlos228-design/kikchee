"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitDriverBid = submitDriverBid;
exports.listOrderBids = listOrderBids;
exports.selectDriverBid = selectDriverBid;
exports.getDriverBidForOrder = getDriverBidForOrder;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
async function submitDriverBid(driverId, orderId, proposedPrice) {
    const driver = await database_1.prisma.user.findFirst({
        where: { id: driverId, role: 'driver', active: true },
    });
    if (!driver) {
        throw { status: 403, message: 'Compte livreur requis', code: 'FORBIDDEN' };
    }
    const delivery = await database_1.prisma.delivery.findFirst({
        where: { orderId, status: 'AVAILABLE', driverId: null },
        include: { order: true },
    });
    if (!delivery) {
        throw { status: 404, message: 'Mission indisponible', code: 'DELIVERY_UNAVAILABLE' };
    }
    if (delivery.order.status !== client_1.OrderStatus.PENDING) {
        throw { status: 409, message: 'Commande déjà assignée', code: 'ORDER_NOT_PENDING' };
    }
    if (driver.vehicleType && driver.vehicleType !== delivery.order.vehicleType) {
        throw {
            status: 403,
            message: 'Cette mission ne correspond pas à votre type de véhicule',
            code: 'VEHICLE_MISMATCH',
        };
    }
    const bid = await database_1.prisma.driverBid.upsert({
        where: { orderId_driverId: { orderId, driverId } },
        create: { orderId, driverId, proposedPrice },
        update: { proposedPrice, status: client_1.BidStatus.PENDING },
        include: {
            driver: { select: { firstName: true, lastName: true, phone: true, vehicleType: true } },
        },
    });
    await database_1.prisma.statusHistory.create({
        data: {
            orderId,
            status: client_1.OrderStatus.PENDING,
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
async function listOrderBids(clientId, orderId) {
    const order = await database_1.prisma.order.findFirst({
        where: { id: orderId, clientId },
    });
    if (!order) {
        throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
    }
    const bids = await database_1.prisma.driverBid.findMany({
        where: { orderId, status: client_1.BidStatus.PENDING },
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
async function selectDriverBid(clientId, orderId, bidId) {
    const order = await database_1.prisma.order.findFirst({
        where: { id: orderId, clientId, status: client_1.OrderStatus.PENDING },
        include: { delivery: true },
    });
    if (!order || !order.delivery) {
        throw { status: 404, message: 'Commande introuvable ou déjà assignée', code: 'ORDER_NOT_FOUND' };
    }
    const bid = await database_1.prisma.driverBid.findFirst({
        where: { id: bidId, orderId, status: client_1.BidStatus.PENDING },
    });
    if (!bid) {
        throw { status: 404, message: 'Offre introuvable', code: 'BID_NOT_FOUND' };
    }
    return database_1.prisma.$transaction(async (tx) => {
        await tx.driverBid.update({
            where: { id: bidId },
            data: { status: client_1.BidStatus.ACCEPTED },
        });
        await tx.driverBid.updateMany({
            where: { orderId, id: { not: bidId } },
            data: { status: client_1.BidStatus.REJECTED },
        });
        await tx.delivery.update({
            where: { id: order.delivery.id },
            data: {
                driverId: bid.driverId,
                status: 'ACCEPTED',
                acceptedAt: new Date(),
            },
        });
        await tx.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.ASSIGNED, estimatedPrice: bid.proposedPrice },
        });
        await tx.statusHistory.create({
            data: {
                orderId,
                status: client_1.OrderStatus.ASSIGNED,
                note: `Client a choisi l'offre à ${bid.proposedPrice} FCFA`,
            },
        });
        return { success: true, orderId, bidId, driverId: bid.driverId, price: bid.proposedPrice };
    });
}
async function getDriverBidForOrder(driverId, orderId) {
    return database_1.prisma.driverBid.findUnique({
        where: { orderId_driverId: { orderId, driverId } },
    });
}
