import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(1, 'Rue requise'),
  city: z.string().min(1, 'Ville requise'),
  postalCode: z.string().min(1).optional().default('BP'),
  latitude: z.number({ invalid_type_error: 'Latitude requise' }),
  longitude: z.number({ invalid_type_error: 'Longitude requise' }),
  label: z.string().optional(),
});

export const createPackageSchema = z.object({
  weight: z.number().positive('Poids doit être positif'),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  description: z.string().optional(),
});

export const linkOrderSchema = z.object({
  orderId: z.string().uuid('ID commande invalide'),
});

export const updatePackageStatusSchema = z.object({
  status: z.enum(['CREATED', 'READY', 'PICKED_UP', 'DELIVERED']),
});

export const shipPackageSchema = z.object({
  recipientName: z.string().min(1, 'Nom du destinataire requis'),
  recipientPhone: z.string().min(8, 'Téléphone du destinataire requis'),
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  weight: z.number().positive('Poids doit être positif'),
  description: z.string().optional(),
  vehicleType: z.enum(['MOTO', 'TAXI', 'FOURGON']),
});
