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
  MapPin
} from 'lucide-react';

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
    logoUrl: ''
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
        setMsg('Store branding settings saved successfully!');
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
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Settings className="text-blue-600" size={24} />
            <span>Store Configuration & Owner Information</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage owner contact details, login credentials, store receipt header info, and JSON database backups.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/invoice-settings"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-sm transition"
          >
            <FileText size={16} />
            <span>A4 Invoice Settings & Banner</span>
          </a>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl flex items-center space-x-2 animate-fadeIn">
          <CheckCircle size={18} />
          <span>{msg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl flex items-center space-x-2">
          <ShieldCheck size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. STORE OWNER INFORMATION FORM */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <User className="text-blue-600" size={20} />
            <span>Store Owner Information & Account Profile</span>
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
            Store Owner
          </span>
        </div>

        <form onSubmit={handleSaveOwnerInfo} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hisam Uddin"
                value={ownerInfo.owner}
                onChange={e => setOwnerInfo({ ...ownerInfo, owner: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-900 focus:bg-white focus:outline-none transition shadow-sm text-xs"
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
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition shadow-sm text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Phone Number</label>
              <input
                type="text"
                placeholder="01700000000"
                value={ownerInfo.phone}
                onChange={e => setOwnerInfo({ ...ownerInfo, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-800 focus:bg-white focus:outline-none transition shadow-sm text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Email Address</label>
              <input
                type="email"
                placeholder="owner@store.com"
                value={ownerInfo.email}
                onChange={e => setOwnerInfo({ ...ownerInfo, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none transition shadow-sm text-xs"
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none transition shadow-sm text-xs"
            />
          </div>

          {/* Change Password Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 mt-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
              <KeyRound size={16} className="text-blue-600" />
              <span>Change Login Password (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={ownerInfo.newPassword}
                  onChange={e => setOwnerInfo({ ...ownerInfo, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={ownerInfo.confirmPassword}
                  onChange={e => setOwnerInfo({ ...ownerInfo, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingOwner}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center space-x-2 text-xs shadow-md shadow-blue-500/20"
          >
            <Save size={16} />
            <span>{savingOwner ? 'Saving Owner Info...' : 'Update Owner Information'}</span>
          </button>
        </form>
      </div>

      {/* 2. STORE BRANDING & RECEIPT DETAILS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
          <Store className="text-blue-600" size={20} />
          <span>Store Branding & Public Receipt Details</span>
        </h2>

        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Store / Business Name *</label>
              <input
                type="text"
                required
                value={company.name}
                onChange={e => setCompany({ ...company, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Tagline / Slogan</label>
              <input
                type="text"
                value={company.tagline}
                onChange={e => setCompany({ ...company, tagline: e.target.value })}
                placeholder="e.g. Quality Retail Store"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Store Public Phone</label>
              <input
                type="text"
                value={company.phone}
                onChange={e => setCompany({ ...company, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Store Public Email</label>
              <input
                type="email"
                value={company.email}
                onChange={e => setCompany({ ...company, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Website</label>
              <input
                type="text"
                value={company.website}
                onChange={e => setCompany({ ...company, website: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Store Physical Address</label>
            <textarea
              rows="2"
              value={company.address}
              onChange={e => setCompany({ ...company, address: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={savingCompany}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center space-x-2 text-xs shadow-md shadow-blue-500/20"
          >
            <Save size={16} />
            <span>{savingCompany ? 'Saving Store Settings...' : 'Save Store Branding'}</span>
          </button>
        </form>
      </div>

      {/* 3. JSON BACKUP & RESTORE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 border-b pb-3">JSON Data Backup & Restore</h2>
        <p className="text-xs text-slate-500">
          Easily export your entire database as a JSON file or restore from a previous backup file.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-sm"
          >
            <Download size={18} />
            <span>Download Store Backup (.json)</span>
          </button>

          <label className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer text-center shadow-sm">
            <Upload size={18} />
            <span>Restore Data from Backup File</span>
            <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
