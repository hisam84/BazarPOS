'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  MessageSquare,
  Send,
  Server,
  Zap,
  Check,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  BellRing,
  Store,
  FileCode,
  Save,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import EmailTemplateEditor from '@/components/EmailTemplateEditor';
import SMSGatewaySettings from '@/components/SMSGatewaySettings';

function NotificationTemplatesContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'sms' ? 'sms' : 'email';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Mailing Settings State
  const [mailSettings, setMailSettings] = useState({
    enabled: true,
    provider: 'smtp', // 'brevo' | 'smtp' | 'gmail' | 'resend' | 'sendgrid'
    fromName: 'BazarPOS Store',
    fromEmail: 'noreply@bazarpos.com',
    replyTo: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: 'tls',
    smtpUser: '',
    smtpPassword: '',
    apiKey: '',
    sendInvoiceOnSale: false,
    sendLowStockAlert: true,
    sendDailySummary: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showBrevoKey, setShowBrevoKey] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savingMail, setSavingMail] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'sms') {
      setActiveTab('sms');
    } else if (tabParam === 'email') {
      setActiveTab('email');
    }
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadMailData(u.storeId || 'default');
    } else {
      loadMailData('default');
    }
  }, []);

  const loadMailData = async (storeId) => {
    try {
      setLoading(true);
      const [compRes, mailRes] = await Promise.all([
        fetch(`/api/company?storeId=${storeId}`),
        fetch(`/api/mail-settings?storeId=${storeId}`)
      ]);

      const compData = await compRes.json();
      const mailData = await mailRes.json();

      if (compData.success && compData.company) {
        setCompany(compData.company);
        if (compData.company.email && !testEmail) {
          setTestEmail(compData.company.email);
        }
      }

      if (mailData.success && mailData.mailSettings) {
        setMailSettings(mailData.mailSettings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMailSettings = async (e) => {
    e.preventDefault();
    setSavingMail(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/mail-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          mailSettings
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Email Gateway & API configuration saved successfully!');
        setTimeout(() => setMsg(''), 3500);
      } else {
        setErrorMsg(data.message || 'Failed to save mail settings');
      }
    } catch (err) {
      setErrorMsg('Error saving mailing configuration');
    } finally {
      setSavingMail(false);
    }
  };

  const handleToggleMailEnabled = async () => {
    const nextState = !mailSettings.enabled;
    const updated = { ...mailSettings, enabled: nextState };
    setMailSettings(updated);

    try {
      await fetch('/api/mail-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          mailSettings: updated
        })
      });
      if (nextState) {
        setMsg('Email Service enabled! You can now configure credentials below.');
      } else {
        setMsg('Email Service disabled.');
      }
      setTimeout(() => setMsg(''), 3500);
    } catch (err) {
      console.error('Failed to toggle email service state:', err);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid recipient email address');
      return;
    }

    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testEmail,
          settings: mailSettings
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: 'Network error sending test email' });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-4 sm:space-y-6 pb-14 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Mail className="text-indigo-600 flex-shrink-0" size={22} />
            <span className="truncate">Email &amp; Notification Templates Studio</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Configure SMTP, Brevo, Resend, SMS Gateways and customize customer email &amp; SMS notice templates.
          </p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center p-1.5 bg-slate-200/80 rounded-2xl gap-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 ${
            activeTab === 'email'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Mail size={16} />
          <span>Email Gateway &amp; Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sms')}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 ${
            activeTab === 'sms'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <MessageSquare size={16} />
          <span>SMS Gateway &amp; Notices</span>
        </button>
      </div>

      {/* Notifications */}
      {msg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold rounded-2xl flex items-center space-x-2 animate-fadeIn">
          <CheckCircle size={17} className="flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold rounded-2xl flex items-center space-x-2">
          <AlertCircle size={17} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: EMAIL GATEWAY & TEMPLATES */}
      {activeTab === 'email' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Email Protocol Configuration Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 sm:pb-4 gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center space-x-2">
                  <Server className="text-indigo-600 flex-shrink-0" size={18} />
                  <span>Email &amp; Mailing Gateway Configuration</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Configure Brevo, SMTP, Gmail, Resend or SendGrid to send digital invoices and alerts.
                </p>
              </div>

              <div className="flex items-center space-x-3 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleToggleMailEnabled}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                    mailSettings.enabled
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${mailSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>{mailSettings.enabled ? 'Enabled' : 'Disabled'}</span>
                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${mailSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300'} flex items-center`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${mailSettings.enabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

            {!mailSettings.enabled ? (
              <div className="bg-slate-50/80 border border-dashed border-slate-300 rounded-2xl p-5 sm:p-6 text-center">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Mail size={22} />
                </div>
                <h3 className="font-bold text-slate-700 text-xs sm:text-sm mb-1">Email Service is Currently Disabled</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto mb-3.5 leading-relaxed">
                  Automated invoice emails, password reset links, low stock warnings, and daily summaries are currently turned off.
                </p>
                <button
                  type="button"
                  onClick={handleToggleMailEnabled}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition inline-flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 active:scale-98"
                >
                  <Zap size={15} />
                  <span>Enable Email Gateway</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveMailSettings} className="space-y-4 sm:space-y-6 text-xs font-medium">
                {/* Provider Selection */}
                <div>
                  <label className="block text-slate-700 mb-2 font-bold">Select Protocol / Provider</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                    {[
                      { id: 'brevo', label: 'Brevo', sub: 'REST API & Relay', icon: Send },
                      { id: 'smtp', label: 'Custom SMTP', sub: 'cPanel / Webmail', icon: Server },
                      { id: 'gmail', label: 'Gmail SMTP', sub: 'App Password', icon: Mail },
                      { id: 'resend', label: 'Resend API', sub: 'Deliverability', icon: Zap },
                      { id: 'sendgrid', label: 'SendGrid API', sub: 'Enterprise API', icon: Send },
                    ].map(prov => {
                      const Icon = prov.icon;
                      const isSelected = mailSettings.provider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => {
                            let updates = { provider: prov.id };
                            if (prov.id === 'gmail') {
                              updates.smtpHost = 'smtp.gmail.com';
                              updates.smtpPort = 587;
                              updates.smtpSecure = 'tls';
                            } else if (prov.id === 'brevo' && !mailSettings.smtpHost) {
                              updates.smtpHost = 'smtp-relay.brevo.com';
                              updates.smtpPort = 587;
                              updates.smtpSecure = 'tls';
                            }
                            setMailSettings(prev => ({ ...prev, ...updates }));
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              <Icon size={14} />
                            </div>
                            {isSelected && <Check size={14} className="text-indigo-600 font-bold" />}
                          </div>
                          <div>
                            <p className={`font-bold text-[11px] sm:text-xs truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>{prov.label}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">{prov.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sender Details */}
                <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 sm:space-y-4">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <Store size={14} className="text-indigo-600" />
                    <span>Sender Identity</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Sender Display Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BazarPOS Outlet"
                        value={mailSettings.fromName}
                        onChange={e => setMailSettings({ ...mailSettings, fromName: e.target.value })}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Sender Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. billing@yourdomain.com"
                        value={mailSettings.fromEmail}
                        onChange={e => setMailSettings({ ...mailSettings, fromEmail: e.target.value })}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                      />
                      {mailSettings.provider === 'brevo' && (
                        <p className="text-[10px] text-slate-500 mt-1">Note: Must be a verified Sender in your Brevo account.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Provider Specific Configuration */}
                {mailSettings.provider === 'brevo' ? (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                        <Send size={14} className="text-indigo-600" />
                        <span>Brevo Configuration</span>
                      </h3>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">REST API v3</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Brevo API Key *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={mailSettings.apiKey}
                          onChange={e => setMailSettings({ ...mailSettings, apiKey: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs pr-10 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Optional SMTP Fallback */}
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-700 mb-2">Or Brevo SMTP Relay credentials:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-slate-600 mb-0.5 text-[10px]">Host</label>
                          <input
                            type="text"
                            placeholder="smtp-relay.brevo.com"
                            value={mailSettings.smtpHost}
                            onChange={e => setMailSettings({ ...mailSettings, smtpHost: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-0.5 text-[10px]">Login / User</label>
                          <input
                            type="text"
                            placeholder="your-email@domain.com"
                            value={mailSettings.smtpUser}
                            onChange={e => setMailSettings({ ...mailSettings, smtpUser: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-0.5 text-[10px]">SMTP Key</label>
                          <div className="relative">
                            <input
                              type={showBrevoKey ? 'text' : 'password'}
                              placeholder="Brevo SMTP Master Key"
                              value={mailSettings.smtpPassword}
                              onChange={e => setMailSettings({ ...mailSettings, smtpPassword: e.target.value })}
                              className="w-full pl-2.5 pr-7 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowBrevoKey(!showBrevoKey)}
                              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                              {showBrevoKey ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (mailSettings.provider === 'smtp' || mailSettings.provider === 'gmail') ? (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 sm:space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                      <Server size={14} className="text-indigo-600" />
                      <span>SMTP Server Details</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 mb-1 font-semibold">SMTP Host *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. smtp.gmail.com"
                          value={mailSettings.smtpHost}
                          onChange={e => setMailSettings({ ...mailSettings, smtpHost: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-semibold">Port *</label>
                        <input
                          type="number"
                          required
                          placeholder="587"
                          value={mailSettings.smtpPort}
                          onChange={e => setMailSettings({ ...mailSettings, smtpPort: Number(e.target.value) })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-slate-700 mb-1 font-semibold">SMTP Username *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. user@domain.com"
                          value={mailSettings.smtpUser}
                          onChange={e => setMailSettings({ ...mailSettings, smtpUser: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-1 font-semibold">SMTP Password *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••••••••••"
                            value={mailSettings.smtpPassword}
                            onChange={e => setMailSettings({ ...mailSettings, smtpPassword: e.target.value })}
                            className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs pr-10 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 sm:space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                      <Zap size={14} className="text-indigo-600" />
                      <span>{mailSettings.provider === 'resend' ? 'Resend API Key' : 'SendGrid API Key'}</span>
                    </h3>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">API Key *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder={mailSettings.provider === 'resend' ? 're_123456789...' : 'SG.123456789...'}
                          value={mailSettings.apiKey}
                          onChange={e => setMailSettings({ ...mailSettings, apiKey: e.target.value })}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono text-xs pr-10 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Automated Trigger Options */}
                <div className="p-3 sm:p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-2.5 sm:space-y-3">
                  <h3 className="font-bold text-indigo-950 text-xs flex items-center space-x-1.5">
                    <BellRing size={14} className="text-indigo-600" />
                    <span>Automated Dispatch Triggers</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <label className="flex items-center space-x-2 bg-white p-2.5 sm:p-3 rounded-xl border border-indigo-200/60 cursor-pointer hover:border-indigo-400 transition">
                      <input
                        type="checkbox"
                        checked={mailSettings.sendInvoiceOnSale}
                        onChange={e => setMailSettings({ ...mailSettings, sendInvoiceOnSale: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Sales Invoices</span>
                        <span className="text-[10px] text-slate-500 block">Digital customer receipt</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2 bg-white p-2.5 sm:p-3 rounded-xl border border-indigo-200/60 cursor-pointer hover:border-indigo-400 transition">
                      <input
                        type="checkbox"
                        checked={mailSettings.sendLowStockAlert}
                        onChange={e => setMailSettings({ ...mailSettings, sendLowStockAlert: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Low Stock Warning</span>
                        <span className="text-[10px] text-slate-500 block">Inventory replenishment</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2 bg-white p-2.5 sm:p-3 rounded-xl border border-indigo-200/60 cursor-pointer hover:border-indigo-400 transition">
                      <input
                        type="checkbox"
                        checked={mailSettings.sendDailySummary}
                        onChange={e => setMailSettings({ ...mailSettings, sendDailySummary: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Daily Sales Summary</span>
                        <span className="text-[10px] text-slate-500 block">End-of-day report</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingMail}
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-md shadow-indigo-600/20 active:scale-98"
                  >
                    <Save size={15} />
                    <span>{savingMail ? 'Saving Mail Gateway...' : 'Save Email Configuration'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Live Test Email Tool */}
            {mailSettings.enabled && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
                <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Send size={14} className="text-emerald-600" />
                  <span>Test Live Email Dispatch</span>
                </h3>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="Enter recipient email (e.g. yourname@gmail.com)"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    className="flex-1 px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-98"
                  >
                    <Send size={13} />
                    <span>{sendingTest ? 'Sending...' : 'Send Test Email'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fadeIn ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {testResult.success ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <AlertCircle size={15} className="text-rose-600 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Templates Visual Editor */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
            <EmailTemplateEditor storeId={user?.storeId || 'default'} companyInfo={company} />
          </div>
        </div>
      )}

      {/* TAB 2: SMS GATEWAY & NOTICES */}
      {activeTab === 'sms' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
          <SMSGatewaySettings storeId={user?.storeId || 'default'} companyInfo={company} />
        </div>
      )}
    </div>
  );
}

export default function NotificationTemplatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <NotificationTemplatesContent />
    </Suspense>
  );
}
