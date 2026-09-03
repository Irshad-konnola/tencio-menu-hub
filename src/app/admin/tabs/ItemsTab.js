'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ToggleSwitch from './ToggleSwitch'; // We need to extract this or put it in a common place

export default function ItemsTab({ items, openEditForm, handleDeleteItem, handleToggle, isStaffMode }) {
  const [sortNewestFirst, setSortNewestFirst] = React.useState(true);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortNewestFirst ? dateB - dateA : dateA - dateB;
    });
  }, [items, sortNewestFirst]);

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="flex justify-end px-1 mb-2">
          <button 
            onClick={() => setSortNewestFirst(!sortNewestFirst)}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-black transition-colors"
          >
            Sort: {sortNewestFirst ? 'Newest' : 'Oldest'}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sortNewestFirst ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              )}
            </svg>
          </button>
        </div>
      )}
      {items.length === 0 && <p className="text-sm text-neutral-400 text-center pt-10">No items yet. Add one!</p>}
      {sortedItems.map((item) => (
        <div key={item.id} className={`bg-white p-3.5 rounded-[18px] flex items-center gap-4 shadow-sm border border-neutral-100/50 transition-opacity ${!item.inStock ? "opacity-60" : ""}`}>
          <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[14px] text-[#111814] truncate">{item.name}</h3>
            {item.malayalamName && (
              <p className="text-[12px] font-medium text-neutral-500 mb-0.5 truncate">{item.malayalamName}</p>
            )}
            <p className="text-[12px] font-semibold text-neutral-500">₹{item.price} • {item.Category?.name || item.category?.name || "Uncategorized"}</p>
          </div>
          <div className="flex items-center gap-3">
            {!isStaffMode && (
              <div className="flex items-center gap-1 border-r border-neutral-200 pr-3">
                <button onClick={() => openEditForm(item)} className="p-1.5 text-neutral-400 hover:text-blue-500 bg-neutral-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-neutral-400 hover:text-red-500 bg-neutral-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
            <ToggleSwitch isOn={item.inStock} onToggle={() => handleToggle(item)} />
          </div>
        </div>
      ))}
    </div>
  );
}
