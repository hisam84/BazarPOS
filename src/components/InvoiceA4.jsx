'use client';

import React from 'react';
import BarcodeSvg from '@/components/BarcodeSvg';
import { formatDhakaDateTime } from '@/lib/date-utils';

// Convert number to Bangladeshi Taka in words
function numberToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  num = Math.round(Number(num));
  if (num === 0) return 'Zero Taka Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n) {
    let chunkStr = '';
    if (n >= 100) {
      chunkStr += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      chunkStr += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      chunkStr += ones[n] + ' ';
    }
    return chunkStr;
  }

  let words = '';
  if (num >= 10000000) {
    const crore = Math.floor(num / 10000000);
    words += convertChunk(crore) + 'Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    const lakh = Math.floor(num / 100000);
    words += convertChunk(lakh) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    words += convertChunk(thousand) + 'Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    words += convertChunk(num);
  }

  return (words.trim() + ' Taka Only').replace(/\s+/g, ' ');
}

export default function InvoiceA4({
  invoice = {},
  company = {},
  settings = {},
  isSample = false
}) {
  const accentColor = settings?.accentColor || '#2563eb';

  const prefix = (settings?.invoicePrefix || 'INV-').trim();
  const formattedPrefix = prefix.endsWith('-') || prefix.endsWith('/') || prefix.endsWith('_') || prefix.endsWith('#') ? prefix : prefix + '-';

  // Sample data fallback for live preview
  const sampleVoucher = {
    voucherNo: `${formattedPrefix}1089`,
    date: new Date().toISOString(),
    clientName: 'Rahim Chowdhury Enterprise',
    clientPhone: '+880 1711-234567',
    clientAddress: 'House 42, Road 11, Banani, Dhaka-1213',
    salerName: 'Md. Karim (Sales Counter 1)',
    paymentMethod: 'Cash / bKash',
    items: [
      { sl: 1, code: 'PRD-101', name: 'Premium Jasmine Rice (50kg)', unit: 'Bag', warranty: '1 Year Brand Warranty', description: 'Export Quality 100% Sorted Premium Grain', quantity: 2, unitPrice: 3850, discount: 100, total: 7600 },
      { sl: 2, code: 'PRD-104', name: 'Pure Mustard Oil (5 Liter Can)', unit: 'Can', warranty: '', description: '', quantity: 3, unitPrice: 920, discount: 0, total: 2760 },
      { sl: 3, code: 'PRD-209', name: 'Aromatic Tea Powder (500g Pack)', unit: 'Pcs', warranty: '6 Months Replacement', description: 'Selected CTC Blend', quantity: 5, unitPrice: 240, discount: 50, total: 1150 },
      { sl: 4, code: 'PRD-315', name: 'Refined Sugar (Grade A)', unit: 'Kg', warranty: '', description: '', quantity: 10, unitPrice: 135, discount: 0, total: 1350 }
    ],
    subTotal: 13000,
    discount: 140,
    vatAmount: 0,
    deliveryCharge: 0,
    totalAmount: 12860,
    paidAmount: 10000,
    dueAmount: 2860
  };

  const data = isSample ? sampleVoucher : invoice;
  const items = (data?.items && data.items.length > 0) ? data.items : (isSample ? sampleVoucher.items : []);
  const subTotal = Number(data?.subTotal || items.reduce((acc, it) => acc + ((it.quantity || 1) * (it.unitPrice || 0)), 0));
  const discount = Number(data?.discount || 0);
  const totalAmount = Number(data?.totalAmount || (subTotal - discount));
  const paidAmount = Number(data?.paidAmount || 0);
  const dueAmount = Number(data?.dueAmount !== undefined ? data.dueAmount : Math.max(0, totalAmount - paidAmount));

  return (
    <div
      className="a4-invoice-sheet bg-white text-slate-900 mx-auto shadow-md relative print:shadow-none print:m-0 print:border-none print:w-full w-full max-w-[210mm] transition-all p-3 sm:p-6 md:p-8 print:p-[12mm_15mm] text-xs"
      style={{
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* 1. HEADER BANNER (IF UPLOADED & ENABLED) */}
      {settings?.showHeaderBanner && settings?.headerBanner && (
        <div className="mb-3 sm:mb-4 w-full rounded-lg overflow-hidden border border-slate-200">
          <img
            src={settings.headerBanner}
            alt="Invoice Header Banner"
            className="w-full h-auto max-h-24 sm:max-h-36 object-cover object-center block"
          />
        </div>
      )}

      {/* 2. COMPANY INFO & INVOICE TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 sm:pb-4 border-b-2" style={{ borderColor: accentColor }}>
        {/* Left: Company Details */}
        <div className="space-y-1 w-full sm:max-w-[60%]">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {settings?.showLogo && (settings?.logoUrl || company?.logoUrl) && (
              <img
                src={settings?.logoUrl || company?.logoUrl}
                alt="Logo"
                style={{
                  height: (() => {
                    const sz = settings?.logoSize || 'medium';
                    if (sz === 'small') return '28px';
                    if (sz === 'large') return '60px';
                    if (sz === 'xlarge') return '80px';
                    if (sz === 'custom') return `${settings?.logoCustomPx || 48}px`;
                    return '40px'; // medium
                  })(),
                  width: 'auto',
                  objectFit: 'contain',
                  maxWidth: '160px'
                }}
              />
            )}
            {settings?.showStoreName && (
              <div>
                <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-tight uppercase">
                  {company?.name || 'BazarPOS Outlet'}
                </h1>
                {company?.tagline && (
                  <p className="text-[10px] sm:text-[11px] font-medium text-slate-500">{company.tagline}</p>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-600 space-y-0.5 pt-1 leading-relaxed">
            {settings?.showStoreAddress && company?.address && (
              <p className="flex items-start">
                <span className="font-semibold text-slate-700 min-w-[50px] sm:min-w-[55px]">Address:</span>
                <span>{company.address}</span>
              </p>
            )}
            {settings?.showStorePhone && company?.phone && (
              <p className="flex items-center">
                <span className="font-semibold text-slate-700 min-w-[50px] sm:min-w-[55px]">Phone:</span>
                <span>{company.phone}</span>
              </p>
            )}
            {settings?.showStoreEmail && company?.email && (
              <p className="flex items-center">
                <span className="font-semibold text-slate-700 min-w-[50px] sm:min-w-[55px]">Email:</span>
                <span className="break-all">{company.email}</span>
              </p>
            )}
            {settings?.showStoreWebsite && company?.website && (
              <p className="flex items-center">
                <span className="font-semibold text-slate-700 min-w-[50px] sm:min-w-[55px]">Web:</span>
                <span className="break-all">{company.website}</span>
              </p>
            )}
            {settings?.showTaxBin && (settings?.taxBinNumber || company?.taxBinNumber) && (
              <p className="flex items-center">
                <span className="font-semibold text-slate-700 min-w-[50px] sm:min-w-[55px]">BIN / TAX:</span>
                <span className="font-mono font-bold text-slate-800">{settings.taxBinNumber || company.taxBinNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Invoice Type & Badge */}
        <div className="text-left sm:text-right space-y-1 w-full sm:w-auto flex flex-col sm:items-end">
          <div
            className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-sm self-start sm:self-auto"
            style={{ backgroundColor: accentColor }}
          >
            {settings?.invoiceTitle || 'TAX INVOICE'}
          </div>
          {settings?.invoiceSubtitle && (
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {settings.invoiceSubtitle}
            </p>
          )}

          <div className="pt-1 sm:pt-2 text-[10px] sm:text-[11px] text-slate-700 space-y-0.5">
            <p className="font-mono">
              <span className="text-slate-500 font-sans">Invoice #: </span>
              <span className="font-bold text-slate-900">{data?.voucherNo || 'INV-0000'}</span>
            </p>
            {settings?.showInvoiceDate && (
              <p>
                <span className="text-slate-500">Date: </span>
                <span className="font-semibold">{formatDhakaDateTime(data?.date || new Date())}</span>
              </p>
            )}
            {settings?.showSalerName && data?.salerName && (
              <p>
                <span className="text-slate-500">Served By: </span>
                <span className="font-medium">{data.salerName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. BILL TO (CUSTOMER DETAILS) & PAYMENT INFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 py-2.5 sm:py-3 border-b border-slate-200 text-[10px] sm:text-[11px]">
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To / Customer Info:</p>
          {settings?.showCustomerName && (
            <p className="font-bold text-xs sm:text-sm text-slate-900">{data?.clientName || 'Walk-in Customer'}</p>
          )}
          {settings?.showCustomerPhone && data?.clientPhone && (
            <p className="text-slate-600">
              <span className="font-medium text-slate-500">Phone: </span>{data.clientPhone}
            </p>
          )}
          {settings?.showCustomerAddress && data?.clientAddress && (
            <p className="text-slate-600 leading-tight">
              <span className="font-medium text-slate-500">Address: </span>{data.clientAddress}
            </p>
          )}
        </div>

        <div className="text-left sm:text-right space-y-1 flex flex-col sm:items-end justify-end">
          {settings?.showPaymentMethod && (
            <p className="text-slate-600">
              <span className="text-slate-500">Payment Mode: </span>
              <span className="font-bold text-slate-800 uppercase px-1.5 py-0.5 bg-slate-100 rounded text-[10px] sm:text-[11px]">
                {data?.paymentMethod || 'Cash'}
              </span>
            </p>
          )}
          {settings?.showBarcode && (
            <div className="flex justify-start sm:justify-end items-center space-x-1 pt-1">
              <div className="bg-white p-1 rounded border border-slate-200">
                <BarcodeSvg
                  value={data?.voucherNo || 'INV-0000'}
                  height={18}
                  showText={false}
                />
                <span className="font-mono text-[7px] sm:text-[8px] text-slate-500 text-center block">
                  *{data?.voucherNo || 'INV-0000'}*
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. ITEMS TABLE */}
      <div className="mt-2.5 sm:mt-3 overflow-x-auto">
        <table className="w-full text-left border-collapse text-[10px] sm:text-[11px]">
          <thead>
            <tr
              className="text-white font-semibold uppercase text-[9px] sm:text-[10px] tracking-wide"
              style={{ backgroundColor: accentColor }}
            >
              {settings?.showItemSl && <th className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-center w-6 sm:w-8 rounded-l whitespace-nowrap">#</th>}
              {settings?.showItemCode && <th className="py-1.5 sm:py-2 px-1.5 sm:px-2 w-14 sm:w-20 whitespace-nowrap">Code</th>}
              <th className="py-1.5 sm:py-2 px-2 sm:px-3 min-w-[110px] sm:min-w-[160px]">Item Description</th>
              <th className="py-1.5 sm:py-2 px-1.5 sm:px-3 text-right whitespace-nowrap">Unit Price</th>
              <th className="py-1.5 sm:py-2 px-1.5 sm:px-3 text-center w-10 sm:w-14 whitespace-nowrap">Qty</th>
              {settings?.showItemDiscount && <th className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-right whitespace-nowrap">Disc.</th>}
              {settings?.showItemTotal && <th className="py-1.5 sm:py-2 px-2 sm:px-3 text-right rounded-r whitespace-nowrap">Total (৳)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => {
              const qty = Number(item.quantity || 1);
              const price = Number(item.unitPrice || 0);
              const itemDisc = Number(item.discount || 0);
              const lineTotal = (qty * price) - itemDisc;

              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  {settings?.showItemSl && (
                    <td className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-center text-slate-500 font-mono text-[9px] sm:text-[10px]">
                      {idx + 1}
                    </td>
                  )}
                  {settings?.showItemCode && (
                    <td className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-slate-500 font-mono text-[9px] sm:text-[10px]">
                      {item.code || '-'}
                    </td>
                  )}
                  <td className="py-1.5 sm:py-2 px-2 sm:px-3">
                    <span className="font-semibold text-slate-900 block leading-tight">{item.name}</span>
                    
                    {/* Unit, Brand, Warranty & Serial Number badges */}
                    <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2.5 gap-y-0.5 mt-0.5 text-[9px] sm:text-[10px] text-slate-500">
                      {item.brand && settings?.showItemBrand !== false && (
                        <span className="text-indigo-700 font-semibold bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200/80">
                          Brand: {item.brand}
                        </span>
                      )}
                      {item.unit && settings?.showItemUnit !== false && (
                        <span>Unit: <strong className="text-slate-700 font-medium">{item.unit}</strong></span>
                      )}
                      {item.warranty && item.warranty.trim() !== '' && settings?.showItemWarranty !== false && (
                        <span className="text-blue-700 font-medium bg-blue-50 px-1 py-0.2 rounded border border-blue-200/80 inline-flex items-center space-x-0.5">
                          <span>🛡️ Warranty: {item.warranty}{item.warrantyType && item.warrantyType !== 'none' ? ` (${item.warrantyType.charAt(0).toUpperCase() + item.warrantyType.slice(1)})` : ''}</span>
                        </span>
                      )}
                      {(item.serialNumber || item.serialNo) && (item.serialNumber || item.serialNo).trim() !== '' && settings?.showItemSerial !== false && (
                        <span className="text-purple-700 font-medium bg-purple-50 px-1 py-0.2 rounded border border-purple-200/80 inline-flex items-center space-x-0.5 font-mono">
                          <span>🔢 S/N: {item.serialNumber || item.serialNo}</span>
                        </span>
                      )}
                    </div>

                    {/* Description note if present */}
                    {item.description && item.description.trim() !== '' && (
                      <p className="text-[9px] sm:text-[10px] text-slate-500 italic mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 sm:py-2 px-1.5 sm:px-3 text-right font-mono text-slate-700">
                    ৳{price.toLocaleString()}
                  </td>
                  <td className="py-1.5 sm:py-2 px-1.5 sm:px-3 text-center font-bold text-slate-800">
                    {qty}
                  </td>
                  {settings?.showItemDiscount && (
                    <td className="py-1.5 sm:py-2 px-1.5 sm:px-2 text-right font-mono text-slate-500">
                      {itemDisc > 0 ? `৳${itemDisc}` : '-'}
                    </td>
                  )}
                  {settings?.showItemTotal && (
                    <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-right font-bold text-slate-900 font-mono">
                      ৳{lineTotal.toLocaleString()}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. SUMMARY & CALCULATION SECTION */}
      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 text-[10px] sm:text-[11px]">
        {/* Left: In Words, Warranty, Notes & Terms */}
        <div className="md:col-span-7 space-y-2 sm:space-y-2.5">
          <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-wider">Amount In Words:</p>
            <p className="font-semibold text-slate-800 italic text-[11px] sm:text-xs leading-relaxed">
              {numberToWords(totalAmount)}
            </p>
          </div>

          {/* Sale Note & Payment Note */}
          {((data?.saleNote && settings?.showSaleNote !== false) || (data?.paymentNote && settings?.showPaymentNote !== false) || (data?.note && !data?.saleNote)) && (
            <div className="p-2 sm:p-2.5 bg-blue-50/50 rounded-lg border border-blue-200/80 space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-blue-700 tracking-wider">Notes & Remarks:</p>
              {data?.saleNote && (
                <p className="text-[9px] sm:text-[10px] text-slate-700">
                  <span className="font-semibold text-slate-900">Sale Note: </span>{data.saleNote}
                </p>
              )}
              {data?.note && !data?.saleNote && (
                <p className="text-[9px] sm:text-[10px] text-slate-700">
                  <span className="font-semibold text-slate-900">Note: </span>{data.note}
                </p>
              )}
              {data?.paymentNote && (
                <p className="text-[9px] sm:text-[10px] text-slate-700">
                  <span className="font-semibold text-slate-900">Payment Reference: </span>{data.paymentNote}
                </p>
              )}
            </div>
          )}

          {/* Payment History / Installments */}
          {data?.paymentHistory && data.paymentHistory.length > 0 && (
            <div className="p-2 sm:p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80 space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-800 tracking-wider flex items-center justify-between">
                <span>💳 Payment Receipts / Dues Settled:</span>
                <span className="font-mono text-emerald-700 font-semibold">{data.paymentHistory.length} Record(s)</span>
              </p>
              <div className="space-y-1 divide-y divide-emerald-100">
                {data.paymentHistory.map((p, pIdx) => (
                  <div key={p.id || pIdx} className="pt-1 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-900">{formatDhakaDate(p.date)}</span>
                      <span className="text-slate-500 ml-1">({p.paymentMethod || 'Cash'})</span>
                      {p.note && <span className="text-slate-500 italic ml-1">- {p.note}</span>}
                    </div>
                    <span className="font-mono font-bold text-emerald-700">+৳{Number(p.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warranty Policy Section */}
          {settings?.showWarrantySection !== false && (settings?.warrantyTerms || settings?.warrantyPolicyText) && (
            <div className="p-2 sm:p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/80 space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1">
                <span>🛡️ {settings.warrantyTitle || 'Warranty Terms & Policy'}:</span>
              </p>
              <div className="text-[9px] sm:text-[10px] text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                {settings.warrantyTerms || settings.warrantyPolicyText}
              </div>
            </div>
          )}

          {/* General Terms & Conditions */}
          {settings?.showTerms && settings?.termsAndConditions && (
            <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-wider">Terms & Conditions:</p>
              <div className="text-[9px] sm:text-[10px] text-slate-600 whitespace-pre-line leading-relaxed font-sans">
                {settings.termsAndConditions}
              </div>
            </div>
          )}
        </div>

        {/* Right: Calculations Table */}
        <div className="md:col-span-5 space-y-1.5 font-sans">
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200 space-y-1.5">
            {settings?.showSubtotal && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900">৳{subTotal.toLocaleString()}</span>
              </div>
            )}

            {settings?.showDiscount && discount > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Discount:</span>
                <span className="font-mono font-semibold text-rose-600">-৳{discount.toLocaleString()}</span>
              </div>
            )}

            {/* Previous Due Added */}
            {settings?.showPreviousDue !== false && (data?.previousDue > 0 || (data?.includePreviousDue && data?.previousDue)) && (
              <div className="flex justify-between items-center text-amber-800 font-semibold bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60 text-[10px] sm:text-[10.5px]">
                <span>Previous Due:</span>
                <span className="font-mono font-bold">+৳{Number(data.previousDue).toLocaleString()}</span>
              </div>
            )}

            {settings?.showTaxVat && (settings?.taxVatPercent > 0 || data?.vatAmount > 0) && (
              <div className="flex justify-between items-center text-slate-600">
                <span>VAT / Tax ({settings?.taxVatPercent || 0}%):</span>
                <span className="font-mono font-semibold text-slate-900">৳{(data?.vatAmount || (subTotal * (settings?.taxVatPercent || 0) / 100)).toLocaleString()}</span>
              </div>
            )}

            {settings?.showDeliveryCharge && (data?.deliveryCharge > 0) && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-mono font-semibold text-slate-900">৳{Number(data.deliveryCharge).toLocaleString()}</span>
              </div>
            )}

            {/* Grand Total Bar */}
            <div
              className="flex justify-between items-center py-1.5 sm:py-2 px-2 sm:px-2.5 rounded text-white font-bold text-xs sm:text-sm my-1 shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <span>Net Payable:</span>
              <span className="font-mono font-black text-sm sm:text-base">৳{totalAmount.toLocaleString()}</span>
            </div>

            {settings?.showPaidAmount && (
              <div className="flex justify-between items-center text-slate-700 pt-1">
                <span className="font-medium">Paid Amount:</span>
                <span className="font-mono font-bold text-emerald-700">৳{paidAmount.toLocaleString()}</span>
              </div>
            )}

            {settings?.showDueAmount && (
              <div className={`flex justify-between items-center pt-1 border-t border-slate-200 font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                <span>{dueAmount > 0 ? 'Due Balance:' : 'Change / Balance:'}</span>
                <span className="font-mono text-xs sm:text-sm">৳{dueAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. SIGNATURE AREAS */}
      {settings?.showSignatures && (
        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 flex justify-between items-end gap-2 text-[10px] sm:text-[11px] text-slate-700">
          <div className="text-center w-32 sm:w-48 space-y-1">
            <div className="border-t border-slate-400 border-dashed pt-1.5 font-semibold">
              {settings?.customerSignatureLabel || 'Customer Signature'}
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-400">Received Goods in Good Condition</p>
          </div>

          <div className="text-center w-32 sm:w-48 space-y-1">
            <div className="border-t border-slate-400 border-dashed pt-1.5 font-semibold">
              {settings?.authorizedSignatureLabel || 'Authorized Signature'}
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-400">For {company?.name || 'BazarPOS'}</p>
          </div>
        </div>
      )}

      {/* 7. FOOTER NOTE */}
      {settings?.showFooterNote && settings?.footerNote && (
        <div className="mt-4 sm:mt-6 pt-2.5 sm:pt-3 border-t border-slate-200 text-center text-[9px] sm:text-[10px] text-slate-500 font-medium">
          {settings.footerNote}
        </div>
      )}
    </div>
  );
}
