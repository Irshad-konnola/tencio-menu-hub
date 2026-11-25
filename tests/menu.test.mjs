import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureData, kolarId } from './helpers/fixture-server.mjs';
import { selectMenuItems, buildCateringUrl, normalizeWhatsAppNumber, buildCateringEnquiryUrl, buildWhatsAppShareUrl } from '../src/lib/menu.mjs';

const data = fixtureData();
const options = { cafeId: kolarId, features: { catering_menu: { enabled: true } } };
const select = overrides => selectMenuItems(data.MenuItem, data.Category, { ...options, ...overrides });

test('outlet only shows available public dishes for catering tenants', () => {
  assert.deepEqual(select().map(i => i.id), ['biryani']);
});
test('catering includes out-of-stock dishes at exactly the same prices and units', () => {
  const items = select({ mode: 'catering' });
  assert.deepEqual(items.map(i => i.id), ['biryani', 'beef', 'payasam']);
  assert.equal(items.find(i => i.id === 'beef').price, 450);
  assert.equal(items.find(i => i.id === 'beef').unit, '1 kg');
});
test('hidden, orphaned and other-tenant items stay out of every menu and search', () => {
  for (const mode of ['outlet', 'catering']) {
    const items = [...data.MenuItem, { id: 'orphan', cafeId: kolarId, categoryId: 'missing', name: 'Orphan', inStock: true }];
    const visible = selectMenuItems(items, data.Category, { ...options, mode });
    assert.ok(visible.every(i => !['secret', 'chai', 'iced', 'orphan'].includes(i.id)));
    assert.equal(select({ mode, searchQuery: 'Secret' }).length, 0);
  }
});
test('Chill Chai retains unavailable items with catering disabled', () => {
  const cafeId = data.Cafe[1].id;
  const items = selectMenuItems(data.MenuItem, data.Category, { cafeId, features: {} });
  assert.deepEqual(items.map(i => i.id), ['chai', 'iced']);
});
test('stock updates remove and restore outlet dishes without changing catering', () => {
  const items = structuredClone(data.MenuItem);
  items.find(i => i.id === 'beef').inStock = true;
  assert.deepEqual(selectMenuItems(items, data.Category, options).map(i => i.id), ['biryani', 'beef']);
  items.find(i => i.id === 'biryani').inStock = false;
  assert.deepEqual(selectMenuItems(items, data.Category, options).map(i => i.id), ['beef']);
  assert.equal(selectMenuItems(items, data.Category, { ...options, mode: 'catering' }).length, 3);
});
test('catering category filters and Malayalam/description searches work for unavailable dishes', () => {
  assert.deepEqual(select({ mode: 'catering', activeCategory: 'desserts' }).map(i => i.id), ['payasam']);
  assert.deepEqual(select({ mode: 'catering', searchQuery: '  BEEF  ' }).map(i => i.id), ['beef']);
  assert.deepEqual(select({ mode: 'catering', searchQuery: 'ബീഫ്' }).map(i => i.id), ['beef']);
  assert.deepEqual(select({ mode: 'catering', searchQuery: 'celebration' }).map(i => i.id), ['payasam']);
});
test('sorting honors menu order and never mutates the shared catalog', () => {
  const before = structuredClone(data.MenuItem);
  const items = selectMenuItems([{ ...before[0], sortOrder: 10 }, ...before.slice(1)], data.Category, { ...options, mode: 'catering' });
  assert.equal(items.at(-1).id, 'biryani');
  assert.deepEqual(data.MenuItem, before);
});
test('shareable URLs omit outlet table numbers and fragments', () => {
  assert.equal(buildCateringUrl('https://example.test/kolar-kitchen/?table=7#menu'), 'https://example.test/kolar-kitchen/catering');
  assert.throws(() => buildCateringUrl('javascript:alert(1)'));
});
test('WhatsApp sharing preserves the menu URL and special characters', () => {
  const url = 'https://example.test/kolar-kitchen/catering';
  const link = new URL(buildWhatsAppShareUrl('Kolar & Kitchen', url));
  assert.equal(link.origin, 'https://wa.me');
  assert.equal(link.searchParams.get('text'), `Explore Kolar & Kitchen's catering menu: ${url}`);
});
test('contact numbers are normalized, optional and validated', () => {
  assert.equal(normalizeWhatsAppNumber('+91 80756 03490'), '918075603490');
  assert.equal(normalizeWhatsAppNumber(''), null);
  for (const value of ['123', '00918075603490', '918075603490<script>', '1234567890123456']) assert.throws(() => normalizeWhatsAppNumber(value));
});
test('catering enquiries go to the supplied client number with event details', () => {
  const link = new URL(buildCateringEnquiryUrl('+91 8075603490', 'Kolar Kitchen', 'https://example.test/kolar-kitchen/catering'));
  assert.equal(link.pathname, '/918075603490');
  for (const text of ['Event date:', 'Number of guests:', 'Location:', '/kolar-kitchen/catering']) assert.ok(link.searchParams.get('text').includes(text));
  assert.equal(buildCateringEnquiryUrl('', 'Kolar Kitchen', ''), null);
});
