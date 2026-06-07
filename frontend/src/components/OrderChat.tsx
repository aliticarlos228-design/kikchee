import { MessageCircle } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface OrderChatProps {
  orderId: string;
  enabled?: boolean;
  unavailableText?: string;
}

export default function OrderChat({ orderId, enabled = true, unavailableText }: OrderChatProps) {
  const { openChat } = useChat();

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        {unavailableText || 'Le chat n’est pas encore disponible pour cette commande.'}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openChat(orderId)}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
    >
      <MessageCircle className="h-4 w-4" />
      Ouvrir la messagerie
    </button>
  );
}
