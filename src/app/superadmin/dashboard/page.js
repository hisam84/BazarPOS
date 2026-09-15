'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Building2,
  DollarSign,
  Plus,
  CheckCircle,
  Ban,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Layers,
  Sparkles
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-7 rounded-3xl shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
              <Sparkles size={14} />
              <span>SaaS Platform Owner Console</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Super Admin Management Hub</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              সুপার এডমিন প্যানেল থেকে শুধুমাত্র ক্লায়েন্ট কম্পানি তৈরি, মার্চেন্টদের তথ্য পরিচালনা এবং সাবস্ক্রিপশন মেয়াদ ও ভ্যালিডিটি টাইম কন্ট্রোল করা যাবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/superadmin/companies"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/30"
            >
              <Plus size={16} />
              <span>+ Create Company</span>
            </Link>
            <Link
              href="/superadmin/subscriptions"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition border border-slate-700"
            >
              <Clock size={16} className="text-emerald-400" />
              <span>Subscriptions & Validity</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Companies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Companies</span>
            <Building2 size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalCompanies}</p>
          <span className="text-[10px] text-slate-500">Registered SaaS Tenants</span>
        </div>

        {/* Active Companies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Tenants</span>
            <CheckCircle size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-700">{stats.activeCompanies}</p>
          <span className="text-[10px] text-emerald-600/80">Operational stores</span>
        </div>

        {/* Suspended */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Suspended</span>
            <Ban size={18} />
          </div>
          <p className="text-2xl font-black text-rose-600">{stats.suspendedCompanies}</p>
          <span className="text-[10px] text-rose-500/80">Access disabled</span>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Validity</span>
            <Layers size={18} />
          </div>
          <p className="text-2xl font-black text-purple-700">{stats.activeSubscriptions}</p>
          <span className="text-[10px] text-purple-600/80">Valid store licenses</span>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expiring Soon</span>
            <Clock size={18} />
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.expiringSoon}</p>
          <span className="text-[10px] text-amber-600/80">Within next 7 days</span>
        </div>

        {/* Expired Accounts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expired</span>
            <AlertTriangle size={18} />
          </div>
          <p className="text-2xl font-black text-rose-600">{stats.expiredSubscriptions}</p>
          <span className="text-[10px] text-rose-500/80">Needs time extension</span>
        </div>
      </div>

      {/* Main Section: Companies Overview & Quick Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Companies List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Merchant Companies</h2>
              <p className="text-xs text-slate-500">Live overview of registered businesses & validity</p>
            </div>
            <Link
              href="/superadmin/companies"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading Companies...</div>
            ) : companies.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No companies registered yet.</div>
            ) : (
              <div className="space-y-3">
                {companies.slice(0, 5).map((comp) => {
                  const sub = comp.subscription || {};
                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 shadow-inner">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-900 text-sm">{comp.name}</h3>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPlanBadgeColor(
                                sub.planId
                              )}`}
                            >
                              {sub.planName || 'Standard'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Owner: <span className="font-medium text-slate-700">{comp.owner || 'Admin'}</span>
                            {sub.expiryDate && (
                              <span className="ml-2 font-mono text-slate-600">
                                • Expires: <strong>{sub.expiryDate}</strong>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center space-x-1 ${
                            comp.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {comp.status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                          <span className="capitalize">{comp.status}</span>
                        </span>

                        <Link
                          href={`/superadmin/subscriptions?company=${comp.id}`}
                          className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
                        >
                          Validity Time
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
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Clock size={18} className="text-purple-600" />
                <span>Subscription Validity Tiers</span>
              </h3>
              <Link
                href="/superadmin/subscriptions"
                className="text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-blue-900">Free Trial</p>
                  <p className="text-[11px] text-blue-600">14 Days Single Branch</p>
                </div>
                <span className="font-bold text-blue-800 font-mono text-[11px]">14 Days</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-900">1 Month Access</p>
                  <p className="text-[11px] text-emerald-600">1 Outlet, 5 Staff Accounts</p>
                </div>
                <span className="font-bold text-emerald-800 font-mono text-[11px]">30 Days</span>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-purple-900">3 Months Pass</p>
                  <p className="text-[11px] text-purple-600">2 Outlets, Transfers, Audit Logs</p>
                </div>
                <span className="font-bold text-purple-800 font-mono text-[11px]">90 Days</span>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-indigo-900">6 Months Pass</p>
                  <p className="text-[11px] text-indigo-600">3 Outlets, Full Reports, Backup</p>
                </div>
                <span className="font-bold text-indigo-800 font-mono text-[11px]">180 Days</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-900">1 Year Full Access</p>
                  <p className="text-[11px] text-amber-600">10 Outlets, Unlimited Staff, VIP</p>
                </div>
                <span className="font-bold text-amber-800 font-mono text-[11px]">365 Days</span>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs space-y-3">
            <h4 className="font-bold text-sm flex items-center space-x-2 text-purple-300">
              <ShieldAlert size={16} />
              <span>Time-Based Licensing System</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              সিস্টেমে সাবস্ক্রিপশন শুধুমাত্র সময়/মেয়াদ অনুযায়ী পরিচালিত হয়। ক্লায়েন্টদের সাথে পেমেন্ট ও লেনদেন সম্পূর্ণ এক্সটার্নাল ভাবে হবে এবং আপনি যেকোনো সময় কোম্পানির মেয়াদ ইচ্ছামতো বাড়িয়ে দিতে পারবেন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
