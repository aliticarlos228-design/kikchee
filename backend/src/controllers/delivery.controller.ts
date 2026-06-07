import { Request, Response } from 'express';
import { updateDeliveryStatusSchema, driverLocationSchema } from '../validators/delivery.validator';
import * as deliveryService from '../services/delivery.service';
import * as bidService from '../services/bid.service';

function handleError(res: Response, err: unknown) {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const e = err as { status: number; message: string; code?: string };
    return res.status(e.status).json({ error: e.message, code: e.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}

export async function available(req: Request, res: Response) {
  try {
    const deliveries = await deliveryService.listAvailableDeliveries(req.user!.userId);
    return res.json(deliveries);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function submitBid(req: Request, res: Response) {
  const proposedPrice = Number(req.body.proposedPrice);
  if (!Number.isFinite(proposedPrice) || proposedPrice <= 0) {
    return res.status(400).json({ error: 'Prix invalide', code: 'VALIDATION_ERROR' });
  }
  try {
    const bid = await bidService.submitDriverBid(
      req.user!.userId,
      String(req.params.orderId),
      proposedPrice
    );
    return res.status(201).json(bid);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function accept(req: Request, res: Response) {
  try {
    const delivery = await deliveryService.acceptDelivery(req.user!.userId, String(req.params.orderId));
    return res.json(delivery);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function updateStatus(req: Request, res: Response) {
  const parsed = updateDeliveryStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const delivery = await deliveryService.updateDeliveryStatus(
      req.user!.userId,
      String(req.params.id),
      parsed.data.status
    );
    return res.json(delivery);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function updateLocation(req: Request, res: Response) {
  const parsed = driverLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Position invalide',
      code: 'VALIDATION_ERROR',
    });
  }
  try {
    const result = await deliveryService.updateDeliveryLocation(
      req.user!.userId,
      String(req.params.id),
      parsed.data.latitude,
      parsed.data.longitude
    );
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    const result = await deliveryService.confirmDeliveryPayment(req.user!.userId, String(req.params.id));
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function mine(req: Request, res: Response) {
  try {
    const deliveries = await deliveryService.listDriverDeliveries(req.user!.userId);
    return res.json(deliveries);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function redevance(req: Request, res: Response) {
  try {
    const data = await deliveryService.getDriverRedevance(req.user!.userId);
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const delivery = await deliveryService.getDriverDelivery(req.user!.userId, String(req.params.id));
    return res.json(delivery);
  } catch (err) {
    return handleError(res, err);
  }
}
