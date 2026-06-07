import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { TOGO_CENTER } from '../../constants/togo';
import { createColoredIcon } from './leafletSetup';
import '../../components/maps/leafletSetup';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

interface RouteMapProps {
  pickup?: MapPoint | null;
  delivery?: MapPoint | null;
  driver?: MapPoint | null;
  height?: string;
  className?: string;
}

export default function RouteMap({
  pickup,
  delivery,
  driver,
  height = '320px',
  className = '',
}: RouteMapProps) {
  const points = [pickup, delivery, driver].filter(Boolean) as MapPoint[];
  const center = pickup ?? delivery ?? { lat: TOGO_CENTER.lat, lng: TOGO_CENTER.lng };

  const route =
    pickup && delivery
      ? [
          [pickup.lat, pickup.lng] as [number, number],
          [delivery.lat, delivery.lng] as [number, number],
        ]
      : [];

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 shadow-inner ${className}`} style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={TOGO_CENTER.zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={createColoredIcon('#059669')}>
            <Popup><strong>Collecte</strong><br />{pickup.label}</Popup>
          </Marker>
        )}
        {delivery && (
          <Marker position={[delivery.lat, delivery.lng]} icon={createColoredIcon('#dc2626')}>
            <Popup><strong>Livraison</strong><br />{delivery.label}</Popup>
          </Marker>
        )}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={createColoredIcon('#2563eb')}>
            <Popup><strong>Livreur</strong><br />{driver.label}</Popup>
          </Marker>
        )}
        {route.length === 2 && (
          <Polyline positions={route} pathOptions={{ color: '#047857', weight: 4, dashArray: '8 8' }} />
        )}
        {points.length === 0 && (
          <Marker position={[TOGO_CENTER.lat, TOGO_CENTER.lng]}>
            <Popup>Lomé, Togo</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

interface LocationPickerProps {
  value: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
  label?: string;
  markerColor?: string;
  height?: string;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  label = 'Cliquez sur la carte pour placer le point',
  markerColor = '#059669',
  height = '280px',
}: LocationPickerProps) {
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{label}</p>
      <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height }}>
        <MapContainer
          center={[value.lat, value.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onChange={onChange} />
          <Marker position={[value.lat, value.lng]} icon={createColoredIcon(markerColor)} />
        </MapContainer>
      </div>
    </div>
  );
}
