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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Truck className="text-blue-600" size={24} />
            <span>Suppliers & Purchase Stock Entries</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage wholesale vendors and record purchase stock received.</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <PackagePlus size={16} />
            <span>Receive Purchase Stock</span>
          </button>
          <button
            onClick={() => setShowSupplierModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20"
          >
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map((sup) => (
          <div key={sup.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">{sup.name}</h3>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Supplier</span>
            </div>
            <p className="text-xs text-slate-500 font-mono">Phone: {sup.phone || 'N/A'}</p>
            <p className="text-xs text-slate-500">Address: {sup.address || 'N/A'}</p>
          </div>
        ))}
      </div>

      {/* Recent Purchase Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800">Recent Purchase Stock Received History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
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
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{p.supplierName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600 font-bold">{p.productCode}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{p.productName}</td>
                  <td className="px-4 py-2.5 font-bold text-emerald-600">+{p.quantity} Units</td>
                  <td className="px-4 py-2.5 font-bold text-right">৳{p.unitCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Add New Supplier Vendor</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Supplier Company Name *</label>
                <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Phone Number</label>
                <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Address</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE PURCHASE STOCK MODAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Receive Purchase Stock Entry</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleReceiveStock} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Select Supplier</label>
                <select value={purchaseForm.supplierName} onChange={e => setPurchaseForm({...purchaseForm, supplierName: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold">
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Select Product *</label>
                <select value={purchaseForm.productCode} onChange={e => setPurchaseForm({...purchaseForm, productCode: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold">
                  {products.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Received Quantity *</label>
                  <input type="number" required min="1" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-emerald-600" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Unit Purchase Cost (৳)</label>
                  <input type="number" value={purchaseForm.unitCost} onChange={e => setPurchaseForm({...purchaseForm, unitCost: e.target.value})} placeholder="Cost Price" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold" />
                </div>
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl">Receive Stock & Update Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
