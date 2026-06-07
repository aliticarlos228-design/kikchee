/**
 * Vérification E2E kikchee — exécuter: npx tsx scripts/e2e-verify.ts
 */
const BASE = process.env.API_URL || 'http://localhost:3000/api';
const PASS = 'Demo1234!';
const ADMIN_PASS = 'Admin1234!';

type Json = Record<string, unknown>;

const results: { name: string; ok: boolean; detail?: string }[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.error(`  ✗ ${name} — ${detail}`);
}

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: Json }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: Json = {};
  try {
    data = (await res.json()) as Json;
  } catch {
    data = {};
  }
  return { status: res.status, data };
}

const lomePickup = {
  street: 'Boulevard du 13 Janvier',
  city: 'Lomé',
  postalCode: 'BP',
  latitude: 6.1256,
  longitude: 1.2252,
  label: 'Départ test',
};

const lomeDelivery = {
  street: 'Avenue de la Libération',
  city: 'Lomé',
  postalCode: 'BP',
  latitude: 6.14,
  longitude: 1.24,
  label: 'Arrivée test',
};

async function main() {
  console.log('\n=== kikchee E2E Verification ===\n');

  // 1. Health
  try {
    const health = await fetch(`${BASE}/health`);
    if (health.ok) pass('API health');
    else fail('API health', `status ${health.status}`);
  } catch (e) {
    fail('API health', String(e));
    printSummary();
    process.exit(1);
  }

  // 2. Admin
  const adminLogin = await req('POST', '/auth/login', {
    email: 'admin@logiflow.fr',
    password: ADMIN_PASS,
  });
  const adminToken = adminLogin.data.token as string | undefined;
  if (adminLogin.status === 200 && adminToken) {
    pass('Admin login');
    const stats = await req('GET', '/admin/stats', undefined, adminToken);
    if (stats.status === 200) pass('Admin stats', `users=${stats.data.totalUsers}`);
    else fail('Admin stats', JSON.stringify(stats.data));

    const users = await req('GET', '/admin/users', undefined, adminToken);
    if (users.status === 200 && Array.isArray(users.data)) {
      pass('Admin users list', `${(users.data as unknown[]).length} users`);
    } else fail('Admin users list', JSON.stringify(users.data));

    const finances = await req('GET', '/admin/finances', undefined, adminToken);
    if (finances.status === 200) pass('Admin finances');
    else fail('Admin finances', JSON.stringify(finances.data));
  } else {
    fail('Admin login', JSON.stringify(adminLogin.data));
  }

  // 3. Client order (MOTO)
  const ts = Date.now();
  const clientEmail = `e2e-client-${ts}@test.fr`;
  const clientReg = await req('POST', '/auth/register', {
    email: clientEmail,
    password: PASS,
    firstName: 'Client',
    lastName: 'E2E',
    role: 'client',
  });
  let clientToken: string | undefined;
  if (clientReg.status === 201) {
    const clientLogin = await req('POST', '/auth/login', { email: clientEmail, password: PASS });
    clientToken = clientLogin.data.token as string | undefined;
    if (clientToken) pass('Client register + login');
    else fail('Client auth', JSON.stringify(clientLogin.data));
  } else {
    const clientLogin = await req('POST', '/auth/login', { email: clientEmail, password: PASS });
    clientToken = clientLogin.data.token as string | undefined;
    if (clientToken) pass('Client login (existing)');
    else fail('Client auth', JSON.stringify(clientReg.data));
  }

  if (clientToken) {

    const estimate = await req(
      'POST',
      '/orders/estimate',
      {
        pickupAddress: lomePickup,
        deliveryAddress: lomeDelivery,
        weight: 2,
        vehicleType: 'MOTO',
      },
      clientToken
    );
    if (estimate.status === 200 && estimate.data.estimatedPrice)
      pass('Client estimate MOTO', `${estimate.data.estimatedPrice} FCFA`);
    else fail('Client estimate MOTO', JSON.stringify(estimate.data));

    const order = await req(
      'POST',
      '/orders',
      {
        pickupAddress: lomePickup,
        deliveryAddress: lomeDelivery,
        weight: 2,
        vehicleType: 'MOTO',
        paymentMethod: 'CASH',
        description: 'E2E client order',
      },
      clientToken
    );
    const orderId = order.data.id as string | undefined;
    if (order.status === 201 && orderId) {
      pass('Client create order MOTO', orderId.slice(0, 8));
    } else {
      fail('Client create order MOTO', JSON.stringify(order.data));
    }

    // Profile locked
    const profilePatch = await req(
      'PATCH',
      '/auth/me',
      { firstName: 'Hack' },
      clientToken
    );
    if (profilePatch.status === 403) pass('Client profile locked');
    else fail('Client profile locked', `status ${profilePatch.status}`);
  }

  // 4. Driver MOTO
  const driverMotoLogin = await req('POST', '/auth/login', {
    email: 'driver-moto@demo.fr',
    password: PASS,
  });
  const motoToken = driverMotoLogin.data.token as string | undefined;
  if (motoToken) {
    pass('Driver MOTO login');
    const available = await req('GET', '/deliveries/available', undefined, motoToken);
    const list = available.data as unknown as Array<{ order: { vehicleType: string } }>;
    if (available.status === 200 && Array.isArray(list)) {
      const types = [...new Set(list.map((d) => d.order?.vehicleType))];
      if (types.every((t) => t === 'MOTO' || types.length === 0))
        pass('Driver MOTO filter', `${list.length} missions, types=${types.join(',') || 'none'}`);
      else fail('Driver MOTO filter', `wrong types: ${types.join(',')}`);
    } else fail('Driver MOTO available', JSON.stringify(available.data));
  } else {
    fail('Driver MOTO login', JSON.stringify(driverMotoLogin.data));
  }

  // 5. Driver TAXI should NOT see MOTO orders (if any moto in list from client order)
  const driverTaxiLogin = await req('POST', '/auth/login', {
    email: 'driver-voiture@demo.fr',
    password: PASS,
  });
  const taxiToken = driverTaxiLogin.data.token as string | undefined;
  if (taxiToken) {
    pass('Driver TAXI login');
    const available = await req('GET', '/deliveries/available', undefined, taxiToken);
    const list = available.data as unknown as Array<{ order: { vehicleType: string } }>;
    if (available.status === 200 && Array.isArray(list)) {
      const hasMoto = list.some((d) => d.order?.vehicleType === 'MOTO');
      if (!hasMoto) pass('Driver TAXI no MOTO missions');
      else fail('Driver TAXI no MOTO missions', 'MOTO found in list');
    }
  } else {
    fail('Driver TAXI login', JSON.stringify(driverTaxiLogin.data));
  }

  // 6. Merchant ship + detail + chat
  const merchantLogin = await req('POST', '/auth/login', {
    email: 'merchant@demo.fr',
    password: PASS,
  });
  const merchantToken = merchantLogin.data.token as string | undefined;
  if (merchantToken) {
    pass('Merchant login');

    const ship = await req(
      'POST',
      '/packages/ship',
      {
        recipientName: 'Client E2E',
        recipientPhone: '90000001',
        pickupAddress: lomePickup,
        deliveryAddress: lomeDelivery,
        weight: 3,
        vehicleType: 'TAXI',
        description: 'E2E merchant ship',
      },
      merchantToken
    );
    const packageId = ship.data.packageId as string | undefined;
    const shipOrderId = ship.data.orderId as string | undefined;
    if (ship.status === 201 && packageId && shipOrderId) {
      pass('Merchant ship TAXI', `pkg=${packageId.slice(0, 4)}`);
    } else {
      fail('Merchant ship TAXI', JSON.stringify(ship.data));
    }

    if (packageId) {
      const detail = await req('GET', `/packages/${packageId}`, undefined, merchantToken);
      if (detail.status === 200 && detail.data.orderDetail) pass('Merchant package detail');
      else fail('Merchant package detail', JSON.stringify(detail.data));
    }

    const pkgList = await req('GET', '/packages', undefined, merchantToken);
    if (pkgList.status === 200 && Array.isArray(pkgList.data)) {
      pass('Merchant packages list', `${(pkgList.data as unknown[]).length} colis`);
    } else fail('Merchant packages list', JSON.stringify(pkgList.data));

    // Merchant chat routes (before driver accepts — should 409)
    if (shipOrderId) {
      const chatEarly = await req(
        'POST',
        `/chat/orders/${shipOrderId}/messages`,
        { text: 'test avant accept' },
        merchantToken
      );
      if (chatEarly.status === 409) pass('Merchant chat blocked before accept');
      else if (chatEarly.status === 403) fail('Merchant chat route', '403 forbidden — check chat routes');
      else fail('Merchant chat before accept', `status ${chatEarly.status}`);
    }
  } else {
    fail('Merchant login', JSON.stringify(merchantLogin.data));
  }

  // 7. Accept delivery as TAXI driver + chat
  if (taxiToken && merchantToken) {
    const available = await req('GET', '/deliveries/available', undefined, taxiToken);
    const list = available.data as unknown as Array<{ orderId: string; order: { vehicleType: string } }>;
    const taxiMission = list?.find((d) => d.order?.vehicleType === 'TAXI');
    if (taxiMission) {
      const accept = await req('POST', `/deliveries/${taxiMission.orderId}/accept`, {}, taxiToken);
      if (accept.status === 200) {
        pass('Driver TAXI accept merchant order');

        const merchantConvs = await req('GET', '/chat/conversations', undefined, merchantToken);
        if (merchantConvs.status === 200 && Array.isArray(merchantConvs.data)) {
          pass('Merchant chat conversations', `${(merchantConvs.data as unknown[]).length} conv`);
        } else fail('Merchant chat conversations', JSON.stringify(merchantConvs.data));

        const orderId = taxiMission.orderId;
        const msgMerchant = await req(
          'POST',
          `/chat/orders/${orderId}/messages`,
          { text: 'Bonjour livreur E2E' },
          merchantToken
        );
        if (msgMerchant.status === 201) pass('Merchant send message');
        else fail('Merchant send message', JSON.stringify(msgMerchant.data));

        const msgDriver = await req(
          'GET',
          `/chat/orders/${orderId}/messages`,
          undefined,
          taxiToken
        );
        if (msgDriver.status === 200 && Array.isArray(msgDriver.data) && (msgDriver.data as unknown[]).length > 0) {
          pass('Driver receives merchant message');
        } else fail('Driver receives merchant message', JSON.stringify(msgDriver.data));

        const reply = await req(
          'POST',
          `/chat/orders/${orderId}/messages`,
          { text: 'Reçu commerçant' },
          taxiToken
        );
        if (reply.status === 201) pass('Driver reply to merchant');
        else fail('Driver reply to merchant', JSON.stringify(reply.data));
      } else {
        fail('Driver TAXI accept', JSON.stringify(accept.data));
      }
    } else {
      fail('Driver TAXI accept', 'no TAXI mission found');
    }
  }

  // 8. Seed demo accounts login
  for (const email of ['client@demo.fr', 'driver-moto@demo.fr', 'merchant@demo.fr']) {
    const r = await req('POST', '/auth/login', { email, password: PASS });
    if (r.status === 200) pass(`Login ${email.split('@')[0]}`);
    else fail(`Login ${email}`, JSON.stringify(r.data));
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const ko = results.filter((r) => !r.ok).length;
  console.log(`\n=== Résultat: ${ok} OK, ${ko} échec(s) ===\n`);
  if (ko > 0) {
    console.log('Échecs:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
