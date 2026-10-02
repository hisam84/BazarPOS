'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Server,
  Lock,
  CheckCircle,
  Database,
  Building2,
  Users,
  Layers,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SuperAdminSettingsPage() {
  const [adminProfile, setAdminProfile] = useState({ username: 'superadmin', fullName: 'System Super Admin', email: 'superadmin@bazarpos.com' });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/superadmin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.admin) {
          setAdminProfile(data.admin);
          setFullName(data.admin.fullName || '');
          setEmail(data.admin.email || '');
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!email || !email.includes('@')) {
      setPasswordMsg({ type: 'error', text: 'Valid email address is mandatory for Super Admin account recovery.' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase()
      };
      if (newPassword && newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ type: 'success', text: 'Super Admin credentials & profile updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
        if (data.admin) setAdminProfile(data.admin);
        try {
          const saved = localStorage.getItem('bazarpos_user');
          if (saved) {
            const u = JSON.parse(saved);
            u.isDefaultPassword = false;
            u.fullName = fullName.trim() || u.fullName;
            localStorage.setItem('bazarpos_user', JSON.stringify(u));
          }
        } catch (e) {}
      } else {
        setPasswordMsg({ type: 'error', text: data.message || 'Failed to update credentials' });
      }
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-0">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <ShieldCheck className="text-indigo-600 shrink-0" size={22} />
            <span>Super Admin Security & Platform Settings</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Manage your Super Admin master access credentials, recovery email, and review SaaS system architecture status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Security & Password Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <KeyRound className="text-indigo-600 shrink-0" size={20} />
            <h2 className="text-sm sm:text-base font-bold text-slate-800">Master Credentials & Profile</h2>
          </div>
          <p className="text-xs text-slate-500">
            Current account: <strong className="text-slate-800 font-mono">{adminProfile.username}</strong>
          </p>

          {passwordMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Super Admin Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="System Super Admin"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address * (For Password Recovery)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@bazarpos.com"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="pt-2 border-t">
              <label className="block text-slate-600 font-semibold mb-1">New Master Password (Optional)</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Update Master Profile & Credentials'}
            </button>
          </form>
        </div>

        {/* Platform Information Card */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Server className="text-blue-600 shrink-0" size={20} />
              <h2 className="text-sm sm:text-base font-bold text-slate-800">SaaS Multi-Tenant Infrastructure</h2>
            </div>

            <div className="space-y-2.5 sm:space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Multi-Tenant Architecture</span>
                <span className="font-bold text-slate-800">Isolated Tenant Scopes</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Super Admin Access Level</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 text-[10px]">
                  SaaS Platform Owner (Level 0)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Store POS Separation</span>
                <span className="font-bold text-emerald-700">Strictly Isolated</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Subscription Enforcement</span>
                <span className="font-bold text-emerald-700">Active & Automated</span>
              </div>
            </div>
          </div>

          {/* Database & Tables Initialization Card */}
          <DatabaseStatusCard />

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl space-y-2">
            <h3 className="font-bold text-xs sm:text-sm flex items-center space-x-2 text-indigo-300">
              <Sparkles size={16} />
              <span>BazarPOS SaaS Platform</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Control merchant company onboarding, license validity periods, and database backend synchronization from the Super Admin console.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatabaseStatusCard() {
  const [dbStatus, setDbStatus] = useState({ loading: true, connected: false, tables: [], message: '' });
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/db/init');
      const data = await res.json();
      setDbStatus({
        loading: false,
        connected: data.connected || false,
        database: data.database,
        tables: data.tables || [],
        tableCount: data.tableCount || 0,
        message: data.message || ''
      });
    } catch (err) {
      setDbStatus({ loading: false, connected: false, tables: [], message: 'Could not connect to API' });
    }
  };

  const handleInitDb = async () => {
    if (!confirm('Initialize PostgreSQL database tables now?')) return;
    setInitializing(true);
    try {
      const res = await fetch('/api/db/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Database tables initialized successfully!');
        checkStatus();
      } else {
        alert(data.message || 'Failed to initialize tables');
      }
    } catch (err) {
      alert('Error connecting to database');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="text-emerald-600 shrink-0" size={20} />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">PostgreSQL Database Connection</h2>
        </div>
        <button
          onClick={checkStatus}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Check Status
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <span className="text-slate-600 font-medium">PostgreSQL Engine</span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              dbStatus.connected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {dbStatus.loading
              ? 'Checking...'
              : dbStatus.connected
              ? `Connected (${dbStatus.database || 'PostgreSQL'})`
              : 'Local Mode (DATABASE_URL not set)'}
          </span>
        </div>

        {dbStatus.connected && (
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5">
            <p className="font-bold text-emerald-900">
              Tables in Database: {dbStatus.tables.length}
            </p>
            <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
              {dbStatus.tables.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] rounded-md font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleInitDb}
          disabled={initializing}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-sm text-xs disabled:opacity-50 flex items-center justify-center space-x-1.5"
        >
          <Database size={14} />
          <span>
            {initializing
              ? 'Creating & Syncing Tables...'
              : 'Initialize / Create PostgreSQL Tables Now'}
          </span>
        </button>
      </div>
    </div>
  );
}
