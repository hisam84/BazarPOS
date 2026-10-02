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
  UserPlus,
  PackagePlus,
  UserCheck,
  X,
  FileText,
  Mail,
  Send
} from 'lucide-react';
import InvoiceA4 from '@/components/InvoiceA4';

export default function POSTerminalPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [company, setCompany] = useState({});
  const [invoiceSettings, setInvoiceSettings] = useState({});
  const [printLayout, setPrintLayout] = useState('A4');
  
  // POS Cart & Search State
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
  
  // Modals
  const [completedVoucher, setCompletedVoucher] = useState(null);
  const [printModal, setPrintModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Quick Add Forms
  const [clientForm, setClientForm] = useState({ name: '', phone: '', address: '', due: 0 });
  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    category: 'Grocery',
    costPrice: '',
    sellingPrice: '',
    quantity: '10',
    minQuantity: 5,
    barcode: ''
  });

  const barcodeRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setSelectedSaler(u.fullName || u.username || 'Store Account');
      loadPOSData(u.storeId || 'default', u);
    }
  }, []);

  const loadPOSData = async (storeId, currentUser) => {
    try {
      const [prodRes, cliRes, staffRes, invRes] = await Promise.all([
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/clients?storeId=${storeId}`),
        fetch(`/api/staff?storeId=${storeId}`),
        fetch(`/api/invoice-settings?storeId=${storeId}`)
      ]);

      const prodData = await prodRes.json();
      const cliData = await cliRes.json();
      const staffData = await staffRes.json();
      const invData = await invRes.json();

      if (prodData.success) {
        setProducts(prodData.products || []);
        setCategories(['All', ...(prodData.categories || [])]);
      }
      if (cliData.success) {
        setClients(cliData.clients || []);
        if (cliData.clients.length > 0 && !selectedClient) setSelectedClient(cliData.clients[0].name);
      }
      if (staffData.success) {
        setStaffList(staffData.staff || []);
      }
      if (invData.success) {
        if (invData.settings) setInvoiceSettings(invData.settings);
        if (invData.company) setCompany(invData.company);
        if (invData.settings?.paperSize) setPrintLayout(invData.settings.paperSize === 'thermal' ? 'thermal' : 'A4');
      }

      if (currentUser) {
        setSelectedSaler(currentUser.fullName || currentUser.username || 'Store Account');
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
          unit: product.unit || 'Pcs',
          warranty: product.warranty || '',
          description: product.description || '',
          serialNumber: product.serialNumber || '',
          costPrice: product.costPrice || 0,
          unitPrice: product.sellingPrice || 0,
          quantity: 1,
          maxQuantity: product.quantity || 999
        }
      ];
    });
  };

  const updateItemSerialNumber = (id, serialNumber) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, serialNumber } : item))
    );
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

  // Quick Add Customer Handler
  const handleQuickAddClient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: user?.storeId || 'default', ...clientForm })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedClient(clientForm.name);
        setShowAddClientModal(false);
        setClientForm({ name: '', phone: '', address: '', due: 0 });
        loadPOSData(user?.storeId || 'default');
      }
    } catch (err) {
      alert('Error adding customer');
    }
  };


  // Quick Add Product Handler
  const handleQuickAddProduct = async (e) => {
    e.preventDefault();
    try {
      const code = productForm.code || 'P' + (products.length + 1).toString().padStart(3, '0');
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: user?.storeId || 'default', ...productForm, code })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProductModal(false);
        setProductForm({ code: '', name: '', category: 'Grocery', costPrice: '', sellingPrice: '', quantity: '10', minQuantity: 5, barcode: '' });
        loadPOSData(user?.storeId || 'default');
      }
    } catch (err) {
      alert('Error adding product');
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

  const [emailModal, setEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');

  const getInvoiceDownloadUrl = (voucher) => {
    if (!voucher) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invoice/${voucher.id}?storeId=${user?.storeId || 'default'}`;
  };

  const getWhatsAppShareUrl = () => {
    if (!completedVoucher) return '#';
    const client = clients.find(c => c.name === completedVoucher.clientName);
    const phone = client?.phone ? client.phone.replace(/[^0-9]/g, '') : '';
    const downloadUrl = getInvoiceDownloadUrl(completedVoucher);

    const text = encodeURIComponent(
      `*${user?.storeName || 'BazarPOS Outlet'}*\n` +
      `📄 *Invoice #:* ${completedVoucher.voucherNo}\n` +
      `📅 *Date:* ${new Date(completedVoucher.date).toLocaleDateString()}\n` +
      `💵 *Total Amount:* ৳${completedVoucher.totalAmount}\n` +
      `✅ *Paid:* ৳${completedVoucher.paidAmount}\n` +
      (completedVoucher.dueAmount > 0 ? `⚠️ *Due Balance:* ৳${completedVoucher.dueAmount}\n` : '') +
      `\n📥 *Download / View Invoice Link:*\n${downloadUrl}\n\n` +
      `Thank you for your business!`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleSendEmailInvoice = async (e) => {
    if (e) e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please provide a valid recipient email address');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch('/api/mail/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          recipient: recipientEmail,
          voucher: completedVoucher,
          invoiceUrl: getInvoiceDownloadUrl(completedVoucher)
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailSuccessMsg(data.message || 'Invoice emailed successfully with download link!');
        setTimeout(() => {
          setEmailModal(false);
          setEmailSuccessMsg('');
        }, 2500);
      } else {
        alert(data.message || 'Failed to send email');
      }
    } catch (err) {
      alert('Network error sending invoice email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSMS = async () => {
    if (!completedVoucher) return;
    const client = clients.find(c => c.name === completedVoucher.clientName);
    const phone = client?.phone || '01700000000';
    const downloadUrl = getInvoiceDownloadUrl(completedVoucher);
    const message = `[${user?.storeName || 'BazarPOS'}] Invoice #${completedVoucher.voucherNo}. Total: TK ${completedVoucher.totalAmount}. Paid: TK ${completedVoucher.paidAmount}. Download: ${downloadUrl}`;

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

          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 whitespace-nowrap"
          >
            <PackagePlus size={16} />
            <span>+ Add Product</span>
          </button>
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-500">Customer</label>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="text-[10px] text-blue-600 font-bold hover:underline flex items-center space-x-0.5"
              >
                <UserPlus size={12} />
                <span>+ Add</span>
              </button>
            </div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.customerId ? `[${c.customerId}]` : ''} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-500">Seller / Staff</label>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Active</span>
            </div>
            <select
              value={selectedSaler}
              onChange={(e) => setSelectedSaler(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value={user?.fullName || user?.username || 'Store Account'}>
                {user?.fullName || user?.username || 'Store Account'} ({user?.role === 'staff' ? 'Staff' : 'Owner'})
              </option>
              {staffList
                .filter(st => st.name !== (user?.fullName || user?.username) && st.username !== user?.username)
                .map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name} ({st.role || 'Staff'})
                  </option>
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
            cart.map((item) => {
              const hasWarranty = item.warranty && item.warranty.trim() !== '' && item.warranty.toLowerCase() !== 'no' && item.warranty.toLowerCase() !== 'none';
              return (
                <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
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

                  {/* Serial / IMEI input if product has warranty */}
                  {hasWarranty && (
                    <div className="pt-1.5 border-t border-slate-200/80 bg-blue-50/50 p-2 rounded-lg border border-blue-100/80">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-blue-700 font-bold flex items-center gap-1">
                          🛡️ Warranty: {item.warranty}
                        </span>
                        <span className="text-slate-500 font-medium">Serial / IMEI</span>
                      </div>
                      <input
                        type="text"
                        value={item.serialNumber || ''}
                        onChange={(e) => updateItemSerialNumber(item.id, e.target.value)}
                        placeholder="Enter Serial No / IMEI..."
                        className="w-full px-2.5 py-1 bg-white border border-blue-200 rounded-md text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              );
            })
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

      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Quick Add New Customer</h3>
              <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleQuickAddClient} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Customer Name *</label>
                <input type="text" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Phone Number</label>
                <input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Address</label>
                <input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">Save & Select</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* QUICK ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <PackagePlus className="text-blue-600" size={20} />
                <span>Add New Product</span>
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleQuickAddProduct} className="space-y-3.5 text-xs font-medium">
              {/* Row 1: Code & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Product Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product code"
                    value={productForm.code}
                    onChange={e => setProductForm({ ...productForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Barcode</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Enter barcode (optional)"
                      value={productForm.barcode}
                      onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = productForm.code || 'PRD';
                        const prefix = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '0');
                        const stamp = Date.now().toString().slice(-4);
                        const rand = Math.floor(1000 + Math.random() * 9000);
                        setProductForm(prev => ({ ...prev, barcode: `${prefix}${stamp}${rand}` }));
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] shrink-0"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique barcode for product identification</p>
                </div>
              </div>

              {/* Row 2: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product name"
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Category</label>
                  <input
                    type="text"
                    list="pos-categories"
                    placeholder="Select Category"
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
                  <datalist id="pos-categories">
                    {categories.filter(c => c !== 'All').map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Row 3: Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Purchase Price (৳) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={productForm.costPrice}
                    onChange={e => setProductForm({ ...productForm, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold font-mono text-xs focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Cost price / buying price</p>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Selling Price (৳) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={productForm.sellingPrice}
                    onChange={e => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold font-mono text-blue-600 text-xs focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unit price for customers</p>
                </div>
              </div>

              {/* Row 4: Quantity & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={productForm.quantity}
                    onChange={e => setProductForm({ ...productForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-xs focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Required for Physical products only</p>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Unit</label>
                  <select
                    value={productForm.unit || 'Pieces (pcs)'}
                    onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  >
                    {['Pieces (pcs)', 'Kilogram (kg)', 'Gram (gm)', 'Liter (ltr)', 'Box (box)', 'Packet (pkt)', 'Dozen (dz)', 'Meter (m)'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">Unit of measurement for this product</p>
                </div>
              </div>

              {/* Row 5: Low Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Low Stock Alert</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={productForm.minQuantity}
                    onChange={e => setProductForm({ ...productForm, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Warranty & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Warranty (Days)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productForm.warrantyDays || '0'}
                    onChange={e => setProductForm({ ...productForm, warrantyDays: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Warranty days for this product</p>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Supplier</label>
                  <input
                    type="text"
                    placeholder="Enter supplier name (optional)"
                    value={productForm.supplier || ''}
                    onChange={e => setProductForm({ ...productForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Default supplier for this product</p>
                </div>
              </div>

              {/* Row 7: Description */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Description</label>
                <textarea
                  rows="2"
                  placeholder="Enter product description (optional)"
                  value={productForm.description || ''}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {printModal && completedVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`bg-white rounded-2xl w-full shadow-2xl space-y-4 my-8 ${printLayout === 'A4' ? 'max-w-4xl max-h-[92vh] flex flex-col' : 'max-w-lg'} p-6`}>
            <div className="flex items-center justify-between no-print border-b pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-emerald-500" size={20} />
                <h3 className="font-bold text-slate-800 text-lg">
                  Invoice Created Successfully!
                </h3>
              </div>
              <button onClick={() => setPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Layout Toggle & Sharing */}
            <div className="flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrintLayout('A4')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    printLayout === 'A4' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={14} />
                  <span>A4 Paper Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout('thermal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    printLayout === 'thermal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer size={14} />
                  <span>Thermal Slip (80mm)</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs"
                >
                  <Share2 size={13} />
                  <span>WhatsApp (with Link)</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const client = clients.find(c => c.name === completedVoucher.clientName);
                    if (client?.email) setRecipientEmail(client.email);
                    setEmailModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs"
                >
                  <Mail size={13} />
                  <span>Email Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendSMS}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs"
                >
                  <MessageSquare size={13} />
                  <span>SMS</span>
                </button>
              </div>
            </div>


            {/* Printable Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[65vh] p-2 bg-slate-100/60 rounded-xl border border-slate-200">
              {printLayout === 'A4' ? (
                <div className="printable-area">
                  <InvoiceA4
                    invoice={completedVoucher}
                    company={company}
                    settings={invoiceSettings}
                    isSample={false}
                  />
                </div>
              ) : (
                <div className="printable-area max-w-sm mx-auto border p-4 rounded-xl bg-white font-mono text-xs text-slate-800 space-y-2 shadow-sm">
                  <div className="text-center pb-2 border-b">
                    <h2 className="font-bold text-sm text-slate-900">{company?.name || user?.storeName || 'BazarPOS Outlet'}</h2>
                    {company?.phone && <p>Phone: {company.phone}</p>}
                    {company?.address && <p className="text-[10px]">{company.address}</p>}
                    <p className="font-semibold text-blue-600 mt-1">Invoice: {completedVoucher.voucherNo}</p>
                    <p className="text-[10px] text-slate-500">{new Date(completedVoucher.date).toLocaleString()}</p>
                  </div>

                  <div className="py-1 border-b text-[11px] space-y-1">
                    <p>Customer: <span className="font-bold">{completedVoucher.clientName}</span></p>
                    {completedVoucher.salerName && <p>Sales Rep: {completedVoucher.salerName}</p>}
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
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-1">
                            <p className="font-semibold">{item.name}</p>
                            {item.warranty && (
                              <p className="text-[9px] text-blue-600 font-medium">Warranty: {item.warranty}</p>
                            )}
                            {(item.serialNumber || item.serialNo) && (
                              <p className="text-[9px] text-purple-700 font-mono font-medium">S/N: {item.serialNumber || item.serialNo}</p>
                            )}
                            {item.description && (
                              <p className="text-[9px] text-slate-500 italic leading-tight">{item.description}</p>
                            )}
                          </td>
                          <td className="py-1 text-center align-top">{item.quantity}</td>
                          <td className="py-1 text-right align-top">৳{item.unitPrice * item.quantity}</td>
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
              )}
            </div>

            <div className="flex space-x-3 no-print pt-2 border-t">
              <button
                type="button"
                onClick={() => setPrintModal(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 text-xs shadow-md"
              >
                <Printer size={16} />
                <span>Print {printLayout === 'A4' ? 'A4 Invoice' : 'Thermal Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND EMAIL INVOICE MODAL */}
      {emailModal && completedVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-800 text-base">
                  Email Invoice & Download Link
                </h3>
              </div>
              <button onClick={() => setEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-600 space-y-1">
              <p className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-bold text-slate-900">{completedVoucher.voucherNo}</span>
              </p>
              <p className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium text-slate-800">{completedVoucher.clientName}</span>
              </p>
              <p className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-indigo-700">৳{completedVoucher.totalAmount}</span>
              </p>
            </div>

            {emailSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-fadeIn">
                <CheckCircle size={16} />
                <span>{emailSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendEmailInvoice} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Recipient Customer Email *</label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The recipient will receive an HTML email with the invoice summary and a direct <strong>Download / View Full A4 Invoice</strong> link.
                </p>
              </div>

              <div className="pt-2 border-t flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEmailModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 text-xs shadow-md shadow-indigo-600/20"
                >
                  <Send size={14} />
                  <span>{sendingEmail ? 'Sending...' : 'Send Invoice Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

