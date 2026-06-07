"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMISSION_RATE = void 0;
exports.computeCommission = computeCommission;
/** Commission kikchee prélevée sur chaque course payée (20%). */
exports.COMMISSION_RATE = 0.20;
function computeCommission(price) {
    const commissionAmount = Math.round(price * exports.COMMISSION_RATE);
    const driverPayout = Math.max(0, price - commissionAmount);
    return { commissionAmount, driverPayout };
}
