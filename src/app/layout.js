'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import './globals.css';

const DEFAULT_USER = {
  username: 'admin',
  fullName: 'Main Store Admin',
  role: 'owner',
  storeId: 'default',
  storeName: 'Main BazarPOS Store'
};

export default function RootLayout({ children }) {
  const [user, setUser] = useState(DEFAULT_USER);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem('bazarpos_user');
    let currentUser = DEFAULT_USER;
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        setUser(currentUser);
      } catch (e) {
        setUser(DEFAULT_USER);
      }
    } else {
      localStorage.setItem('bazarpos_user', JSON.stringify(DEFAULT_USER));
      setUser(DEFAULT_USER);
    }
    setLoading(false);

    // Route guards: Super Admin has NO store features
    if (currentUser?.role === 'superadmin') {
      if (pathname === '/' || (!pathname.startsWith('/superadmin') && pathname !== '/login')) {
        router.replace('/superadmin/dashboard');
      }
    } else if (currentUser?.role !== 'superadmin' && pathname.startsWith('/superadmin')) {
      router.replace('/');
    }
  }, [pathname]);


  const handleLogout = () => {
    localStorage.removeItem('bazarpos_user');
    setUser(null);
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isLoginPage = pathname === '/login';

  return (
    <html lang="en">
      <head>
        <title>BazarPOS - Next.js Multi-Store POS Software</title>
        <meta name="description" content="Modern Point of Sale & Billing Management System" />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium tracking-wide">Loading BazarPOS...</p>
            </div>
          </div>
        ) : isLoginPage ? (
          <div className="min-h-screen w-full">{children}</div>
        ) : (
          <div className="flex min-h-screen w-full">
            <Sidebar user={user} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col min-w-0">
              <Header user={user} onLogout={handleLogout} />
              <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
          </div>
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
      </body>
    </html>
  );
}
