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
  ArrowRight,
  PieChart
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
        label: 'Today', 
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
        label: 'Yesterday', 
        subLabel: yStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
      };
    }
    if (datePreset === '7days') {
      const start7 = new Date(todayStart);
      start7.setDate(start7.getDate() - 6);
      return { 
        start: start7, 
        end: todayEnd, 
        label: 'Last 7 Days', 
        subLabel: `${start7.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${todayEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    if (datePreset === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { 
        start: mStart, 
        end: todayEnd, 
        label: 'This Month', 
        subLabel: `${mStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${todayEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    if (datePreset === 'last_month') {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { 
        start: lmStart, 
        end: lmEnd, 
        label: 'Last Month', 
        subLabel: `${lmStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${lmEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
      };
    }
    if (datePreset === 'year') {
      const yStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      return { 
        start: yStart, 
        end: todayEnd, 
        label: 'This Year', 
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
      label: 'All Time', 
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
    <div className="space-y-4 sm:space-y-6 pb-12 overflow-x-hidden">
      {/* Top Banner & Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-7 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[11px] font-semibold mb-2 border border-blue-500/30">
            <Sparkles size={12} />
            <span>Store Control Center</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight truncate">
            Welcome Back, <span className="text-blue-400">{user?.fullName || 'Store Owner'}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400">Outlet:</span>
            <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 text-xs">
              {user?.storeName || 'Main BazarPOS Store'}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 relative z-10 w-full sm:w-auto">
          <Link
            href="/sales-return"
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition shadow-sm text-center"
          >
            <RotateCcw size={15} />
            <span className="truncate">Returns</span>
          </Link>
          <Link
            href="/pos"
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 text-center"
          >
            <ShoppingCart size={16} />
            <span className="truncate">New Sale (POS)</span>
          </Link>
        </div>
      </div>

      {/* Date Filter & Period Selector Toolbar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">Date Filter</h3>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full whitespace-nowrap">
                  {dateRange.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                <span>{dateRange.subLabel}</span>
                <span className="mx-1 text-slate-300">•</span>
                <span className="font-medium text-slate-700">{filteredVouchers.length} Invoices</span>
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons (Scrollable Chips on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap no-scrollbar">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: '7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' }
            ].map((p) => {
              const active = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setDatePreset(p.id);
                    setShowCustomPicker(false);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 whitespace-nowrap transition shrink-0 ${
                datePreset === 'custom' || showCustomPicker
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Filter size={12} />
              <span>Custom</span>
              <ChevronDown size={12} className={`transform transition ${showCustomPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker Accordion */}
        {showCustomPicker && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end bg-slate-50/70 p-3 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full text-xs font-medium px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full text-xs font-medium px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={!customStartDate || !customEndDate}
                onClick={handleApplyCustomDate}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition text-center"
              >
                Apply Range
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

      {/* Financial Metrics Overview Cards (2-cols on mobile, 6 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Total Sales</span>
            <span className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-800 mt-2 truncate">৳{totalSales.toLocaleString()}</p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-blue-600 font-bold truncate">{filteredVouchers.length} Inv</span>
            <span className="text-slate-400 font-medium truncate">Net: ৳{netSales.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. Received Cash */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Cash Received</span>
            <span className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="text-base sm:text-2xl font-black text-emerald-600 mt-2 truncate">৳{totalPaid.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-medium truncate">Collected Cash</p>
        </div>

        {/* 3. Customer Due Balance */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 transition group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Due Created</span>
            <span className="p-1.5 sm:p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition shrink-0">
              <CreditCard size={16} />
            </span>
          </div>
          <p className="text-base sm:text-2xl font-black text-rose-600 mt-2 truncate">৳{totalDue.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-rose-500 mt-1.5 font-semibold truncate">Outstanding Due</p>
        </div>

        {/* 4. Operating Expenses */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Expenses</span>
            <span className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
              <Receipt size={16} />
            </span>
          </div>
          <p className="text-base sm:text-2xl font-black text-purple-700 mt-2 truncate">৳{totalExpense.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-medium truncate">{filteredExpenses.length} Bills</p>
        </div>

        {/* 5. Sales Returns & Refunds */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Returns</span>
            <span className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
              <RotateCcw size={16} />
            </span>
          </div>
          <p className="text-base sm:text-2xl font-black text-amber-700 mt-2 truncate">৳{totalReturnsAmount.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-amber-600 mt-1.5 font-semibold truncate">{filteredReturns.length} Claims</p>
        </div>

        {/* 6. Net Profit */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition group bg-gradient-to-br from-teal-50/40 to-emerald-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 truncate">Net Profit</span>
            <span className="p-1.5 sm:p-2 bg-teal-100 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition shrink-0">
              <Sparkles size={16} />
            </span>
          </div>
          <p className="text-base sm:text-2xl font-black text-teal-700 mt-2 truncate">৳{netProfit.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 font-medium truncate">Margin: ৳{grossProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Sales, Paid & Due Circular Graphs Section */}
      {(() => {
        const totalAmountBase = Math.max(totalSales, 1);
        const paidPercent = totalSales > 0 ? Math.min(100, Math.round((totalPaid / totalAmountBase) * 100)) : 0;
        const duePercent = totalSales > 0 ? Math.min(100, Math.round((totalDue / totalAmountBase) * 100)) : 0;
        const returnPercent = totalSales > 0 ? Math.min(100, Math.round((totalReturnsAmount / totalAmountBase) * 100)) : 0;
        const profitMargin = totalSales > 0 ? Math.min(100, Math.round((netProfit / totalAmountBase) * 100)) : 0;

        // SVG Donut calculation: Circumference = 2 * PI * 65 ≈ 408.4
        const circumference = 2 * Math.PI * 65;
        const paidDash = (paidPercent / 100) * circumference;
        const dueDash = (duePercent / 100) * circumference;
        const returnDash = (returnPercent / 100) * circumference;
        const paidOffset = 0;
        const dueOffset = -paidDash;
        const returnOffset = -(paidDash + dueDash);

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <PieChart size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    Sales, Cash Paid & Due Analytics
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Visual cash flow recovery & liability ratio for <span className="font-semibold text-slate-700">{dateRange.label}</span>
                </p>
              </div>

              <span className="self-start sm:self-auto text-[11px] sm:text-xs px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full">
                Period: {dateRange.label}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* Left Column: Big Interactive SVG Doughnut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 relative">
                <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    {/* Background Track Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="16"
                    />

                    {/* Paid Cash Segment (Green) */}
                    {totalSales > 0 && paidPercent > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="65"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="16"
                        strokeDasharray={`${paidDash} ${circumference}`}
                        strokeDashoffset={paidOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    )}

                    {/* Due Segment (Red/Rose) */}
                    {totalSales > 0 && duePercent > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="65"
                        fill="transparent"
                        stroke="#f43f5e"
                        strokeWidth="16"
                        strokeDasharray={`${dueDash} ${circumference}`}
                        strokeDashoffset={dueOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    )}

                    {/* Returns Segment (Amber) */}
                    {totalSales > 0 && returnPercent > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="65"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="16"
                        strokeDasharray={`${returnDash} ${circumference}`}
                        strokeDashoffset={returnOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    )}
                  </svg>

                  {/* Doughnut Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Sales
                    </span>
                    <span className="text-sm sm:text-xl font-black text-slate-800 truncate max-w-[120px] sm:max-w-[140px]">
                      ৳{totalSales.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                      {paidPercent}% Paid
                    </span>
                  </div>
                </div>

                {/* Legend Below Chart */}
                <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-bold">
                  <div className="flex items-center space-x-1 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Paid ({paidPercent}%)</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <span>Due ({duePercent}%)</span>
                  </div>
                  {totalReturnsAmount > 0 && (
                    <div className="flex items-center space-x-1 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>Returns ({returnPercent}%)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Column: 3 Mini Circular Progress Rings */}
              <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3.5">
                {/* Mini Ring 1: Cash Recovery Rate */}
                <div className="p-3 sm:p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-800 truncate block">Cash Collection Rate</span>
                    <p className="text-sm sm:text-base font-black text-emerald-700 truncate">৳{totalPaid.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-medium truncate">Collected Cash Revenue</p>
                  </div>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 ml-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#d1fae5"
                        strokeWidth="3.8"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.8"
                        strokeDasharray={`${paidPercent}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[9px] sm:text-[10px] font-black text-emerald-800">{paidPercent}%</span>
                  </div>
                </div>

                {/* Mini Ring 2: Customer Due Liability */}
                <div className="p-3 sm:p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[11px] font-bold text-rose-800 truncate block">Due Liability Ratio</span>
                    <p className="text-sm sm:text-base font-black text-rose-700 truncate">৳{totalDue.toLocaleString()}</p>
                    <p className="text-[10px] text-rose-600 font-medium truncate">Outstanding Receivables</p>
                  </div>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 ml-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#ffe4e6"
                        strokeWidth="3.8"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3.8"
                        strokeDasharray={`${duePercent}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[9px] sm:text-[10px] font-black text-rose-800">{duePercent}%</span>
                  </div>
                </div>

                {/* Mini Ring 3: Profit Margin */}
                <div className="p-3 sm:p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[11px] font-bold text-teal-800 truncate block">Net Profit Margin</span>
                    <p className="text-sm sm:text-base font-black text-teal-700 truncate">৳{netProfit.toLocaleString()}</p>
                    <p className="text-[10px] text-teal-600 font-medium truncate">Net Profit Ratio</p>
                  </div>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 ml-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#ccfbf1"
                        strokeWidth="3.8"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="3.8"
                        strokeDasharray={`${profitMargin}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[9px] sm:text-[10px] font-black text-teal-800">{profitMargin}%</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Comparative Progress Bars & Ratios */}
              <div className="lg:col-span-3 bg-slate-50/50 p-3.5 sm:p-4 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Breakdown Distribution</h4>
                
                {/* Bar 1: Paid */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Paid Cash</span>
                    </span>
                    <span className="text-emerald-700 font-bold">{paidPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${paidPercent}%` }}></div>
                  </div>
                </div>

                {/* Bar 2: Due */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Customer Due</span>
                    </span>
                    <span className="text-rose-700 font-bold">{duePercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${duePercent}%` }}></div>
                  </div>
                </div>

                {/* Bar 3: Returns */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Returns/Refunds</span>
                    </span>
                    <span className="text-amber-700 font-bold">{returnPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${returnPercent}%` }}></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Invoices:</span>
                  <span className="font-bold text-slate-800">{filteredVouchers.length} Recorded</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Action Cards Grid (4 cols on mobile, 8 on desktop) */}
      <div>
        <h2 className="text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wider">Quick Actions & Shortcuts</h2>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3.5">
          <Link
            href="/pos"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <ShoppingCart size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">POS</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Instant Billing</span>
          </Link>

          <Link
            href="/sales-return"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <RotateCcw size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">Returns</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Refunds</span>
          </Link>

          <Link
            href="/inventory"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <Package size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">Products</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Catalog</span>
          </Link>

          <Link
            href="/clients"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <Users size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">Clients</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Due Ledger</span>
          </Link>

          <Link
            href="/reports?tab=sales"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <FileText size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">Reports</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Analytics</span>
          </Link>

          <Link
            href="/expenses"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-rose-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <Receipt size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">Expenses</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Bills</span>
          </Link>

          <Link
            href="/barcodes"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <Barcode size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">Barcodes</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Stickers</span>
          </Link>

          <Link
            href="/settings"
            className="p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-500 hover:shadow-md transition flex flex-col items-center text-center group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition">
              <Settings size={18} />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-slate-800 truncate w-full">Settings</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block mt-0.5">Config</span>
          </Link>
        </div>
      </div>

      {/* Period Activity Summary & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Filtered Invoices Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Invoices ({dateRange.label})
              </h3>
              <p className="text-xs text-slate-500">
                Found {filteredVouchers.length} matching invoices
              </p>
            </div>
            <Link
              href="/vouchers/history"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {filteredVouchers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 px-4">
              <Clock size={28} className="mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-bold text-sm text-slate-600">No Invoices in This Range</p>
              <p className="text-xs text-slate-400 mt-0.5">Try switching to &quot;Today&quot; or &quot;All Time&quot;.</p>
              <button
                onClick={() => setDatePreset('all')}
                className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-100 transition"
              >
                Reset to All Time
              </button>
            </div>
          ) : (
            <>
              {/* Mobile View: Clean App Cards (Zero Horizontal Scroll) */}
              <div className="block md:hidden space-y-2.5">
                {filteredVouchers.slice(0, 6).map((v) => (
                  <Link
                    key={v.id || v.voucherNo}
                    href={`/invoice/${v.publicToken || v.id}`}
                    className="block p-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-600">
                        {v.voucherNo || v.voucherNumber || v.id}
                      </span>
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
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {v.clientName || 'Walk-in Customer'}
                      </span>
                      <div className="text-right">
                        <span className="font-black text-slate-800">
                          ৳{Number(v.totalAmount || 0).toLocaleString()}
                        </span>
                        {Number(v.dueAmount || 0) > 0 && (
                          <span className="block text-[10px] font-bold text-rose-600">
                            Due: ৳{Number(v.dueAmount || 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>
                        {new Date(v.createdAt || v.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-blue-500 font-bold">View Invoice ➔</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop View: Full Table */}
              <div className="hidden md:block overflow-x-auto">
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
            </>
          )}
        </div>

        {/* Right 1 Col: Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Period Breakdown</h3>
            <p className="text-xs text-slate-500">Accounting health for {dateRange.label}</p>

            <div className="mt-3.5 space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Gross Turnover</span>
                <span className="text-xs font-bold text-slate-800">৳{totalSales.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Returns/Refunds</span>
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
            <span>Accounting Report</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs sm:text-sm">
              <AlertTriangle size={17} />
              <span>Low Stock Alerts ({lowStockProducts.length} Items)</span>
            </div>
            <Link href="/suppliers" className="text-xs font-bold text-rose-700 hover:underline">
              + Restock via Suppliers PO ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Code: {p.code}</p>
                </div>
                <span className="font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded text-[11px] shrink-0">
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

