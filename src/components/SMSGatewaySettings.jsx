'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Zap,
  Save,
  Send,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Globe,
  Server,
  BellRing,
  Info,
  Layers,
  Code,
  RotateCcw,
  Sparkles,
  Receipt,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { DEFAULT_SMS_SETTINGS, SMS_AVAILABLE_VARIABLES } from '@/lib/sms-constants';
import { renderTemplate } from '@/lib/email-templates';

const SMS_PROVIDERS = [
  { id: 'bulksmsbd', name: 'BulkSMS BD', sub: 'Popular BD Gateway', icon: Smartphone, defaultUrl: 'https://bulksmsbd.net/api/smsapi' },
  { id: 'greenweb', name: 'Greenweb BD', sub: 'Token-based API', icon: Smartphone, defaultUrl: 'https://api.greenweb.com.bd/api.php' },
  { id: 'mimisms', name: 'Mimi SMS', sub: 'REST API v1', icon: Smartphone, defaultUrl: 'https://api.mimisms.com/api/v1/send-sms' },
  { id: 'twilio', name: 'Twilio Global', sub: 'International Cloud', icon: Globe, defaultUrl: 'https://api.twilio.com' },
  { id: 'custom', name: 'Custom Gateway', sub: 'Any HTTP REST / GET / POST', icon: Server, defaultUrl: '' },
];

const SMS_TEMPLATE_TABS = [
  { id: 'invoice', name: 'Sales Receipt SMS', icon: Receipt, tag: 'POS Checkout' },
  { id: 'due_reminder', name: 'Due Balance Reminder', icon: AlertCircle, tag: 'Accounts Due' },
  { id: 'welcome_customer', name: 'Welcome Customer', icon: UserPlus, tag: 'CRM Greeting' },
  { id: 'low_stock', name: 'Low Stock Alert', icon: Layers, tag: 'Inventory Notice' },
  { id: 'otp', name: 'Security OTP SMS', icon: ShieldCheck, tag: 'Auth Code' }
];

const SAMPLE_SMS_DATA = {
  customer_name: 'Rahim Chowdhury',
  customer_id: 'CUST-1045',
  company_name: 'BazarPOS Superstore',
  company_phone: '01711223344',
  invoice_no: 'INV-2026-0892',
  total_amount: '৳7,850',
  paid_amount: '৳5,000',
  due_amount: '৳2,850',
  invoice_link: 'https://bazarpos.app/invoice/v_demo123',
  product_name: 'Wireless Barcode Scanner',
  product_code: 'PRD-SCN-01',
  current_stock: '2',
  otp_code: '492815',
  date: new Date().toLocaleDateString('en-GB')
};

export default function SMSGatewaySettings({ storeId = 'default', companyInfo = {} }) {
  const [smsSettings, setSmsSettings] = useState(DEFAULT_SMS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedTpl, setSelectedTpl] = useState('invoice');
  const [copiedVar, setCopiedVar] = useState(null);

  const textareaRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, [storeId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sms/settings?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.smsSettings) {
        setSmsSettings(prev => ({
          ...DEFAULT_SMS_SETTINGS,
          ...data.smsSettings,
          templates: {
            ...DEFAULT_SMS_SETTINGS.templates,
            ...(data.smsSettings.templates || {})
          }
        }));
      }
    } catch (e) {
      console.error('Failed to load SMS settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async () => {
    const nextState = !smsSettings.enabled;
    const updated = { ...smsSettings, enabled: nextState };
    setSmsSettings(updated);

    try {
      await fetch('/api/sms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, smsSettings: updated })
      });
      setFeedback({
        type: 'success',
        message: nextState ? 'SMS Service enabled! Please configure API credentials below.' : 'SMS Service disabled.'
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (e) {
      console.error('Failed to toggle SMS:', e);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/sms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, smsSettings })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'SMS Gateway and notification templates saved successfully!' });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to save SMS settings' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error saving SMS settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetTemplate = (tplKey) => {
    const defaultText = DEFAULT_SMS_SETTINGS.templates[tplKey] || '';
    setSmsSettings(prev => ({
      ...prev,
      templates: {
        ...(prev.templates || {}),
        [tplKey]: defaultText
      }
    }));
    setFeedback({ type: 'success', message: `Template reset to default!` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleInsertVariable = (varKey) => {
    const textarea = textareaRef.current;
    const currentText = smsSettings.templates?.[selectedTpl] || '';
    if (!textarea) {
      const updated = currentText + ' ' + varKey;
      setSmsSettings(prev => ({
        ...prev,
        templates: {
          ...(prev.templates || {}),
          [selectedTpl]: updated
        }
      }));
      navigator.clipboard?.writeText(varKey);
      setCopiedVar(varKey);
      setTimeout(() => setCopiedVar(null), 2000);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const newText = currentText.substring(0, start) + varKey + currentText.substring(end);

    setSmsSettings(prev => ({
      ...prev,
      templates: {
        ...(prev.templates || {}),
        [selectedTpl]: newText
      }
    }));
    navigator.clipboard?.writeText(varKey);
    setCopiedVar(varKey);
    setTimeout(() => setCopiedVar(null), 2000);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + varKey.length, start + varKey.length);
      }
    }, 50);
  };

  const handleSendTestSMS = async () => {
    if (!testPhone || testPhone.length < 9) {
      alert('Please enter a valid mobile number (e.g. 01712345678)');
      return;
    }

    setSendingTest(true);
    setTestResult(null);
    try {
      const liveRendered = renderTemplate(smsSettings.templates?.[selectedTpl] || '', {
        ...SAMPLE_SMS_DATA,
        company_name: companyInfo?.name || 'BazarPOS Store',
        company_phone: companyInfo?.phone || '01700000000'
      });

      const res = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          phone: testPhone,
          testMessage: liveRendered
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: 'Failed to dispatch test SMS' });
    } finally {
      setSendingTest(false);
    }
  };

  const currentTemplateText = smsSettings.templates?.[selectedTpl] || DEFAULT_SMS_SETTINGS.templates[selectedTpl] || '';
  const charCount = currentTemplateText.length;
  const isUnicode = /[^\u0000-\u007F]/.test(currentTemplateText);
  const maxCharsPerPart = isUnicode ? 70 : 160;
  const smsParts = Math.ceil(charCount / maxCharsPerPart) || 1;

  const previewRenderedText = renderTemplate(currentTemplateText, {
    ...SAMPLE_SMS_DATA,
    company_name: companyInfo?.name || 'BazarPOS Store',
    company_phone: companyInfo?.phone || '01711223344'
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <MessageSquare className="text-emerald-600" size={20} />
            <span>SMS Gateway &amp; Notification Templates</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure SMS API providers and customize editable SMS notifications with dynamic tags.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs ${
              smsSettings.enabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${smsSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>{smsSettings.enabled ? 'SMS Gateway Active' : 'Disabled'}</span>
            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${smsSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300'} flex items-center`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${smsSettings.enabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl border font-semibold flex items-center space-x-2 text-xs animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {!smsSettings.enabled ? (
        <div className="bg-slate-50/80 border border-dashed border-slate-300 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <MessageSquare size={22} />
          </div>
          <h3 className="font-bold text-slate-700 text-sm mb-1">SMS Service is Currently Disabled</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
            Automated SMS receipts, customer due reminders, and notification dispatches are paused.
          </p>
          <button
            type="button"
            onClick={handleToggleEnabled}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition inline-flex items-center space-x-2 shadow-md shadow-emerald-600/20"
          >
            <Zap size={15} />
            <span>Enable &amp; Configure SMS Gateway</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6 font-medium">
            {/* Provider Selection */}
            <div>
              <label className="block text-slate-700 mb-2 font-bold">Select SMS Gateway / API Provider</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {SMS_PROVIDERS.map(prov => {
                  const Icon = prov.icon;
                  const isSelected = smsSettings.provider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setSmsSettings(prev => ({ ...prev, provider: prov.id }))}
                      className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Icon size={16} />
                        </div>
                        {isSelected && <Check size={16} className="text-emerald-600 font-bold" />}
                      </div>
                      <div>
                        <p className={`font-bold text-xs ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>{prov.name}</p>
                        <p className="text-[10px] text-slate-500">{prov.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Provider Credentials & API Configuration */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                <Server size={14} className="text-emerald-600" />
                <span>
                  {smsSettings.provider === 'bulksmsbd' && 'BulkSMS BD (bulksmsbd.net) Configuration'}
                  {smsSettings.provider === 'greenweb' && 'Greenweb SMS BD (greenweb.com.bd) Configuration'}
                  {smsSettings.provider === 'mimisms' && 'Mimi SMS BD (mimisms.com) Configuration'}
                  {smsSettings.provider === 'twilio' && 'Twilio SMS Cloud Configuration'}
                  {smsSettings.provider === 'custom' && 'Universal Custom HTTP REST Gateway Configuration'}
                </span>
              </h3>

              {smsSettings.provider === 'twilio' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Account SID *</label>
                    <input
                      type="text"
                      required
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={smsSettings.username || ''}
                      onChange={e => setSmsSettings({ ...smsSettings, username: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Auth Token *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••••••"
                        value={smsSettings.password || ''}
                        onChange={e => setSmsSettings({ ...smsSettings, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs pr-10 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">From Number / Sender ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="+1234567890"
                      value={smsSettings.senderId || ''}
                      onChange={e => setSmsSettings({ ...smsSettings, senderId: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : smsSettings.provider === 'custom' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 mb-1 font-semibold">Gateway API Endpoint URL *</label>
                      <input
                        type="text"
                        required
                        placeholder="https://api.yourgateway.com/send?to={phone}&msg={message}&key={api_key}"
                        value={smsSettings.apiUrl || ''}
                        onChange={e => setSmsSettings({ ...smsSettings, apiUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">HTTP Method *</label>
                      <select
                        value={smsSettings.httpMethod || 'POST_JSON'}
                        onChange={e => setSmsSettings({ ...smsSettings, httpMethod: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="GET">HTTP GET (Query Parameters)</option>
                        <option value="POST_JSON">HTTP POST (JSON Payload)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">API Key / Token</label>
                      <input
                        type="text"
                        placeholder="e.g. your_secret_api_token"
                        value={smsSettings.apiKey || ''}
                        onChange={e => setSmsSettings({ ...smsSettings, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Sender ID / Masking (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. STORENAME"
                        value={smsSettings.senderId || ''}
                        onChange={e => setSmsSettings({ ...smsSettings, senderId: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      {smsSettings.provider === 'greenweb' ? 'Greenweb SMS Token *' : 'API Key / Token *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={smsSettings.provider === 'greenweb' ? 'e.g. 1029384756abcdef' : 'e.g. apikey_xxxxxxxxxxxxxxxxxxxx'}
                        value={smsSettings.apiKey || ''}
                        onChange={e => setSmsSettings({ ...smsSettings, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs pr-10 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {smsSettings.provider === 'bulksmsbd' && (
                      <p className="text-[10px] text-slate-500 mt-1">Get your API key from bulksmsbd.net dashboard &gt; Developer API</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      Sender ID / Masking Name {smsSettings.provider === 'greenweb' ? '(Optional)' : '(e.g. 88096... or Approved Brand)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8809612345678 or STORENAME"
                      value={smsSettings.senderId || ''}
                      onChange={e => setSmsSettings({ ...smsSettings, senderId: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Automated Notification Triggers */}
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3">
              <h3 className="font-bold text-emerald-950 text-xs flex items-center space-x-1.5">
                <BellRing size={14} className="text-emerald-600" />
                <span>Automated SMS Dispatch Triggers</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-emerald-200/60 cursor-pointer hover:border-emerald-400 transition">
                  <input
                    type="checkbox"
                    checked={smsSettings.sendInvoiceOnSale || false}
                    onChange={e => setSmsSettings({ ...smsSettings, sendInvoiceOnSale: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Auto-SMS on Sale</span>
                    <span className="text-[10px] text-slate-500 block">Send receipt SMS upon POS sale</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-emerald-200/60 cursor-pointer hover:border-emerald-400 transition">
                  <input
                    type="checkbox"
                    checked={smsSettings.sendDueReminder || false}
                    onChange={e => setSmsSettings({ ...smsSettings, sendDueReminder: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Due Reminders</span>
                    <span className="text-[10px] text-slate-500 block">Alert customers on due balance</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-emerald-200/60 cursor-pointer hover:border-emerald-400 transition">
                  <input
                    type="checkbox"
                    checked={smsSettings.sendLowStockAlert || false}
                    onChange={e => setSmsSettings({ ...smsSettings, sendLowStockAlert: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Low Stock Alerts</span>
                    <span className="text-[10px] text-slate-500 block">Alert owner on critical stock units</span>
                  </div>
                </label>
              </div>
            </div>

            {/* EDITABLE SMS & NOTIFICATION TEMPLATES STUDIO */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Code size={15} className="text-emerald-600" />
                  <span>Editable Notification &amp; SMS Templates</span>
                </h3>

                <button
                  type="button"
                  onClick={() => handleResetTemplate(selectedTpl)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1"
                >
                  <RotateCcw size={12} />
                  <span>Reset Current Template</span>
                </button>
              </div>

              {/* Template Tabs */}
              <div className="flex flex-wrap gap-2">
                {SMS_TEMPLATE_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isSelected = selectedTpl === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedTpl(tab.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Variable Chips */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Click variable tag to insert into message template:</span>
                  {copiedVar && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                      Inserted {copiedVar}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SMS_AVAILABLE_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      className="px-2 py-1 bg-slate-50 hover:bg-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-600 rounded-lg text-[11px] font-mono font-bold text-emerald-800 transition shadow-xs"
                      title={`${v.desc} - Click to insert`}
                    >
                      <span>{v.key}</span>
                      <span className="font-normal font-sans text-[9px] text-slate-400 ml-1">({v.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Column: Editor & Mobile Screen Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Textarea Editor */}
                <div className="lg:col-span-7 space-y-2">
                  <label className="block text-slate-700 font-bold text-xs">Template Text Message Content:</label>
                  <textarea
                    ref={textareaRef}
                    rows={6}
                    value={smsSettings.templates?.[selectedTpl] || ''}
                    onChange={e => {
                      const text = e.target.value;
                      setSmsSettings(prev => ({
                        ...prev,
                        templates: {
                          ...(prev.templates || {}),
                          [selectedTpl]: text
                        }
                      }));
                    }}
                    className="w-full p-3.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-sans text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-medium"
                    placeholder="Type your SMS message..."
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Encoding: <strong className="text-slate-700">{isUnicode ? 'Unicode (70 char limit)' : 'Standard GSM (160 char limit)'}</strong></span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                      charCount > maxCharsPerPart ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {charCount} chars • {smsParts} SMS {smsParts > 1 ? 'Parts' : 'Part'}
                    </span>
                  </div>
                </div>

                {/* Simulated Phone Screen Preview */}
                <div className="lg:col-span-5 bg-slate-900 p-3 rounded-2xl text-white shadow-md">
                  <div className="text-center pb-2 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Simulated Phone SMS</span>
                    <span className="font-mono text-emerald-400">Preview</span>
                  </div>
                  <div className="py-4 px-2 space-y-2">
                    <div className="bg-emerald-700/30 border border-emerald-500/40 p-3 rounded-2xl rounded-tl-none text-[11px] text-slate-100 leading-relaxed shadow-sm">
                      {previewRenderedText}
                    </div>
                    <span className="text-[9px] text-slate-500 block text-right">Just now • SMS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Configuration Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center space-x-2 text-xs shadow-md shadow-emerald-600/20"
              >
                <Save size={16} />
                <span>{saving ? 'Saving SMS Settings...' : 'Save SMS Gateway & Templates'}</span>
              </button>
            </div>
          </form>

          {/* Test SMS Dispatch Tool */}
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
              <Send size={14} className="text-emerald-600" />
              <span>Live Test SMS Dispatcher &amp; Gateway Diagnostic</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter recipient mobile number (e.g. 01712345678 or +88017...)"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSendTestSMS}
                disabled={sendingTest}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <Send size={14} />
                <span>{sendingTest ? 'Sending SMS...' : 'Send Live Test SMS'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fadeIn ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
