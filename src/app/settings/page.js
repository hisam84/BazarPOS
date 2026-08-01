'use client';

import { useState, useEffect } from 'react';
import { Settings, Download, Upload, Store, CheckCircle, Save } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState({
    name: '',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    logoUrl: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadCompany(u.storeId || 'default');
    }
  }, []);

  const loadCompany = async (storeId) => {
    try {
      const res = await fetch(`/api/company?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.company) {
        setCompany(data.company);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: user?.storeId || 'default', ...company })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Store settings saved successfully!');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      alert('Save error');
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
      a.download = `bazarpos_backup_${user?.storeId || 'store'}_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    } catch (err) {
      alert('Backup download failed');
    }
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files[0];
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
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Settings className="text-blue-600" size={24} />
            <span>Store Configuration & Data Storage</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure store receipt header info, phone, address, and JSON backups.</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl flex items-center space-x-2">
          <CheckCircle size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Store Info Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-800 border-b pb-3 flex items-center space-x-2">
          <Store className="text-blue-600" size={20} />
          <span>Store Branding & Receipt Details</span>
        </h2>

        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Store / Business Name *</label>
              <input
                type="text"
                required
                value={company.name}
                onChange={e => setCompany({ ...company, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Tagline / Slogan</label>
              <input
                type="text"
                value={company.tagline}
                onChange={e => setCompany({ ...company, tagline: e.target.value })}
                placeholder="e.g. Quality Retail Store"
                className="w-full px-3 py-2 border rounded-xl bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Phone Number</label>
              <input
                type="text"
                value={company.phone}
                onChange={e => setCompany({ ...company, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                value={company.email}
                onChange={e => setCompany({ ...company, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Website</label>
              <input
                type="text"
                value={company.website}
                onChange={e => setCompany({ ...company, website: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Physical Address</label>
            <textarea
              rows="2"
              value={company.address}
              onChange={e => setCompany({ ...company, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50"
            ></textarea>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center space-x-2"
          >
            <Save size={18} />
            <span>Save Store Settings</span>
          </button>
        </form>
      </div>

      {/* Backup & Restore Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 border-b pb-3">JSON Data Backup & Restore</h2>
        <p className="text-xs text-slate-500">
          Easily export your entire database as a JSON file or restore from a previous backup file.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs"
          >
            <Download size={18} />
            <span>Download Store Backup File (.json)</span>
          </button>

          <label className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer text-center">
            <Upload size={18} />
            <span>Restore Data from Backup File</span>
            <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
