'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  FileText,
  Package,
  Barcode,
  Users,
  UserCheck,
  Receipt,
  Settings,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      fetchDashboardData(u.storeId || 'default');
    }
  }, []);

  const fetchDashboardData = async (storeId) => {
    try {
      const [prodRes, vouchRes] = await Promise.all([
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/vouchers?storeId=${storeId}`)
      ]);

      const prodData = await prodRes.json();
      const vouchData = await vouchRes.json();

      if (prodData.success) setProducts(prodData.products || []);
      if (vouchData.success) setVouchers(vouchData.vouchers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalVouchersCount = vouchers.length;
  const totalRevenue = vouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
  const totalPaid = vouchers.reduce((acc, v) => acc + (v.paidAmount || 0), 0);
  const totalDue = vouchers.reduce((acc, v) => acc + (v.dueAmount || 0), 0);
  const totalProfit = vouchers.reduce((acc, v) => acc + (v.profit || 0), 0);

  const lowStockProducts = products.filter(p => (p.quantity || 0) <= (p.minQuantity || 5));

  const quickActionCards = [
    { title: 'POS Terminal', desc: 'Fast Checkout & Billing', href: '/pos', icon: ShoppingCart, color: 'from-blue-500 to-blue-600', border: 'border-blue-500' },
    { title: 'Sales Reports', desc: 'View Vouchers & Bills', href: '/vouchers/history', icon: FileText, color: 'from-emerald-500 to-emerald-600', border: 'border-emerald-500' },
    { title: 'Inventory', desc: 'Manage Products & Stock', href: '/inventory', icon: Package, color: 'from-orange-500 to-orange-600', border: 'border-orange-500' },
    { title: 'Barcodes', desc: 'Batch Print Barcode Labels', href: '/barcodes', icon: Barcode, color: 'from-purple-500 to-purple-600', border: 'border-purple-500' },
    { title: 'Clients', desc: 'Customer Ledger & Dues', href: '/clients', icon: Users, color: 'from-teal-500 to-teal-600', border: 'border-teal-500' },
    { title: 'Salers', desc: 'Sales Rep Performance', href: '/salers', icon: UserCheck, color: 'from-pink-500 to-pink-600', border: 'border-pink-500' },
    { title: 'Expenses', desc: 'Track Income & Expenses', href: '/expenses', icon: Receipt, color: 'from-amber-500 to-amber-600', border: 'border-amber-500' },
    { title: 'Settings', desc: 'Store Branding & Backup', href: '/settings', icon: Settings, color: 'from-slate-700 to-slate-800', border: 'border-slate-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome, {user?.fullName || 'Store Admin'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Store: <span className="font-semibold text-blue-600">{user?.storeName || 'Main Outlet'}</span> | Overview of your POS activity today.
          </p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
        >
          <ShoppingCart size={18} />
          <span>Open POS Terminal</span>
        </Link>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-800">
            <AlertTriangle className="text-amber-600" size={24} />
            <div>
              <p className="font-semibold text-sm">Low Stock Alert ({lowStockProducts.length} Items)</p>
              <p className="text-xs text-amber-700">
                Some items are running low. Items: {lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}...
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Restock Inventory
          </Link>
        </div>
      )}

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {quickActionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`bg-white rounded-2xl p-5 border-l-4 ${card.border} shadow-sm hover:shadow-md transition duration-200 flex items-center space-x-4 group`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-600 transition truncate">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 truncate">{card.desc}</p>
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-600 transition" />
            </Link>
          );
        })}
      </div>

      {/* Performance Summary Metrics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
          <TrendingUp className="text-blue-600" size={20} />
          <span>Real-time Financial Overview</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Total Vouchers</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalVouchersCount}</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-600 font-medium">Total Sales Revenue</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">৳{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-xs text-emerald-600 font-medium">Total Cash Paid</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">৳{totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
            <p className="text-xs text-rose-600 font-medium">Total Pending Dues</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">৳{totalDue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="text-blue-600" size={20} />
            <span>Recent Sales Transactions</span>
          </h2>
          <Link href="/vouchers/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All Reports →
          </Link>
        </div>

        {vouchers.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No sales recorded yet. Click &quot;Open POS Terminal&quot; to generate your first invoice!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Voucher #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.slice(0, 5).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">{v.voucherNo}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{v.clientName}</td>
                    <td className="px-4 py-3 text-slate-600">{v.paymentMethod || 'Cash'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">৳{v.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        v.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
