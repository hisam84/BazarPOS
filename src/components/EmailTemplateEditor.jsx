'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileCode,
  Eye,
  RotateCcw,
  Save,
  Check,
  Copy,
  Info,
  Sparkles,
  Mail,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  Code
} from 'lucide-react';
import { DEFAULT_EMAIL_TEMPLATES, renderTemplate } from '@/lib/email-templates';

// Sample test data for live preview interpolation
const PREVIEW_SAMPLE_DATA = {
  invoice: {
    company_name: 'BazarPOS Superstore',
    company_phone: '+880 1711-223344',
    company_email: 'sales@bazarpos.com',
    company_address: '123 Commercial Plaza, Motijheel, Dhaka-1000',
    logo_url: '',
    customer_name: 'Rahim Chowdhury',
    customer_phone: '+880 1812-345678',
    invoice_no: 'INV-2026-0892',
    invoice_date: new Date().toLocaleDateString('en-GB'),
    invoice_link: '#preview-link',
    items_table: `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b;">
          <strong>Wireless Bluetooth Barcode Scanner</strong>
          <div style="font-size: 11px; color: #2563eb; margin-top: 2px;">🛡️ 1 Year Warranty</div>
          <div style="font-size: 11px; color: #7c3aed; font-family: monospace; margin-top: 2px;">🔢 S/N: SN-88392019</div>
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: center; color: #334155;">2 pcs</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #0f172a; font-weight: bold;">৳6,400</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b;">
          <strong>Thermal Receipt Paper Rolls (80mm)</strong>
        </td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: center; color: #334155;">10 rolls</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #0f172a; font-weight: bold;">৳800</td>
      </tr>
    `,
    subtotal: '৳7,200',
    discount: '৳200',
    tax: '৳350',
    total_amount: '৳7,350',
    paid_amount: '৳7,350',
    due_amount: '৳0',
    payment_status: 'PAID',
    saler_name: 'Tanvir Ahmed (POS Counter 1)'
  },
  password_reset: {
    company_name: 'BazarPOS Outlet',
    logo_url: '',
    user_name: 'Kamrul Hassan',
    user_role: 'Store Manager',
    user_email: 'kamrul@bazarpos.com',
    otp_code: '482915',
    expiry_minutes: '15'
  },
  low_stock: {
    company_name: 'BazarPOS Outlet',
    product_name: 'Samsung 24" IPS Borderless Monitor',
    product_code: 'PRD-SAM-24',
    current_stock: '2',
    reorder_level: '5',
    unit: 'units',
    date: new Date().toLocaleString()
  },
  daily_summary: {
    company_name: 'BazarPOS Mega Mall',
    date: new Date().toLocaleDateString('en-GB'),
    total_sales: '৳148,500',
    total_orders: '42 Orders',
    cash_received: '৳125,000',
    due_collected: '৳15,000',
    total_profit: '৳34,200',
    top_products: '1. FastPOS Thermal Printer (12 sold)<br/>2. Wireless Optical Mouse (24 sold)<br/>3. LED Monitor (5 sold)'
  }
};

const TEMPLATE_META = [
  { id: 'invoice', name: 'Digital Sales Invoice', icon: Mail, tag: 'Customer Receipt' },
  { id: 'password_reset', name: 'Password Reset OTP', icon: ShieldCheck, tag: 'Auth & Security' },
  { id: 'low_stock', name: 'Low Stock Alert', icon: AlertTriangle, tag: 'Inventory Warning' },
  { id: 'daily_summary', name: 'Daily Business Summary', icon: BarChart3, tag: 'Owner Digest' },
];

export default function EmailTemplateEditor({ storeId = 'default', companyInfo = {} }) {
  const [selectedId, setSelectedId] = useState('invoice');
  const [templates, setTemplates] = useState(DEFAULT_EMAIL_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [copiedVar, setCopiedVar] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const textareaRef = useRef(null);

  useEffect(() => {
    loadTemplates();
  }, [storeId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mail-templates?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.templates) {
        setTemplates(data.templates);
      }
    } catch (e) {
      console.error('Failed to load email templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = templates[selectedId] || DEFAULT_EMAIL_TEMPLATES[selectedId] || DEFAULT_EMAIL_TEMPLATES.invoice;

  const handleUpdateCurrent = (field, value) => {
    setTemplates(prev => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        [field]: value
      }
    }));
  };

  const handleInsertVariable = (varKey) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      navigator.clipboard?.writeText(varKey);
      setCopiedVar(varKey);
      setTimeout(() => setCopiedVar(null), 2000);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentBody = currentTemplate.bodyHtml || '';
    const newBody = currentBody.substring(0, start) + varKey + currentBody.substring(end);

    handleUpdateCurrent('bodyHtml', newBody);
    navigator.clipboard?.writeText(varKey);
    setCopiedVar(varKey);
    setTimeout(() => setCopiedVar(null), 2000);

    // Reposition cursor after inserted variable
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + varKey.length, start + varKey.length);
      }
    }, 50);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await fetch('/api/mail-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          templates
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Email templates saved successfully!' });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to save templates' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error saving templates' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm(`Are you sure you want to reset the '${currentTemplate.name}' template to default? Custom modifications will be replaced.`)) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/mail-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          action: 'reset',
          templateId: selectedId
        })
      });
      const data = await res.json();
      if (data.success) {
        const defaultTpl = DEFAULT_EMAIL_TEMPLATES[selectedId];
        setTemplates(prev => ({
          ...prev,
          [selectedId]: { ...defaultTpl }
        }));
        setFeedback({ type: 'success', message: `Template '${currentTemplate.name}' reset to factory default!` });
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to reset template' });
    } finally {
      setSaving(false);
    }
  };

  // Prepare Live Preview Sample Variables
  const previewData = {
    ...(PREVIEW_SAMPLE_DATA[selectedId] || {}),
    ...(companyInfo?.name ? { company_name: companyInfo.name } : {}),
    ...(companyInfo?.logoUrl ? { logo_url: companyInfo.logoUrl } : {}),
    ...(companyInfo?.phone ? { company_phone: companyInfo.phone } : {}),
    ...(companyInfo?.email ? { company_email: companyInfo.email } : {}),
    ...(companyInfo?.address ? { company_address: companyInfo.address } : {})
  };

  const renderedPreviewHtml = renderTemplate(currentTemplate.bodyHtml, previewData);
  const renderedPreviewSubject = renderTemplate(currentTemplate.subject, previewData);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <Sparkles className="text-indigo-600" size={20} />
            <span>Email Templates &amp; Dynamic Variable Builder</span>
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Customize HTML email layouts, subjects, and dynamic placeholders (e.g. <code className="bg-slate-200/80 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">{`{{customer_name}}`}</code>, <code className="bg-slate-200/80 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">{`{{invoice_no}}`}</code>) sent to clients and staff.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={saving || loading}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition flex items-center space-x-1.5 shadow-xs"
            title="Reset this template to factory default"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center space-x-2 shadow-md shadow-indigo-600/20"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 mx-6 mt-4 rounded-xl border font-semibold flex items-center space-x-2 text-xs animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Template Selector Tabs */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap gap-2">
        {TEMPLATE_META.map(meta => {
          const Icon = meta.icon;
          const isSelected = selectedId === meta.id;
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => {
                setSelectedId(meta.id);
                setFeedback(null);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold transition text-left border ${
                isSelected
                  ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                <Icon size={14} />
              </div>
              <div>
                <div className="leading-tight text-xs">{meta.name}</div>
                <div className="text-[10px] font-normal text-slate-400">{meta.tag}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* Template Subject Line */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 font-bold text-xs">
            Email Subject Line (Supports Dynamic Variables) *
          </label>
          <div className="relative">
            <input
              type="text"
              value={currentTemplate.subject || ''}
              onChange={e => handleUpdateCurrent('subject', e.target.value)}
              placeholder="e.g. Invoice #{{invoice_no}} from {{company_name}}"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Preview Subject: <span className="font-semibold text-slate-700 font-sans">"{renderedPreviewSubject}"</span>
          </p>
        </div>

        {/* Dynamic Variable Chips & Quick Insert */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-950 text-xs">
              <Code size={14} className="text-indigo-600" />
              <span>Available Dynamic Variables (Click to insert into template)</span>
            </div>
            {copiedVar && (
              <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1">
                <Check size={12} />
                <span>Copied &amp; Inserted {copiedVar}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {(currentTemplate.variables || []).map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => handleInsertVariable(v.key)}
                className="group flex items-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-slate-700 text-[11px] font-mono transition shadow-xs"
                title={`${v.desc} - Click to insert`}
              >
                <span className="font-bold text-indigo-600 group-hover:text-white">{v.key}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-100 font-sans">({v.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor vs Live Preview Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileCode size={14} />
                <span>HTML Template Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  activeTab === 'preview'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Eye size={14} />
                <span>Live Sample Preview</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {activeTab === 'editor' ? 'Monospace HTML & Template Tags' : 'Real-time rendering with sample data'}
            </span>
          </div>

          {activeTab === 'editor' ? (
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={18}
                  value={currentTemplate.bodyHtml || ''}
                  onChange={e => handleUpdateCurrent('bodyHtml', e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 selection:bg-indigo-500 selection:text-white resize-y"
                  placeholder="<div>Enter HTML template with {{variable}} placeholders...</div>"
                  spellCheck="false"
                />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Info size={13} className="text-slate-400" />
                <span>Tip: Inline CSS styles are recommended for universal compatibility with Gmail, Outlook, Yahoo, and mobile email clients.</span>
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl bg-slate-100/70 p-4 sm:p-6 overflow-hidden">
              <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3 text-xs flex items-center justify-between text-slate-600">
                <div className="truncate">
                  <strong className="text-slate-800">Subject:</strong> {renderedPreviewSubject}
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold shrink-0 ml-2">
                  Sample View
                </span>
              </div>
              <div
                className="bg-white rounded-xl shadow-xs overflow-x-auto p-4"
                dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
