'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShieldAlert, Lock, User, ArrowRight, Eye, EyeOff, Mail, KeyRound, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot Password Flow State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = enter email, 2 = enter otp & new password
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [smtpNotConfigured, setSmtpNotConfigured] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Invalid login credentials');
        setLoading(false);
        return;
      }

      // Save user session
      localStorage.setItem('bazarpos_user', JSON.stringify(data.user));

      if (data.user?.role === 'superadmin') {
        router.push('/superadmin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setSmtpNotConfigured(false);

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address');
      setResetLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-otp',
          email: resetEmail.trim()
        })
      });

      const data = await res.json();

      if (!data.success) {
        if (data.smtpConfigured === false) {
          setSmtpNotConfigured(true);
          setResetError(data.message || 'Email service (SMTP/Brevo) is not configured. Please contact the system administrator.');
        } else {
          setResetError(data.message || 'Failed to send verification code');
        }
        return;
      }

      setResetStep(2);
    } catch (err) {
      setResetError('Network error while requesting reset code. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');

    if (!resetOtp || resetOtp.trim().length !== 6) {
      setResetError('Please enter the 6-digit verification code sent to your email.');
      setResetLoading(false);
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      setResetLoading(false);
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('New password and confirm password do not match.');
      setResetLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-and-reset',
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          newPassword: resetNewPassword.trim()
        })
      });

      const data = await res.json();

      if (!data.success) {
        setResetError(data.message || 'Password reset failed');
        return;
      }

      // Reset successful!
      setSuccess('Password has been reset successfully! You can now log in with your new password.');
      setIsForgotPassword(false);
      setResetStep(1);
      setResetOtp('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setPassword('');
    } catch (err) {
      setResetError('Network error while resetting password.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setResetStep(1);
    setResetError('');
    setSmtpNotConfigured(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 mb-3 shadow-inner">
            <Store size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BazarPOS</h1>
          <p className="text-slate-400 text-xs mt-1">Multi-Store Point of Sale ERP</p>
        </div>

        {/* ================= FORGOT PASSWORD FLOW ================= */}
        {isForgotPassword ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <KeyRound size={18} className="text-blue-400" />
                  <span>Password Recovery</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {resetStep === 1
                    ? 'Enter your registered email address'
                    : `Verification code sent to: ${resetEmail}`}
                </p>
              </div>
            </div>

            {/* General Error Banner */}
            {resetError && !smtpNotConfigured && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle size={16} className="shrink-0 text-rose-400" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Explicit SMTP Not Configured Warning Banner */}
            {smtpNotConfigured && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>Email Service (SMTP) Not Configured</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  No active email gateway is configured in the system. Please contact your store manager or system administrator directly to reset your credentials.
                </p>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 text-xs"
                >
                  <span>{resetLoading ? 'Verifying...' : 'Send Reset Code'}</span>
                  {!resetLoading && <ArrowRight size={16} />}
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    6-Digit Verification Code (OTP) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 font-mono font-bold tracking-widest text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                    <input
                      type={showResetConfirmPassword ? 'text' : 'password'}
                      required
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 text-xs disabled:opacity-50"
                >
                  {resetLoading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-xs text-slate-400 hover:text-white transition inline-flex items-center space-x-1.5 font-medium"
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= STANDARD LOGIN FORM ================= */
          <div className="space-y-5">
            {success && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm font-medium"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm font-medium"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 text-sm mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Terminal'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
