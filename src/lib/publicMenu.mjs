import { FEATURE_KEYS, isCateringEnabled, sortCategories } from './menu.mjs';

// Explicit public fields: never serialize owner IDs, PINs, or other Cafe settings.
const CAFE_FIELDS = 'id, name, slug, hasTableService, serviceType';
const CATEGORY_FIELDS = 'id, cafeId, name, isHidden, isHighlighted, sortOrder, createdAt';
const ITEM_FIELDS = 'id, cafeId, categoryId, name, malayalamName, price, unit, description, imageUrl, inStock, sortOrder, createdAt';

function checkError(result, context) {
  if (result.error) throw new Error(`Unable to load ${context}. Please try again.`);
  return result.data || [];
}

export async function fetchPublicMenu(client, slug, mode = 'outlet') {
  if (!['outlet', 'catering'].includes(mode)) throw new Error('Invalid menu mode.');
  if (typeof slug !== 'string' || !slug.trim() || slug.length > 200) return null;

  const cafeResult = await client.from('Cafe').select(CAFE_FIELDS).eq('slug', slug).single();
  if (cafeResult.error?.code === 'PGRST116' || (!cafeResult.error && !cafeResult.data)) return null;
  checkError(cafeResult, 'restaurant');
  const cafe = cafeResult.data;
  const featureRows = checkError(await client.from('CafeFeatures')
    .select('featureKey, enabled, displayMode').eq('cafeId', cafe.id), 'menu features');
  const features = Object.fromEntries(featureRows
    .filter(row => FEATURE_KEYS.includes(row.featureKey))
    .map(row => [row.featureKey, { enabled: row.enabled, displayMode: row.displayMode }]));

  // Gate the public route on the server, including requests with a forged URL.
  if (mode === 'catering' && !isCateringEnabled(features)) return null;

  const [categoryResult, itemResult, bannerResult] = await Promise.all([
    client.from('Category').select(CATEGORY_FIELDS).eq('cafeId', cafe.id).order('sortOrder'),
    client.from('MenuItem').select(ITEM_FIELDS).eq('cafeId', cafe.id).order('sortOrder'),
    features.banners?.enabled
      ? client.from('CafeBanner').select('id, imageUrl, sortOrder').eq('cafeId', cafe.id).order('sortOrder')
      : Promise.resolve({ data: [] }),
  ]);
  const categories = sortCategories(checkError(categoryResult, 'categories').filter(c => !c.isHidden));
  const visibleIds = new Set(categories.map(c => c.id));
  const items = checkError(itemResult, 'items').filter(item => visibleIds.has(item.categoryId));
  const banners = checkError(bannerResult, 'banners');

  // Query the new column only after the feature migration has enabled catering.
  if (mode === 'catering') {
    const contact = await client.from('Cafe').select('cateringWhatsappNumber').eq('id', cafe.id).single();
    checkError(contact, 'catering contact');
    cafe.cateringWhatsappNumber = contact.data?.cateringWhatsappNumber || null;
  }
  return { cafe, features, categories, items, banners };
}
