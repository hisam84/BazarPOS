'use client';

import { useState, useEffect } from 'react';
import { Barcode, Printer, Copy, RefreshCw } from 'lucide-react';

export default function BarcodePage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [generatedLabels, setGeneratedLabels] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadProducts(u.storeId || 'default');
    }
  }, []);

  const loadProducts = async (storeId) => {
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    const prod = products.find(p => p.code === selectedProduct);
    if (!prod) return;

    const baseBarcode = prod.barcode || (prod.code.toUpperCase().slice(0, 4).padEnd(4, '0') + Date.now().toString().slice(-4) + '0000');
    const labels = [];

    for (let i = 1; i <= quantity; i++) {
      labels.push({
        id: i,
        code: prod.code,
        name: prod.name,
        price: prod.sellingPrice,
        barcode: baseBarcode
      });
    }

    setGeneratedLabels(labels);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Barcode className="text-blue-600" size={24} />
            <span>Barcode Generator & Sticker Label Printer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Generate and print batch barcode labels for retail products.</p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">Select Product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code} - {p.name} (৳{p.sellingPrice})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Label Print Quantity</label>
            <input
              type="number"
              min="1"
              max="500"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Generate Series</span>
            </button>
            {generatedLabels.length > 0 && (
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
              >
                <Printer size={16} />
                <span>Print Labels</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Generated Barcode Labels Preview Grid */}
      {generatedLabels.length > 0 && (
        <div className="printable-area bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {generatedLabels.map((lbl, idx) => (
              <div
                key={idx}
                className="border border-slate-300 p-2.5 rounded-lg text-center font-mono text-[10px] bg-slate-50 flex flex-col items-center justify-center shadow-xs"
              >
                <p className="font-bold text-slate-900 line-clamp-1">{lbl.name}</p>
                <div className="my-1 py-1 px-3 bg-slate-900 text-white font-mono font-bold tracking-wider rounded text-[11px]">
                  ||||||||||||||||||
                </div>
                <p className="text-slate-600 font-bold">{lbl.barcode}</p>
                <p className="font-bold text-blue-600 mt-0.5">৳{lbl.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
