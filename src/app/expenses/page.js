'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Receipt, Plus, TrendingDown, TrendingUp, X, FolderPlus, Tag, 
  Trash2, Search, Filter, Calendar, CheckCircle2, AlertCircle, 
  DollarSign, ArrowDownRight, ArrowUpRight, Wallet
} from 'lucide-react';

function ExpensesContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState({ income: [], expense: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Transaction Form
  const [form, setForm] = useState({ 
    type: 'expense', 
    category: 'Shop Rent', 
    amount: '', 
    description: '',
    paymentSource: 'Cash',
    date: new Date().toISOString().slice(0, 10)
  });

  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [catFeedback, setCatFeedback] = useState(null);

  // Filters
  const [activeTypeTab, setActiveTypeTab] = useState('expense'); // 'expense' | 'income' | 'all'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle URL Query Params
  useEffect(() => {
    const action = searchParams.get('action');
    const tab = searchParams.get('tab');
    if (action === 'new') {
      setShowModal(true);
    } else if (tab === 'categories' || action === 'categories') {
      setShowCategoryModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadData(u.storeId || 'default');
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (storeId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses?storeId=${storeId}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data || { income: [], expense: [] });
        if (result.categories && result.categories.length > 0) {
          setCategories(result.categories);
          if (!form.category || !result.categories.includes(form.category)) {
            setForm(prev => ({ ...prev, category: result.categories[0] }));
          }
        }
      }
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
        body: JSON.stringify({ 
          storeId: u.storeId || 'default', 
          ...form 
        })
      });
      const result = await res.json();
      if (result.success) {
        setShowModal(false);
        setForm({ 
          type: 'expense', 
          category: categories[0] || 'Shop Rent', 
          amount: '', 
          description: '',
          paymentSource: 'Cash',
          date: new Date().toISOString().slice(0, 10)
        });
        try {
          localStorage.setItem('bazarpos_last_change', Date.now().toString());
        } catch (e) {}
        loadData(u.storeId || 'default');
      } else {
        alert(result.message || 'Error saving entry');
      }
    } catch (err) {
      alert('Save error');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAddingCat(true);
    setCatFeedback(null);
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          action: 'add_category',
          categoryName: newCatName.trim()
        })
      });
      const result = await res.json();
      if (result.success) {
        setCategories(result.categories || []);
        setForm(prev => ({ ...prev, category: result.newCategory }));
        setNewCatName('');
        setCatFeedback({ type: 'success', message: `Category '${result.newCategory}' added successfully!` });
        setTimeout(() => setCatFeedback(null), 3000);
      } else {
        setCatFeedback({ type: 'error', message: result.message || 'Failed to add category' });
      }
    } catch (err) {
      setCatFeedback({ type: 'error', message: 'Error adding category' });
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!confirm(`Are you sure you want to remove '${catName}' from the category list?`)) return;

    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          action: 'delete_category',
          categoryName: catName
        })
      });
      const result = await res.json();
      if (result.success) {
        setCategories(result.categories || []);
        if (form.category === catName) {
          setForm(prev => ({ ...prev, category: result.categories?.[0] || 'General' }));
        }
      }
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const handleDeleteEntry = async (id, type) => {
    if (!confirm('Are you sure you want to delete this financial record?')) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch(`/api/expenses?storeId=${u.storeId || 'default'}&id=${id}&type=${type}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        try {
          localStorage.setItem('bazarpos_last_change', Date.now().toString());
        } catch (e) {}
        loadData(u.storeId || 'default');
      }
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const totalExpense = (data.expense || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const totalIncome = (data.income || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Combined and filtered transactions
  const filteredEntries = useMemo(() => {
    let list = [];
    if (activeTypeTab === 'all' || activeTypeTab === 'expense') {
      list = list.concat((data.expense || []).map(e => ({ ...e, entryType: 'expense' })));
    }
    if (activeTypeTab === 'all' || activeTypeTab === 'income') {
      list = list.concat((data.income || []).map(e => ({ ...e, entryType: 'income' })));
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    return list.filter(item => {
      // Category filter
      if (selectedCategory !== 'all') {
        if ((item.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesAmt = String(item.amount || '').includes(q);
        return matchesCat || matchesDesc || matchesAmt;
      }
      return true;
    });
  }, [data, activeTypeTab, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Receipt className="text-rose-600" size={24} />
            <span>Operating Expenses &amp; External Income Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage store rent, electricity bills, salaries, custom expense categories, and miscellaneous cashflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition border border-slate-200"
          >
            <FolderPlus size={15} className="text-indigo-600" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 text-xs w-full sm:w-auto"
          >
            <Plus size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-500 truncate">Total Operating Expenses</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-rose-700 mt-0.5 truncate">৳{totalExpense.toLocaleString()}</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">{data.expense?.length || 0} expense vouchers</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-500 truncate">Total External Income</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-0.5 truncate">৳{totalIncome.toLocaleString()}</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">{data.income?.length || 0} income entries</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">Expense Categories</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-indigo-700 mt-0.5 truncate">{categories.length}</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">Configured categories</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Tag size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 sm:space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
          {/* Type Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTypeTab('expense')}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center space-x-1.5 ${
                activeTypeTab === 'expense' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Expenses</span>
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] rounded-full">{data.expense?.length || 0}</span>
            </button>
            <button
              onClick={() => setActiveTypeTab('income')}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center space-x-1.5 ${
                activeTypeTab === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Income</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] rounded-full">{data.income?.length || 0}</span>
            </button>
            <button
              onClick={() => setActiveTypeTab('all')}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition text-center ${
                activeTypeTab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>All Types</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 flex-1 sm:flex-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search note, category..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            No financial transaction entries found matching your filters.
          </div>
        ) : (
          <>
            {/* Mobile View: Clean App Cards (Zero Horizontal Scroll) */}
            <div className="block md:hidden space-y-2.5">
              {filteredEntries.map((e) => (
                <div
                  key={e.id}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(e.date || e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {e.entryType === 'income' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-0.5">
                          <ArrowDownRight size={11} />
                          <span>Income</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center space-x-0.5">
                          <ArrowUpRight size={11} />
                          <span>Expense</span>
                        </span>
                      )}

                      <span className="font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded text-[10px]">
                        {e.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <p className="text-slate-700 font-medium truncate max-w-[170px]">
                      {e.description || <span className="text-slate-400 italic">No notes</span>}
                    </p>

                    <span className={`font-black font-mono text-sm ${
                      e.entryType === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {e.entryType === 'income' ? '+' : '-'}৳{Number(e.amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Source: {e.paymentSource || 'Cash'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(e.id, e.entryType)}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                      title="Delete Entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Description / Memo</th>
                    <th className="px-4 py-3.5">Payment Source</th>
                    <th className="px-4 py-3.5 text-right">Amount</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {new Date(e.date || e.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {e.entryType === 'income' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                            <ArrowDownRight size={12} />
                            <span>Income</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center space-x-1">
                            <ArrowUpRight size={12} />
                            <span>Expense</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] inline-flex items-center space-x-1">
                          <Tag size={11} className="text-slate-400" />
                          <span>{e.category || 'General'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {e.description || <span className="text-slate-400 italic">No notes</span>}
                      </td>
                      <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500 font-mono">
                        {e.paymentSource || 'Cash'}
                      </td>
                      <td className={`px-4 py-3 font-bold font-mono text-sm text-right ${
                        e.entryType === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {e.entryType === 'income' ? '+' : '-'}৳{Number(e.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(e.id, e.entryType)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ADD / CREATE TRANSACTION ENTRY MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <Receipt className="text-rose-600" size={20} />
                <span>Add Financial Transaction</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      form.type === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight size={14} />
                    <span>Operating Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      form.type === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight size={14} />
                    <span>External Income</span>
                  </button>
                </div>
              </div>

              {/* Category Selection with Quick + Add Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[11px] text-indigo-600 hover:underline font-bold flex items-center space-x-0.5"
                  >
                    <FolderPlus size={13} />
                    <span>+ New Category</span>
                  </button>
                </div>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Payment Method</label>
                  <select
                    value={form.paymentSource}
                    onChange={e => setForm({ ...form, paymentSource: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500 text-xs"
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="Bank">Bank Account</option>
                    <option value="bKash/MFS">bKash / Nagad / MFS</option>
                    <option value="Card">Credit/Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Transaction Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Description / Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. October month showroom shop rent payment"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 text-xs"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE EXPENSE CATEGORIES MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <FolderPlus className="text-indigo-600" size={20} />
                <span>Expense Categories Manager</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="space-y-2">
                <label className="block text-slate-700 font-bold">Add New Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Generator Fuel, Internet Bill..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={addingCat || !newCatName.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-sm shrink-0"
                  >
                    {addingCat ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>

              {catFeedback && (
                <div className={`p-2.5 rounded-xl border font-semibold flex items-center space-x-2 ${
                  catFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {catFeedback.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-rose-600" />}
                  <span>{catFeedback.message}</span>
                </div>
              )}

              {/* Existing Categories List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Existing Categories ({categories.length})</span>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {categories.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition">
                      <div className="flex items-center space-x-2">
                        <Tag size={13} className="text-indigo-500" />
                        <span className="font-bold text-slate-800">{cat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Remove Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="p-4 text-center text-slate-400">No categories found.</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading Expenses &amp; Ledger...</div>}>
      <ExpensesContent />
    </Suspense>
  );
}
