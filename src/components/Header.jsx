'use client';

import { Store, User, LogOut } from 'lucide-react';

export default function Header({ user, onLogout }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Store size={20} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-800">
            {user?.storeName || (user?.role === 'superadmin' ? 'Super Admin Portal' : 'Main Outlet')}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.role === 'superadmin' ? 'SaaS Management' : 'Active Counter Terminal'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-300">
            <User size={18} />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.fullName || user?.username || 'Admin User'}
            </p>
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full">
              {user?.role === 'superadmin' ? 'SUPER ADMIN' : 'STORE ADMIN'}
            </span>
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
