"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
exports.formatUser = formatUser;
const zod_1 = require("zod");
const vehicleTypeEnum = zod_1.z.enum(['MOTO', 'TAXI', 'FOURGON']);
exports.registerSchema = zod_1.z
    .object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(8, 'Mot de passe : 8 caractères minimum'),
    firstName: zod_1.z.string().min(1, 'Prénom requis'),
    lastName: zod_1.z.string().min(1, 'Nom requis'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['client', 'merchant', 'driver'], {
        errorMap: () => ({ message: 'Rôle invalide (client, merchant, driver)' }),
    }),
    vehicleType: vehicleTypeEnum.optional(),
})
    .superRefine((data, ctx) => {
    if (data.role === 'driver') {
        const phone = data.phone?.replace(/\D/g, '') ?? '';
        if (phone.length < 8) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Téléphone requis pour les livreurs (min. 8 chiffres)',
                path: ['phone'],
            });
        }
        if (!data.vehicleType) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Choisissez votre type de véhicule',
                path: ['vehicleType'],
            });
        }
    }
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(1, 'Mot de passe requis'),
});
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    vehicleType: vehicleTypeEnum.optional(),
});
function formatUser(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        latitude: user.latitude,
        longitude: user.longitude,
        vehicleType: user.vehicleType,
        active: user.active,
        createdAt: user.createdAt,
    };
}
