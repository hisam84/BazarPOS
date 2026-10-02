'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Building2,
  DollarSign,
  Plus,
  CheckCircle2,
  Ban,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    expiringSoon: 0,
    mrr: 0
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [compRes, subRes] = await Promise.all([
        fetch('/api/superadmin/companies'),
        fetch('/api/superadmin/subscriptions')
      ]);

      const compData = await compRes.json();
      const subData = await subRes.json();

      if (compData.success) {
        setCompanies(compData.companies || []);
      }
      if (subData.success && subData.stats) {
        setStats(subData.stats);
      }
    } catch (err) {
      console.error('Error loading super admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadgeColor = (planId) => {
    switch (planId) {
      case '1year':
      case 'enterprise':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case '6months':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      case '3months':
      case 'standard':
        return 'bg-violet-50 text-violet-700 border-violet-200/80';
      case '1month':
      case 'starter':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'lifetime':
        return 'bg-teal-50 text-teal-700 border-teal-200/80';
      case 'trial':
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200/80';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 text-white shadow-xl border border-indigo-900/30">
        {/* Subtle radial ambient glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <Sparkles size={13} className="text-indigo-400" />
              <span>SaaS Platform Control Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Super Admin Management
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              Create client companies, monitor merchant profiles, and configure license access validity periods.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/superadmin/companies"
              className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 hover:shadow-indigo-600/35"
            >
              <Plus size={15} />
              <span>Create Company</span>
            </Link>
            <Link
              href="/superadmin/subscriptions"
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <Clock size={15} className="text-indigo-400" />
              <span>Subscriptions & Validity</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row - Refined Clean Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Companies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tenants</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.totalCompanies}</p>
            <span className="text-[11px] text-slate-500 font-medium">Registered stores</span>
          </div>
        </div>

        {/* Active Companies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.activeCompanies}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Operational</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active License</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.activeSubscriptions}</p>
            <span className="text-[11px] text-indigo-600 font-medium">Valid validity</span>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expiring Soon</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.expiringSoon}</p>
            <span className="text-[11px] text-amber-600 font-medium">Within 7 days</span>
          </div>
        </div>

        {/* Expired Accounts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-200 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expired</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.expiredSubscriptions}</p>
            <span className="text-[11px] text-rose-600 font-medium">Needs renewal</span>
          </div>
        </div>

        {/* Suspended */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suspended</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Ban size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.suspendedCompanies}</p>
            <span className="text-[11px] text-slate-500 font-medium">Access disabled</span>
          </div>
        </div>
      </div>

      {/* Main Section: Companies Overview & Validity Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Companies List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Merchant Companies</h2>
              <p className="text-xs text-slate-500">Live overview of registered businesses & validity</p>
            </div>
            <Link
              href="/superadmin/companies"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 transition"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading Companies...</div>
            ) : companies.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No companies registered yet.</div>
            ) : (
              <div className="space-y-3">
                {companies.slice(0, 5).map((comp) => {
                  const sub = comp.subscription || {};
                  const today = new Date().toISOString().slice(0, 10);
                  const isExpired = sub.status === 'expired' || (sub.expiryDate && sub.expiryDate < today);
                  const isSuspended = comp.status === 'suspended';

                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-xs transition bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-900 text-sm">{comp.name}</h3>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getPlanBadgeColor(
                                sub.planId
                              )}`}
                            >
                              {sub.planName || 'Standard'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                            <span>Owner: <strong className="text-slate-700 font-medium">{comp.owner || 'Admin'}</strong></span>
                            {sub.expiryDate && (
                              <span className="text-slate-400 font-mono text-[11px]">
                                • Expires: <strong className="text-slate-600 font-semibold">{sub.expiryDate}</strong>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5 self-end sm:self-center">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                            isSuspended
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : isExpired
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isSuspended ? 'Suspended' : isExpired ? 'Expired' : 'Active'}
                        </span>

                        <Link
                          href={`/superadmin/subscriptions?company=${comp.id}`}
                          className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition shadow-2xs"
                        >
                          Validity
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Validity Tiers Overview */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Clock size={16} className="text-indigo-600" />
                <span>Subscription Validity Tiers</span>
              </h3>
              <Link
                href="/superadmin/subscriptions"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition">
                <div>
                  <p className="font-bold text-slate-800">Free Trial</p>
                  <p className="text-[11px] text-slate-500">14 Days Single Branch</p>
                </div>
                <span className="font-bold text-slate-700 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">14 Days</span>
              </div>

              <div className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition">
                <div>
                  <p className="font-bold text-slate-800">1 Month Access</p>
                  <p className="text-[11px] text-slate-500">1 Outlet, 5 Staff Accounts</p>
                </div>
                <span className="font-bold text-slate-700 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">30 Days</span>
              </div>

              <div className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition">
                <div>
                  <p className="font-bold text-slate-800">3 Months Pass</p>
                  <p className="text-[11px] text-slate-500">2 Outlets, Transfers, Audit Logs</p>
                </div>
                <span className="font-bold text-slate-700 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">90 Days</span>
              </div>

              <div className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition">
                <div>
                  <p className="font-bold text-slate-800">6 Months Pass</p>
                  <p className="text-[11px] text-slate-500">3 Outlets, Full Reports, Backup</p>
                </div>
                <span className="font-bold text-slate-700 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">180 Days</span>
              </div>

              <div className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition">
                <div>
                  <p className="font-bold text-slate-800">1 Year Full Access</p>
                  <p className="text-[11px] text-slate-500">10 Outlets, Unlimited Staff, VIP</p>
                </div>
                <span className="font-bold text-indigo-700 font-mono text-[11px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">365 Days</span>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xs space-y-2.5 border border-slate-800">
            <h4 className="font-bold text-xs flex items-center space-x-2 text-indigo-300">
              <ShieldCheck size={15} />
              <span>Time-Based Licensing System</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscriptions are managed on a time-based validity model. Payments are processed externally, and you can extend access at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
