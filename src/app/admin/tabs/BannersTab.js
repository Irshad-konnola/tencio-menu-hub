'use client';

import React from 'react';

export default function BannersTab({ banners, handleBannerUpload, handleDeleteBanner, isUploadingBanner, features }) {
  const canUseBanners = features?.banners?.enabled === true;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-[15px] text-[#111814]">Menu Slider</h3>
            <p className="text-[12px] font-medium text-neutral-500 mt-1">Upload promotional banners for your menu.<br /><span className="text-amber-600 font-bold">Recommended: 800x400px (Max 800KB)</span></p>
          </div>
          {!canUseBanners && <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">Premium</span>}
        </div>
        <div className="relative">
          <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleBannerUpload} disabled={isUploadingBanner || !canUseBanners} className="w-full text-sm text-neutral-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:tracking-wider file:bg-[#111814] file:text-white hover:file:bg-neutral-800 file:transition-colors file:cursor-pointer disabled:opacity-50" />
          {isUploadingBanner && <span className="absolute right-4 top-2.5 text-xs font-bold text-neutral-400">Uploading...</span>}
        </div>
      </div>
      <div className="space-y-4">
        {banners.map((banner, index) => (
          <div key={banner.id} className="relative bg-white rounded-[24px] overflow-hidden shadow-sm border border-neutral-100 group">
            <img src={banner.imageUrl} alt={`Banner ${index}`} className="w-full h-40 object-cover" />
            <button onClick={() => handleDeleteBanner(banner.id)} className="absolute top-3 right-3 w-8 h-8 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 shadow-md active:scale-95 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        {banners.length === 0 && !isUploadingBanner && <p className="text-center text-sm font-medium text-neutral-400 pt-4">No banners active.</p>}
      </div>
    </div>
  );
}
