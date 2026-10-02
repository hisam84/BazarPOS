'use client';

import { useState, useEffect } from 'react';
import { User, Lock, KeyRound, CheckCircle, ShieldCheck, Phone, Mail, MapPin, Save, Eye, EyeOff, Clock, Calendar, Sparkles, Shield, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
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
        if (o.subscription) {
          setSubscription(o.subscription);
        }
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
    <div className="max-w-3xl space-y-4 sm:space-y-6 pb-12 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <User className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">Store Owner Profile</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Manage owner contact info, login username, and account password.</p>
        </div>
      </div>

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

      {/* Subscription Period & Plan Validity Card */}
      {subscription && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-6 border border-indigo-500/30 shadow-xl space-y-4 sm:space-y-5 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -right-12 -top-12 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">
                    {subscription.planName || 'Enterprise POS License'}
                  </h3>
                  <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase rounded-full tracking-wider ${
                    subscription.isExpired
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : subscription.daysRemaining <= 15
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {subscription.isExpired ? 'Expired' : 'Active Plan'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  Store ID: <span className="text-slate-200 font-bold">{user?.storeId || 'default'}</span> · {user?.storeName || 'Store Account'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Validity Status</span>
              <span className={`text-sm sm:text-base font-black font-mono ${
                subscription.isExpired ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {subscription.isExpired ? '0 Days (Expired)' : `${subscription.daysRemaining} Days Left`}
              </span>
            </div>
          </div>

          {/* Key Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-1">
                <Calendar size={13} className="text-indigo-400" />
                <span>Started On</span>
              </span>
              <p className="text-xs sm:text-sm font-bold font-mono text-white">
                {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-1">
                <Clock size={13} className="text-amber-400" />
                <span>Expiry Date</span>
              </span>
              <p className="text-xs sm:text-sm font-bold font-mono text-amber-300">
                {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-1">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Remaining</span>
              </span>
              <p className="text-xs sm:text-sm font-bold font-mono text-emerald-400">
                {subscription.daysRemaining} Days Remaining
              </p>
            </div>
          </div>

          {/* Validity Progress Bar */}
          <div className="space-y-1 relative z-10">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium">
              <span>Subscription Life Cycle</span>
              <span>
                {Math.min(100, Math.max(0, Math.round(((subscription.durationDays - subscription.daysRemaining) / (subscription.durationDays || 365)) * 100)))}% Elapsed
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  subscription.isExpired
                    ? 'bg-rose-500'
                    : subscription.daysRemaining <= 15
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(5, Math.round(((subscription.daysRemaining) / (subscription.durationDays || 365)) * 100)))}%`
                }}
              />
            </div>
          </div>

          {/* Payment Verification Info */}
          {(subscription.paidAmount || subscription.paymentMethod || subscription.transactionId) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Payment:</span>
                {Number(subscription.paidAmount) > 0 && (
                  <span className="font-bold font-mono text-emerald-400">৳{Number(subscription.paidAmount).toLocaleString()}</span>
                )}
                {subscription.paymentMethod && (
                  <span className="px-2 py-0.5 bg-white/10 rounded-md font-semibold text-[10px] text-slate-200">
                    {subscription.paymentMethod}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                  subscription.paymentStatus === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : subscription.paymentStatus === 'due'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {subscription.paymentStatus || 'paid'}
                </span>
              </div>
              {subscription.transactionId && (
                <div className="text-[10px] font-mono text-slate-300">
                  TrxID: <span className="text-indigo-300 font-bold">{subscription.transactionId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3.5 border-b pb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-blue-500/20 flex-shrink-0">
            {owner ? owner.slice(0, 2).toUpperCase() : (user?.fullName?.slice(0, 2).toUpperCase() || 'OW')}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">{owner || user?.fullName || 'Store Owner'}</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-mono truncate">
              Username: <span className="font-bold text-slate-900">{username || user?.username}</span>
            </p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase bg-blue-100 text-blue-700 rounded-full">
              Role: {user?.role || 'owner'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Owner Full Name *</label>
              <input
                type="text"
                required
                placeholder="Owner full name"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Login Username *</label>
              <input
                type="text"
                required
                placeholder="Login username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-slate-900 text-xs focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Phone Number</label>
              <input
                type="text"
                placeholder="01700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-800 text-xs focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Email Address *</label>
              <input
                type="email"
                required
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Physical / City Address</label>
            <input
              type="text"
              placeholder="e.g. Dhaka, Bangladesh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="pt-3 border-t space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-2">
              <KeyRound className="text-blue-600 flex-shrink-0" size={15} />
              <span>Change Login Password (Optional)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-3 pr-10 py-2 sm:pl-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                    className="w-full pl-3 pr-10 py-2 sm:pl-3.5 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs flex items-center justify-center space-x-2 active:scale-98"
          >
            <Save size={15} />
            <span>{saving ? 'Saving Profile...' : 'Update Owner Profile & Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
