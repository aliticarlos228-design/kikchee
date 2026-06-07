/** Construit un lien wa.me vers un numéro avec message pré-rempli. */
export function whatsappLink(phone: string | null | undefined, message?: string): string {
  const digits = (phone || '').replace(/[^\d]/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
