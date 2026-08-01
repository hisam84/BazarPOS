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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <AlertOctagon className="text-rose-600" size={24} />
            <span>Stock Adjustment & Loss/Damage Manager</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Record inventory damage, loss, theft, and manual audit corrections.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20"
        >
          <Plus size={18} />
          <span>Record Stock Adjustment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
          <History size={18} className="text-blue-600" />
          <span>Adjustment Audit Log History</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading Adjustments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product Code</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Adjustment Type</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Previous ➔ New Qty</th>
                  <th className="px-4 py-3">Reason / Note</th>
                  <th className="px-4 py-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(a.date).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{a.productCode}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.productName}</td>
                    <td className="px-4 py-3 text-xs font-bold uppercase">
                      <span className={`px-2.5 py-0.5 rounded-full ${
                        a.type === 'addition' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{a.quantity} Units</td>
                    <td className="px-4 py-3 text-xs font-mono">{a.previousQuantity} ➔ <span className="font-bold text-slate-900">{a.newQuantity}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.reason || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{a.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUSTMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Record Stock Adjustment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleRecordAdjustment} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Select Product *</label>
                <select value={form.productCode} onChange={e => setForm({...form, productCode: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold">
                  {products.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name} (Qty: {p.quantity})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Adjustment Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold">
                  <option value="damage">Damage (ক্ষতিগ্রস্ত/নষ্ট)</option>
                  <option value="loss">Loss / Theft (হারানো/চুরি)</option>
                  <option value="addition">Audit Addition (স্টক বৃদ্ধি)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Quantity to Adjust *</label>
                <input type="number" required min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-slate-900" />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Reason / Explanation</label>
                <textarea rows="2" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="e.g. Expired package, damaged during transfer" className="w-full px-3 py-2 border rounded-xl bg-slate-50"></textarea>
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-rose-600 text-white font-semibold rounded-xl">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
