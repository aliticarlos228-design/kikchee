type OrderClientInfo = {
  client?: { firstName: string; lastName: string; phone?: string | null } | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  source?: string;
};

export function orderClientLabel(order: OrderClientInfo): string {
  if (order.client) {
    return `${order.client.firstName} ${order.client.lastName}`;
  }
  if (order.recipientName) {
    return `${order.recipientName} (hors appli)`;
  }
  return 'Client';
}

export function orderClientPhone(order: OrderClientInfo): string | null {
  if (order.client?.phone) return order.client.phone;
  return order.recipientPhone ?? null;
}
