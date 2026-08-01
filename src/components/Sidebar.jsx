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
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ user, onLogout }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'owner';
  const isSuperAdmin = role === 'superadmin';
  const isCashier = role === 'cashier';

  const allStoreNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['owner', 'manager'] },
    { name: 'POS Terminal', href: '/pos', icon: ShoppingCart, roles: ['owner', 'manager', 'cashier'] },
    { name: 'Sales Reports', href: '/vouchers/history', icon: FileText, roles: ['owner', 'manager', 'cashier'] },
    { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner', 'manager', 'cashier'] },
    { name: 'Suppliers & PO', href: '/suppliers', icon: Truck, roles: ['owner', 'manager'] },
    { name: 'Barcodes', href: '/barcodes', icon: Barcode, roles: ['owner', 'manager', 'cashier'] },
    { name: 'Clients', href: '/clients', icon: Users, roles: ['owner', 'manager'] },
    { name: 'Salers', href: '/salers', icon: UserCheck, roles: ['owner', 'manager'] },
    { name: 'Staff Credentials', href: '/staff', icon: Shield, roles: ['owner'] },
    { name: 'Expenses', href: '/expenses', icon: Receipt, roles: ['owner', 'manager'] },
    { name: 'Analytics', href: '/reports', icon: BarChart3, roles: ['owner'] },
    { name: 'Store Settings', href: '/settings', icon: Settings, roles: ['owner'] },
  ];

  const superAdminNavItems = [
    { name: 'Stores Portal', href: '/superadmin/dashboard', icon: ShieldAlert }
  ];

  const navItems = isSuperAdmin
    ? superAdminNavItems
    : allStoreNavItems.filter(item => item.roles.includes(role));

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

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center space-x-0' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
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
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
