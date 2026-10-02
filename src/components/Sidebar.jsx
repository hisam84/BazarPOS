'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Users,
  UserCheck,
  Contact,
  Boxes,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Layers,
  AlertOctagon,
  MinusCircle,
  CreditCard,
  BarChart3,
  Mail,
  Settings,
  QrCode,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Search,
  LogOut,
  Sparkles,
  Receipt,
  Building2,
  PieChart,
  ShieldCheck,
  Shield,
  Clock,
  Store,
  User,
  Barcode,
  X
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// Main Store Navigation Tree matching POS/ERP standard layout
const STORE_NAVIGATION_ITEMS = [
  {
    id: 'home',
    type: 'link',
    title: 'Home',
    icon: Home,
    href: '/',
  },
  {
    id: 'user_management',
    type: 'group',
    title: 'User Management',
    icon: Users,
    permission: 'staff_roles_manage',
    items: [
      { name: 'Staff Accounts', href: '/staff?tab=users', permission: 'staff_roles_manage' },
      { name: 'Roles & Default Permissions', href: '/staff?tab=roles', permission: 'staff_roles_manage' },
      { name: 'Full Permissions Matrix', href: '/staff?tab=matrix', permission: 'staff_roles_manage' },
      { name: 'Sales Commission Agents', href: '/salers', permission: 'staff_roles_manage' },
    ]
  },
  {
    id: 'contacts',
    type: 'group',
    title: 'Contacts',
    icon: Contact,
    permission: 'customers_manage',
    items: [
      { name: 'Contact Directory', href: '/clients', permission: 'customers_manage' },
      { name: 'Add Contact', href: '/clients?action=new', permission: 'customers_manage' },
      { name: 'Suppliers & Vendors', href: '/suppliers', permission: 'suppliers_manage' },
      { name: 'Import Contacts', href: '/clients?action=import', permission: 'customers_manage' },
    ]
  },
  {
    id: 'products',
    type: 'group',
    title: 'Products',
    icon: Boxes,
    permission: 'inventory_view',
    items: [
      { name: 'List Products', href: '/inventory', permission: 'inventory_view' },
      { name: 'Add Product', href: '/inventory?action=new', permission: 'inventory_manage' },
      { name: 'Print Labels / Barcodes', href: '/barcodes', permission: 'barcodes_manage' },
      { name: 'Units & Categories', href: '/inventory?tab=categories', permission: 'inventory_view' },
    ]
  },
  {
    id: 'purchases',
    type: 'group',
    title: 'Purchases',
    icon: ArrowDownCircle,
    permission: 'purchases_manage',
    items: [
      { name: 'List Purchases', href: '/inventory?tab=purchases', permission: 'purchases_manage' },
      { name: 'Add Purchase', href: '/inventory?action=purchase', permission: 'purchases_manage' },
    ]
  },
  {
    id: 'sell',
    type: 'group',
    title: 'Sell',
    icon: ArrowUpCircle,
    permission: 'pos_terminal',
    items: [
      { name: 'POS Terminal', href: '/pos', badge: 'Live', permission: 'pos_terminal' },
      { name: 'All Sales / Invoices', href: '/vouchers/history', permission: 'view_invoices' },
      { name: 'Sales Return & Warranty', href: '/sales-return', permission: 'pos_terminal' },
    ]
  },
  {
    id: 'stock_transfers',
    type: 'group',
    title: 'Stock Transfers',
    icon: Truck,
    permission: 'branches_manage',
    items: [
      { name: 'List Stock Transfers', href: '/branches', permission: 'branches_manage' },
      { name: 'Add Stock Transfer', href: '/branches?action=transfer', permission: 'branches_manage' },
    ]
  },
  {
    id: 'stock_adjustment',
    type: 'group',
    title: 'Stock Adjustment',
    icon: Layers,
    permission: 'stock_adjustment',
    items: [
      { name: 'List Stock Adjustments', href: '/stock-adjustment', permission: 'stock_adjustment' },
      { name: 'Add Stock Adjustment', href: '/stock-adjustment?action=new', permission: 'stock_adjustment' },
    ]
  },
  {
    id: 'expenses',
    type: 'group',
    title: 'Expenses',
    icon: MinusCircle,
    permission: 'expenses_manage',
    items: [
      { name: 'List Expenses', href: '/expenses', permission: 'expenses_manage' },
      { name: 'Add Expense', href: '/expenses?action=new', permission: 'expenses_manage' },
      { name: 'Expense Categories', href: '/expenses?tab=categories', permission: 'expenses_manage' },
    ]
  },
  {
    id: 'payment_accounts',
    type: 'group',
    title: 'Payment Accounts',
    icon: CreditCard,
    permission: 'cash_register',
    items: [
      { name: 'Daily Cash Register', href: '/cash-register', permission: 'cash_register' },
      { name: 'Saler Balances Ledger', href: '/saler-balance', permission: 'cash_register' },
    ]
  },
  {
    id: 'reports',
    type: 'group',
    title: 'Reports',
    icon: BarChart3,
    permission: 'reports_view',
    items: [
      { name: 'Sales & Revenue Report', href: '/reports?tab=sales', permission: 'reports_view' },
      { name: 'Profit / Loss Report', href: '/reports?tab=income', permission: 'reports_view' },
      { name: 'Operating Expense Report', href: '/reports?tab=expenses', permission: 'reports_view' },
      { name: 'Stock Valuation Report', href: '/reports?tab=stock', permission: 'reports_view' },
      { name: 'Audit History Logs', href: '/audit-logs', permission: 'audit_logs' },
    ]
  },
  {
    id: 'notification_templates',
    type: 'group',
    title: 'Notification Templates',
    icon: Mail,
    permission: 'company_settings',
    items: [
      { name: 'Email Template Studio', href: '/settings#email-templates', permission: 'company_settings' },
      { name: 'SMS & Notice Templates', href: '/settings#templates', permission: 'company_settings' },
    ]
  },
  {
    id: 'settings',
    type: 'group',
    title: 'Settings',
    icon: Settings,
    permission: 'company_settings',
    items: [
      { name: 'Business Settings', href: '/settings', permission: 'company_settings' },
      { name: 'Invoice Settings', href: '/invoice-settings', permission: 'invoice_settings' },
      { name: 'Owner Profile', href: '/profile' },
    ]
  },
  {
    id: 'catalogue_qr',
    type: 'link',
    title: 'Catalogue QR',
    icon: QrCode,
    href: '/barcodes',
  }
];

// Super Admin Navigation Tree
const SUPERADMIN_NAVIGATION_ITEMS = [
  {
    id: 'saas_overview',
    type: 'link',
    title: 'Platform Overview',
    icon: LayoutDashboard,
    href: '/superadmin/dashboard',
  },
  {
    id: 'saas_companies',
    type: 'link',
    title: 'Manage Companies',
    icon: Building2,
    href: '/superadmin/companies',
  },
  {
    id: 'saas_subscriptions',
    type: 'link',
    title: 'Subscriptions & Plans',
    icon: Clock,
    href: '/superadmin/subscriptions',
  },
  {
    id: 'saas_settings',
    type: 'link',
    title: 'Security & Settings',
    icon: ShieldCheck,
    href: '/superadmin/settings',
  }
];

export default function Sidebar({ user, company, onLogout, mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track open group states (Accordion)
  const [openGroups, setOpenGroups] = useState({
    expenses: true // Default open as sample or active
  });

  const role = user?.role || 'owner';
  const isSuperAdmin = role === 'superadmin';
  const logoUrl = !isSuperAdmin ? (company?.logoUrl || user?.logoUrl) : null;
  const userPermissions = user?.permissions || ['*'];
  const navItems = isSuperAdmin ? SUPERADMIN_NAVIGATION_ITEMS : STORE_NAVIGATION_ITEMS;

  // Auto-expand the group containing the current route on route change
  useEffect(() => {
    for (const item of navItems) {
      if (item.type === 'group' && item.items) {
        const hasActive = item.items.some(sub => {
          const subPath = sub.href.split('?')[0].split('#')[0];
          return pathname === subPath || (subPath !== '/' && pathname.startsWith(subPath));
        });
        if (hasActive) {
          setOpenGroups({ [item.id]: true });
          break;
        }
      }
    }
  }, [pathname, navItems]);

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => {
      const isCurrentlyOpen = !!prev[groupId];
      if (isCurrentlyOpen) {
        return {}; // Close
      }
      return { [groupId]: true }; // Open ONLY clicked group (Accordion)
    });
  };

  const isItemActive = (href) => {
    if (!href) return false;
    const [basePath, query] = href.split('?');
    if (basePath === '/') return pathname === '/';
    if (pathname === basePath) {
      if (query && typeof window !== 'undefined') {
        const currentSearch = window.location.search;
        const targetParams = new URLSearchParams(query);
        const currentParams = new URLSearchParams(currentSearch);
        for (const [key, val] of targetParams.entries()) {
          if (currentParams.get(key) !== val) return false;
        }
        return true;
      }
      return true;
    }
    return pathname.startsWith(basePath + '/');
  };

  const canAccess = (item) => {
    if (isSuperAdmin || role === 'owner') return true;
    if (!item.permission) return true;
    if (userPermissions.includes('*') || userPermissions.includes('all')) return true;
    return userPermissions.includes(item.permission);
  };

  // Filter items if searching
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const q = searchQuery.toLowerCase();
    return navItems.filter(item => {
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.items) {
        return item.items.some(sub => sub.name.toLowerCase().includes(q));
      }
      return false;
    });
  }, [navItems, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-30 lg:h-screen lg:sticky lg:top-0 flex flex-col bg-[#161b2e] text-slate-300 border-r border-[#222944] shadow-2xl lg:shadow-none transition-all duration-200 ease-in-out select-none shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#222944] bg-[#121626] shrink-0">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center space-x-3 overflow-hidden min-w-0"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1 border border-white/10 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shrink-0 shadow-md shadow-blue-500/20 text-sm">
                B
              </div>
            )}

            {!collapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-sm text-white tracking-tight truncate block">
                  {company?.name || user?.storeName || 'BazarPOS'}
                </span>
                <span className="text-[10px] text-blue-400 font-semibold block uppercase tracking-wider">
                  {isSuperAdmin ? 'SuperAdmin Portal' : (role === 'owner' ? 'Store Manager' : role)}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse & Mobile Close */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Navigation Bar (when expanded) */}
        {!collapsed && (
          <div className="p-3 border-b border-[#222944] bg-[#141829] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menus..."
                className="w-full pl-8.5 pr-3 py-1.5 bg-[#1e243d] border border-[#2a3356] rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-[#222a47] transition font-medium"
              />
            </div>
          </div>
        )}

        {/* Navigation Items Tree List */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 custom-scrollbar text-xs font-medium">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isOpen = !!openGroups[item.id];

            // 1. Direct Link Item (e.g. Home, Catalogue QR)
            if (item.type === 'link') {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } py-2.5 rounded-xl font-bold transition duration-150 ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-[#202742] hover:text-white'
                  }`}
                  title={collapsed ? item.title : undefined}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon size={17} className={active ? 'text-white' : 'text-slate-400'} />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </div>
                </Link>
              );
            }

            // 2. Accordion Group Item (e.g. User Management, Contacts, Products, Expenses, etc.)
            const visibleChildren = (item.items || []).filter(canAccess);
            if (visibleChildren.length === 0) return null;

            const isGroupActive = visibleChildren.some(sub => isItemActive(sub.href));

            return (
              <div key={item.id} className="space-y-0.5">
                {/* Group Trigger Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } py-2.5 rounded-xl font-bold transition duration-150 ${
                    isOpen
                      ? 'bg-[#202744] text-white shadow-xs'
                      : isGroupActive
                        ? 'text-white bg-[#1b213b]'
                        : 'text-slate-300 hover:bg-[#1b213b] hover:text-white'
                  }`}
                  title={collapsed ? item.title : undefined}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon
                      size={17}
                      className={isOpen || isGroupActive ? 'text-blue-400' : 'text-slate-400'}
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center space-x-1 shrink-0 ml-1">
                      <ChevronRight
                        size={14}
                        className={`text-slate-500 transition-transform duration-200 ${
                          isOpen ? 'rotate-90 text-blue-400' : ''
                        }`}
                      />
                    </div>
                  )}
                </button>

                {/* Submenu Accordion Items (when opened) */}
                {isOpen && !collapsed && (
                  <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-slate-700/60 ml-5 animate-in slide-in-from-top-1 duration-150">
                    {visibleChildren.map((sub, idx) => {
                      const subActive = isItemActive(sub.href);
                      return (
                        <Link
                          key={idx}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition duration-150 font-medium ${
                            subActive
                              ? 'bg-blue-600/90 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
                          }`}
                        >
                          <span className="truncate flex items-center space-x-1.5">
                            <span className="text-[11px] text-slate-500">→</span>
                            <span>{sub.name}</span>
                          </span>

                          {sub.badge && (
                            <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full">
                              {sub.badge}
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

        {/* Footer: User Profile & Logout */}
        <div className="p-3 border-t border-[#222944] bg-[#121626] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs shrink-0">
                {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
              </div>

              {!collapsed && (
                <div className="min-w-0 truncate">
                  <p className="font-bold text-xs text-white truncate">
                    {user?.fullName || user?.username || 'Store Admin'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {user?.email || 'Logged in'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition shrink-0"
              title="Logout from Store"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Global Scrollbar CSS for sidebar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #252c48;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333d63;
        }
      `}</style>
    </>
  );
}
