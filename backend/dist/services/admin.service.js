"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = getStats;
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.toggleUserActive = toggleUserActive;
exports.updateUser = updateUser;
exports.getUserDetail = getUserDetail;
exports.listFinancialTransactions = listFinancialTransactions;
exports.listAllOrders = listAllOrders;
exports.listAllDeliveries = listAllDeliveries;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const payment_1 = require("../constants/payment");
const commission_service_1 = require("./commission.service");
const order_cleanup_service_1 = require("./order-cleanup.service");
const ONLINE_MS = 5 * 60 * 1000;
function isOnline(lastActiveAt) {
    if (!lastActiveAt)
        return false;
    return Date.now() - lastActiveAt.getTime() < ONLINE_MS;
}
function formatUserRow(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        vehicleType: user.vehicleType,
        active: user.active,
        online: isOnline(user.lastActiveAt),
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
    };
}
async function getStats() {
    const onlineSince = new Date(Date.now() - ONLINE_MS);
    const [totalUsers, activeUsers, inactiveUsers, onlineUsers, totalOrders, completedDeliveries, ordersByStatus, usersByRole, paidOrders,] = await Promise.all([
        database_1.prisma.user.count(),
        database_1.prisma.user.count({ where: { active: true } }),
        database_1.prisma.user.count({ where: { active: false } }),
        database_1.prisma.user.count({ where: { lastActiveAt: { gte: onlineSince } } }),
        database_1.prisma.order.count(),
        database_1.prisma.delivery.count({ where: { status: 'COMPLETED' } }),
        database_1.prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
        database_1.prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
        database_1.prisma.order.findMany({
            where: { paymentStatus: client_1.PaymentStatus.COLLECTED },
            select: { estimatedPrice: true, commissionAmount: true, driverPayout: true },
        }),
    ]);
    const completedWithDuration = await database_1.prisma.delivery.findMany({
        where: {
            status: 'COMPLETED',
            acceptedAt: { not: null },
            completedAt: { not: null },
        },
        select: { acceptedAt: true, completedAt: true },
    });
    let averageDeliveryMinutes = 0;
    if (completedWithDuration.length > 0) {
        const totalMinutes = completedWithDuration.reduce((sum, d) => {
            const ms = d.completedAt.getTime() - d.acceptedAt.getTime();
            return sum + ms / 60000;
        }, 0);
        averageDeliveryMinutes = Math.round(totalMinutes / completedWithDuration.length);
    }
    const ordersByStatusMap = {};
    for (const row of ordersByStatus) {
        ordersByStatusMap[row.status] = row._count.status;
    }
    const usersByRoleMap = {};
    for (const row of usersByRole) {
        usersByRoleMap[row.role] = row._count.role;
    }
    const totalRevenue = paidOrders.reduce((s, o) => s + (o.estimatedPrice ?? 0), 0);
    const totalCommission = paidOrders.reduce((s, o) => s + (o.commissionAmount ?? 0), 0);
    const totalDriverPayout = paidOrders.reduce((s, o) => s + (o.driverPayout ?? 0), 0);
    return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        onlineUsers,
        totalOrders,
        completedDeliveries,
        paidOrdersCount: paidOrders.length,
        averageDeliveryMinutes,
        pendingOrders: ordersByStatusMap[client_1.OrderStatus.PENDING] ?? 0,
        inTransitOrders: ordersByStatusMap[client_1.OrderStatus.IN_TRANSIT] ?? 0,
        deliveredOrders: ordersByStatusMap[client_1.OrderStatus.DELIVERED] ?? 0,
        ordersByStatus: ordersByStatusMap,
        usersByRole: usersByRoleMap,
        commissionRate: payment_1.COMMISSION_RATE,
        totalRevenue,
        totalCommission,
        totalDriverPayout,
    };
}
async function listUsers(role) {
    const users = await database_1.prisma.user.findMany({
        where: role ? { role: role } : undefined,
        select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            phone: true,
            vehicleType: true,
            active: true,
            lastActiveAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return users.map(formatUserRow);
}
async function createUser(data) {
    const existing = await database_1.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        throw { status: 409, message: 'Cet email est déjà utilisé', code: 'EMAIL_EXISTS' };
    }
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const user = await database_1.prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role,
            vehicleType: data.role === 'driver' ? data.vehicleType : null,
        },
        select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            phone: true,
            vehicleType: true,
            active: true,
            lastActiveAt: true,
            createdAt: true,
        },
    });
    return formatUserRow(user);
}
async function deleteUser(userId, adminId) {
    if (userId === adminId) {
        throw { status: 400, message: 'Vous ne pouvez pas supprimer votre propre compte', code: 'SELF_DELETE' };
    }
    const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
    }
    if (user.role === 'admin') {
        throw { status: 403, message: 'Impossible de supprimer un administrateur', code: 'ADMIN_DELETE' };
    }
    if (user.role === 'driver') {
        const activeDelivery = await database_1.prisma.delivery.findFirst({
            where: {
                driverId: userId,
                status: { in: [client_1.DeliveryStatus.ACCEPTED, client_1.DeliveryStatus.IN_PROGRESS] },
            },
        });
        if (activeDelivery) {
            throw {
                status: 409,
                message: 'Livraison en cours — impossible de supprimer ce livreur',
                code: 'ACTIVE_DELIVERY',
            };
        }
        await database_1.prisma.$transaction(async (tx) => {
            await tx.chatMessage.deleteMany({ where: { senderId: userId } });
            await tx.driverBid.deleteMany({ where: { driverId: userId } });
            await tx.delivery.updateMany({ where: { driverId: userId }, data: { driverId: null } });
            await (0, order_cleanup_service_1.deleteOrphanAddresses)(tx, userId);
            await tx.user.delete({ where: { id: userId } });
        });
        return { success: true, deletedOrders: 0 };
    }
    // Client ou commerçant : supprimer toutes ses commandes (actives, terminées, payées)
    const orderWhere = user.role === 'client' ? { clientId: userId } : { merchantId: userId };
    const orderIds = (await database_1.prisma.order.findMany({ where: orderWhere, select: { id: true } })).map((o) => o.id);
    await database_1.prisma.$transaction(async (tx) => {
        await tx.chatMessage.deleteMany({ where: { senderId: userId } });
        for (const orderId of orderIds) {
            await (0, order_cleanup_service_1.deleteOrderCascade)(tx, orderId);
        }
        if (user.role === 'merchant') {
            await tx.package.deleteMany({ where: { merchantId: userId } });
        }
        await (0, order_cleanup_service_1.deleteOrphanAddresses)(tx, userId);
        await tx.user.delete({ where: { id: userId } });
    });
    return { success: true, deletedOrders: orderIds.length };
}
async function toggleUserActive(userId, active, adminId) {
    if (userId === adminId) {
        throw { status: 400, message: 'Vous ne pouvez pas désactiver votre propre compte', code: 'SELF_DEACTIVATE' };
    }
    const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
    }
    const updated = await database_1.prisma.user.update({
        where: { id: userId },
        data: { active },
        select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            phone: true,
            vehicleType: true,
            active: true,
            lastActiveAt: true,
            createdAt: true,
        },
    });
    return formatUserRow(updated);
}
async function updateUser(userId, data) {
    const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
    }
    if (user.role === 'admin') {
        throw { status: 403, message: 'Impossible de modifier un administrateur', code: 'ADMIN_EDIT' };
    }
    const updateData = {};
    if (data.firstName !== undefined)
        updateData.firstName = data.firstName;
    if (data.lastName !== undefined)
        updateData.lastName = data.lastName;
    if (data.phone !== undefined)
        updateData.phone = data.phone;
    if (data.vehicleType !== undefined) {
        if (user.role !== 'driver') {
            throw {
                status: 400,
                message: 'Le type de véhicule ne s\'applique qu\'aux livreurs',
                code: 'NOT_A_DRIVER',
            };
        }
        updateData.vehicleType = data.vehicleType;
    }
    const updated = await database_1.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            phone: true,
            vehicleType: true,
            active: true,
            lastActiveAt: true,
            createdAt: true,
        },
    });
    return formatUserRow(updated);
}
async function getUserDetail(userId) {
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            phone: true,
            vehicleType: true,
            active: true,
            lastActiveAt: true,
            createdAt: true,
        },
    });
    if (!user) {
        throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
    }
    const base = formatUserRow(user);
    if (user.role !== 'driver') {
        return { user: base, ledger: null };
    }
    const ledger = await (0, commission_service_1.getDriverLedger)(userId);
    return { user: base, ledger };
}
async function listFinancialTransactions() {
    const orders = await database_1.prisma.order.findMany({
        where: { paymentStatus: client_1.PaymentStatus.COLLECTED },
        include: {
            client: { select: { firstName: true, lastName: true, email: true } },
            merchant: { select: { firstName: true, lastName: true } },
            delivery: {
                select: {
                    id: true,
                    completedAt: true,
                    driver: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({
        orderId: o.id,
        deliveryId: o.delivery?.id ?? null,
        amount: o.estimatedPrice ?? 0,
        commission: o.commissionAmount ?? 0,
        driverNet: o.driverPayout ?? 0,
        paymentMethod: o.paymentMethod,
        client: o.client
            ? { name: `${o.client.firstName} ${o.client.lastName}`, email: o.client.email }
            : null,
        merchant: o.merchant ? `${o.merchant.firstName} ${o.merchant.lastName}` : null,
        driver: o.delivery?.driver
            ? {
                id: o.delivery.driver.id,
                name: `${o.delivery.driver.firstName} ${o.delivery.driver.lastName}`,
                email: o.delivery.driver.email,
            }
            : null,
        completedAt: o.delivery?.completedAt ?? null,
        createdAt: o.createdAt,
    }));
}
async function listAllOrders() {
    const orders = await database_1.prisma.order.findMany({
        include: {
            client: { select: { firstName: true, lastName: true, email: true } },
            merchant: { select: { firstName: true, lastName: true } },
            pickupAddress: true,
            deliveryAddress: true,
            delivery: {
                select: {
                    status: true,
                    driver: { select: { id: true, firstName: true, lastName: true } },
                },
            },
            package: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({
        id: o.id,
        status: o.status,
        weight: o.weight,
        description: o.description,
        estimatedPrice: o.estimatedPrice,
        estimatedMinutes: o.estimatedMinutes,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        commissionAmount: o.commissionAmount,
        driverPayout: o.driverPayout,
        createdAt: o.createdAt,
        client: o.client
            ? { name: `${o.client.firstName} ${o.client.lastName}`, email: o.client.email }
            : null,
        merchant: o.merchant ? `${o.merchant.firstName} ${o.merchant.lastName}` : null,
        pickup: `${o.pickupAddress.street}, ${o.pickupAddress.city}`,
        delivery: `${o.deliveryAddress.street}, ${o.deliveryAddress.city}`,
        deliveryStatus: o.delivery?.status ?? null,
        driver: o.delivery?.driver
            ? { id: o.delivery.driver.id, name: `${o.delivery.driver.firstName} ${o.delivery.driver.lastName}` }
            : null,
        packageStatus: o.package?.status ?? null,
    }));
}
async function listAllDeliveries() {
    const deliveries = await database_1.prisma.delivery.findMany({
        include: {
            order: {
                include: {
                    client: { select: { firstName: true, lastName: true } },
                    pickupAddress: true,
                    deliveryAddress: true,
                },
            },
            driver: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return deliveries.map((d) => ({
        id: d.id,
        orderId: d.orderId,
        status: d.status,
        acceptedAt: d.acceptedAt,
        completedAt: d.completedAt,
        createdAt: d.createdAt,
        client: d.order.client
            ? `${d.order.client.firstName} ${d.order.client.lastName}`
            : 'Client',
        pickup: `${d.order.pickupAddress.street}, ${d.order.pickupAddress.city}`,
        delivery: `${d.order.deliveryAddress.street}, ${d.order.deliveryAddress.city}`,
        orderStatus: d.order.status,
        estimatedPrice: d.order.estimatedPrice,
        paymentStatus: d.order.paymentStatus,
        commissionAmount: d.order.commissionAmount,
        driverPayout: d.order.driverPayout,
        driver: d.driver
            ? { id: d.driver.id, name: `${d.driver.firstName} ${d.driver.lastName}`, email: d.driver.email }
            : null,
    }));
}
