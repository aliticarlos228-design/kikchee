import { Request, Response } from 'express';
import { sendChatMessageSchema } from '../validators/chat.validator';
import * as chatService from '../services/chat.service';

function handleError(res: Response, err: unknown) {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const e = err as { status: number; message: string; code?: string };
    return res.status(e.status).json({ error: e.message, code: e.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}

export async function conversations(req: Request, res: Response) {
  try {
    const data = await chatService.listConversations(req.user!.userId, req.user!.role);
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const messages = await chatService.listMessages(
      req.user!.userId,
      req.user!.role,
      String(req.params.orderId)
    );
    return res.json(messages);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function send(req: Request, res: Response) {
  const parsed = sendChatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Message invalide',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const message = await chatService.sendMessage(
      req.user!.userId,
      req.user!.role,
      String(req.params.orderId),
      parsed.data.text
    );
    return res.status(201).json(message);
  } catch (err) {
    return handleError(res, err);
  }
}
