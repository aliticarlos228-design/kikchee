import { z } from 'zod';

const vehicleTypeEnum = z.enum(['MOTO', 'TAXI', 'FOURGON']);

export const toggleUserActiveSchema = z.object({
  active: z.boolean(),
});

export const adminUpdateUserSchema = z
  .object({
    firstName: z.string().min(1, 'Prénom requis').optional(),
    lastName: z.string().min(1, 'Nom requis').optional(),
    phone: z.string().optional(),
    vehicleType: vehicleTypeEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucune modification fournie',
  });

export const adminCreateUserSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    phone: z.string().optional(),
    role: z.enum(['client', 'merchant', 'driver'], {
      errorMap: () => ({ message: 'Rôle invalide' }),
    }),
    vehicleType: vehicleTypeEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'driver') {
      const phone = data.phone?.replace(/\D/g, '') ?? '';
      if (phone.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Téléphone requis pour les livreurs',
          path: ['phone'],
        });
      }
      if (!data.vehicleType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Type de véhicule requis pour les livreurs',
          path: ['vehicleType'],
        });
      }
    }
  });
