'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  FileText,
  Package,
  Barcode,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
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
  ShieldCheck,
  Clock,
  Search,
  Store,
  Folder,
  FolderOpen,
  X
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// Store Navigation Tree Definition
const STORE_TREE_GROUPS = [
  {
    id: 'sales_group',
    title: 'Sales & Invoicing',
    icon: ShoppingBag,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    items: [
      { name: 'POS Terminal', href: '/pos', icon: ShoppingCart, badge: 'Live', badgeColor: 'bg-emerald-500 text-white', permission: 'pos_terminal' },
      { name: 'Sales & Invoices', href: '/vouchers/history', icon: FileText, permission: 'view_invoices' },
      { name: 'Customers & Due', href: '/clients', icon: Users, permission: 'customers_manage' },
    ]
  },
  {
    id: 'inventory_group',
    title: 'Inventory & Stock',
    icon: Package,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    items: [
      { name: 'Product Catalog', href: '/inventory', icon: Boxes, permission: 'inventory_view' },
      { name: 'Stock Adjustments', href: '/stock-adjustment', icon: AlertOctagon, permission: 'stock_adjustment' },
      { name: 'Suppliers & PO', href: '/suppliers', icon: Truck, permission: 'suppliers_manage' },
      { name: 'Barcode Generator', href: '/barcodes', icon: Barcode, permission: 'barcodes_manage' },
    ]
  },
  {
    id: 'finance_group',
    title: 'Finance & Outlets',
    icon: DollarSign,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    items: [
      { name: 'Daily Cash Register', href: '/cash-register', icon: DollarSign, permission: 'cash_register' },
      { name: 'Expense Manager', href: '/expenses', icon: Receipt, permission: 'expenses_manage' },
      { name: 'Branches & Transfer', href: '/branches', icon: Building2, permission: 'branches_manage' },
    ]
  },
  {
    id: 'reports_group',
    title: 'Reports & Audit',
    icon: BarChart3,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    items: [
      { name: 'Income Statement', href: '/reports?type=income', icon: PieChart, permission: 'reports_view' },
      { name: 'Expense Summary', href: '/reports?type=expense', icon: Receipt, permission: 'reports_view' },
      { name: 'Stock Valuation', href: '/reports?type=stock', icon: Boxes, permission: 'reports_view' },
      { name: 'Audit History Logs', href: '/audit-logs', icon: ShieldCheck, permission: 'audit_logs' },
    ]
  },
  {
    id: 'settings_group',
    title: 'Settings & Administration',
    icon: Settings,
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    items: [
      { name: 'Company Settings', href: '/settings', icon: Settings, permission: 'company_settings' },
      { name: 'Invoice Settings', href: '/invoice-settings', icon: Receipt, permission: 'invoice_settings' },
      { name: 'Staff, Roles & Permissions', href: '/staff', icon: Shield, permission: 'staff_roles_manage' },
      { name: 'Owner Profile', href: '/profile', icon: User },
    ]
  }
];

// Super Admin Navigation Tree Definition
const SUPERADMIN_TREE_GROUPS = [
  {
    id: 'saas_platform',
    title: 'SaaS Platform',
    icon: Shield,
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    items: [
      { name: 'Platform Overview', href: '/superadmin/dashboard', icon: LayoutDashboard },
      { name: 'Manage Companies', href: '/superadmin/companies', icon: Building2 },
      { name: 'Subscriptions & Validity', href: '/superadmin/subscriptions', icon: Clock },
      { name: 'Security & Settings', href: '/superadmin/settings', icon: ShieldCheck },
    ]
  }
];

export default function Sidebar({ user, company, onLogout, mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track open state of tree groups - single group open at a time (Accordion)
  const [openGroups, setOpenGroups] = useState({
    sales_group: true
  });

  const role = user?.role || 'owner';
  const isSuperAdmin = role === 'superadmin';
  const logoUrl = !isSuperAdmin ? (company?.logoUrl || user?.logoUrl) : null;
  const userPermissions = user?.permissions || ['*'];
  const treeGroups = isSuperAdmin ? SUPERADMIN_TREE_GROUPS : STORE_TREE_GROUPS;

  // Auto-expand the ONE active group containing current route on pathname change
  useEffect(() => {
    for (const group of treeGroups) {
      const hasActive = group.items.some(item => {
        const itemPath = item.href.split('?')[0];
        return pathname === itemPath || (itemPath !== '/' && pathname.startsWith(itemPath));
      });
      if (hasActive) {
        setOpenGroups({ [group.id]: true });
        break;
      }
    }
  }, [pathname, treeGroups]);

  // Strict Accordion: Toggle group such that only one group is ever open at a time
  const toggleGroup = (groupId) => {
    setOpenGroups(prev => {
      const isCurrentlyOpen = !!prev[groupId];
      if (isCurrentlyOpen) {
        return {}; // close all
      }
      return { [groupId]: true }; // open ONLY the clicked group
    });
  };

  const isItemActive = (href) => {
    const basePath = href.split('?')[0];
    if (basePath === '/') return pathname === '/';
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  // Helper to check item permission
  const canAccessItem = (item) => {
    if (isSuperAdmin || role === 'owner') return true;
    if (!item.permission) return true;
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(item.permission);
  };

  const handleLinkClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  // Filter groups and items by permission and search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return treeGroups
      .map(group => {
        // First filter by user permissions
        const allowedItems = group.items.filter(canAccessItem);
        if (allowedItems.length === 0) return null;

        // Then filter by search query if present
        if (q) {
          const matchingItems = allowedItems.filter(item =>
            item.name.toLowerCase().includes(q) || group.title.toLowerCase().includes(q)
          );
          return matchingItems.length > 0 ? { ...group, items: matchingItems } : null;
        }

        return { ...group, items: allowedItems };
      })
      .filter(Boolean);
  }, [searchQuery, treeGroups, userPermissions, role, isSuperAdmin]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen?.(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 h-screen flex-shrink-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 transition-all duration-300 flex flex-col no-print border-r border-slate-800/80 shadow-2xl z-50 select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-md shadow-blue-500/10 border border-slate-700 overflow-hidden shrink-0">
                  <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-extrabold text-white shadow-lg shadow-blue-500/25 border border-blue-400/30 shrink-0">
                  {isSuperAdmin ? '⚡' : 'B'}
                </div>
              )}
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-tight text-white block leading-tight truncate">
                  {isSuperAdmin ? 'SuperAdmin' : (company?.name || user?.storeName || 'BazarPOS')}
                </span>
                <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider block">
                  {isSuperAdmin ? 'SaaS Central' : 'Retail Cloud ERP'}
                </span>
              </div>
            </div>
          ) : (
            logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 mx-auto shadow-md border border-slate-700 overflow-hidden">
                <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white mx-auto shadow-md border border-blue-400/30">
                {isSuperAdmin ? '⚡' : 'B'}
              </div>
            )
          )}

          <div className="flex items-center space-x-1">
            {/* Desktop Collapse/Expand Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition hidden lg:flex"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile Close Drawer Button */}
            <button
              onClick={() => setMobileOpen?.(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition lg:hidden"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

      {/* Quick Search Filter (Only when expanded) */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" size={14} />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Nav Tree */}
      <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto custom-scrollbar">
        {/* Top Level Direct Link: Dashboard */}
        {!isSuperAdmin && (
          <div className="space-y-1">
            <Link
              href="/"
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group ${
                pathname === '/'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              } ${collapsed ? 'justify-center space-x-0' : ''}`}
              title="Dashboard"
            >
              <LayoutDashboard size={18} className={pathname === '/' ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>Dashboard</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                    Home
                  </span>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Tree Categories */}
        <div className="space-y-2">
          {filteredGroups.map(group => {
            const isOpen = searchQuery ? true : openGroups[group.id];
            const GroupIcon = group.icon;
            const hasActiveChild = group.items.some(item => isItemActive(item.href));

            return (
              <div key={group.id} className="rounded-xl bg-slate-950/20 border border-slate-800/40 p-1">
                {/* Category Header (Tree Branch Root) */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                    hasActiveChild
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  } ${collapsed ? 'justify-center px-1' : ''}`}
                  title={group.title}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={`p-1 rounded-lg ${hasActiveChild ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800/80 text-slate-400'}`}>
                      <GroupIcon size={14} />
                    </span>
                    {!collapsed && (
                      <span className="truncate tracking-wide text-xs uppercase text-[11px] font-bold">
                        {group.title}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.2 rounded-full bg-slate-800/60">
                        {group.items.length}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-blue-400' : ''
                        }`}
                      />
                    </div>
                  )}
                </button>

                {/* Tree Child Nodes (Collapsed: hidden or icon stack) */}
                {isOpen && !collapsed && (
                  <div className="relative mt-1 ml-3.5 pl-3 border-l-2 border-slate-800/80 space-y-0.5 py-1">
                    {group.items.map((item, idx) => {
                      const active = isItemActive(item.href);
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={`relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group ${
                            active
                              ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Tree node branch connector dot */}
                          <span
                            className={`absolute -left-[17px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 transition-all ${
                              active
                                ? 'bg-blue-500 border-slate-900 ring-2 ring-blue-500/40 scale-110'
                                : 'bg-slate-700 border-slate-900 group-hover:bg-blue-400'
                            }`}
                          />

                          <div className="flex items-center space-x-2 min-w-0">
                            <ItemIcon
                              size={14}
                              className={`shrink-0 transition-colors ${
                                active ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm shrink-0 ml-1.5 ${
                                item.badgeColor || 'bg-slate-700 text-slate-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Info & Store Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.fullName || user?.username || 'User'}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium capitalize flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                  <span>{user?.role || 'Staff'}</span>
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              onClick={handleLinkClick}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="My Profile"
            >
              <Settings size={14} />
            </Link>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 transition duration-150 ${
            collapsed ? 'justify-center space-x-0 px-2' : ''
          }`}
          title="Sign Out"
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  </>
  );
}

