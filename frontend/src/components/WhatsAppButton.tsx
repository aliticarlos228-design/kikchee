import { MessageCircle } from 'lucide-react';
import { BRAND } from '../constants/togo';
import { whatsappLink } from '../utils/whatsapp';

/** Bouton WhatsApp flottant (support), en bas à droite. */
export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink(BRAND.supportWhatsapp, `Bonjour ${BRAND.name}, j’ai besoin d’aide.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter le support sur WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe5b] lg:bottom-6 lg:right-6"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
