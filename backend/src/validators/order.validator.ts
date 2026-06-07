import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(1, 'Rue requise'),
  city: z.string().min(1, 'Ville requise'),
  postalCode: z.string().min(1).optional().default('BP'),
  latitude: z.number({ invalid_type_error: 'Latitude requise' }),
  longitude: z.number({ invalid_type_error: 'Longitude requise' }),
  label: z.string().optional(),
});

export const estimateOrderSchema = z.object({
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  weight: z.number().positive('Poids doit être positif'),
  vehicleType: z.enum(['MOTO', 'TAXI', 'FOURGON']).optional().default('TAXI'),
});

export const createOrderSchema = estimateOrderSchema.extend({
  description: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY']).optional().default('CASH'),
});
