"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConversations = listConversations;
exports.listMessages = listMessages;
exports.sendMessage = sendMessage;
const database_1 = require("../config/database");
const ONLINE_MS = 5 * 60 * 1000;
function isOnline(lastActiveAt) {
    if (!lastActiveAt)
        return false;
    return Date.now() - lastActiveAt.getTime() < ONLINE_MS;
}
async function touchPresence(userId) {
    await database_1.prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } });
}
function orderCounterpartLabel(o) {
    if (o.merchant)
        return `${o.merchant.firstName} ${o.merchant.lastName} (commerçant)`;
    if (o.client)
        return `${o.client.firstName} ${o.client.lastName}`;
    return o.recipientName || 'Client';
}
async function assertChatAccess(userId, role, orderId) {
    const order = await database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { delivery: true },
    });
    if (!order) {
        throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
    }
    const isClient = role === 'client' && order.clientId === userId;
    const isMerchant = role === 'merchant' && order.merchantId === userId;
    const isDriver = role === 'driver' && order.delivery?.driverId === userId;
    if (!isClient && !isMerchant && !isDriver) {
        throw { status: 403, message: 'Accès au chat refusé', code: 'CHAT_FORBIDDEN' };
    }
    if (!order.delivery?.driverId) {
        throw {
            status: 409,
            message: 'Le chat sera disponible dès qu’un livreur accepte la commande',
            code: 'CHAT_NOT_READY',
        };
    }
    return order;
}
function lastMessagePreview(message) {
    if (!message)
        return '';
    return message.text;
}
async function listConversations(userId, role) {
    await touchPresence(userId);
    if (role === 'client') {
        const orders = await database_1.prisma.order.findMany({
            where: {
                clientId: userId,
                delivery: { is: { driverId: { not: null } } },
            },
            include: {
                pickupAddress: true,
                deliveryAddress: true,
                delivery: {
                    include: {
                        driver: { select: { firstName: true, lastName: true, vehicleType: true, lastActiveAt: true } },
                    },
                },
                chatMessages: { orderBy: { createdAt: 'desc' }, take: 1 },
                _count: { select: { chatMessages: { where: { senderId: { not: userId } } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => {
            const driver = o.delivery?.driver;
            const last = o.chatMessages[0];
            return {
                orderId: o.id,
                status: o.status,
                counterpart: {
                    name: driver ? `${driver.firstName} ${driver.lastName}` : 'Livreur',
                    role: 'driver',
                    vehicleType: driver?.vehicleType ?? null,
                    online: isOnline(driver?.lastActiveAt),
                },
                pickup: `${o.pickupAddress.street}, ${o.pickupAddress.city}`,
                delivery: `${o.deliveryAddress.street}, ${o.deliveryAddress.city}`,
                unreadCount: o._count.chatMessages,
                lastMessage: last
                    ? {
                        id: last.id,
                        text: lastMessagePreview(last),
                        createdAt: last.createdAt,
                        mine: last.senderId === userId,
                    }
                    : null,
            };
        });
    }
    if (role === 'merchant') {
        const orders = await database_1.prisma.order.findMany({
            where: {
                merchantId: userId,
                delivery: { is: { driverId: { not: null } } },
            },
            include: {
                pickupAddress: true,
                deliveryAddress: true,
                delivery: {
                    include: {
                        driver: { select: { firstName: true, lastName: true, vehicleType: true, lastActiveAt: true } },
                    },
                },
                chatMessages: { orderBy: { createdAt: 'desc' }, take: 1 },
                _count: { select: { chatMessages: { where: { senderId: { not: userId } } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => {
            const driver = o.delivery?.driver;
            const last = o.chatMessages[0];
            return {
                orderId: o.id,
                status: o.status,
                counterpart: {
                    name: driver ? `${driver.firstName} ${driver.lastName}` : 'Livreur',
                    role: 'driver',
                    vehicleType: driver?.vehicleType ?? null,
                    online: isOnline(driver?.lastActiveAt),
                },
                pickup: `${o.pickupAddress.street}, ${o.pickupAddress.city}`,
                delivery: `${o.deliveryAddress.street}, ${o.deliveryAddress.city}`,
                unreadCount: o._count.chatMessages,
                lastMessage: last
                    ? {
                        id: last.id,
                        text: lastMessagePreview(last),
                        createdAt: last.createdAt,
                        mine: last.senderId === userId,
                    }
                    : null,
            };
        });
    }
    const deliveries = await database_1.prisma.delivery.findMany({
        where: { driverId: userId, status: { in: ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] } },
        include: {
            order: {
                include: {
                    client: { select: { firstName: true, lastName: true, lastActiveAt: true } },
                    merchant: { select: { firstName: true, lastName: true, lastActiveAt: true } },
                    pickupAddress: true,
                    deliveryAddress: true,
                    chatMessages: { orderBy: { createdAt: 'desc' }, take: 1 },
                    _count: { select: { chatMessages: { where: { senderId: { not: userId } } } } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return deliveries.map((dl) => {
        const o = dl.order;
        const last = o.chatMessages[0];
        return {
            orderId: o.id,
            status: o.status,
            counterpart: {
                name: orderCounterpartLabel(o),
                role: (o.merchantId && !o.clientId ? 'merchant' : 'client'),
                vehicleType: null,
                online: isOnline(o.client?.lastActiveAt ?? o.merchant?.lastActiveAt),
            },
            pickup: `${o.pickupAddress.street}, ${o.pickupAddress.city}`,
            delivery: `${o.deliveryAddress.street}, ${o.deliveryAddress.city}`,
            unreadCount: o._count.chatMessages,
            lastMessage: last
                ? {
                    id: last.id,
                    text: lastMessagePreview(last),
                    createdAt: last.createdAt,
                    mine: last.senderId === userId,
                }
                : null,
        };
    });
}
async function listMessages(userId, role, orderId) {
    await assertChatAccess(userId, role, orderId);
    const messages = await database_1.prisma.chatMessage.findMany({
        where: { orderId },
        include: {
            sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => ({
        id: m.id,
        text: m.text,
        createdAt: m.createdAt,
        mine: m.senderId === userId,
        sender: {
            id: m.sender.id,
            name: `${m.sender.firstName} ${m.sender.lastName}`,
            role: m.sender.role,
        },
    }));
}
async function sendMessage(userId, role, orderId, text) {
    await assertChatAccess(userId, role, orderId);
    const message = await database_1.prisma.chatMessage.create({
        data: { orderId, senderId: userId, text },
        include: {
            sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
    });
    return {
        id: message.id,
        text: message.text,
        createdAt: message.createdAt,
        mine: true,
        sender: {
            id: message.sender.id,
            name: `${message.sender.firstName} ${message.sender.lastName}`,
            role: message.sender.role,
        },
    };
}
