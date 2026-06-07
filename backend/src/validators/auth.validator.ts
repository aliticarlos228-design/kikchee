import { z } from 'zod';

const vehicleTypeEnum = z.enum(['MOTO', 'TAXI', 'FOURGON']);

export const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    phone: z.string().optional(),
    role: z.enum(['client', 'merchant', 'driver'], {
      errorMap: () => ({ message: 'Rôle invalide (client, merchant, driver)' }),
    }),
    vehicleType: vehicleTypeEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'driver') {
      const phone = data.phone?.replace(/\D/g, '') ?? '';
      if (phone.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Téléphone requis pour les livreurs (min. 8 chiffres)',
          path: ['phone'],
        });
      }
      if (!data.vehicleType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choisissez votre type de véhicule',
          path: ['vehicleType'],
        });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  vehicleType: vehicleTypeEnum.optional(),
});

export function formatUser(user: {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  vehicleType: string | null;
  active: boolean;
  createdAt: Date;
}) {
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
