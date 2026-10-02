'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  BarChart3, TrendingUp, DollarSign, PackageCheck, Printer, Calendar, 
  Download, Filter, ArrowUpRight, ArrowDownRight, Tag, ShoppingCart, 
  Receipt, Wallet, Layers, CheckCircle2, AlertTriangle, Building2, UserCheck
} from 'lucide-react';

function ReportsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'income' | 'expenses' | 'stock'
  
  // Data states
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [storeInfo, setStoreInfo] = useState({ name: 'BazarPOS Store', address: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [datePreset, setDatePreset] = useState('month'); // 'today' | 'yesterday' | '7days' | 'month' | 'last_month' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Additional Sub-filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['sales', 'income', 'expenses', 'stock'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadReportData(u.storeId || 'default');
      loadStoreSettings(u.storeId || 'default', u);
    } else {
      setLoading(false);
    }
  }, []);

  const loadStoreSettings = async (storeId, userObj) => {
    try {
      const res = await fetch(`/api/invoice-settings?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.settings) {
        setStoreInfo({
          name: data.settings.companyName || userObj.storeName || 'BazarPOS Store',
          address: data.settings.address || '',
          phone: data.settings.phone || userObj.phone || '',
          email: data.settings.email || userObj.email || ''
        });
      } else {
        setStoreInfo({
          name: userObj.storeName || 'BazarPOS Store',
          address: userObj.address || '',
          phone: userObj.phone || '',
          email: userObj.email || ''
        });
      }
    } catch (err) {
      // fallback
    }
  };

  const loadReportData = async (storeId) => {
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

  // Date Range Calculator
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (datePreset === 'today') {
      return { start: todayStart, end: todayEnd, label: 'Today (' + todayStart.toLocaleDateString() + ')' };
    }
    if (datePreset === 'yesterday') {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return { start: yStart, end: yEnd, label: 'Yesterday (' + yStart.toLocaleDateString() + ')' };
    }
    if (datePreset === '7days') {
      const start7 = new Date(todayStart);
      start7.setDate(start7.getDate() - 6);
      return { start: start7, end: todayEnd, label: 'Last 7 Days (' + start7.toLocaleDateString() + ' - ' + todayEnd.toLocaleDateString() + ')' };
    }
    if (datePreset === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start: mStart, end: todayEnd, label: 'This Month (' + mStart.toLocaleDateString() + ' - ' + todayEnd.toLocaleDateString() + ')' };
    }
    if (datePreset === 'last_month') {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: lmStart, end: lmEnd, label: 'Last Month (' + lmStart.toLocaleDateString() + ' - ' + lmEnd.toLocaleDateString() + ')' };
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      const cStart = new Date(customStartDate + 'T00:00:00');
      const cEnd = new Date(customEndDate + 'T23:59:59');
      return { start: cStart, end: cEnd, label: 'Custom Range (' + customStartDate + ' to ' + customEndDate + ')' };
    }
    return { start: null, end: null, label: 'All Time' };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered Vouchers (Sales)
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      if (dateRange.start && dateRange.end) {
        const vDate = new Date(v.createdAt || v.date);
        if (vDate < dateRange.start || vDate > dateRange.end) return false;
      }
      if (paymentMethodFilter !== 'all') {
        const method = (v.paymentMethod || 'cash').toLowerCase();
        if (method !== paymentMethodFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [vouchers, dateRange, paymentMethodFilter]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (dateRange.start && dateRange.end) {
        const eDate = new Date(e.date || e.createdAt);
        if (eDate < dateRange.start || eDate > dateRange.end) return false;
      }
      if (selectedCategory !== 'all') {
        if ((e.category || 'General').toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }
      return true;
    });
  }, [expenses, dateRange, selectedCategory]);

  // Filtered Stock Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'all') {
        if ((p.category || 'Uncategorized').toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }
      if (selectedBrand !== 'all') {
        if ((p.brand || 'No Brand').toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand]);

  // Categories & Brands list for filters
  const categoriesList = useMemo(() => {
    const set = new Set();
    products.forEach(p => p.category && set.add(p.category));
    expenses.forEach(e => e.category && set.add(e.category));
    return Array.from(set);
  }, [products, expenses]);

  const brandsList = useMemo(() => {
    const set = new Set();
    products.forEach(p => p.brand && set.add(p.brand));
    return Array.from(set);
  }, [products]);

  // Sales Summary Metrics
  const salesMetrics = useMemo(() => {
    const totalSales = filteredVouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
    const totalCost = filteredVouchers.reduce((acc, v) => acc + (v.totalCost || 0), 0);
    const totalDiscount = filteredVouchers.reduce((acc, v) => acc + (v.discount || 0), 0);
    const totalPaid = filteredVouchers.reduce((acc, v) => acc + (v.paidAmount || 0), 0);
    const totalDue = filteredVouchers.reduce((acc, v) => acc + (v.dueAmount || 0), 0);
    const grossProfit = totalSales - totalCost;
    const count = filteredVouchers.length;
    const avgOrderValue = count > 0 ? totalSales / count : 0;
    return { totalSales, totalCost, totalDiscount, totalPaid, totalDue, grossProfit, count, avgOrderValue };
  }, [filteredVouchers]);

  // Expense Summary Metrics
  const expenseMetrics = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const count = filteredExpenses.length;
    // Category Breakdown
    const byCategory = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'General';
      byCategory[cat] = (byCategory[cat] || 0) + (Number(e.amount) || 0);
    });
    return { totalAmount, count, byCategory };
  }, [filteredExpenses]);

  // Income / P&L Metrics
  const pnlMetrics = useMemo(() => {
    const revenue = salesMetrics.totalSales;
    const cogs = salesMetrics.totalCost;
    const grossProfit = revenue - cogs;
    const operatingExpenses = expenseMetrics.totalAmount;
    const netProfit = grossProfit - operatingExpenses;
    const grossMarginPct = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
    const netMarginPct = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;
    return { revenue, cogs, grossProfit, operatingExpenses, netProfit, grossMarginPct, netMarginPct };
  }, [salesMetrics, expenseMetrics]);

  // Stock Summary Metrics
  const stockMetrics = useMemo(() => {
    const totalQty = filteredProducts.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const totalCostVal = filteredProducts.reduce((acc, p) => acc + ((Number(p.costPrice) || 0) * (Number(p.quantity) || 0)), 0);
    const totalRetailVal = filteredProducts.reduce((acc, p) => acc + ((Number(p.sellingPrice) || 0) * (Number(p.quantity) || 0)), 0);
    const potentialProfit = totalRetailVal - totalCostVal;
    const lowStockCount = filteredProducts.filter(p => (Number(p.quantity) || 0) <= (Number(p.minStockAlert) || 5)).length;
    const outOfStockCount = filteredProducts.filter(p => (Number(p.quantity) || 0) <= 0).length;
    return { totalQty, totalCostVal, totalRetailVal, potentialProfit, lowStockCount, outOfStockCount, totalSkus: filteredProducts.length };
  }, [filteredProducts]);

  // CSV Export for active tab
  const handleExportCsv = () => {
    let csv = '';
    const dateStr = new Date().toISOString().slice(0, 10);

    if (activeTab === 'sales') {
      csv = "Invoice No,Date,Customer,Phone,Items Qty,Subtotal,Discount,Total Amount,Paid,Due,Payment Method\n";
      filteredVouchers.forEach(v => {
        const d = new Date(v.createdAt || v.date).toLocaleDateString();
        csv += `"${v.voucherNumber || v.id}","${d}","${v.clientName || 'Walk-in'}","${v.clientPhone || ''}",${v.items?.length || 0},${v.subtotal || v.totalAmount},${v.discount || 0},${v.totalAmount || 0},${v.paidAmount || 0},${v.dueAmount || 0},"${v.paymentMethod || 'Cash'}"\n`;
      });
      downloadFile(csv, `sales_report_${dateStr}.csv`);
    } else if (activeTab === 'income') {
      csv = "Metric,Amount (BDT)\n";
      csv += `"Gross Sales Revenue",${pnlMetrics.revenue}\n`;
      csv += `"Cost of Goods Sold (COGS)",${pnlMetrics.cogs}\n`;
      csv += `"Gross Profit",${pnlMetrics.grossProfit}\n`;
      csv += `"Operating Expenses",${pnlMetrics.operatingExpenses}\n`;
      csv += `"Net Business Profit",${pnlMetrics.netProfit}\n`;
      csv += `"Gross Margin %",${pnlMetrics.grossMarginPct}%\n`;
      csv += `"Net Margin %",${pnlMetrics.netMarginPct}%\n`;
      downloadFile(csv, `pnl_statement_${dateStr}.csv`);
    } else if (activeTab === 'expenses') {
      csv = "Date,Category,Description,Payment Source,Amount (BDT)\n";
      filteredExpenses.forEach(e => {
        const d = new Date(e.date || e.createdAt).toLocaleDateString();
        csv += `"${d}","${e.category || 'General'}","${(e.description || '').replace(/"/g, '""')}","${e.paymentSource || 'Cash'}",${e.amount || 0}\n`;
      });
      downloadFile(csv, `expense_report_${dateStr}.csv`);
    } else if (activeTab === 'stock') {
      csv = "Product Code,Barcode,Product Name,Brand,Category,Stock Qty,Unit,Cost Price,Selling Price,Total Cost Value,Total Retail Value,Status\n";
      filteredProducts.forEach(p => {
        const qty = Number(p.quantity) || 0;
        const cost = Number(p.costPrice) || 0;
        const sell = Number(p.sellingPrice) || 0;
        const status = qty <= 0 ? 'Out of Stock' : (qty <= (p.minStockAlert || 5) ? 'Low Stock' : 'In Stock');
        csv += `"${p.code || ''}","${p.barcode || ''}","${(p.name || '').replace(/"/g, '""')}","${p.brand || 'No Brand'}","${p.category || 'General'}",${qty},"${p.unit || 'pcs'}",${cost},${sell},${cost * qty},${sell * qty},"${status}"\n`;
      });
      downloadFile(csv, `stock_valuation_report_${dateStr}.csv`);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Dynamic Print CSS for standard A4 layout */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            font-size: 10pt !important;
            line-height: 1.3 !important;
          }
          .no-print, aside, nav, header, button, .date-filter-bar {
            display: none !important;
          }
          .printable-report {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 16px !important;
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 10px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8.5pt !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            border-bottom: 1.5px solid #94a3b8 !important;
            padding: 6px 8px !important;
            font-weight: 700 !important;
          }
          td {
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 5.5px 8px !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          .kpi-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }
          .kpi-card {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            border-radius: 6px !important;
            background: #f8fafc !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
          }
          .border {
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Screen Top Header (hidden on print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <BarChart3 className="text-blue-600" size={24} />
            <span>Store Reports & Financial Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detailed A4-optimized reporting for Sales Invoices, Net Profit/Loss Statement, Operating Expenses, and Stock Valuation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 text-xs"
          >
            <Printer size={16} />
            <span>Print A4 Report</span>
          </button>
        </div>
      </div>

      {/* Report Tabs (hidden on print) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2 no-print">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'sales'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingCart size={16} />
          <span>Sales Report</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'income'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp size={16} />
          <span>Income & Profit / Loss</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'expenses'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Receipt size={16} />
          <span>Operating Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'stock'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PackageCheck size={16} />
          <span>Stock Valuation Report</span>
        </button>
      </div>

      {/* Date & Filter Controls (hidden on print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 no-print date-filter-bar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1">
              <Calendar size={14} />
              <span>Date Filter:</span>
            </span>
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: '7days', label: 'Last 7 Days' },
              { key: 'month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: 'all', label: 'All Time' },
              { key: 'custom', label: 'Custom Range' },
            ].map(preset => (
              <button
                key={preset.key}
                onClick={() => setDatePreset(preset.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  datePreset === preset.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Payment Method or Category sub-filters */}
          {activeTab === 'sales' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-bold">Payment:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bkash">bKash / MFS</option>
                <option value="due">Due / Credit</option>
              </select>
            </div>
          )}

          {(activeTab === 'expenses' || activeTab === 'stock') && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-bold">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-bold">Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Brands</option>
                {brandsList.map((b, i) => (
                  <option key={i} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Custom Date Inputs if selected */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600">Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600">End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE AREA (A4 Standard Format) */}
      <div className="printable-report space-y-6">
        {/* Printable Business Header (visible in print & on screen) */}
        <div className="print-header hidden sm:block bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{storeInfo.name}</h2>
              {storeInfo.address && <p className="text-xs text-slate-500 mt-0.5">{storeInfo.address}</p>}
              <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1 font-mono">
                {storeInfo.phone && <span>Tel: {storeInfo.phone}</span>}
                {storeInfo.email && <span>Email: {storeInfo.email}</span>}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                {activeTab === 'sales' && 'Detailed Sales Report'}
                {activeTab === 'income' && 'Income & Profit/Loss Statement'}
                {activeTab === 'expenses' && 'Operating Expense Report'}
                {activeTab === 'stock' && 'Inventory Stock Valuation Report'}
              </span>
              <p className="text-xs font-semibold text-slate-700 mt-1.5">
                Period: <span className="font-bold text-blue-600">{dateRange.label}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* TAB 1: SALES REPORT */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 kpi-grid">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Sales Revenue</span>
                <p className="text-xl font-bold font-mono text-blue-700 mt-1">৳{salesMetrics.totalSales.toLocaleString()}</p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{salesMetrics.count} Total Invoices</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gross Profit</span>
                <p className="text-xl font-bold font-mono text-emerald-700 mt-1">৳{salesMetrics.grossProfit.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">After Product COGS</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Collected Cash / Paid</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">৳{salesMetrics.totalPaid.toLocaleString()}</p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Discount: ৳{salesMetrics.totalDiscount.toLocaleString()}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Uncollected Due</span>
                <p className="text-xl font-bold font-mono text-rose-600 mt-1">৳{salesMetrics.totalDue.toLocaleString()}</p>
                <span className="text-[10px] text-rose-500 mt-0.5 block">Credit Sales Balance</span>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <ShoppingCart size={16} className="text-blue-600" />
                  <span>Sales Invoices Breakdown ({filteredVouchers.length} records)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3">Invoice #</th>
                      <th className="px-3 py-3">Date & Time</th>
                      <th className="px-3 py-3">Customer</th>
                      <th className="px-3 py-3 text-center">Items</th>
                      <th className="px-3 py-3 text-right">Subtotal</th>
                      <th className="px-3 py-3 text-right">Discount</th>
                      <th className="px-3 py-3 text-right">Grand Total</th>
                      <th className="px-3 py-3 text-right">Paid</th>
                      <th className="px-3 py-3 text-right">Due</th>
                      <th className="px-3 py-3 text-right">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredVouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 font-bold text-indigo-700">{v.voucherNumber || v.id}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-sans">{new Date(v.createdAt || v.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2.5 font-sans font-medium text-slate-800">
                          <span>{v.clientName || 'Walk-in Customer'}</span>
                          {v.clientPhone && <span className="block text-[10px] text-slate-400">{v.clientPhone}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-600">{v.items?.length || 1}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">৳{Number(v.subtotal || v.totalAmount).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-amber-600">{v.discount ? `৳${Number(v.discount).toLocaleString()}` : '-'}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">৳{Number(v.totalAmount).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600">৳{Number(v.paidAmount || 0).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-rose-600">{v.dueAmount > 0 ? `৳${Number(v.dueAmount).toLocaleString()}` : '৳0'}</td>
                        <td className="px-3 py-2.5 text-right uppercase text-[10px] font-sans font-bold text-slate-500">{v.paymentMethod || 'Cash'}</td>
                      </tr>
                    ))}
                    {filteredVouchers.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center py-10 text-slate-400 font-sans text-xs">
                          No sales records found for this selected period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Totals Footer */}
                  {filteredVouchers.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold font-mono border-t-2 border-slate-300">
                      <tr>
                        <td colSpan="4" className="px-3 py-3 font-sans text-slate-800 uppercase text-xs">Summary Totals</td>
                        <td className="px-3 py-3 text-right text-slate-700">৳{filteredVouchers.reduce((a, v) => a + (v.subtotal || v.totalAmount || 0), 0).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-amber-700">৳{salesMetrics.totalDiscount.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-blue-700 text-sm">৳{salesMetrics.totalSales.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-emerald-700 text-sm">৳{salesMetrics.totalPaid.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-rose-700 text-sm">৳{salesMetrics.totalDue.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCOME & PROFIT / LOSS */}
        {activeTab === 'income' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 kpi-grid">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Sales Revenue</span>
                <p className="text-2xl font-bold font-mono text-blue-700 mt-1">৳{pnlMetrics.revenue.toLocaleString()}</p>
                <span className="text-[11px] text-slate-500 mt-1 block">From {filteredVouchers.length} sales orders</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Gross Profit</span>
                <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">৳{pnlMetrics.grossProfit.toLocaleString()}</p>
                <span className="text-[11px] text-emerald-600 mt-1 block">Gross Margin: {pnlMetrics.grossMarginPct}%</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-md kpi-card">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Net Business Profit</span>
                <p className="text-3xl font-bold font-mono text-emerald-400 mt-1">৳{pnlMetrics.netProfit.toLocaleString()}</p>
                <span className="text-[11px] text-slate-300 mt-1 block">Net Margin: {pnlMetrics.netMarginPct}%</span>
              </div>
            </div>

            {/* Income & P&L Statement Structured Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
              <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-200 flex items-center justify-between">
                <span>Profit & Loss Statement ({dateRange.label})</span>
                <span className="text-xs text-slate-500 font-normal">All amounts in BDT (৳)</span>
              </h3>

              <div className="space-y-4">
                {/* 1. Operating Revenue */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between font-bold text-slate-800 text-sm">
                    <span>1. Gross Sales Revenue</span>
                    <span className="font-mono">৳{pnlMetrics.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pl-4">
                    <span>Less: Total Discounts Given</span>
                    <span className="font-mono text-amber-600">-৳{salesMetrics.totalDiscount.toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Cost of Goods Sold */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between font-bold text-slate-800 text-sm">
                    <span>2. Cost of Goods Sold (COGS)</span>
                    <span className="font-mono text-slate-700">-৳{pnlMetrics.cogs.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-4">Direct inventory purchase costs for items sold.</p>
                </div>

                {/* Gross Profit Result */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-900 text-sm block">GROSS OPERATING PROFIT</span>
                    <span className="text-xs text-emerald-700">Revenue minus Cost of Goods Sold</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-700">৳{pnlMetrics.grossProfit.toLocaleString()}</span>
                </div>

                {/* 3. Operating Expenses Breakdown */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between font-bold text-slate-800 text-sm border-b pb-2">
                    <span>3. Operating & Administrative Expenses</span>
                    <span className="font-mono text-rose-600">-৳{pnlMetrics.operatingExpenses.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1.5 pl-4 text-xs">
                    {Object.keys(expenseMetrics.byCategory).map((cat, i) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span>{cat} Expenses</span>
                        <span className="font-mono font-medium">৳{expenseMetrics.byCategory[cat].toLocaleString()}</span>
                      </div>
                    ))}
                    {Object.keys(expenseMetrics.byCategory).length === 0 && (
                      <p className="text-slate-400 italic">No operating expenses recorded for this period.</p>
                    )}
                  </div>
                </div>

                {/* NET PROFIT FINAL ROW */}
                <div className="p-5 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-md">
                  <div>
                    <span className="font-black text-base uppercase tracking-wider block">NET FINAL PROFIT / (LOSS)</span>
                    <span className="text-xs text-slate-400">Gross Profit minus All Operating Expenses</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black font-mono ${pnlMetrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ৳{pnlMetrics.netProfit.toLocaleString()}
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Margin: {pnlMetrics.netMarginPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXPENSES REPORT */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 kpi-grid">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Expense Amount</span>
                <p className="text-xl font-bold font-mono text-rose-600 mt-1">৳{expenseMetrics.totalAmount.toLocaleString()}</p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{expenseMetrics.count} Entries</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Top Expense Category</span>
                <p className="text-lg font-bold text-slate-800 mt-1 truncate">
                  {Object.keys(expenseMetrics.byCategory).sort((a,b) => expenseMetrics.byCategory[b] - expenseMetrics.byCategory[a])[0] || 'None'}
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Highest expense driver</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Categories</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">{Object.keys(expenseMetrics.byCategory).length}</p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Categorized cost centers</span>
              </div>
            </div>

            {/* Expenses Detailed Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <Receipt size={16} className="text-rose-600" />
                  <span>Detailed Expenses Log ({filteredExpenses.length} entries)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Expense Description</th>
                      <th className="px-4 py-3">Payment Source</th>
                      <th className="px-4 py-3 text-right">Amount (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredExpenses.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-500 font-sans">{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md border border-rose-200 text-[11px]">
                            {e.category || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-800">{e.description || '-'}</td>
                        <td className="px-4 py-3 uppercase text-[10px] font-sans font-bold text-slate-500">{e.paymentSource || 'Cash'}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">৳{Number(e.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400 font-sans text-xs">
                          No expense records found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredExpenses.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold font-mono border-t-2 border-slate-300">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 font-sans text-slate-800 uppercase text-xs">Total Operating Expenses</td>
                        <td className="px-4 py-3 text-right text-rose-600 text-sm">৳{expenseMetrics.totalAmount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STOCK REPORT */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 kpi-grid">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Stock Units</span>
                <p className="text-xl font-bold font-mono text-purple-700 mt-1">{stockMetrics.totalQty.toLocaleString()}</p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{stockMetrics.totalSkus} Unique Products</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Cost Valuation</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">৳{stockMetrics.totalCostVal.toLocaleString()}</p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Capital invested in stock</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Retail Valuation</span>
                <p className="text-xl font-bold font-mono text-blue-700 mt-1">৳{stockMetrics.totalRetailVal.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">Profit: ৳{stockMetrics.potentialProfit.toLocaleString()}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kpi-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stock Health Alerts</span>
                <p className="text-xl font-bold font-mono text-amber-600 mt-1">{stockMetrics.lowStockCount} Low / {stockMetrics.outOfStockCount} Out</p>
                <span className="text-[10px] text-rose-500 mt-0.5 block">Reorder required</span>
              </div>
            </div>

            {/* Stock Valuation Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <PackageCheck size={16} className="text-purple-600" />
                  <span>Itemized Stock Valuation & Inventory Audit ({filteredProducts.length} items)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3">Code / Barcode</th>
                      <th className="px-3 py-3">Product Name</th>
                      <th className="px-3 py-3">Brand</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3 text-center">Stock Qty</th>
                      <th className="px-3 py-3 text-right">Cost Price</th>
                      <th className="px-3 py-3 text-right">Selling Price</th>
                      <th className="px-3 py-3 text-right">Cost Value</th>
                      <th className="px-3 py-3 text-right">Retail Value</th>
                      <th className="px-3 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredProducts.map((p) => {
                      const qty = Number(p.quantity) || 0;
                      const cost = Number(p.costPrice) || 0;
                      const sell = Number(p.sellingPrice) || 0;
                      const costVal = cost * qty;
                      const retailVal = sell * qty;
                      const isLow = qty > 0 && qty <= (Number(p.minStockAlert) || 5);
                      const isOut = qty <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-indigo-700 block">{p.code || '-'}</span>
                            {p.barcode && <span className="text-[10px] text-slate-400">{p.barcode}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-sans font-bold text-slate-900">{p.name}</td>
                          <td className="px-3 py-2.5 font-sans text-slate-600">{p.brand || <span className="text-slate-400 italic">-</span>}</td>
                          <td className="px-3 py-2.5 font-sans text-slate-600">{p.category || 'General'}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-800">
                            {qty} <span className="text-[10px] text-slate-400 font-sans font-normal">{p.unit || 'pcs'}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">৳{cost.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">৳{sell.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-purple-700">৳{costVal.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-blue-700">৳{retailVal.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-center font-sans">
                            {isOut ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-md">Out of Stock</span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-md">Low Stock</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">In Stock</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center py-10 text-slate-400 font-sans text-xs">
                          No products found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredProducts.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold font-mono border-t-2 border-slate-300">
                      <tr>
                        <td colSpan="4" className="px-3 py-3 font-sans text-slate-800 uppercase text-xs">Stock Valuation Totals</td>
                        <td className="px-3 py-3 text-center text-purple-800">{stockMetrics.totalQty.toLocaleString()}</td>
                        <td colSpan="2"></td>
                        <td className="px-3 py-3 text-right text-purple-700 text-sm">৳{stockMetrics.totalCostVal.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-blue-700 text-sm">৳{stockMetrics.totalRetailVal.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm font-medium">Loading Financial Reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
