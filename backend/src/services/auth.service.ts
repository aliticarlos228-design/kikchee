import { VehicleType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { APP_NAME } from '../constants/brand';
import { formatUser } from '../validators/auth.validator';

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'client' | 'merchant' | 'driver';
  vehicleType?: VehicleType;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw { status: 409, message: 'Cet email est déjà utilisé', code: 'EMAIL_EXISTS' };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      vehicleType: data.role === 'driver' ? data.vehicleType : null,
    },
  });

  return formatUser(user);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    throw { status: 401, message: 'Email ou mot de passe incorrect', code: 'INVALID_CREDENTIALS' };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw { status: 401, message: 'Email ou mot de passe incorrect', code: 'INVALID_CREDENTIALS' };
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: '24h',
  });

  return { token, user: formatUser(user) };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
  }
  return formatUser(user);
}

export async function updateProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    vehicleType?: VehicleType;
  }
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw { status: 404, message: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' };
  }

  if (existing.role === 'client' || existing.role === 'merchant' || existing.role === 'driver') {
    throw {
      status: 403,
      message: `Les informations de profil ne peuvent être modifiées que par l'administration ${APP_NAME}`,
      code: 'PROFILE_LOCKED',
    };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return formatUser(user);
}
