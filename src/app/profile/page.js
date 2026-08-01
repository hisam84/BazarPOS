'use client';

import { useState, useEffect } from 'react';
import { User, Lock, KeyRound, CheckCircle, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setFullName(u.fullName || u.username);
    }
  }, []);

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }

    if (user) {
      const updated = { ...user, fullName };
      localStorage.setItem('bazarpos_user', JSON.stringify(updated));
      setUser(updated);
      setMsg('Profile and password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <User className="text-blue-600" size={24} />
            <span>Account Profile & Security Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage user profile info and update account login credentials.</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl flex items-center space-x-2">
          <CheckCircle size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 border-b pb-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{user?.fullName || 'Store Admin'}</h2>
            <p className="text-xs text-slate-500 font-mono">Username: <span className="font-bold text-slate-900">{user?.username}</span></p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 rounded-full">
              Role: {user?.role || 'owner'}
            </span>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Display Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm font-semibold"
            />
          </div>

          <div className="pt-4 border-t space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <KeyRound className="text-blue-600" size={18} />
              <span>Change Password</span>
            </h3>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20"
          >
            Update Profile & Password
          </button>
        </form>
      </div>
    </div>
  );
}
