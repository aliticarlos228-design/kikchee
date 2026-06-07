import { z } from 'zod';

export const sendChatMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message vide').max(1000, 'Message trop long'),
});
