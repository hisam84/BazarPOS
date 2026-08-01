'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  MessageSquare,
  Share2,
  X
} from 'lucide-react';

export default function POSTerminalPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [salers, setSalers] = useState([]);
  const [categories, setCategories] = useState(['All']);
  
  // POS State
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Checkout State
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSaler, setSelectedSaler] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [note, setNote] = useState('');
  
  // Modal & Printing
  const [completedVoucher, setCompletedVoucher] = useState(null);
  const [printModal, setPrintModal] = useState(false);
  const [receiptType, setReceiptType] = useState('thermal');
  const barcodeRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      loadPOSData(u.storeId || 'default');
    }
  }, []);

  const loadPOSData = async (storeId) => {
    try {
      const [prodRes, cliRes, salRes] = await Promise.all([
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/clients?storeId=${storeId}`),
        fetch(`/api/salers?storeId=${storeId}`)
      ]);

      const prodData = await prodRes.json();
      const cliData = await cliRes.json();
      const salData = await salRes.json();

      if (prodData.success) {
        setProducts(prodData.products || []);
        setCategories(['All', ...(prodData.categories || [])]);
      }
      if (cliData.success) {
        setClients(cliData.clients || []);
        if (cliData.clients.length > 0) setSelectedClient(cliData.clients[0].name);
      }
      if (salData.success) {
        setSalers(salData.salers || []);
        if (salData.salers.length > 0) setSelectedSaler(salData.salers[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          code: product.code,
          name: product.name,
          costPrice: product.costPrice || 0,
          unitPrice: product.sellingPrice || 0,
          quantity: 1,
          maxQuantity: product.quantity || 999
        }
      ];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.code === barcodeInput.trim().toUpperCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert('Product not found!');
    }
  };

  const subTotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const grandTotal = Math.max(0, subTotal - Number(discount));
  const dueAmount = Math.max(0, grandTotal - Number(paidAmount));

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          clientName: selectedClient || 'Walk-in Customer',
          salerName: selectedSaler || 'Main Counter',
          items: cart,
          totalAmount: subTotal,
          discount: Number(discount),
          paidAmount: Number(paidAmount),
          paymentMethod,
          note
        })
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Checkout failed');
        return;
      }

      setCompletedVoucher(data.voucher);
      setPrintModal(true);
      setCart([]);
      setDiscount(0);
      setPaidAmount(0);
      setNote('');
      loadPOSData(user?.storeId || 'default');
    } catch (err) {
      alert('Checkout error');
    }
  };

  // WhatsApp Share helper
  const getWhatsAppShareUrl = () => {
    if (!completedVoucher) return '#';
    const client = clients.find(c => c.name === completedVoucher.clientName);
    const phone = client?.phone ? client.phone.replace(/[^0-9]/g, '') : '';
    const text = encodeURIComponent(
      `*${user?.storeName || 'BazarPOS Outlet'}*\n` +
      `Invoice #: ${completedVoucher.voucherNo}\n` +
      `Date: ${new Date(completedVoucher.date).toLocaleDateString()}\n` +
      `Total: ৳${completedVoucher.totalAmount}\n` +
      `Paid: ৳${completedVoucher.paidAmount}\n` +
      `Due: ৳${completedVoucher.dueAmount}\n` +
      `Thank you for your purchase!`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleSendSMS = async () => {
    if (!completedVoucher) return;
    const client = clients.find(c => c.name === completedVoucher.clientName);
    const phone = client?.phone || '01700000000';
    const message = `[BazarPOS] Invoice #${completedVoucher.voucherNo}. Total: TK ${completedVoucher.totalAmount}. Paid: TK ${completedVoucher.paidAmount}. Thank you!`;

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();
      if (data.success) alert(`SMS queued to ${phone}!`);
    } catch (e) {
      alert('SMS send error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
      {/* LEFT: Product Grid & Search */}
      <div className="flex-1 bg-white rounded-2xl p-5 border border-slate-200 flex flex-col min-w-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Barcode className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              ref={barcodeRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan barcode or enter code & hit Enter..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
            />
          </form>

          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pr-1">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 cursor-pointer hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {p.code}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    p.quantity <= p.minQuantity ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                  }`}>
                    Stock: {p.quantity}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 text-xs mt-2 line-clamp-2 group-hover:text-blue-600 transition">
                  {p.name}
                </h4>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-sm text-blue-600">৳{p.sellingPrice}</span>
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Plus size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Cart Drawer */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm">
        <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Current Bill Cart</span>
          <span className="text-xs bg-blue-100 text-blue-700 font-mono px-2 py-0.5 rounded-full">
            {cart.length} items
          </span>
        </h2>

        <div className="grid grid-cols-2 gap-2 my-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sales Rep</label>
            <select
              value={selectedSaler}
              onChange={(e) => setSelectedSaler(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              {salers.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Cart is empty. Click products or scan barcode to add!
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-semibold text-xs text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500">৳{item.unitPrice} × {item.quantity}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-600 hover:bg-slate-100">
                      <Minus size={12} />
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-600 hover:bg-slate-100">
                      <Plus size={12} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 space-y-2.5">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Subtotal</span>
            <span>৳{subTotal}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Discount (৳)</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-20 px-2 py-1 border border-slate-200 rounded text-right font-bold text-xs"
            />
          </div>

          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Grand Total</span>
            <span className="text-blue-600">৳{grandTotal}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Paid Amount (৳)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Paid"
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
              >
                <option value="Cash">Cash</option>
                <option value="bKash/MFS">bKash / MFS</option>
                <option value="Card">Card</option>
                <option value="Due">Credit Due</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-2"
          >
            Complete Sale & Print Receipt
          </button>
        </div>
      </div>

      {/* PRINT RECEIPT & SHARE MODAL */}
      {printModal && completedVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between no-print border-b pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <CheckCircle className="text-emerald-500" size={20} />
                <span>Invoice Created Successfully!</span>
              </h3>
              <button onClick={() => setPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Action Bar: WhatsApp & SMS */}
            <div className="flex gap-2 no-print">
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1"
              >
                <Share2 size={14} />
                <span>Share WhatsApp</span>
              </a>
              <button
                onClick={handleSendSMS}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1"
              >
                <MessageSquare size={14} />
                <span>Send SMS Memo</span>
              </button>
            </div>

            {/* Printable Preview Area */}
            <div className="printable-area border p-4 rounded-xl bg-slate-50 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center pb-2 border-b">
                <h2 className="font-bold text-sm text-slate-900">{user?.storeName || 'BazarPOS Outlet'}</h2>
                <p>Phone: 01700000000 | Dhaka</p>
                <p className="font-semibold text-blue-600 mt-1">Invoice: {completedVoucher.voucherNo}</p>
                <p className="text-[10px] text-slate-500">{new Date(completedVoucher.date).toLocaleString()}</p>
              </div>

              <div className="py-1 border-b text-[11px] space-y-1">
                <p>Customer: <span className="font-bold">{completedVoucher.clientName}</span></p>
                <p>Sales Rep: {completedVoucher.salerName}</p>
              </div>

              <table className="w-full text-left text-[11px] border-b">
                <thead>
                  <tr className="border-b font-bold">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {completedVoucher.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.name}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">৳{item.unitPrice * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 text-right space-y-1 font-bold">
                <p>Subtotal: ৳{completedVoucher.subTotal}</p>
                {completedVoucher.discount > 0 && <p>Discount: -৳{completedVoucher.discount}</p>}
                <p className="text-sm text-blue-700">Grand Total: ৳{completedVoucher.totalAmount}</p>
                <p className="text-emerald-600">Paid ({completedVoucher.paymentMethod}): ৳{completedVoucher.paidAmount}</p>
                {completedVoucher.dueAmount > 0 && <p className="text-rose-600">Due: ৳{completedVoucher.dueAmount}</p>}
              </div>
            </div>

            <div className="flex space-x-3 no-print pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center space-x-2"
              >
                <Printer size={18} />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
