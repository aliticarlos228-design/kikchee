"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validOrderOwnerFilter = void 0;
exports.deleteOrderCascade = deleteOrderCascade;
exports.deleteOrphanAddresses = deleteOrphanAddresses;
/** Supprime une commande et toutes ses données liées (livraison, enchères, chat, historique). */
async function deleteOrderCascade(tx, orderId) {
    await tx.chatMessage.deleteMany({ where: { orderId } });
    await tx.driverBid.deleteMany({ where: { orderId } });
    await tx.statusHistory.deleteMany({ where: { orderId } });
    await tx.delivery.deleteMany({ where: { orderId } });
    const pkg = await tx.package.findFirst({ where: { orderId } });
    if (pkg) {
        await tx.package.update({ where: { id: pkg.id }, data: { orderId: null } });
    }
    await tx.order.delete({ where: { id: orderId } });
}
async function deleteOrphanAddresses(tx, userId) {
    const addresses = await tx.address.findMany({ where: { userId } });
    for (const addr of addresses) {
        const used = await tx.order.count({
            where: {
                OR: [{ pickupAddressId: addr.id }, { deliveryAddressId: addr.id }],
            },
        });
        if (used === 0) {
            await tx.address.delete({ where: { id: addr.id } });
        }
    }
}
/** Commandes dont le client ou le commerçant existe encore. */
exports.validOrderOwnerFilter = {
    OR: [{ clientId: { not: null } }, { merchantId: { not: null } }],
};
