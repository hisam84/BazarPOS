'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, DollarSign, Search, Phone, MapPin, X } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', due: 0 });

  // Pay Due Modal
  const [payModalClient, setPayModalClient] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadClients(u.storeId || 'default');
    }
  }, []);

  const loadClients = async (storeId) => {
    try {
      const res = await fetch(`/api/clients?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) setClients(data.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', ...form })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ name: '', phone: '', email: '', address: '', due: 0 });
        loadClients(u.storeId || 'default');
      }
    } catch (err) {
      alert('Save error');
    }
  };

  const handlePayDue = async (e) => {
    e.preventDefault();
    if (!payModalClient || !payAmount || Number(payAmount) <= 0) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          id: payModalClient.id,
          payAmount: Number(payAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setPayModalClient(null);
        setPayAmount('');
        loadClients(u.storeId || 'default');
      }
    } catch (err) {
      alert('Payment save error');
    }
  };

  const filteredClients = clients.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="text-blue-600" size={24} />
            <span>Customer Directory & Credit Due Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage customer records and collect credit due balances.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or phone number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Current Due Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">{c.phone || 'N/A'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.address || 'N/A'}</td>
                  <td className="px-4 py-3 font-bold text-rose-600">৳{c.due || 0}</td>
                  <td className="px-4 py-3 text-right">
                    {c.due > 0 && (
                      <button
                        onClick={() => { setPayModalClient(c); setPayAmount(c.due); }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Collect Due Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CLIENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Add New Customer Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Customer Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Phone Number</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Address</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Opening Due Balance (৳)</label>
                <input type="number" value={form.due} onChange={e => setForm({...form, due: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT DUE MODAL */}
      {payModalClient && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Collect Due Payment</h3>
              <button onClick={() => setPayModalClient(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <p className="text-xs text-slate-600">Customer: <span className="font-bold text-slate-900">{payModalClient.name}</span></p>
            <p className="text-xs text-rose-600 font-bold">Total Pending Due: ৳{payModalClient.due}</p>

            <form onSubmit={handlePayDue} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Collected Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-sm text-emerald-600"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">
                Submit Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
