'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Store, User, Lock, Phone, MapPin, CheckCircle, Ban, X } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    owner: '',
    phone: '',
    address: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const res = await fetch('/api/superadmin/stores');
      const data = await res.json();
      if (data.success) {
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to create store');
        return;
      }

      setShowModal(false);
      setForm({ name: '', owner: '', phone: '', address: '', username: '', password: '' });
      loadStores();
    } catch (err) {
      alert('Error creating store');
    }
  };

  const toggleStatus = async (storeId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch('/api/superadmin/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadStores();
      }
    } catch (err) {
      alert('Update error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <ShieldAlert className="text-blue-400" size={24} />
            <span>Super Admin SaaS Store Management Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Exclusively create, manage, and monitor all merchant POS store accounts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30"
        >
          <Plus size={18} />
          <span>Create New Store Account</span>
        </button>
      </div>

      {/* Stores Count Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Registered Stores</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{stores.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Active Outlets</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">
            {stores.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <p className="text-xs font-semibold text-rose-600">Suspended Outlets</p>
          <p className="text-3xl font-bold text-rose-700 mt-1">
            {stores.filter(s => s.status === 'suspended').length}
          </p>
        </div>
      </div>

      {/* Stores List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800">All Merchant Store Accounts</h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading Stores...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stores.map((st) => (
              <div
                key={st.id}
                className="p-5 border border-slate-200 rounded-2xl space-y-3 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center text-sm shadow-md">
                      <Store size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{st.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">Owner: {st.owner || 'N/A'}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                      st.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {st.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 font-mono pt-2 border-t border-slate-200">
                  <p>Username: <span className="font-bold text-slate-900">{st.username}</span></p>
                  <p>Phone: {st.phone || 'N/A'}</p>
                  <p>Address: {st.address || 'N/A'}</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => toggleStatus(st.id, st.status)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                      st.status === 'active'
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {st.status === 'active' ? <Ban size={14} /> : <CheckCircle size={14} />}
                    <span>{st.status === 'active' ? 'Suspend Store' : 'Activate Store'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE STORE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Create New Merchant Store Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Store / Business Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Uttara Grocery Store"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Owner Name</label>
                  <input
                    type="text"
                    value={form.owner}
                    onChange={e => setForm({ ...form, owner: e.target.value })}
                    placeholder="Owner Name"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="01700000000"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Admin Username *</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. store_admin"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Admin Password *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Store Address</label>
                <textarea
                  rows="2"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Store Address Location"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                ></textarea>
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Create Store Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
