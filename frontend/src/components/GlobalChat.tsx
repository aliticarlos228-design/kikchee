import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, ChevronLeft, Truck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { STATUS_LABELS } from '../types/order';

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function GlobalChat() {
  const { user } = useAuth();
  const {
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
  } = useChat();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeOrderId]);

  if (!user || (user.role !== 'client' && user.role !== 'driver' && user.role !== 'merchant')) return null;

  const activeConversation = conversations.find((c) => c.orderId === activeOrderId) || null;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendMessage(trimmed);
      setText('');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Toasts cliquables */}
      <div className="pointer-events-none fixed right-4 top-20 z-[80] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.orderId) openChat(t.orderId);
              else openPanel();
              dismissToast(t.id);
            }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-left shadow-xl transition hover:border-emerald-400"
          >
            <span className="mt-0.5 text-lg">🔔</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">{t.title}</span>
              <span className="block truncate text-xs text-slate-500">{t.body}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Bouton flottant */}
      {!panelOpen && (
        <button
          type="button"
          onClick={openPanel}
          className="fixed bottom-20 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transition hover:bg-emerald-600 lg:bottom-6"
          aria-label="Ouvrir la messagerie"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Panneau de discussion */}
      {panelOpen && (
        <div className="fixed inset-0 z-[75] flex justify-end">
          <button
            type="button"
            aria-label="Fermer la messagerie"
            onClick={closePanel}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="relative flex h-full w-full flex-col bg-white shadow-2xl sm:w-[26rem]">
            {/* En-tête */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-brand-900 px-4 py-3 text-white">
              {activeOrderId ? (
                <button
                  type="button"
                  onClick={backToList}
                  className="rounded-lg p-1.5 hover:bg-white/10"
                  aria-label="Retour aux conversations"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <MessageCircle className="h-5 w-5 text-emerald-300" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {activeConversation ? activeConversation.counterpart.name : 'Messagerie'}
                </p>
                <p className="truncate text-xs text-white/60">
                  {activeConversation
                    ? STATUS_LABELS[activeConversation.status] || activeConversation.status
                    : `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg p-1.5 hover:bg-white/10"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Liste des conversations */}
            {!activeOrderId && (
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center text-slate-400">
                    <MessageCircle className="mb-3 h-10 w-10" />
                    <p className="text-sm">
                      Aucune conversation pour l’instant. La discussion s’ouvre dès qu’une commande est
                      acceptée par un livreur.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {conversations.map((conv) => {
                      const unread = unreadByOrder[conv.orderId];
                      return (
                        <li key={conv.orderId}>
                          <button
                            type="button"
                            onClick={() => openChat(conv.orderId)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <span
                              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                                conv.counterpart.role === 'driver'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-brand-100 text-brand-700'
                              }`}
                            >
                              {conv.counterpart.role === 'driver' ? (
                                <Truck className="h-5 w-5" />
                              ) : (
                                <UserIcon className="h-5 w-5" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900">
                                  {conv.counterpart.name}
                                </span>
                                {conv.lastMessage && (
                                  <span className="flex-shrink-0 text-[10px] text-slate-400">
                                    {timeLabel(conv.lastMessage.createdAt)}
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center justify-between gap-2">
                                <span
                                  className={`truncate text-xs ${
                                    unread ? 'font-semibold text-slate-800' : 'text-slate-500'
                                  }`}
                                >
                                  {conv.lastMessage
                                    ? `${conv.lastMessage.mine ? 'Vous : ' : ''}${conv.lastMessage.text}`
                                    : 'Démarrez la discussion'}
                                </span>
                                {unread && (
                                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
                                )}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Fil de discussion */}
            {activeOrderId && (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
                  {loadingMessages && activeMessages.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>
                  )}
                  {!loadingMessages && activeMessages.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">
                      Aucun message. Écrivez le premier message.
                    </p>
                  )}
                  {activeMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          m.mine
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        {!m.mine && (
                          <p className="mb-0.5 text-[10px] font-semibold text-slate-400">{m.sender.name}</p>
                        )}
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <p className={`mt-1 text-[10px] ${m.mine ? 'text-white/70' : 'text-slate-400'}`}>
                          {timeLabel(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3 pb-24 lg:pb-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Écrire un message…"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
