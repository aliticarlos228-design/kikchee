"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipToClient = shipToClient;
exports.createPackage = createPackage;
exports.listMerchantPackages = listMerchantPackages;
exports.listLinkableOrders = listLinkableOrders;
exports.linkPackageToOrder = linkPackageToOrder;
exports.updatePackageStatus = updatePackageStatus;
exports.getMerchantPackageDetail = getMerchantPackageDetail;
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
async function shipToClient(merchantId, data) {
    const pricing = (0, pricing_service_1.calculatePrice)(data.pickupAddress, data.deliveryAddress, data.weight, data.vehicleType);
    const pickup = await createAddress(merchantId, data.pickupAddress);
    const delivery = await createAddress(merchantId, data.deliveryAddress);
    const order = await database_1.prisma.order.create({
        data: {
            merchantId,
            source: client_1.OrderSource.MERCHANT,
            recipientName: data.recipientName,
            recipientPhone: data.recipientPhone,
            pickupAddressId: pickup.id,
            deliveryAddressId: delivery.id,
            weight: data.weight,
            description: data.description,
            vehicleType: data.vehicleType,
            estimatedPrice: pricing.estimatedPrice,
            estimatedMinutes: pricing.estimatedMinutes,
            status: client_1.OrderStatus.PENDING,
            statusHistory: {
                create: {
                    status: client_1.OrderStatus.PENDING,
                    note: `Expédition commerçant — ${data.recipientName}`,
                },
            },
            delivery: { create: { status: 'AVAILABLE' } },
            package: {
                create: {
                    merchantId,
                    weight: data.weight,
                    description: data.description,
                    status: client_1.PackageStatus.READY,
                },
            },
        },
        include: {
            pickupAddress: true,
            deliveryAddress: true,
            package: true,
            delivery: true,
        },
    });
    return {
        orderId: order.id,
        packageId: order.package.id,
        package: order.package ? formatPackage({ ...order.package, order: { id: order.id, status: order.status } }) : null,
        estimatedPrice: order.estimatedPrice,
        vehicleType: order.vehicleType,
    };
}
async function createPackage(merchantId, data) {
    const pkg = await database_1.prisma.package.create({
        data: {
            merchantId,
            weight: data.weight,
            length: data.length,
            width: data.width,
            height: data.height,
            description: data.description,
            status: client_1.PackageStatus.CREATED,
        },
        include: { order: { select: { id: true, status: true } } },
    });
    return formatPackage(pkg);
}
async function listMerchantPackages(merchantId) {
    const packages = await database_1.prisma.package.findMany({
        where: { merchantId },
        include: {
            order: {
                select: {
                    id: true,
                    status: true,
                    source: true,
                    recipientName: true,
                    recipientPhone: true,
                    vehicleType: true,
                    estimatedPrice: true,
                    estimatedMinutes: true,
                    pickupAddress: { select: { street: true, city: true } },
                    deliveryAddress: { select: { street: true, city: true } },
                    delivery: { select: { status: true, driverId: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return packages.map(formatPackage);
}
async function listLinkableOrders() {
    const orders = await database_1.prisma.order.findMany({
        where: {
            status: 'PENDING',
            package: null,
        },
        include: {
            pickupAddress: true,
            deliveryAddress: true,
            client: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({
        id: o.id,
        weight: o.weight,
        description: o.description,
        estimatedPrice: o.estimatedPrice,
        createdAt: o.createdAt,
        client: o.client ? `${o.client.firstName} ${o.client.lastName}` : 'Client',
        pickup: `${o.pickupAddress.street}, ${o.pickupAddress.city}`,
        delivery: `${o.deliveryAddress.street}, ${o.deliveryAddress.city}`,
    }));
}
async function linkPackageToOrder(merchantId, packageId, orderId) {
    const pkg = await database_1.prisma.package.findFirst({
        where: { id: packageId, merchantId },
    });
    if (!pkg) {
        throw { status: 404, message: 'Colis introuvable', code: 'PACKAGE_NOT_FOUND' };
    }
    if (pkg.orderId) {
        throw { status: 409, message: 'Colis déjà associé à une commande', code: 'ALREADY_LINKED' };
    }
    const order = await database_1.prisma.order.findFirst({
        where: { id: orderId, status: 'PENDING', package: null },
    });
    if (!order) {
        throw { status: 404, message: 'Commande non disponible pour association', code: 'ORDER_NOT_AVAILABLE' };
    }
    const updated = await database_1.prisma.package.update({
        where: { id: packageId },
        data: { orderId },
    });
    await database_1.prisma.order.update({
        where: { id: orderId },
        data: { merchantId },
    });
    await database_1.prisma.statusHistory.create({
        data: {
            orderId,
            status: 'PENDING',
            note: `Colis associé par le commerçant (${pkg.id.slice(0, 8)})`,
        },
    });
    return formatPackage({ ...updated, order: { id: orderId, status: order.status } });
}
async function updatePackageStatus(merchantId, packageId, status) {
    const pkg = await database_1.prisma.package.findFirst({
        where: { id: packageId, merchantId },
        include: { order: true },
    });
    if (!pkg) {
        throw { status: 404, message: 'Colis introuvable', code: 'PACKAGE_NOT_FOUND' };
    }
    const updated = await database_1.prisma.package.update({
        where: { id: packageId },
        data: { status },
        include: {
            order: {
                select: {
                    id: true,
                    status: true,
                    pickupAddress: { select: { street: true, city: true } },
                    deliveryAddress: { select: { street: true, city: true } },
                },
            },
        },
    });
    if (status === client_1.PackageStatus.READY && pkg.orderId) {
        await database_1.prisma.statusHistory.create({
            data: {
                orderId: pkg.orderId,
                status: 'PENDING',
                note: 'Colis prêt pour enlèvement',
            },
        });
    }
    return formatPackage(updated);
}
async function getMerchantPackageDetail(merchantId, packageId) {
    const pkg = await database_1.prisma.package.findFirst({
        where: { id: packageId, merchantId },
        include: {
            order: {
                include: {
                    pickupAddress: true,
                    deliveryAddress: true,
                    client: { select: { firstName: true, lastName: true, phone: true } },
                    statusHistory: { orderBy: { createdAt: 'asc' } },
                    delivery: {
                        include: {
                            driver: { select: { firstName: true, lastName: true, phone: true, vehicleType: true } },
                        },
                    },
                },
            },
        },
    });
    if (!pkg) {
        throw { status: 404, message: 'Colis introuvable', code: 'PACKAGE_NOT_FOUND' };
    }
    const base = formatPackage(pkg);
    if (!pkg.order) {
        return { ...base, orderDetail: null };
    }
    const o = pkg.order;
    return {
        ...base,
        orderDetail: {
            id: o.id,
            status: o.status,
            weight: o.weight,
            description: o.description,
            vehicleType: o.vehicleType,
            estimatedPrice: o.estimatedPrice,
            estimatedMinutes: o.estimatedMinutes,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            recipientName: o.recipientName,
            recipientPhone: o.recipientPhone,
            isExternalCustomer: o.source === client_1.OrderSource.MERCHANT && Boolean(o.recipientName),
            client: o.client
                ? { firstName: o.client.firstName, lastName: o.client.lastName, phone: o.client.phone }
                : null,
            createdAt: o.createdAt,
            pickupAddress: o.pickupAddress,
            deliveryAddress: o.deliveryAddress,
            timeline: o.statusHistory.map((h) => ({
                status: h.status,
                note: h.note,
                at: h.createdAt,
            })),
            deliveryInfo: o.delivery
                ? {
                    status: o.delivery.status,
                    acceptedAt: o.delivery.acceptedAt,
                    completedAt: o.delivery.completedAt,
                    driverLat: o.delivery.driverLat ?? null,
                    driverLng: o.delivery.driverLng ?? null,
                    lastPingAt: o.delivery.lastPingAt ?? null,
                    driver: o.delivery.driver
                        ? {
                            firstName: o.delivery.driver.firstName,
                            lastName: o.delivery.driver.lastName,
                            phone: o.delivery.driver.phone,
                            vehicleType: o.delivery.driver.vehicleType ?? null,
                        }
                        : null,
                }
                : null,
        },
    };
}
function formatPackage(pkg) {
    return {
        id: pkg.id,
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        category: pkg.category ?? null,
        description: pkg.description,
        status: pkg.status,
        createdAt: pkg.createdAt,
        orderId: pkg.orderId,
        order: pkg.order
            ? {
                id: pkg.order.id,
                status: pkg.order.status,
                pickup: pkg.order.pickupAddress
                    ? `${pkg.order.pickupAddress.street}, ${pkg.order.pickupAddress.city}`
                    : undefined,
                delivery: pkg.order.deliveryAddress
                    ? `${pkg.order.deliveryAddress.street}, ${pkg.order.deliveryAddress.city}`
                    : undefined,
                recipientName: pkg.order.recipientName ?? null,
                recipientPhone: pkg.order.recipientPhone ?? null,
                isExternalCustomer: pkg.order.source === 'MERCHANT' && Boolean(pkg.order.recipientName),
                vehicleType: pkg.order.vehicleType,
                estimatedPrice: pkg.order.estimatedPrice ?? null,
                estimatedMinutes: pkg.order.estimatedMinutes ?? null,
                deliveryStatus: pkg.order.delivery?.status ?? null,
                hasDriver: Boolean(pkg.order.delivery?.driverId),
            }
            : null,
    };
}
