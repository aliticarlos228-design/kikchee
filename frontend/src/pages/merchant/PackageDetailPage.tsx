import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Truck, MessageCircle, Radio, CheckCircle2, User, Phone } from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import OrderChat from '../../components/OrderChat';
import RouteMap from '../../components/maps/RouteMap';
import { PackageDetail, PACKAGE_STATUS_LABELS } from '../../types/package';
import { STATUS_LABELS } from '../../types/order';
import { formatFcfa } from '../../utils/currency';
import { shortRef } from '../../utils/reference';
import { whatsappLink } from '../../utils/whatsapp';
import { VEHICLE_LABELS, VehicleType } from '../../constants/vehicles';

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingReady, setMarkingReady] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data: pkg } = await api.get<PackageDetail>(`/packages/${id}`);
    setData(pkg);
  }, [id]);

  useEffect(() => {
    load().catch(() => setError('Colis introuvable')).finally(() => setLoading(false));
    const interval = setInterval(() => load().catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleMarkReady() {
    if (!id) return;
    setMarkingReady(true);
    try {
      await api.patch(`/packages/${id}/status`, { status: 'READY' });
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Mise à jour impossible');
    } finally {
      setMarkingReady(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Détail colis">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="Détail colis">
        <p className="text-red-600">{error}</p>
        <Link to="/merchant/packages" className="mt-4 inline-block text-brand-600 hover:underline">
          ← Mes colis
        </Link>
      </AppLayout>
    );
  }

  const order = data.orderDetail;
  const driver = order?.deliveryInfo?.driver;
  const driverLat = order?.deliveryInfo?.driverLat;
  const driverLng = order?.deliveryInfo?.driverLng;
  const hasLivePosition = driverLat != null && driverLng != null;

  return (
    <AppLayout title="Suivi colis">
      <Link to="/merchant/packages" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        ← Mes colis
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-emerald-700">Colis</p>
                <h2 className="text-xl font-bold">Colis {shortRef(data.id)}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {PACKAGE_STATUS_LABELS[data.status] || data.status} · {data.weight} kg
                </p>
              </div>
              {order && (
                <span className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-800">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              )}
            </div>

            {data.description && (
              <p className="mt-4 text-sm text-slate-600">{data.description}</p>
            )}

            {order && (
              <>
                {(order.isExternalCustomer || order.client) && (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs font-medium uppercase text-emerald-800">Destinataire</p>
                    {order.isExternalCustomer ? (
                      <div className="mt-2 space-y-1">
                        <p className="flex items-center gap-2 font-medium text-slate-900">
                          <User className="h-4 w-4" /> {order.recipientName}
                        </p>
                        {order.recipientPhone && (
                          <p className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4" /> {order.recipientPhone}
                          </p>
                        )}
                      </div>
                    ) : order.client ? (
                      <p className="mt-2 font-medium">
                        {order.client.firstName} {order.client.lastName}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <MapPin className="h-3 w-3" /> Départ
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
                        <span className="ml-3 text-sm font-normal text-slate-500">
                          ~{order.estimatedMinutes} min
                        </span>
                      )}
                    </p>
                    {order.vehicleType && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {VEHICLE_LABELS[order.vehicleType as VehicleType] || order.vehicleType}
                      </span>
                    )}
                  </div>
                )}

                {driver ? (
                  <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-brand-600" />
                      <div>
                        <p className="text-xs font-medium text-brand-700">
                          Livreur assigné
                          {driver.vehicleType &&
                            ` (${VEHICLE_LABELS[driver.vehicleType as VehicleType] || driver.vehicleType})`}
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
                          `Bonjour, au sujet du colis kikchee ${shortRef(data.id)}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp livreur
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    En attente d&apos;un livreur
                    {order.vehicleType && (
                      <>
                        {' '}
                        <span className="font-medium">
                          ({VEHICLE_LABELS[order.vehicleType as VehicleType] || order.vehicleType})
                        </span>
                      </>
                    )}
                    …
                  </div>
                )}
              </>
            )}

            {!order && (
              <p className="mt-4 text-sm text-slate-500">
                Ce colis n&apos;est pas encore lié à une commande de livraison.
              </p>
            )}

            {data.orderId && data.status === 'CREATED' && (
              <button
                type="button"
                onClick={handleMarkReady}
                disabled={markingReady}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {markingReady ? 'Mise à jour…' : 'Marquer comme prêt'}
              </button>
            )}
          </div>

          {order && (
            <OrderChat
              orderId={order.id}
              enabled={Boolean(driver)}
              unavailableText="La messagerie s’ouvre dès qu’un livreur accepte ce colis."
            />
          )}

          {order && order.timeline.length > 0 && (
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
          )}
        </div>

        {order && (
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
                  ? { lat: driverLat as number, lng: driverLng as number, label: 'Livreur' }
                  : null
              }
              height="480px"
            />
            <p className="bg-brand-900 py-2 text-center text-xs text-white/70">
              {hasLivePosition ? 'Position livreur en direct' : 'Suivi cartographique · rafraîchissement auto'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
