'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RotateCcw,
  Search,
  Receipt,
  ShieldCheck,
  Package,
  ArrowRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Tag,
  User,
  Phone,
  Calendar,
  Layers,
  Sparkles,
  X,
  FileText,
  Boxes,
  HelpCircle,
  Undo2
} from 'lucide-react';

function SalesReturnContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('process'); // 'process' | 'history'
  
  // Data states
  const [vouchers, setVouchers] = useState([]);
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [storeCompany, setStoreCompany] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Selected Invoice for Return
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { [itemIndex]: { returnedQty: 1, reason: '', condition: 'Restock to Inventory', refundAmount: 0 } }
  
  // Return Form State
  const [returnType, setReturnType] = useState('refund'); // 'refund' | 'warranty_replacement' | 'warranty_service' | 'exchange'
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [customTotalRefund, setCustomTotalRefund] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Return Slip Modal
  const [completedReturn, setCompletedReturn] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // History Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadStoreData(u.storeId || 'default');
    } else {
      setLoading(false);
    }
  }, []);

  // Handle URL Query Params
  useEffect(() => {
    const invNo = searchParams.get('invoiceNo') || searchParams.get('voucherNo');
    const invId = searchParams.get('invoiceId') || searchParams.get('voucherId');
    if ((invNo || invId) && vouchers.length > 0) {
      const matched = vouchers.find(v => (invNo && (v.voucherNo === invNo || v.voucherNumber === invNo)) || (invId && v.id === invId));
      if (matched) {
        handleSelectVoucherForReturn(matched);
      }
    }
  }, [searchParams, vouchers]);

  const loadStoreData = async (storeId) => {
    try {
      setLoading(true);
      const [vRes, retRes, compRes] = await Promise.all([
        fetch(`/api/vouchers?storeId=${storeId}`),
        fetch(`/api/sales-return?storeId=${storeId}`),
        fetch(`/api/company?storeId=${storeId}`)
      ]);
      const vData = await vRes.json();
      const retData = await retRes.json();
      const compData = await compRes.json();

      if (vData.success) setVouchers(vData.vouchers || []);
      if (retData.success) setReturnsHistory(retData.returns || []);
      if (compData.success && compData.company) setStoreCompany(compData.company);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVoucherForReturn = (voucher) => {
    setSelectedVoucher(voucher);
    const initialItems = {};
    (voucher.items || []).forEach((it, idx) => {
      // Default: select all items with max qty
      initialItems[idx] = {
        selected: true,
        productId: it.id || it.productId,
        productCode: it.code || it.productCode || '',
        name: it.name,
        brand: it.brand || '',
        warrantyType: it.warrantyType || '',
        serialNumber: it.serialNumber || it.serial || '',
        soldQty: Number(it.quantity) || 1,
        returnedQty: Number(it.quantity) || 1,
        unitPrice: Number(it.price) || Number(it.sellingPrice) || 0,
        refundAmount: (Number(it.price) || Number(it.sellingPrice) || 0) * (Number(it.quantity) || 1),
        reason: 'Warranty Claim / Defective Replacement',
        condition: 'Restock to Inventory'
      };
    });
    setSelectedItems(initialItems);
    setCustomTotalRefund('');
  };

  const toggleItemSelection = (idx) => {
    setSelectedItems(prev => {
      const current = prev[idx] || {};
      return {
        ...prev,
        [idx]: {
          ...current,
          selected: !current.selected
        }
      };
    });
  };

  const updateItemReturnQty = (idx, qty) => {
    const it = selectedVoucher.items[idx];
    const maxQty = Number(it.quantity) || 1;
    const cleanQty = Math.max(1, Math.min(maxQty, Number(qty) || 1));
    const unitPrice = Number(it.price) || Number(it.sellingPrice) || 0;

    setSelectedItems(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        returnedQty: cleanQty,
        refundAmount: cleanQty * unitPrice
      }
    }));
  };

  const updateItemField = (idx, field, value) => {
    setSelectedItems(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        [field]: value
      }
    }));
  };

  // Calculate total auto refund amount
  const autoTotalRefund = useMemo(() => {
    let sum = 0;
    Object.keys(selectedItems).forEach(idx => {
      const it = selectedItems[idx];
      if (it?.selected) {
        sum += (Number(it.refundAmount) || 0);
      }
    });
    return sum;
  }, [selectedItems]);

  const finalRefundAmount = customTotalRefund !== '' ? Number(customTotalRefund) : autoTotalRefund;

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedVoucher) return;

    const returnableItems = Object.keys(selectedItems)
      .filter(idx => selectedItems[idx]?.selected)
      .map(idx => selectedItems[idx]);

    if (returnableItems.length === 0) {
      alert('Please select at least one item from the invoice to return.');
      return;
    }

    let status = 'Refunded';
    if (returnType === 'warranty_replacement') status = 'Replacement Issued';
    if (returnType === 'warranty_service') status = 'Sent for Service';
    if (returnType === 'exchange') status = 'Store Exchange';

    setProcessing(true);
    try {
      const payload = {
        storeId: user?.storeId || 'default',
        voucherId: selectedVoucher.id,
        voucherNo: selectedVoucher.voucherNo || selectedVoucher.voucherNumber || selectedVoucher.id,
        clientId: selectedVoucher.clientId || '',
        clientName: selectedVoucher.clientName || 'Walk-in Customer',
        clientPhone: selectedVoucher.clientPhone || '',
        itemsReturned: returnableItems,
        totalRefundAmount: returnType === 'warranty_service' ? 0 : finalRefundAmount,
        refundMethod: returnType === 'warranty_service' ? 'Warranty Service Slip' : refundMethod,
        returnType,
        status,
        notes: returnNotes,
        processedBy: user?.fullName || user?.username || 'Cashier'
      };

      const res = await fetch('/api/sales-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setCompletedReturn(data.salesReturn);
        setShowSlipModal(true);
        setSelectedVoucher(null);
        setSelectedItems({});
        setReturnNotes('');
        loadStoreData(user?.storeId || 'default');
      } else {
        alert(data.message || 'Error processing sales return');
      }
    } catch (err) {
      alert('Network error processing return');
    } finally {
      setProcessing(false);
    }
  };

  // Filter vouchers in search
  const filteredVouchers = useMemo(() => {
    if (!searchQuery.trim()) return vouchers.slice(0, 10);
    const q = searchQuery.toLowerCase().trim();
    return vouchers.filter(v => 
      (v.voucherNo && v.voucherNo.toLowerCase().includes(q)) ||
      (v.voucherNumber && v.voucherNumber.toLowerCase().includes(q)) ||
      (v.clientName && v.clientName.toLowerCase().includes(q)) ||
      (v.clientPhone && v.clientPhone.includes(q)) ||
      (v.items && v.items.some(it => 
        (it.name && it.name.toLowerCase().includes(q)) ||
        (it.serialNumber && it.serialNumber.toLowerCase().includes(q)) ||
        (it.code && it.code.toLowerCase().includes(q))
      ))
    ).slice(0, 15);
  }, [vouchers, searchQuery]);

  // Filter returns history
  const filteredHistory = useMemo(() => {
    return returnsHistory.filter(ret => {
      if (historyStatusFilter !== 'ALL' && ret.status !== historyStatusFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const matchesRetId = (ret.returnNumber || '').toLowerCase().includes(q);
        const matchesInv = (ret.voucherNo || '').toLowerCase().includes(q);
        const matchesClient = (ret.clientName || '').toLowerCase().includes(q);
        const matchesPhone = (ret.clientPhone || '').includes(q);
        return matchesRetId || matchesInv || matchesClient || matchesPhone;
      }
      return true;
    });
  }, [returnsHistory, historyStatusFilter, historySearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <RotateCcw className="text-blue-600" size={24} />
            <span>Sales Returns, Refunds &amp; Warranty Claims</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Process customer invoice returns, warranty replacements/repairs, auto-restock inventory, and print return slips.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('process')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'process' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw size={14} />
            <span>Process Return / Warranty</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'history' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} />
            <span>Return History Logs ({returnsHistory.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROCESS NEW RETURN / WARRANTY CLAIM */}
      {activeTab === 'process' && (
        <div className="space-y-6 no-print">
          {/* Step 1: Search Invoice to Return */}
          {!selectedVoucher ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b pb-3 text-slate-800 font-bold text-sm">
                <Search size={18} className="text-blue-600" />
                <span>Step 1: Locate Original Sales Invoice or Scan Item</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" size={17} />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter invoice number (e.g. INV-1001), customer phone, name, or scan product serial number..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 shadow-xs transition"
                />
              </div>

              {/* Invoices Results Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                  <span>Recent Sales Invoices ({filteredVouchers.length} matches)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Click "Select for Return" to proceed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Invoice #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-center">Items Qty</th>
                        <th className="p-3 text-right">Invoice Total</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVouchers.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-indigo-700">{v.voucherNo || v.voucherNumber || v.id}</td>
                          <td className="p-3 text-slate-500">{new Date(v.date || v.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 font-bold text-slate-800">
                            <span>{v.clientName || 'Walk-in Customer'}</span>
                            {v.clientPhone && <span className="block text-[10px] text-slate-400 font-mono">{v.clientPhone}</span>}
                          </td>
                          <td className="p-3 text-center font-mono">{v.items?.length || 1} items</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">৳{Number(v.totalAmount).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleSelectVoucherForReturn(v)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-xs inline-flex items-center space-x-1"
                            >
                              <span>Select for Return</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredVouchers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-slate-400">
                            No invoices found matching "{searchQuery}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Configure Return Items & Warranty Claim */
            <form onSubmit={handleProcessReturn} className="space-y-6">
              {/* Selected Invoice Banner */}
              <div className="bg-blue-50/70 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Selected Sales Invoice:</span>
                    <span className="font-mono font-black text-sm text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      {selectedVoucher.voucherNo || selectedVoucher.voucherNumber || selectedVoucher.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                    <span><strong>Customer:</strong> {selectedVoucher.clientName || 'Walk-in Customer'}</span>
                    {selectedVoucher.clientPhone && <span><strong>Phone:</strong> {selectedVoucher.clientPhone}</span>}
                    <span><strong>Date:</strong> {new Date(selectedVoucher.date || selectedVoucher.createdAt).toLocaleDateString()}</span>
                    <span><strong>Invoice Total:</strong> ৳{Number(selectedVoucher.totalAmount).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setSelectedVoucher(null); setSelectedItems({}); }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition shadow-xs self-start md:self-auto"
                >
                  Change Invoice
                </button>
              </div>

              {/* Items Return Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                    <Package size={18} className="text-blue-600" />
                    <span>Select Items to Return or Claim Warranty</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Check the items being returned by customer</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">Return</th>
                        <th className="p-3">Product Description &amp; Warranty</th>
                        <th className="p-3 text-center">Sold Qty</th>
                        <th className="p-3 text-center">Return Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Refund Subtotal</th>
                        <th className="p-3">Inventory Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedVoucher.items || []).map((it, idx) => {
                        const itemState = selectedItems[idx] || {};
                        const isChecked = !!itemState.selected;

                        return (
                          <tr key={idx} className={isChecked ? 'bg-blue-50/30' : 'opacity-60 bg-slate-50/50'}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItemSelection(idx)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{it.name}</span>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {it.brand && (
                                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                                    Brand: {it.brand}
                                  </span>
                                )}
                                {it.warrantyType && (
                                  <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                    🛡️ {it.warrantyType}
                                  </span>
                                )}
                                {(it.serialNumber || it.serial) && (
                                  <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 font-mono text-[10px] font-bold rounded">
                                    S/N: {it.serialNumber || it.serial}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-600">
                              {it.quantity || 1}
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="1"
                                max={it.quantity || 1}
                                disabled={!isChecked}
                                value={itemState.returnedQty || 1}
                                onChange={e => updateItemReturnQty(idx, e.target.value)}
                                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                              />
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              ৳{Number(it.price || it.sellingPrice || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-rose-600">
                              ৳{Number(itemState.refundAmount || 0).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <select
                                disabled={!isChecked}
                                value={itemState.condition || 'Restock to Inventory'}
                                onChange={e => updateItemField(idx, 'condition', e.target.value)}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                              >
                                <option value="Restock to Inventory">Good (Restock to Stock)</option>
                                <option value="Defective / Damaged">Defective (Do NOT Restock)</option>
                                <option value="Supplier Warranty">Sent for Warranty Repair</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Return Classification & Refund Settlement */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-3 flex items-center space-x-2">
                  <RotateCcw size={18} className="text-blue-600" />
                  <span>Return Type &amp; Financial Settlement</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnType('refund')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      returnType === 'refund'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500 text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">1. Refund Payment</span>
                    <span className="text-[11px] text-slate-500 mt-1">Return money back to customer or adjust due.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnType('warranty_replacement')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      returnType === 'warranty_replacement'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500 text-emerald-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">2. Warranty Replacement</span>
                    <span className="text-[11px] text-slate-500 mt-1">Issue a fresh replacement unit under warranty.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnType('warranty_service')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      returnType === 'warranty_service'
                        ? 'border-purple-600 bg-purple-50/50 ring-1 ring-purple-500 text-purple-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">3. Warranty Service / Repair</span>
                    <span className="text-[11px] text-slate-500 mt-1">Accept item for repair / service slip.</span>
                  </button>
                </div>

                {/* Settlement Inputs */}
                {returnType !== 'warranty_service' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">
                        Refund / Credit Amount (৳) *
                      </label>
                      <input
                        type="number"
                        value={customTotalRefund !== '' ? customTotalRefund : autoTotalRefund}
                        onChange={e => setCustomTotalRefund(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-sm text-rose-600 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-calculated from returned item prices</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">
                        Refund Payment Method
                      </label>
                      <select
                        value={refundMethod}
                        onChange={e => setRefundMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                      >
                        <option value="Cash">Cash Counter</option>
                        <option value="Adjust Customer Due">Adjust Customer Due Balance (Credit)</option>
                        <option value="bKash/MFS">bKash / Nagad / MFS</option>
                        <option value="Bank">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Reason & Notes */}
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Return Reason / Warranty Remarks / Problem Description
                  </label>
                  <textarea
                    rows={2}
                    value={returnNotes}
                    onChange={e => setReturnNotes(e.target.value)}
                    placeholder="e.g. Barcode scanner sensor not detecting codes after 2 weeks, customer requesting replacement under 1 year warranty..."
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs font-medium"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedVoucher(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs flex items-center space-x-2"
                  >
                    <RotateCcw size={15} />
                    <span>{processing ? 'Processing Return...' : 'Confirm Return & Print Claim Slip'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: RETURN & WARRANTY HISTORY LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-4 no-print">
          {/* History Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" size={15} />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search by Return ID, Invoice #, customer name or phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Status:</span>
              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Refunded">Refunded</option>
                <option value="Replacement Issued">Replacement Issued</option>
                <option value="Sent for Service">Sent for Service</option>
                <option value="Store Exchange">Store Exchange</option>
              </select>
            </div>
          </div>

          {/* History Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Return #</th>
                    <th className="p-3.5">Original Invoice</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5 text-center">Items Returned</th>
                    <th className="p-3.5">Status &amp; Type</th>
                    <th className="p-3.5 text-right">Refund Amount</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(ret => (
                    <tr key={ret.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-blue-700">{ret.returnNumber}</td>
                      <td className="p-3 font-mono text-slate-600">{ret.voucherNo || '-'}</td>
                      <td className="p-3 text-slate-500">{new Date(ret.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">{ret.clientName || 'Walk-in'}</span>
                        {ret.clientPhone && <span className="text-[10px] text-slate-400 font-mono">{ret.clientPhone}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md font-mono">
                          {ret.itemsReturned?.length || 1} items
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          ret.status === 'Refunded'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ret.status === 'Replacement Issued'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        {ret.totalRefundAmount > 0 ? `৳${Number(ret.totalRefundAmount).toLocaleString()}` : '৳0 (Warranty)'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => { setCompletedReturn(ret); setShowSlipModal(true); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition inline-flex items-center space-x-1"
                        >
                          <Printer size={13} />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-400">
                        No sales return or warranty records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE SALES RETURN / WARRANTY CLAIM SLIP MODAL */}
      {showSlipModal && completedReturn && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10 no-print">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>Sales Return &amp; Warranty Claim Voucher</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center space-x-1"
                >
                  <Printer size={14} />
                  <span>Print Voucher</span>
                </button>
                <button onClick={() => setShowSlipModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans printable-area print-area bg-white text-slate-900">
              {/* Store & Header */}
              <div className="text-center border-b pb-3 space-y-1">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {storeCompany?.name || user?.storeName || 'BazarPOS Store'}
                </h2>
                {storeCompany?.address && <p className="text-[11px] text-slate-500">{storeCompany.address}</p>}
                <p className="text-[11px] text-slate-500 font-mono">
                  Hotline: {storeCompany?.phone || user?.phone || '01700000000'}
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1 bg-slate-900 text-white font-bold uppercase rounded-md text-[10px] tracking-wider">
                    Official Return &amp; Warranty Slip
                  </span>
                </div>
              </div>

              {/* Return Metadata */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p><strong>Return Slip #:</strong> <span className="font-mono font-bold text-indigo-700">{completedReturn.returnNumber}</span></p>
                  <p><strong>Original Invoice:</strong> <span className="font-mono">{completedReturn.voucherNo}</span></p>
                  <p><strong>Date:</strong> {new Date(completedReturn.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p><strong>Customer:</strong> {completedReturn.clientName}</p>
                  {completedReturn.clientPhone && <p><strong>Phone:</strong> {completedReturn.clientPhone}</p>}
                  <p><strong>Claim Status:</strong> <span className="font-bold uppercase text-emerald-700">{completedReturn.status}</span></p>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold border-b text-slate-700">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5">Warranty Info</th>
                      <th className="p-2.5 text-right">Refund / Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(completedReturn.itemsReturned || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-900">{it.name}</span>
                          {it.brand && <span className="block text-[10px] text-slate-500">Brand: {it.brand}</span>}
                          {it.serialNumber && <span className="block text-[10px] font-mono text-purple-700">S/N: {it.serialNumber}</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold">{it.returnedQty}</td>
                        <td className="p-2.5 text-[11px] text-slate-600">
                          {it.warrantyType || it.condition}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ৳{Number(it.refundAmount || (it.unitPrice * it.returnedQty)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {completedReturn.totalRefundAmount > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t">
                      <tr>
                        <td colSpan="3" className="p-2.5 uppercase text-slate-700">Total Refund Settled ({completedReturn.refundMethod})</td>
                        <td className="p-2.5 text-right font-mono text-rose-600 text-sm">৳{Number(completedReturn.totalRefundAmount).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {completedReturn.notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600">
                  <strong>Notes / Remarks:</strong> {completedReturn.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
                <div>
                  <div className="border-t border-slate-400 pt-1 w-32 mx-auto">Customer Signature</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 w-32 mx-auto">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, aside, header, nav, button {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function SalesReturnPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading Sales Return &amp; Warranty...</div>}>
      <SalesReturnContent />
    </Suspense>
  );
}
