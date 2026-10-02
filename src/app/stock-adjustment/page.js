'use client';

import { useState, useEffect } from 'react';
import { AlertOctagon, Plus, Package, History, ArrowDown, ArrowUp, X } from 'lucide-react';

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    productCode: '',
    type: 'damage',
    quantity: '1',
    reason: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadAdjustmentData(u.storeId || 'default');
    }
  }, []);

  const loadAdjustmentData = async (storeId) => {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/stock-adjustment?storeId=${storeId}`)
      ]);
      const pData = await pRes.json();
      const aData = await aRes.json();

      if (pData.success) {
        setProducts(pData.products || []);
        if (pData.products.length > 0) {
          setForm(prev => ({ ...prev, productCode: pData.products[0].code }));
        }
      }
      if (aData.success) setAdjustments(aData.stockAdjustments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAdjustment = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/stock-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', username: u.username || 'admin', ...form })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Adjustment failed');
        return;
      }
      setShowModal(false);
      setForm({ productCode: products[0]?.code || '', type: 'damage', quantity: '1', reason: '' });
      loadAdjustmentData(u.storeId || 'default');
    } catch (err) {
      alert('Adjustment error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <AlertOctagon className="text-rose-600 flex-shrink-0" size={22} />
            <span className="truncate">Stock Adjustment Manager</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Record inventory damage, loss, theft, and manual audit corrections.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20 text-xs active:scale-95"
        >
          <Plus size={16} />
          <span>Record Adjustment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-2">
            <History size={16} className="text-blue-600 flex-shrink-0" />
            <span>Adjustment Audit Log History ({adjustments.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">Loading Adjustments...</div>
        ) : adjustments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No stock adjustments recorded yet.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Product Code</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Adjustment Type</th>
                    <th className="px-4 py-3 text-center">Quantity</th>
                    <th className="px-4 py-3">Previous ➔ New Qty</th>
                    <th className="px-4 py-3">Reason / Note</th>
                    <th className="px-4 py-3">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adjustments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-500">{new Date(a.date).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{a.productCode}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{a.productName}</td>
                      <td className="px-4 py-3 font-bold uppercase text-[10px]">
                        <span className={`px-2 py-0.5 rounded-md ${
                          a.type === 'addition' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {a.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-center">{a.quantity}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{a.previousQuantity} ➔ <span className="font-bold text-slate-900">{a.newQuantity}</span></td>
                      <td className="px-4 py-3 text-slate-600">{a.reason || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{a.performedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="block md:hidden divide-y divide-slate-100 font-sans">
              {adjustments.map((a) => (
                <div key={a.id} className="p-3 hover:bg-slate-50 transition space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-blue-600 text-[11px] block">{a.productCode}</span>
                      <p className="font-bold text-slate-900 leading-tight">{a.productName}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase shrink-0 ${
                      a.type === 'addition' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {a.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Adjusted Qty:</span>
                      <span className="font-bold text-slate-900">{a.quantity} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Stock Shift:</span>
                      <span className="font-mono text-slate-700 font-semibold">{a.previousQuantity} ➔ {a.newQuantity}</span>
                    </div>
                  </div>

                  {a.reason && (
                    <p className="text-[11px] text-slate-500 italic">"{a.reason}"</p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-dashed border-slate-100">
                    <span>By: {a.performedBy}</span>
                    <span>{new Date(a.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ADJUSTMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Record Stock Adjustment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleRecordAdjustment} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Select Product *</label>
                <select value={form.productCode} onChange={e => setForm({...form, productCode: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500">
                  {products.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name} (Qty: {p.quantity})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Adjustment Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500">
                  <option value="damage">Damage / Expired</option>
                  <option value="loss">Loss / Theft</option>
                  <option value="addition">Audit Addition (Stock Increase)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Quantity to Adjust *</label>
                <input type="number" required min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Reason / Explanation</label>
                <textarea rows="2" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="e.g. Expired package, damaged during transfer" className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"></textarea>
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-md transition">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
