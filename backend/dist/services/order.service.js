"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateOrder = estimateOrder;
exports.createOrder = createOrder;
exports.listClientOrders = listClientOrders;
exports.getClientOrder = getClientOrder;
exports.cancelOrder = cancelOrder;
exports.trackOrder = trackOrder;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const pricing_service_1 = require("./pricing.service");
async function createAddress(userId, data) {
    return database_1.prisma.address.create({
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
async function estimateOrder(data) {
    return (0, pricing_service_1.calculatePrice)(data.pickupAddress, data.deliveryAddress, data.weight, data.vehicleType ?? client_1.VehicleType.TAXI);
}
async function createOrder(clientId, data) {
    const vehicleType = data.vehicleType ?? client_1.VehicleType.TAXI;
    const pricing = (0, pricing_service_1.calculatePrice)(data.pickupAddress, data.deliveryAddress, data.weight, vehicleType);
    const pickup = await createAddress(clientId, data.pickupAddress);
    const delivery = await createAddress(clientId, data.deliveryAddress);
    const order = await database_1.prisma.order.create({
        data: {
            clientId,
            pickupAddressId: pickup.id,
            deliveryAddressId: delivery.id,
            weight: data.weight,
            description: data.description,
            vehicleType,
            paymentMethod: data.paymentMethod ?? client_1.PaymentMethod.CASH,
            estimatedPrice: pricing.estimatedPrice,
            estimatedMinutes: pricing.estimatedMinutes,
            status: client_1.OrderStatus.PENDING,
            statusHistory: {
                create: { status: client_1.OrderStatus.PENDING, note: 'Commande créée' },
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
async function listClientOrders(clientId) {
    const orders = await database_1.prisma.order.findMany({
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
async function getClientOrder(clientId, orderId) {
    const order = await database_1.prisma.order.findFirst({
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
async function cancelOrder(clientId, orderId) {
    const order = await database_1.prisma.order.findFirst({
        where: { id: orderId, clientId },
        include: { delivery: true },
    });
    if (!order) {
        throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
    }
    if (order.status !== client_1.OrderStatus.PENDING) {
        throw { status: 409, message: 'Commande déjà prise en charge, annulation impossible', code: 'ORDER_NOT_CANCELLABLE' };
    }
    return database_1.prisma.$transaction(async (tx) => {
        await tx.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.CANCELLED, cancelledAt: new Date() },
        });
        if (order.delivery) {
            await tx.delivery.update({
                where: { id: order.delivery.id },
                data: { status: client_1.DeliveryStatus.FAILED },
            });
        }
        await tx.statusHistory.create({
            data: { orderId, status: client_1.OrderStatus.CANCELLED, note: 'Commande annulée par le client' },
        });
        return { success: true };
    });
}
async function trackOrder(clientId, orderId) {
    const order = await database_1.prisma.order.findFirst({
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
function formatOrderSummary(order) {
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
function formatOrder(order) {
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
