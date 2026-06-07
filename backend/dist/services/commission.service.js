"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverLedger = getDriverLedger;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const payment_1 = require("../constants/payment");
async function getDriverLedger(driverId) {
    const orders = await database_1.prisma.order.findMany({
        where: {
            paymentStatus: client_1.PaymentStatus.COLLECTED,
            delivery: { driverId },
            OR: [{ clientId: { not: null } }, { merchantId: { not: null } }],
        },
        include: {
            delivery: { select: { id: true, completedAt: true } },
            client: { select: { firstName: true, lastName: true, email: true } },
            merchant: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    const trips = orders.map((o) => ({
        orderId: o.id,
        deliveryId: o.delivery?.id ?? null,
        client: o.client
            ? { name: `${o.client.firstName} ${o.client.lastName}`, email: o.client.email }
            : o.merchant
                ? { name: `${o.merchant.firstName} ${o.merchant.lastName}`, email: null }
                : null,
        amount: o.estimatedPrice ?? 0,
        commission: o.commissionAmount ?? 0,
        driverNet: o.driverPayout ?? 0,
        paymentMethod: o.paymentMethod,
        completedAt: o.delivery?.completedAt ?? null,
        createdAt: o.createdAt,
    }));
    const totalCollected = trips.reduce((s, t) => s + t.amount, 0);
    const totalCommissionDue = trips.reduce((s, t) => s + t.commission, 0);
    const totalDriverNet = trips.reduce((s, t) => s + t.driverNet, 0);
    const completedCount = await database_1.prisma.delivery.count({
        where: { driverId, status: client_1.DeliveryStatus.COMPLETED },
    });
    return {
        commissionRate: payment_1.COMMISSION_RATE,
        completedDeliveries: completedCount,
        paidTripsCount: trips.length,
        totalCollected,
        totalCommissionDue,
        totalDriverNet,
        trips,
    };
}
