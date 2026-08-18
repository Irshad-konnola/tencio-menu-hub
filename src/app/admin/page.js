'use client';

import React, { useState, useEffect, useRef } from 'react'; // <-- ADDED useRef
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
  getCategories, addCategory, deleteCategory, updateCategory,
  getMenuItems, addMenuItem, toggleItemStock, deleteMenuItem,
  uploadImage, updateMenuItem, updateCafeSettings,
  getBanners, addBanner, deleteBanner, toggleCategoryHighlight,
  resolveServiceRequest, savePushSubscription, getCafeFeatures,
  toggleItemFavorite
} from '../actions/adminActions';

import ItemsTab from './tabs/ItemsTab';
import CategoriesTab from './tabs/CategoriesTab';
import BannersTab from './tabs/BannersTab';
import SettingsTab from './tabs/SettingsTab';
import BillingTab from './tabs/BillingTab';
import ToggleSwitch from './tabs/ToggleSwitch';

// ==========================================
// STATIC UTILITIES & CONSTANTS
// ==========================================
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

// ToggleSwitch moved to separate file

const LiveNotificationCenter = ({ liveRequests, onResolve }) => (
  <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-[100] flex flex-col gap-3 w-[calc(100%-48px)] sm:w-[320px] max-w-full pointer-events-none">
    <AnimatePresence>
      {liveRequests.map((request) => (
        <motion.div key={request.id} initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: -20 }} className="bg-red-600 rounded-2xl shadow-[0_15px_40px_rgba(220,38,38,0.5)] p-4 flex items-center justify-between border border-red-500 pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
              <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-extrabold tracking-widest text-red-200 uppercase mb-0.5">Assistance Needed</p>
              <p className="font-extrabold text-white text-[20px] leading-none">Table {request.tableNumber}</p>
            </div>
          </div>
          <button onClick={() => onResolve(request.id)} className="bg-black/20 hover:bg-black/40 transition-colors text-white text-[11px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-xl backdrop-blur-md">
            Clear
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

const PremiumUpsellModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[32px] p-8 w-full max-w-[340px] text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6"><span className="text-3xl">✨</span></div>
          <h3 className="text-xl font-bold text-[#111814] mb-3">Unlock Premium</h3>
          <p className="text-sm font-medium text-neutral-500 mb-8 leading-relaxed">Upgrade your cafe to access Smart Table Service, Image Banners, and Category Highlighting.</p>
          <div className="space-y-3">
            <a href="https://wa.me/919400414976?text=Hi!%20I%20would%20like%20to%20upgrade%20my%20cafe%20to%20the%20Premium%20Plan." target="_blank" rel="noopener noreferrer" className="block w-full py-4 rounded-xl font-bold text-[13px] tracking-widest uppercase text-white bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md hover:shadow-lg transition-all text-center">
              Contact to Upgrade
            </a>
            <button onClick={onClose} className="w-full py-4 rounded-xl font-bold text-[13px] tracking-widest uppercase text-neutral-500 hover:bg-neutral-50 transition-colors">Maybe Later</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CategoryModal = ({ isOpen, onClose, newCategory, setNewCategory, onSave, isEditing }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[32px] p-6 w-full max-w-[340px] shadow-2xl relative">
          <h3 className="text-lg font-bold text-[#111814] mb-4">{isEditing ? "Edit Category" : "New Category"}</h3>
          <div className="mb-6">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Category Name</label>
            <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="e.g., Hot Beverages" className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent" autoFocus />
          </div>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex flex-col pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newCategory.isHidden} onChange={(e) => setNewCategory({...newCategory, isHidden: e.target.checked})} className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded" />
                <span className="text-[13px] font-bold text-neutral-500">Hide from Public</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-[12px] tracking-wider text-neutral-500 hover:bg-neutral-50 transition-colors">CANCEL</button>
            <button onClick={onSave} className="flex-1 py-3.5 rounded-xl font-bold text-[12px] tracking-wider text-white bg-[#111814] shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:scale-[1.02] transition-transform">
              {isEditing ? "UPDATE" : "SAVE"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ItemForm = ({ editingId, isSaving, newItem, setNewItem, categories, formError, setFormError, imageFile, setImageFile, onCancel, onSave }) => {
  const handleFileChange = (e) => {
    setFormError("");
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      setFormError("This image is too large! Max file size limit is 800KB. Please compress or select a smaller asset.");
      e.target.value = null; setImageFile(null); return;
    }
    setImageFile(file);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="flex-1 flex flex-col h-full bg-white z-40">
      <header className="flex-none pt-12 pb-4 px-6 border-b border-neutral-100 flex items-center justify-between">
        <button onClick={onCancel} disabled={isSaving} className="text-[11px] font-bold text-neutral-400 hover:text-neutral-600 tracking-widest uppercase transition-colors">Cancel</button>
        <h2 className="text-[15px] font-bold text-[#111814]">{editingId ? "Edit Menu Item" : "New Menu Item"}</h2>
        <button onClick={onSave} disabled={isSaving} className="bg-[#111814] text-white px-5 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
          {isSaving ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full" />
              Saving...
            </>
          ) : "Save"}
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-6">
        <AnimatePresence>
          {formError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-600 text-[12px] font-bold p-3 rounded-lg border border-red-100 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{formError}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Item Name</label>
            <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g., Masala Dosa" className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Malayalam Name (optional)</label>
            <input type="text" value={newItem.malayalamName || ""} onChange={(e) => setNewItem({ ...newItem, malayalamName: e.target.value })} placeholder="e.g., മസാല ദോശ" className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Category</label>
              <select value={newItem.categoryId} onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })} className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent">
                <option value="" disabled>Select Category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="w-1/3">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Price (₹)</label>
              <input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="0.00" className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Description</label>
            <textarea rows="3" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Enter brief description..." className="w-full pt-2 pb-2 border-b border-neutral-200 text-[14px] font-medium text-black focus:outline-none focus:border-black rounded-none resize-none" />
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Item Image</label>
              <span className="text-[10px] font-bold text-neutral-400">Max size: 800KB</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 flex-shrink-0 bg-neutral-100">
                <img src={imageFile ? URL.createObjectURL(imageFile) : newItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:tracking-wider file:bg-neutral-100 file:text-[#111814] hover:file:bg-neutral-200 file:transition-colors file:cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// MAIN DASHBOARD COMPONENT ARCHITECTURE
// ==========================================
export default function AdminPanel() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState("DASHBOARD");
  const [dashboardTab, setDashboardTab] = useState("ITEMS");

  const [cafeId, setCafeId] = useState(null);
  const [cafeDetails, setCafeDetails] = useState(null);
  const [hasTableService, setHasTableService] = useState(false);
  const [tableCount, setTableCount] = useState(10);

  const [banners, setBanners] = useState([]);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // -- CATEGORY STATES (EXPANDED FOR EDIT FEATURE) --
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", sortOrder: 0, isHidden: false });
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", malayalamName: "", price: "", categoryId: "", description: "", sortOrder: 0, isFavorite: false, imageUrl: DEFAULT_IMAGE });
  const [isSaving, setIsSaving] = useState(false);
  const [features, setFeatures] = useState({});
  const [liveRequests, setLiveRequests] = useState([]);

  // ==========================================
  // ADDED: AUDIO REF & LOOPING LOGIC
  // ==========================================
  const audioRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/bell.mp3");
      audio.loop = true; // Set the audio to repeat continuously
      audioRef.current = audio;
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    
    // Play audio if there are live requests, stop and reset if empty
    if (liveRequests.length > 0) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch((e) => console.log("Audio autoplay blocked:", e));
      }
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to beginning
    }
  }, [liveRequests]);
  // ==========================================


  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock active - Phone will not sleep');
        }
      } catch (err) {
        console.error('Wake Lock failed:', err.name, err.message);
      }
    };

    // Request it immediately on load
    requestWakeLock();

    // If the user minimizes the app and comes back, we have to request it again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  useEffect(() => {
    async function checkAuthAndLoadData() {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }

        const { data: cafes, error: cafeError } = await supabase.from("Cafe").select("*").eq("ownerId", session.user.id);
        if (cafeError || !cafes || cafes.length === 0) {
          alert("Your account is not linked to a cafe yet.");
          setIsLoading(false); return;
        }

        const cafeData = cafes[0];
        setCafeId(cafeData.id);
        setCafeDetails(cafeData);
        setHasTableService(cafeData.hasTableService || false);

        const fetchedCategories = await getCategories(cafeData.id);
        const fetchedItems = await getMenuItems(cafeData.id);
        const fetchedBanners = await getBanners(cafeData.id);
        const fetchedFeatures = await getCafeFeatures(cafeData.id);

        setCategories(fetchedCategories);
        setItems(fetchedItems);
        setBanners(fetchedBanners || []);
        setFeatures(fetchedFeatures || {});
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthAndLoadData();
  }, [router]);

  useEffect(() => {
    if (!cafeId) return;
    const channel = supabase.channel("cafe-telemetry")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ServiceRequest", filter: `cafeId=eq.${cafeId}` },
        (payload) => {
          // REMOVED audio generation from here. Handled by the liveRequests useEffect instead.
          setLiveRequests((current) => [payload.new, ...current]);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cafeId]);

  const handleResolveRequest = async (id) => {
    setLiveRequests((current) => current.filter((req) => req.id !== id));
    try { await resolveServiceRequest(id); } catch { alert("Failed to clear request."); }
  };

  const handleLock = () => {
  // Remove the unlocked flag, keeping the Supabase session intact
  sessionStorage.removeItem('dashboard_unlocked');
  router.push('/login');
};
  const handleToggleTableService = async () => {
    if (!features?.table_service?.enabled) { setShowUpsellModal(true); return; }
    try {
      const newState = !hasTableService;
      setHasTableService(newState);
      await updateCafeSettings(cafeId, newState);
    } catch {
      setHasTableService(hasTableService);
      alert("Failed to update settings.");
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported by your current browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("You must allow notifications in your browser settings to use this feature.");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) throw new Error("Missing VAPID Key in environment variables.");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      await savePushSubscription(cafeId, subscription.toJSON());
      alert("✅ Background Notifications Enabled!");
    } catch (error) {
      alert("Error enabling notifications: " + error.message);
    }
  };

  const handleToggleHighlight = async (category) => {
    if (!features?.category_highlight?.enabled) { setShowUpsellModal(true); return; }
    const newState = !category.isHighlighted;
    setCategories(categories.map((c) => c.id === category.id ? { ...c, isHighlighted: newState } : c));
    try { await toggleCategoryHighlight(category.id, newState); } catch {
      setCategories(categories.map((c) => c.id === category.id ? { ...c, isHighlighted: !newState } : c));
      alert("Failed to update highlight.");
    }
  };

  const handleBannerUpload = async (e) => {
    if (!features?.banners?.enabled) { e.target.value = null; setShowUpsellModal(true); return; }
    const file = e.target.files[0];
    if (!file || !cafeId) return;

    if (file.size > 800 * 1024) {
      alert("This image is too large! Please upload an image smaller than 800KB.");
      e.target.value = null; return;
    }

    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const imageUrl = await uploadImage(formData);
      const newBanner = await addBanner(cafeId, imageUrl, banners.length);
      setBanners([newBanner, ...banners]);
    } catch (error) {
      alert("Failed to upload banner: " + error.message);
    } finally {
      setIsUploadingBanner(false); e.target.value = null;
    }
  };

  const handleDeleteBanner = async (id) => {
    if (confirm("Delete this banner?")) {
      setBanners(banners.filter((b) => b.id !== id));
      await deleteBanner(id);
    }
  };

  const downloadQR = (idName, fileName) => {
    const canvas = document.getElementById(idName);
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl; downloadLink.download = `${fileName}.png`;
    document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
  };

  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/${cafeDetails?.slug}` : "";

  // -- EXPANDED CATEGORY ROUTINES (SAVE/EDIT) --
  const handleSaveCategory = async () => {
    if (!newCategory.name.trim() || !cafeId) return;
    try {
      if (editingCategoryId) {
        // Edit Action
        const updatedCat = await updateCategory(editingCategoryId, newCategory.name, newCategory.sortOrder, newCategory.isHidden);
        setCategories(categories.map((c) => c.id === editingCategoryId ? { ...c, ...updatedCat } : c));
        setItems((prev) => prev.map((item) => item.categoryId === editingCategoryId ? { ...item, Category: { ...item.Category, name: newCategory.name } } : item));
      } else {
        // Add Action
        const cat = await addCategory(cafeId, newCategory.name, newCategory.sortOrder, newCategory.isHidden);
        setCategories((prev) => prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]);
      }
      setNewCategory({ name: "", sortOrder: 0, isHidden: false });
      setEditingCategoryId(null);
      setShowCategoryModal(false);
    } catch { 
      alert("Failed to save category."); 
    }
  };

  const openEditCategoryForm = (category) => {
    setEditingCategoryId(category.id);
    setNewCategory({ name: category.name, sortOrder: category.sortOrder || 0, isHidden: category.isHidden || false });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id, name) => {
    // ACCURATE WARNING CALCULATOR: Finds items that will be deleted along with category
    const linkedItemsCount = items.filter((i) => i.categoryId === id).length;
    const warningMessage = `⚠️ Delete Category "${name}"?\n\nThis action will permanently delete this category AND ALL ${linkedItemsCount} menu items linked to it.\n\nCustomers will instantly lose access to these dishes. Do you want to proceed?`;

    if (confirm(warningMessage)) {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      setItems(items.filter((i) => i.categoryId !== id));
    }
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setNewItem({ name: item.name, malayalamName: item.malayalamName || "", price: item.price, categoryId: item.categoryId, description: item.description || "", sortOrder: item.sortOrder || 0, isFavorite: item.isFavorite || false, imageUrl: item.imageUrl || DEFAULT_IMAGE });
    setImageFile(null); setFormError(""); setCurrentView("ITEM_FORM");
  };

  const openCreateForm = () => {
    setEditingId(null);
    setNewItem({ name: "", malayalamName: "", price: "", categoryId: "", description: "", sortOrder: 0, isFavorite: false, imageUrl: DEFAULT_IMAGE });
    setImageFile(null); setFormError(""); setCurrentView("ITEM_FORM");
  };

  const handleSaveItem = async () => {
    setFormError("");
    if (!cafeId) return setFormError("Database Error: No Cafe ID found.");
    if (!newItem.name || !newItem.price || !newItem.categoryId) return setFormError("Please fill required fields.");

    try {
      let finalImageUrl = newItem.imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        finalImageUrl = await uploadImage(formData);
      }

      const payload = { ...newItem, price: parseFloat(newItem.price), cafeId, imageUrl: finalImageUrl };

      if (editingId) {
        const savedItem = await updateMenuItem(editingId, payload);
        const matchedCategory = categories.find((c) => c.id === savedItem.categoryId);
        setItems((prev) => prev.map((i) => i.id === editingId ? { ...savedItem, Category: matchedCategory } : i));
      } else {
        const savedItem = await addMenuItem(payload);
        const matchedCategory = categories.find((c) => c.id === savedItem.categoryId);
        setItems((prev) => prev.some((i) => i.id === savedItem.id) ? prev : [{ ...savedItem, Category: matchedCategory }, ...prev]);
      }
      setCurrentView("DASHBOARD");
    } catch (error) {
      setFormError(error.message || "Failed to save menu item.");
    }
  };

  const handleToggle = async (item) => {
    setItems(items.map((i) => (i.id === item.id ? { ...i, inStock: !i.inStock } : i)));
    await toggleItemStock(item.id, !item.inStock);
  };

  const handleDeleteItem = async (id) => {
    if (confirm("Delete this item?")) {
      setItems(items.filter((i) => i.id !== id));
      await deleteMenuItem(id);
    }
  };

  const handleToggleFavorite = async (item) => {
    const newState = !item.isFavorite;
    setItems(items.map((i) => (i.id === item.id ? { ...i, isFavorite: newState } : i)));
    try {
      await toggleItemFavorite(item.id, newState);
    } catch {
      setItems(items.map((i) => (i.id === item.id ? { ...i, isFavorite: !newState } : i)));
      alert("Failed to update favorite status.");
    }
  };

  if (isLoading || !cafeId) return <div className="h-screen bg-[#F8F7F4] flex items-center justify-center text-sm font-bold text-neutral-400 tracking-widest">AUTHENTICATING...</div>;

  return (
    <div className="h-[100dvh] sm:min-h-screen overflow-hidden sm:overflow-auto bg-[#0a0a0a] flex justify-center items-center p-0 sm:p-6 antialiased">
      <main className="w-full max-w-[414px] bg-[#F8F7F4] h-full sm:h-[850px] sm:rounded-[40px] sm:shadow-[0_20px_80px_-15px_rgba(255,255,255,0.1)] overflow-hidden relative flex flex-col border-0 sm:border-8 border-[#1a1a1a]">
        <AnimatePresence mode="wait">
          {currentView === "DASHBOARD" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full bg-[#F8F7F4]">
              <header className="flex-none bg-white pt-12 pb-4 px-6 border-b border-neutral-100 relative z-20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-0.5">{cafeDetails?.name}</h2>
                    <h1 className="text-lg font-bold tracking-tight text-[#111814]">Live Dashboard</h1>
                  </div>
               <button 
  onClick={handleLock} 
  className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-500 hover:text-orange-500 uppercase transition-all bg-white border border-neutral-200 px-3 py-2 rounded-xl shadow-sm"
>
  {/* Lock Icon */}
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
  Lock Screen
</button>
                </div>
                <div className="flex gap-4 border-b border-neutral-200 overflow-x-auto hide-scrollbar">
                  {(() => {
                    const tabs = ["ITEMS", "CATEGORIES"];
                    if (features?.billing?.enabled || features?.billing?.displayMode === 'locked') tabs.push("BILLING");
                    if (features?.banners?.enabled || features?.banners?.displayMode === 'locked') tabs.push("BANNERS");
                    tabs.push("SETTINGS");
                    
                    const handleTabClick = (tab) => {
                      const keyMap = { BANNERS: 'banners', BILLING: 'billing' };
                      const key = keyMap[tab];
                      if (key && !features[key]?.enabled && features[key]?.displayMode === 'locked') {
                        setShowUpsellModal(true);
                        return;
                      }
                      setDashboardTab(tab);
                    };

                    return tabs.map((tab) => {
                      const keyMap = { BANNERS: 'banners', BILLING: 'billing' };
                      const key = keyMap[tab];
                      const isLocked = key && !features[key]?.enabled && features[key]?.displayMode === 'locked';

                      return (
                        <button key={tab} onClick={() => handleTabClick(tab)} className={`pb-3 text-[11px] font-bold tracking-widest uppercase transition-colors relative flex-shrink-0 flex items-center gap-1 ${dashboardTab === tab ? "text-[#111814]" : "text-neutral-400"}`}>
                          {tab}
                          {isLocked && <span className="bg-purple-500 text-white text-[8px] px-1 rounded">PRO</span>}
                          {dashboardTab === tab && <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111814]" />}
                        </button>
                      );
                    });
                  })()}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 pt-5 pb-32">
                {dashboardTab === "ITEMS" && (
                  <ItemsTab 
                    items={items} 
                    openEditForm={openEditForm} 
                    handleDeleteItem={handleDeleteItem} 
                    handleToggle={handleToggle} 
                  />
                )}

                {dashboardTab === "CATEGORIES" && (
                  <CategoriesTab 
                    categories={categories} 
                    handleToggleHighlight={handleToggleHighlight} 
                    openEditCategoryForm={openEditCategoryForm} 
                    handleDeleteCategory={handleDeleteCategory} 
                  />
                )}

                {dashboardTab === "BANNERS" && (
                  <BannersTab 
                    banners={banners} 
                    handleBannerUpload={handleBannerUpload} 
                    handleDeleteBanner={handleDeleteBanner} 
                    isUploadingBanner={isUploadingBanner} 
                    features={features} 
                  />
                )}

                {dashboardTab === "SETTINGS" && (
                  <SettingsTab 
                    hasTableService={hasTableService} 
                    handleToggleTableService={handleToggleTableService} 
                    handleEnablePushNotifications={handleEnablePushNotifications} 
                    tableCount={tableCount} 
                    setTableCount={setTableCount} 
                    downloadQR={downloadQR} 
                    baseUrl={baseUrl} 
                    cafeDetails={cafeDetails} 
                    features={features} 
                  />
                )}
                
                {dashboardTab === "BILLING" && (
                  <BillingTab 
                    items={items} 
                    cafeId={cafeId} 
                    cafeDetails={cafeDetails} 
                    handleToggleFavorite={handleToggleFavorite}
                  />
                )}
              </div>

              {dashboardTab !== "SETTINGS" && dashboardTab !== "BANNERS" && dashboardTab !== "BILLING" && (
                <div className="absolute bottom-6 right-6 z-30">
                  <button onClick={() => {
                    if (dashboardTab === "ITEMS") {
                      openCreateForm();
                    } else {
                      setEditingCategoryId(null);
                      setNewCategory({ name: "", sortOrder: 0, isHidden: false });
                      setShowCategoryModal(true);
                    }
                  }} className="w-14 h-14 bg-[#111814] rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 transition-transform"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg></button>
                </div>
              )}
            </motion.div>
          )}

          {currentView === "ITEM_FORM" && (
            <ItemForm
              editingId={editingId} isSaving={isSaving} newItem={newItem} setNewItem={setNewItem}
              categories={categories} formError={formError} setFormError={setFormError}
              imageFile={imageFile} setImageFile={setImageFile} onCancel={() => setCurrentView("DASHBOARD")}
              onSave={async () => { setIsSaving(true); await handleSaveItem(); setIsSaving(false); }}
            />
          )}
        </AnimatePresence>

        <PremiumUpsellModal isOpen={showUpsellModal} onClose={() => setShowUpsellModal(false)} />
        
        {/* Category Modal with tracking hooks for edit mode layouts */}
        <CategoryModal 
          isOpen={showCategoryModal} 
          onClose={() => { setShowCategoryModal(false); setEditingCategoryId(null); setNewCategory({ name: "", sortOrder: 0, isHidden: false }); }} 
          newCategory={newCategory} 
          setNewCategory={setNewCategory} 
          onSave={handleSaveCategory}
          isEditing={!!editingCategoryId}
        />
        
        <LiveNotificationCenter liveRequests={liveRequests} onResolve={handleResolveRequest} />

        <style dangerouslySetInnerHTML={{ __html: ` .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } ` }} />
      </main>
    </div>
  );
}