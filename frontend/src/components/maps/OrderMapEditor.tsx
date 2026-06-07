import type { Map as LeafletMap } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import { TOGO_CENTER } from '../../constants/togo';
import { createColoredIcon, createCurrentLocationIcon } from './leafletSetup';
import './leafletSetup';

export type MapEditMode = 'pickup' | 'delivery';

interface OrderMapEditorProps {
  pickup: { lat: number; lng: number; label?: string };
  delivery: { lat: number; lng: number; label?: string };
  currentLocation?: { lat: number; lng: number } | null;
  mode?: MapEditMode;
  onPick?: (mode: MapEditMode, lat: number, lng: number) => void;
  /** Boutons zoom + centrer sur ma position (coin bas-droit) */
  showControls?: boolean;
  onLocate?: () => void;
  locating?: boolean;
  /** Déclenche un vol vers ce point (ex. après clic sur le bouton bleu) */
  flyTo?: { lat: number; lng: number; key: number } | null;
  height?: string;
}

function FitBounds({
  pickup,
  delivery,
}: {
  pickup: { lat: number; lng: number };
  delivery: { lat: number; lng: number };
}) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [pickup.lat, pickup.lng],
        [delivery.lat, delivery.lng],
      ],
      { padding: [48, 48], maxZoom: 15 }
    );
  }, [pickup.lat, pickup.lng, delivery.lat, delivery.lng, map]);
  return null;
}

function FlyToPoint({ target }: { target?: { lat: number; lng: number; key: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 16, { duration: 0.7 });
    }
  }, [target?.key, target, map]);
  return null;
}

function MapInstanceBridge({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

function MapClickHandler({ mode, onPick }: { mode: MapEditMode; onPick: (m: MapEditMode, lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(mode, e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function OrderMapEditor({
  pickup,
  delivery,
  currentLocation,
  mode = 'pickup',
  onPick,
  showControls = false,
  onLocate,
  locating = false,
  flyTo,
  height = '100%',
}: OrderMapEditorProps) {
  const [leafletMap, setLeafletMap] = useState<LeafletMap | null>(null);
  const handleMapReady = useCallback((map: LeafletMap) => setLeafletMap(map), []);

  const route: [number, number][] = [
    [pickup.lat, pickup.lng],
    [delivery.lat, delivery.lng],
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height }}>
      <MapContainer
        center={[TOGO_CENTER.lat, TOGO_CENTER.lng]}
        zoom={13}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds pickup={pickup} delivery={delivery} />
        <MapInstanceBridge onReady={handleMapReady} />
        {flyTo && <FlyToPoint target={flyTo} />}
        {onPick && <MapClickHandler mode={mode} onPick={onPick} />}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={createCurrentLocationIcon()}
            zIndexOffset={1000}
          >
            <Popup>
              <strong>Vous êtes ici</strong>
              <br />
              Position actuelle
            </Popup>
          </Marker>
        )}
        <Marker position={[pickup.lat, pickup.lng]} icon={createColoredIcon('#059669')}>
          <Popup><strong>Collecte</strong><br />{pickup.label || 'Point A'}</Popup>
        </Marker>
        <Marker position={[delivery.lat, delivery.lng]} icon={createColoredIcon('#dc2626')}>
          <Popup><strong>Livraison</strong><br />{delivery.label || 'Point B'}</Popup>
        </Marker>
        <Polyline positions={route} pathOptions={{ color: '#047857', weight: 4, opacity: 0.85 }} />
      </MapContainer>

      {showControls && onLocate && (
        <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            aria-label="Centrer sur ma position"
            title="Ma position"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition hover:bg-slate-50 disabled:opacity-50"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="#2563eb" />
              <circle cx="12" cy="12" r="7" stroke="#2563eb" strokeWidth="2" />
              <path stroke="#2563eb" strokeWidth="2" strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => leafletMap?.zoomIn()}
            aria-label="Zoom avant"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-md transition hover:bg-slate-50"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => leafletMap?.zoomOut()}
            aria-label="Zoom arrière"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-md transition hover:bg-slate-50"
          >
            <Minus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {currentLocation && (
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-slate-700 shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200" />
          Votre position
        </div>
      )}

      {onPick && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-14 flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-1.5 text-xs text-white backdrop-blur-sm">
            {mode === 'pickup'
              ? 'Cliquez sur la carte pour placer la collecte'
              : 'Cliquez sur la carte pour placer la livraison'}
          </span>
        </div>
      )}
    </div>
  );
}

export interface DeliveryMapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  distanceKm?: number | null;
  rank?: number;
}

interface DeliveriesOverviewMapProps {
  points: DeliveryMapPoint[];
  driverLat?: number;
  driverLng?: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: string;
}

export function DeliveriesOverviewMap({
  points,
  driverLat,
  driverLng,
  selectedId,
  height = '320px',
}: DeliveriesOverviewMapProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg" style={{ height }}>
      <MapContainer center={[TOGO_CENTER.lat, TOGO_CENTER.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {driverLat != null && driverLng != null && (
          <Marker position={[driverLat, driverLng]} icon={createCurrentLocationIcon()}>
            <Popup><strong>Vous</strong></Popup>
          </Marker>
        )}
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={createColoredIcon(selectedId === p.id ? '#f59e0b' : '#ea580c')}
          >
            <Popup>
              <strong>Mission #{p.rank}</strong><br />
              {p.label}
              {p.distanceKm != null && <><br />{p.distanceKm} km</>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
