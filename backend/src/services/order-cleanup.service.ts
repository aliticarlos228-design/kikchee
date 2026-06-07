import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/** Supprime une commande et toutes ses données liées (livraison, enchères, chat, historique). */
export async function deleteOrderCascade(tx: Tx, orderId: string) {
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

export async function deleteOrphanAddresses(tx: Tx, userId: string) {
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
export const validOrderOwnerFilter: Prisma.OrderWhereInput = {
  OR: [{ clientId: { not: null } }, { merchantId: { not: null } }],
};
