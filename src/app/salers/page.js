'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Phone, X } from 'lucide-react';

export default function SalersPage() {
  const [salers, setSalers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', role: 'Sales Representative' });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadSalers(u.storeId || 'default');
    }
  }, []);

  const loadSalers = async (storeId) => {
    try {
      const [salRes, vouchRes] = await Promise.all([
        fetch(`/api/salers?storeId=${storeId}`),
        fetch(`/api/vouchers?storeId=${storeId}`)
      ]);
      const salData = await salRes.json();
      const vouchData = await vouchRes.json();
      if (salData.success) setSalers(salData.salers || []);
      if (vouchData.success) setVouchers(vouchData.vouchers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSaler = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/salers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', ...form })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ name: '', phone: '', role: 'Sales Representative' });
        loadSalers(u.storeId || 'default');
      }
    } catch (err) {
      alert('Save error');
    }
  };

  const getSalerStats = (salerName) => {
    const salerVouchers = vouchers.filter(v => v.salerName === salerName);
    const totalSales = salerVouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
    return { count: salerVouchers.length, totalSales };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <UserCheck className="text-blue-600" size={24} />
            <span>Sales Representatives & Performance Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage store staff, counter clerks, and track sales performance.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>Add Sales Representative</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {salers.map((s) => {
          const stats = getSalerStats(s.name);
          return (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center text-sm border border-blue-100">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {s.role}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base">{s.name}</h3>
                <p className="text-xs text-slate-500 font-mono">Phone: {s.phone || 'N/A'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-slate-400 font-medium">Vouchers Issued</p>
                  <p className="font-bold text-slate-800 text-sm">{stats.count}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <p className="text-blue-600 font-medium">Total Sales</p>
                  <p className="font-bold text-blue-700 text-sm">৳{stats.totalSales.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Add Sales Representative</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSaler} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Phone Number</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Role / Designation</label>
                <input type="text" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Save Representative</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
