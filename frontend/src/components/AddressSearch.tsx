import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import type { AddressInput } from '../types/order';
import { addressFromManualText } from '../utils/geo';

export interface GeocodeResult {
  street: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  label: string;
}

interface AddressSearchProps {
  label: string;
  hint: string;
  accent: 'emerald' | 'red';
  value: AddressInput;
  onChange: (addr: AddressInput) => void;
  onGeocoded?: (ok: boolean) => void;
}

export default function AddressSearch({
  label,
  hint,
  accent,
  value,
  onChange,
  onGeocoded,
}: AddressSearchProps) {
  const [query, setQuery] = useState(value.street || '');
  const [city, setCity] = useState(value.city || 'Lomé');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const accentRing = accent === 'emerald' ? 'focus:border-emerald-500' : 'focus:border-red-500';
  const accentBadge = accent === 'emerald' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50';

  useEffect(() => {
    onGeocoded?.(confirmed && query.trim().length >= 2);
  }, [confirmed, query, onGeocoded]);

  // Synchronise les changements externes (GPS « Ma position », clic sur la carte)
  // pour qu'ils s'affichent automatiquement dans le champ d'adresse.
  useEffect(() => {
    if (value.street && value.street !== query) {
      setQuery(value.street);
      setConfirmed(Boolean(value.label));
      setManualMode(false);
      setSuggestions([]);
    }
    if (value.city && value.city !== city) {
      setCity(value.city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.street, value.city, value.label]);

  useEffect(() => {
    if (manualMode || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<GeocodeResult[]>('/geocode', {
          params: { q: `${query.trim()}, ${city.trim()}` },
        });
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [query, city, manualMode]);

  function pick(result: GeocodeResult) {
    const addr: AddressInput = {
      street: result.street,
      city: result.city,
      postalCode: result.postalCode || 'BP',
      latitude: result.latitude,
      longitude: result.longitude,
      label: result.label,
    };
    onChange(addr);
    setQuery(result.street);
    setCity(result.city);
    setSuggestions([]);
    setConfirmed(true);
    setManualMode(false);
  }

  function confirmManual() {
    const addr = addressFromManualText(query, city);
    onChange(addr);
    setConfirmed(true);
    setManualMode(true);
    setSuggestions([]);
  }

  function handleQueryChange(text: string) {
    setQuery(text);
    setConfirmed(false);
    setManualMode(false);
    onChange({ ...value, street: text, label: '' });
  }

  function handleCityChange(text: string) {
    setCity(text);
    setConfirmed(false);
    setManualMode(false);
    onChange({ ...value, city: text, label: '' });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label
        className={`mb-2 flex items-center gap-2 text-sm font-semibold ${
          accent === 'emerald' ? 'text-emerald-700' : 'text-red-700'
        }`}
      >
        <MapPin className="h-4 w-4" />
        {label}
      </label>
      <p className="mb-2 text-xs text-slate-500">{hint}</p>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Quartier, rue, lieu…"
            className={`w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-sm ${accentRing} focus:outline-none`}
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}
          {confirmed && !searching && (
            <CheckCircle2
              className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                accent === 'emerald' ? 'text-emerald-500' : 'text-red-500'
              }`}
            />
          )}
        </div>

        <input
          type="text"
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          placeholder="Ville / région"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      {suggestions.length > 0 && !confirmed && (
        <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.latitude}-${s.longitude}-${i}`}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                <strong>{s.label}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!confirmed && query.trim().length >= 2 && (
        <button
          type="button"
          onClick={confirmManual}
          className="mt-2 w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ✓ Utiliser cette adresse (même si absente de la carte)
        </button>
      )}

      {confirmed && (
        <p className={`mt-2 rounded-lg px-2 py-1 text-xs ${accentBadge}`}>
          {manualMode
            ? `✓ Adresse saisie : ${query}, ${city}`
            : `✓ Trouvé sur la carte : ${value.label || query}`}
        </p>
      )}
    </div>
  );
}

export function normalizeAddress(addr: AddressInput): AddressInput {
  return {
    street: addr.street?.trim() || addr.label || 'Adresse',
    city: addr.city?.trim() || 'Lomé',
    postalCode: addr.postalCode?.trim() || 'BP',
    latitude: Number(addr.latitude) || 6.1319,
    longitude: Number(addr.longitude) || 1.2228,
    label: addr.label || `${addr.street}, ${addr.city}`,
  };
}
