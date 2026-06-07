import { Request, Response } from 'express';
import { adminCreateUserSchema, adminUpdateUserSchema, toggleUserActiveSchema } from '../validators/admin.validator';
import * as adminService from '../services/admin.service';

function handleError(res: Response, err: unknown) {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const e = err as { status: number; message: string; code?: string };
    return res.status(e.status).json({ error: e.message, code: e.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}

export async function stats(_req: Request, res: Response) {
  try {
    const data = await adminService.getStats();
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function users(req: Request, res: Response) {
  try {
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const data = await adminService.listUsers(role);
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function createUser(req: Request, res: Response) {
  const parsed = adminCreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const user = await adminService.createUser(parsed.data);
    return res.status(201).json(user);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const data = await adminService.getUserDetail(String(req.params.id));
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    await adminService.deleteUser(String(req.params.id), req.user!.userId);
    return res.json({ success: true });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function updateUser(req: Request, res: Response) {
  const parsed = adminUpdateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const user = await adminService.updateUser(String(req.params.id), parsed.data);
    return res.json(user);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function toggleUserActive(req: Request, res: Response) {
  const parsed = toggleUserActiveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const user = await adminService.toggleUserActive(
      String(req.params.id),
      parsed.data.active,
      req.user!.userId
    );
    return res.json(user);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function finances(_req: Request, res: Response) {
  try {
    const data = await adminService.listFinancialTransactions();
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function orders(_req: Request, res: Response) {
  try {
    const data = await adminService.listAllOrders();
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function deliveries(_req: Request, res: Response) {
  try {
    const data = await adminService.listAllDeliveries();
    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
}
