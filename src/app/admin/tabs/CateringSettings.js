'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { updateCateringContact } from '@/app/actions/adminActions';
import { buildCateringUrl, normalizeWhatsAppNumber } from '@/lib/menu.mjs';
import MenuShareActions from '@/app/components/MenuShareActions';

export default function CateringSettings({ cafeDetails, baseUrl, downloadQR, onContactSaved }) {
  const [number, setNumber] = useState(cafeDetails.cateringWhatsappNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [message, setMessage] = useState('');
  const url = buildCateringUrl(baseUrl);

  const saveContact = async e => {
    e.preventDefault();
    setMessage('');
    setIsSaving(true);
    try {
      normalizeWhatsAppNumber(number);
      const { data: { session } } = await supabase.auth.getSession();
      const result = await updateCateringContact(cafeDetails.id, number, session?.access_token);
      setNumber(result.cateringWhatsappNumber || '');
      onContactSaved?.(result.cateringWhatsappNumber);
      setMessage('Catering contact saved.');
    } catch (error) {
      setMessage(error.message || 'Unable to save the catering contact.');
    } finally {
      setIsSaving(false);
    }
  };

  const shareQR = async () => {
    setIsSharing(true);
    setMessage('');
    try {
      const canvas = document.getElementById('qr-catering');
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Unable to create the QR image. Please try again.');
      const file = new File([blob], `${cafeDetails.slug}-catering-qr.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${cafeDetails.name} Catering Menu`, text: `Explore our catering menu: ${url}`, files: [file] });
        setMessage('QR shared.');
      } else {
        downloadQR('qr-catering', `${cafeDetails.slug}-catering-qr`);
        setMessage('QR downloaded. Attach the image in WhatsApp, or use Share on WhatsApp to send the link.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setMessage(error.message || 'Unable to share the QR. Try Download QR.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section aria-labelledby="catering-settings-title" className="space-y-5 rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
      <div>
        <h3 id="catering-settings-title" className="text-lg font-bold text-[#111814]">Catering menu</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">Share every public dish, including items unavailable at the outlet. Prices match your menu; apply discounts when preparing the bill. Hidden categories stay private.</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-bold text-emerald-800 underline underline-offset-4">Preview catering menu</a>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-50 p-4">
        <div className="rounded-xl bg-white p-3">
          <QRCodeCanvas id="qr-catering" value={url} size={192} level="M" marginSize={4} title={`${cafeDetails.name} catering menu QR code`} />
        </div>
        <p className="text-sm font-bold text-[#111814]">{cafeDetails.name} · Catering</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => downloadQR('qr-catering', `${cafeDetails.slug}-catering-qr`)} className="rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-bold">Download QR</button>
          <button type="button" onClick={shareQR} disabled={isSharing} className="rounded-xl bg-[#111814] px-3 py-3 text-sm font-bold text-white disabled:opacity-60">{isSharing ? 'Preparing…' : 'Share QR'}</button>
        </div>
      </div>
      <MenuShareActions name={cafeDetails.name} url={url} />
      <form onSubmit={saveContact} className="space-y-3 border-t border-neutral-200 pt-5">
        <label htmlFor="catering-whatsapp" className="block text-sm font-bold">Catering WhatsApp number</label>
        <p id="catering-whatsapp-help" className="text-sm text-neutral-600">Include the country code, e.g. +91 98765 43210. Leave blank to hide the enquiry button. Sharing the menu still works.</p>
        <input id="catering-whatsapp" aria-describedby="catering-whatsapp-help" type="tel" autoComplete="tel" value={number} onChange={e => setNumber(e.target.value)} maxLength={30}
          className="w-full rounded-xl border border-neutral-300 px-3 py-3 text-base" placeholder="+91…" />
        <button type="submit" disabled={isSaving} className="rounded-xl bg-[#111814] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{isSaving ? 'Saving…' : 'Save catering contact'}</button>
      </form>
      <p role="status" className="text-sm text-neutral-600">{message}</p>
    </section>
  );
}
