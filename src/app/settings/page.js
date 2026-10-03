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
  Eye,
  EyeOff,
  Globe,
  Database
} from 'lucide-react';
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

  const [showOwnerNewPassword, setShowOwnerNewPassword] = useState(false);
  const [showOwnerConfirmPassword, setShowOwnerConfirmPassword] = useState(false);

  const [savingOwner, setSavingOwner] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

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
      const [compRes, ownerRes] = await Promise.all([
        fetch(`/api/company?storeId=${storeId}`),
        fetch(`/api/owner?storeId=${storeId}`)
      ]);

      const compData = await compRes.json();
      const ownerData = await ownerRes.json();

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
    <div className="max-w-4xl space-y-4 sm:space-y-6 pb-12 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Settings className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">Store &amp; Business Settings</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Manage your store branding, owner details, security credentials, and system backups.
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

      {/* 1. STORE BRANDING & RECEIPT DETAILS */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center space-x-2">
            <Store className="text-blue-600 flex-shrink-0" size={18} />
            <span className="truncate">Store Branding &amp; Public Receipt Details</span>
          </h2>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex-shrink-0">
            Branding
          </span>
        </div>

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
                  Displayed on browser tabs and mobile bookmarks.
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
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Tagline / Slogan</label>
              <input
                type="text"
                value={company.tagline}
                onChange={e => setCompany({ ...company, tagline: e.target.value })}
                placeholder="e.g. Quality Retail Store"
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
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
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Store Email</label>
              <input
                type="email"
                value={company.email}
                onChange={e => setCompany({ ...company, email: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Website</label>
              <input
                type="text"
                value={company.website}
                onChange={e => setCompany({ ...company, website: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Store Address</label>
            <textarea
              rows="2"
              value={company.address}
              onChange={e => setCompany({ ...company, address: e.target.value })}
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={savingCompany}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-md shadow-blue-500/20 active:scale-98"
          >
            <Save size={15} />
            <span>{savingCompany ? 'Saving Store Settings...' : 'Save Store Branding'}</span>
          </button>
        </form>
      </div>

      {/* 2. STORE OWNER INFORMATION & CREDENTIALS FORM */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center space-x-2">
            <User className="text-blue-600 flex-shrink-0" size={18} />
            <span className="truncate">Store Owner &amp; Security Credentials</span>
          </h2>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex-shrink-0">
            Account Access
          </span>
        </div>

        <form onSubmit={handleSaveOwnerInfo} className="space-y-4 sm:space-y-5 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Full Name *</label>
              <input
                type="text"
                required
                value={ownerInfo.owner}
                onChange={e => setOwnerInfo({ ...ownerInfo, owner: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Contact Phone Number</label>
              <input
                type="text"
                value={ownerInfo.phone}
                onChange={e => setOwnerInfo({ ...ownerInfo, phone: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Email Address</label>
              <input
                type="email"
                value={ownerInfo.email}
                onChange={e => setOwnerInfo({ ...ownerInfo, email: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Residential / Office Address</label>
              <input
                type="text"
                value={ownerInfo.address}
                onChange={e => setOwnerInfo({ ...ownerInfo, address: e.target.value })}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Credentials Box */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
              <KeyRound size={14} className="text-blue-600" />
              <span>Login Credentials &amp; Password Update</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Login Username *</label>
                <input
                  type="text"
                  required
                  value={ownerInfo.username}
                  onChange={e => setOwnerInfo({ ...ownerInfo, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">New Password (Leave blank to keep)</label>
                <div className="relative">
                  <input
                    type={showOwnerNewPassword ? 'text' : 'password'}
                    placeholder="New password"
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
                <label className="block text-slate-700 mb-1 font-semibold">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showOwnerConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
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
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-md shadow-blue-500/20 active:scale-98"
          >
            <Save size={15} />
            <span>{savingOwner ? 'Saving Owner Info...' : 'Update Owner Information'}</span>
          </button>
        </form>
      </div>

      {/* 3. SMS GATEWAY & NOTIFICATION TEMPLATES */}
      <div id="templates">
        <SMSGatewaySettings storeId={user?.storeId || 'default'} companyInfo={company} />
      </div>

      {/* 4. JSON BACKUP & RESTORE */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <Database className="text-emerald-600" size={18} />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">JSON Data Backup &amp; Disaster Recovery</h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          Easily export your entire database as a portable JSON backup file or restore from a previous backup to prevent data loss.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="flex-1 py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-xs active:scale-98"
          >
            <Download size={16} />
            <span>Download Full Backup (.json)</span>
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
