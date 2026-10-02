'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function CashRegisterPage() {
  const [openRegister, setOpenRegister] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Form
  const [openingCash, setOpeningCash] = useState('5000');
  const [closingCashActual, setClosingCashActual] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadRegisterData(u.storeId || 'default');
    }
  }, []);

  const loadRegisterData = async (storeId) => {
    try {
      const res = await fetch(`/api/cash-register?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setOpenRegister(data.openRegister);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegister = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          username: u.username || 'admin',
          action: 'open',
          openingCash: Number(openingCash),
          note
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowOpenModal(false);
        loadRegisterData(u.storeId || 'default');
      }
    } catch (err) {
      alert('Open register error');
    }
  };

  const handleCloseRegister = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          username: u.username || 'admin',
          action: 'close',
          closingCashActual: Number(closingCashActual),
          note
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCloseModal(false);
        loadRegisterData(u.storeId || 'default');
      }
    } catch (err) {
      alert('Close register error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <DollarSign className="text-emerald-600 flex-shrink-0" size={22} />
            <span className="truncate">Cash Drawer &amp; Daily Reconciliation</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">Manage morning cash drawer opening balance and evening cash reconciliation count.</p>
        </div>

        {openRegister ? (
          <button
            onClick={() => setShowCloseModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20 text-xs flex-shrink-0"
          >
            <Lock size={16} />
            <span>Close Cash Register (Evening)</span>
          </button>
        ) : (
          <button
            onClick={() => setShowOpenModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md shadow-emerald-500/20 text-xs flex-shrink-0"
          >
            <Unlock size={16} />
            <span>Open Cash Register (Morning)</span>
          </button>
        )}
      </div>

      {/* Active Cash Register Banner */}
      {openRegister && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-full tracking-wider">Register OPEN</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-2">Active Register — {openRegister.date}</h2>
            <p className="text-xs text-slate-600 mt-0.5">Opened by <span className="font-semibold text-slate-900">{openRegister.openedBy}</span> at {new Date(openRegister.openedAt).toLocaleTimeString()}</p>
          </div>
          <div className="w-full sm:w-auto bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200 text-left sm:text-center shadow-xs">
            <p className="text-[11px] text-slate-500">Morning Opening Float</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-0.5">৳{Number(openRegister.openingCash).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800">Past Daily Cash Reconciliation History</h2>
        
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Opening Cash</th>
                <th className="px-4 py-3">Expected Cash</th>
                <th className="px-4 py-3">Actual Cash Counted</th>
                <th className="px-4 py-3">Difference</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">{h.date}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">৳{Number(h.openingCash).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">৳{Number(h.closingCashExpected || h.openingCash).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                    {h.closingCashActual ? `৳${Number(h.closingCashActual).toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    {h.difference === 0 ? (
                      <span className="text-emerald-600">৳0 (Match)</span>
                    ) : (
                      <span className={h.difference < 0 ? 'text-rose-600' : 'text-blue-600'}>
                        ৳{Number(h.difference).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${h.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {h.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No cash register records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {history.map((h) => (
            <div key={h.id} className="p-3.5 space-y-2.5 bg-white hover:bg-slate-50/60 transition text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{h.date}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${h.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {h.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Opening Cash</span>
                  <span className="font-mono font-bold text-slate-700 block mt-0.5">৳{Number(h.openingCash).toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Expected Cash</span>
                  <span className="font-mono font-bold text-blue-600 block mt-0.5">৳{Number(h.closingCashExpected || h.openingCash).toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Actual Counted</span>
                  <span className="font-mono font-bold text-emerald-600 block mt-0.5">
                    {h.closingCashActual ? `৳${Number(h.closingCashActual).toLocaleString()}` : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Difference</span>
                  <span className={`font-mono font-bold block mt-0.5 ${h.difference === 0 ? 'text-emerald-600' : h.difference < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                    {h.difference === 0 ? '৳0 (Match)' : `৳${Number(h.difference).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No cash register records found.
            </div>
          )}
        </div>
      </div>

      {/* OPEN REGISTER MODAL */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Open Morning Cash Register</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleOpenRegister} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Morning Opening Cash Float (৳) *</label>
                <input type="number" required value={openingCash} onChange={e => setOpeningCash(e.target.value)} className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 font-bold text-emerald-600 text-sm focus:bg-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowOpenModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition">Open Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE REGISTER MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Evening Cash Reconciliation &amp; Close</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleCloseRegister} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Actual Physical Cash Counted in Drawer (৳) *</label>
                <input type="number" required value={closingCashActual} onChange={e => setClosingCashActual(e.target.value)} placeholder="Enter counted cash" className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 font-bold text-rose-600 text-sm focus:bg-white focus:outline-none focus:border-rose-500" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowCloseModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-md transition">Close Cash Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
