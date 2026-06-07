"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipPackageSchema = exports.updatePackageStatusSchema = exports.linkOrderSchema = exports.createPackageSchema = void 0;
const zod_1 = require("zod");
const addressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1, 'Rue requise'),
    city: zod_1.z.string().min(1, 'Ville requise'),
    postalCode: zod_1.z.string().min(1).optional().default('BP'),
    latitude: zod_1.z.number({ invalid_type_error: 'Latitude requise' }),
    longitude: zod_1.z.number({ invalid_type_error: 'Longitude requise' }),
    label: zod_1.z.string().optional(),
});
exports.createPackageSchema = zod_1.z.object({
    weight: zod_1.z.number().positive('Poids doit être positif'),
    length: zod_1.z.number().positive().optional(),
    width: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
    description: zod_1.z.string().optional(),
});
exports.linkOrderSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid('ID commande invalide'),
});
exports.updatePackageStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['CREATED', 'READY', 'PICKED_UP', 'DELIVERED']),
});
exports.shipPackageSchema = zod_1.z.object({
    recipientName: zod_1.z.string().min(1, 'Nom du destinataire requis'),
    recipientPhone: zod_1.z.string().min(8, 'Téléphone du destinataire requis'),
    pickupAddress: addressSchema,
    deliveryAddress: addressSchema,
    weight: zod_1.z.number().positive('Poids doit être positif'),
    description: zod_1.z.string().optional(),
    vehicleType: zod_1.z.enum(['MOTO', 'TAXI', 'FOURGON']),
});
