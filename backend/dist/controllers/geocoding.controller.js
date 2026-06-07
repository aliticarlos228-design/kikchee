"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeSearch = geocodeSearch;
exports.geocodeReverse = geocodeReverse;
const geocoding_service_1 = require("../services/geocoding.service");
function handleError(res, err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}
async function geocodeSearch(req, res) {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
        return res.status(400).json({ error: 'Recherche trop courte', code: 'VALIDATION_ERROR' });
    }
    try {
        const results = await (0, geocoding_service_1.searchAddress)(q);
        return res.json(results);
    }
    catch (err) {
        return handleError(res, err);
    }
}
async function geocodeReverse(req, res) {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ error: 'Coordonnées invalides', code: 'VALIDATION_ERROR' });
    }
    try {
        const result = await (0, geocoding_service_1.reverseGeocode)(lat, lng);
        return res.json(result);
    }
    catch (err) {
        return handleError(res, err);
    }
}
