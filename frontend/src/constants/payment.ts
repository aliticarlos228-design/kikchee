export type PaymentMethod = 'CASH' | 'MOBILE_MONEY';

export const PAYMENT_OPTIONS: Record<PaymentMethod, { label: string; icon: string; hint: string }> = {
  CASH: { label: 'Espèces', icon: '💵', hint: 'Payez le livreur en liquide' },
  MOBILE_MONEY: { label: 'Mobile Money direct', icon: '📱', hint: 'Flooz / T-Money directement au livreur (pas paiement en ligne)' },
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente de paiement',
  COLLECTED: 'Payé',
};

/** Commission kikchee (informatif côté client/livreur). */
export const COMMISSION_RATE = 0.20;
