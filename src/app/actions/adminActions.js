"use server";

import { supabase } from "@/lib/supabase";
import webpush from "web-push";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(
    "mailto:admin@chillchai.com",
    vapidPublic,
    vapidPrivate,
  );
}

export async function savePushSubscription(cafeId, subscription) {
  // 1. Fetch existing subscriptions for this cafe
  const { data: existingSubs } = await supabase
    .from("PushSubscriptions")
    .select("*")
    .eq("cafeId", cafeId);

  // 2. Check if this exact browser/device is already in the database
  const isDuplicate = existingSubs?.some(
    (row) => row.subscription.endpoint === subscription.endpoint,
  );

  // 3. If it's already there, just return success without adding a new row!
  if (isDuplicate) {
    console.log("Device is already registered for push notifications.");
    return true;
  }

  // 4. If it's a new device, insert it securely
  const { error } = await supabase
    .from("PushSubscriptions")
    .insert([{ cafeId, subscription }]);

  if (error) throw new Error(error.message);
  return true;
}

export async function getCategories(cafeId) {
  const { data, error } = await supabase
    .from("Category") 
    .select("*")
    .eq("cafeId", cafeId)
    .order("createdAt", { ascending: true });

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
    .from("Category")
    .insert([
      {
        cafeId: cafeId,
        name: name,
        updatedAt: now,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Supabase Add Error:", error);
    throw new Error(error.message);
  }
  return data;
}

// NEW: Update Category Core Action
export async function updateCategory(id, name) {
  console.log("Updating category:", { id, name });
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("Category")
    .update({
      name: name,
      updatedAt: now
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update Category Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("Category").delete().eq("id", id);

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
    .from("MenuItem")
    .select("*, Category(*)")
    .eq("cafeId", cafeId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Fetch Menu Items Error:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function addMenuItem(itemData) {
  const now = new Date().toISOString();

  const payload = {
    id: crypto.randomUUID(), 
    ...itemData,
    updatedAt: now,
  };

  const { data, error } = await supabase
    .from("MenuItem")
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
    .from("MenuItem")
    .update({
      inStock: inStock,
      updatedAt: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Toggle Stock Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from("MenuItem").delete().eq("id", id);

  if (error) {
    console.error("Delete Menu Item Error:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

export async function uploadImage(formData) {
  const file = formData.get("file");
  if (!file) throw new Error("No file found.");

  const MAX_FILE_SIZE = 800 * 1024; 
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds the 800KB limit.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("menu-images")
    .upload(fileName, file);

  if (error) {
    console.error("Storage Upload Error:", error);
    throw new Error("Failed to upload image. Please try again.");
  }

  const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);

  return data.publicUrl;
}

export async function updateMenuItem(id, itemData) {
  const now = new Date().toISOString();

  const payload = {
    ...itemData,
    updatedAt: now,
  };

  const { data, error } = await supabase
    .from("MenuItem")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update Menu Item Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateCafeSettings(cafeId, hasTableService) {
  const { data, error } = await supabase
    .from("Cafe")
    .update({ hasTableService })
    .eq("id", cafeId)
    .select()
    .single();

  if (error) {
    console.error("Update Cafe Settings Error:", error);
    throw new Error(error.message);
  }
  return data;
}

// ------------------------------------------------------------------
// --- PUBLIC FACING ACTIONS ---
// ------------------------------------------------------------------

export async function getPublicMenuBySlug(slug) {
  const { data: cafe, error: cafeError } = await supabase
    .from("Cafe")
    .select("id, name, slug, hasTableService, serviceType") 
    .eq("slug", slug)
    .single();

  if (cafeError || !cafe) return null;

  const { data: featureRows } = await supabase
    .from("CafeFeatures")
    .select("*")
    .eq("cafeId", cafe.id);
    
  const features = {};
  if (featureRows) {
    featureRows.forEach(f => {
      features[f.featureKey] = { enabled: f.enabled, displayMode: f.displayMode };
    });
  }

  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .eq("cafeId", cafe.id)
    .order("createdAt", { ascending: true });

  const { data: items } = await supabase
    .from("MenuItem")
    .select(`*, Category(name)`)
    .eq("cafeId", cafe.id)
    .order("createdAt", { ascending: false });

  let banners = [];
  if (features.banners?.enabled) {
    const { data: bannerData } = await supabase
      .from("CafeBanner")
      .select("*")
      .eq("cafeId", cafe.id)
      .order("sortOrder", { ascending: true });
    banners = bannerData || [];
  }

  return { cafe, features, categories: categories || [], items: items || [], banners };
}

export async function createServiceRequest(cafeId, tableNumber) {
  const { error } = await supabase
    .from("ServiceRequest")
    .insert([{ cafeId, tableNumber, status: "pending" }]);

  if (error) throw new Error(error.message);

  try {
    const { data: subs } = await supabase
      .from("PushSubscriptions")
      .select("subscription")
      .eq("cafeId", cafeId);

    if (subs && subs.length > 0) {
      const payload = JSON.stringify({
        title: "🔔 Table Needs Waiter!",
        body: `Table ${tableNumber} is calling for assistance.`,
        url: "/admin",
        vibrate: [500, 250, 500, 250, 1000, 250, 500, 250, 500], // Long aggressive vibration
        requireInteraction: true, // Keeps the notification on screen until dismissed
        tag: "waiter-alert"
      });

      await Promise.all(
        subs.map((s) =>
          webpush.sendNotification(s.subscription, payload).catch((err) => {
            console.log("Failed to send to a specific device", err);
          }),
        ),
      );
    }
  } catch (pushError) {
    console.error("Push Notification Engine Error:", pushError);
  }

  return true;
}

export async function resolveServiceRequest(requestId) {
  const { error } = await supabase
    .from("ServiceRequest")
    .update({ status: "resolved" })
    .eq("id", requestId);

  if (error) throw new Error(error.message);
  return true;
}

// ------------------------------------------------------------------
// ==========================================
// --- PREMIUM FEATURE ACTIONS ---
// ==========================================
// ------------------------------------------------------------------

export async function toggleCategoryHighlight(categoryId, isHighlighted) {
  const { data, error } = await supabase
    .from("Category")
    .update({ isHighlighted })
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    console.error("Failed to toggle category highlight:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function getBanners(cafeId) {
  const { data, error } = await supabase
    .from("CafeBanner")
    .select("*")
    .eq("cafeId", cafeId)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Failed to fetch banners:", error);
    return [];
  }
  return data;
}

export async function addBanner(cafeId, imageUrl, sortOrder = 0) {
  const { data, error } = await supabase
    .from("CafeBanner")
    .insert([{ cafeId, imageUrl, sortOrder }])
    .select()
    .single();

  if (error) {
    console.error("Failed to add banner:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteBanner(bannerId) {
  const { error } = await supabase
    .from("CafeBanner")
    .delete()
    .eq("id", bannerId);

  if (error) {
    console.error("Failed to delete banner:", error);
    throw new Error(error.message);
  }
  return true;
}

// ------------------------------------------------------------------
// ==========================================
// --- TENANT FEATURES & BILLING ACTIONS ---
// ==========================================
// ------------------------------------------------------------------

export async function getCafeFeatures(cafeId) {
  const { data, error } = await supabase
    .from("CafeFeatures")
    .select("*")
    .eq("cafeId", cafeId);
    
  if (error) {
    console.error("Failed to fetch features:", error);
    return {};
  }
  
  const features = {};
  data.forEach(f => {
    features[f.featureKey] = { enabled: f.enabled, displayMode: f.displayMode };
  });
  return features;
}

export async function createBill(cafeId, billData) {
  const { data, error } = await supabase
    .from("Bill")
    .insert([{ cafeId, ...billData }])
    .select()
    .single();

  if (error) {
    console.error("Failed to create bill:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function getBills(cafeId) {
  const { data, error } = await supabase
    .from("Bill")
    .select("*")
    .eq("cafeId", cafeId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Failed to fetch bills:", error);
    return [];
  }
  return data;
}

export async function deleteBill(id) {
  const { error } = await supabase
    .from("Bill")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete bill:", error);
    throw new Error(error.message);
  }
  return true;
}

// ------------------------------------------------------------------
// ==========================================
// --- SUPER ADMIN ACTIONS ---
// ==========================================
// ------------------------------------------------------------------

import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function verifySuperAdminLogin(email, password) {
  if (!supabaseAdmin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");
  }
  const adminEmail = process.env.SUPERADMIN_EMAIL;
  const adminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(`Super admin credentials not configured. Email: ${adminEmail}`);
  }

  if (email !== adminEmail) {
    throw new Error("Invalid email.");
  }

  if (password !== adminPassword) {
    throw new Error("Invalid password.");
  }

  // Create a session in DB
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const { error } = await supabaseAdmin
    .from("SuperAdminSession")
    .insert([{ token, expiresAt: expiresAt.toISOString() }]);

  if (error) {
    console.error("Failed to create super admin session:", error);
    throw new Error("Failed to create session.");
  }

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set('superadmin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  });

  return true;
}

export async function verifySuperAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('superadmin_token')?.value;

  if (!token) return false;

  if (!supabaseAdmin) return false;

  const { data, error } = await supabaseAdmin
    .from("SuperAdminSession")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return false;

  if (new Date(data.expiresAt) < new Date()) {
    // Session expired
    await superAdminLogout();
    return false;
  }

  return true;
}

export async function superAdminLogout() {
  const cookieStore = await cookies();
  const token = cookieStore.get('superadmin_token')?.value;

  if (token && supabaseAdmin) {
    await supabaseAdmin
      .from("SuperAdminSession")
      .delete()
      .eq("token", token);
  }

  cookieStore.delete('superadmin_token');
  return true;
}

export async function getAllTenantsWithFeatures() {
  if (!supabaseAdmin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");

  // Join Cafe with CafeFeatures
  const { data: cafes, error: cafeError } = await supabaseAdmin
    .from("Cafe")
    .select("id, name, slug");

  if (cafeError) {
    console.error("Failed to fetch tenants:", cafeError);
    throw new Error(cafeError.message);
  }

  const { data: features, error: featuresError } = await supabaseAdmin
    .from("CafeFeatures")
    .select("*");

  if (featuresError) {
    console.error("Failed to fetch features:", featuresError);
    throw new Error(featuresError.message);
  }

  // Map features to cafes
  const cafesWithFeatures = cafes.map(cafe => {
    const cafeFeats = features.filter(f => f.cafeId === cafe.id);
    const featureMap = {};
    // ensure canonical keys exist even if not seeded properly yet
    const canonicalKeys = ['billing', 'table_service', 'banners', 'category_highlight'];
    
    canonicalKeys.forEach(key => {
      const feat = cafeFeats.find(f => f.featureKey === key);
      if (feat) {
        featureMap[key] = { enabled: feat.enabled, displayMode: feat.displayMode };
      } else {
        featureMap[key] = { enabled: false, displayMode: 'hidden' };
      }
    });

    return {
      ...cafe,
      features: featureMap
    };
  });

  return cafesWithFeatures;
}

export async function updateTenantFeature(cafeId, featureKey, enabled, displayMode) {
  if (!supabaseAdmin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");

  const { data, error } = await supabaseAdmin
    .from("CafeFeatures")
    .upsert(
      { cafeId, featureKey, enabled, displayMode, updatedAt: new Date().toISOString() },
      { onConflict: 'cafeId, featureKey' }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to update feature:", error);
    throw new Error(error.message);
  }
  return data;
}