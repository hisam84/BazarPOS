'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  FileText,
  Package,
  Users,
  Receipt,
  RotateCcw,
  Sparkles,
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
  Filter,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Clock,
  Wallet,
  ArrowDownCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { formatDhakaDateTime } from '@/lib/date-utils';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Date Filter State - Default to 'today' for operational clarity
  const [datePreset, setDatePreset] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const activeStoreIdRef = useRef('default');

  const loadDashboardData = useCallback(async (storeId, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const timestamp = Date.now();
      const [vRes, pRes, eRes, rRes] = await Promise.all([
        fetch(`/api/vouchers?storeId=${storeId}&_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/products?storeId=${storeId}&_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/expenses?storeId=${storeId}&_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/sales-return?storeId=${storeId}&_t=${timestamp}`, { cache: 'no-store' })
      ]);

      const [vData, pData, eData, rData] = await Promise.all([
        vRes.json(),
        pRes.json(),
        eRes.json(),
        rRes.json()
      ]);

      if (vData.success) setVouchers(vData.vouchers || []);
      if (pData.success) setProducts(pData.products || []);
      if (eData.success) setExpenses((eData.data && eData.data.expense) || []);
      if (rData.success) setReturns(rData.returns || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading real-time dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    let currentStoreId = 'default';

    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        currentStoreId = u.storeId || 'default';
        activeStoreIdRef.current = currentStoreId;
      } catch (e) {
        // Fallback
      }
    }

    // Initial load
    loadDashboardData(currentStoreId, true);

    // Real-time auto polling every 8 seconds when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadDashboardData(activeStoreIdRef.current, false);
      }
    }, 8000);

    // Instant sync when user switches tabs or returns to window
    const handleFocus = () => {
      loadDashboardData(activeStoreIdRef.current, false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(activeStoreIdRef.current, false);
      }
    };

    // Cross-tab storage change sync
    const handleStorage = (e) => {
      if (e.key === 'bazarpos_last_change' || e.key === 'bazarpos_user') {
        loadDashboardData(activeStoreIdRef.current, false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadDashboardData]);

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
        subLabel: `${yStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${todayEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      };
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      const cStart = new Date(customStartDate + 'T00:00:00');
      const cEnd = new Date(customEndDate + 'T23:59:59.999');
      return {
        start: cStart,
        end: cEnd,
        label: 'Custom Range',
        subLabel: `${cStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to ${cEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      };
    }
    return {
      start: null,
      end: null,
      label: 'All Time',
      subLabel: 'Lifetime business records'
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

  // Real-time Aggregated Financial Metrics
  const totalSales = useMemo(() => {
    return filteredVouchers.reduce((acc, v) => acc + (Number(v.totalAmount) || 0), 0);
  }, [filteredVouchers]);

  const totalCost = useMemo(() => {
    return filteredVouchers.reduce((acc, v) => acc + (Number(v.totalCost) || 0), 0);
  }, [filteredVouchers]);

  const totalPaid = useMemo(() => {
    return filteredVouchers.reduce((acc, v) => acc + (Number(v.paidAmount) || 0), 0);
  }, [filteredVouchers]);

  const totalDue = useMemo(() => {
    return filteredVouchers.reduce((acc, v) => acc + (Number(v.dueAmount) || 0), 0);
  }, [filteredVouchers]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalReturnsAmount = useMemo(() => {
    return filteredReturns.reduce((acc, r) => acc + (Number(r.totalRefundAmount) || 0), 0);
  }, [filteredReturns]);

  const netSales = Math.max(0, totalSales - totalReturnsAmount);
  const grossProfit = Math.max(0, netSales - totalCost);
  const netProfit = Math.max(0, grossProfit - totalExpense);
  const profitMargin = netSales > 0 ? ((netProfit / netSales) * 100).toFixed(1) : '0.0';
  const collectionRate = totalSales > 0 ? Math.min(100, Math.round((totalPaid / totalSales) * 100)) : 0;
  const dueRate = totalSales > 0 ? Math.min(100, Math.round((totalDue / totalSales) * 100)) : 0;

  // Real-time Payment Methods Distribution
  const paymentMethodsData = useMemo(() => {
    const map = {};
    filteredVouchers.forEach((v) => {
      const method = (v.paymentMethod || 'Cash').trim();
      const amount = Number(v.paidAmount) || 0;
      if (!map[method]) {
        map[method] = { method, amount: 0, count: 0 };
      }
      map[method].amount += amount;
      map[method].count += 1;
    });

    const list = Object.values(map).filter((item) => item.amount > 0 || item.count > 0);
    const totalCollected = list.reduce((acc, item) => acc + item.amount, 0);

    return list.map((item) => ({
      ...item,
      percentage: totalCollected > 0 ? Math.round((item.amount / totalCollected) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredVouchers]);

  // Real-time Sales Trend Data (Grouped for Selected Period)
  const chartTrendData = useMemo(() => {
    if (filteredVouchers.length === 0) return [];

    const isSingleDay = datePreset === 'today' || datePreset === 'yesterday';
    const groups = {};

    filteredVouchers.forEach((v) => {
      const d = new Date(v.createdAt || v.date);
      let key = '';
      let displayLabel = '';

      if (isSingleDay) {
        // Group by 2-3 hour slots
        const hour = d.getHours();
        const slot = Math.floor(hour / 3) * 3;
        key = `slot_${slot}`;
        displayLabel = `${slot % 12 === 0 ? 12 : slot % 12}${slot >= 12 ? 'pm' : 'am'}`;
      } else {
        // Group by date (YYYY-MM-DD)
        key = d.toISOString().split('T')[0];
        displayLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }

      if (!groups[key]) {
        groups[key] = { label: displayLabel, sales: 0, cogs: 0, profit: 0, sortKey: key };
      }
      const s = Number(v.totalAmount) || 0;
      const c = Number(v.totalCost) || 0;
      groups[key].sales += s;
      groups[key].cogs += c;
      groups[key].profit += Math.max(0, s - c);
    });

    return Object.values(groups).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredVouchers, datePreset]);

  // Real-time low stock products alert
  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) => (Number(p.quantity) || 0) <= (Number(p.minQuantity) || 5)
    );
  }, [products]);

  const handleApplyCustomDate = () => {
    if (customStartDate && customEndDate) {
      setDatePreset('custom');
      setShowCustomPicker(false);
    }
  };

  const handleManualRefresh = () => {
    loadDashboardData(activeStoreIdRef.current, false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Header Section - Clean, Compact, Professional with Real-time Sync Status */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center space-x-2.5 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              Welcome back, <span className="text-blue-600">{user?.fullName || 'Store Manager'}</span> 👋
            </h1>

            {/* Real-time Pulsing Live Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Data</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Store Context:</span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs border border-slate-200/80">
              {user?.storeName || 'Main BazarPOS Store'}
            </span>
            {lastUpdated && (
              <span className="text-[11px] text-slate-400">
                · Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons & Manual Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition border border-slate-200 cursor-pointer disabled:opacity-60"
            title="Refresh Real-time Metrics"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>

          <Link
            href="/sales-return"
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition"
            title="Process Sales Return & Warranties"
          >
            <RotateCcw size={14} className="text-slate-500" />
            <span>Returns</span>
          </Link>

          <Link
            href="/pos"
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition active:scale-98"
            title="Open POS Terminal to Create New Sale"
          >
            <ShoppingCart size={15} />
            <span>+ New Sale</span>
          </Link>
        </div>
      </div>

      {/* 2. Compact Date Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
              <Calendar size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">Reporting Period:</span>
                <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200/60">
                  {dateRange.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {dateRange.subLabel} · <span className="font-semibold text-slate-700">{filteredVouchers.length} Invoices</span>
              </p>
            </div>
          </div>

          {/* Filter Preset Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 whitespace-nowrap transition cursor-pointer ${
                datePreset === 'custom' || showCustomPicker
                  ? 'bg-blue-600 text-white shadow-xs'
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
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end bg-slate-50/80 p-3 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={!customStartDate || !customEndDate}
                onClick={handleApplyCustomDate}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition"
              >
                Apply Range
              </button>
              <button
                onClick={() => {
                  setDatePreset('today');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setShowCustomPicker(false);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Real-time KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              <div className="h-6 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Total Sales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Sales</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <TrendingUp size={14} />
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-2 truncate">৳{totalSales.toLocaleString()}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{filteredVouchers.length} Invoices</span>
              <span className="font-medium text-slate-600">Net ৳{netSales.toLocaleString()}</span>
            </div>
          </div>

          {/* 2. Paid / Cash Received */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cash Received</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <DollarSign size={14} />
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-2 truncate">৳{totalPaid.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
              {collectionRate}% collected
            </p>
          </div>

          {/* 3. Customer Due */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Customer Due</span>
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <CreditCard size={14} />
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-rose-600 mt-2 truncate">৳{totalDue.toLocaleString()}</p>
            <p className="text-[11px] text-rose-600 font-semibold mt-1 truncate">
              {dueRate}% outstanding
            </p>
          </div>

          {/* 4. Cost of Goods Sold (COGS) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">COGS</span>
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Package size={14} />
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-indigo-700 mt-2 truncate">৳{totalCost.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Product purchase cost
            </p>
          </div>

          {/* 5. Operating Expenses */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Expenses</span>
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <Receipt size={14} />
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-700 mt-2 truncate">৳{totalExpense.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {filteredExpenses.length} Operating bills
            </p>
          </div>

          {/* 6. Net Profit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition bg-gradient-to-b from-teal-50/20 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Net Profit</span>
              <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg shrink-0">
                <Sparkles size={14} />
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-teal-700 mt-2 truncate">৳{netProfit.toLocaleString()}</p>
            <p className="text-[11px] text-teal-800 font-bold mt-1 truncate">
              {profitMargin}% margin
            </p>
          </div>
        </div>
      )}

      {/* 4. Core Performance & Financial Summary Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Sales & Profit Activity Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                  <BarChart3 size={16} className="text-blue-600" />
                  <span>Sales & Profit Trend</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Performance timeline for <span className="font-semibold text-slate-700">{dateRange.label}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3 text-[11px] font-semibold">
                <div className="flex items-center space-x-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                  <span>Sales</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-300"></span>
                  <span>COGS</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-500"></span>
                  <span>Profit</span>
                </div>
              </div>
            </div>

            {/* Trend Bar Chart Visualization */}
            <div className="mt-4">
              {chartTrendData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Clock size={28} className="opacity-40 mb-2 text-slate-400" />
                  <p className="font-semibold text-xs sm:text-sm text-slate-600">No Sales Recorded in this Period</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sales trends will automatically appear once transactions are made.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Visual Bar Columns */}
                  <div className="h-52 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
                    {(() => {
                      const maxVal = Math.max(...chartTrendData.map((d) => d.sales), 100);
                      return chartTrendData.map((item, idx) => {
                        const salesH = Math.max(8, Math.round((item.sales / maxVal) * 100));
                        const cogsH = Math.max(4, Math.round((item.cogs / maxVal) * 100));
                        const profitH = Math.max(4, Math.round((item.profit / maxVal) * 100));

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[28px]">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 shadow-lg whitespace-nowrap">
                              <p className="font-bold">{item.label}</p>
                              <p>Sales: ৳{item.sales.toLocaleString()}</p>
                              <p>Profit: ৳{item.profit.toLocaleString()}</p>
                            </div>

                            <div className="w-full max-w-[36px] flex items-end justify-center gap-0.5 h-full pb-1">
                              <div
                                style={{ height: `${salesH}%` }}
                                className="w-1/3 bg-blue-600 rounded-t-xs transition-all duration-300 group-hover:bg-blue-700"
                                title={`Sales: ৳${item.sales}`}
                              />
                              <div
                                style={{ height: `${cogsH}%` }}
                                className="w-1/3 bg-indigo-300 rounded-t-xs transition-all duration-300 group-hover:bg-indigo-400"
                                title={`COGS: ৳${item.cogs}`}
                              />
                              <div
                                style={{ height: `${profitH}%` }}
                                className="w-1/3 bg-teal-500 rounded-t-xs transition-all duration-300 group-hover:bg-teal-600"
                                title={`Profit: ৳${item.profit}`}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 truncate w-full text-center mt-1">
                              {item.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated Gross: <strong className="text-slate-800">৳{totalSales.toLocaleString()}</strong></span>
            <span>Est. Gross Profit: <strong className="text-teal-700">৳{grossProfit.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Right 1 Col: Financial Summary (P&L Breakdown) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <FileText size={16} className="text-slate-700" />
                <span>Financial Summary</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Period income statement structure</p>
            </div>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 font-medium">Gross Sales</span>
                <span className="font-bold text-slate-900">৳{totalSales.toLocaleString()}</span>
              </div>

              {totalReturnsAmount > 0 && (
                <div className="p-2.5 bg-amber-50/50 rounded-lg flex items-center justify-between">
                  <span className="text-amber-800 font-medium">Sales Returns & Refunds</span>
                  <span className="font-bold text-amber-700">- ৳{totalReturnsAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="p-2.5 bg-slate-50/60 rounded-lg flex items-center justify-between border-t border-slate-200/60">
                <span className="text-slate-700 font-semibold">Net Sales</span>
                <span className="font-bold text-slate-900">৳{netSales.toLocaleString()}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 font-medium">Cost of Goods Sold (COGS)</span>
                <span className="font-bold text-indigo-700">- ৳{totalCost.toLocaleString()}</span>
              </div>

              <div className="p-2.5 bg-slate-50/60 rounded-lg flex items-center justify-between border-t border-slate-200/60">
                <span className="text-slate-700 font-semibold">Gross Profit</span>
                <span className="font-bold text-slate-900">৳{grossProfit.toLocaleString()}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 font-medium">Operating Expenses</span>
                <span className="font-bold text-amber-700">- ৳{totalExpense.toLocaleString()}</span>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-900 block">Net Profit</span>
                  <span className="text-[10px] text-teal-700 font-medium">{profitMargin}% margin</span>
                </div>
                <span className="text-base font-extrabold text-teal-800">৳{netProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Link
            href="/reports?tab=income"
            className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl text-center transition flex items-center justify-center space-x-1.5"
          >
            <span>View Full P&L Report</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 5. Payment Methods Summary & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <Wallet size={15} className="text-emerald-600" />
                <span>Payment Methods</span>
              </h3>
              <p className="text-[11px] text-slate-500">Collected distribution in period</p>
            </div>
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              Total: ৳{totalPaid.toLocaleString()}
            </span>
          </div>

          {paymentMethodsData.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-600">No payment records in range</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {paymentMethodsData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{item.method}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.count} bills)</span>
                    </span>
                    <span className="font-bold text-slate-900">৳{item.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streamlined Quick Actions (6 Purposeful SaaS Actions) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Quick Actions</h3>
              <p className="text-[11px] text-slate-500">Direct shortcuts for frequent operations</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
              <Link
                href="/pos"
                className="p-3 bg-blue-50/40 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-xl transition flex items-center space-x-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ShoppingCart size={15} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">New Sale</span>
                  <span className="text-[10px] text-slate-500 block truncate">POS Terminal</span>
                </div>
              </Link>

              <Link
                href="/inventory?action=new"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition flex items-center space-x-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Package size={15} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">Add Product</span>
                  <span className="text-[10px] text-slate-500 block truncate">Inventory item</span>
                </div>
              </Link>

              <Link
                href="/inventory?action=purchase"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition flex items-center space-x-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ArrowDownCircle size={15} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">New Purchase</span>
                  <span className="text-[10px] text-slate-500 block truncate">Supplier order</span>
                </div>
              </Link>

              <Link
                href="/clients"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition flex items-center space-x-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Users size={15} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">Customers</span>
                  <span className="text-[10px] text-slate-500 block truncate">Due & Ledgers</span>
                </div>
              </Link>

              <Link
                href="/expenses"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition flex items-center space-x-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Receipt size={15} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">Expenses</span>
                  <span className="text-[10px] text-slate-500 block truncate">Record bill</span>
                </div>
              </Link>

              <Link
                href="/reports?tab=sales"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition flex items-center space-x-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <FileText size={15} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">Reports</span>
                  <span className="text-[10px] text-slate-500 block truncate">Sales analytics</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Low Stock Attention Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs sm:text-sm">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>Low Stock Attention ({lowStockProducts.length} Items)</span>
            </div>
            <Link
              href="/inventory?action=purchase"
              className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline flex items-center space-x-1"
            >
              <span>+ Create Restock Purchase Order</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {lowStockProducts.slice(0, 6).map((p) => {
              const qty = Number(p.quantity) || 0;
              const isZero = qty === 0;
              return (
                <div
                  key={p.id}
                  className="bg-white p-3 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Code: {p.code}</p>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                      isZero
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isZero ? 'Out of stock' : `${qty} left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Recent Invoices Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Recent Sales & Invoices ({dateRange.label})
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing {filteredVouchers.slice(0, 8).length} of {filteredVouchers.length} matching sales
            </p>
          </div>
          <Link
            href="/vouchers/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
          >
            <span>View All Sales</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {filteredVouchers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 px-4">
            <Clock size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-bold text-xs sm:text-sm text-slate-700">No Sales in Selected Period</p>
            <p className="text-xs text-slate-500 mt-0.5">Start by ringing up a sale in the POS terminal.</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Link
                href="/pos"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs"
              >
                + New Sale
              </Link>
              <button
                onClick={() => setDatePreset('all')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                View All Time
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View: Clean, readable cards without horizontal scroll */}
            <div className="block md:hidden space-y-2.5">
              {filteredVouchers.slice(0, 6).map((v) => (
                <Link
                  key={v.id || v.voucherNo}
                  href={`/invoice/${v.publicToken || v.id}`}
                  className="block p-3 rounded-xl border border-slate-200/90 hover:border-blue-300 bg-slate-50/40 hover:bg-blue-50/20 transition"
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
                      <span className="font-bold text-slate-900">
                        ৳{Number(v.totalAmount || 0).toLocaleString()}
                      </span>
                      {Number(v.dueAmount || 0) > 0 && (
                        <span className="block text-[10px] font-semibold text-rose-600">
                          Due: ৳{Number(v.dueAmount || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{formatDhakaDateTime(v.createdAt || v.date)}</span>
                    <span className="text-blue-600 font-bold">View Invoice ➔</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop View: Clean Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5 font-medium">Invoice No</th>
                    <th className="pb-2.5 font-medium">Date & Time</th>
                    <th className="pb-2.5 font-medium">Customer</th>
                    <th className="pb-2.5 font-medium text-right">Total</th>
                    <th className="pb-2.5 font-medium text-right">Paid</th>
                    <th className="pb-2.5 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.slice(0, 8).map((v) => (
                    <tr key={v.id || v.voucherNo} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 font-bold text-blue-600">
                        <Link href={`/invoice/${v.publicToken || v.id}`} className="hover:underline">
                          {v.voucherNo || v.voucherNumber || v.id}
                        </Link>
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                        {formatDhakaDateTime(v.createdAt || v.date)}
                      </td>
                      <td className="py-2.5 font-medium text-slate-700">
                        {v.clientName || 'Walk-in Customer'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ৳{Number(v.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-medium text-emerald-600">
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
    </div>
  );
}
