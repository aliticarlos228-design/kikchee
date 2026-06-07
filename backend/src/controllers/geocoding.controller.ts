import { searchAddress, reverseGeocode } from '../services/geocoding.service';

function handleError(res: import('express').Response, err: unknown) {
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}

export async function geocodeSearch(req: import('express').Request, res: import('express').Response) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    return res.status(400).json({ error: 'Recherche trop courte', code: 'VALIDATION_ERROR' });
  }
  try {
    const results = await searchAddress(q);
    return res.json(results);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function geocodeReverse(req: import('express').Request, res: import('express').Response) {
  const lat = parseFloat(String(req.query.lat));
  const lng = parseFloat(String(req.query.lng));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'Coordonnées invalides', code: 'VALIDATION_ERROR' });
  }
  try {
    const result = await reverseGeocode(lat, lng);
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}
