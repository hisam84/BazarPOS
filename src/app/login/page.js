'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('superadmin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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

      if (data.role === 'superadmin') {
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-inner">
            <Store size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">BazarPOS</h1>
          <p className="text-slate-400 text-sm mt-1">Multi-Store Point of Sale Software</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
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
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm font-medium"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Terminal'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <p className="font-mono text-slate-400">Default Credentials:</p>
          <p>Store Admin: <span className="text-blue-400 font-mono">admin</span> | <span className="text-blue-400 font-mono">superadmin@123</span></p>
          <p>Super Admin: <span className="text-purple-400 font-mono">superadmin</span> | <span className="text-purple-400 font-mono">superadmin@123</span></p>
        </div>
      </div>
    </div>
  );
}
