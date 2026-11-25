'use client';

import { useState } from 'react';
import { buildWhatsAppShareUrl } from '@/lib/menu.mjs';

export default function MenuShareActions({ name, url, showUrl = true }) {
  const [message, setMessage] = useState('');
  const [showCopyFallback, setShowCopyFallback] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Menu link copied.');
      setShowCopyFallback(false);
    } catch {
      setMessage('Copy the menu link from the address field below.');
      setShowCopyFallback(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a href={buildWhatsAppShareUrl(name, url)} target="_blank" rel="noopener noreferrer"
          className="rounded-xl bg-[#176445] px-4 py-3 text-sm font-bold text-white hover:bg-[#115036]">
          Share on WhatsApp
        </a>
        <button type="button" onClick={copyLink} className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-[#111814] hover:bg-neutral-50">
          Copy link
        </button>
      </div>
      {(showUrl || showCopyFallback) && <label className="block text-sm text-neutral-600">
        Catering menu link
        <input aria-label="Catering menu link" readOnly value={url} onFocus={e => e.target.select()}
          className="mt-1 w-full min-w-0 rounded-lg border border-neutral-200 bg-white p-2 text-sm text-neutral-700" />
      </label>}
      <p role="status" className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}
