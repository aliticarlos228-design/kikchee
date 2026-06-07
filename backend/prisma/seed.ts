import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@logiflow.fr' },
    update: {},
    create: {
      email: 'admin@logiflow.fr',
      passwordHash: await bcrypt.hash('Admin1234!', 10),
      role: 'admin',
      firstName: 'Admin',
      lastName: 'kikchee',
      phone: '0100000000',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@demo.fr' },
    update: {},
    create: {
      email: 'client@demo.fr',
      passwordHash,
      role: 'client',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '0612345678',
    },
  });

  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@demo.fr' },
    update: {},
    create: {
      email: 'merchant@demo.fr',
      passwordHash,
      role: 'merchant',
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '0623456789',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@demo.fr' },
    update: { vehicleType: 'TAXI', latitude: 6.1256, longitude: 1.2252 },
    create: {
      email: 'driver@demo.fr',
      passwordHash,
      role: 'driver',
      firstName: 'Paul',
      lastName: 'Bernard',
      phone: '0634567890',
      vehicleType: 'TAXI',
      latitude: 6.1256,
      longitude: 1.2252,
    },
  });

  const driverVoiture = await prisma.user.upsert({
    where: { email: 'driver-voiture@demo.fr' },
    update: { vehicleType: 'TAXI', latitude: 6.1325, longitude: 1.2185 },
    create: {
      email: 'driver-voiture@demo.fr',
      passwordHash,
      role: 'driver',
      firstName: 'Afi',
      lastName: 'Voiture',
      phone: '0700000002',
      vehicleType: 'TAXI',
      latitude: 6.1325,
      longitude: 1.2185,
    },
  });

  const driverMoto = await prisma.user.upsert({
    where: { email: 'driver-moto@demo.fr' },
    update: { vehicleType: 'MOTO', latitude: 6.14, longitude: 1.24 },
    create: {
      email: 'driver-moto@demo.fr',
      passwordHash,
      role: 'driver',
      firstName: 'Kodjo',
      lastName: 'Moto',
      phone: '0700000001',
      vehicleType: 'MOTO',
      latitude: 6.14,
      longitude: 1.24,
    },
  });

  const driverFourgon = await prisma.user.upsert({
    where: { email: 'driver-fourgon@demo.fr' },
    update: { vehicleType: 'FOURGON', latitude: 6.152, longitude: 1.215 },
    create: {
      email: 'driver-fourgon@demo.fr',
      passwordHash,
      role: 'driver',
      firstName: 'Komlan',
      lastName: 'Fourgon',
      phone: '0700000003',
      vehicleType: 'FOURGON',
      latitude: 6.152,
      longitude: 1.215,
    },
  });

  console.log('Seed OK:', {
    admin: admin.email,
    client: client.email,
    merchant: merchant.email,
    driver: driver.email,
    driverVoiture: driverVoiture.email,
    driverMoto: driverMoto.email,
    driverFourgon: driverFourgon.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
