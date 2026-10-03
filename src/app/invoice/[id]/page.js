'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer, Download, Share2, CheckCircle, Store, Phone, Mail, ArrowLeft } from 'lucide-react';
import InvoiceA4 from '@/components/InvoiceA4';

export default function PublicInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;
  const storeId = searchParams.get('storeId') || 'default';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState({});
  const [settings, setSettings] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id, storeId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vouchers/public?id=${id}&storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.voucher);
        setCompany(data.company || {});
        setSettings(data.settings || {});
      } else {
        setError(data.message || 'Invoice not found or expired');
      }
    } catch (err) {
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 text-sm font-semibold">Loading Official Digital Invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-slate-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            ✕
          </div>
          <h2 className="text-lg font-bold text-slate-800">Invoice Unavailable</h2>
          <p className="text-xs text-slate-500">{error || 'Unable to retrieve invoice record.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200/80 py-6 px-3 sm:px-6 print:p-0 print:bg-white">
      {/* Top Floating Control Bar */}
      <div className="max-w-4xl mx-auto mb-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 no-print sticky top-4 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shadow-md">
            {company.name ? company.name.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm">{company.name || 'BazarPOS Outlet'}</h1>
            <p className="text-[11px] text-slate-500 font-mono">Invoice #{invoice.voucherNo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition border border-slate-200"
            title="Copy Online Invoice Link"
          >
            <Share2 size={14} />
            <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-blue-500/25"
          >
            <Printer size={15} />
            <span>Print / Download PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-x-auto bg-white/50 print:shadow-none print:m-0 print:w-full">
        <div className="printable-area min-w-fit flex justify-center">
          <InvoiceA4
            invoice={invoice}
            company={company}
            settings={settings}
            isSample={false}
          />
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="max-w-4xl mx-auto mt-6 text-center text-xs text-slate-500 no-print">
        <p>This is a computer generated digital invoice. Powered by <strong>BazarPOS Retail Cloud</strong>.</p>
      </div>
    </div>
  );
}
