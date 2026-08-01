'use client';

import { useState, useEffect } from 'react';
import { Scale, UserCheck, Printer } from 'lucide-react';

export default function SalerBalancePage() {
  const [salers, setSalers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadSalerBalanceData(u.storeId || 'default');
    }
  }, []);

  const loadSalerBalanceData = async (storeId) => {
    try {
      const [salRes, vouchRes] = await Promise.all([
        fetch(`/api/salers?storeId=${storeId}`),
        fetch(`/api/vouchers?storeId=${storeId}`)
      ]);
      const salData = await salRes.json();
      const vouchData = await vouchRes.json();

      if (salData.success) setSalers(salData.salers || []);
      if (vouchData.success) setVouchers(vouchData.vouchers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSalerBalanceStats = (salerName) => {
    const salerVouchers = vouchers.filter((v) => v.salerName === salerName);
    const totalSales = salerVouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
    const totalPaid = salerVouchers.reduce((acc, v) => acc + (v.paidAmount || 0), 0);
    const totalDue = salerVouchers.reduce((acc, v) => acc + (v.dueAmount || 0), 0);
    return { count: salerVouchers.length, totalSales, totalPaid, totalDue };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Scale className="text-blue-600" size={24} />
            <span>Saler Representative Balance Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Track individual sales, collected cash, and outstanding customer dues per salesman.</p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
        >
          <Printer size={18} />
          <span>Print Saler Balance Statement</span>
        </button>
      </div>

      <div className="printable-area bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Saler Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-center">Vouchers Count</th>
                <th className="px-4 py-3">Total Sales (৳)</th>
                <th className="px-4 py-3">Collected Cash (৳)</th>
                <th className="px-4 py-3">Pending Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salers.map((s) => {
                const stats = getSalerBalanceStats(s.name);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">{s.role}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.phone || 'N/A'}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{stats.count}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">৳{stats.totalSales.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">৳{stats.totalPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-rose-600">৳{stats.totalDue.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
