'use client';

import { useState, useEffect } from 'react';
import { Building2, ArrowRightLeft, Plus, MapPin, Phone, X } from 'lucide-react';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Forms
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '' });
  const [transferForm, setTransferForm] = useState({
    fromBranch: 'Main Outlet',
    toBranch: '',
    productCode: '',
    quantity: '5'
  });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadBranchData(u.storeId || 'default');
    }
  }, []);

  const loadBranchData = async (storeId) => {
    try {
      const [bRes, pRes] = await Promise.all([
        fetch(`/api/branches?storeId=${storeId}`),
        fetch(`/api/products?storeId=${storeId}`)
      ]);
      const bData = await bRes.json();
      const pData = await pRes.json();

      if (bData.success) {
        setBranches(bData.branches || []);
        setTransfers(bData.transfers || []);
        if (bData.branches.length > 1) {
          setTransferForm(prev => ({
            ...prev,
            fromBranch: bData.branches[0].name,
            toBranch: bData.branches[1].name
          }));
        }
      }
      if (pData.success) {
        setProducts(pData.products || []);
        if (pData.products.length > 0) {
          setTransferForm(prev => ({ ...prev, productCode: pData.products[0].code }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', username: u.username || 'admin', type: 'branch', ...branchForm })
      });
      const data = await res.json();
      if (data.success) {
        setShowBranchModal(false);
        setBranchForm({ name: '', code: '', address: '', phone: '' });
        loadBranchData(u.storeId || 'default');
      }
    } catch (err) {
      alert('Error adding branch');
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', username: u.username || 'admin', type: 'transfer', ...transferForm })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Transfer failed');
        return;
      }
      setShowTransferModal(false);
      alert('Inter-branch stock transfer completed!');
      loadBranchData(u.storeId || 'default');
    } catch (err) {
      alert('Stock transfer error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Building2 className="text-blue-600" size={24} />
            <span>Multi-Branch Outlets & Inter-Branch Stock Transfer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage multiple store branches, warehouses, and transfer stock between outlets.</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <ArrowRightLeft size={16} />
            <span>Transfer Stock</span>
          </button>
          <button
            onClick={() => setShowBranchModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20"
          >
            <Plus size={16} />
            <span>Add Branch Outlet</span>
          </button>
        </div>
      </div>

      {/* Branches Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">{b.name}</h3>
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{b.code}</span>
            </div>
            <p className="text-xs text-slate-500 font-mono">Phone: {b.phone || 'N/A'}</p>
            <p className="text-xs text-slate-500">Address: {b.address || 'N/A'}</p>
          </div>
        ))}
      </div>

      {/* Transfer History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800">Inter-Branch Stock Transfer Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Source Outlet</th>
                <th className="px-4 py-2.5">Target Outlet</th>
                <th className="px-4 py-2.5">Product Code</th>
                <th className="px-4 py-2.5">Product Name</th>
                <th className="px-4 py-2.5">Transferred Qty</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{t.fromBranch}</td>
                  <td className="px-4 py-2.5 font-bold text-blue-600">{t.toBranch}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-900">{t.productCode}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{t.productName}</td>
                  <td className="px-4 py-2.5 font-bold text-emerald-600">{t.quantity} Units</td>
                  <td className="px-4 py-2.5 text-xs font-bold">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD BRANCH MODAL */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Add Branch Outlet</h3>
              <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBranch} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Branch Name *</label>
                <input type="text" required value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} placeholder="e.g. Dhanmondi Outlet" className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Branch Code *</label>
                <input type="text" required value={branchForm.code} onChange={e => setBranchForm({...branchForm, code: e.target.value})} placeholder="DHN01" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono font-bold" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowBranchModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Inter-Branch Stock Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleTransferStock} className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">From Outlet</label>
                  <input type="text" value={transferForm.fromBranch} onChange={e => setTransferForm({...transferForm, fromBranch: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">To Target Outlet</label>
                  <input type="text" value={transferForm.toBranch} onChange={e => setTransferForm({...transferForm, toBranch: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Product Code *</label>
                <select value={transferForm.productCode} onChange={e => setTransferForm({...transferForm, productCode: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold">
                  {products.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Transfer Quantity *</label>
                <input type="number" required min="1" value={transferForm.quantity} onChange={e => setTransferForm({...transferForm, quantity: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-blue-600" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl">Complete Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
