import { FormEvent, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Loader2, Truck, MapPin } from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import OrderMapEditor, { MapEditMode } from '../../components/maps/OrderMapEditor';
import AddressSearch, { normalizeAddress, type GeocodeResult } from '../../components/AddressSearch';
import VehiclePicker from '../../components/VehiclePicker';
import PaymentPicker from '../../components/PaymentPicker';
import { TOGO_CENTER } from '../../constants/togo';
import { AddressInput, PricingEstimate } from '../../types/order';
import { formatFcfa } from '../../utils/currency';
import { addressFromMapClick, calculateLocalPrice } from '../../utils/geo';
import { VehicleType, VEHICLE_OPTIONS } from '../../constants/vehicles';
import { PaymentMethod } from '../../constants/payment';

const WEIGHT_PRESETS = [
  { id: 'light', label: 'Léger', hint: '≤ 2 kg', kg: 1.5 },
  { id: 'medium', label: 'Moyen', hint: '2-5 kg', kg: 3 },
  { id: 'heavy', label: 'Lourd', hint: '5+ kg', kg: 8 },
];

const emptyAddress = (): AddressInput => ({
  street: '',
  city: 'Lomé',
  postalCode: 'BP',
  latitude: TOGO_CENTER.lat,
  longitude: TOGO_CENTER.lng,
  label: '',
});

interface PricingEstimateFull extends PricingEstimate {
  currency?: string;
}

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState<AddressInput>(emptyAddress());
  const [delivery, setDelivery] = useState<AddressInput>({
    ...emptyAddress(),
    latitude: TOGO_CENTER.lat + 0.01,
    longitude: TOGO_CENTER.lng + 0.01,
  });
  const [pickupOk, setPickupOk] = useState(false);
  const [deliveryOk, setDeliveryOk] = useState(false);
  const [weight, setWeight] = useState(2.5);
  const [weightPreset, setWeightPreset] = useState('light');
  const [vehicleType, setVehicleType] = useState<VehicleType>('TAXI');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [estimate, setEstimate] = useState<PricingEstimateFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapTarget, setMapTarget] = useState<MapEditMode>('pickup');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);

  // Point bleu permanent = position GPS en direct
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* GPS refusé ou indisponible — le point bleu reste masqué */
      },
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function resolveAddress(lat: number, lng: number): Promise<AddressInput> {
    try {
      const { data } = await api.get<GeocodeResult>('/geocode/reverse', { params: { lat, lng } });
      return {
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        label: data.label,
      };
    } catch {
      return addressFromMapClick(lat, lng);
    }
  }

  async function applyAddress(mode: MapEditMode, addr: AddressInput) {
    if (mode === 'pickup') {
      setPickup(addr);
      setPickupOk(true);
    } else {
      setDelivery(addr);
      setDeliveryOk(true);
    }
  }

  async function handleMapPick(mode: MapEditMode, lat: number, lng: number) {
    setError('');
    const addr = await resolveAddress(lat, lng);
    await applyAddress(mode, addr);
  }

  async function useCurrentLocationFor(mode: MapEditMode) {
    if (!currentLocation) {
      setError('Position GPS indisponible. Autorisez la localisation dans votre navigateur.');
      return;
    }
    setError('');
    const addr = await resolveAddress(currentLocation.lat, currentLocation.lng);
    await applyAddress(mode, {
      ...addr,
      street: addr.street || 'Ma position actuelle',
      label: addr.label || 'Position actuelle',
    });
  }

  function handleLocateOnMap() {
    setError('');
    setLocating(true);

    const go = (lat: number, lng: number) => {
      setCurrentLocation({ lat, lng });
      setFlyTo({ lat, lng, key: Date.now() });
      setLocating(false);
    };

    if (currentLocation) {
      go(currentLocation.lat, currentLocation.lng);
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocating(false);
      setError('Géolocalisation non disponible sur cet appareil.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => go(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLocating(false);
        setError('Autorisez la localisation pour utiliser le bouton bleu.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  const canPrice = pickupOk && deliveryOk;

  const livePreview = useMemo(() => {
    if (!canPrice) return null;
    return calculateLocalPrice(pickup, delivery, weight, vehicleType);
  }, [pickup, delivery, weight, vehicleType, canPrice]);

  const runEstimate = useCallback(async () => {
    if (!canPrice) {
      setEstimate(null);
      return;
    }
    const p = normalizeAddress(pickup);
    const d = normalizeAddress(delivery);
    try {
      const { data } = await api.post<PricingEstimateFull>('/orders/estimate', {
        pickupAddress: p,
        deliveryAddress: d,
        weight,
        vehicleType,
      });
      setEstimate(data);
    } catch {
      setEstimate(livePreview ? { ...livePreview, currency: 'XOF' } : null);
    }
  }, [pickup, delivery, weight, vehicleType, canPrice, livePreview]);

  useEffect(() => {
    const t = setTimeout(runEstimate, 400);
    return () => clearTimeout(t);
  }, [runEstimate]);

  const displayEstimate = estimate ?? (livePreview ? { ...livePreview, currency: 'XOF' as const } : null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canPrice) {
      setError('Recherchez et sélectionnez les deux adresses (départ + livraison).');
      return;
    }
    if (!displayEstimate?.estimatedPrice) {
      setError('Impossible de calculer le tarif. Vérifiez les adresses.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fullDescription = [description.trim(), instructions.trim() && `Instructions : ${instructions.trim()}`]
        .filter(Boolean)
        .join('\n');
      const { data } = await api.post('/orders', {
        pickupAddress: normalizeAddress(pickup),
        deliveryAddress: normalizeAddress(delivery),
        weight,
        vehicleType,
        paymentMethod,
        description: fullDescription || undefined,
      });
      navigate(`/client/orders/${data.id}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Nouvelle commande">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
          <OrderMapEditor
            pickup={{
              lat: pickup.latitude,
              lng: pickup.longitude,
              label: pickup.label || pickup.street || 'Collecte',
            }}
            delivery={{
              lat: delivery.latitude,
              lng: delivery.longitude,
              label: delivery.label || delivery.street || 'Livraison',
            }}
            currentLocation={currentLocation}
            mode={mapTarget}
            onPick={handleMapPick}
            showControls
            onLocate={handleLocateOnMap}
            locating={locating}
            flyTo={flyTo}
            height="260px"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMapTarget('pickup')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mapTarget === 'pickup'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Collecte
          </button>
          <button
            type="button"
            onClick={() => setMapTarget('delivery')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mapTarget === 'delivery'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Livraison
          </button>
          <button
            type="button"
            onClick={() => useCurrentLocationFor(mapTarget)}
            disabled={!currentLocation}
            className="ml-1 rounded-lg px-3 text-xs font-medium text-blue-700 hover:bg-white disabled:opacity-40"
          >
            Utiliser ma position
          </button>
        </div>
        <p className="text-center text-xs text-slate-500">
          Bouton bleu (coin bas-droit) = centrer sur vous · Cliquez sur la carte pour le pin{' '}
          {mapTarget === 'pickup' ? 'vert' : 'rouge'}
        </p>

        <div className="rounded-2xl bg-brand-800 p-5 text-white">
          <p className="text-xs uppercase tracking-wider text-white/70">Tarif automatique</p>
          {!canPrice ? (
            <p className="mt-2 text-lg text-white/90">Indiquez départ et arrivée pour voir le prix</p>
          ) : (
            <>
              <p className="text-3xl font-bold">{formatFcfa(displayEstimate?.estimatedPrice)}</p>
              <p className="text-sm text-white/80">
                {livePreview?.distanceKm.toFixed(2)} km · ~{livePreview?.estimatedMinutes} min
              </p>
            </>
          )}
        </div>

        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <AddressSearch
            label="Où collecter ?"
            hint="Tapez l'adresse de départ — validez même si absente de la carte"
            accent="emerald"
            value={pickup}
            onChange={setPickup}
            onGeocoded={setPickupOk}
          />

          <AddressSearch
            label="Où livrer ?"
            hint="Tapez la destination — saisie manuelle acceptée"
            accent="red"
            value={delivery}
            onChange={setDelivery}
            onGeocoded={setDeliveryOk}
          />

          <VehiclePicker value={vehicleType} onChange={setVehicleType} />

          <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Package className="h-4 w-4" /> Poids du colis
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {WEIGHT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setWeightPreset(p.id);
                    setWeight(p.kg);
                  }}
                  className={`rounded-xl border px-2 py-2 text-center transition ${
                    weightPreset === p.id
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.hint}</p>
                </button>
              ))}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du colis (ex: carton de vêtements)"
              className="mt-3 w-full rounded-xl border px-3 py-2.5 text-sm"
              rows={2}
            />
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions spéciales (Fragile, étage, code portail…)"
              className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              rows={2}
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
            <Truck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Votre demande sera envoyée aux livreurs{' '}
              <strong>{VEHICLE_OPTIONS[vehicleType].label.toLowerCase()}</strong> proches. Le premier qui
              accepte prend la course au prix affiché.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !canPrice}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-lg font-bold text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" /> Publication…
              </>
            ) : (
              <>
                <MapPin className="h-6 w-6" />
                Publier la commande — {formatFcfa(displayEstimate?.estimatedPrice)}
              </>
            )}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
