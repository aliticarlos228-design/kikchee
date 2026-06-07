import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { AvailableDelivery, PackageItem } from '../types/package';
import { OrderSummary } from '../types/order';
import { formatFcfa } from '../utils/currency';
import {
  notifyUser,
  requestNotificationPermission,
  unlockNotificationSound,
} from '../utils/notifications';

export interface ChatConversation {
  orderId: string;
  status: string;
  counterpart: { name: string; role: string; vehicleType?: string | null };
  pickup: string;
  delivery: string;
  lastMessage: { id: string; text: string; createdAt: string; mine: boolean } | null;
}

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  mine: boolean;
  sender: { name: string; role: string };
}

export interface ChatToast {
  id: number;
  title: string;
  body: string;
  orderId?: string;
}

interface ChatContextValue {
  conversations: ChatConversation[];
  unreadCount: number;
  unreadByOrder: Record<string, boolean>;
  panelOpen: boolean;
  activeOrderId: string | null;
  activeMessages: ChatMessage[];
  loadingMessages: boolean;
  toasts: ChatToast[];
  openPanel: () => void;
  closePanel: () => void;
  openChat: (orderId: string) => void;
  backToList: () => void;
  sendMessage: (text: string) => Promise<void>;
  dismissToast: (id: number) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const POLL_MS = 4000;
const MESSAGES_POLL_MS = 3500;

function lastSeenKey(userId: string) {
  return `chat_lastseen_${userId}`;
}

function loadLastSeen(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(lastSeenKey(userId));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const enabled = Boolean(user && (user.role === 'client' || user.role === 'driver' || user.role === 'merchant'));

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [toasts, setToasts] = useState<ChatToast[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  const initialized = useRef(false);
  const prevLastMessage = useRef<Map<string, string>>(new Map());
  const knownAvailable = useRef<Set<string>>(new Set());
  const knownStatuses = useRef<Map<string, string>>(new Map());
  const activeOrderRef = useRef<string | null>(null);
  const panelOpenRef = useRef(false);
  const toastSeq = useRef(0);

  activeOrderRef.current = activeOrderId;
  panelOpenRef.current = panelOpen;

  const markSeen = useCallback(
    (orderId: string, messageId: string) => {
      setLastSeen((prev) => {
        if (prev[orderId] === messageId) return prev;
        const next = { ...prev, [orderId]: messageId };
        if (user) {
          try {
            localStorage.setItem(lastSeenKey(user.id), JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    [user]
  );

  const pushToast = useCallback((title: string, body: string, orderId?: string) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, title, body, orderId }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
    notifyUser(title, body);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Réinitialise l'état suivi quand l'utilisateur change.
  useEffect(() => {
    initialized.current = false;
    prevLastMessage.current = new Map();
    knownAvailable.current = new Set();
    knownStatuses.current = new Map();
    setConversations([]);
    if (user) {
      setLastSeen(loadLastSeen(user.id));
    } else {
      setLastSeen({});
    }
  }, [user?.id]);

  // Débloque le son au premier geste utilisateur (politique navigateur).
  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Boucle de polling globale (conversations + missions + acceptation).
  useEffect(() => {
    if (!enabled || !user) return;

    requestNotificationPermission();

    const handleConversations = (list: ChatConversation[]) => {
      list.forEach((conv) => {
        const last = conv.lastMessage;
        if (!last) return;
        const previousId = prevLastMessage.current.get(conv.orderId);
        prevLastMessage.current.set(conv.orderId, last.id);
        if (last.mine) return;
        if (!initialized.current) return;
        if (previousId === last.id) return;

        // Si la conversation est ouverte à l'écran, on marque comme lu sans alerter.
        if (panelOpenRef.current && activeOrderRef.current === conv.orderId) {
          markSeen(conv.orderId, last.id);
          return;
        }
        pushToast(`Message de ${conv.counterpart.name}`, last.text, conv.orderId);
      });
      setConversations(list);
    };

    const pollDriverExtras = async () => {
      try {
        const { data: available } = await api.get<AvailableDelivery[]>('/deliveries/available');
        const currentIds = new Set(available.map((d) => d.id));
        const fresh = available.filter((d) => !knownAvailable.current.has(d.id));
        if (initialized.current && fresh.length > 0) {
          const m = fresh[0];
          pushToast(
            'Nouvelle mission disponible',
            `${m.order.vehicleType || 'Course'} · ${formatFcfa(m.order.estimatedPrice)}`
          );
        }
        knownAvailable.current = currentIds;
      } catch {
        // Non bloquant.
      }
    };

    const pollClientExtras = async () => {
      try {
        const { data: orders } = await api.get<OrderSummary[]>('/orders');
        orders.forEach((order) => {
          const previous = knownStatuses.current.get(order.id);
          if (initialized.current && previous === 'PENDING' && order.status === 'ASSIGNED') {
            pushToast('Livreur trouvé', 'Un livreur a accepté votre commande. Suivez-le en direct.');
          }
          knownStatuses.current.set(order.id, order.status);
        });
      } catch {
        // Non bloquant.
      }
    };

    const pollMerchantExtras = async () => {
      try {
        const { data: packages } = await api.get<PackageItem[]>('/packages');
        packages.forEach((pkg) => {
          if (!pkg.orderId || !pkg.order) return;
          const key = pkg.orderId;
          const previous = knownStatuses.current.get(key);
          const hasDriver = pkg.order.hasDriver || pkg.order.deliveryStatus === 'ACCEPTED';
          if (initialized.current && !previous && hasDriver) {
            pushToast('Livreur trouvé', 'Un livreur a accepté votre colis. Ouvrez la messagerie.');
          }
          knownStatuses.current.set(key, hasDriver ? 'ASSIGNED' : pkg.order.status);
        });
      } catch {
        // Non bloquant.
      }
    };

    const poll = async () => {
      try {
        const { data } = await api.get<ChatConversation[]>('/chat/conversations');
        handleConversations(data);
        if (user.role === 'driver') await pollDriverExtras();
        if (user.role === 'client') await pollClientExtras();
        if (user.role === 'merchant') await pollMerchantExtras();
        initialized.current = true;
      } catch {
        // Non bloquant.
      }
    };

    poll();
    const interval = window.setInterval(poll, POLL_MS);
    return () => window.clearInterval(interval);
  }, [enabled, user?.id, user?.role, pushToast, markSeen]);

  // Charge + rafraîchit le fil de la conversation ouverte.
  useEffect(() => {
    if (!panelOpen || !activeOrderId) return;

    let cancelled = false;
    setLoadingMessages(true);

    const loadThread = async () => {
      try {
        const { data } = await api.get<ChatMessage[]>(`/chat/orders/${activeOrderId}/messages`);
        if (cancelled) return;
        setActiveMessages(data);
        const last = data[data.length - 1];
        if (last) markSeen(activeOrderId, last.id);
      } catch {
        if (!cancelled) setActiveMessages([]);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    loadThread();
    const interval = window.setInterval(loadThread, MESSAGES_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [panelOpen, activeOrderId, markSeen]);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const backToList = useCallback(() => setActiveOrderId(null), []);

  const openChat = useCallback((orderId: string) => {
    setActiveOrderId(orderId);
    setPanelOpen(true);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !activeOrderId) return;
      const { data } = await api.post<ChatMessage>(`/chat/orders/${activeOrderId}/messages`, {
        text: trimmed,
      });
      setActiveMessages((prev) => [...prev, data]);
      markSeen(activeOrderId, data.id);
      prevLastMessage.current.set(activeOrderId, data.id);
      setConversations((prev) => {
        const exists = prev.some((c) => c.orderId === activeOrderId);
        if (exists) {
          return prev.map((c) =>
            c.orderId === activeOrderId
              ? {
                  ...c,
                  lastMessage: {
                    id: data.id,
                    text: data.text,
                    createdAt: data.createdAt,
                    mine: true,
                  },
                }
              : c
          );
        }
        return prev;
      });
    },
    [activeOrderId, markSeen]
  );

  const unreadByOrder = useMemo(() => {
    const map: Record<string, boolean> = {};
    conversations.forEach((conv) => {
      const last = conv.lastMessage;
      map[conv.orderId] = Boolean(last && !last.mine && lastSeen[conv.orderId] !== last.id);
    });
    return map;
  }, [conversations, lastSeen]);

  const unreadCount = useMemo(
    () => Object.values(unreadByOrder).filter(Boolean).length,
    [unreadByOrder]
  );

  const value: ChatContextValue = {
    conversations,
    unreadCount,
    unreadByOrder,
    panelOpen,
    activeOrderId,
    activeMessages,
    loadingMessages,
    toasts,
    openPanel,
    closePanel,
    openChat,
    backToList,
    sendMessage,
    dismissToast,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat doit être utilisé dans un ChatProvider');
  }
  return ctx;
}
