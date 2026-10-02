'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldAlert, KeyRound, X, ArrowRight, CheckCircle, Lock } from 'lucide-react';

export default function SecurityWarningBanner({ user, onUserUpdated }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!user || !user.isDefaultPassword || dismissed) {
    return null;
  }

  const isSuperAdmin = user.role === 'superadmin';

  const handleQuickPasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (['superadmin@123', 'admin', '12345678', 'password', '123456'].includes(newPassword)) {
      setErrorMsg('Please choose a stronger password, not a default one.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isSuperAdmin) {
        const res = await fetch('/api/superadmin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword })
        });
        const data = await res.json();
        if (data.success) {
          handleSuccess();
        } else {
          setErrorMsg(data.message || 'Failed to update password');
        }
      } else {
        const res = await fetch('/api/owner', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: user.storeId || 'default',
            password: newPassword
          })
        });
        const data = await res.json();
        if (data.success) {
          handleSuccess();
        } else {
          setErrorMsg(data.message || 'Failed to update password');
        }
      }
    } catch (err) {
      setErrorMsg('Network error while updating password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    const updatedUser = { ...user, isDefaultPassword: false };
    localStorage.setItem('bazarpos_user', JSON.stringify(updatedUser));
    if (onUserUpdated) onUserUpdated(updatedUser);
    setSuccessMsg('Password changed successfully! Security threat resolved.');
    setTimeout(() => {
      setShowModal(false);
      setDismissed(true);
    }, 2000);
  };

  return (
    <>
      {/* Top Advisory Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-medium z-40 relative">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 bg-white/20 rounded-lg animate-pulse">
            <ShieldAlert size={16} className="text-amber-200" />
          </div>
          <span>
            <strong>Security Advisory:</strong> You are currently using a <strong>default password</strong>. To protect your account from unauthorized access, please change your password now.
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 bg-white text-rose-700 font-bold rounded-lg shadow-sm hover:bg-rose-50 transition text-[11px] flex items-center space-x-1"
          >
            <KeyRound size={13} />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            title="Remind me later"
            className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Quick Password Change Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-bold shadow-inner">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Default Password</h3>
                <p className="text-xs text-slate-500">
                  Securing account: <span className="font-mono font-bold text-slate-800">{user.username}</span>
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center space-x-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center space-x-2">
                <CheckCircle size={15} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleQuickPasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">New Strong Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/30 text-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <span>{loading ? 'Securing Account...' : 'Update & Secure Password'}</span>
                  {!loading && <ArrowRight size={14} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
