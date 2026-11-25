"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { createServiceRequest, getPublicMenuBySlug } from "../actions/adminActions";
import { supabase } from "@/lib/supabase";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { selectMenuItems, isCateringEnabled, buildCateringEnquiryUrl } from '@/lib/menu.mjs';
import MenuShareActions from '@/app/components/MenuShareActions';

export default function CustomerMenuClient({ initialData, slug, mode = 'outlet' }) {
  const isCatering = mode === 'catering';
  const searchParams = useSearchParams();
  const tableNumber = isCatering ? null : searchParams.get("table");

  // We start immediately with the data the server gave us! No loading screens!
  const [cafe, setCafe] = useState(initialData.cafe);
  const [features, setFeatures] = useState(initialData.features || {});
  const [categories, setCategories] = useState(initialData.categories);
  const [items, setItems] = useState(initialData.items);
  const [banners, setBanners] = useState(initialData.banners);
  const [menuUnavailable, setMenuUnavailable] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [menuUrl, setMenuUrl] = useState('');

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false); // NEW: State for search toggle

  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3500, stopOnInteraction: false }),
  ]);

  // Refetch through the public projection so category visibility and feature
  // changes are enforced on live updates as well as the first server render.
  useEffect(() => {
    if (!cafe?.id) return;
    let disposed = false;
    let timer;
    let revision = 0;
    const refresh = async () => {
      const currentRevision = ++revision;
      try {
        const data = await getPublicMenuBySlug(slug, mode);
        if (disposed || currentRevision !== revision) return;
        setRefreshError(false);
        setMenuUnavailable(!data);
        if (!data) return;
        setCafe(data.cafe);
        setFeatures(data.features);
        setCategories(data.categories);
        setItems(data.items);
        setBanners(data.banners);
        setActiveCategory(current => current === 'ALL' || data.categories.some(c => c.id === current) ? current : 'ALL');
      } catch {
        if (!disposed && currentRevision === revision) setRefreshError(true);
      }
    };
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    let channel = supabase.channel(`public-menu:${cafe.id}:${mode}`);
    for (const table of ['MenuItem', 'Category', 'CafeBanner', 'CafeFeatures']) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `cafeId=eq.${cafe.id}` }, scheduleRefresh);
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'Cafe', filter: `id=eq.${cafe.id}` }, scheduleRefresh)
      .subscribe(status => { if (status === 'SUBSCRIBED') scheduleRefresh(); });
    // Close the SSR/subscription gap even on browsers that cannot connect Realtime.
    scheduleRefresh();
    window.addEventListener('focus', scheduleRefresh);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      disposed = true;
      clearTimeout(timer);
      window.removeEventListener('focus', scheduleRefresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [cafe?.id, slug, mode]);

  useEffect(() => {
    const timer = setTimeout(() => setMenuUrl(`${window.location.origin}/${encodeURIComponent(slug)}/catering`), 0);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleCallWaiter = async () => {
    if (isCatering || !cafe?.id || !tableNumber || !cafe.hasTableService || !features?.table_service?.enabled) return;
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

  const filteredItems = selectMenuItems(items, categories, { mode, features, cafeId: cafe.id, activeCategory, searchQuery });
  const showWaiterButton = !isCatering && cafe.hasTableService && features?.table_service?.enabled === true && tableNumber;
  const canUseBanners = features?.banners?.enabled === true;
  let enquiryUrl = null;
  if (isCatering && menuUrl) {
    try { enquiryUrl = buildCateringEnquiryUrl(cafe.cateringWhatsappNumber, cafe.name, menuUrl); } catch { /* Invalid legacy contact: keep sharing available. */ }
  }

  if (menuUnavailable || (isCatering && !isCateringEnabled(features))) {
    return <main className="min-h-screen bg-[#F6F7F9] p-8 text-center"><h1 className="mt-20 text-2xl font-bold">Menu unavailable</h1><p className="mt-4 text-base text-neutral-600">This menu is no longer available. Please contact the restaurant.</p></main>;
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] font-sans antialiased pb-32 relative">
      {/* --- NORMAL HEADER (No longer sticky) --- */}
      <header className="bg-[#1A1C19] pt-12 pb-6 px-6 relative  shadow-lg z-30">
        <div className="flex justify-between items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-amber-300 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
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
            <div className="min-w-0">
              <h1 className="text-xl sm:text-[22px] break-words font-extrabold tracking-tight text-white leading-tight uppercase mb-1">
                {cafe.name}
              </h1>
              <p className="text-[11px] font-bold text-amber-400 tracking-wider">
                {isCatering ? 'Catering menu' : 'Malappuram'}
              </p>
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-3">
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
              aria-label={isSearchOpen ? 'Close menu search' : 'Search menu'}
              aria-expanded={isSearchOpen}
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
                aria-label="Search dishes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/10 text-white placeholder-neutral-400 text-sm rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {isCatering && (
        <section aria-labelledby="catering-intro-title" className="mx-auto max-w-[600px] px-4 pt-6 sm:px-6">
          <div className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">Made for your occasion</p>
              <h2 id="catering-intro-title" className="mt-2 text-2xl font-bold text-[#111814]">Explore our catering menu</h2>
              <p className="mt-3 text-base leading-relaxed text-neutral-600">Discover our dishes for family gatherings, celebrations, and events.</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Contact us to confirm your event date, quantities, and final quotation.</p>
            </div>
            {menuUrl && <MenuShareActions name={cafe.name} url={menuUrl} showUrl={false} />}
          </div>
        </section>
      )}
      {refreshError && <p role="status" className="mx-auto max-w-[600px] px-6 pt-4 text-sm text-amber-800">Live updates are temporarily unavailable. Refresh to check the latest menu.</p>}

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
          const isUnavailable = !isCatering && !item.inStock;

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              className={`bg-white p-3 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border relative overflow-hidden transition-all ${
                isUnavailable
                  ? "border-neutral-200 bg-neutral-100/50 pointer-events-none"
                  : "border-neutral-100"
              }`}
            >
              <div
                className={`flex gap-4 ${hasDesc ? "items-start" : "items-center"}`}
              >
                <div
                  className={`bg-neutral-100 rounded-[14px] overflow-hidden flex-shrink-0 border border-neutral-100/50 ${hasDesc ? "w-20 h-20" : "w-16 h-16"} ${isUnavailable ? "grayscale opacity-40" : ""}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div
                  className={`flex-1 min-w-0 flex flex-col justify-center py-0.5 ${isUnavailable ? "opacity-50" : ""}`}
                >
                  <div
                    className={`flex justify-between items-start gap-3 ${hasDesc ? "mb-1" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-[#111814] leading-tight ${isCatering ? "text-base break-words" : hasDesc ? "text-[15px]" : "text-[15px] truncate"}`}
                      >
                        {item.name}
                      </h3>
                      {item.malayalamName && (
                        <p className="text-[12px] font-medium text-neutral-500 mt-0.5 truncate">{item.malayalamName}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right mt-[-2px]">
                      <div className="flex items-baseline justify-end gap-1 whitespace-nowrap">
                        <span className="font-extrabold text-[16px] text-[#1A1C19] tracking-tight">
                          ₹{item.price}
                        </span>
                        {item.unit && (
                          <span className="text-[11px] font-bold text-neutral-500">
                            {item.unit.startsWith('/') ? item.unit : `/ ${item.unit}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasDesc && (
                    <p className={`${isCatering ? 'text-sm text-neutral-600' : 'text-[11px] text-neutral-400'} font-medium leading-relaxed pr-4 mb-2 whitespace-pre-wrap`}>
                      {item.description}
                    </p>
                  )}

                  {isUnavailable && (
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

      {enquiryUrl && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-100 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <a href={enquiryUrl} target="_blank" rel="noopener noreferrer" className="mx-auto block max-w-[552px] rounded-2xl bg-[#176445] px-5 py-4 text-center text-base font-bold text-white hover:bg-[#115036]">Enquire about catering on WhatsApp</a>
        </div>
      )}

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
                aria-label="Call waiter"
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
