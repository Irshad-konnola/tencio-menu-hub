// Start `npm run preview:catering` first. These tests only read local pages.
import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.MENUHUB_SMOKE_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) {
  throw new Error('Route smoke tests require a local fixture preview.');
}
async function page(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const html = await response.text();
  // Strip hydration payloads: assert on rendered markup, not serialized catalog data.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return { status: response.status, html, markup };
}

test('catering renders all public dishes, prices, descriptions and Malayalam names', async () => {
  const result = await page('/kolar-kitchen/catering');
  assert.equal(result.status, 200);
  for (const text of ['Chicken Biryani', 'Beef Roast', 'Palada Payasam', 'ബീഫ് റോസ്റ്റ്', '450', '1 kg', 'Kerala spices']) assert.ok(result.markup.includes(text), text);
  for (const text of ['Secret Dish', 'Private Test Category', '>Unavailable<', 'Call waiter']) assert.ok(!result.markup.includes(text), text);
});
test('Kolar outlet renders only available dishes', async () => {
  const result = await page('/kolar-kitchen');
  assert.equal(result.status, 200);
  assert.ok(result.markup.includes('Chicken Biryani'));
  for (const text of ['Beef Roast', 'Palada Payasam', 'Secret Dish']) assert.ok(!result.markup.includes(text), text);
});
test('catering ignores table query parameters', async () => {
  const result = await page('/kolar-kitchen/catering?table=99');
  assert.equal(result.status, 200);
  assert.ok(!result.markup.includes('Call waiter'));
  assert.ok(!result.markup.includes('Table <!-- -->99'));
});
test('Chill Chai keeps its original available/unavailable menu behavior', async () => {
  const result = await page('/chill-chai');
  assert.equal(result.status, 200);
  for (const text of ['Masala Chai', 'Iced Tea', 'Unavailable']) assert.ok(result.markup.includes(text), text);
});
test('disabled and unknown catering URLs return HTTP 404', async () => {
  assert.equal((await page('/chill-chai/catering')).status, 404);
  assert.equal((await page('/missing-restaurant/catering')).status, 404);
});
test('catering has restaurant-specific WhatsApp preview metadata and no private fields', async () => {
  const result = await page('/kolar-kitchen/catering');
  assert.ok(result.html.includes('<title>Kolar Kitchen | Catering Menu</title>'));
  assert.ok(result.html.includes('property="og:title" content="Kolar Kitchen | Catering Menu"'));
  for (const text of ['PRIVATE-PIN', 'staffPasscode', 'ownerId', 'fixture-service-key']) assert.ok(!result.html.includes(text), text);
});
