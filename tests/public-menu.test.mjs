import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createFixtureServer, kolarId } from './helpers/fixture-server.mjs';
import { fetchPublicMenu } from '../src/lib/publicMenu.mjs';
import { saveCateringContact } from '../src/lib/cateringSettings.mjs';

let fixture;
let client;
beforeEach(async () => {
  fixture = await createFixtureServer();
  client = createClient(fixture.url, 'fixture-service-key', { auth: { persistSession: false, autoRefreshToken: false } });
});
afterEach(async () => { await fixture.close(); });

test('public catering projection includes full visible catalog and no owner/PIN data', async () => {
  const menu = await fetchPublicMenu(client, 'kolar-kitchen', 'catering');
  assert.equal(menu.cafe.cateringWhatsappNumber, '918075603490');
  assert.deepEqual(menu.items.map(i => i.id), ['biryani', 'beef', 'payasam']);
  assert.equal(menu.categories.length, 2);
  const serialized = JSON.stringify(menu);
  for (const secret of ['ownerId', 'staffPasscode', 'PRIVATE-PIN', 'Secret Dish', 'Masala Chai']) assert.ok(!serialized.includes(secret));
});
test('all catalog queries are scoped to the resolved tenant', async () => {
  await fetchPublicMenu(client, 'kolar-kitchen', 'catering');
  for (const request of fixture.requests.filter(r => /Category|MenuItem|CafeFeatures/.test(r.path))) {
    assert.equal(request.query.cafeId, `eq.${kolarId}`);
  }
});
test('disabled/missing catering flags deny the route before reading catalog or contact', async () => {
  assert.equal(await fetchPublicMenu(client, 'chill-chai', 'catering'), null);
  assert.ok(!fixture.requests.some(r => r.path.includes('/MenuItem')));
  fixture.state.CafeFeatures = fixture.state.CafeFeatures.filter(f => f.featureKey !== 'catering_menu');
  assert.equal(await fetchPublicMenu(client, 'kolar-kitchen', 'catering'), null);
});
test('existing outlet works before catering migration and never reads the new column', async () => {
  fixture.state.CafeFeatures = fixture.state.CafeFeatures.filter(f => f.featureKey !== 'catering_menu');
  delete fixture.state.Cafe[0].cateringWhatsappNumber;
  const menu = await fetchPublicMenu(client, 'kolar-kitchen');
  assert.equal(menu.cafe.name, 'Kolar Kitchen');
  assert.ok(!fixture.requests.some(r => r.query.select?.includes('cateringWhatsappNumber')));
});
test('unknown slugs return not-found; invalid modes and backend failures are explicit', async () => {
  assert.equal(await fetchPublicMenu(client, 'missing', 'catering'), null);
  assert.equal(await fetchPublicMenu(client, '', 'catering'), null);
  await assert.rejects(fetchPublicMenu(client, 'kolar-kitchen', 'admin'), /Invalid menu mode/);
  fixture.failures.add('MenuItem');
  await assert.rejects(fetchPublicMenu(client, 'kolar-kitchen', 'catering'), /Unable to load items/);
});
test('hidden category changes and feature revocation apply on the next read', async () => {
  fixture.state.Category.find(c => c.id === 'mains').isHidden = true;
  const menu = await fetchPublicMenu(client, 'kolar-kitchen', 'catering');
  assert.deepEqual(menu.items.map(i => i.id), ['payasam']);
  fixture.state.CafeFeatures.find(f => f.cafeId === kolarId && f.featureKey === 'catering_menu').enabled = false;
  assert.equal(await fetchPublicMenu(client, 'kolar-kitchen', 'catering'), null);
});
test('owner can update and remove their catering contact', async () => {
  assert.deepEqual(await saveCateringContact(client, kolarId, '+91 80756 03490', 'owner-token'), { cateringWhatsappNumber: '918075603490' });
  assert.deepEqual(await saveCateringContact(client, kolarId, '', 'owner-token'), { cateringWhatsappNumber: null });
  assert.equal(fixture.state.Cafe[0].cateringWhatsappNumber, null);
});
test('missing, forged, other-owner and disabled-feature writes are rejected', async () => {
  for (const token of [undefined, 'forged-token', 'other-owner-token']) {
    await assert.rejects(saveCateringContact(client, kolarId, '+91 8075603490', token));
  }
  fixture.state.CafeFeatures.find(f => f.cafeId === kolarId && f.featureKey === 'catering_menu').enabled = false;
  await assert.rejects(saveCateringContact(client, kolarId, '+91 8075603490', 'owner-token'), /not enabled/);
  assert.ok(!fixture.requests.some(r => r.method === 'PATCH'));
});
test('invalid phone numbers never reach the database update', async () => {
  await assert.rejects(saveCateringContact(client, kolarId, '123', 'owner-token'), /country code/);
  assert.ok(!fixture.requests.some(r => r.method === 'PATCH'));
});
