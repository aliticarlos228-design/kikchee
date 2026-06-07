"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateUserSchema = exports.adminUpdateUserSchema = exports.toggleUserActiveSchema = void 0;
const zod_1 = require("zod");
const vehicleTypeEnum = zod_1.z.enum(['MOTO', 'TAXI', 'FOURGON']);
exports.toggleUserActiveSchema = zod_1.z.object({
    active: zod_1.z.boolean(),
});
exports.adminUpdateUserSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().min(1, 'Prénom requis').optional(),
    lastName: zod_1.z.string().min(1, 'Nom requis').optional(),
    phone: zod_1.z.string().optional(),
    vehicleType: vehicleTypeEnum.optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucune modification fournie',
});
exports.adminCreateUserSchema = zod_1.z
    .object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(8, 'Mot de passe : 8 caractères minimum'),
    firstName: zod_1.z.string().min(1, 'Prénom requis'),
    lastName: zod_1.z.string().min(1, 'Nom requis'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['client', 'merchant', 'driver'], {
        errorMap: () => ({ message: 'Rôle invalide' }),
    }),
    vehicleType: vehicleTypeEnum.optional(),
})
    .superRefine((data, ctx) => {
    if (data.role === 'driver') {
        const phone = data.phone?.replace(/\D/g, '') ?? '';
        if (phone.length < 8) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Téléphone requis pour les livreurs',
                path: ['phone'],
            });
        }
        if (!data.vehicleType) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Type de véhicule requis pour les livreurs',
                path: ['vehicleType'],
            });
        }
    }
});
