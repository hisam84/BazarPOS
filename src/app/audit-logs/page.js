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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <ShieldCheck className="text-blue-600" size={24} />
            <span>System Activity Audit Log & History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Audit trail tracking all user actions, stock adjustments, cash register openings, and sales edits.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, username, or details..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading Audit Logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">{l.username}</td>
                    <td className="px-4 py-3 font-bold">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-sans text-xs">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
