'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, PackagePlus, Search, Phone, X } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Forms
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [purchaseForm, setPurchaseForm] = useState({
    supplierName: '',
    productCode: '',
    quantity: '10',
    unitCost: '',
    note: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadSupplierData(u.storeId || 'default');
    }
  }, []);

  const loadSupplierData = async (storeId) => {
    try {
      const [supRes, prodRes, purRes] = await Promise.all([
        fetch(`/api/suppliers?storeId=${storeId}`),
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/purchases?storeId=${storeId}`)
      ]);

      const supData = await supRes.json();
      const prodData = await prodRes.json();
      const purData = await purRes.json();

      if (supData.success) {
        setSuppliers(supData.suppliers || []);
        if (supData.suppliers.length > 0) {
          setPurchaseForm(prev => ({ ...prev, supplierName: supData.suppliers[0].name }));
        }
      }
      if (prodData.success) {
        setProducts(prodData.products || []);
        if (prodData.products.length > 0) {
          setPurchaseForm(prev => ({ ...prev, productCode: prodData.products[0].code }));
        }
      }
      if (purData.success) setPurchases(purData.purchases || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', ...supplierForm })
      });
      const data = await res.json();
      if (data.success) {
        setShowSupplierModal(false);
        setSupplierForm({ name: '', phone: '', email: '', address: '' });
        loadSupplierData(u.storeId || 'default');
      }
    } catch (err) {
      alert('Error saving supplier');
    }
  };

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', ...purchaseForm })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Receive failed');
        return;
      }
      setShowPurchaseModal(false);
      alert('Stock successfully received and added to Inventory!');
      loadSupplierData(u.storeId || 'default');
    } catch (err) {
      alert('Stock receive error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Truck className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">Suppliers &amp; Purchase Entries</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">Manage wholesale vendors and record purchase stock received.</p>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <PackagePlus size={15} />
            <span>Receive Stock</span>
          </button>
          <button
            onClick={() => setShowSupplierModal(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20"
          >
            <Plus size={15} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {suppliers.map((sup) => (
          <div key={sup.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{sup.name}</h3>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">Supplier</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Phone: {sup.phone || 'N/A'}</p>
            <p className="text-[11px] text-slate-500 truncate">Address: {sup.address || 'N/A'}</p>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            No suppliers added yet. Click "Add Supplier" to register one.
          </div>
        )}
      </div>

      {/* Recent Purchase Entries Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800">Recent Purchase Stock Received History</h2>
        
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5">Product Code</th>
                <th className="px-4 py-2.5">Product Name</th>
                <th className="px-4 py-2.5">Received Qty</th>
                <th className="px-4 py-2.5 text-right">Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{p.supplierName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600 font-bold">{p.productCode}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{p.productName}</td>
                  <td className="px-4 py-2.5 font-bold text-emerald-600">+{p.quantity} Units</td>
                  <td className="px-4 py-2.5 font-bold font-mono text-right">৳{Number(p.unitCost).toLocaleString()}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No purchase stock entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {purchases.map((p) => (
            <div key={p.id} className="p-3.5 space-y-2 bg-white hover:bg-slate-50/60 transition text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{p.supplierName}</span>
                <span className="text-[10px] text-slate-400">{new Date(p.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">{p.productName}</p>
                  <p className="font-mono text-[10px] text-blue-600 font-bold">{p.productCode}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200 text-xs block">
                    +{p.quantity} Units
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-1">
                    @ ৳{Number(p.unitCost).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {purchases.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No purchase stock entries found.
            </div>
          )}
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Add New Supplier Vendor</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Supplier Company Name *</label>
                <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Phone Number</label>
                <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Address</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE PURCHASE STOCK MODAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Receive Purchase Stock Entry</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleReceiveStock} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Select Supplier</label>
                <select value={purchaseForm.supplierName} onChange={e => setPurchaseForm({...purchaseForm, supplierName: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500">
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Select Product *</label>
                <select value={purchaseForm.productCode} onChange={e => setPurchaseForm({...purchaseForm, productCode: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500">
                  {products.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Received Quantity *</label>
                  <input type="number" required min="1" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold text-emerald-600 focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Unit Purchase Cost (৳)</label>
                  <input type="number" value={purchaseForm.unitCost} onChange={e => setPurchaseForm({...purchaseForm, unitCost: e.target.value})} placeholder="Cost Price" className="w-full px-3 py-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition">Receive Stock &amp; Update Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
