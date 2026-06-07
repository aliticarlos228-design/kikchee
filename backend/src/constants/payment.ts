/** Commission kikchee prélevée sur chaque course payée (20%). */
export const COMMISSION_RATE = 0.20;

export function computeCommission(price: number) {
  const commissionAmount = Math.round(price * COMMISSION_RATE);
  const driverPayout = Math.max(0, price - commissionAmount);
  return { commissionAmount, driverPayout };
}
