'use client';

import { useState, useEffect } from 'react';
import { Receipt, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';

export default function ExpensesPage() {
  const [data, setData] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'expense', category: 'Rent', amount: '', description: '' });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadData(u.storeId || 'default');
    }
  }, []);

  const loadData = async (storeId) => {
    try {
      const res = await fetch(`/api/expenses?storeId=${storeId}`);
      const result = await res.json();
      if (result.success) setData(result.data || { income: [], expense: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: u.storeId || 'default', ...form })
      });
      const result = await res.json();
      if (result.success) {
        setShowModal(false);
        setForm({ type: 'expense', category: 'Rent', amount: '', description: '' });
        loadData(u.storeId || 'default');
      }
    } catch (err) {
      alert('Save error');
    }
  };

  const totalExpense = (data.expense || []).reduce((acc, item) => acc + (item.amount || 0), 0);
  const totalIncome = (data.income || []).reduce((acc, item) => acc + (item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Receipt className="text-blue-600" size={24} />
            <span>External Income & Operating Expenses</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Track store rent, electricity, bills, and miscellaneous income/expenses.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>Add Transaction Entry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600">Total Operating Expenses</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">৳{totalExpense.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600">Total External Income</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">৳{totalIncome.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800">Expense Entries</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data.expense || []).map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-700">{e.category}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{e.description || 'N/A'}</td>
                <td className="px-4 py-2.5 font-bold text-rose-600 text-right">৳{e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Add Financial Transaction</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Transaction Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold">
                  <option value="expense">Expense (খরচ)</option>
                  <option value="income">External Income (অন্যান্য আয়)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Category *</label>
                <input type="text" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Shop Rent, Electricity Bill, Salary" className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Amount (৳) *</label>
                <input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Description / Note</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
