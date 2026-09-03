'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBill, getBills, deleteBill } from '@/app/actions/adminActions';
import * as htmlToImage from 'html-to-image';

export default function BillingTab({ items, cafeId, cafeDetails, handleToggleFavorite }) {
  const [bills, setBills] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewState, setViewState] = useState('BUILDER'); // BUILDER, HISTORY
  const [documentType, setDocumentType] = useState('invoice'); // invoice, quotation
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortNewestFirst ? dateB - dateA : dateA - dateB;
    });
  }, [items, sortNewestFirst]);
  
  const billRef = useRef(null);

  useEffect(() => {
    if (viewState === 'HISTORY') {
      loadBills();
    }
  }, [viewState]);

  const loadBills = async () => {
    try {
      const data = await getBills(cafeId);
      setBills(data);
    } catch (error) {
      console.error(error);
    }
  };

  const addItemToBill = (item) => {
    const existingItemIndex = billItems.findIndex(i => i.menuItemId === item.id);
    if (existingItemIndex > -1) {
      const newItems = [...billItems];
      newItems[existingItemIndex].quantity += 1;
      setBillItems(newItems);
    } else {
      setBillItems([...billItems, {
        menuItemId: item.id,
        name: item.name,
        malayalamName: item.malayalamName || '',
        quantity: 1,
        unit: 'kg',
        rate: item.price
      }]);
    }
  };

  const updateBillItem = (index, field, value) => {
    const newItems = [...billItems];
    newItems[index][field] = value;
    setBillItems(newItems);
  };

  const removeBillItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const subtotal = billItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const grandTotal = subtotal + parseFloat(deliveryCharge || 0) - parseFloat(discount || 0);

  const handleGenerateAndShare = async () => {
    if (billItems.length === 0) return alert('Bill is empty!');
    setIsGenerating(true);
    try {
      // 1. Save to DB
      const billData = {
        customerName,
        customerPhone,
        items: billItems.map(item => ({ ...item, lineTotal: item.quantity * item.rate })),
        subtotal,
        discount: parseFloat(discount || 0),
        deliveryCharge: parseFloat(deliveryCharge || 0),
        grandTotal,
        billDate: new Date().toISOString().split('T')[0],
        documentType,
      };
      await createBill(cafeId, billData);

      // 2. Generate Image
      if (!billRef.current) return;
      const dataUrl = await htmlToImage.toPng(billRef.current, { quality: 1.0, backgroundColor: '#ffffff' });

      // 3. Share or Fallback
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'bill.png', { type: 'image/png' });
      
      const shareData = {
        title: `${cafeDetails?.name} - Bill`,
        text: `Here is your bill from ${cafeDetails?.name}. Total: ₹${grandTotal}`,
        files: [file],
      };

      let shared = false;
      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          shared = true;
        } catch (err) {
          console.error("Web share failed, falling back", err);
        }
      }

      if (!shared) {
        // Fallback for non-supporting browsers (e.g., Desktop Chrome to WA Web)
        const downloadLink = document.createElement("a");
        downloadLink.href = dataUrl;
        downloadLink.download = `bill-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        let waUrl = `https://wa.me/${customerPhone}?text=Hello!%20Here%20is%20your%20bill%20from%20${encodeURIComponent(cafeDetails?.name)}.%20Total:%20%E2%82%B9${grandTotal}.%20Please%20find%20the%20attached%20image.`;
        window.open(waUrl, '_blank');
      }

      // Reset form
      setBillItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setDeliveryCharge(0);
      setViewState('HISTORY');
    } catch (error) {
      alert("Failed to generate bill: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteBill = async (id) => {
    if (confirm("Delete this bill?")) {
      await deleteBill(id);
      loadBills();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-neutral-100 p-1 rounded-xl mb-4">
        <button onClick={() => setViewState('BUILDER')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${viewState === 'BUILDER' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'}`}>New Bill</button>
        <button onClick={() => setViewState('HISTORY')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${viewState === 'HISTORY' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'}`}>History</button>
      </div>

      {viewState === 'BUILDER' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-[16px] shadow-sm border border-neutral-100/50">
            <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-neutral-400">Customer Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Name (Optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
              <input type="text" placeholder="WhatsApp Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-[16px] shadow-sm border border-neutral-100/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Add Items</h3>
                <button 
                  onClick={() => setSortNewestFirst(!sortNewestFirst)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-neutral-200 text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-black transition-colors"
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
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {/* Favorites Section */}
                {sortedItems.some(i => i.isFavorite) && (
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span>★</span> Favorites
                    </div>
                    {sortedItems.filter(i => i.isFavorite).map(item => {
                      const isSelected = billItems.some(i => i.menuItemId === item.id);
                      return (
                        <div key={`fav-${item.id}`} className={`flex justify-between items-center p-2 rounded-lg transition-colors border mb-2 ${isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-neutral-50 border-neutral-100'} last:border-0`}>
                          <div className="flex-1 cursor-pointer flex items-center gap-2" onClick={() => addItemToBill(item)}>
                            {isSelected && <span className="text-green-500 font-bold text-xs">✓</span>}
                            <span className={`text-sm font-medium ${isSelected ? 'text-green-800' : ''}`}>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">₹{item.price}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item); }} className="text-yellow-400 hover:text-yellow-500 transition-colors" title="Remove from favorites">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="h-px bg-neutral-200 my-4" />
                  </div>
                )}
                
                {/* All Items */}
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">All Menu Items</div>
                {sortedItems.map(item => {
                  const isSelected = billItems.some(i => i.menuItemId === item.id);
                  return (
                    <div key={item.id} className={`flex justify-between items-center p-2 rounded-lg transition-colors border mb-2 ${isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-neutral-50 border-neutral-100'} last:border-0`}>
                      <div className="flex-1 cursor-pointer flex items-center gap-2" onClick={() => addItemToBill(item)}>
                        {isSelected && <span className="text-green-500 font-bold text-xs">✓</span>}
                        <span className={`text-sm font-medium ${isSelected ? 'text-green-800' : ''}`}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">₹{item.price}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item); }} className={`${item.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-neutral-300 hover:text-yellow-400'} transition-colors`} title="Toggle favorite">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-4 rounded-[16px] shadow-sm border border-neutral-100/50 flex flex-col">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-widest text-neutral-400">Bill Items</h3>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-60">
                {billItems.length === 0 && <p className="text-xs text-neutral-400 text-center py-4">No items added.</p>}
                {billItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold truncate max-w-[150px]">{item.name}</span>
                      <button onClick={() => removeBillItem(idx)} className="text-red-500 hover:text-red-700 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0.1" step="any" value={item.quantity} onChange={e => updateBillItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-16 bg-white border border-neutral-200 rounded px-2 py-1 text-xs" />
                      <select value={item.unit} onChange={e => updateBillItem(idx, 'unit', e.target.value)} className="bg-white border border-neutral-200 rounded px-2 py-1 text-xs">
                        <option value="kg">kg</option>
                        <option value="piece">pc</option>
                        <option value="plate">plate</option>
                        <option value="g">g</option>
                        <option value="pack">pack</option>
                      </select>
                      <span className="text-xs text-neutral-500 mx-1">x ₹{item.rate}</span>
                      <span className="text-sm font-bold ml-auto">₹{(item.quantity * item.rate).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                <div className="flex justify-between text-sm"><span className="text-neutral-500">Subtotal</span><span className="font-bold">₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Discount (₹)</span>
                  <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-right focus:outline-none focus:border-black" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Delivery (₹)</span>
                  <input type="number" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-right focus:outline-none focus:border-black" />
                </div>
                <div className="flex justify-between text-lg font-black pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>

                <div className="pt-2">
                  <div className="flex gap-2">
                    <button onClick={() => setDocumentType('invoice')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors border ${documentType === 'invoice' ? 'bg-[#111814] text-white border-[#111814]' : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'}`}>INVOICE</button>
                    <button onClick={() => setDocumentType('quotation')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors border ${documentType === 'quotation' ? 'bg-[#111814] text-white border-[#111814]' : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'}`}>QUOTATION</button>
                  </div>
                </div>
                
                <button 
                  onClick={handleGenerateAndShare}
                  disabled={isGenerating || billItems.length === 0}
                  className="w-full mt-4 bg-[#111814] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-neutral-800 transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate & Share via WhatsApp'}
                </button>
              </div>
            </div>
          </div>

          {/* Hidden Bill Template for html-to-image */}
          <div className="fixed top-[200%] left-[200%] pointer-events-none">
            <div ref={billRef} className="w-[400px] bg-white p-6 pb-10 text-[#111814] font-sans">
              <div className="text-center mb-6 border-b-2 border-dashed border-neutral-300 pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight">{cafeDetails?.name}</h1>
                <p className="text-sm font-medium text-neutral-500">{documentType === 'quotation' ? 'QUOTATION' : 'RECEIPT / INVOICE'}</p>
              </div>
              <div className="flex justify-between text-sm font-medium mb-4">
                <div>
                  {customerName && <div><span className="text-neutral-500">To:</span> {customerName}</div>}
                  {customerPhone && <div><span className="text-neutral-500">Ph:</span> {customerPhone}</div>}
                </div>
                <div className="text-right">
                  <span className="text-neutral-500">Date:</span> {new Date().toLocaleDateString()}
                </div>
              </div>
              
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs text-neutral-500 uppercase">
                    <th className="text-left py-2 font-bold w-1/2">Item</th>
                    <th className="text-center py-2 font-bold">Qty</th>
                    <th className="text-right py-2 font-bold">Rate</th>
                    <th className="text-right py-2 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-neutral-100 last:border-0 text-sm">
                      <td className="py-3 pr-2">
                        <div className="font-bold">{item.name}</div>
                        {item.malayalamName && <div className="text-xs text-neutral-500">{item.malayalamName}</div>}
                      </td>
                      <td className="py-3 text-center">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-right">₹{item.rate}</td>
                      <td className="py-3 text-right font-bold">₹{(item.quantity * item.rate).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-neutral-800 pt-4 space-y-2 text-sm">
                <div className="flex justify-end gap-8">
                  <span className="text-neutral-500 font-bold">Subtotal:</span>
                  <span className="w-24 text-right font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {parseFloat(discount) > 0 && (
                  <div className="flex justify-end gap-8">
                    <span className="text-neutral-500 font-bold">Discount:</span>
                    <span className="w-24 text-right font-bold">-₹{parseFloat(discount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(deliveryCharge) > 0 && (
                  <div className="flex justify-end gap-8">
                    <span className="text-neutral-500 font-bold">Delivery:</span>
                    <span className="w-24 text-right font-bold">₹{parseFloat(deliveryCharge).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-end gap-8 pt-2 mt-2 border-t border-neutral-200 text-xl">
                  <span className="font-black uppercase tracking-tight">Grand Total:</span>
                  <span className="w-24 text-right font-black">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-8 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>
      )}

      {viewState === 'HISTORY' && (
        <div className="bg-white p-4 rounded-[16px] shadow-sm border border-neutral-100/50">
          <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-neutral-400">Past Bills</h3>
          <div className="space-y-3">
            {bills.length === 0 && <p className="text-xs text-neutral-400 text-center">No bills generated yet.</p>}
            {bills.map(bill => (
              <div key={bill.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-[#111814]">₹{bill.grandTotal}</div>
                  <div className="text-xs text-neutral-500">{new Date(bill.createdAt).toLocaleString()} • {bill.customerName || 'Guest'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteBill(bill.id)} className="p-2 bg-white border border-neutral-200 rounded-lg text-red-500 hover:text-red-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
