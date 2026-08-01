'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Lock, Shield, KeyRound, X } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'cashier' });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadStaff(u.storeId || 'default');
    }
  }, []);

  const loadStaff = async (storeId) => {
    try {
      const res = await fetch(`/api/staff?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) setStaff(data.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', ...form })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ name: '', username: '', password: '', role: 'cashier' });
        loadStaff(u.storeId || 'default');
      }
    } catch (err) {
      alert('Error creating staff account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <UserCheck className="text-blue-600" size={24} />
            <span>Staff Account Credentials & Role Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Create login accounts for counter cashiers and store managers with role access permissions.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>Create Staff Login</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map((st) => (
          <div key={st.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">{st.name}</h3>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                st.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {st.role}
              </span>
            </div>
            <div className="text-xs text-slate-600 font-mono space-y-1 bg-slate-50 p-2.5 rounded-xl border">
              <p>Username: <span className="font-bold text-slate-900">{st.username}</span></p>
              <p>Password: <span className="font-bold text-slate-900">••••••••</span></p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Create Staff Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Staff Member Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rahim Cashier" className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Username *</label>
                  <input type="text" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="cashier1" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Password *</label>
                  <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Assigned Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold">
                  <option value="cashier">Cashier (POS Counter Only)</option>
                  <option value="manager">Manager (Inventory, Sales & Clients)</option>
                </select>
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
