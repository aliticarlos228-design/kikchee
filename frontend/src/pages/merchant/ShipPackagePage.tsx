import { FormEvent, useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Package, Loader2, Truck } from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import OrderMapEditor, { MapEditMode } from '../../components/maps/OrderMapEditor';
import AddressSearch, { normalizeAddress, type GeocodeResult } from '../../components/AddressSearch';
import VehiclePicker from '../../components/VehiclePicker';
import { TOGO_CENTER } from '../../constants/togo';
import { VehicleType, VEHICLE_OPTIONS } from '../../constants/vehicles';
import { AddressInput } from '../../types/order';
import { addressFromMapClick, calculateLocalPrice } from '../../utils/geo';
import { formatFcfa } from '../../utils/currency';

const emptyAddress = (): AddressInput => ({
  street: '',
  city: 'Lomé',
  postalCode: 'BP',
  latitude: TOGO_CENTER.lat,
  longitude: TOGO_CENTER.lng,
  label: '',
});

export default function ShipPackagePage() {
  const navigate = useNavigate();
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [pickup, setPickup] = useState<AddressInput>(emptyAddress());
  const [delivery, setDelivery] = useState<AddressInput>({
    ...emptyAddress(),
    latitude: TOGO_CENTER.lat + 0.01,
    longitude: TOGO_CENTER.lng + 0.01,
  });
  const [pickupOk, setPickupOk] = useState(false);
  const [deliveryOk, setDeliveryOk] = useState(false);
  const [weight, setWeight] = useState(2);
  const [vehicleType, setVehicleType] = useState<VehicleType>('TAXI');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapTarget, setMapTarget] = useState<MapEditMode>('pickup');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const autoPickupDone = useRef(false);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(loc);
      },
      () => {},
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
      street: mode === 'pickup' ? addr.street || 'Ma boutique' : addr.street,
      label: mode === 'pickup' ? addr.label || 'Ma boutique' : addr.label || 'Client',
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

  // Adresse de départ = position boutique (automatique au premier GPS)
  useEffect(() => {
    if (autoPickupDone.current || !currentLocation || pickupOk) return;
    autoPickupDone.current = true;
    void (async () => {
      const addr = await resolveAddress(currentLocation.lat, currentLocation.lng);
      await applyAddress('pickup', {
        ...addr,
        street: addr.street || 'Ma boutique',
        label: addr.label || 'Ma boutique',
      });
    })();
  }, [currentLocation, pickupOk]);

  const canPrice = pickupOk && deliveryOk;

  const livePreview = useMemo(() => {
    if (!canPrice) return null;
    return calculateLocalPrice(pickup, delivery, weight, vehicleType);
  }, [pickup, delivery, weight, vehicleType, canPrice]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pickupOk || !deliveryOk) {
      setError('Recherchez et sélectionnez les deux adresses (boutique + livraison client).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{ packageId: string }>('/packages/ship', {
        recipientName,
        recipientPhone,
        pickupAddress: normalizeAddress(pickup),
        deliveryAddress: normalizeAddress(delivery),
        weight,
        vehicleType,
        description: description || undefined,
      });
      navigate(`/merchant/packages/${data.packageId}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Expédition impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Expédier à un client">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-900 p-5 text-white">
          <h2 className="text-lg font-bold">Client sans compte kikchee</h2>
          <p className="mt-2 text-sm text-emerald-100">
            Votre boutique est pré-remplie avec votre position GPS. Ajoutez le client et expédiez.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
          <OrderMapEditor
            pickup={{
              lat: pickup.latitude,
              lng: pickup.longitude,
              label: pickup.label || pickup.street || 'Boutique',
            }}
            delivery={{
              lat: delivery.latitude,
              lng: delivery.longitude,
              label: delivery.label || delivery.street || 'Client',
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
            Boutique
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
            Client
          </button>
          <button
            type="button"
            onClick={() => useCurrentLocationFor(mapTarget)}
            disabled={!currentLocation}
            className="ml-1 rounded-lg px-3 text-xs font-medium text-blue-700 hover:bg-white disabled:opacity-40"
          >
            Ma position
          </button>
        </div>
        <p className="text-center text-xs text-slate-500">
          Bouton bleu = vous localiser · Départ boutique rempli automatiquement au chargement
        </p>

        <div className="rounded-2xl bg-brand-800 p-5 text-white">
          <p className="text-xs uppercase tracking-wider text-white/70">Tarif livraison</p>
          {!canPrice ? (
            <p className="mt-2 text-lg text-white/90">Indiquez boutique et adresse client</p>
          ) : (
            <>
              <p className="text-3xl font-bold">{formatFcfa(livePreview!.estimatedPrice)}</p>
              <p className="text-sm text-white/80">
                {livePreview!.distanceKm.toFixed(2)} km · ~{livePreview!.estimatedMinutes} min
              </p>
            </>
          )}
        </div>

        {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="mb-3 font-semibold text-slate-800">Destinataire (votre client)</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" /> Nom complet *
                </label>
                <input
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ex: Kofi Mensah"
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4" /> Téléphone *
                </label>
                <input
                  required
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Ex: +228 90 00 00 00"
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>
            </div>
          </div>

          <AddressSearch
            label="Départ — votre boutique"
            hint="Pré-rempli avec votre GPS — modifiable si besoin"
            accent="emerald"
            value={pickup}
            onChange={setPickup}
            onGeocoded={setPickupOk}
          />

          <AddressSearch
            label="Livraison chez le client"
            hint="Adresse du client — saisie manuelle acceptée"
            accent="red"
            value={delivery}
            onChange={setDelivery}
            onGeocoded={setDeliveryOk}
          />

          <VehiclePicker value={vehicleType} onChange={setVehicleType} />

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" /> Poids du colis (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
              className="mt-2 w-full rounded-xl border px-3 py-3 text-lg"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contenu (optionnel) — ex: sac de riz 5 kg"
              className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              rows={2}
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
            <Truck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Le colis sera marqué <strong>Prêt</strong> immédiatement. La course sera proposée aux
              livreurs <strong>{VEHICLE_OPTIONS[vehicleType].label.toLowerCase()}</strong> proches.
              Le livreur pourra appeler votre client au numéro indiqué.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !canPrice}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <MapPin className="h-6 w-6" />}
            {loading ? 'Envoi…' : `Expédier — ${formatFcfa(livePreview?.estimatedPrice)}`}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
