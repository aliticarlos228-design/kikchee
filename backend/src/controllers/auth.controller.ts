import { Request, Response } from 'express';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';

function handleError(res: Response, err: unknown) {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const e = err as { status: number; message: string; code?: string };
    return res.status(e.status).json({ error: e.message, code: e.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const user = await authService.registerUser(parsed.data);
    return res.status(201).json(user);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const result = await authService.loginUser(parsed.data.email, parsed.data.password);
    return res.json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = await authService.getProfile(req.user!.userId);
    return res.json(user);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function updateMe(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message || 'Données invalides',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const user = await authService.updateProfile(req.user!.userId, parsed.data);
    return res.json(user);
  } catch (err) {
    return handleError(res, err);
  }
}
