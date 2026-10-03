'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  Printer,
  Calendar,
  X,
  Share2,
  Mail,
  Send,
  CheckCircle,
  ExternalLink,
  Copy,
  RotateCcw
} from 'lucide-react';
import InvoiceA4 from '@/components/InvoiceA4';

export default function VoucherHistoryPage() {
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'last_month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [company, setCompany] = useState({});
  const [invoiceSettings, setInvoiceSettings] = useState({});
  const [printLayout, setPrintLayout] = useState('A4');
  
  // Email & share modal states
  const [emailModal, setEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [clients, setClients] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      fetchVouchers(u.storeId || 'default');
    } else {
      fetchVouchers('default');
    }
  }, []);

  const fetchVouchers = async (storeId) => {
    try {
      const [vRes, invRes, cRes] = await Promise.all([
        fetch(`/api/vouchers?storeId=${storeId}`),
        fetch(`/api/invoice-settings?storeId=${storeId}`),
        fetch(`/api/clients?storeId=${storeId}`)
      ]);
      const data = await vRes.json();
      const invData = await invRes.json();
      const clientData = await cRes.json();

      if (data.success) {
        setVouchers(data.vouchers || []);
      }
      if (invData.success) {
        if (invData.settings) setInvoiceSettings(invData.settings);
        if (invData.company) setCompany(invData.company);
        if (invData.settings?.paperSize) setPrintLayout(invData.settings.paperSize === 'thermal' ? 'thermal' : 'A4');
      }
      if (clientData.success) {
        setClients(clientData.clients || []);
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

  const getInvoiceDownloadUrl = (voucher) => {
    if (!voucher) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const token = voucher.publicToken || voucher.id;
    return `${origin}/invoice/${token}?storeId=${user?.storeId || 'default'}`;
  };

  const formatWhatsAppPhone = (rawPhone) => {
    if (!rawPhone) return '';
    let clean = String(rawPhone).replace(/[^0-9]/g, '');
    if (!clean) return '';
    if (clean.startsWith('00')) clean = clean.substring(2);
    if (clean.length === 11 && clean.startsWith('01')) {
      clean = '88' + clean;
    } else if (clean.length === 10 && clean.startsWith('1')) {
      clean = '880' + clean;
    }
    return clean;
  };

  const getWhatsAppShareUrl = (voucher) => {
    if (!voucher) return '#';
    const client = clients.find(c => c.name === voucher.clientName || c.id === voucher.clientId);
    const rawPhone = voucher.clientPhone || client?.phone || '';
    const phone = formatWhatsAppPhone(rawPhone);
    const downloadUrl = getInvoiceDownloadUrl(voucher);

    const text = encodeURIComponent(
      `*${user?.storeName || company?.name || 'BazarPOS Outlet'}*\n` +
      `📄 *Invoice #:* ${voucher.voucherNo}\n` +
      `📅 *Date:* ${new Date(voucher.date).toLocaleDateString()}\n` +
      `👤 *Customer:* ${voucher.clientName || 'Valued Customer'}\n` +
      `💵 *Total Amount:* ৳${voucher.totalAmount}\n` +
      `✅ *Paid:* ৳${voucher.paidAmount}\n` +
      (voucher.dueAmount > 0 ? `⚠️ *Due Balance:* ৳${voucher.dueAmount}\n` : '') +
      `\n📥 *Download / View Invoice Link:*\n${downloadUrl}\n\n` +
      `Thank you for your business!`
    );
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
  };

  const handleSendEmailInvoice = async (e) => {
    if (e) e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please provide a valid recipient email address');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch('/api/mail/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          recipient: recipientEmail,
          voucher: selectedVoucher,
          invoiceUrl: getInvoiceDownloadUrl(selectedVoucher)
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailSuccessMsg(data.message || 'Invoice emailed successfully with download link!');
        setTimeout(() => {
          setEmailModal(false);
          setEmailSuccessMsg('');
        }, 2500);
      } else {
        alert(data.message || 'Failed to send email');
      }
    } catch (err) {
      alert('Network error sending invoice email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyLink = (voucher) => {
    const url = getInvoiceDownloadUrl(voucher);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Date Range Calculation
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (datePreset === 'today') {
      return { start: todayStart, end: todayEnd, label: `Today (${todayStart.toLocaleDateString()})` };
    }
    if (datePreset === 'yesterday') {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return { start: yStart, end: yEnd, label: `Yesterday (${yStart.toLocaleDateString()})` };
    }
    if (datePreset === '7days') {
      const start7 = new Date(todayStart);
      start7.setDate(start7.getDate() - 6);
      return { start: start7, end: todayEnd, label: `Last 7 Days (${start7.toLocaleDateString()} - ${todayEnd.toLocaleDateString()})` };
    }
    if (datePreset === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start: mStart, end: todayEnd, label: `This Month (${mStart.toLocaleDateString()} - ${todayEnd.toLocaleDateString()})` };
    }
    if (datePreset === 'last_month') {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: lmStart, end: lmEnd, label: `Last Month (${lmStart.toLocaleDateString()} - ${lmEnd.toLocaleDateString()})` };
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      const cStart = new Date(customStartDate + 'T00:00:00');
      const cEnd = new Date(customEndDate + 'T23:59:59');
      return { start: cStart, end: cEnd, label: `Custom Range (${customStartDate} to ${customEndDate})` };
    }
    return { start: null, end: null, label: 'All Time' };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const vNo = (v.voucherNo || v.voucherNumber || '').toLowerCase();
      const cName = (v.clientName || '').toLowerCase();
      const cPhone = (v.clientPhone || '');
      const s = search.toLowerCase().trim();

      const matchesSearch = !s || vNo.includes(s) || cName.includes(s) || cPhone.includes(s);
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const vDate = new Date(v.date || v.createdAt);
        matchesDate = vDate >= dateRange.start && vDate <= dateRange.end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [vouchers, search, statusFilter, dateRange]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalSales = filteredVouchers.reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
    const totalPaid = filteredVouchers.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
    const totalDue = filteredVouchers.reduce((sum, v) => sum + (Number(v.dueAmount) || 0), 0);
    return { count: filteredVouchers.length, totalSales, totalPaid, totalDue };
  }, [filteredVouchers]);

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <FileText className="text-blue-600" size={22} />
            <span>Sales Reports & Voucher History</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Manage and track all issued invoices and customer receipts.</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-3.5">
        {/* Row 1: Search & Status Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-2.5 sm:top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Voucher #, Customer, Phone..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="ALL">All Payment Status</option>
              <option value="PAID">PAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="DUE">DUE</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Presets & Active Range */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1 shrink-0">
              <Calendar size={13} />
              <span>Date:</span>
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: '7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDatePreset(p.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition shrink-0 ${
                  datePreset === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
            Period: <span className="font-bold text-blue-600">{dateRange.label}</span>
          </div>
        </div>

        {/* Custom Date Range Pickers */}
        {datePreset === 'custom' && (
          <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100/80 animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600 shrink-0">Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600 shrink-0">End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Invoices</span>
          <p className="text-base sm:text-lg font-black font-mono text-slate-800 mt-0.5 truncate">{summaryMetrics.count}</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Invoiced</span>
          <p className="text-base sm:text-lg font-black font-mono text-blue-600 mt-0.5 truncate">৳{summaryMetrics.totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Collected</span>
          <p className="text-base sm:text-lg font-black font-mono text-emerald-600 mt-0.5 truncate">৳{summaryMetrics.totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Due</span>
          <p className="text-base sm:text-lg font-black font-mono text-rose-600 mt-0.5 truncate">৳{summaryMetrics.totalDue.toLocaleString()}</p>
        </div>
      </div>

      {/* Vouchers Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading Sales History...</div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">No vouchers match your filter criteria.</div>
        ) : (
          <>
            {/* Mobile View: Clean App Cards (Zero Horizontal Scroll) */}
            <div className="block md:hidden space-y-2.5">
              {filteredVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-600">
                      {v.voucherNo}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      v.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700'
                        : v.status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-slate-900 block truncate">{v.clientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(v.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 text-sm block">৳{Number(v.totalAmount || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">Paid: ৳{Number(v.paidAmount || 0).toLocaleString()}</span>
                      {Number(v.dueAmount || 0) > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold block">Due: ৳{Number(v.dueAmount || 0).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                      Rep: {v.salerName || 'Store Staff'}
                    </span>

                    <div className="flex items-center space-x-1">
                      <a
                        href={`/sales-return?invoiceNo=${encodeURIComponent(v.voucherNo || v.voucherNumber || v.id)}`}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Return / Warranty"
                      >
                        <RotateCcw size={15} />
                      </a>
                      <button
                        onClick={() => setSelectedVoucher(v)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDeleteVoucher(v.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Voucher"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
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
                          v.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : v.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <a
                          href={`/sales-return?invoiceNo=${encodeURIComponent(v.voucherNo || v.voucherNumber || v.id)}`}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition inline-flex items-center"
                          title="Process Return / Warranty Claim"
                        >
                          <RotateCcw size={16} />
                        </a>
                        <button
                          onClick={() => setSelectedVoucher(v)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition inline-flex items-center"
                          title="View / Print Invoice"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(v.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition inline-flex items-center"
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
          </>
        )}
      </div>

      {/* VIEW / PRINT INVOICE MODAL */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 ${printLayout === 'A4' ? 'max-w-4xl' : 'max-w-lg'}`}>
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-10 no-print">
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <FileText size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                  Invoice Details <span className="text-blue-600 font-mono">({selectedVoucher.voucherNo})</span>
                </h3>
              </div>
              <button 
                onClick={() => setSelectedVoucher(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Layout Toggle & Date Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-slate-50/90 border-b border-slate-100 shrink-0 no-print">
              <div className="grid grid-cols-2 sm:flex items-center bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto gap-1">
                <button
                  type="button"
                  onClick={() => setPrintLayout('A4')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    printLayout === 'A4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={13} />
                  <span>A4 Paper Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout('thermal')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    printLayout === 'thermal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer size={13} />
                  <span>Thermal Slip (80mm)</span>
                </button>
              </div>

              <div className="text-[11px] sm:text-xs text-slate-500 font-mono flex items-center justify-end gap-1.5 shrink-0">
                <Calendar size={12} className="text-slate-400" />
                <span>{new Date(selectedVoucher.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Printable & Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 bg-slate-100/70">
              {printLayout === 'A4' ? (
                <div className="printable-area w-full min-w-fit flex justify-center">
                  <InvoiceA4
                    invoice={selectedVoucher}
                    company={company}
                    settings={invoiceSettings}
                    isSample={false}
                  />
                </div>
              ) : (
                <div className="printable-area max-w-sm mx-auto border border-slate-200/80 p-4 sm:p-5 rounded-2xl bg-white font-mono text-xs text-slate-800 space-y-2 shadow-sm">
                  <div className="text-center pb-2 border-b border-slate-200">
                    <h2 className="font-bold text-sm text-slate-900">{company?.name || 'BazarPOS Outlet'}</h2>
                    {company?.phone && <p>Phone: {company.phone}</p>}
                    <p className="font-semibold text-blue-600 mt-1">Invoice: {selectedVoucher.voucherNo}</p>
                    <p className="text-[10px] text-slate-500">{new Date(selectedVoucher.date).toLocaleString()}</p>
                  </div>

                  <div className="py-1 border-b border-slate-100 text-[11px] space-y-1">
                    <p>Customer: <span className="font-bold text-slate-900">{selectedVoucher.clientName}</span></p>
                    {selectedVoucher.salerName && <p>Sales Rep: {selectedVoucher.salerName}</p>}
                  </div>

                  <table className="w-full text-left text-[11px] border-b border-slate-200">
                    <thead>
                      <tr className="border-b font-bold text-slate-700">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedVoucher.items || []).map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-1">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            {item.warranty && (
                              <p className="text-[9px] text-blue-600 font-medium">Warranty: {item.warranty}</p>
                            )}
                            {(item.serialNumber || item.serialNo) && (
                              <p className="text-[9px] text-purple-700 font-mono font-medium">S/N: {item.serialNumber || item.serialNo}</p>
                            )}
                            {item.description && (
                              <p className="text-[9px] text-slate-500 italic leading-tight">{item.description}</p>
                            )}
                          </td>
                          <td className="py-1 text-center align-top font-bold">{item.quantity}</td>
                          <td className="py-1 text-right align-top font-mono font-semibold">৳{item.unitPrice * item.quantity}</td>
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
              )}
            </div>

            {/* Action Buttons: WhatsApp, Email, Link, Print */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-6 sm:py-3.5 bg-white border-t border-slate-200 shrink-0 no-print">
              <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <a
                  href={getWhatsAppShareUrl(selectedVoucher)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 sm:px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1 text-xs shadow-xs transition"
                  title="Send Invoice with Download Link via WhatsApp"
                >
                  <Share2 size={14} className="shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const matchedClient = clients.find(c => c.name === selectedVoucher?.clientName || c.id === selectedVoucher?.clientId);
                    setRecipientEmail(selectedVoucher?.clientEmail || matchedClient?.email || '');
                    setEmailModal(true);
                  }}
                  className="px-2 sm:px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1 text-xs shadow-xs transition"
                  title="Send Invoice to Customer Email with PDF Download Link"
                >
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedVoucher)}
                  className="px-2 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center space-x-1 text-xs transition border border-slate-200/80"
                  title="Copy Direct Online Invoice Download Link"
                >
                  {copiedLink ? <CheckCircle size={14} className="text-emerald-600 shrink-0" /> : <Copy size={14} className="shrink-0" />}
                  <span className="truncate">{copiedLink ? 'Copied!' : 'Link'}</span>
                </button>

                <a
                  href={getInvoiceDownloadUrl(selectedVoucher)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200/80 items-center justify-center"
                  title="Open Public Invoice in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedVoucher(null)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 text-xs shadow-md shadow-blue-500/20 transition"
                >
                  <Printer size={15} />
                  <span>Print {printLayout === 'A4' ? 'A4' : 'Thermal'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL INVOICE MODAL */}
      {emailModal && selectedVoucher && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Email Invoice</h3>
                  <p className="text-xs text-slate-500">Sends summary & direct download link</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEmailModal(false);
                  setEmailSuccessMsg('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {emailSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs font-semibold">
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                <span>{emailSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSendEmailInvoice} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Customer Email Address</label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Invoice: #{selectedVoucher.voucherNo}</p>
                  <p>Customer: {selectedVoucher.clientName}</p>
                  <p>Total: ৳{selectedVoucher.totalAmount} | Paid: ৳{selectedVoucher.paidAmount}</p>
                  <p className="text-[11px] text-indigo-600 break-all font-mono pt-1">
                    Link: {getInvoiceDownloadUrl(selectedVoucher)}
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-500/20"
                  >
                    {sendingEmail ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Send Invoice</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
