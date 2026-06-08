"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QRCodeCanvas } from "qrcode.react";
import {
  getCategories,
  addCategory,
  deleteCategory,
  getMenuItems,
  addMenuItem,
  toggleItemStock,
  deleteMenuItem,
  uploadImage,
  updateMenuItem,
  updateCafeSettings,
  // --- NEW PREMIUM IMPORTS ---
  getBanners,
  addBanner,
  deleteBanner,
  toggleCategoryHighlight,
  resolveServiceRequest
} from "../actions/adminActions";

const ToggleSwitch = ({ isOn, onToggle }) => (
  <div
    onClick={onToggle}
    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${isOn ? "bg-[#111814]" : "bg-neutral-200"}`}
  >
    <motion.div
      className="w-4 h-4 bg-white rounded-full shadow-sm"
      animate={{ x: isOn ? 20 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </div>
);

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";

export default function AdminPanel() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState("DASHBOARD");
  const [dashboardTab, setDashboardTab] = useState("ITEMS"); // ITEMS, CATEGORIES, SETTINGS, BANNERS

  const [cafeId, setCafeId] = useState(null);
  const [cafeDetails, setCafeDetails] = useState(null);
  const [hasTableService, setHasTableService] = useState(false);
  const [tableCount, setTableCount] = useState(10);

  // -- NEW PREMIUM STATES --
  const [banners, setBanners] = useState([]);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    categoryId: "",
    description: "",
    imageUrl: DEFAULT_IMAGE,
  });

  // -- REALTIME NOTIFICATIONS STATE --
  const [liveRequests, setLiveRequests] = useState([]);

  useEffect(() => {
    async function checkAuthAndLoadData() {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: cafes, error: cafeError } = await supabase
          .from("Cafe")
          .select("*")
          .eq("ownerId", session.user.id);

        if (cafeError || !cafes || cafes.length === 0) {
          alert("Your account is not linked to a cafe yet.");
          setIsLoading(false);
          return;
        }

        const cafeData = cafes[0];
        setCafeId(cafeData.id);
        setCafeDetails(cafeData);
        setHasTableService(cafeData.hasTableService || false);

        const fetchedCategories = await getCategories(cafeData.id);
        const fetchedItems = await getMenuItems(cafeData.id);
        const fetchedBanners = await getBanners(cafeData.id); // Fetch Premium Banners

        setCategories(fetchedCategories);
        setItems(fetchedItems);
        setBanners(fetchedBanners || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthAndLoadData();
  }, [router]);

 // -- REALTIME ENGINE (PRODUCTION MODE) --
 // -- REALTIME ENGINE (PRODUCTION MODE) --
  useEffect(() => {
    if (!cafeId) return;

    // Use a fresh channel name to bypass any cached WebSocket connections
    const channel = supabase
      .channel('cafe-telemetry') 
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ServiceRequest',
          // THE FIX: Removed the double quotes! Just the exact column name.
          filter: `cafeId=eq.${cafeId}`, 
        },
        (payload) => {
          try {
            const audio = new Audio('/bell.mp3');
            audio.play().catch(e => console.log("Audio blocked by browser policy"));
          } catch(e){}
          setLiveRequests((current) => [payload.new, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cafeId]);

  const handleResolveRequest = async (id) => {
    // Optimistically remove it from UI
    setLiveRequests((current) => current.filter(req => req.id !== id));
    try {
      await resolveServiceRequest(id);
    } catch (error) {
      alert("Failed to clear request.");
    }
  };

  // -- PREMIUM GATEKEEPER --
  const isPremium = cafeDetails?.serviceType?.toUpperCase() === "PREMIUM";

  const enforcePremium = () => {
    if (!isPremium) {
      setShowUpsellModal(true); // Pop up the paywall!
      return false;
    }
    return true;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // -- PREMIUM ACTIONS --
  const handleToggleTableService = async () => {
    if (!enforcePremium()) return; // Block Standard Users
    try {
      const newState = !hasTableService;
      setHasTableService(newState);
      await updateCafeSettings(cafeId, newState);
    } catch (error) {
      setHasTableService(hasTableService);
      alert("Failed to update settings.");
    }
  };

  const handleToggleHighlight = async (category) => {
    if (!enforcePremium()) return; // Block Standard Users
    const newState = !category.isHighlighted;
    setCategories(
      categories.map((c) =>
        c.id === category.id ? { ...c, isHighlighted: newState } : c,
      ),
    );
    try {
      await toggleCategoryHighlight(category.id, newState);
    } catch {
      setCategories(
        categories.map((c) =>
          c.id === category.id ? { ...c, isHighlighted: !newState } : c,
        ),
      );
      alert("Failed to update highlight.");
    }
  };

  const handleBannerUpload = async (e) => {
    if (!enforcePremium()) {
      e.target.value = null; // Clear the input
      return;
    }
    const file = e.target.files[0];
    if (!file || !cafeId) return;

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
      setIsUploadingBanner(false);
      e.target.value = null;
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
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${fileName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${cafeDetails?.slug}`
      : "";

  // ... (Keep existing ADD/EDIT/DELETE logic for categories and items below) ...
  const handleAddCategory = async () => {
    if (!newCategory.trim() || !cafeId) return;
    const cat = await addCategory(cafeId, newCategory);
    setCategories([...categories, cat]);
    setNewCategory("");
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (id) => {
    if (confirm("Delete category?")) {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      setItems(items.filter((i) => i.categoryId !== id));
    }
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      price: item.price,
      categoryId: item.categoryId,
      description: item.description || "",
      imageUrl: item.imageUrl || DEFAULT_IMAGE,
    });
    setImageFile(null);
    setFormError("");
    setCurrentView("ITEM_FORM");
  };

  const openCreateForm = () => {
    setEditingId(null);
    setNewItem({
      name: "",
      price: "",
      categoryId: "",
      description: "",
      imageUrl: DEFAULT_IMAGE,
    });
    setImageFile(null);
    setFormError("");
    setCurrentView("ITEM_FORM");
  };

  const handleSaveItem = async () => {
    setFormError("");
    if (!cafeId) return setFormError("Database Error: No Cafe ID found.");
    if (!newItem.name || !newItem.price || !newItem.categoryId)
      return setFormError("Please fill required fields.");

    try {
      let finalImageUrl = newItem.imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        finalImageUrl = await uploadImage(formData);
      }

      const payload = {
        ...newItem,
        price: parseFloat(newItem.price),
        cafeId,
        imageUrl: finalImageUrl,
      };

      if (editingId) {
        const savedItem = await updateMenuItem(editingId, payload);
        const matchedCategory = categories.find(
          (c) => c.id === savedItem.categoryId,
        );
        setItems(
          items.map((i) =>
            i.id === editingId
              ? { ...savedItem, Category: matchedCategory }
              : i,
          ),
        );
      } else {
        const savedItem = await addMenuItem(payload);
        const matchedCategory = categories.find(
          (c) => c.id === savedItem.categoryId,
        );
        setItems([{ ...savedItem, Category: matchedCategory }, ...items]);
      }
      setCurrentView("DASHBOARD");
    } catch (error) {
      setFormError(error.message || "Failed to save menu item.");
    }
  };

  const handleToggle = async (item) => {
    setItems(
      items.map((i) => (i.id === item.id ? { ...i, inStock: !i.inStock } : i)),
    );
    await toggleItemStock(item.id, !item.inStock);
  };

  const handleDeleteItem = async (id) => {
    if (confirm("Delete this item?")) {
      setItems(items.filter((i) => i.id !== id));
      await deleteMenuItem(id);
    }
  };

  if (isLoading || !cafeId)
    return (
      <div className="h-screen bg-[#F8F7F4] flex items-center justify-center text-sm font-bold text-neutral-400 tracking-widest">
        AUTHENTICATING...
      </div>
    );

  return (
    <div className="h-[100dvh] sm:min-h-screen overflow-hidden sm:overflow-auto bg-[#0a0a0a] flex justify-center items-center p-0 sm:p-6 antialiased">
      <main className="w-full max-w-[414px] bg-[#F8F7F4] h-full sm:h-[850px] sm:rounded-[40px] sm:shadow-[0_20px_80px_-15px_rgba(255,255,255,0.1)] overflow-hidden relative flex flex-col border-0 sm:border-8 border-[#1a1a1a]">
        <AnimatePresence mode="wait">
          {currentView === "DASHBOARD" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full bg-[#F8F7F4]"
            >
              <header className="flex-none bg-white pt-12 pb-4 px-6 border-b border-neutral-100 relative z-20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-0.5">
                      {cafeDetails?.name}{" "}
                      {isPremium && (
                        <span className="text-yellow-500 ml-1">★</span>
                      )}
                    </h2>
                    <h1 className="text-lg font-bold tracking-tight text-[#111814]">
                      Live Dashboard
                    </h1>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-500 hover:text-red-500 uppercase transition-all bg-white border border-neutral-200 px-3 py-2 rounded-xl shadow-sm"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>

                <div className="flex gap-4 border-b border-neutral-200 overflow-x-auto hide-scrollbar">
                  {["ITEMS", "CATEGORIES", "BANNERS", "SETTINGS"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDashboardTab(tab)}
                      className={`pb-3 text-[11px] font-bold tracking-widest uppercase transition-colors relative flex-shrink-0 ${dashboardTab === tab ? "text-[#111814]" : "text-neutral-400"}`}
                    >
                      {tab}
                      {dashboardTab === tab && (
                        <motion.div
                          layoutId="adminTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111814]"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 pt-5 pb-32">
                {/* ITEMS TAB */}
                {dashboardTab === "ITEMS" && (
                  <div className="space-y-4">
                    {items.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center pt-10">
                        No items yet. Add one!
                      </p>
                    )}
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white p-3.5 rounded-[18px] flex items-center gap-4 shadow-sm border border-neutral-100/50 transition-opacity ${!item.inStock ? "opacity-60" : ""}`}
                      >
                        <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[14px] text-[#111814] truncate">
                            {item.name}
                          </h3>
                          <p className="text-[12px] font-semibold text-neutral-500">
                            ₹{item.price} •{" "}
                            {item.Category?.name ||
                              item.category?.name ||
                              "Uncategorized"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 border-r border-neutral-200 pr-3">
                            <button
                              onClick={() => openEditForm(item)}
                              className="p-1.5 text-neutral-400 hover:text-blue-500 bg-neutral-50 rounded-lg"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-500 bg-neutral-50 rounded-lg"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                          <ToggleSwitch
                            isOn={item.inStock}
                            onToggle={() => handleToggle(item)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CATEGORIES TAB WITH HIGHLIGHT FEATURE */}
                {dashboardTab === "CATEGORIES" && (
                  <div className="space-y-3">
                    {categories.length === 0 && (
                      <p className="text-sm text-neutral-400 text-center pt-10">
                        No categories yet.
                      </p>
                    )}
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="bg-white p-4 rounded-[16px] flex justify-between items-center shadow-sm border border-neutral-100/50"
                      >
                        <span className="font-bold text-[14px] text-[#111814]">
                          {category.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleHighlight(category)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors ${category.isHighlighted ? "bg-yellow-100 text-yellow-700 border border-yellow-200" : "bg-neutral-50 text-neutral-400 border border-neutral-200"}`}
                          >
                            <span className="text-xs">★</span>{" "}
                            {category.isHighlighted
                              ? "Highlighted"
                              : "Highlight"}
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 rounded-lg"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* BANNERS TAB (PREMIUM) */}
                {dashboardTab === "BANNERS" && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100/50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-[15px] text-[#111814]">
                            Menu Slider
                          </h3>
                          <p className="text-[12px] font-medium text-neutral-500">
                            Upload promotional banners for your menu.
                          </p>
                        </div>
                        {!isPremium && (
                          <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">
                            Premium
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleBannerUpload}
                          disabled={isUploadingBanner}
                          className="w-full text-sm text-neutral-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:tracking-wider file:bg-[#111814] file:text-white hover:file:bg-neutral-800 file:transition-colors file:cursor-pointer disabled:opacity-50"
                        />
                        {isUploadingBanner && (
                          <span className="absolute right-4 top-2.5 text-xs font-bold text-neutral-400">
                            Uploading...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {banners.map((banner, index) => (
                        <div
                          key={banner.id}
                          className="relative bg-white rounded-[24px] overflow-hidden shadow-sm border border-neutral-100 group"
                        >
                          <img
                            src={banner.imageUrl}
                            alt={`Banner ${index}`}
                            className="w-full h-40 object-cover"
                          />
                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {banners.length === 0 && !isUploadingBanner && (
                        <p className="text-center text-sm font-medium text-neutral-400 pt-4">
                          No banners active.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* SETTINGS TAB WITH PREMIUM GATE */}
                {dashboardTab === "SETTINGS" && (
                  <div className="space-y-8">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100/50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[15px] text-[#111814]">
                            Smart Table Service
                          </h3>
                          {!isPremium && (
                            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">
                              Premium
                            </span>
                          )}
                        </div>
                        <ToggleSwitch
                          isOn={hasTableService}
                          onToggle={handleToggleTableService}
                        />
                      </div>
                      <p className="text-[12px] font-medium text-neutral-500 leading-relaxed">
                        Allow customers to call a waiter directly from their
                        table by scanning a unique QR code.
                      </p>
                    </div>

                    {/* QR Code Generator Section */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100/50">
                      <h3 className="font-bold text-[15px] text-[#111814] mb-4">
                        QR Codes
                      </h3>
                      {!hasTableService ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-2xl border border-neutral-200 border-dashed">
                          <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                            <QRCodeCanvas
                              id="qr-global"
                              value={baseUrl}
                              size={150}
                              level="H"
                            />
                          </div>
                          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-center mb-4">
                            Global Store Code
                          </p>
                          <button
                            onClick={() =>
                              downloadQR(
                                "qr-global",
                                `${cafeDetails?.slug}-global-qr`,
                              )
                            }
                            className="flex items-center gap-2 bg-[#111814] text-white px-4 py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase"
                          >
                            Download
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                              Generate Codes for Tables
                            </label>
                            <input
                              type="number"
                              value={tableCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setTableCount("");
                                } else {
                                  setTableCount(
                                    Math.min(50, parseInt(val, 10)),
                                  );
                                }
                              }}
                              onBlur={() => {
                                if (!tableCount || tableCount < 1) {
                                  setTableCount(1);
                                }
                              }}
                              className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: tableCount || 0 }).map(
                              (_, i) => (
                                <div
                                  key={i}
                                  className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100"
                                >
                                  <div className="bg-white p-3 rounded-xl shadow-sm mb-3">
                                    <QRCodeCanvas
                                      id={`qr-table-${i + 1}`}
                                      value={`${baseUrl}?table=${i + 1}`}
                                      size={100}
                                      level="H"
                                    />
                                  </div>
                                  <p className="text-[11px] font-bold text-[#111814] uppercase tracking-widest mb-3">
                                    Table {i + 1}
                                  </p>
                                  <button
                                    onClick={() =>
                                      downloadQR(
                                        `qr-table-${i + 1}`,
                                        `${cafeDetails?.slug}-table-${i + 1}`,
                                      )
                                    }
                                    className="bg-white border border-neutral-200 text-neutral-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                                  >
                                    Save
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Floating ADD Button */}
              {dashboardTab !== "SETTINGS" && dashboardTab !== "BANNERS" && (
                <div className="absolute bottom-6 right-6 z-30">
                  <button
                    onClick={() =>
                      dashboardTab === "ITEMS"
                        ? openCreateForm()
                        : setShowCategoryModal(true)
                    }
                    className="w-14 h-14 bg-[#111814] rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ITEM FORM (Exactly the same) */}
          {currentView === "ITEM_FORM" && (
            <motion.div
              key="item-form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="flex-1 flex flex-col h-full bg-white z-40"
            >
              {/* ... (Keep your exact Item Form JSX here, omitted for brevity, it hasn't changed!) ... */}
              <header className="flex-none pt-12 pb-4 px-6 border-b border-neutral-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentView("DASHBOARD")}
                  className="text-[12px] font-bold text-neutral-500 tracking-wider"
                >
                  CANCEL
                </button>
                <h2 className="text-[15px] font-bold text-[#111814]">
                  {editingId ? "Edit Menu Item" : "New Menu Item"}
                </h2>
                <button
                  onClick={handleSaveItem}
                  className="text-[12px] font-bold text-[#111814] tracking-wider"
                >
                  SAVE
                </button>
              </header>
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-6">
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 text-[12px] font-bold p-3 rounded-lg border border-red-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                      placeholder="e.g., Masala Dosa"
                      className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                        Category
                      </label>
                      <select
                        value={newItem.categoryId}
                        onChange={(e) =>
                          setNewItem({ ...newItem, categoryId: e.target.value })
                        }
                        className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent"
                      >
                        <option value="" disabled>
                          Select Category
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={newItem.price}
                        onChange={(e) =>
                          setNewItem({ ...newItem, price: e.target.value })
                        }
                        placeholder="0.00"
                        className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                      Description
                    </label>
                    <textarea
                      rows="3"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      placeholder="Enter brief description..."
                      className="w-full pt-2 pb-2 border-b border-neutral-200 text-[14px] font-medium text-black focus:outline-none focus:border-black rounded-none resize-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                        Item Image
                      </label>
                      <span className="text-[10px] font-bold text-neutral-400">
                        Max size: 800KB
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 flex-shrink-0 bg-neutral-100">
                        <img
                          src={
                            imageFile
                              ? URL.createObjectURL(imageFile)
                              : newItem.imageUrl
                          }
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={(e) => {
                          setFormError("");
                          if (e.target.files && e.target.files[0])
                            setImageFile(e.target.files[0]);
                        }}
                        className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:tracking-wider file:bg-neutral-100 file:text-[#111814] hover:file:bg-neutral-200 file:transition-colors file:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PREMIUM UPSELL MODAL --- */}
        <AnimatePresence>
          {showUpsellModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[32px] p-8 w-full max-w-[340px] text-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-xl font-bold text-[#111814] mb-3">
                  Unlock Premium
                </h3>
                <p className="text-sm font-medium text-neutral-500 mb-8 leading-relaxed">
                  Upgrade your cafe to access Smart Table Service, Image
                  Banners, and Category Highlighting.
                </p>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/919400414976?text=Hi!%20I%20would%20like%20to%20upgrade%20my%20cafe%20to%20the%20Premium%20Plan."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 rounded-xl font-bold text-[13px] tracking-widest uppercase text-white bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md hover:shadow-lg transition-all text-center"
                  >
                    Contact to Upgrade
                  </a>
                  <button
                    onClick={() => setShowUpsellModal(false)}
                    className="w-full py-4 rounded-xl font-bold text-[13px] tracking-widest uppercase text-neutral-500 hover:bg-neutral-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <style
          dangerouslySetInnerHTML={{
            __html: ` .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `,
          }}
        />
        {/* --- LIVE NOTIFICATION CENTER --- */}
        <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-[100] flex flex-col gap-3 w-[calc(100%-48px)] sm:w-[320px] max-w-full pointer-events-none">
          <AnimatePresence>
            {liveRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="bg-red-600 rounded-2xl shadow-[0_15px_40px_rgba(220,38,38,0.5)] p-4 flex items-center justify-between border border-red-500 pointer-events-auto"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
                    <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold tracking-widest text-red-200 uppercase mb-0.5">Assistance Needed</p>
                    <p className="font-extrabold text-white text-[20px] leading-none">Table {request.tableNumber}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleResolveRequest(request.id)}
                  className="bg-black/20 hover:bg-black/40 transition-colors text-white text-[11px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-xl backdrop-blur-md"
                >
                  Clear
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* --- CATEGORY MODAL --- */}
        <AnimatePresence>
          {showCategoryModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[32px] p-6 w-full max-w-[340px] shadow-2xl relative"
              >
                <h3 className="text-lg font-bold text-[#111814] mb-4">New Category</h3>
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Category Name</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g., Hot Beverages"
                    className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCategoryModal(false)} 
                    className="flex-1 py-3.5 rounded-xl font-bold text-[12px] tracking-wider text-neutral-500 hover:bg-neutral-50 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleAddCategory} 
                    className="flex-1 py-3.5 rounded-xl font-bold text-[12px] tracking-wider text-white bg-[#111814] shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:scale-[1.02] transition-transform"
                  >
                    SAVE
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
