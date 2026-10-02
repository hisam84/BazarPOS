'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Save,
  Printer,
  CheckCircle,
  Eye,
  Trash2,
  Settings,
  Palette,
  Check,
  Building2,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import InvoiceA4 from '@/components/InvoiceA4';

const COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Deep Indigo', hex: '#4f46e5' },
  { name: 'Dark Slate', hex: '#0f172a' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Teal Cyan', hex: '#0891b2' },
  { name: 'Crimson Wine', hex: '#dc2626' },
  { name: 'Amber Orange', hex: '#d97706' },
  { name: 'Violet Purple', hex: '#7c3aed' },
];

const TITLE_PRESETS = [
  'TAX INVOICE',
  'INVOICE',
  'CASH MEMO',
  'BILL / RECEIPT',
  'DELIVERY CHALLAN'
];

const PREFIX_PRESETS = [
  'INV-',
  'POS-',
  'BILL-',
  'MEMO-',
  'ZM-',
  'TAX-',
  'SAL-'
];

export default function InvoiceSettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [company, setCompany] = useState({
    name: 'BazarPOS Outlet',
    tagline: 'Modern Retail & Wholesale Point of Sale',
    phone: '+880 1700-000000',
    email: 'contact@bazarpos.com',
    website: 'www.bazarpos.com',
    address: 'Plot 18, Block B, Commercial Area, Dhaka-1212',
    logoUrl: ''
  });

  const [settings, setSettings] = useState({
    invoicePrefix: 'INV-',
    headerType: 'both',
    headerBanner: '',
    logoUrl: '',
    invoiceTitle: 'TAX INVOICE',
    invoiceSubtitle: 'Original Customer Copy',
    
    // Header Visibility
    showHeaderBanner: true,
    showLogo: true,
    showStoreName: true,
    showStoreAddress: true,
    showStorePhone: true,
    showStoreEmail: true,
    showStoreWebsite: true,
    showTaxBin: true,
    taxBinNumber: 'BIN-10928374-0101',

    // Customer Info
    showCustomerName: true,
    showCustomerPhone: true,
    showCustomerAddress: true,
    showInvoiceDate: true,
    showDueDate: false,
    showSalerName: true,
    showPaymentMethod: true,
    showBarcode: true,

    // Table Columns
    showItemSl: true,
    showItemCode: false,
    showItemBrand: true,
    showItemUnit: true,
    showItemWarranty: true,
    showItemSerial: true,
    showItemDiscount: false,
    showItemTotal: true,

    // Summary
    showSubtotal: true,
    showDiscount: true,
    showPreviousDue: true,
    showTaxVat: true,
    taxVatPercent: 0,
    showDeliveryCharge: false,
    showPaidAmount: true,
    showDueAmount: true,

    // Warranty & Policy
    showWarrantySection: true,
    warrantyTitle: 'Warranty Terms & Policy',
    warrantyTerms: '1. Warranty is valid only when accompanied by this original invoice.\n2. Physical damage, liquid ingress, burn, or seal tampering voids warranty.\n3. Turnaround time for warranty claim/replacement is 3-7 business days.',

    // Notes
    showSaleNote: true,
    showPaymentNote: true,

    // Terms & Signatures
    showTerms: true,
    termsAndConditions: '1. Goods once sold can be exchanged within 7 days with this invoice.\n2. Warranty claims require original receipt and intact barcode.\n3. Perishable or promotion items cannot be returned.',
    showFooterNote: true,
    footerNote: 'Thank you for your business! Please visit us again.',
    showSignatures: true,
    customerSignatureLabel: 'Customer Signature',
    authorizedSignatureLabel: 'Authorized Signature',

    // Design
    paperSize: 'A4',
    accentColor: '#2563eb',
    logoSize: 'medium',
    logoCustomPx: 64
  });

  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadSettings(u.storeId || 'default');
    } else {
      loadSettings('default');
    }
  }, []);

  const loadSettings = async (storeId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoice-settings?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
        if (data.company) setCompany(prev => ({ ...prev, ...data.company }));
      }
    } catch (err) {
      console.error('Failed to load invoice settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/invoice-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          settings: settings
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Invoice settings successfully saved!');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setErrorMsg(data.message || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMsg('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Header image is too large. Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings(prev => ({
        ...prev,
        headerBanner: event.target.result,
        showHeaderBanner: true
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Logo image is too large. Please choose an image under 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings(prev => ({
        ...prev,
        logoUrl: event.target.result,
        showLogo: true
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeBanner = () => {
    setSettings(prev => ({ ...prev, headerBanner: '' }));
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const removeLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handlePrintTest = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 overflow-x-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <FileText className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">A4 Invoice Designer</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Customize invoice layout, upload header banner, and view live A4 preview.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintTest}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition border border-slate-200 shadow-xs active:scale-95"
          >
            <Printer size={15} />
            <span>Print Test</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 sm:px-6 sm:py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-blue-500/20 active:scale-98"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold rounded-2xl flex items-center space-x-2 no-print animate-fadeIn">
          <CheckCircle size={17} className="flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold rounded-2xl flex items-center space-x-2 no-print">
          <ShieldAlert size={17} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Controls + Right A4 Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* ================= LEFT CONTROLS COLUMN ================= */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6 no-print">
          {/* 1. Header Banner & Branding */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <ImageIcon className="text-blue-600" size={18} />
                <span>Invoice Header & Banner Upload</span>
              </h2>
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                A4 Printable
              </span>
            </div>

            {/* Header Banner Image Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Custom Header Banner Image (Top of Invoice)
                </label>
                <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showHeaderBanner}
                    onChange={(e) => setSettings({ ...settings, showHeaderBanner: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show Banner</span>
                </label>
              </div>

              {settings.headerBanner ? (
                <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2">
                  <img
                    src={settings.headerBanner}
                    alt="Header Banner"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition"
                      title="Remove Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer transition"
                >
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-xs font-bold text-slate-700">Click to Upload Header Banner</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Recommended: 1200x250 px JPG, PNG (Max 2MB)
                  </p>
                </div>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </div>

            {/* Logo Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Company Logo</label>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLogo}
                      onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show Logo</span>
                  </label>
                </div>
                {settings.logoUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        style={{ height: settings.logoSize === 'custom' ? `${settings.logoCustomPx || 64}px` : settings.logoSize === 'small' ? '32px' : settings.logoSize === 'large' ? '80px' : settings.logoSize === 'xlarge' ? '112px' : '48px' }}
                        className="w-auto object-contain rounded"
                      />
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-500 font-medium">Logo Preview</p>
                        <p className="text-[10px] text-slate-400">
                          {settings.logoSize === 'custom' ? `${settings.logoCustomPx || 64}px height` : settings.logoSize === 'small' ? '32px height' : settings.logoSize === 'large' ? '80px height' : settings.logoSize === 'xlarge' ? '112px height' : '48px height'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Logo Size Picker */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 mb-1.5">Logo Size</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: 'small', label: 'S', desc: '32px' },
                          { value: 'medium', label: 'M', desc: '48px' },
                          { value: 'large', label: 'L', desc: '80px' },
                          { value: 'xlarge', label: 'XL', desc: '112px' },
                          { value: 'custom', label: 'Custom', desc: '' },
                        ].map(sz => (
                          <button
                            key={sz.value}
                            type="button"
                            onClick={() => setSettings({ ...settings, logoSize: sz.value })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                              settings.logoSize === sz.value
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            {sz.label}{sz.desc ? <span className="ml-0.5 opacity-70">({sz.desc})</span> : ''}
                          </button>
                        ))}
                      </div>
                      {settings.logoSize === 'custom' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="range"
                            min="24"
                            max="160"
                            step="4"
                            value={settings.logoCustomPx || 64}
                            onChange={(e) => setSettings({ ...settings, logoCustomPx: Number(e.target.value) })}
                            className="flex-1 h-1.5 accent-blue-600"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 w-12 text-center">
                            {settings.logoCustomPx || 64}px
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-2.5 px-3 border border-dashed border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center space-x-1.5"
                  >
                    <Upload size={14} />
                    <span>Upload Logo Image</span>
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Accent Color Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Palette size={14} className="text-blue-600" />
                    <span>Invoice Accent Color Theme</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-100 rounded-md">
                    {settings.accentColor || '#2563eb'}
                  </span>
                </div>

                {/* Preset Palette */}
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setSettings({ ...settings, accentColor: col.hex })}
                      style={{ backgroundColor: col.hex }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-sm hover:scale-110 ${
                        (settings.accentColor || '').toLowerCase() === col.hex.toLowerCase()
                          ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-md'
                          : 'opacity-85 hover:opacity-100'
                      }`}
                      title={col.name}
                    >
                      {(settings.accentColor || '').toLowerCase() === col.hex.toLowerCase() && (
                        <Check size={12} className="text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom HEX Code & Native Color Picker */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative w-9 h-9 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-slate-400 transition" style={{ backgroundColor: settings.accentColor || '#2563eb' }}>
                    <input
                      type="color"
                      value={settings.accentColor?.startsWith('#') && settings.accentColor.length === 7 ? settings.accentColor : '#2563eb'}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Open Color Wheel / Palette"
                    />
                  </div>

                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">#</span>
                    <input
                      type="text"
                      maxLength={7}
                      placeholder="HEX Code (e.g. 2563eb or #2563eb)"
                      value={settings.accentColor || ''}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val && !val.startsWith('#')) {
                          val = '#' + val;
                        }
                        setSettings({ ...settings, accentColor: val });
                      }}
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Title Presets & Custom Title */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Invoice Document Title</label>
              <div className="flex flex-wrap gap-2">
                {TITLE_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSettings({ ...settings, invoiceTitle: t })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      settings.invoiceTitle === t
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Custom Title</label>
                  <input
                    type="text"
                    value={settings.invoiceTitle}
                    onChange={(e) => setSettings({ ...settings, invoiceTitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtitle / Copy Label</label>
                  <input
                    type="text"
                    value={settings.invoiceSubtitle}
                    onChange={(e) => setSettings({ ...settings, invoiceSubtitle: e.target.value })}
                    placeholder="e.g. Original Customer Copy"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Custom Invoice Number Prefix */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Custom Invoice Number Prefix
                </label>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                  Preview: {(settings.invoicePrefix || 'INV-').endsWith('-') || (settings.invoicePrefix || 'INV-').endsWith('/') || (settings.invoicePrefix || 'INV-').endsWith('_') || (settings.invoicePrefix || 'INV-').endsWith('#') ? (settings.invoicePrefix || 'INV-') : (settings.invoicePrefix || 'INV-') + '-'}1001
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PREFIX_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSettings({ ...settings, invoicePrefix: p })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      settings.invoicePrefix === p
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={settings.invoicePrefix || ''}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  placeholder="e.g. INV-, POS-, BILL-, ZM-, 2026/INV-"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  This custom prefix will be automatically attached to all new sales invoices (e.g. <strong>{settings.invoicePrefix || 'INV-'}1001</strong>).
                </p>
              </div>
            </div>
          </div>


          {/* 2. Company Info Toggles & BIN/TAX */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
              <Building2 className="text-blue-600" size={18} />
              <span>Company Information on Invoice</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showStoreName}
                  onChange={(e) => setSettings({ ...settings, showStoreName: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Company Name</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showStoreAddress}
                  onChange={(e) => setSettings({ ...settings, showStoreAddress: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Address</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showStorePhone}
                  onChange={(e) => setSettings({ ...settings, showStorePhone: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Phone Number</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showStoreEmail}
                  onChange={(e) => setSettings({ ...settings, showStoreEmail: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Email Address</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showStoreWebsite}
                  onChange={(e) => setSettings({ ...settings, showStoreWebsite: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Website URL</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTaxBin}
                  onChange={(e) => setSettings({ ...settings, showTaxBin: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">BIN / Tax ID</span>
              </label>
            </div>

            {settings.showTaxBin && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Store BIN / VAT / Trade License Number
                </label>
                <input
                  type="text"
                  value={settings.taxBinNumber}
                  onChange={(e) => setSettings({ ...settings, taxBinNumber: e.target.value })}
                  placeholder="e.g. BIN-10928374-0101"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* 3. Customer & Table Fields Selection */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
              <UserCheck className="text-blue-600" size={18} />
              <span>Customer & Item Table Columns</span>
            </h2>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCustomerName}
                    onChange={(e) => setSettings({ ...settings, showCustomerName: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Customer Name</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCustomerPhone}
                    onChange={(e) => setSettings({ ...settings, showCustomerPhone: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Phone Number</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCustomerAddress}
                    onChange={(e) => setSettings({ ...settings, showCustomerAddress: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Address</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showInvoiceDate}
                    onChange={(e) => setSettings({ ...settings, showInvoiceDate: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Date & Time</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showSalerName}
                    onChange={(e) => setSettings({ ...settings, showSalerName: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Sales Representative</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showBarcode}
                    onChange={(e) => setSettings({ ...settings, showBarcode: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Barcode / Stamp</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Item Table Columns</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemSl}
                    onChange={(e) => setSettings({ ...settings, showItemSl: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Serial No (#)</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemCode}
                    onChange={(e) => setSettings({ ...settings, showItemCode: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Item SKU Code</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemBrand !== false}
                    onChange={(e) => setSettings({ ...settings, showItemBrand: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Product Brand</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemUnit}
                    onChange={(e) => setSettings({ ...settings, showItemUnit: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Unit Label (Pcs/Kg)</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemWarranty !== false}
                    onChange={(e) => setSettings({ ...settings, showItemWarranty: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Warranty Badges</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemSerial !== false}
                    onChange={(e) => setSettings({ ...settings, showItemSerial: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Serial / IMEI Tag</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemDiscount}
                    onChange={(e) => setSettings({ ...settings, showItemDiscount: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Item Discount</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemTotal}
                    onChange={(e) => setSettings({ ...settings, showItemTotal: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Line Total</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Summary & Total Rows</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showSubtotal}
                    onChange={(e) => setSettings({ ...settings, showSubtotal: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Subtotal</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showDiscount}
                    onChange={(e) => setSettings({ ...settings, showDiscount: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Discount</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showPreviousDue !== false}
                    onChange={(e) => setSettings({ ...settings, showPreviousDue: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Previous Due</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showTaxVat}
                    onChange={(e) => setSettings({ ...settings, showTaxVat: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">VAT / Tax</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showPaidAmount}
                    onChange={(e) => setSettings({ ...settings, showPaidAmount: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Paid Amount</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showDueAmount}
                    onChange={(e) => setSettings({ ...settings, showDueAmount: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-slate-700">Due / Change</span>
                </label>
              </div>
            </div>
          </div>

          {/* 4. Warranty Policy Settings */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-3 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShieldAlert className="text-blue-600" size={18} />
                <span>Warranty Policy & Terms</span>
              </span>
              <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={settings.showWarrantySection !== false}
                  onChange={(e) => setSettings({ ...settings, showWarrantySection: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Warranty Policy Box</span>
              </label>
            </h2>

            {settings.showWarrantySection !== false && (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Warranty Section Title</label>
                  <input
                    type="text"
                    value={settings.warrantyTitle || 'Warranty Terms & Policy'}
                    onChange={(e) => setSettings({ ...settings, warrantyTitle: e.target.value })}
                    placeholder="e.g. Warranty Terms & Policy"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-500">Warranty Policy Text / Clauses</label>
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        warrantyTerms: '1. Warranty is valid only when accompanied by this original invoice.\n2. Physical damage, liquid ingress, burn, or seal tampering voids warranty.\n3. Turnaround time for warranty claim/replacement is 3-7 business days.'
                      })}
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      Reset to Default Policy
                    </button>
                  </div>
                  <textarea
                    rows="3"
                    value={settings.warrantyTerms || ''}
                    onChange={(e) => setSettings({ ...settings, warrantyTerms: e.target.value })}
                    placeholder="Enter warranty rules (e.g. 1. Valid only with original invoice, 2. No physical damage coverage...)"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs leading-relaxed"
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* 5. Terms & Conditions & Signatures */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
              <FileText className="text-blue-600" size={18} />
              <span>Terms, Notes & Signatures</span>
            </h2>

            {/* Terms and Conditions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Terms & Conditions</label>
                <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showTerms}
                    onChange={(e) => setSettings({ ...settings, showTerms: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show Terms</span>
                </label>
              </div>
              {settings.showTerms && (
                <textarea
                  rows="3"
                  value={settings.termsAndConditions}
                  onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                  placeholder="Enter policy points line by line..."
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs leading-relaxed"
                ></textarea>
              )}
            </div>

            {/* Footer Note */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Footer Thank You Note</label>
                <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showFooterNote}
                    onChange={(e) => setSettings({ ...settings, showFooterNote: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show Footer Note</span>
                </label>
              </div>
              {settings.showFooterNote && (
                <input
                  type="text"
                  value={settings.footerNote}
                  onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })}
                  placeholder="Thank you for shopping with us!"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs"
                />
              )}
            </div>

            {/* Signature Labels */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Signatures Section</label>
                <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showSignatures}
                    onChange={(e) => setSettings({ ...settings, showSignatures: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show Signatures</span>
                </label>
              </div>
              {settings.showSignatures && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer Signature Label</label>
                    <input
                      type="text"
                      value={settings.customerSignatureLabel}
                      onChange={(e) => setSettings({ ...settings, customerSignatureLabel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Authorized Signature Label</label>
                    <input
                      type="text"
                      value={settings.authorizedSignatureLabel}
                      onChange={(e) => setSettings({ ...settings, authorizedSignatureLabel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
            >
              <Save size={18} />
              <span>{saving ? 'Saving Changes...' : 'Save All Invoice Settings'}</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT LIVE A4 PREVIEW COLUMN ================= */}
        <div className="lg:col-span-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-xs no-print">
            <div className="flex items-center space-x-2">
              <Eye size={16} className="text-blue-400 flex-shrink-0" />
              <span className="font-bold text-xs">Live A4 Preview</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-mono">
              210 × 297 mm
            </span>
          </div>

          {/* Real A4 Sheet Container */}
          <div className="bg-slate-200/70 p-2 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-300 shadow-inner overflow-x-auto">
            <div className="printable-area">
              <InvoiceA4
                company={company}
                settings={settings}
                isSample={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
