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
  X,
  Share2,
  Mail,
  Send,
  CheckCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import InvoiceA4 from '@/components/InvoiceA4';

export default function VoucherHistoryPage() {
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
      const [vRes, invRes] = await Promise.all([
        fetch(`/api/vouchers?storeId=${storeId}`),
        fetch(`/api/invoice-settings?storeId=${storeId}`)
      ]);
      const data = await vRes.json();
      const invData = await invRes.json();

      if (data.success) {
        setVouchers(data.vouchers || []);
      }
      if (invData.success) {
        if (invData.settings) setInvoiceSettings(invData.settings);
        if (invData.company) setCompany(invData.company);
        if (invData.settings?.paperSize) setPrintLayout(invData.settings.paperSize === 'thermal' ? 'thermal' : 'A4');
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
    return `${origin}/invoice/${voucher.id}?storeId=${user?.storeId || 'default'}`;
  };

  const getWhatsAppShareUrl = (voucher) => {
    if (!voucher) return '#';
    const phone = voucher.clientPhone ? voucher.clientPhone.replace(/[^0-9]/g, '') : '';
    const downloadUrl = getInvoiceDownloadUrl(voucher);

    const text = encodeURIComponent(
      `*${user?.storeName || company?.name || 'BazarPOS Outlet'}*\n` +
      `📄 *Invoice #:* ${voucher.voucherNo}\n` +
      `📅 *Date:* ${new Date(voucher.date).toLocaleDateString()}\n` +
      `💵 *Total Amount:* ৳${voucher.totalAmount}\n` +
      `✅ *Paid:* ৳${voucher.paidAmount}\n` +
      (voucher.dueAmount > 0 ? `⚠️ *Due Balance:* ৳${voucher.dueAmount}\n` : '') +
      `\n📥 *Download / View Invoice Link:*\n${downloadUrl}\n\n` +
      `Thank you for your business!`
    );
    return `https://wa.me/${phone}?text=${text}`;
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`bg-white rounded-2xl w-full shadow-2xl space-y-4 my-8 ${printLayout === 'A4' ? 'max-w-4xl max-h-[92vh] flex flex-col' : 'max-w-lg'} p-6`}>
            <div className="flex items-center justify-between no-print border-b pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800 text-lg">
                  Invoice Details ({selectedVoucher.voucherNo})
                </h3>
              </div>
              <button onClick={() => setSelectedVoucher(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center justify-between no-print">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrintLayout('A4')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    printLayout === 'A4' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={14} />
                  <span>A4 Paper Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout('thermal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    printLayout === 'thermal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer size={14} />
                  <span>Thermal Slip (80mm)</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {new Date(selectedVoucher.date).toLocaleDateString()}
              </span>
            </div>

            {/* Printable Area */}
            <div className="flex-1 overflow-y-auto max-h-[65vh] p-2 bg-slate-100/60 rounded-xl border border-slate-200">
              {printLayout === 'A4' ? (
                <div className="printable-area">
                  <InvoiceA4
                    invoice={selectedVoucher}
                    company={company}
                    settings={invoiceSettings}
                    isSample={false}
                  />
                </div>
              ) : (
                <div className="printable-area max-w-sm mx-auto border p-4 rounded-xl bg-white font-mono text-xs text-slate-800 space-y-2 shadow-sm">
                  <div className="text-center pb-2 border-b">
                    <h2 className="font-bold text-sm text-slate-900">{company?.name || 'BazarPOS Outlet'}</h2>
                    {company?.phone && <p>Phone: {company.phone}</p>}
                    <p className="font-semibold text-blue-600 mt-1">Invoice: {selectedVoucher.voucherNo}</p>
                    <p className="text-[10px] text-slate-500">{new Date(selectedVoucher.date).toLocaleString()}</p>
                  </div>

                  <div className="py-1 border-b text-[11px] space-y-1">
                    <p>Customer: <span className="font-bold">{selectedVoucher.clientName}</span></p>
                    {selectedVoucher.salerName && <p>Sales Rep: {selectedVoucher.salerName}</p>}
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
              )}
            </div>

            {/* Action Buttons: WhatsApp, Email, Link, Print */}
            <div className="flex flex-wrap items-center justify-between gap-2 no-print pt-3 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={getWhatsAppShareUrl(selectedVoucher)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center space-x-1.5 text-xs shadow-sm transition"
                  title="Send Invoice with Download Link via WhatsApp"
                >
                  <Share2 size={15} />
                  <span>WhatsApp Link</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setRecipientEmail(selectedVoucher?.clientEmail || '');
                    setEmailModal(true);
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center space-x-1.5 text-xs shadow-sm transition"
                  title="Send Invoice to Customer Email with PDF Download Link"
                >
                  <Mail size={15} />
                  <span>Email Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedVoucher)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 text-xs transition"
                  title="Copy Direct Online Invoice Download Link"
                >
                  {copiedLink ? <CheckCircle size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <a
                  href={getInvoiceDownloadUrl(selectedVoucher)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                  title="Open Public Invoice in new tab"
                >
                  <ExternalLink size={15} />
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedVoucher(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-2 text-xs shadow-md shadow-blue-500/20"
                >
                  <Printer size={16} />
                  <span>Print {printLayout === 'A4' ? 'A4 Invoice' : 'Thermal Slip'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL INVOICE MODAL */}
      {emailModal && selectedVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
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
                className="text-slate-400 hover:text-slate-600"
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
