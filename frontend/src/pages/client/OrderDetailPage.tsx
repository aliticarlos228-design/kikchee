import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Truck, MessageCircle, Radio, X } from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import OrderChat from '../../components/OrderChat';
import RouteMap from '../../components/maps/RouteMap';
import { OrderDetail, STATUS_LABELS } from '../../types/order';
import { formatFcfa } from '../../utils/currency';
import { whatsappLink } from '../../utils/whatsapp';
import { VEHICLE_LABELS, VehicleType } from '../../constants/vehicles';
import { PAYMENT_OPTIONS, PAYMENT_STATUS_LABELS, PaymentMethod } from '../../constants/payment';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<OrderDetail>(`/orders/${id}`);
    setOrder(data);
  }, [id]);

  useEffect(() => {
    load().catch(() => setError('Commande introuvable')).finally(() => setLoading(false));
    const interval = setInterval(() => load().catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Annulation impossible');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Suivi en direct">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !order) {
    return (
      <AppLayout title="Suivi">
        <p className="text-red-600">{error}</p>
        <Link to="/client/orders" className="mt-4 inline-block text-brand-600 hover:underline">
          ← Retour
        </Link>
      </AppLayout>
    );
  }

  const driver = order.deliveryInfo?.driver;
  const driverLat = order.deliveryInfo?.driverLat;
  const driverLng = order.deliveryInfo?.driverLng;
  const hasLivePosition = driverLat != null && driverLng != null;

  const canCancel = order.status === 'PENDING';

  const paymentMethod = (order.paymentMethod as PaymentMethod) || 'CASH';

  return (
    <AppLayout title="Suivi en direct — Lomé">
      <Link to="/client/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        ← Mes commandes
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-brand-600">Commande</p>
                <h2 className="text-xl font-bold">#{order.id.slice(0, 8)}</h2>
              </div>
              <span className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-800">
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <MapPin className="h-3 w-3" /> Collecte
                </p>
                <p className="mt-1 font-medium">{order.pickupAddress.street}</p>
                <p className="text-sm text-slate-600">{order.pickupAddress.city}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4">
                <p className="flex items-center gap-1 text-xs font-medium text-red-700">
                  <MapPin className="h-3 w-3" /> Livraison
                </p>
                <p className="mt-1 font-medium">{order.deliveryAddress.street}</p>
                <p className="text-sm text-slate-600">{order.deliveryAddress.city}</p>
              </div>
            </div>

            {order.estimatedPrice != null && order.estimatedPrice > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-lg font-bold text-brand-700">
                  {formatFcfa(order.estimatedPrice)}
                  {order.estimatedMinutes != null && (
                    <span className="ml-3 text-sm font-normal text-slate-500">~{order.estimatedMinutes} min</span>
                  )}
                </p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {PAYMENT_OPTIONS[paymentMethod].icon} {PAYMENT_OPTIONS[paymentMethod].label} ·{' '}
                  {PAYMENT_STATUS_LABELS[order.paymentStatus || 'PENDING']}
                </span>
              </div>
            )}

            {driver ? (
              <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-xs font-medium text-brand-700">
                      Votre livreur a accepté
                      {driver.vehicleType && ` (${VEHICLE_LABELS[driver.vehicleType as VehicleType] || driver.vehicleType})`}
                    </p>
                    <p className="font-medium">
                      {driver.firstName} {driver.lastName}
                    </p>
                    {driver.phone && <p className="text-sm text-slate-600">{driver.phone}</p>}
                  </div>
                </div>
                {hasLivePosition && order.status === 'IN_TRANSIT' && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Radio className="h-3 w-3 animate-pulse" /> Position en direct sur la carte
                  </p>
                )}
                {driver.phone && (
                  <a
                    href={whatsappLink(
                      driver.phone,
                      `Bonjour, au sujet de ma commande kikchee #${order.id.slice(0, 8)}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
                  >
                    <MessageCircle className="h-4 w-4" /> Contacter via WhatsApp
                  </a>
                )}
              </div>
            ) : order.status === 'CANCELLED' ? (
              <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                Commande annulée.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  Demande envoyée aux livreurs{' '}
                  {order.vehicleType && (
                    <span className="font-medium">
                      {VEHICLE_LABELS[order.vehicleType as VehicleType] || order.vehicleType}
                    </span>
                  )}{' '}
                  proches… Vous serez notifié dès qu’un livreur accepte.
                </div>
                {canCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    {cancelling ? 'Annulation…' : 'Annuler / supprimer la demande'}
                  </button>
                )}
              </div>
            )}
          </div>

          <OrderChat
            orderId={order.id}
            enabled={Boolean(driver)}
            unavailableText="Le chat s’ouvre automatiquement dès qu’un livreur accepte votre demande."
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Historique</h3>
            <ol className="relative mt-4 border-l-2 border-brand-200 pl-6">
              {order.timeline.map((step, i) => (
                <li key={i} className="mb-5 ml-2">
                  <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full bg-brand-600 ring-4 ring-white" />
                  <p className="font-medium">{STATUS_LABELS[step.status] || step.status}</p>
                  {step.note && <p className="text-sm text-slate-600">{step.note}</p>}
                  <p className="text-xs text-slate-400">{new Date(step.at).toLocaleString('fr-FR')}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
          <RouteMap
            pickup={{
              lat: order.pickupAddress.latitude,
              lng: order.pickupAddress.longitude,
              label: order.pickupAddress.street,
            }}
            delivery={{
              lat: order.deliveryAddress.latitude,
              lng: order.deliveryAddress.longitude,
              label: order.deliveryAddress.street,
            }}
            driver={
              hasLivePosition
                ? { lat: driverLat as number, lng: driverLng as number, label: 'Votre livreur' }
                : null
            }
            height="480px"
          />
          <p className="bg-brand-900 py-2 text-center text-xs text-white/70">
            {hasLivePosition
              ? 'Position du livreur mise à jour en direct'
              : 'Suivi cartographique · rafraîchissement auto'}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
