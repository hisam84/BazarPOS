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
  FileText,
  CreditCard,
  DollarSign,
  Wallet,
  CheckCircle2
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
    paymentStatus: 'paid',
    paidAmount: '',
    paymentMethod: 'bKash',
    transactionId: '',
    paymentDate: '',
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
      paymentStatus: sub.paymentStatus || 'paid',
      paidAmount: sub.paidAmount !== undefined && sub.paidAmount !== null ? String(sub.paidAmount) : '',
      paymentMethod: sub.paymentMethod || 'bKash',
      transactionId: sub.transactionId || '',
      paymentDate: sub.paymentDate || new Date().toISOString().slice(0, 10),
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
          paymentStatus: renewForm.paymentStatus,
          paidAmount: renewForm.paidAmount ? Number(renewForm.paidAmount) : 0,
          paymentMethod: renewForm.paymentMethod,
          transactionId: renewForm.transactionId,
          paymentDate: renewForm.paymentDate,
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
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case '6months':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/80';
      case '3months':
      case 'standard':
        return 'bg-violet-50 text-violet-800 border-violet-200/80';
      case '1month':
      case 'starter':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'lifetime':
        return 'bg-teal-50 text-teal-800 border-teal-200/80';
      case 'trial':
      default:
        return 'bg-sky-50 text-sky-800 border-sky-200/80';
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
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="text-indigo-600 shrink-0" size={22} />
            <span>Subscription & Validity Management</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Manage software access validity periods for each client company. All financial billing occurs externally.
          </p>
        </div>

        <button
          onClick={loadSubscriptions}
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200 w-full sm:w-auto shrink-0"
        >
          <RefreshCw size={13} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Tenants</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={15} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalCompanies}</p>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Registered businesses</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Active Validity</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle size={15} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.activeSubscriptions}</p>
          <span className="text-[10px] sm:text-[11px] text-indigo-600 font-medium">Valid store licenses</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Expiring in 7 Days</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.expiringSoon}</p>
          <span className="text-[10px] sm:text-[11px] text-amber-600 font-medium">Needs time extension</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Expired Accounts</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={15} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.expiredSubscriptions}</p>
          <span className="text-[10px] sm:text-[11px] text-rose-600 font-medium">Require renewal</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none flex-1 sm:flex-none"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none flex-1 sm:flex-none"
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
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                <th className="py-3.5 px-4 sm:px-6">Company &amp; Owner</th>
                <th className="py-3.5 px-3 sm:px-4">Validity Tier</th>
                <th className="py-3.5 px-3 sm:px-4">Start Date</th>
                <th className="py-3.5 px-3 sm:px-4">Expiry Date</th>
                <th className="py-3.5 px-3 sm:px-4">Time Remaining</th>
                <th className="py-3.5 px-3 sm:px-4">Status</th>
                <th className="py-3.5 px-3 sm:px-4">Payment Info</th>
                <th className="py-3.5 px-3 sm:px-4">External Notes</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Loading Subscriptions...
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
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
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.companyName}</p>
                            <p className="text-slate-500 text-[10px] sm:text-[11px] whitespace-nowrap">
                              {item.owner} {item.phone && `• ${item.phone}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold text-[9px] sm:text-[10px] uppercase border ${getPlanBadgeColor(
                            sub.planId
                          )}`}
                        >
                          {sub.planName || '1 Year'}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-3 sm:px-4 font-mono text-slate-600 whitespace-nowrap">
                        {sub.startDate || 'N/A'}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-3 sm:px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {sub.expiryDate || 'N/A'}
                      </td>

                      {/* Remaining Days */}
                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${remaining.badgeClass}`}>
                          {remaining.text}
                        </span>
                      </td>

                      {/* Sub Status */}
                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
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

                      {/* Payment Info */}
                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        {sub.paidAmount || sub.paymentMethod || sub.paymentStatus ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1">
                              <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
                                sub.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.paymentStatus === 'due'
                                  ? 'bg-rose-100 text-rose-800'
                                  : sub.paymentStatus === 'free'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {sub.paymentStatus || 'paid'}
                              </span>
                              {Number(sub.paidAmount) > 0 && (
                                <span className="font-mono font-bold text-slate-900 text-[11px]">
                                  ৳{Number(sub.paidAmount).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {(sub.paymentMethod || sub.transactionId) && (
                              <p className="text-[10px] text-slate-500 font-mono">
                                {sub.paymentMethod} {sub.transactionId && `· ${sub.transactionId}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* External Notes */}
                      <td className="py-3.5 px-3 sm:px-4 text-slate-500 text-[11px] max-w-[140px] truncate">
                        {sub.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => openRenewModal(item)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-xs text-xs"
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
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-indigo-400" size={18} />
          <h3 className="font-bold text-sm sm:text-base">Subscription Validity Tiers & Outlets Limits</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-1">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-2"
            >
              <div>
                <h4 className="font-bold text-white text-xs">{p.name}</h4>
                <p className="text-[11px] font-mono text-indigo-400 font-semibold">{p.durationDays} Days</p>
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
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Extend License Validity Time</h3>
                <p className="text-xs text-slate-500">{selectedSub?.companyName}</p>
              </div>
              <button
                onClick={() => setShowRenewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="p-5 overflow-y-auto space-y-4 text-xs">
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

              {/* Payment & Billing Details */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5 text-purple-900">
                  <CreditCard size={15} className="text-purple-600" />
                  <span>Payment &amp; Billing Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Status</label>
                    <select
                      value={renewForm.paymentStatus}
                      onChange={(e) => setRenewForm({ ...renewForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="paid">Paid in Full</option>
                      <option value="partial">Partially Paid</option>
                      <option value="due">Payment Due / Pending</option>
                      <option value="free">Complimentary / Free Trial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paid Amount (৳)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={renewForm.paidAmount}
                        onChange={(e) => setRenewForm({ ...renewForm, paidAmount: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Method</label>
                    <select
                      value={renewForm.paymentMethod}
                      onChange={(e) => setRenewForm({ ...renewForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Card / POS">Card / POS</option>
                      <option value="Other">Other Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Transaction ID / Slip #</label>
                    <input
                      type="text"
                      placeholder="e.g. 9K28JSL30X"
                      value={renewForm.transactionId}
                      onChange={(e) => setRenewForm({ ...renewForm, transactionId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={renewForm.paymentDate}
                      onChange={(e) => setRenewForm({ ...renewForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
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
                <label className="block text-slate-600 font-semibold mb-1">External Remarks / Payment Note</label>
                <input
                  type="text"
                  placeholder="e.g. Verified via bKash Merchant account, Order #932"
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
                  Save Validity &amp; Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
