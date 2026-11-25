export const FEATURE_KEYS = [
  'billing', 'table_service', 'banners', 'category_highlight', 'item_units', 'catering_menu',
];

export function isCateringEnabled(features) {
  return features?.catering_menu?.enabled === true;
}

export function sortCategories(categories) {
  return [...categories].sort((a, b) =>
    (a.sortOrder || 0) - (b.sortOrder || 0) ||
    String(a.createdAt || '').localeCompare(String(b.createdAt || '')),
  );
}

export function selectMenuItems(items, categories, {
  mode = 'outlet', features = {}, cafeId, activeCategory = 'ALL', searchQuery = '',
} = {}) {
  const visibleCategoryIds = new Set(categories
    .filter(category => !category.isHidden && (!cafeId || category.cafeId === cafeId))
    .map(category => category.id));
  const query = searchQuery.trim().toLocaleLowerCase();
  return items.filter(item => {
    if (cafeId && item.cafeId !== cafeId) return false;
    if (!visibleCategoryIds.has(item.categoryId)) return false;
    if (mode === 'outlet' && isCateringEnabled(features) && !item.inStock) return false;
    if (activeCategory !== 'ALL' && item.categoryId !== activeCategory) return false;
    return !query || [item.name, item.malayalamName, item.description]
      .some(value => String(value || '').toLocaleLowerCase().includes(query));
  }).sort((a, b) => {
    if (mode === 'outlet' && a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0) ||
      String(a.createdAt || '').localeCompare(String(b.createdAt || '')) ||
      String(a.id).localeCompare(String(b.id));
  });
}

export function normalizeWhatsAppNumber(value) {
  const number = String(value || '').trim().replace(/[\s()+-]/g, '');
  if (!number) return null;
  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new Error('Enter a WhatsApp number with country code (8–15 digits), for example +91 98765 43210.');
  }
  return number;
}

export function buildCateringUrl(outletUrl) {
  const url = new URL(outletUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid menu URL.');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/catering`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function buildWhatsAppShareUrl(name, url) {
  return `https://wa.me/?text=${encodeURIComponent(`Explore ${name}'s catering menu: ${url}`)}`;
}

export function buildCateringEnquiryUrl(number, name, menuUrl) {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;
  const text = `Hi ${name}, I'd like to enquire about catering.\nEvent date:\nNumber of guests:\nLocation:\nMenu: ${menuUrl}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
