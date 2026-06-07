"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_CATEGORIES = void 0;
exports.getCategoryById = getCategoryById;
/** Catégories visuelles — adaptées aux commerçants (sans saisie technique) */
exports.PACKAGE_CATEGORIES = [
    {
        id: 'document',
        label: 'Enveloppe / papiers',
        icon: '📄',
        defaultWeight: 0.3,
        length: 30,
        width: 22,
        height: 2,
        hint: 'Lettres, factures, petits documents',
    },
    {
        id: 'small',
        label: 'Petit paquet',
        icon: '📦',
        defaultWeight: 1.5,
        length: 25,
        width: 20,
        height: 15,
        hint: 'Accessoires, cosmétiques, petits articles',
    },
    {
        id: 'medium',
        label: 'Sac moyen',
        icon: '🛍️',
        defaultWeight: 5,
        length: 40,
        width: 30,
        height: 25,
        hint: 'Vêtements, chaussures, articles de boutique',
    },
    {
        id: 'large',
        label: 'Gros colis',
        icon: '📦',
        defaultWeight: 15,
        length: 60,
        width: 45,
        height: 40,
        hint: 'Cartons, gros sacs, électroménager léger',
    },
    {
        id: 'food',
        label: 'Nourriture / vivres',
        icon: '🍚',
        defaultWeight: 3,
        length: 35,
        width: 25,
        height: 20,
        hint: 'Riz, farine, produits alimentaires',
    },
    {
        id: 'fragile',
        label: 'Fragile',
        icon: '⚠️',
        defaultWeight: 2,
        length: 35,
        width: 25,
        height: 25,
        hint: 'Verre, porcelaine, objets délicats',
    },
];
function getCategoryById(id) {
    return exports.PACKAGE_CATEGORIES.find((c) => c.id === id);
}
