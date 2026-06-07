/** Carte et repères — Togo (Lomé & environs) */
export const TOGO_CENTER = { lat: 6.1319, lng: 1.2228, zoom: 13 };
export const TOGO_BOUNDS: [[number, number], [number, number]] = [
  [6.0, 1.1],
  [6.25, 1.35],
];

export const TOGO_LOCATIONS = [
  {
    id: 'lome-port',
    name: 'Port autonome de Lomé',
    street: 'Boulevard du Port',
    city: 'Lomé',
    postalCode: 'BP 40',
    latitude: 6.1375,
    longitude: 1.2792,
  },
  {
    id: 'grand-marche',
    name: 'Grand Marché',
    street: 'Avenue de la Libération',
    city: 'Lomé',
    postalCode: 'BP 333',
    latitude: 6.1256,
    longitude: 1.2252,
  },
  {
    id: 'aeroport',
    name: 'Aéroport Gnassingbé Eyadéma',
    street: 'Route de l\'Aéroport',
    city: 'Lomé',
    postalCode: '01 BP 1280',
    latitude: 6.1656,
    longitude: 1.2545,
  },
  {
    id: 'universite',
    name: 'Université de Lomé',
    street: 'Boulevard du 30 Août',
    city: 'Lomé',
    postalCode: 'BP 1515',
    latitude: 6.176,
    longitude: 1.212,
  },
  {
    id: 'be-klikame',
    name: 'Bè-Klikamé',
    street: 'Quartier Bè',
    city: 'Lomé',
    postalCode: 'BP 892',
    latitude: 6.148,
    longitude: 1.198,
  },
  {
    id: 'tokoin',
    name: 'Tokoin-Wuiti',
    street: 'Rue de Tokoin',
    city: 'Lomé',
    postalCode: 'BP 711',
    latitude: 6.14,
    longitude: 1.24,
  },
  {
    id: 'ucao',
    name: 'UCAO — Université Catholique',
    street: 'Campus UCAO',
    city: 'Lomé',
    postalCode: 'BP 142',
    latitude: 6.152,
    longitude: 1.215,
    aliases: ['ucao', 'universite catholique', 'université catholique'],
  },
  {
    id: 'adidogome',
    name: 'Adidogomé',
    street: 'Quartier Adidogomé',
    city: 'Lomé',
    postalCode: 'BP 500',
    latitude: 6.168,
    longitude: 1.178,
    aliases: ['adidogome'],
  },
  {
    id: 'agoe',
    name: 'Agoè-Nyivé',
    street: 'Quartier Agoè',
    city: 'Lomé',
    postalCode: 'BP 620',
    latitude: 6.128,
    longitude: 1.195,
    aliases: ['agoe', 'agoè'],
  },
] as const;

/**
 * Corridor national (axe routier N1) — utilisé pour la carte réseau du Togo.
 * Du sud (Lomé, capitale) jusqu'au nord (Dapaong).
 */
export interface CorridorCity {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  hub: boolean;
}

export const TOGO_CORRIDOR: CorridorCity[] = [
  { id: 'lome', name: 'Lomé', region: 'Maritime', latitude: 6.1319, longitude: 1.2228, hub: true },
  { id: 'tsevie', name: 'Tsévié', region: 'Maritime', latitude: 6.4264, longitude: 1.2131, hub: false },
  { id: 'atakpame', name: 'Atakpamé', region: 'Plateaux', latitude: 7.5333, longitude: 1.1167, hub: false },
  { id: 'sokode', name: 'Sokodé', region: 'Centrale', latitude: 8.9833, longitude: 1.1333, hub: true },
  { id: 'kara', name: 'Kara', region: 'Kara', latitude: 9.5511, longitude: 1.1861, hub: true },
  { id: 'dapaong', name: 'Dapaong', region: 'Savanes', latitude: 10.8625, longitude: 0.2075, hub: false },
];

/** Cadre géographique du Togo entier (pour fit-bounds de la carte nationale) */
export const TOGO_NATIONAL_BOUNDS: [[number, number], [number, number]] = [
  [5.9, -0.2],
  [11.2, 1.9],
];

/** Images professionnelles (Unsplash) — auto-format = WebP servi automatiquement */
const U = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;

export const IMAGES = {
  hero: U('1586528116311-ad8dd3c8310d', 1920),
  heroAlt: U('1566576912321-d58ddd7a6088', 1920),
  delivery: U('1601584115197-04ecc0da31d7'),
  warehouse: U('1553413077-190dd305871c'),
  // Marché / commerce africain — plus représentatif du contexte local
  market: U('1604881991720-f91add269bed'),
  team: U('1556761175-b413da4baf72'),
  africa: U('1547471080-7cc2caa01a7e'),
  login: U('1494412511400-8960c805328e', 1200),
};

export const BRAND = {
  name: 'kikchee',
  tagline: 'La logistique intelligente au Togo',
  country: 'Togo',
  city: 'Lomé',
  // Numéro WhatsApp du support (format international, sans + ni espaces).
  supportWhatsapp: '22890000000',
};
