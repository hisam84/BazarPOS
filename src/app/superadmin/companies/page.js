'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  Ban,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Lock,
  X,
  CreditCard,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Form State for Create
  const [createForm, setCreateForm] = useState({
    name: '',
    owner: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    password: '',
    planId: '1month',
    customDurationDays: '',
    notes: ''
  });

  // Form State for Edit
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    owner: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          customDurationDays: createForm.customDurationDays ? Number(createForm.customDurationDays) : undefined
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to create company');
        return;
      }

      setShowCreateModal(false);
      setCreateForm({
        name: '',
        owner: '',
        phone: '',
        email: '',
        address: '',
        username: '',
        password: '',
        planId: '1month',
        customDurationDays: '',
        notes: ''
      });
      loadCompanies();
    } catch (err) {
      alert('Network error while creating company');
    }
  };

  const openEditModal = (comp) => {
    setSelectedCompany(comp);
    setEditForm({
      id: comp.id,
      name: comp.name || '',
      owner: comp.owner || '',
      phone: comp.phone || '',
      email: comp.email || '',
      address: comp.address || '',
      username: comp.username || '',
      password: '' // empty means keep existing
    });
    setShowEditModal(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: editForm.id,
        name: editForm.name,
        owner: editForm.owner,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        username: editForm.username
      };
      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }

      const res = await fetch('/api/superadmin/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update company');
        return;
      }

      setShowEditModal(false);
      loadCompanies();
    } catch (err) {
      alert('Error updating company');
    }
  };

  const toggleStatus = async (companyId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch('/api/superadmin/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: companyId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadCompanies();
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (companyId === 'default') {
      alert('Default main company cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete company "${companyName}"? This will remove all its products, staff and sales records.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/superadmin/companies?id=${companyId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        loadCompanies();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      alert('Network error while deleting');
    }
  };

  // Filtered List
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.owner || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.username || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getPlanBadgeColor = (planId) => {
    switch (planId) {
      case '1year':
      case 'enterprise':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case '6months':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case '3months':
      case 'standard':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case '1month':
      case 'starter':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'lifetime':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'trial':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const calculateDaysLeft = (expiryDate) => {
    if (!expiryDate) return '';
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d expired`;
    return `${days}d left`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Building2 className="text-purple-600" size={24} />
            <span>SaaS Company Management (কম্পানি ম্যানেজমেন্ট)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, configure, monitor, and manage all merchant POS company accounts & validity.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-md shadow-purple-600/30 text-xs"
        >
          <Plus size={16} />
          <span>+ Create New Company</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search company by name, owner, phone, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
          <span className="text-xs font-bold text-slate-500 px-2">
            Total: {filteredCompanies.length}
          </span>
        </div>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Loading Companies...
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          No companies found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((comp) => {
            const sub = comp.subscription || {};
            const daysLeft = calculateDaysLeft(sub.expiryDate);
            return (
              <div
                key={comp.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 relative"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 shadow-inner">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base line-clamp-1">{comp.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center space-x-1">
                          <User size={12} />
                          <span>{comp.owner || 'Owner'}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border ${
                        comp.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>

                  {/* Plan & Subscription Validity Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Validity:</span>
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getPlanBadgeColor(
                          sub.planId
                        )}`}
                      >
                        {sub.planName || '1 Year'}
                      </span>
                      {sub.expiryDate && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {sub.expiryDate} {daysLeft && `(${daysLeft})`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="flex items-center space-x-2 text-slate-800">
                      <KeyRound size={13} className="text-purple-600 shrink-0" />
                      <span>Username: <strong>{comp.username}</strong></span>
                    </p>
                    {comp.phone && (
                      <p className="flex items-center space-x-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{comp.phone}</span>
                      </p>
                    )}
                    {comp.email && (
                      <p className="flex items-center space-x-2">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{comp.email}</span>
                      </p>
                    )}
                    {comp.address && (
                      <p className="flex items-center space-x-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{comp.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(comp)}
                      className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Edit Company Details"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleStatus(comp.id, comp.status)}
                      className={`p-2 rounded-lg transition ${
                        comp.status === 'active'
                          ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={comp.status === 'active' ? 'Suspend Company' : 'Activate Company'}
                    >
                      {comp.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                    {comp.id !== 'default' && (
                      <button
                        onClick={() => handleDeleteCompany(comp.id, comp.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Company"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/superadmin/subscriptions?company=${comp.id}`}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    <CreditCard size={13} />
                    <span>Validity & Plans</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CREATE COMPANY MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="text-purple-600" size={20} />
                <h3 className="font-bold text-slate-800 text-base">Create New Company Account</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              {/* Business Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Acme Retailers Ltd."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Owner and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    value={createForm.owner}
                    onChange={(e) => setCreateForm({ ...createForm, owner: e.target.value })}
                    placeholder="Owner Name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="01700000000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {/* Email and Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="owner@company.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Address / Location</label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Dhaka, Bangladesh"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              {/* Initial Credentials */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3">
                <p className="font-bold text-purple-900 flex items-center space-x-1.5">
                  <KeyRound size={14} />
                  <span>Store Admin Login Credentials</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      placeholder="e.g. acme_admin"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan Selection */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Clock size={14} className="text-purple-600" />
                  <span>Assign Subscription Validity / Duration</span>
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'trial', name: 'Free Trial', duration: '14 Days' },
                    { id: '1month', name: '1 Month', duration: '30 Days' },
                    { id: '3months', name: '3 Months', duration: '90 Days' },
                    { id: '6months', name: '6 Months', duration: '180 Days' },
                    { id: '1year', name: '1 Year Full', duration: '365 Days' },
                    { id: 'lifetime', name: 'Lifetime', duration: '10 Years' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setCreateForm({ ...createForm, planId: p.id, customDurationDays: '' });
                      }}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        createForm.planId === p.id && !createForm.customDurationDays
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-semibold">{p.name}</p>
                      <p className="text-[10px] opacity-80 mt-0.5">{p.duration}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Custom Validity (Days)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45 or 60 days"
                      value={createForm.customDurationDays}
                      onChange={(e) => setCreateForm({ ...createForm, customDurationDays: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">External Payment / Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Cash / Bank paid offline"
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT COMPANY MODAL ================= */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Edit Company Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editForm.owner}
                    onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-700">Admin Account Credentials</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">New Password (optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md shadow-purple-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
