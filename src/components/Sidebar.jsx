'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Barcode,
  Users,
  UserCheck,
  Truck,
  Receipt,
  Scale,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Shield,
  Building2,
  PieChart,
  Boxes,
  DollarSign,
  AlertOctagon,
  ArrowRightLeft,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ user, onLogout }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(true);

  const role = user?.role || 'owner';
  const isSuperAdmin = role === 'superadmin';

  return (
    <aside
      className={`bg-slate-900 text-slate-100 min-h-screen transition-all duration-300 flex flex-col no-print ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md">
              B
            </div>
            <span className="font-bold text-lg tracking-wide text-white">
              {isSuperAdmin ? 'SuperAdmin' : 'BazarPOS'}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white mx-auto shadow-md">
            B
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Menu Sections */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {isSuperAdmin ? (
          /* ================= SUPER ADMIN SAAS NAVIGATION ================= */
          <div>
            {!collapsed && (
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2 px-3 flex items-center space-x-1">
                <Shield size={12} />
                <span>SaaS Management</span>
              </p>
            )}
            <div className="space-y-1.5">
              <Link
                href="/superadmin/dashboard"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/superadmin/dashboard'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                } ${collapsed ? 'justify-center space-x-0' : ''}`}
                title="Platform Overview"
              >
                <LayoutDashboard size={18} />
                {!collapsed && <span>Platform Overview</span>}
              </Link>

              <Link
                href="/superadmin/companies"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/superadmin/companies'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                } ${collapsed ? 'justify-center space-x-0' : ''}`}
                title="Manage Companies"
              >
                <Building2 size={18} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Manage Companies</span>
                  </div>
                )}
              </Link>

              <Link
                href="/superadmin/subscriptions"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/superadmin/subscriptions'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                } ${collapsed ? 'justify-center space-x-0' : ''}`}
                title="Subscription & Validity Management"
              >
                <Clock size={18} />
                {!collapsed && <span>Subscriptions & Validity</span>}
              </Link>

              <Link
                href="/superadmin/settings"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/superadmin/settings'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                } ${collapsed ? 'justify-center space-x-0' : ''}`}
                title="Admin Security Settings"
              >
                <ShieldCheck size={18} />
                {!collapsed && <span>Security & Settings</span>}
              </Link>
            </div>
          </div>
        ) : (
          /* ================= STORE POS NAVIGATION (NON-SUPERADMIN) ================= */
          <>
            {/* MAIN MENU */}
            <div>
              {!collapsed && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  Main Menu
                </p>
              )}
              <div className="space-y-1">
                <Link
                  href="/"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <LayoutDashboard size={18} />
                  {!collapsed && <span>Dashboard</span>}
                </Link>
                <Link
                  href="/pos"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/pos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <ShoppingCart size={18} />
                  {!collapsed && <span>New Sale (POS)</span>}
                </Link>
                <Link
                  href="/vouchers/history"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/vouchers/history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <FileText size={18} />
                  {!collapsed && <span>Sales Reports</span>}
                </Link>
              </div>
            </div>

            {/* MANAGEMENT */}
            <div>
              {!collapsed && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  Management
                </p>
              )}
              <div className="space-y-1">
                <Link
                  href="/inventory"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Package size={18} />
                  {!collapsed && <span>Inventory Catalog</span>}
                </Link>
                <Link
                  href="/stock-adjustment"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/stock-adjustment' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <AlertOctagon size={18} />
                  {!collapsed && <span>Stock Adjustment</span>}
                </Link>
                <Link
                  href="/suppliers"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/suppliers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Truck size={18} />
                  {!collapsed && <span>Suppliers & PO</span>}
                </Link>
                <Link
                  href="/barcodes"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/barcodes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Barcode size={18} />
                  {!collapsed && <span>Barcodes</span>}
                </Link>
                <Link
                  href="/clients"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/clients' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Users size={18} />
                  {!collapsed && <span>Clients & Due</span>}
                </Link>
                <Link
                  href="/salers"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/salers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <UserCheck size={18} />
                  {!collapsed && <span>Salers</span>}
                </Link>
                <Link
                  href="/saler-balance"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/saler-balance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Scale size={18} />
                  {!collapsed && <span>Saler Balance</span>}
                </Link>
              </div>
            </div>

            {/* FINANCE & CASH */}
            <div>
              {!collapsed && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  Finance & Outlets
                </p>
              )}
              <div className="space-y-1">
                <Link
                  href="/cash-register"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/cash-register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <DollarSign size={18} />
                  {!collapsed && <span>Cash Register (Day)</span>}
                </Link>
                <Link
                  href="/expenses"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Receipt size={18} />
                  {!collapsed && <span>Expenses</span>}
                </Link>
                <Link
                  href="/branches"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/branches' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Building2 size={18} />
                  {!collapsed && <span>Branches & Transfers</span>}
                </Link>
              </div>
            </div>

            {/* REPORTS (Collapsible Submenu) */}
            <div>
              {!collapsed && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  Analytics & Audit
                </p>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setReportsOpen(!reportsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition ${
                    collapsed ? 'justify-center' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 size={18} />
                    {!collapsed && <span>Financial Reports</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown size={14} className={`transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {reportsOpen && !collapsed && (
                  <div className="pl-6 space-y-1 border-l-2 border-slate-800 ml-4 py-1">
                    <Link
                      href="/reports?type=income"
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60"
                    >
                      <PieChart size={14} />
                      <span>Income Statement</span>
                    </Link>
                    <Link
                      href="/reports?type=expense"
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60"
                    >
                      <Receipt size={14} />
                      <span>Expense Summary</span>
                    </Link>
                    <Link
                      href="/reports?type=stock"
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60"
                    >
                      <Boxes size={14} />
                      <span>Stock Valuation</span>
                    </Link>
                  </div>
                )}

                <Link
                  href="/audit-logs"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/audit-logs' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <ShieldCheck size={18} />
                  {!collapsed && <span>Audit History Logs</span>}
                </Link>
              </div>
            </div>

            {/* SETTINGS */}
            <div>
              {!collapsed && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  Settings & Roles
                </p>
              )}
              <div className="space-y-1">
                <Link
                  href="/settings"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Settings size={18} />
                  {!collapsed && <span>Company Settings</span>}
                </Link>

                <Link
                  href="/staff"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/staff' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                  } ${collapsed ? 'justify-center space-x-0' : ''}`}
                >
                  <Shield size={18} />
                  {!collapsed && <span>Staff RBAC Roles</span>}
                </Link>
              </div>
            </div>
          </>
        )}
      </nav>


      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition ${
            collapsed ? 'justify-center space-x-0' : ''
          }`}
          title="Logout"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
