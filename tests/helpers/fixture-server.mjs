import { createServer } from 'node:http';

const timestamp = '2026-01-01T12:00:00.000Z';
const kolar = '00000000-0000-4000-8000-000000000001';
const chill = '00000000-0000-4000-8000-000000000002';
export const ownerId = '00000000-0000-4000-8000-000000000003';
export const otherOwnerId = '00000000-0000-4000-8000-000000000004';
export const kolarId = kolar;

export function fixtureData() {
  return {
    Cafe: [
      { id: kolar, name: 'Kolar Kitchen', slug: 'kolar-kitchen', ownerId, staffPasscode: 'PRIVATE-PIN', hasTableService: true, serviceType: 'PREMIUM', cateringWhatsappNumber: '918075603490' },
      { id: chill, name: 'Chill Chai', slug: 'chill-chai', ownerId: otherOwnerId, hasTableService: true, serviceType: 'PREMIUM' },
    ],
    CafeFeatures: [
      ...['catering_menu', 'table_service', 'item_units', 'billing', 'category_highlight'].map(featureKey => ({ cafeId: kolar, featureKey, enabled: true, displayMode: 'hidden' })),
      { cafeId: chill, featureKey: 'catering_menu', enabled: false, displayMode: 'hidden' },
      { cafeId: chill, featureKey: 'table_service', enabled: true, displayMode: 'locked' },
    ],
    Category: [
      { id: 'mains', cafeId: kolar, name: 'Main Courses', isHidden: false, isHighlighted: true, sortOrder: 0, createdAt: timestamp },
      { id: 'desserts', cafeId: kolar, name: 'Desserts', isHidden: false, sortOrder: 1, createdAt: timestamp },
      { id: 'private', cafeId: kolar, name: 'Private Test Category', isHidden: true, sortOrder: 2, createdAt: timestamp },
      { id: 'drinks', cafeId: chill, name: 'Drinks', isHidden: false, sortOrder: 0, createdAt: timestamp },
    ],
    MenuItem: [
      { id: 'biryani', cafeId: kolar, categoryId: 'mains', name: 'Chicken Biryani', malayalamName: 'ചിക്കൻ ബിരിയാണി', description: 'Fragrant rice, tender chicken, and house spices.', price: 180, unit: 'Plate', inStock: true, sortOrder: 0, createdAt: timestamp, imageUrl: '/icon.png' },
      { id: 'beef', cafeId: kolar, categoryId: 'mains', name: 'Beef Roast', malayalamName: 'ബീഫ് റോസ്റ്റ്', description: 'Slow cooked with Kerala spices. Available for catering.', price: 450, unit: '1 kg', inStock: false, sortOrder: 1, createdAt: timestamp, imageUrl: '/icon.png' },
      { id: 'payasam', cafeId: kolar, categoryId: 'desserts', name: 'Palada Payasam', description: 'A traditional celebration dessert.', price: 250, unit: '1 litre', inStock: false, sortOrder: 2, createdAt: timestamp, imageUrl: '/icon.png' },
      { id: 'secret', cafeId: kolar, categoryId: 'private', name: 'Secret Dish', price: 999, inStock: true, createdAt: timestamp },
      { id: 'chai', cafeId: chill, categoryId: 'drinks', name: 'Masala Chai', description: 'Our house blend.', price: 25, inStock: true, createdAt: timestamp, imageUrl: '/icon.png' },
      { id: 'iced', cafeId: chill, categoryId: 'drinks', name: 'Iced Tea', price: 50, inStock: false, createdAt: timestamp, imageUrl: '/icon.png' },
    ],
    CafeBanner: [],
    SuperAdminSession: [],
    ServiceRequest: [],
  };
}

function tokenFor(id) {
  const base64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${base64({ alg: 'HS256', typ: 'JWT' })}.${base64({ sub: id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture-signature`;
}

export async function createFixtureServer() {
  const state = fixtureData();
  const requests = [];
  const failures = new Set();
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const respond = (status, data) => {
      res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' });
      res.end(JSON.stringify(data));
    };
    if (req.method === 'OPTIONS') return respond(200, {});
    let body = '';
    for await (const chunk of req) body += chunk;
    // Never log authorization headers or tokens, even in a test fixture.
    requests.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams) });
    const userFor = id => ({ id, aud: 'authenticated', role: 'authenticated', email: 'owner@example.test', app_metadata: {}, user_metadata: {}, created_at: timestamp });
    if (url.pathname === '/auth/v1/token') {
      const data = JSON.parse(body || '{}');
      if (data.password !== 'fixture-password') return respond(400, { error: 'invalid_grant', error_description: 'Invalid credentials' });
      return respond(200, { access_token: tokenFor(ownerId), token_type: 'bearer', expires_in: 3600, refresh_token: 'fixture-refresh-token', user: userFor(ownerId) });
    }
    if (url.pathname === '/auth/v1/user') {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (token === 'owner-token' || token === tokenFor(ownerId)) return respond(200, userFor(ownerId));
      if (token === 'other-owner-token') return respond(200, userFor(otherOwnerId));
      // Preview login tokens have a changing exp, so also accept their signed fixture payload.
      if (token.endsWith('.fixture-signature')) {
        try { return respond(200, userFor(JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).sub)); } catch { /* Invalid fixture token */ }
      }
      return respond(401, { message: 'Invalid token', code: 'bad_jwt' });
    }
    const table = url.pathname.replace('/rest/v1/', '');
    if (!Array.isArray(state[table])) return respond(404, { message: 'Unknown fixture table' });
    if (failures.has(table)) return respond(500, { message: 'Simulated database failure' });
    let rows = state[table].filter(row => [...url.searchParams].every(([key, value]) =>
      !value.startsWith('eq.') || String(row[key]) === value.slice(3),
    ));
    if (req.method === 'PATCH') {
      const update = JSON.parse(body || '{}');
      rows.forEach(row => Object.assign(row, update));
    } else if (req.method === 'POST') {
      const input = JSON.parse(body || '{}');
      rows = Array.isArray(input) ? input : [input];
      state[table].push(...rows);
    } else if (req.method === 'DELETE') {
      state[table] = state[table].filter(row => !rows.includes(row));
      return respond(200, []);
    }
    const fields = url.searchParams.get('select');
    let data = structuredClone(rows);
    if (fields && fields !== '*') {
      const selected = fields.split(',').map(field => field.trim());
      data = data.map(row => {
        const projected = selected.includes('*') ? { ...row } : Object.fromEntries(selected.map(field => [field, row[field]]));
        if (selected.includes('Category(*)')) projected.Category = state.Category.find(c => c.id === row.categoryId) || null;
        return projected;
      });
    }
    if ((req.headers.accept || '').includes('application/vnd.pgrst.object+json')) {
      if (data.length !== 1) return respond(406, { code: 'PGRST116', message: 'Expected a single row' });
      return respond(200, data[0]);
    }
    return respond(200, data);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { state, requests, failures, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
