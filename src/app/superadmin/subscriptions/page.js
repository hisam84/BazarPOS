'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  X,
  Layers,
  Sparkles,
  CalendarDays,
  FileText
} from 'lucide-react';

export default function SuperAdminSubscriptionsPage() {
  const searchParams = useSearchParams();
  const filterCompanyId = searchParams.get('company');

  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    expiringSoon: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const [renewForm, setRenewForm] = useState({
    companyId: '',
    planId: '1year',
    planName: '1 Year Full Access',
    startDate: '',
    expiryDate: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/subscriptions');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setPlans(data.plans || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRenewModal = (item) => {
    setSelectedSub(item);
    const sub = item.subscription || {};
    setRenewForm({
      companyId: item.companyId,
      planId: sub.planId || '1year',
      planName: sub.planName || '1 Year Full Access',
      startDate: sub.startDate || new Date().toISOString().slice(0, 10),
      expiryDate: sub.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      status: sub.status || 'active',
      notes: sub.notes || ''
    });
    setShowRenewModal(true);
  };

  const handlePlanSelection = (planId) => {
    const selected = plans.find((p) => p.id === planId);
    if (selected) {
      const days = selected.durationDays || 30;
      const newExpiry = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

      setRenewForm({
        ...renewForm,
        planId: selected.id,
        planName: selected.name,
        expiryDate: newExpiry
      });
    }
  };

  const handleQuickAddDays = (days) => {
    const currentExp = renewForm.expiryDate ? new Date(renewForm.expiryDate) : new Date();
    const base = currentExp < new Date() ? new Date() : currentExp;
    const newDate = new Date(base.getTime() + days * 86400000).toISOString().slice(0, 10);
    setRenewForm({ ...renewForm, expiryDate: newDate, status: 'active' });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: renewForm.companyId,
          planId: renewForm.planId,
          planName: renewForm.planName,
          startDate: renewForm.startDate,
          expiryDate: renewForm.expiryDate,
          status: renewForm.status,
          notes: renewForm.notes
        })
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update validity');
        return;
      }

      setShowRenewModal(false);
      loadSubscriptions();
    } catch (err) {
      alert('Error updating subscription validity');
    }
  };

  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return { days: 0, text: 'No date', badgeClass: 'bg-slate-100 text-slate-700' };
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return { days, text: `${Math.abs(days)}d Expired`, badgeClass: 'bg-rose-100 text-rose-700 font-bold' };
    } else if (days <= 7) {
      return { days, text: `${days}d Remaining`, badgeClass: 'bg-amber-100 text-amber-700 font-bold animate-pulse' };
    } else {
      return { days, text: `${days}d Remaining`, badgeClass: 'bg-emerald-100 text-emerald-700 font-semibold' };
    }
  };

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

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((item) => {
    if (filterCompanyId && item.companyId !== filterCompanyId) return false;

    const sub = item.subscription || {};
    const matchesSearch =
      (item.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.owner || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = planFilter === 'all' ? true : sub.planId === planFilter;
    const matchesStatus = statusFilter === 'all' ? true : sub.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="text-purple-600" size={24} />
            <span>Subscription & Validity Management (সাবস্ক্রিপশন মেয়াদ পরিচালনা)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ম্যানেজ করুন প্রতিটি ক্লায়েন্ট কোম্পানির সফটওয়্যার এক্সেস মেয়াদ (Validity Time)। আর্থিক লেনদেন সম্পূর্ণ বাইরে/এক্সটার্নাল ভাবে হবে।
          </p>
        </div>

        <button
          onClick={loadSubscriptions}
          className="inline-flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Tenants</span>
            <Building2 size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalCompanies}</p>
          <span className="text-[10px] text-slate-500">Registered businesses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Validity</span>
            <CheckCircle size={18} />
          </div>
          <p className="text-2xl font-black text-purple-900">{stats.activeSubscriptions}</p>
          <span className="text-[10px] text-purple-600/80">Valid store licenses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expiring in 7 Days</span>
            <Clock size={18} />
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.expiringSoon}</p>
          <span className="text-[10px] text-amber-600/80">Needs time extension</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expired Accounts</span>
            <AlertTriangle size={18} />
          </div>
          <p className="text-2xl font-black text-rose-600">{stats.expiredSubscriptions}</p>
          <span className="text-[10px] text-rose-500/80">Require license renewal</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search company by name, owner, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="trial">Free Trial (14d)</option>
            <option value="1month">1 Month (30d)</option>
            <option value="3months">3 Months (90d)</option>
            <option value="6months">6 Months (180d)</option>
            <option value="1year">1 Year (365d)</option>
            <option value="lifetime">Lifetime (10y)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>

          {filterCompanyId && (
            <button
              onClick={() => (window.location.href = '/superadmin/subscriptions')}
              className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition flex items-center space-x-1"
            >
              <X size={14} />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Company & Owner</th>
                <th className="py-4 px-4">Validity Tier</th>
                <th className="py-4 px-4">Start Date</th>
                <th className="py-4 px-4">Expiry Date</th>
                <th className="py-4 px-4">Time Remaining</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">External Notes</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading Subscriptions...
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((item) => {
                  const sub = item.subscription || {};
                  const remaining = calculateDaysRemaining(sub.expiryDate);

                  return (
                    <tr key={item.companyId} className="hover:bg-slate-50/70 transition">
                      {/* Company Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{item.companyName}</p>
                            <p className="text-slate-500 text-[11px]">
                              {item.owner} {item.phone && `• ${item.phone}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${getPlanBadgeColor(
                            sub.planId
                          )}`}
                        >
                          {sub.planName || '1 Year'}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-4 px-4 font-mono text-slate-600">
                        {sub.startDate || 'N/A'}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {sub.expiryDate || 'N/A'}
                      </td>

                      {/* Remaining Days */}
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${remaining.badgeClass}`}>
                          {remaining.text}
                        </span>
                      </td>

                      {/* Sub Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {sub.status || 'active'}
                        </span>
                      </td>

                      {/* External Notes */}
                      <td className="py-4 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {sub.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openRenewModal(item)}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-xs text-xs"
                        >
                          Extend / Set Date
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Plans Guide */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-purple-400" size={20} />
          <h3 className="font-bold text-base">Subscription Validity Tiers & Outlets Limits</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-2"
            >
              <div>
                <h4 className="font-bold text-white text-xs">{p.name}</h4>
                <p className="text-[11px] font-mono text-purple-400 font-semibold">{p.durationDays} Days</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Outlets: <strong>{p.maxBranches}</strong> | Staff: <strong>{p.maxStaff}</strong>
                </p>
                <ul className="mt-2 space-y-1 text-[10px] text-slate-300">
                  {p.features?.slice(0, 2).map((f, i) => (
                    <li key={i} className="flex items-center space-x-1">
                      <span className="text-emerald-400">✓</span>
                      <span className="line-clamp-1">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= RENEW / EXTEND VALIDITY MODAL ================= */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Extend License Validity Time</h3>
                <p className="text-xs text-slate-500">{selectedSub?.companyName}</p>
              </div>
              <button
                onClick={() => setShowRenewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4 text-xs">
              {/* Plan Picker */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Select Validity Tier</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlanSelection(p.id)}
                      className={`p-2.5 rounded-2xl border text-left transition ${
                        renewForm.planId === p.id
                          ? 'border-purple-600 bg-purple-50/60 font-bold text-purple-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-xs block">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {p.durationDays} Days
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Date & Quick Add Buttons */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block text-slate-700 font-bold flex items-center justify-between">
                  <span>Subscription Expiry Date *</span>
                  <span className="text-purple-600 font-mono text-[11px]">
                    {calculateDaysRemaining(renewForm.expiryDate).text}
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={renewForm.expiryDate}
                  onChange={(e) => setRenewForm({ ...renewForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Quick Extend:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDays(30)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 rounded-lg text-[10px] font-bold transition shadow-2xs"
                  >
                    +30 Days (1 Mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDays(90)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 rounded-lg text-[10px] font-bold transition shadow-2xs"
                  >
                    +3 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDays(180)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 rounded-lg text-[10px] font-bold transition shadow-2xs"
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDays(365)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 rounded-lg text-[10px] font-bold transition shadow-2xs"
                  >
                    +1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDays(3650)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-400 text-purple-700 rounded-lg text-[10px] font-bold transition shadow-2xs"
                  >
                    +10 Years
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account License Status</label>
                <select
                  value={renewForm.status}
                  onChange={(e) => setRenewForm({ ...renewForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="active">Active (Access Granted)</option>
                  <option value="expired">Expired (Requires Renewal)</option>
                  <option value="suspended">Suspended (Blocked)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">External Payment Reference / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. bKash / Cash payment verified offline, Reference #39281"
                  value={renewForm.notes}
                  onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition"
                >
                  Save Validity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
