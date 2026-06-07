import { Request, Response } from 'express';
import {
  createPackageSchema,
  linkOrderSchema,
  shipPackageSchema,
  updatePackageStatusSchema,
} from '../validators/package.validator';
import * as packageService from '../services/package.service';

function handleError(res: Response, err: unknown) {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const e = err as { status: number; message: string; code?: string };
    return res.status(e.status).json({ error: e.message, code: e.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}

export async function create(req: Request, res: Response) {
  const parsed = createPackageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const pkg = await packageService.createPackage(req.user!.userId, parsed.data);
    return res.status(201).json(pkg);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const packages = await packageService.listMerchantPackages(req.user!.userId);
    return res.json(packages);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function ship(req: Request, res: Response) {
  const parsed = shipPackageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const result = await packageService.shipToClient(req.user!.userId, parsed.data);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function getPackage(req: Request, res: Response) {
  try {
    const data = await packageService.getMerchantPackageDetail(
      req.user!.userId,
      String(req.params.id)
    );
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function linkableOrders(_req: Request, res: Response) {
  try {
    const orders = await packageService.listLinkableOrders();
    return res.json(orders);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function linkOrder(req: Request, res: Response) {
  const parsed = linkOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const pkg = await packageService.linkPackageToOrder(
      req.user!.userId,
      String(req.params.id),
      parsed.data.orderId
    );
    return res.json(pkg);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function updateStatus(req: Request, res: Response) {
  const parsed = updatePackageStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const pkg = await packageService.updatePackageStatus(
      req.user!.userId,
      String(req.params.id),
      parsed.data.status
    );
    return res.json(pkg);
  } catch (err) {
    return handleError(res, err);
  }
}
