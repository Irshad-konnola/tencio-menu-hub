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
  if (cafe.serviceType === "PREMIUM") {
    const { data: bannerData } = await supabase
      .from("CafeBanner")
      .select("*")
      .eq("cafeId", cafe.id)
      .order("sortOrder", { ascending: true });
    banners = bannerData || [];
  }

  return { cafe, categories: categories || [], items: items || [], banners };
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