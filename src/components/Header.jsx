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
  ShieldCheck,
  Building2,
  Clock,
  Menu,
  Calculator
} from 'lucide-react';
import QuickCalculator from '@/components/QuickCalculator';

export default function Header({ user, onLogout, onToggleMobileSidebar }) {
  const isSuperAdmin = user?.role === 'superadmin';
  const [showCalculator, setShowCalculator] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs no-print">
      {/* Mobile Hamburger & Store Badge */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center space-x-1.5 sm:space-x-2">
            {isSuperAdmin ? (
              <>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0"></span>
                <span className="truncate">BazarPOS SaaS Super Admin</span>
              </>
            ) : (
              <span className="truncate">{user?.storeName || 'Main BazarPOS Store'}</span>
            )}
          </h2>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate hidden xs:block">
            {isSuperAdmin
              ? 'Multi-Tenant Platform'
              : 'Enterprise POS Edition'}
          </span>
        </div>
      </div>

      {/* Quick Action Shortcuts & User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Quick Action Shortcuts */}
        {isSuperAdmin ? (
          <div className="hidden md:flex items-center space-x-1.5 border-r pr-3 border-slate-200 text-xs font-semibold">
            <Link
              href="/superadmin/companies"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition border border-indigo-200/80"
              title="Add New Company"
            >
              <Building2 size={14} />
              <span className="hidden xl:inline">+ New Company</span>
            </Link>
            <Link
              href="/superadmin/subscriptions"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition border border-slate-200"
              title="Subscription & Validity Management"
            >
              <Clock size={14} className="text-indigo-600" />
              <span className="hidden xl:inline">Validity</span>
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-1.5 border-r pr-3 border-slate-200 text-xs font-semibold text-slate-600">
            <Link
              href="/cash-register"
              className="flex items-center space-x-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="Cash Register Reconciliation"
            >
              <DollarSign size={14} className="text-emerald-600" />
              <span className="hidden xl:inline">Cash Register</span>
            </Link>

            <Link
              href="/stock-adjustment"
              className="flex items-center space-x-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="Stock Adjustment & Loss"
            >
              <AlertOctagon size={14} className="text-rose-600" />
              <span className="hidden xl:inline">Adjustment</span>
            </Link>

            <Link
              href="/branches"
              className="flex items-center space-x-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="Branches & Transfers"
            >
              <Building2 size={14} className="text-blue-600" />
              <span className="hidden xl:inline">Branches</span>
            </Link>

            <Link
              href="/audit-logs"
              className="flex items-center space-x-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="System Activity Audit Log"
            >
              <ShieldCheck size={14} className="text-indigo-600" />
              <span className="hidden xl:inline">Audit Logs</span>
            </Link>
          </div>
        )}

        {/* Quick Calculator Trigger Button */}
        <button
          type="button"
          onClick={() => setShowCalculator(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200/90 rounded-xl transition text-xs shadow-2xs active:scale-95 cursor-pointer"
          title="Open Quick POS Calculator"
        >
          <Calculator size={14} className="text-indigo-600 shrink-0" />
          <span className="hidden sm:inline">Calculator</span>
        </button>

        {/* User Info */}
        <Link
          href="/profile"
          className="flex items-center space-x-2.5 pl-1 hover:opacity-80 transition cursor-pointer"
          title="View & Edit Owner Profile"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800">{user?.fullName || 'Store Owner'}</span>
            <span className="text-[10px] text-slate-500 capitalize">{user?.role || 'owner'}</span>
          </div>
        </Link>

        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Quick Calculator Modal */}
      <QuickCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </header>
  );
}
