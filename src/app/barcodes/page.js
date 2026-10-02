'use client';

import { useState, useEffect } from 'react';
import { Barcode, Printer, Copy, RefreshCw, Layers, CheckCircle, Tag } from 'lucide-react';
import BarcodeSvg from '@/components/BarcodeSvg';

export default function BarcodePage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [customBarcode, setCustomBarcode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [labelSize, setLabelSize] = useState('medium'); // small, medium, large
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [generatedLabels, setGeneratedLabels] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadProducts(u.storeId || 'default');
    } else {
      loadProducts('default');
    }
  }, []);

  const loadProducts = async (storeId) => {
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products || []);
        if (data.products.length > 0) {
          const p = data.products[0];
          setSelectedProductCode(p.code);
          setCustomBarcode(p.barcode || p.code);
          setCustomName(p.name);
          setCustomPrice(p.sellingPrice);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSelect = (code) => {
    setSelectedProductCode(code);
    const prod = products.find(p => p.code === code);
    if (prod) {
      setCustomBarcode(prod.barcode || prod.code);
      setCustomName(prod.name);
      setCustomPrice(prod.sellingPrice);
    }
  };

  const handleGenerate = (e) => {
    if (e) e.preventDefault();
    if (!customBarcode && !selectedProductCode) {
      alert('Please select a product or enter a barcode string');
      return;
    }

    const labels = [];
    const count = Math.min(Math.max(1, quantity), 200);

    for (let i = 1; i <= count; i++) {
      labels.push({
        id: i,
        name: customName || 'Retail Product',
        price: customPrice || '0',
        barcode: customBarcode || '000000000000'
      });
    }

    setGeneratedLabels(labels);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Barcode className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">Barcode Generator &amp; Label Printer</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
            Generate standard scannable Code 128 barcode sticker labels for retail inventory products and shelf tags.
          </p>
        </div>

        {generatedLabels.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-blue-500/20 flex-shrink-0"
          >
            <Printer size={16} />
            <span>Print {generatedLabels.length} Labels</span>
          </button>
        )}
      </div>

      {/* Generator Configuration Form */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sm:space-y-5 no-print">
        <form onSubmit={handleGenerate} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold text-xs">Select Product</label>
              <select
                value={selectedProductCode}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} - {p.name} (৳{p.sellingPrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold text-xs">Barcode Value / Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 6942349736612"
                value={customBarcode}
                onChange={(e) => setCustomBarcode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold text-xs">Label Print Quantity</label>
              <input
                type="number"
                min="1"
                max="200"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 mb-1 font-bold text-xs">Product Title on Label</label>
              <input
                type="text"
                placeholder="Product name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold text-xs">Price on Label (৳)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center space-x-4 pt-2 sm:pt-6">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Store Name</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Show Price</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <RefreshCw size={14} />
              <span>Generate Barcode Labels</span>
            </button>

            {generatedLabels.length > 0 && (
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-blue-500/20"
              >
                <Printer size={14} />
                <span>Print Sticker Sheet</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Generated Barcode Labels Preview Grid */}
      {generatedLabels.length > 0 ? (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3 no-print">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Tag className="text-blue-600 flex-shrink-0" size={18} />
              <span>Ready-to-Print Stickers ({generatedLabels.length} items)</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
              Format: Code 128 (Scannable)
            </span>
          </div>

          <div className="printable-area bg-white p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {generatedLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="barcode-sticker-card border border-slate-300 rounded-xl p-3 bg-white text-center flex flex-col items-center justify-between shadow-xs hover:border-blue-400 transition"
                  style={{ minHeight: '120px', breakInside: 'avoid' }}
                >
                  {showStoreName && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate w-full mb-0.5">
                      {user?.storeName || 'BazarPOS'}
                    </p>
                  )}

                  <p className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-1 w-full">
                    {lbl.name}
                  </p>

                  {/* Real Code 128 Scannable Vector Barcode */}
                  <div className="w-full my-1.5 px-1 py-1 bg-white rounded flex items-center justify-center">
                    <BarcodeSvg
                      value={lbl.barcode}
                      height={34}
                      showText={false}
                      className="w-full"
                    />
                  </div>

                  <p className="font-mono text-[10px] font-bold text-slate-800 tracking-wider">
                    {lbl.barcode}
                  </p>

                  {showPrice && (
                    <p className="font-bold text-blue-600 text-xs mt-1 font-mono">
                      ৳{Number(lbl.price).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3 no-print">
          <Barcode size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-base">No labels generated yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select a product and quantity above, then click "Generate Barcode Labels" to preview and print scannable barcode stickers.
          </p>
        </div>
      )}
    </div>
  );
}
