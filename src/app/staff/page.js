'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Lock, Shield, KeyRound, X, Trash2, Edit2, ShoppingCart, DollarSign } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'cashier', phone: '' });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadData(u.storeId || 'default');
    }
  }, []);

  const loadData = async (storeId) => {
    try {
      setLoading(true);
      const [staffRes, vouchRes] = await Promise.all([
        fetch(`/api/staff?storeId=${storeId}`),
        fetch(`/api/vouchers?storeId=${storeId}`)
      ]);
      const staffData = await staffRes.json();
      const vouchData = await vouchRes.json();

      if (staffData.success) setStaff(staffData.staff || []);
      if (vouchData.success) setVouchers(vouchData.vouchers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditStaff(null);
    setForm({ name: '', username: '', password: '', role: 'cashier', phone: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (st) => {
    setEditStaff(st);
    setForm({
      name: st.name || '',
      username: st.username || '',
      password: '',
      role: st.role || 'cashier',
      phone: st.phone || ''
    });
    setShowModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const method = editStaff ? 'PUT' : 'POST';
      const body = editStaff
        ? { storeId: u.storeId || 'default', id: editStaff.id, ...form }
        : { storeId: u.storeId || 'default', ...form };

      const res = await fetch('/api/staff', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ name: '', username: '', password: '', role: 'cashier', phone: '' });
        loadData(u.storeId || 'default');
      } else {
        alert(data.message || 'Error saving staff account');
      }
    } catch (err) {
      alert('Error saving staff account');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff account?')) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch(`/api/staff?id=${id}&storeId=${u.storeId || 'default'}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setStaff(staff.filter(s => s.id !== id));
      }
    } catch (err) {
      alert('Delete error');
    }
  };

  const getStaffStats = (staffMember) => {
    const matched = vouchers.filter(v => 
      v.salerName === staffMember.name || 
      v.salerName === staffMember.username ||
      v.createdBy === staffMember.username
    );
    const totalSales = matched.reduce((acc, v) => acc + (Number(v.totalAmount) || 0), 0);
    return {
      orderCount: matched.length,
      totalSales
    };
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <UserCheck className="text-blue-600" size={24} />
            <span>Staff Account Credentials & Role Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage staff login accounts. Staff members will automatically act as sellers when creating POS invoices.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 text-xs"
        >
          <Plus size={18} />
          <span>Create Staff Login</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading staff members...</div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <UserCheck size={36} className="mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-base">No staff accounts created yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add cashiers and managers so they can log into POS, handle sales counters, and be recorded on invoices.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
          >
            + Create First Staff
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map((st) => {
            const stats = getStaffStats(st);
            return (
              <div key={st.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {st.name?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{st.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">@{st.username}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    st.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {st.role || 'Cashier'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Total Sales:</span>
                    <span className="font-mono font-bold text-blue-600">৳{stats.totalSales.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Invoices Created:</span>
                    <span className="font-bold text-slate-800">{stats.orderCount}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Status: <strong className="text-emerald-600">Active Seller</strong></span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(st)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Staff"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(st.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Staff"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                {editStaff ? 'Edit Staff Account' : 'Create Staff Login & Seller Account'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahim Cashier"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Username *</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="cashier1"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono font-bold text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">
                    {editStaff ? 'New Password (Optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editStaff}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={editStaff ? 'Leave empty to keep' : 'Password'}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Assigned Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-xs focus:bg-white focus:outline-none"
                >
                  <option value="cashier">Cashier (POS Counter Sales & Billing)</option>
                  <option value="manager">Manager (Inventory, Sales, & Client Dues)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="01700000000"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none"
                />
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
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition"
                >
                  {editStaff ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
