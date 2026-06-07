import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation, Star, MapPin, Clock, Zap, Trophy } from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { DeliveriesOverviewMap } from '../../components/maps/OrderMapEditor';
import { AvailableDelivery } from '../../types/package';
import { VEHICLE_LABELS, VehicleType } from '../../constants/vehicles';
import { formatFcfa } from '../../utils/currency';

export default function AvailableDeliveriesPage() {
  const { user } = useAuth();
  const vehicleLabel =
    user?.vehicleType && VEHICLE_LABELS[user.vehicleType as VehicleType]
      ? VEHICLE_LABELS[user.vehicleType as VehicleType].toLowerCase()
      : 'véhicule';
  const [deliveries, setDeliveries] = useState<AvailableDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMissionNotice, setNewMissionNotice] = useState('');
  const knownMissionIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  async function load() {
    try {
      const { data } = await api.get<AvailableDelivery[]>('/deliveries/available');
      const currentIds = new Set(data.map((d) => d.id));
      const newMissions = data.filter((d) => !knownMissionIds.current.has(d.id));

      if (initialized.current && newMissions.length > 0) {
        const mission = newMissions[0];
        const message = `Nouvelle course ${mission.order.vehicleType || ''} disponible à ${formatFcfa(
          mission.order.estimatedPrice
        )}`;
        setNewMissionNotice(message);
        window.setTimeout(() => setNewMissionNotice(''), 7000);
      }

      knownMissionIds.current = currentIds;
      initialized.current = true;
      setDeliveries(data);
      if (data.length && !selectedId) setSelectedId(data[0].id);
    } catch {
      setError('Impossible de charger les livraisons');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleAccept(orderId: string) {
    setAccepting(orderId);
    try {
      await api.post(`/deliveries/${orderId}/accept`);
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(msg || 'Course déjà prise par un autre livreur');
    } finally {
      setAccepting(null);
    }
  }

  const mapPoints = deliveries
    .filter((d) => d.pickupLatitude != null)
    .map((d, i) => ({
      id: d.id,
      lat: d.pickupLatitude!,
      lng: d.pickupLongitude!,
      label: d.order.pickup,
      distanceKm: d.distanceKm,
      rank: i + 1,
    }));

  const selected = deliveries.find((d) => d.id === selectedId);

  return (
    <AppLayout title="Missions disponibles">
      <Link to="/driver" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← Accueil livreur
      </Link>

      {newMissionNotice && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
          🔔 {newMissionNotice}
        </div>
      )}

      {/* Stats livreur */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white">
          <Zap className="h-5 w-5" />
          <p className="mt-2 text-2xl font-bold">{deliveries.length}</p>
          <p className="text-xs text-white/80">Missions dispo</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <Navigation className="h-5 w-5 text-orange-600" />
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {deliveries[0]?.distanceKm ?? '—'} km
          </p>
          <p className="text-xs text-slate-500">Plus proche</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <p className="mt-2 text-sm font-bold text-slate-900">Tri intelligent</p>
          <p className="text-xs text-slate-500">Haversine BF-19</p>
        </div>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        </div>
      )}
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && deliveries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">
            Aucune mission {vehicleLabel} pour le moment
          </p>
          <p className="text-sm text-slate-400">
            Seules les courses correspondant à votre type de véhicule ({vehicleLabel}) sont affichées
          </p>
        </div>
      )}

      {deliveries.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          <DeliveriesOverviewMap
            points={mapPoints}
            selectedId={selectedId ?? undefined}
            height="380px"
          />

          <div className="space-y-3">
            {deliveries.map((d, index) => (
              <div
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  selectedId === d.id
                    ? 'border-orange-400 bg-orange-50 shadow-md ring-2 ring-orange-200'
                    : 'border-slate-200 bg-white hover:border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      {d.suggestedDriver?.isYou && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <Star className="h-3 w-3" /> Recommandé pour vous
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-medium text-slate-900">
                      {d.order.pickup} → {d.order.delivery}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Client : {d.order.client}</p>
                    {d.order.vehicleType && (
                      <p className="mt-1 text-xs font-medium text-brand-700">
                        {VEHICLE_LABELS[d.order.vehicleType as VehicleType] || d.order.vehicleType}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      {d.distanceKm != null && (
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" /> {d.distanceKm} km
                        </span>
                      )}
                      <span>{d.order.weight} kg</span>
                      {d.order.estimatedMinutes != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> ~{d.order.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {d.order.estimatedPrice != null && (
                      <p className="text-lg font-bold text-brand-700">
                        {formatFcfa(d.order.estimatedPrice)}
                      </p>
                    )}
                    {d.order.packageReady && (
                      <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Colis prêt ✓
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(d.orderId);
                  }}
                  disabled={accepting === d.orderId}
                  className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {accepting === d.orderId
                    ? 'Acceptation…'
                    : `Accepter la course — ${formatFcfa(d.order.estimatedPrice)}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected?.suggestedDriver && (
        <p className="mt-4 text-center text-xs text-slate-500">
          Algorithme BF-19 : livreur le plus proche = {selected.suggestedDriver.name} (
          {selected.suggestedDriver.distanceKm} km)
        </p>
      )}
    </AppLayout>
  );
}
