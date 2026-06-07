"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = exports.estimateOrderSchema = exports.addressSchema = void 0;
const zod_1 = require("zod");
exports.addressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1, 'Rue requise'),
    city: zod_1.z.string().min(1, 'Ville requise'),
    postalCode: zod_1.z.string().min(1).optional().default('BP'),
    latitude: zod_1.z.number({ invalid_type_error: 'Latitude requise' }),
    longitude: zod_1.z.number({ invalid_type_error: 'Longitude requise' }),
    label: zod_1.z.string().optional(),
});
exports.estimateOrderSchema = zod_1.z.object({
    pickupAddress: exports.addressSchema,
    deliveryAddress: exports.addressSchema,
    weight: zod_1.z.number().positive('Poids doit être positif'),
    vehicleType: zod_1.z.enum(['MOTO', 'TAXI', 'FOURGON']).optional().default('TAXI'),
});
exports.createOrderSchema = exports.estimateOrderSchema.extend({
    description: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.enum(['CASH', 'MOBILE_MONEY']).optional().default('CASH'),
});
