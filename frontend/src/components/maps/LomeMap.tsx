import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { TOGO_CENTER, TOGO_LOCATIONS } from '../../constants/togo';
import { createColoredIcon } from './leafletSetup';
import './leafletSetup';

interface LomeMapProps {
  height?: string;
  className?: string;
}

/** Points clés affichés sur la carte de Lomé (zones de collecte/livraison). */
const LOME_POINTS = [
  'lome-port',
  'grand-marche',
  'aeroport',
  'universite',
  'agoe',
  'adidogome',
];

/**
 * Carte interactive centrée sur la ville de Lomé (région Maritime).
 * Affiche les principaux quartiers / points de collecte.
 */
export default function LomeMap({ height = '420px', className = '' }: LomeMapProps) {
  const points = TOGO_LOCATIONS.filter((l) => LOME_POINTS.includes(l.id));

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 shadow-inner ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={[TOGO_CENTER.lat, TOGO_CENTER.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={createColoredIcon('#059669')}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.street}, {p.city}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
