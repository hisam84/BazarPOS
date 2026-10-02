'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, DollarSign, Search, Phone, MapPin, X, Tag, Edit, CheckCircle, Mail } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState({ customerId: '', name: '', phone: '', email: '', address: '', due: 0 });

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

  const getNextCustomerId = () => {
    const numbers = clients
      .map(c => {
        const match = (c.customerId || '').match(/CUST-(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(n => n !== null && !isNaN(n));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : (1001 + clients.length);
    return `CUST-${nextNum}`;
  };

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setForm({
      customerId: getNextCustomerId(),
      name: '',
      phone: '',
      email: '',
      address: '',
      due: 0
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setForm({
      customerId: client.customerId || '',
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      due: client.due || 0
    });
    setShowModal(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};

      if (editingClient) {
        // Update existing
        const res = await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: u.storeId || 'default',
            id: editingClient.id,
            customerId: form.customerId,
            name: form.name,
            phone: form.phone,
            email: form.email,
            address: form.address,
            due: Number(form.due)
          })
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          loadClients(u.storeId || 'default');
        }
      } else {
        // Create new
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: u.storeId || 'default', ...form })
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          loadClients(u.storeId || 'default');
        }
      }
    } catch (err) {
      alert('Error saving client');
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

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.customerId && c.customerId.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="text-blue-600" size={24} />
            <span>Customer Directory & Credit Due Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer records, auto-generated Customer IDs, and credit due balances.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 text-xs"
        >
          <Plus size={16} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Customer ID (e.g. CUST-1001), name, or phone number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Customer ID</th>
                <th className="px-4 py-3.5">Customer Name</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Address</th>
                <th className="px-4 py-3.5">Current Due</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md inline-flex items-center space-x-1">
                      <Tag size={12} className="text-indigo-500" />
                      <span>{c.customerId || 'CUST-1001'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 block">{c.name}</span>
                    {c.email && (
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Mail size={10} />
                        <span>{c.email}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-700">
                    {c.phone || <span className="text-slate-400 italic">None</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {c.address || <span className="text-slate-400 italic">None</span>}
                  </td>
                  <td className="px-4 py-3 font-bold font-mono text-sm">
                    {c.due > 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                        ৳{Number(c.due).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-xs">
                        ৳0 (Clear)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {c.due > 0 && (
                        <button
                          onClick={() => { setPayModalClient(c); setPayAmount(c.due); }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-xs"
                        >
                          Collect Due
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Customer Info"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 text-xs">
                    No customers found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT CLIENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <Users size={20} className="text-blue-600" />
                <span>{editingClient ? 'Edit Customer Details' : 'Add New Customer'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-bold flex items-center justify-between">
                  <span>Customer Unique ID *</span>
                  <span className="text-[10px] text-blue-600 font-normal">Auto-Generated</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.customerId}
                  onChange={e => setForm({ ...form, customerId: e.target.value })}
                  placeholder="e.g. CUST-1001"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:border-blue-500 text-xs shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Chowdhury"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Phone Number</label>
                  <input
                    type="text"
                    placeholder="01700000000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Email Address</label>
                  <input
                    type="email"
                    placeholder="client@mail.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. House 42, Road 11, Banani, Dhaka"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Opening Due Balance (৳)</label>
                <input
                  type="number"
                  value={form.due}
                  onChange={e => setForm({ ...form, due: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-rose-600 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs"
                >
                  {editingClient ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT DUE MODAL */}
      {payModalClient && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Collect Due Payment</h3>
              <button onClick={() => setPayModalClient(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="text-slate-600 flex justify-between">
                <span>Customer ID:</span>
                <span className="font-mono font-bold text-indigo-700">{payModalClient.customerId || 'CUST-1001'}</span>
              </p>
              <p className="text-slate-600 flex justify-between">
                <span>Name:</span>
                <span className="font-bold text-slate-900">{payModalClient.name}</span>
              </p>
              <p className="text-rose-600 font-bold flex justify-between pt-1 border-t border-slate-200">
                <span>Pending Due:</span>
                <span className="font-mono">৳{Number(payModalClient.due).toLocaleString()}</span>
              </p>
            </div>

            <form onSubmit={handlePayDue} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Received Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-sm text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
              >
                Submit Payment Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

