'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, PackageCheck, Printer } from 'lucide-react';

export default function ReportsPage() {
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadReportData(u.storeId || 'default');
    }
  }, []);

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

  // Calculations
  const totalRevenue = vouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
  const totalCost = vouchers.reduce((acc, v) => acc + (v.totalCost || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const totalOperatingExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  // Stock Metrics
  const totalStockItems = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalStockCostVal = products.reduce((acc, p) => acc + (p.costPrice || 0) * (p.quantity || 0), 0);
  const totalStockRetailVal = products.reduce((acc, p) => acc + (p.sellingPrice || 0) * (p.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <BarChart3 className="text-blue-600" size={24} />
            <span>Store Financial Analytics & Profit/Loss Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time breakdown of revenue, product cost of goods sold, operating expenses, and net profit.</p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
        >
          <Printer size={18} />
          <span>Print Financial Statement</span>
        </button>
      </div>

      {/* Printable Report Content */}
      <div className="printable-area space-y-6">
        {/* Profit & Loss Statement Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
            <TrendingUp className="text-blue-600" size={20} />
            <span>Net Profit & Loss Statement</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-600 font-medium">Total Sales Revenue</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">৳{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500 font-medium">Cost of Goods Sold (COGS)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">৳{totalCost.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs text-emerald-600 font-medium">Gross Profit</p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">৳{grossProfit.toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Less: Operating Expenses (Rent, Bills, Salaries)</p>
              <p className="text-lg font-bold text-rose-600">-৳{totalOperatingExpenses.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <p className="text-xs text-slate-300 uppercase font-semibold">Net Business Profit</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">৳{netProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Stock Valuation Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
            <PackageCheck className="text-purple-600" size={20} />
            <span>Inventory Stock Valuation Summary</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-4 bg-slate-50 rounded-xl border">
              <p className="text-xs text-slate-500 font-medium">Total Items in Stock</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalStockItems} Units</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-600 font-medium">Total Cost Valuation</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">৳{totalStockCostVal.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-600 font-medium">Total Potential Retail Valuation</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">৳{totalStockRetailVal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
