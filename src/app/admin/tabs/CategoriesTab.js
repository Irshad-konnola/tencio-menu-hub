'use client';

import React from 'react';

export default function CategoriesTab({ categories, handleToggleHighlight, openEditCategoryForm, handleDeleteCategory }) {
  return (
    <div className="space-y-3">
      {categories.length === 0 && <p className="text-sm text-neutral-400 text-center pt-10">No categories yet.</p>}
      {categories.map((category) => (
        <div key={category.id} className="bg-white p-4 rounded-[16px] flex justify-between items-center shadow-sm border border-neutral-100/50">
          <span className="font-bold text-[14px] text-[#111814]">{category.name}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handleToggleHighlight(category)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors ${category.isHighlighted ? "bg-yellow-100 text-yellow-700 border border-yellow-200" : "bg-neutral-50 text-neutral-400 border border-neutral-200"}`}>
              <span className="text-xs">★</span> {category.isHighlighted ? "Highlighted" : "Highlight"}
            </button>
            <button onClick={() => openEditCategoryForm(category)} className="p-2 text-neutral-400 hover:text-blue-500 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => handleDeleteCategory(category.id, category.name)} className="p-2 text-neutral-400 hover:text-red-500 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
