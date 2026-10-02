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
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Building2 className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">Multi-Branch &amp; Stock Transfer</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">Manage multiple store branches, warehouses, and transfer stock between outlets.</p>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <ArrowRightLeft size={15} />
            <span>Transfer Stock</span>
          </button>
          <button
            onClick={() => setShowBranchModal(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20"
          >
            <Plus size={15} />
            <span>Add Outlet</span>
          </button>
        </div>
      </div>

      {/* Branches Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{b.name}</h3>
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">{b.code}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Phone: {b.phone || 'N/A'}</p>
            <p className="text-[11px] text-slate-500 truncate">Address: {b.address || 'N/A'}</p>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            No branch outlets found. Click "Add Outlet" to create one.
          </div>
        )}
      </div>

      {/* Transfer History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800">Inter-Branch Stock Transfer Log</h2>
        
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Source Outlet</th>
                <th className="px-4 py-2.5">Target Outlet</th>
                <th className="px-4 py-2.5">Product Code</th>
                <th className="px-4 py-2.5">Product Name</th>
                <th className="px-4 py-2.5">Transferred Qty</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{t.fromBranch}</td>
                  <td className="px-4 py-2.5 font-bold text-blue-600">{t.toBranch}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900">{t.productCode}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{t.productName}</td>
                  <td className="px-4 py-2.5 font-bold text-emerald-600">{t.quantity} Units</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{t.status}</span>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No inter-branch transfers logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {transfers.map((t) => (
            <div key={t.id} className="p-3.5 space-y-2 bg-white hover:bg-slate-50/60 transition text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{t.status}</span>
              </div>

              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                <span>{t.fromBranch}</span>
                <ArrowRightLeft size={12} className="text-slate-400 flex-shrink-0" />
                <span className="text-blue-600">{t.toBranch}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">{t.productName}</p>
                  <p className="font-mono text-[10px] text-slate-400">{t.productCode}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs">
                    {t.quantity} Units
                  </span>
                </div>
              </div>
            </div>
          ))}
          {transfers.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No inter-branch transfers logged yet.
            </div>
          )}
        </div>
      </div>

      {/* ADD BRANCH MODAL */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Add Branch Outlet</h3>
              <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBranch} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Branch Name *</label>
                <input type="text" required value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} placeholder="e.g. Dhanmondi Outlet" className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Branch Code *</label>
                <input type="text" required value={branchForm.code} onChange={e => setBranchForm({...branchForm, code: e.target.value})} placeholder="DHN01" className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-mono font-bold focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowBranchModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Inter-Branch Stock Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleTransferStock} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">From Outlet</label>
                  <input type="text" value={transferForm.fromBranch} onChange={e => setTransferForm({...transferForm, fromBranch: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">To Target Outlet</label>
                  <input type="text" value={transferForm.toBranch} onChange={e => setTransferForm({...transferForm, toBranch: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Product Code *</label>
                <select value={transferForm.productCode} onChange={e => setTransferForm({...transferForm, productCode: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500">
                  {products.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Transfer Quantity *</label>
                <input type="number" required min="1" value={transferForm.quantity} onChange={e => setTransferForm({...transferForm, quantity: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold text-blue-600 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition">Complete Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
