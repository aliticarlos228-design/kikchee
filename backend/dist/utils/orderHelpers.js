"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderClientLabel = orderClientLabel;
exports.orderClientPhone = orderClientPhone;
function orderClientLabel(order) {
    if (order.client) {
        return `${order.client.firstName} ${order.client.lastName}`;
    }
    if (order.recipientName) {
        return `${order.recipientName} (hors appli)`;
    }
    return 'Client';
}
function orderClientPhone(order) {
    if (order.client?.phone)
        return order.client.phone;
    return order.recipientPhone ?? null;
}
