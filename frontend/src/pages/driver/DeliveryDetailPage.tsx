import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, Navigation, CheckCircle, AlertTriangle, Play, Radio, Wallet } from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import OrderChat from '../../components/OrderChat';
import RouteMap from '../../components/maps/RouteMap';
import { DriverDelivery } from '../../types/package';
import { STATUS_LABELS } from '../../types/order';
import { formatFcfa } from '../../utils/currency';
import { PAYMENT_OPTIONS, PaymentMethod } from '../../constants/payment';

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<DriverDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [gpsOn, setGpsOn] = useState(false);
  const statusRef = useRef<string>('');

  async function load() {
    if (!id) return;
    const { data } = await api.get<DriverDelivery>(`/deliveries/${id}`);
    statusRef.current = data.status;
    setDelivery(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    const interval = setInterval(() => load().catch(() => {}), 10000);
    return () => clearInterval(interval);
  }, [id]);

  // Envoi de la position GPS toutes les 5s tant que la course est active.
  useEffect(() => {
    if (!id || !('geolocation' in navigator)) return;
    const sendPosition = () => {
      const active = statusRef.current === 'ACCEPTED' || statusRef.current === 'IN_PROGRESS';
      if (!active) {
        setGpsOn(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsOn(true);
          api
            .post(`/deliveries/${id}/location`, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            })
            .catch(() => {});
        },
        () => setGpsOn(false),
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 }
      );
    };
    sendPosition();
    const gpsInterval = setInterval(sendPosition, 5000);
    return () => clearInterval(gpsInterval);
  }, [id]);

  async function confirmPayment() {
    if (!id) return;
    setUpdating(true);
    try {
      await api.post(`/deliveries/${id}/confirm-payment`);
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Confirmation impossible');
    } finally {
      setUpdating(false);
    }
  }

  async function updateStatus(status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED') {
    if (!id) return;
    setUpdating(true);
    try {
      await api.patch(`/deliveries/${id}/status`, { status });
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Mise à jour impossible');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Mission en cours">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        </div>
      </AppLayout>
    );
  }

  if (!delivery) {
    return (
      <AppLayout title="Mission">
        <p className="text-red-600">Livraison introuvable</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mission en cours">
      <Link to="/driver/mine" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← Mes livraisons
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-orange-600">Mission #{delivery.id.slice(0, 8)}</p>
          <h2 className="text-xl font-bold">{delivery.order.pickup} → {delivery.order.delivery}</h2>
        </div>
        <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800">
          {STATUS_LABELS[delivery.status] || delivery.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg lg:row-span-2">
          {delivery.pickupCoords && delivery.deliveryCoords ? (
            <RouteMap
              pickup={{ lat: delivery.pickupCoords.lat, lng: delivery.pickupCoords.lng, label: delivery.order.pickup }}
              delivery={{ lat: delivery.deliveryCoords.lat, lng: delivery.deliveryCoords.lng, label: delivery.order.delivery }}
              height="400px"
            />
          ) : (
            <RouteMap height="400px" />
          )}
          <p className="bg-brand-900 py-2 text-center text-xs text-white/70">
            <Navigation className="mr-1 inline h-3 w-3" /> Itinéraire Lomé — navigation
          </p>
        </div>

        <div className="space-y-4">
          {(delivery.status === 'ACCEPTED' || delivery.status === 'IN_PROGRESS') && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                gpsOn ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <Radio className={`h-4 w-4 ${gpsOn ? 'animate-pulse' : ''}`} />
              {gpsOn
                ? 'Position GPS partagée avec le client (toutes les 5s)'
                : 'Activez la localisation pour partager votre position'}
            </div>
          )}

          {delivery.order.estimatedPrice != null && (
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
              <p className="text-sm text-white/80">Montant de la course</p>
              <p className="text-3xl font-bold">{formatFcfa(delivery.order.estimatedPrice)}</p>
              {delivery.payment && (
                <p className="mt-1 text-xs text-white/85">
                  {PAYMENT_OPTIONS[(delivery.payment.method as PaymentMethod) || 'CASH'].icon}{' '}
                  {PAYMENT_OPTIONS[(delivery.payment.method as PaymentMethod) || 'CASH'].label} ·{' '}
                  {delivery.payment.status === 'COLLECTED' ? 'encaissé' : 'à encaisser'}
                </p>
              )}
            </div>
          )}

          {delivery.payment && delivery.payment.status === 'COLLECTED' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-emerald-800">
                <Wallet className="h-4 w-4" /> Paiement encaissé
              </p>
              <div className="mt-2 space-y-1 text-slate-600">
                <p>Commission kikchee : {formatFcfa(delivery.payment.commissionAmount)}</p>
                <p className="font-semibold text-emerald-700">
                  Votre net : {formatFcfa(delivery.payment.driverPayout)}
                </p>
              </div>
            </div>
          ) : (
            delivery.status === 'IN_PROGRESS' && (
              <button
                onClick={confirmPayment}
                disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white py-3 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                <Wallet className="h-4 w-4" /> Confirmer le paiement reçu
              </button>
            )
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Collecte</p>
              <p className="mt-1 text-sm font-medium">{delivery.order.pickup}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs text-red-700">Livraison</p>
              <p className="mt-1 text-sm font-medium">{delivery.order.delivery}</p>
            </div>
          </div>

          {delivery.clientPhone && (
            <a
              href={`tel:${delivery.clientPhone}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
            >
              <Phone className="h-5 w-5 text-brand-600" />
              <span className="font-medium">{delivery.clientPhone}</span>
            </a>
          )}

          <div className="flex flex-col gap-2">
            {delivery.status === 'ACCEPTED' && (
              <button
                onClick={() => updateStatus('IN_PROGRESS')}
                disabled={updating}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> Démarrer la livraison
              </button>
            )}
            {delivery.status === 'IN_PROGRESS' && (
              <>
                <button
                  onClick={() => updateStatus('COMPLETED')}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" /> Colis livré
                </button>
                <button
                  onClick={() => updateStatus('FAILED')}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-300 py-3 text-red-600 hover:bg-red-50"
                >
                  <AlertTriangle className="h-4 w-4" /> Signaler incident
                </button>
              </>
            )}
          </div>

          <OrderChat orderId={delivery.orderId} enabled />
        </div>
      </div>

      {delivery.timeline && delivery.timeline.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">Historique</h3>
          <ol className="relative mt-4 border-l-2 border-orange-200 pl-6">
            {delivery.timeline.map((step, i) => (
              <li key={i} className="mb-4 ml-2">
                <span className="absolute -left-[9px] mt-1 h-4 w-4 rounded-full bg-orange-500" />
                <p className="font-medium">{STATUS_LABELS[step.status] || step.status}</p>
                {step.note && <p className="text-sm text-slate-600">{step.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </AppLayout>
  );
}
