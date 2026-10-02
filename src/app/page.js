'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Plus,
  Calendar,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [datePreset, setDatePreset] = useState('all'); // 'today' | 'yesterday' | '7days' | 'month' | 'last_month' | 'year' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadDashboardData(u.storeId || 'default');
    } else {
      setLoading(false);
    }
  }, []);

  const loadDashboardData = async (storeId) => {
    try {
      const [vRes, pRes, eRes, rRes] = await Promise.all([
        fetch(`/api/vouchers?storeId=${storeId}`),
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/expenses?storeId=${storeId}`),
        fetch(`/api/sales-return?storeId=${storeId}`)
      ]);

      const vData = await vRes.json();
      const pData = await pRes.json();
      const eData = await eRes.json();
      const rData = await rRes.json();

      if (vData.success) setVouchers(vData.vouchers || []);
      if (pData.success) setProducts(pData.products || []);
      if (eData.success) setExpenses((eData.data && eData.data.expense) || []);
      if (rData.success) setReturns(rData.returns || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Date Range Bounds
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'today') {
      return { 
        start: todayStart, 
        end: todayEnd, 
        label: 'Today (আজ)', 
        subLabel: todayStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
      };
    }
    if (datePreset === 'yesterday') {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return { 
        start: yStart, 
        end: yEnd, 
        label: 'Yesterday (গতকাল)', 
        subLabel: yStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
      };
    }
    if (datePreset === '7days') {
      const start7 = new Date(todayStart);
      start7.setDate(start7.getDate() - 6);
      return { 
        start: start7, 
        end: todayEnd, 
        label: 'Last 7 Days (গত ৭ দিন)', 
        subLabel: `${start7.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${todayEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    if (datePreset === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { 
        start: mStart, 
        end: todayEnd, 
        label: 'This Month (চলতি মাস)', 
        subLabel: `${mStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${todayEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    if (datePreset === 'last_month') {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { 
        start: lmStart, 
        end: lmEnd, 
        label: 'Last Month (গত মাস)', 
        subLabel: `${lmStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${lmEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    if (datePreset === 'year') {
      const yStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      return { 
        start: yStart, 
        end: todayEnd, 
        label: 'This Year (চলতি বছর)', 
        subLabel: `${yStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - ${todayEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      const cStart = new Date(customStartDate + 'T00:00:00');
      const cEnd = new Date(customEndDate + 'T23:59:59.999');
      return { 
        start: cStart, 
        end: cEnd, 
        label: 'Custom Range', 
        subLabel: `${cStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} to ${cEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    return { 
      start: null, 
      end: null, 
      label: 'All Time (সব সময়)', 
      subLabel: 'Complete Lifetime Records' 
    };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered Data based on Date Range
  const filteredVouchers = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return vouchers;
    return vouchers.filter((v) => {
      const vDate = new Date(v.createdAt || v.date);
      return vDate >= dateRange.start && vDate <= dateRange.end;
    });
  }, [vouchers, dateRange]);

  const filteredExpenses = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return expenses;
    return expenses.filter((e) => {
      const eDate = new Date(e.date || e.createdAt);
      return eDate >= dateRange.start && eDate <= dateRange.end;
    });
  }, [expenses, dateRange]);

  const filteredReturns = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return returns;
    return returns.filter((r) => {
      const rDate = new Date(r.createdAt || r.date);
      return rDate >= dateRange.start && rDate <= dateRange.end;
    });
  }, [returns, dateRange]);

  // Aggregated Financial Metrics
  const totalSales = filteredVouchers.reduce((acc, v) => acc + (Number(v.totalAmount) || 0), 0);
  const totalPaid = filteredVouchers.reduce((acc, v) => acc + (Number(v.paidAmount) || 0), 0);
  const totalDue = filteredVouchers.reduce((acc, v) => acc + (Number(v.dueAmount) || 0), 0);
  const totalExpense = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalReturnsAmount = filteredReturns.reduce((acc, r) => acc + (Number(r.totalRefundAmount) || 0), 0);
  const grossProfit = filteredVouchers.reduce((acc, v) => acc + (Number(v.profit) || 0), 0);
  const netProfit = Math.max(0, grossProfit - totalExpense - totalReturnsAmount);
  const netSales = Math.max(0, totalSales - totalReturnsAmount);

  const lowStockProducts = products.filter(
    (p) => (Number(p.quantity) || 0) <= (Number(p.minQuantity) || 5)
  );

  const handleApplyCustomDate = () => {
    if (customStartDate && customEndDate) {
      setDatePreset('custom');
      setShowCustomPicker(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold mb-3 border border-blue-500/30">
            <Sparkles size={13} />
            <span>Store Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome Back, <span className="text-blue-400">{user?.fullName || 'Store Owner'}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 flex items-center gap-2">
            <span>Outlet:</span>
            <span className="font-bold text-white bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {user?.storeName || 'Main BazarPOS Store'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/sales-return"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition shadow-sm"
          >
            <RotateCcw size={16} />
            <span>Returns & Warranty</span>
          </Link>
          <Link
            href="/pos"
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <ShoppingCart size={18} />
            <span>New Sale (POS)</span>
          </Link>
        </div>
      </div>

      {/* Date Filter & Period Selector Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Date Filter (তারিখ অনুযায়ী হিসাব)</h3>
                <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full">
                  {dateRange.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <span>{dateRange.subLabel}</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700">{filteredVouchers.length} Invoices</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700">{filteredExpenses.length} Expenses</span>
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'today', label: 'Today (আজ)' },
              { id: 'yesterday', label: 'Yesterday (গতকাল)' },
              { id: '7days', label: '7 Days (৭ দিন)' },
              { id: 'month', label: 'This Month (মাস)' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'year', label: 'Year (বছর)' },
              { id: 'all', label: 'All Time (সব)' }
            ].map((p) => {
              const active = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setDatePreset(p.id);
                    setShowCustomPicker(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                datePreset === 'custom' || showCustomPicker
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Filter size={13} />
              <span>Custom (কাস্টম)</span>
              <ChevronDown size={13} className={`transform transition ${showCustomPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker Accordion */}
        {showCustomPicker && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-50/70 p-3 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Date (শুরুর তারিখ)</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">End Date (শেষ তারিখ)</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={!customStartDate || !customEndDate}
                onClick={handleApplyCustomDate}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition"
              >
                Apply Range (ফিল্টার করুন)
              </button>
              <button
                onClick={() => {
                  setDatePreset('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setShowCustomPicker(false);
                }}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Financial Metrics Overview Cards (Filtered by Date Range) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Sales (মোট বিক্রি)</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-2">৳{totalSales.toLocaleString()}</p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-blue-600 font-bold">{filteredVouchers.length} Invoices</span>
            <span className="text-slate-400 font-medium">Net: ৳{netSales.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. Received Cash */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Cash Received (আদায়)</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <DollarSign size={18} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-2">৳{totalPaid.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Collected in Period</p>
        </div>

        {/* 3. Customer Due Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Due Created (বাকি)</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
              <CreditCard size={18} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-2">৳{totalDue.toLocaleString()}</p>
          <p className="text-[11px] text-rose-500 mt-2 font-semibold">Outstanding Due</p>
        </div>

        {/* 4. Operating Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Expenses (দোকান খরচ)</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
              <Receipt size={18} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-700 mt-2">৳{totalExpense.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">{filteredExpenses.length} Expense Bills</p>
        </div>

        {/* 5. Sales Returns & Refunds */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Returns (রিটার্ন ও রিফান্ড)</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <RotateCcw size={18} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-700 mt-2">৳{totalReturnsAmount.toLocaleString()}</p>
          <p className="text-[11px] text-amber-600 mt-2 font-semibold">{filteredReturns.length} Claims Logged</p>
        </div>

        {/* 6. Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition group bg-gradient-to-br from-teal-50/40 to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Net Profit (নেট লাভ)</span>
            <span className="p-2 bg-teal-100 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <Sparkles size={18} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-teal-700 mt-2">৳{netProfit.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Margin: ৳{grossProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Quick Actions & Shortcuts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          <Link
            href="/pos"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <ShoppingCart size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">POS Terminal</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Instant Billing</span>
          </Link>

          <Link
            href="/sales-return"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <RotateCcw size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">Sales Return</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Refund & Warranty</span>
          </Link>

          <Link
            href="/inventory"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Package size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">Products</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Catalog & Stock</span>
          </Link>

          <Link
            href="/clients"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Users size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">Customers</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Due & Ledger</span>
          </Link>

          <Link
            href="/reports?tab=sales"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <FileText size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">Sales Reports</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Detailed Analytics</span>
          </Link>

          <Link
            href="/expenses"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-rose-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Receipt size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">Expenses</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Bills & Rent</span>
          </Link>

          <Link
            href="/barcodes"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Barcode size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">Barcodes</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Sticker Print</span>
          </Link>

          <Link
            href="/settings"
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Settings size={20} />
            </div>
            <span className="font-bold text-xs text-slate-800">Settings</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Configuration</span>
          </Link>
        </div>
      </div>

      {/* Period Activity Summary & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Filtered Invoices Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Invoices in Selected Period ({dateRange.label})
              </h3>
              <p className="text-xs text-slate-500">
                Found {filteredVouchers.length} invoices matching date filter
              </p>
            </div>
            <Link
              href="/vouchers/history"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>View All History</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {filteredVouchers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Clock size={32} className="mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-bold text-sm text-slate-600">No Sales Invoices Found in This Date Range</p>
              <p className="text-xs text-slate-400 mt-1">Try switching to &quot;Today&quot;, &quot;This Month&quot; or &quot;All Time&quot;.</p>
              <button
                onClick={() => setDatePreset('all')}
                className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-100 transition"
              >
                Reset to All Time
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5">Invoice No</th>
                    <th className="pb-2.5">Date & Time</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5 text-right">Total</th>
                    <th className="pb-2.5 text-right">Paid</th>
                    <th className="pb-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.slice(0, 7).map((v) => (
                    <tr key={v.id || v.voucherNo} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 font-bold text-blue-600">
                        <Link href={`/invoice/${v.publicToken || v.id}`} className="hover:underline">
                          {v.voucherNo || v.voucherNumber || v.id}
                        </Link>
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                        {new Date(v.createdAt || v.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700">
                        {v.clientName || 'Walk-in'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-800">
                        ৳{Number(v.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-emerald-600">
                        ৳{Number(v.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : v.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {v.status || 'PAID'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Period Breakdown Summary</h3>
            <p className="text-xs text-slate-500">Accounting health for {dateRange.label}</p>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Gross Turnover</span>
                <span className="text-xs font-bold text-slate-800">৳{totalSales.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Sales Returns/Refunds</span>
                <span className="text-xs font-bold text-amber-600">- ৳{totalReturnsAmount.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Operating Expenses</span>
                <span className="text-xs font-bold text-purple-600">- ৳{totalExpense.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-xs text-emerald-800 font-bold">Estimated Net Profit</span>
                <span className="text-sm font-black text-emerald-700">৳{netProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Link
            href={`/reports?tab=sales`}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center transition flex items-center justify-center space-x-1.5"
          >
            <span>Detailed Accounting Report</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 space-y-3">
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

