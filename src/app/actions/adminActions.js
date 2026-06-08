'use server';

import { supabase } from "@/lib/supabase";

export async function getCategories(cafeId) {
  const { data, error } = await supabase
    .from('Category') // Standardized to capital C
    .select('*')
    .eq('cafeId', cafeId)
    .order('createdAt', { ascending: true });

  if (error) {
    console.error("Fetch Categories Error:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function addCategory(cafeId, name) {
  console.log("Adding category:", { cafeId, name }); 
  const now = new Date().toISOString(); 

  const { data, error } = await supabase
    .from('Category')
    .insert([{ 
      cafeId: cafeId, 
      name: name,
      updatedAt: now // Solved the missing timestamp error
    }])
    .select()
    .single();

  if (error) {
    console.error("Supabase Add Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('Category')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Delete Category Error:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

// ------------------------------------------------------------------
// MENU ITEM ACTIONS
// ------------------------------------------------------------------

export async function getMenuItems(cafeId) {
  const { data, error } = await supabase
    .from('MenuItem') 
    .select('*, Category(*)') 
    .eq('cafeId', cafeId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error("Fetch Menu Items Error:", error);
    throw new Error(error.message);
  }
  return data || [];
}
export async function addMenuItem(itemData) {
  const now = new Date().toISOString();
  
  // We explicitly create the ID and Timestamp since Prisma is gone
  const payload = {
    id: crypto.randomUUID(), // <-- THE FIX: Generate the unique ID here
    ...itemData,
    updatedAt: now
  };

  const { data, error } = await supabase
    .from('MenuItem')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Add Menu Item Error:", error);
    throw new Error(error.message);
  }
  return data;
}
export async function toggleItemStock(id, inStock) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('MenuItem')
    .update({ 
      inStock: inStock,
      updatedAt: now // Updating stock should also update the timestamp
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Toggle Stock Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase
    .from('MenuItem')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Delete Menu Item Error:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

// Add this at the bottom of adminActions.js
export async function uploadImage(formData) {
  const file = formData.get('file');
  if (!file) throw new Error("No file found.");

  // 1. Strict Server-Side Size Validation (800KB)
  const MAX_FILE_SIZE = 800 * 1024; // 800KB in bytes
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds the 800KB limit.");
  }

  // 2. Strict Server-Side Type Validation (Must be an image)
  if (!file.type.startsWith('image/')) {
    throw new Error("Only image files are allowed.");
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  // 3. Upload to Supabase
  const { error } = await supabase.storage
    .from('menu-images')
    .upload(fileName, file);

  if (error) {
    console.error("Storage Upload Error:", error);
    throw new Error("Failed to upload image. Please try again.");
  }

  // 4. Return the public URL
  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function updateMenuItem(id, itemData) {
  const now = new Date().toISOString();
  
  const payload = {
    ...itemData,
    updatedAt: now
  };

  const { data, error } = await supabase
    .from('MenuItem')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Update Menu Item Error:", error);
    throw new Error(error.message);
  }
  return data;
}
// Updates the Cafe's premium settings
export async function updateCafeSettings(cafeId, hasTableService) {
  const { data, error } = await supabase
    .from('Cafe')
    .update({ hasTableService })
    .eq('id', cafeId)
    .select()
    .single();

  if (error) {
    console.error("Update Cafe Settings Error:", error);
    throw new Error(error.message);
  }
  return data;
}
// --- PUBLIC FACING ACTIONS ---

// Fetch cafe details and menu by the URL slug (No login required)
// Fetch cafe details and menu by the URL slug (No login required)
export async function getPublicMenuBySlug(slug) {
  // 1. Find the cafe
  const { data: cafe, error: cafeError } = await supabase
    .from('Cafe')
    .select('id, name, slug, hasTableService, serviceType') // Added serviceType
    .eq('slug', slug)
    .single();

  if (cafeError || !cafe) return null;

  // 2. Fetch categories
  const { data: categories } = await supabase
    .from('Category')
    .select('*')
    .eq('cafeId', cafe.id)
    .order('createdAt', { ascending: true });

  const { data: items } = await supabase
    .from('MenuItem')
    .select(`*, Category(name)`)
    .eq('cafeId', cafe.id)
    // .eq('inStock', true) 
    .order('createdAt', { ascending: false });

  // 4. NEW: Fetch Premium Banners
  let banners = [];
  if (cafe.serviceType === 'PREMIUM') {
    const { data: bannerData } = await supabase
      .from('CafeBanner')
      .select('*')
      .eq('cafeId', cafe.id)
      .order('sortOrder', { ascending: true });
    banners = bannerData || [];
  }

  return { cafe, categories: categories || [], items: items || [], banners };
}
// Creates a new real-time waiter request
export async function createServiceRequest(cafeId, tableNumber) {
  const { data, error } = await supabase
    .from('ServiceRequest')
    .insert([{ cafeId, tableNumber, status: 'pending' }])
    // .select()
    // .single();

  if (error) {
    console.error("Failed to create request:", error);
    throw new Error(error.message);
  }
  return data;
}

// Marks a request as resolved (for the admin dashboard)
export async function resolveServiceRequest(requestId) {
  const { error } = await supabase
    .from('ServiceRequest')
    .update({ status: 'resolved' })
    .eq('id', requestId);

  if (error) throw new Error(error.message);
  return true;
}

// ==========================================
// --- PREMIUM FEATURE ACTIONS ---
// ==========================================

// 1. Toggle Category Highlight (Premium)
export async function toggleCategoryHighlight(categoryId, isHighlighted) {
  const { data, error } = await supabase
    .from('Category')
    .update({ isHighlighted })
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
    console.error("Failed to toggle category highlight:", error);
    throw new Error(error.message);
  }
  return data;
}

// 2. Fetch Banners for a Cafe
export async function getBanners(cafeId) {
  const { data, error } = await supabase
    .from('CafeBanner')
    .select('*')
    .eq('cafeId', cafeId)
    .order('sortOrder', { ascending: true })
    .order('createdAt', { ascending: false });

  if (error) {
    console.error("Failed to fetch banners:", error);
    return [];
  }
  return data;
}

// 3. Add a New Banner
export async function addBanner(cafeId, imageUrl, sortOrder = 0) {
  const { data, error } = await supabase
    .from('CafeBanner')
    .insert([{ cafeId, imageUrl, sortOrder }])
    .select()
    .single();

  if (error) {
    console.error("Failed to add banner:", error);
    throw new Error(error.message);
  }
  return data;
}

// 4. Delete a Banner
export async function deleteBanner(bannerId) {
  const { error } = await supabase
    .from('CafeBanner')
    .delete()
    .eq('id', bannerId);

  if (error) {
    console.error("Failed to delete banner:", error);
    throw new Error(error.message);
  }
  return true;
}