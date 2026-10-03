'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import SecurityWarningBanner from '@/components/SecurityWarningBanner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import './globals.css';

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';
  const isPublicInvoice = pathname && pathname.startsWith('/invoice/');
  const isPublicPage = isLoginPage || isPublicInvoice;

  useEffect(() => {
    const savedUser = localStorage.getItem('bazarpos_user');
    let currentUser = null;
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);

    // If not logged in and trying to access a protected page, redirect to /login
    if (!currentUser && !isPublicPage) {
      router.replace('/login');
      return;
    }

    // Route guards: Super Admin has NO store features
    if (currentUser?.role === 'superadmin') {
      if (pathname === '/' || (!pathname.startsWith('/superadmin') && pathname !== '/login')) {
        router.replace('/superadmin/dashboard');
      }
    } else if (currentUser && currentUser.role !== 'superadmin' && pathname.startsWith('/superadmin')) {
      router.replace('/');
    }

    // Load store company details & logo for favicon
    if (currentUser?.storeId && currentUser?.role !== 'superadmin') {
      fetch(`/api/company?storeId=${currentUser.storeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.company) {
            setCompany(data.company);
          }
        })
        .catch(() => {});
    }
  }, [pathname, isPublicPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('bazarpos_user');
    setUser(null);
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getPageTitle = () => {
    if (isPublicInvoice) return 'Digital Invoice Receipt | BazarPOS';
    if (isLoginPage) return 'Login | BazarPOS Cloud ERP';
    if (currentUserRole === 'superadmin') {
      if (pathname.startsWith('/superadmin/companies')) return 'Manage Companies | SuperAdmin SaaS';
      if (pathname.startsWith('/superadmin/subscriptions')) return 'Subscriptions & Validity | SuperAdmin SaaS';
      if (pathname.startsWith('/superadmin/settings')) return 'Security Settings | SuperAdmin SaaS';
      return 'SaaS Platform Overview | SuperAdmin';
    }
    
    const store = user?.storeName || 'BazarPOS';
    const routeTitles = {
      '/': `Dashboard | ${store}`,
      '/pos': `POS Terminal | ${store}`,
      '/inventory': `Inventory Catalog | ${store}`,
      '/vouchers/history': `Sales & Invoices | ${store}`,
      '/invoice-settings': `Invoice Settings | ${store}`,
      '/clients': `Customer Due Register | ${store}`,
      '/suppliers': `Suppliers & PO | ${store}`,
      '/barcodes': `Barcode Generator | ${store}`,
      '/cash-register': `Cash Register | ${store}`,
      '/expenses': `Expense Manager | ${store}`,
      '/branches': `Branches & Transfer | ${store}`,
      '/reports': `Financial Reports | ${store}`,
      '/audit-logs': `System Audit Logs | ${store}`,
      '/settings': `Store Settings | ${store}`,
      '/profile': `Store Profile | ${store}`,
      '/staff': `Staff & Roles | ${store}`,
      '/stock-adjustment': `Stock Adjustment | ${store}`
    };

    return routeTitles[pathname] || `${store} | Retail POS ERP`;
  };

  const currentUserRole = user?.role || 'owner';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = getPageTitle();

      // Dynamic Favicon sync with Company Favicon (or fallback to Logo)
      const favicon = company?.faviconUrl || user?.faviconUrl || company?.logoUrl || user?.logoUrl;
      if (favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = favicon;
      }
    }

    // Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA ServiceWorker error:', err);
      });
    }
  }, [pathname, user, company]);

  return (
    <html lang="en">
      <head>
        <title>{getPageTitle()}</title>
        <meta name="description" content="Modern Point of Sale & Retail Billing Management ERP System" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BazarPOS" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="shortcut icon" href="/favicon.png" />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {!isPublicPage && <SecurityWarningBanner user={user} onUserUpdated={(u) => setUser(u)} />}
        
        {loading ? (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium tracking-wide">Loading BazarPOS...</p>
            </div>
          </div>
        ) : isPublicPage ? (
          <div className="min-h-screen w-full">{children}</div>
        ) : (
          <div className="flex min-h-screen w-full relative">
            <Sidebar
              user={user}
              company={company}
              onLogout={handleLogout}
              mobileOpen={sidebarMobileOpen}
              setMobileOpen={setSidebarMobileOpen}
            />
            <div className="flex-1 flex flex-col min-w-0">
              <Header
                user={user}
                onLogout={handleLogout}
                onToggleMobileSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
              />
              <main className="flex-1 p-2.5 sm:p-4 md:p-5 overflow-y-auto">{children}</main>
            </div>
          </div>
        )}

        <PWAInstallPrompt />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </body>
    </html>
  );
}

