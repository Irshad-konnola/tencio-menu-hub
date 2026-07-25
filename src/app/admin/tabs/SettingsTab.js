'use client';

import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import { QRCodeCanvas } from 'qrcode.react';

export default function SettingsTab({ 
  hasTableService, 
  handleToggleTableService, 
  handleEnablePushNotifications, 
  tableCount, 
  setTableCount, 
  downloadQR, 
  baseUrl, 
  cafeDetails, 
  features 
}) {
  const canUseTableService = features?.table_service?.enabled === true;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100/50">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[15px] text-[#111814]">Smart Table Service</h3>
            {!canUseTableService && <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">Premium</span>}
          </div>
          <ToggleSwitch isOn={hasTableService} onToggle={handleToggleTableService} />
        </div>
        <p className="text-[12px] font-medium text-neutral-500 leading-relaxed">Allow customers to call a waiter directly from their table by scanning a unique QR code.</p>
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100/50">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-bold text-[15px] text-[#111814]">Background Alerts</h3>
            <p className="text-[12px] font-medium text-neutral-500 mt-1 leading-relaxed">Receive waiter requests on your device even when this dashboard is closed.</p>
          </div>
          <button onClick={handleEnablePushNotifications} className="bg-[#1A1C19] hover:bg-black transition-colors text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl flex-shrink-0">Enable Alerts</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100/50">
        <h3 className="font-bold text-[15px] text-[#111814] mb-4">QR Codes</h3>
        {!hasTableService ? (
          <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-2xl border border-neutral-200 border-dashed">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4"><QRCodeCanvas id="qr-global" value={baseUrl} size={150} level="H" /></div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest text-center mb-4">Global Store Code</p>
            <button onClick={() => downloadQR("qr-global", `${cafeDetails?.slug}-global-qr`)} className="flex items-center gap-2 bg-[#111814] text-white px-4 py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase">Download</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Generate Codes for Tables</label>
              <input type="number" value={tableCount} onChange={(e) => { const val = e.target.value; setTableCount(val === "" ? "" : Math.min(50, parseInt(val, 10))); }} onBlur={() => { if (!tableCount || tableCount < 1) setTableCount(1); }} className="w-full pb-2 border-b border-neutral-200 text-[15px] font-medium text-black focus:outline-none focus:border-black rounded-none bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: tableCount || 0 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="bg-white p-3 rounded-xl shadow-sm mb-3"><QRCodeCanvas id={`qr-table-${i + 1}`} value={`${baseUrl}?table=${i + 1}`} size={100} level="H" /></div>
                  <p className="text-[11px] font-bold text-[#111814] uppercase tracking-widest mb-3">Table {i + 1}</p>
                  <button onClick={() => downloadQR(`qr-table-${i + 1}`, `${cafeDetails?.slug}-table-${i + 1}`)} className="bg-white border border-neutral-200 text-neutral-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Save</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
