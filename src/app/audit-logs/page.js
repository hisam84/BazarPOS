'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, History, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadAuditLogs(u.storeId || 'default');
    }
  }, []);

  const loadAuditLogs = async (storeId) => {
    try {
      const res = await fetch(`/api/audit-logs?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.username.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <ShieldCheck className="text-blue-600 flex-shrink-0" size={22} />
            <span className="truncate">System Activity Audit Log</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">Audit trail tracking all user actions, stock adjustments, cash register openings, and sales edits.</p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, username, or details..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">Loading Audit Logs...</div>
        ) : (
          <div>
            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action Event</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-500">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">{l.username}</td>
                      <td className="px-4 py-3 font-bold">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">{l.action}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-sans text-xs">{l.details}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-400 font-sans">
                        No audit log activities found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredLogs.map((l) => (
                <div key={l.id} className="p-3.5 space-y-2 bg-white hover:bg-slate-50/60 transition text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600">{l.username}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(l.timestamp).toLocaleString()}</span>
                  </div>

                  <div>
                    <span className="inline-block bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                      {l.action}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {l.details}
                  </p>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No audit log activities found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
