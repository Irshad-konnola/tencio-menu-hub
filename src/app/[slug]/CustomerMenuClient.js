"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { createServiceRequest } from "../actions/adminActions";
import { supabase } from "@/lib/supabase";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function CustomerMenuClient({ initialData, slug }) {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get("table");

  // We start immediately with the data the server gave us! No loading screens!
  const [cafe, setCafe] = useState(initialData.cafe);
  const [features, setFeatures] = useState(initialData.features || {});
  const [categories, setCategories] = useState(initialData.categories);
  const [items, setItems] = useState(initialData.items);
  const [banners, setBanners] = useState(initialData.banners);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false); // NEW: State for search toggle

  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3500, stopOnInteraction: false }),
  ]);

  // -- REALTIME PUBLIC MENU SYNC --
  useEffect(() => {
    if (!cafe?.id) return;

    const channel = supabase
      .channel("public-menu-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MenuItem",
          filter: `cafeId=eq.${cafe.id}`,
        },
        (payload) => {
          setItems((currentItems) => {
            if (payload.eventType === "UPDATE") {
              return currentItems.map((item) =>
                item.id === payload.new.id ? { ...item, ...payload.new } : item,
              );
            }
            if (payload.eventType === "INSERT") {
              if (currentItems.some((i) => i.id === payload.new.id))
                return currentItems;
              return [payload.new, ...currentItems];
            }
            if (payload.eventType === "DELETE") {
              return currentItems.filter((item) => item.id !== payload.old.id);
            }
            return currentItems;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cafe?.id]);

  const handleCallWaiter = async () => {
    if (!cafe?.id || !tableNumber) return;
    setIsCalling(true);
    try {
      await createServiceRequest(cafe.id, tableNumber);
      setCallSuccess(true);
      setTimeout(() => setCallSuccess(false), 5000);
    } catch (error) {
      alert("Failed to call waiter. Please wave to our staff!");
    } finally {
      setIsCalling(false);
    }
  };

  const filteredItems = items
    .filter((item) => {
      const matchesCategory =
        activeCategory === "ALL" || item.categoryId === activeCategory;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      // 1. Sort by stock status first (in-stock top, out-of-stock bottom)
      if (a.inStock !== b.inStock) {
        return a.inStock ? -1 : 1;
      }
      
      // 2. ENHANCEMENT: If both have same stock status and sort order, sort by oldest first
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      
      // Fallback if createdAt doesn't exist on your items
      return a.id < b.id ? -1 : 1;
    });

  const showWaiterButton = features?.table_service?.enabled === true && tableNumber;
  const canUseBanners = features?.banners?.enabled === true;

  return (
    <div className="min-h-screen bg-[#F6F7F9] font-sans antialiased pb-32 relative">
      {/* --- NORMAL HEADER (No longer sticky) --- */}
      <header className="bg-[#1A1C19] pt-12 pb-6 px-6 relative  shadow-lg z-30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-[#1A1C19]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight text-white leading-none uppercase mb-1">
                {cafe.name}
              </h1>
              <p className="text-[11px] font-bold text-amber-400 tracking-wider">
                Malappuram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tableNumber && (
              <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Table {tableNumber.padStart(2, "0")}
                </span>
              </div>
            )}

            {/* NEW: Search Toggle Icon Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isSearchOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* NEW: Expandable Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 24 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search dishes, drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/10 text-white placeholder-neutral-400 text-sm rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Banners (No longer sticky) */}
      {canUseBanners && banners.length > 0 && !searchQuery && (
        <div className="w-full pt-6 pb-2 overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {banners.map((banner, index) => (
              <div key={banner.id} className="flex-[0_0_85%] min-w-0 pl-6">
                <div className="w-full h-40 rounded-[24px] overflow-hidden shadow-sm relative border border-neutral-200/50">
                  <img
                    src={banner.imageUrl}
                    alt={`Promo ${index}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
            <div className="flex-[0_0_1.5rem]" />
          </div>
        </div>
      )}

      {/* --- STICKY CATEGORY MENU --- */}
      {/* ENHANCEMENT: Added wrapper with relative positioning for visual scroll cue */}
      <div className="sticky top-0 z-40 bg-[#F6F7F9] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border-b border-neutral-200/60 relative">
        <div className="overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2 py-4 pl-6 pr-12 scroll-smooth">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-5 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-all ${activeCategory === "ALL" ? "bg-white text-[#111814] shadow-sm border border-neutral-200" : "bg-transparent text-neutral-500"}`}
          >
            All
          </button>

          {categories.filter(c => !c.isHidden).map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold tracking-wide transition-all
        ${
          activeCategory === category.id
            ? category.isHighlighted
              ? "bg-amber-100 text-amber-900 border-[1.5px] border-amber-400"
              : "bg-white text-[#111814] shadow-sm border border-neutral-200"
            : category.isHighlighted
              ? "bg-amber-100 text-amber-900 border-[1.5px] border-amber-400"
              : "bg-transparent text-neutral-500"
        }`}
            >
              {category.isHighlighted && (
                <svg
                  className="w-3 h-3 text-amber-500 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )}
              {category.name}
            </button>
          ))}
        </div>

        {/* ENHANCEMENT: Visual fade and arrow cue indicating scrolling is possible */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F6F7F9] via-[#F6F7F9]/90 to-transparent pointer-events-none flex items-center justify-end pr-2">
          <svg
            className="w-4 h-4 text-neutral-400 opacity-70 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* --- COMPACT MENU ITEMS LIST --- */}
      <div className="p-4 sm:p-6 space-y-3 max-w-[600px] mx-auto">
        {filteredItems.length === 0 && (
          <p className="text-center text-sm font-medium text-neutral-400 pt-10">
            No items found.
          </p>
        )}

        {filteredItems.map((item) => {
          const hasDesc = !!item.description?.trim();

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              className={`bg-white p-3 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border relative overflow-hidden transition-all ${
                !item.inStock
                  ? "border-neutral-200 bg-neutral-100/50 pointer-events-none"
                  : "border-neutral-100"
              }`}
            >
              <div
                className={`flex gap-4 ${hasDesc ? "items-start" : "items-center"}`}
              >
                <div
                  className={`bg-neutral-100 rounded-[14px] overflow-hidden flex-shrink-0 border border-neutral-100/50 ${hasDesc ? "w-20 h-20" : "w-16 h-16"} ${!item.inStock ? "grayscale opacity-40" : ""}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div
                  className={`flex-1 min-w-0 flex flex-col justify-center py-0.5 ${!item.inStock ? "opacity-50" : ""}`}
                >
                  <div
                    className={`flex justify-between items-start gap-3 ${hasDesc ? "mb-1" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-[#111814] leading-tight ${hasDesc ? "text-[15px]" : "text-[15px] truncate"}`}
                      >
                        {item.name}
                      </h3>
                      {item.malayalamName && (
                        <p className="text-[12px] font-medium text-neutral-500 mt-0.5 truncate">{item.malayalamName}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right mt-[-2px]">
                      <span className="font-extrabold text-[16px] text-[#1A1C19] tracking-tight">
                        ₹{item.price}
                      </span>
                    </div>
                  </div>

                  {hasDesc && (
                    <p className="text-[11px] font-medium text-neutral-400 leading-relaxed pr-4 mb-2 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}

                  {!item.inStock && (
                    <div className={`${hasDesc ? "mt-auto" : "mt-1"}`}>
                      <span className="inline-block bg-red-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* --- SMALL FLOATING ACTION BUTTON (Call Waiter) --- */}
      <AnimatePresence>
        {showWaiterButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {callSuccess ? (
              <div className="w-14 h-14 rounded-full bg-green-500 shadow-2xl flex items-center justify-center text-white border-2 border-white/20">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : (
              <button
                onClick={handleCallWaiter}
                disabled={isCalling}
                className="w-14 h-14 rounded-full bg-[#1A1C19] shadow-[0_15px_40px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-[1.05] active:scale-95 transition-transform disabled:opacity-70 border border-white/10"
              >
                {isCalling ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="w-6 h-6 border-2 border-white/30 border-t-amber-400 rounded-full"
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}