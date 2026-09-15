'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  Settings,
  Shield,
  DollarSign,
  AlertOctagon,
  Globe,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function Header({ user, onLogout }) {
  const [lang, setLang] = useState('EN');

  const toggleLanguage = () => {
    const nextLang = lang === 'EN' ? 'BN' : 'EN';
    setLang(nextLang);
  };

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs no-print">
      {/* Store or SaaS Platform Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 line-clamp-1 flex items-center space-x-2">
            {isSuperAdmin ? (
              <>
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                <span>BazarPOS SaaS Super Admin</span>
              </>
            ) : (
              user?.storeName || 'Main BazarPOS Store'
            )}
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            {isSuperAdmin
              ? 'Multi-Tenant Company & Subscription Management Platform'
              : (lang === 'EN' ? 'Enterprise POS Edition' : 'এন্টারপ্রাইজ পস সফটওয়্যার')}
          </span>
        </div>
      </div>

      {/* Quick Action Shortcuts & User Menu */}
      <div className="flex items-center space-x-4">
        {/* Quick Action Shortcuts */}
        {isSuperAdmin ? (
          <div className="hidden md:flex items-center space-x-2 border-r pr-4 border-slate-200 text-xs font-semibold">
            <Link
              href="/superadmin/companies"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition border border-purple-200"
              title="Add New Company"
            >
              <Building2 size={14} />
              <span>+ New Company</span>
            </Link>
            <Link
              href="/superadmin/subscriptions"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              title="Subscription Management"
            >
              <DollarSign size={14} className="text-emerald-600" />
              <span>Subscriptions</span>
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-2 border-r pr-4 border-slate-200 text-xs font-semibold text-slate-600">
            <Link
              href="/cash-register"
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Cash Register Reconciliation"
            >
              <DollarSign size={14} className="text-emerald-600" />
              <span>Cash Register</span>
            </Link>

            <Link
              href="/stock-adjustment"
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Stock Adjustment & Loss"
            >
              <AlertOctagon size={14} className="text-rose-600" />
              <span>Adjustment</span>
            </Link>

            <Link
              href="/branches"
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Branches & Transfers"
            >
              <Building2 size={14} className="text-blue-600" />
              <span>Branches</span>
            </Link>

            <Link
              href="/audit-logs"
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="System Activity Audit Log"
            >
              <ShieldCheck size={14} className="text-purple-600" />
              <span>Audit Logs</span>
            </Link>
          </div>
        )}

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition border border-blue-200"
          title="Toggle Language"
        >

          <Globe size={14} />
          <span>{lang === 'EN' ? 'English (EN)' : 'বাংলা (BN)'}</span>
        </button>

        {/* User Info */}
        <div className="flex items-center space-x-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800">{user?.fullName || 'Store Owner'}</span>
            <span className="text-[10px] text-slate-500 capitalize">{user?.role || 'owner'}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
