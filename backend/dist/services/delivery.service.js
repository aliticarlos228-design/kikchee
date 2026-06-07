"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAvailableDeliveries = listAvailableDeliveries;
exports.acceptDelivery = acceptDelivery;
exports.updateDeliveryStatus = updateDeliveryStatus;
exports.updateDeliveryLocation = updateDeliveryLocation;
exports.confirmDeliveryPayment = confirmDeliveryPayment;
exports.listDriverDeliveries = listDriverDeliveries;
exports.getDriverRedevance = getDriverRedevance;
exports.getDriverDelivery = getDriverDelivery;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const payment_1 = require("../constants/payment");
const brand_1 = require("../constants/brand");
const commission_service_1 = require("./commission.service");
const order_cleanup_service_1 = require("./order-cleanup.service");
const matching_service_1 = require("./matching.service");
async function listAvailableDeliveries(driverId) {
    const driver = await database_1.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver?.vehicleType) {
        return [];
    }
    const deliveries = await database_1.prisma.delivery.findMany({
        where: {
            status: client_1.DeliveryStatus.AVAILABLE,
            driverId: null,
            order: {
                status: client_1.OrderStatus.PENDING,
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
            packageReady: d.order.package?.status === client_1.PackageStatus.READY,
            vehicleType: d.order.vehicleType,
            myBid: d.order.bids[0] ?? null,
        },
        pickupLatitude: d.order.pickupAddress.latitude,
        pickupLongitude: d.order.pickupAddress.longitude,
    }));
    const sorted = (0, matching_service_1.sortByProximity)(driver?.latitude, driver?.longitude, items);
    const activeDrivers = await database_1.prisma.user.findMany({
        where: { role: 'driver', active: true },
        select: { id: true, firstName: true, lastName: true, latitude: true, longitude: true },
    });
    return sorted.map((item) => {
        const suggested = (0, matching_service_1.findNearestDriver)(item.pickupLatitude, item.pickupLongitude, activeDrivers);
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
async function acceptDelivery(driverId, orderId) {
    const driver = await database_1.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver || driver.role !== 'driver') {
        throw { status: 403, message: 'Compte livreur requis', code: 'FORBIDDEN' };
    }
    const delivery = await database_1.prisma.delivery.findFirst({
        where: { orderId, status: client_1.DeliveryStatus.AVAILABLE, driverId: null },
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
    const result = await database_1.prisma.$transaction(async (tx) => {
        const updatedDelivery = await tx.delivery.update({
            where: { id: delivery.id },
            data: {
                driverId,
                status: client_1.DeliveryStatus.ACCEPTED,
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
            data: { status: client_1.OrderStatus.ASSIGNED },
        });
        await tx.statusHistory.create({
            data: {
                orderId,
                status: client_1.OrderStatus.ASSIGNED,
                note: 'Livraison acceptée par un livreur',
            },
        });
        return updatedDelivery;
    });
    return formatDelivery(result);
}
async function updateDeliveryStatus(driverId, deliveryId, status) {
    const delivery = await database_1.prisma.delivery.findFirst({
        where: { id: deliveryId, driverId },
        include: { order: { include: { package: true } } },
    });
    if (!delivery) {
        throw { status: 404, message: 'Livraison introuvable', code: 'DELIVERY_NOT_FOUND' };
    }
    const allowed = {
        ACCEPTED: [client_1.DeliveryStatus.IN_PROGRESS],
        IN_PROGRESS: [client_1.DeliveryStatus.COMPLETED, client_1.DeliveryStatus.FAILED],
    };
    const nextStatuses = allowed[delivery.status];
    if (!nextStatuses?.includes(status)) {
        throw {
            status: 400,
            message: `Transition impossible depuis ${delivery.status}`,
            code: 'INVALID_STATUS_TRANSITION',
        };
    }
    const result = await database_1.prisma.$transaction(async (tx) => {
        const updateData = { status: status };
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
                data: { status: client_1.OrderStatus.IN_TRANSIT },
            });
            await tx.statusHistory.create({
                data: {
                    orderId: delivery.orderId,
                    status: client_1.OrderStatus.IN_TRANSIT,
                    note: 'Livreur en route',
                },
            });
            if (delivery.order.package) {
                await tx.package.update({
                    where: { id: delivery.order.package.id },
                    data: { status: client_1.PackageStatus.PICKED_UP },
                });
            }
        }
        if (status === 'COMPLETED') {
            await tx.order.update({
                where: { id: delivery.orderId },
                data: { status: client_1.OrderStatus.DELIVERED },
            });
            await tx.statusHistory.create({
                data: {
                    orderId: delivery.orderId,
                    status: client_1.OrderStatus.DELIVERED,
                    note: 'Colis livré avec succès',
                },
            });
            if (delivery.order.package) {
                await tx.package.update({
                    where: { id: delivery.order.package.id },
                    data: { status: client_1.PackageStatus.DELIVERED },
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
async function updateDeliveryLocation(driverId, deliveryId, latitude, longitude) {
    const delivery = await database_1.prisma.delivery.findFirst({
        where: { id: deliveryId, driverId },
    });
    if (!delivery) {
        throw { status: 404, message: 'Livraison introuvable', code: 'DELIVERY_NOT_FOUND' };
    }
    if (delivery.status !== client_1.DeliveryStatus.ACCEPTED && delivery.status !== client_1.DeliveryStatus.IN_PROGRESS) {
        throw { status: 409, message: 'Course non active', code: 'DELIVERY_NOT_ACTIVE' };
    }
    await database_1.prisma.delivery.update({
        where: { id: deliveryId },
        data: { driverLat: latitude, driverLng: longitude, lastPingAt: new Date() },
    });
    // Met aussi à jour la position de base du livreur (pour le matching).
    await database_1.prisma.user.update({
        where: { id: driverId },
        data: { latitude, longitude },
    });
    return { success: true };
}
async function confirmDeliveryPayment(driverId, deliveryId) {
    const delivery = await database_1.prisma.delivery.findFirst({
        where: { id: deliveryId, driverId },
        include: { order: true },
    });
    if (!delivery) {
        throw { status: 404, message: 'Livraison introuvable', code: 'DELIVERY_NOT_FOUND' };
    }
    if (delivery.order.paymentStatus === client_1.PaymentStatus.COLLECTED) {
        throw { status: 409, message: 'Paiement déjà confirmé', code: 'PAYMENT_ALREADY_COLLECTED' };
    }
    const price = delivery.order.estimatedPrice ?? 0;
    const { commissionAmount, driverPayout } = (0, payment_1.computeCommission)(price);
    await database_1.prisma.order.update({
        where: { id: delivery.orderId },
        data: {
            paymentStatus: client_1.PaymentStatus.COLLECTED,
            commissionAmount,
            driverPayout,
        },
    });
    await database_1.prisma.statusHistory.create({
        data: {
            orderId: delivery.orderId,
            status: delivery.order.status,
            note: `Paiement encaissé (${price} FCFA) — commission ${brand_1.APP_NAME} ${commissionAmount} FCFA, net livreur ${driverPayout} FCFA`,
        },
    });
    return { success: true, price, commissionAmount, driverPayout };
}
async function listDriverDeliveries(driverId) {
    const deliveries = await database_1.prisma.delivery.findMany({
        where: {
            driverId,
            order: order_cleanup_service_1.validOrderOwnerFilter,
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
async function getDriverRedevance(driverId) {
    return (0, commission_service_1.getDriverLedger)(driverId);
}
async function getDriverDelivery(driverId, deliveryId) {
    const delivery = await database_1.prisma.delivery.findFirst({
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
    const payment = delivery.order.paymentStatus === client_1.PaymentStatus.COLLECTED
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
            commissionAmount: null,
            driverPayout: null,
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
function formatDelivery(delivery) {
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
