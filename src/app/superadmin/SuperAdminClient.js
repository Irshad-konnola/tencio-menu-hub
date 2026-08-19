'use client';

import React, { useState } from 'react';
import { updateTenantFeature } from '@/app/actions/adminActions';

const featuresList = [
  { key: 'table_service', label: 'Smart Table Service' },
  { key: 'banners', label: 'Banners' },
  { key: 'category_highlight', label: 'Category Highlight' },
  { key: 'billing', label: 'Billing Module' }
];

export default function SuperAdminClient({ initialTenants }) {
  const [tenants, setTenants] = useState(initialTenants);
  const [isSaving, setIsSaving] = useState({});

  const handleToggle = async (cafeId, featureKey, currentVal, displayMode) => {
    const newState = !currentVal;
    
    // Optimistic UI update
    setTenants(prev => prev.map(t => {
      if (t.id === cafeId) {
        return {
          ...t,
          features: {
            ...t.features,
            [featureKey]: { ...t.features[featureKey], enabled: newState }
          }
        };
      }
      return t;
    }));

    setIsSaving({ ...isSaving, [`${cafeId}-${featureKey}`]: true });

    try {
      await updateTenantFeature(cafeId, featureKey, newState, displayMode);
    } catch (err) {
      alert("Failed to update feature.");
      // Revert on error
      setTenants(prev => prev.map(t => {
        if (t.id === cafeId) {
          return {
            ...t,
            features: {
              ...t.features,
              [featureKey]: { ...t.features[featureKey], enabled: currentVal }
            }
          };
        }
        return t;
      }));
    } finally {
      setIsSaving({ ...isSaving, [`${cafeId}-${featureKey}`]: false });
    }
  };

  const handleDisplayModeChange = async (cafeId, featureKey, enabled, newDisplayMode) => {
    // Optimistic UI update
    setTenants(prev => prev.map(t => {
      if (t.id === cafeId) {
        return {
          ...t,
          features: {
            ...t.features,
            [featureKey]: { ...t.features[featureKey], displayMode: newDisplayMode }
          }
        };
      }
      return t;
    }));

    setIsSaving({ ...isSaving, [`${cafeId}-${featureKey}`]: true });

    try {
      await updateTenantFeature(cafeId, featureKey, enabled, newDisplayMode);
    } catch (err) {
      alert("Failed to update display mode.");
      // Let it refresh or revert (complex to revert without storing old state here, simple reload is fine for errors)
    } finally {
      setIsSaving({ ...isSaving, [`${cafeId}-${featureKey}`]: false });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#111814] rounded-3xl p-8 border border-neutral-800">
        <h2 className="text-xl font-bold mb-6">Tenant List ({tenants.length})</h2>
        
        {tenants.map(tenant => (
          <div key={tenant.id} className="mb-10 pb-10 border-b border-neutral-800 last:mb-0 last:pb-0 last:border-0">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-amber-500">{tenant.name}</h3>
              <p className="text-sm text-neutral-500 font-mono">{tenant.slug}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuresList.map(feature => {
                const fData = tenant.features[feature.key] || { enabled: false, displayMode: 'hidden' };
                const isUpdating = isSaving[`${tenant.id}-${feature.key}`];

                return (
                  <div key={feature.key} className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-sm tracking-wide">{feature.label}</span>
                      
                      <div 
                        onClick={() => !isUpdating && handleToggle(tenant.id, feature.key, fData.enabled, fData.displayMode)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${fData.enabled ? "bg-amber-500" : "bg-neutral-700"} ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${fData.enabled ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </div>
                    
                    {!fData.enabled && (
                      <div className="mt-3 pt-3 border-t border-neutral-800">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">When Disabled, Show As:</label>
                        <select 
                          value={fData.displayMode}
                          onChange={(e) => handleDisplayModeChange(tenant.id, feature.key, fData.enabled, e.target.value)}
                          disabled={isUpdating}
                          className="w-full bg-neutral-800 border border-neutral-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="hidden">Hidden completely</option>
                          <option value="locked">Locked (Upsell Badge)</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
