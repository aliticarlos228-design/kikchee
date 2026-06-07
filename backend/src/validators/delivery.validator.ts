import { z } from 'zod';

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED']),
});

export const driverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
