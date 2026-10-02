'use client';

import { useState, useEffect } from 'react';
import { User, Lock, KeyRound, CheckCircle, ShieldCheck, Phone, Mail, MapPin, Save, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [owner, setOwner] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadOwnerData(u.storeId || 'default', u);
    }
  }, []);

  const loadOwnerData = async (storeId, currentUser) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/owner?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.owner) {
        const o = data.owner;
        setOwner(o.owner || currentUser.fullName || currentUser.username || '');
        setPhone(o.phone || '');
        setEmail(o.email || '');
        setAddress(o.address || '');
        setUsername(o.username || currentUser.username || '');
      } else {
        setOwner(currentUser.fullName || currentUser.username || '');
        setUsername(currentUser.username || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match!');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        storeId: user?.storeId || 'default',
        owner: owner.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        username: username.trim()
      };

      if (newPassword && newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await fetch('/api/owner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setMsg('Profile and owner details updated successfully!');
        setNewPassword('');
        setConfirmPassword('');

        // Update local user session
        if (user) {
          const updated = {
            ...user,
            fullName: owner.trim() || user.fullName,
            username: username.trim() || user.username,
            ...(newPassword && newPassword.trim() ? { isDefaultPassword: false } : {})
          };
          localStorage.setItem('bazarpos_user', JSON.stringify(updated));
          setUser(updated);
        }

        setTimeout(() => setMsg(''), 3500);
      } else {
        setErrorMsg(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg('Network error while updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <User className="text-blue-600" size={24} />
            <span>Store Owner Profile & Credentials</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage owner contact information, login username, and account password.</p>
        </div>
      </div>

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

      {/* User Info Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 border-b pb-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
            {owner ? owner.slice(0, 2).toUpperCase() : (user?.fullName?.slice(0, 2).toUpperCase() || 'OW')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{owner || user?.fullName || 'Store Owner'}</h2>
            <p className="text-xs text-slate-500 font-mono">
              Username: <span className="font-bold text-slate-900">{username || user?.username}</span>
            </p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 rounded-full">
              Role: {user?.role || 'owner'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1.5 font-bold">Owner Full Name *</label>
              <input
                type="text"
                required
                placeholder="Owner full name"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:outline-none transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-bold">Login Username *</label>
              <input
                type="text"
                required
                placeholder="Login username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-slate-900 text-xs focus:bg-white focus:outline-none transition shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1.5 font-bold">Phone Number</label>
              <input
                type="text"
                placeholder="01700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-800 text-xs focus:bg-white focus:outline-none transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-bold">Email Address * (For Password Recovery)</label>
              <input
                type="email"
                required
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none transition shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-bold">Physical / City Address</label>
            <input
              type="text"
              placeholder="e.g. Dhaka, Bangladesh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none transition shadow-sm"
            />
          </div>

          <div className="pt-4 border-t space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-2">
              <KeyRound className="text-blue-600" size={16} />
              <span>Change Login Password (Optional)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (optional)"
                    className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs flex items-center space-x-2"
          >
            <Save size={16} />
            <span>{saving ? 'Saving Profile...' : 'Update Owner Profile & Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
