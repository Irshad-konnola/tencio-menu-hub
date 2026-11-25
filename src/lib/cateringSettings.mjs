import { isCateringEnabled, normalizeWhatsAppNumber } from './menu.mjs';

export async function saveCateringContact(client, cafeId, value, accessToken) {
  if (!client || typeof accessToken !== 'string' || !accessToken || typeof cafeId !== 'string') {
    throw new Error('Please sign in as the restaurant owner.');
  }
  const { data: auth, error: authError } = await client.auth.getUser(accessToken);
  if (authError || !auth?.user) throw new Error('Please sign in as the restaurant owner.');
  const { data: cafe, error: cafeError } = await client.from('Cafe').select('id')
    .eq('id', cafeId).eq('ownerId', auth.user.id).single();
  if (cafeError || !cafe) throw new Error('You cannot change this restaurant.');
  const { data: feature, error: featureError } = await client.from('CafeFeatures')
    .select('enabled').eq('cafeId', cafeId).eq('featureKey', 'catering_menu').single();
  if (featureError || !isCateringEnabled({ catering_menu: feature })) {
    throw new Error('Catering menus are not enabled for this restaurant.');
  }
  const number = normalizeWhatsAppNumber(value);
  const { error } = await client.from('Cafe').update({ cateringWhatsappNumber: number }).eq('id', cafeId);
  if (error) throw new Error('Unable to save the catering contact. Please try again.');
  return { cateringWhatsappNumber: number };
}
