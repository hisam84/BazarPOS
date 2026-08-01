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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <DollarSign className="text-emerald-600" size={24} />
            <span>Cash Drawer Register & Daily Reconciliation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage morning cash drawer opening balance and evening cash reconciliation count.</p>
        </div>

        {openRegister ? (
          <button
            onClick={() => setShowCloseModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20"
          >
            <Lock size={18} />
            <span>Close Cash Register (Evening)</span>
          </button>
        ) : (
          <button
            onClick={() => setShowOpenModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <Unlock size={18} />
            <span>Open Cash Register (Morning)</span>
          </button>
        )}
      </div>

      {/* Active Cash Register Banner */}
      {openRegister && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-full">Register OPEN</span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">Active Register — {openRegister.date}</h2>
            <p className="text-xs text-slate-600">Opened by <span className="font-semibold text-slate-900">{openRegister.openedBy}</span> at {new Date(openRegister.openedAt).toLocaleTimeString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 text-center">
            <p className="text-xs text-slate-500">Morning Opening Float</p>
            <p className="text-2xl font-bold text-emerald-600">৳{openRegister.openingCash}</p>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800">Past Daily Cash Reconciliation History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Opening Cash</th>
                <th className="px-4 py-3">Expected Cash</th>
                <th className="px-4 py-3">Actual Cash Counted</th>
                <th className="px-4 py-3">Difference</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{h.date}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">৳{h.openingCash}</td>
                  <td className="px-4 py-3 font-bold text-blue-600">৳{h.closingCashExpected || h.openingCash}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">৳{h.closingCashActual || 'N/A'}</td>
                  <td className="px-4 py-3 font-bold">
                    {h.difference === 0 ? (
                      <span className="text-emerald-600">৳0 (Match)</span>
                    ) : (
                      <span className={h.difference < 0 ? 'text-rose-600' : 'text-blue-600'}>
                        ৳{h.difference}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full ${h.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {h.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPEN REGISTER MODAL */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Open Morning Cash Register</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleOpenRegister} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Morning Opening Cash Float (৳) *</label>
                <input type="number" required value={openingCash} onChange={e => setOpeningCash(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-emerald-600 text-sm" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowOpenModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl">Open Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE REGISTER MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Evening Cash Reconciliation & Close</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCloseRegister} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Actual Physical Cash Counted in Drawer (৳) *</label>
                <input type="number" required value={closingCashActual} onChange={e => setClosingCashActual(e.target.value)} placeholder="Enter counted cash" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-rose-600 text-sm" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowCloseModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-rose-600 text-white font-semibold rounded-xl">Close Cash Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
