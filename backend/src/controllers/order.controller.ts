import { Request, Response } from 'express';
import { createOrderSchema, estimateOrderSchema } from '../validators/order.validator';
import * as orderService from '../services/order.service';
import * as bidService from '../services/bid.service';

function handleError(res: Response, err: unknown) {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const e = err as { status: number; message: string; code?: string };
    return res.status(e.status).json({ error: e.message, code: e.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}

export async function estimate(req: Request, res: Response) {
  const parsed = estimateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const result = await orderService.estimateOrder(parsed.data);
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function create(req: Request, res: Response) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const order = await orderService.createOrder(req.user!.userId, parsed.data);
    return res.status(201).json(order);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const orders = await orderService.listClientOrders(req.user!.userId);
    return res.json(orders);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function getOne(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    const order = await orderService.getClientOrder(req.user!.userId, id);
    return res.json(order);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function cancel(req: Request, res: Response) {
  try {
    const result = await orderService.cancelOrder(req.user!.userId, String(req.params.id));
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function listBids(req: Request, res: Response) {
  try {
    const bids = await bidService.listOrderBids(req.user!.userId, String(req.params.id));
    return res.json(bids);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function selectBid(req: Request, res: Response) {
  try {
    const result = await bidService.selectDriverBid(
      req.user!.userId,
      String(req.params.id),
      String(req.params.bidId)
    );
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function track(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    const tracking = await orderService.trackOrder(req.user!.userId, id);
    return res.json(tracking);
  } catch (err) {
    return handleError(res, err);
  }
}
