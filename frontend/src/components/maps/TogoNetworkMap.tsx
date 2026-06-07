import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { TOGO_CORRIDOR, TOGO_NATIONAL_BOUNDS } from '../../constants/togo';
import { createColoredIcon } from './leafletSetup';
import './leafletSetup';

interface TogoNetworkMapProps {
  height?: string;
  className?: string;
}

/**
 * Carte interactive du Togo entier montrant le corridor logistique
 * Lomé → Tsévié → Atakpamé → Sokodé → Kara → Dapaong (axe N1).
 */
export default function TogoNetworkMap({ height = '420px', className = '' }: TogoNetworkMapProps) {
  const route = TOGO_CORRIDOR.map((c) => [c.latitude, c.longitude] as [number, number]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 shadow-inner ${className}`}
      style={{ height }}
    >
      <MapContainer
        bounds={TOGO_NATIONAL_BOUNDS}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={route}
          pathOptions={{ color: '#047857', weight: 4, dashArray: '10 8', opacity: 0.9 }}
        />

        {TOGO_CORRIDOR.map((city) => (
          <Marker
            key={city.id}
            position={[city.latitude, city.longitude]}
            icon={createColoredIcon(city.hub ? '#059669' : '#f59e0b')}
          >
            <Popup>
              <strong>{city.name}</strong>
              <br />
              Région {city.region}
              {city.hub && (
                <>
                  <br />
                  <span style={{ color: '#047857' }}>● Hub logistique</span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
