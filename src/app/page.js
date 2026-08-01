'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  FileText,
  Package,
  Users,
  UserCheck,
  Receipt,
  Barcode,
  Settings,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadDashboardData(u.storeId || 'default');
    }
  }, []);

  const loadDashboardData = async (storeId) => {
    try {
      const [vRes, pRes, eRes] = await Promise.all([
        fetch(`/api/vouchers?storeId=${storeId}`),
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/expenses?storeId=${storeId}`)
      ]);

      const vData = await vRes.json();
      const pData = await pRes.json();
      const eData = await eRes.json();

      if (vData.success) setVouchers(vData.vouchers || []);
      if (pData.success) setProducts(pData.products || []);
      if (eData.success) setExpenses((eData.data && eData.data.expense) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = vouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
  const totalPaid = vouchers.reduce((acc, v) => acc + (v.paidAmount || 0), 0);
  const totalDue = vouchers.reduce((acc, v) => acc + (v.dueAmount || 0), 0);
  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const lowStockProducts = products.filter(
    (p) => (p.quantity || 0) <= (p.minQuantity || 5)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Welcome */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Welcome Back, <span className="text-blue-600">{user?.fullName || 'Store Owner'}</span> 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store Outlet: <span className="font-semibold text-slate-700">{user?.storeName || 'Main BazarPOS Store'}</span>
          </p>
        </div>

        <Link
          href="/pos"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition"
        >
          <ShoppingCart size={18} />
          <span>New Sale (POS Terminal)</span>
        </Link>
      </div>

      {/* Financial Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Sales</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">৳{totalSales.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{vouchers.length} Total Invoices</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Received Cash</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={18} />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">৳{totalPaid.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Collected Revenue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customer Due Balance</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <CreditCard size={18} />
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">৳{totalDue.toLocaleString()}</p>
          <p className="text-[11px] text-rose-500 mt-1 font-semibold">Outstanding Receivables</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Operating Expenses</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Receipt size={18} />
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">৳{totalExpense.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Rent, Bills & Costs</p>
        </div>
      </div>

      {/* Quick Action Cards Grid (Matches original app cards!) */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Quick Actions & Management</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/pos"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <ShoppingCart size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">New Sale (POS)</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Generate Receipt</span>
          </Link>

          <Link
            href="/inventory"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Package size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">Add & Edit Products</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Stock Catalog</span>
          </Link>

          <Link
            href="/clients"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Users size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">Add Customers & Due</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Collect Credit</span>
          </Link>

          <Link
            href="/salers"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <UserCheck size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">Add Sales Staff</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Salers Directory</span>
          </Link>

          <Link
            href="/vouchers/history"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <FileText size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">Sales Reports</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Voucher History</span>
          </Link>

          <Link
            href="/barcodes"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Barcode size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">Barcode Labels</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Batch Sticker Print</span>
          </Link>

          <Link
            href="/expenses"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Receipt size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">Operating Expenses</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Store Rent & Bills</span>
          </Link>

          <Link
            href="/settings"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Settings size={22} />
            </div>
            <span className="font-bold text-xs text-slate-800">Store Settings</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Branding & Backup</span>
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
              <AlertTriangle size={18} />
              <span>Low Stock Alerts ({lowStockProducts.length} Products Need Restock)</span>
            </div>
            <Link href="/suppliers" className="text-xs font-bold text-rose-700 hover:underline">
              + Restock via Suppliers PO ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Code: {p.code}</p>
                </div>
                <span className="font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                  {p.quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
