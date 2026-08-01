'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  Printer,
  Calendar,
  X
} from 'lucide-react';

export default function VoucherHistoryPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      fetchVouchers(u.storeId || 'default');
    }
  }, []);

  const fetchVouchers = async (storeId) => {
    try {
      const res = await fetch(`/api/vouchers?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setVouchers(data.vouchers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!confirm('Are you sure you want to delete this sales voucher?')) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch(`/api/vouchers?id=${id}&storeId=${u.storeId || 'default'}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setVouchers(vouchers.filter(v => v.id !== id));
      }
    } catch (err) {
      alert('Delete error');
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
      v.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (v.clientPhone && v.clientPhone.includes(search));
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <FileText className="text-blue-600" size={24} />
            <span>Sales Reports & Voucher History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage and track all issued invoices and customer receipts.</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Voucher #, Customer Name, or Phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Payment Status</option>
            <option value="PAID">PAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="DUE">DUE</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading Sales History...</div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No vouchers match your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Voucher #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Sales Rep</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{v.voucherNo}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(v.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{v.clientName}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{v.salerName}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">৳{v.totalAmount}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">৳{v.paidAmount}</td>
                    <td className="px-4 py-3 text-rose-600 font-semibold">৳{v.dueAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                        v.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedVoucher(v)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View / Print Invoice"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteVoucher(v.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Voucher"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW / PRINT INVOICE MODAL */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between no-print border-b pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Invoice Details ({selectedVoucher.voucherNo})</h3>
              <button onClick={() => setSelectedVoucher(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="printable-area border p-4 rounded-xl bg-slate-50 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center pb-2 border-b">
                <h2 className="font-bold text-sm text-slate-900">BazarPOS Voucher</h2>
                <p className="font-semibold text-blue-600 mt-1">Invoice: {selectedVoucher.voucherNo}</p>
                <p className="text-[10px] text-slate-500">{new Date(selectedVoucher.date).toLocaleString()}</p>
              </div>

              <div className="py-1 border-b text-[11px] space-y-1">
                <p>Customer: <span className="font-bold">{selectedVoucher.clientName}</span></p>
                <p>Sales Rep: {selectedVoucher.salerName}</p>
              </div>

              <table className="w-full text-left text-[11px] border-b">
                <thead>
                  <tr className="border-b font-bold">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedVoucher.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.name}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">৳{item.unitPrice * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 text-right space-y-1 font-bold">
                <p>Subtotal: ৳{selectedVoucher.subTotal}</p>
                {selectedVoucher.discount > 0 && <p>Discount: -৳{selectedVoucher.discount}</p>}
                <p className="text-sm text-blue-700">Grand Total: ৳{selectedVoucher.totalAmount}</p>
                <p className="text-emerald-600">Paid ({selectedVoucher.paymentMethod || 'Cash'}): ৳{selectedVoucher.paidAmount}</p>
                {selectedVoucher.dueAmount > 0 && <p className="text-rose-600">Due: ৳{selectedVoucher.dueAmount}</p>}
              </div>
            </div>

            <div className="flex space-x-3 no-print pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2"
              >
                <Printer size={18} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
