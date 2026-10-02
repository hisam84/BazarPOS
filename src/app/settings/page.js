'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Download,
  Upload,
  Store,
  User,
  CheckCircle,
  Save,
  KeyRound,
  ShieldCheck,
  FileText,
  Building2,
  Lock,
  Phone,
  Mail,
  MapPin,
  Send,
  Server,
  Zap,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  BellRing,
  Globe
} from 'lucide-react';
import EmailTemplateEditor from '@/components/EmailTemplateEditor';
import SMSGatewaySettings from '@/components/SMSGatewaySettings';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Store Branding State
  const [company, setCompany] = useState({
    name: '',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    logoUrl: '',
    faviconUrl: ''
  });

  // Store Owner Profile State
  const [ownerInfo, setOwnerInfo] = useState({
    owner: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Mailing & API Settings State
  const [mailSettings, setMailSettings] = useState({
    enabled: true,
    provider: 'smtp', // 'smtp' | 'resend' | 'sendgrid' | 'gmail'
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
  const [showOwnerNewPassword, setShowOwnerNewPassword] = useState(false);
  const [showOwnerConfirmPassword, setShowOwnerConfirmPassword] = useState(false);
  const [showBrevoKey, setShowBrevoKey] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [savingOwner, setSavingOwner] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingMail, setSavingMail] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadAllSettings(u.storeId || 'default');
    } else {
      loadAllSettings('default');
    }
  }, []);

  const loadAllSettings = async (storeId) => {
    try {
      setLoading(true);
      const [compRes, ownerRes, mailRes] = await Promise.all([
        fetch(`/api/company?storeId=${storeId}`),
        fetch(`/api/owner?storeId=${storeId}`),
        fetch(`/api/mail-settings?storeId=${storeId}`)
      ]);

      const compData = await compRes.json();
      const ownerData = await ownerRes.json();
      const mailData = await mailRes.json();

      if (compData.success && compData.company) {
        setCompany(compData.company);
      }

      if (ownerData.success && ownerData.owner) {
        const o = ownerData.owner;
        setOwnerInfo({
          owner: o.owner || '',
          phone: o.phone || '',
          email: o.email || '',
          address: o.address || '',
          username: o.username || '',
          newPassword: '',
          confirmPassword: ''
        });
        if (o.email && !testEmail) {
          setTestEmail(o.email);
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

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCompany(prev => ({ ...prev, logoUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Favicon file size must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCompany(prev => ({ ...prev, faviconUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: user?.storeId || 'default', ...company })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Store branding, logo & favicon saved successfully!');
        // Update local session if needed
        try {
          const saved = localStorage.getItem('bazarpos_user');
          if (saved) {
            const u = JSON.parse(saved);
            u.storeName = company.name || u.storeName;
            u.logoUrl = company.logoUrl || '';
            u.faviconUrl = company.faviconUrl || '';
            localStorage.setItem('bazarpos_user', JSON.stringify(u));
            setUser(u);
          }
        } catch (e) {}

        // Dynamically update document favicon in browser tab
        if (typeof document !== 'undefined') {
          const activeFav = company.faviconUrl || company.logoUrl;
          if (activeFav) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = activeFav;
          }
        }

        setTimeout(() => setMsg(''), 3500);
      } else {
        setErrorMsg(data.message || 'Failed to save store branding');
      }
    } catch (err) {
      setErrorMsg('Error saving store settings');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveOwnerInfo = async (e) => {
    e.preventDefault();
    setSavingOwner(true);
    setErrorMsg('');

    if (ownerInfo.newPassword && ownerInfo.newPassword !== ownerInfo.confirmPassword) {
      setErrorMsg('New password and confirm password do not match!');
      setSavingOwner(false);
      return;
    }

    try {
      const payload = {
        storeId: user?.storeId || 'default',
        owner: ownerInfo.owner,
        phone: ownerInfo.phone,
        email: ownerInfo.email,
        address: ownerInfo.address,
        username: ownerInfo.username
      };

      if (ownerInfo.newPassword && ownerInfo.newPassword.trim()) {
        payload.password = ownerInfo.newPassword.trim();
      }

      const res = await fetch('/api/owner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setMsg('Store Owner information & credentials updated successfully!');
        setOwnerInfo(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));

        // Update local session if name/username changed
        if (user) {
          const updatedUser = {
            ...user,
            fullName: ownerInfo.owner || user.fullName,
            username: ownerInfo.username || user.username
          };
          localStorage.setItem('bazarpos_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }

        setTimeout(() => setMsg(''), 3500);
      } else {
        setErrorMsg(data.message || 'Failed to update owner information');
      }
    } catch (err) {
      setErrorMsg('Error updating owner details');
    } finally {
      setSavingOwner(false);
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
        setMsg('Mailing & API configuration saved successfully!');
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

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch(`/api/backup?storeId=${user?.storeId || 'default'}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bazarpos_backup_${user?.storeId || 'store'}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err) {
      alert('Backup download failed');
    }
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: user?.storeId || 'default', backupData: json })
        });
        const data = await res.json();
        if (data.success) {
          alert('Database successfully restored! Page will reload now.');
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-8 pb-12 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Settings className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">Store & System Settings</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Manage owner details, store branding, SMTP & API email gateway, and database backups.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/invoice-settings"
            className="w-full sm:w-auto px-3.5 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-95"
          >
            <FileText size={15} />
            <span>Invoice Designer</span>
          </a>
        </div>
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
          <ShieldCheck size={17} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. STORE OWNER INFORMATION FORM */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center space-x-2">
            <User className="text-blue-600 flex-shrink-0" size={18} />
            <span className="truncate">Store Owner Information</span>
          </h2>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex-shrink-0">
            Store Owner
          </span>
        </div>

        <form onSubmit={handleSaveOwnerInfo} className="space-y-3.5 sm:space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hisam Uddin"
                value={ownerInfo.owner}
                onChange={e => setOwnerInfo({ ...ownerInfo, owner: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-900 focus:bg-white focus:outline-none transition text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Login Username *</label>
              <input
                type="text"
                required
                placeholder="e.g. zenmart"
                value={ownerInfo.username}
                onChange={e => setOwnerInfo({ ...ownerInfo, username: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Phone Number</label>
              <input
                type="text"
                placeholder="01700000000"
                value={ownerInfo.phone}
                onChange={e => setOwnerInfo({ ...ownerInfo, phone: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-800 focus:bg-white focus:outline-none transition text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Email Address</label>
              <input
                type="email"
                placeholder="owner@store.com"
                value={ownerInfo.email}
                onChange={e => setOwnerInfo({ ...ownerInfo, email: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none transition text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Owner Address / City</label>
            <input
              type="text"
              placeholder="e.g. Mirpur, Dhaka-1216"
              value={ownerInfo.address}
              onChange={e => setOwnerInfo({ ...ownerInfo, address: e.target.value })}
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none transition text-xs"
            />
          </div>

          {/* Change Password Section */}
          <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 mt-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
              <KeyRound size={15} className="text-blue-600 flex-shrink-0" />
              <span>Change Login Password (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type={showOwnerNewPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep current"
                    value={ownerInfo.newPassword}
                    onChange={e => setOwnerInfo({ ...ownerInfo, newPassword: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerNewPassword(!showOwnerNewPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showOwnerNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showOwnerConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={ownerInfo.confirmPassword}
                    onChange={e => setOwnerInfo({ ...ownerInfo, confirmPassword: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerConfirmPassword(!showOwnerConfirmPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showOwnerConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingOwner}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-md shadow-blue-500/20 active:scale-98"
          >
            <Save size={15} />
            <span>{savingOwner ? 'Saving Owner Info...' : 'Update Owner Information'}</span>
          </button>
        </form>
      </div>

      {/* 2. EMAIL & API MAILING SETTINGS */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 sm:pb-4 gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center space-x-2">
              <Mail className="text-indigo-600 flex-shrink-0" size={18} />
              <span className="truncate">Email & Mailing Gateway</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Configure Brevo, SMTP, Resend, SendGrid or Gmail for auto-invoices & alerts.
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
          <div className="space-y-4 sm:space-y-6">
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
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Sender Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. billing@zenmart.com"
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
                  <span>Notification Triggers</span>
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
                      <span className="font-bold text-slate-800 block text-xs">Invoices</span>
                      <span className="text-[10px] text-slate-500 block">Digital receipt</span>
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
                      <span className="font-bold text-slate-800 block text-xs">Low Stock</span>
                      <span className="text-[10px] text-slate-500 block">Stock alert</span>
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
                      <span className="font-bold text-slate-800 block text-xs">Daily Summary</span>
                      <span className="text-[10px] text-slate-500 block">Revenue report</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingMail}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-md shadow-indigo-600/20 active:scale-98"
                >
                  <Save size={15} />
                  <span>{savingMail ? 'Saving Mail Gateway...' : 'Save Mailing Configuration'}</span>
                </button>
              </div>
            </form>

            {/* Live Test Email Tool */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
              <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                <Send size={14} className="text-emerald-600" />
                <span>Test Live Email Dispatch</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter recipient email (e.g. name@gmail.com)"
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
                  <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
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

            {/* Editable Email Templates Builder */}
            <div id="email-templates" className="mt-6 pt-6 border-t border-slate-200">
              <EmailTemplateEditor storeId={user?.storeId || 'default'} companyInfo={company} />
            </div>
          </div>
        )}
      </div>

      {/* 3. SMS GATEWAY & NOTIFICATION TEMPLATES */}
      <div id="templates">
        <SMSGatewaySettings storeId={user?.storeId || 'default'} companyInfo={company} />
      </div>

      {/* 4. STORE BRANDING & RECEIPT DETAILS */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
        <h2 className="text-sm sm:text-base font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
          <Store className="text-blue-600 flex-shrink-0" size={18} />
          <span className="truncate">Store Branding & Public Receipt Details</span>
        </h2>

        {/* Separate Company Logo & Favicon Upload Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* 1. Company Brand Logo */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative shrink-0">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Store className="text-slate-400" size={24} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-800">Company Logo</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-semibold rounded-full text-[9px]">
                    Invoices &amp; POS
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Used on Sales Invoices, Receipts, and POS terminal.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60">
              <label className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer transition text-xs shadow-sm flex items-center justify-center space-x-1.5 active:scale-98">
                <Upload size={13} />
                <span>{company.logoUrl ? 'Change' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>

              {company.logoUrl && (
                <button
                  type="button"
                  onClick={() => setCompany(prev => ({ ...prev, logoUrl: '' }))}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition text-xs border border-rose-200"
                  title="Remove Logo"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* 2. Browser Tab Favicon */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative shrink-0">
                {company.faviconUrl ? (
                  <img
                    src={company.faviconUrl}
                    alt="Favicon"
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  />
                ) : (
                  <Globe className="text-slate-400" size={24} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-800">Browser Favicon</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-[9px]">
                    Tab Icon
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Displayed on browser tabs and bookmarks.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60">
              <label className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer transition text-xs shadow-sm flex items-center justify-center space-x-1.5 active:scale-98">
                <Upload size={13} />
                <span>{company.faviconUrl ? 'Change' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />
              </label>

              {company.faviconUrl && (
                <button
                  type="button"
                  onClick={() => setCompany(prev => ({ ...prev, faviconUrl: '' }))}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition text-xs border border-rose-200"
                  title="Remove Favicon"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-3.5 sm:space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Store Name *</label>
              <input
                type="text"
                required
                value={company.name}
                onChange={e => setCompany({ ...company, name: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Tagline / Slogan</label>
              <input
                type="text"
                value={company.tagline}
                onChange={e => setCompany({ ...company, tagline: e.target.value })}
                placeholder="e.g. Quality Retail Store"
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Store Phone</label>
              <input
                type="text"
                value={company.phone}
                onChange={e => setCompany({ ...company, phone: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Store Email</label>
              <input
                type="email"
                value={company.email}
                onChange={e => setCompany({ ...company, email: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Website</label>
              <input
                type="text"
                value={company.website}
                onChange={e => setCompany({ ...company, website: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Store Address</label>
            <textarea
              rows="2"
              value={company.address}
              onChange={e => setCompany({ ...company, address: e.target.value })}
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={savingCompany}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-md shadow-blue-500/20 active:scale-98"
          >
            <Save size={15} />
            <span>{savingCompany ? 'Saving Store Settings...' : 'Save Store Branding'}</span>
          </button>
        </form>
      </div>

      {/* 5. JSON BACKUP & RESTORE */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-800 border-b pb-3">JSON Data Backup & Restore</h2>
        <p className="text-[11px] sm:text-xs text-slate-500">
          Easily export your entire database as a JSON file or restore from a previous backup file.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="flex-1 py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-xs active:scale-98"
          >
            <Download size={16} />
            <span>Download Backup (.json)</span>
          </button>

          <label className="flex-1 py-2.5 sm:py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer text-center shadow-xs active:scale-98">
            <Upload size={16} />
            <span>Restore Backup File</span>
            <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}

