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
  Send,
  Boxes,
  ShoppingCart,
  ArrowRight,
  Camera
} from 'lucide-react';
import InvoiceA4 from '@/components/InvoiceA4';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

const WARRANTY_TYPES = [
  { value: 'none', label: 'No Warranty', color: 'bg-slate-100 text-slate-500' },
  { value: 'replacement', label: 'Replacement', color: 'bg-blue-100 text-blue-700' },
  { value: 'service', label: 'Service', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'exchange', label: 'Exchange', color: 'bg-violet-100 text-violet-700' },
  { value: 'repair', label: 'Repair', color: 'bg-amber-100 text-amber-700' },
  { value: 'refund', label: 'Refund', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'brand', label: 'Brand Warranty', color: 'bg-green-100 text-green-700' },
  { value: 'limited', label: 'Limited', color: 'bg-orange-100 text-orange-700' },
  { value: 'lifetime', label: 'Lifetime', color: 'bg-rose-100 text-rose-700' },
];

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
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'
  
  // Checkout State
  const [selectedClient, setSelectedClient] = useState(''); // Default: No customer preselected
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [includePreviousDue, setIncludePreviousDue] = useState(false);
  const [showPreviousDueModal, setShowPreviousDueModal] = useState(false);
  const [pendingDueClient, setPendingDueClient] = useState(null);

  const [selectedSaler, setSelectedSaler] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [saleNote, setSaleNote] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [note, setNote] = useState('');
  
  // Modals
  const [completedVoucher, setCompletedVoucher] = useState(null);
  const [printModal, setPrintModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showProductFormScanner, setShowProductFormScanner] = useState(false);
  const [scanningSerialItem, setScanningSerialItem] = useState(null);

  // Quick Add Forms
  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', address: '', due: 0 });
  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    category: 'Grocery',
    brand: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '10',
    minQuantity: 5,
    warrantyDays: '0',
    warrantyType: 'none',
    supplier: '',
    barcode: ''
  });

  const barcodeRef = useRef(null);
  const clientDropdownRef = useRef(null);

  // Close customer dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        // NOTE: By default do NOT auto-select a customer (user requirement #1)
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
          brand: product.brand || '',
          unit: product.unit || 'Pcs',
          warranty: product.warranty || (product.warrantyDays > 0 ? `${product.warrantyDays} Days` : ''),
          warrantyType: product.warrantyType || 'none',
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

    const trimmed = barcodeInput.trim();
    const matched = products.find(
      (p) => (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) || 
             (p.code && p.code.toLowerCase() === trimmed.toLowerCase())
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`Product with barcode "${trimmed}" not found!`);
    }
  };

  const handleCameraScan = (code) => {
    if (!code) return;
    const trimmed = code.trim();
    const matched = products.find(
      (p) => (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) || 
             (p.code && p.code.toLowerCase() === trimmed.toLowerCase())
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`Product with barcode "${trimmed}" not found in inventory!`);
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
        setSelectedClient(data.client?.name || clientForm.name);
        setShowAddClientModal(false);
        setClientForm({ name: '', phone: '', email: '', address: '', due: 0 });
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
        setProductForm({ code: '', name: '', category: 'Grocery', brand: '', costPrice: '', sellingPrice: '', quantity: '10', minQuantity: 5, barcode: '' });
        loadPOSData(user?.storeId || 'default');
      }
    } catch (err) {
      alert('Error adding product');
    }
  };

  const handleSelectClient = (client) => {
    if (!client) {
      setSelectedClient('');
      setIncludePreviousDue(false);
      setClientDropdownOpen(false);
      return;
    }

    setSelectedClient(client.name);
    setClientDropdownOpen(false);

    if (Number(client.due) > 0) {
      setPendingDueClient(client);
      setShowPreviousDueModal(true);
    } else {
      setIncludePreviousDue(false);
    }
  };

  const selectedClientObj = clients.find(c => c.name === selectedClient || c.id === selectedClient);
  const previousDueAmount = (includePreviousDue && selectedClientObj?.due > 0) ? Number(selectedClientObj.due) : 0;

  const subTotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const itemsTotal = Math.max(0, subTotal - Number(discount));
  const grandTotal = itemsTotal + previousDueAmount;
  const dueAmount = Math.max(0, grandTotal - Number(paidAmount));

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      const clientPhone = selectedClientObj?.phone || '';

      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          clientName: selectedClient || 'Walk-in Customer',
          clientPhone,
          salerName: selectedSaler || 'Main Counter',
          items: cart,
          totalAmount: subTotal,
          discount: Number(discount),
          previousDue: previousDueAmount,
          includePreviousDue: Boolean(includePreviousDue && previousDueAmount > 0),
          paidAmount: Number(paidAmount),
          paymentMethod,
          note: saleNote || note || '',
          saleNote,
          paymentNote
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
      setSaleNote('');
      setPaymentNote('');
      setNote('');
      setIncludePreviousDue(false);
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
    const token = voucher.publicToken || voucher.id;
    return `${origin}/invoice/${token}?storeId=${user?.storeId || 'default'}`;
  };

  const formatWhatsAppPhone = (rawPhone) => {
    if (!rawPhone) return '';
    let clean = String(rawPhone).replace(/[^0-9]/g, '');
    if (!clean) return '';
    if (clean.startsWith('00')) clean = clean.substring(2);
    // Bangladesh local 11-digit mobile starting with 01 (017, 018, 019, 013, 014, 015, 016)
    if (clean.length === 11 && clean.startsWith('01')) {
      clean = '88' + clean;
    } else if (clean.length === 10 && clean.startsWith('1')) {
      clean = '880' + clean;
    }
    return clean;
  };

  const getWhatsAppShareUrl = () => {
    if (!completedVoucher) return '#';
    const client = clients.find(c => c.name === completedVoucher.clientName || c.id === completedVoucher.clientId);
    const rawPhone = completedVoucher.clientPhone || client?.phone || '';
    const phone = formatWhatsAppPhone(rawPhone);
    const downloadUrl = getInvoiceDownloadUrl(completedVoucher);

    const text = encodeURIComponent(
      `*${user?.storeName || 'BazarPOS Outlet'}*\n` +
      `📄 *Invoice #:* ${completedVoucher.voucherNo}\n` +
      `📅 *Date:* ${new Date(completedVoucher.date).toLocaleDateString()}\n` +
      `👤 *Customer:* ${completedVoucher.clientName || 'Valued Customer'}\n` +
      `💵 *Total Amount:* ৳${completedVoucher.totalAmount}\n` +
      `✅ *Paid:* ৳${completedVoucher.paidAmount}\n` +
      (completedVoucher.dueAmount > 0 ? `⚠️ *Due Balance:* ৳${completedVoucher.dueAmount}\n` : '') +
      `\n📥 *Download / View Invoice Link:*\n${downloadUrl}\n\n` +
      `Thank you for your business!`
    );
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
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
    const phone = client?.phone || completedVoucher.clientPhone || '01700000000';
    const downloadUrl = getInvoiceDownloadUrl(completedVoucher);

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: user?.storeId || 'default',
          phone,
          templateId: 'invoice',
          variables: {
            customer_name: completedVoucher.clientName || 'Valued Customer',
            company_name: user?.storeName || 'BazarPOS Outlet',
            invoice_no: completedVoucher.voucherNo || completedVoucher.id,
            total_amount: `TK ${Number(completedVoucher.totalAmount || 0).toLocaleString()}`,
            paid_amount: `TK ${Number(completedVoucher.paidAmount || 0).toLocaleString()}`,
            due_amount: `TK ${Number(completedVoucher.dueAmount || 0).toLocaleString()}`,
            invoice_link: downloadUrl
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `SMS sent successfully to ${phone}!`);
      } else {
        alert(`SMS Alert: ${data.message || 'Failed to send SMS'}`);
      }
    } catch (e) {
      alert('Error connecting to SMS gateway');
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
    <div className="min-h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-5 relative pb-20 lg:pb-0 overflow-x-hidden">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden items-center p-1 bg-slate-200/90 rounded-2xl text-xs font-bold gap-1 shrink-0 shadow-inner">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
            mobileTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes size={16} />
          <span className="truncate">Catalog ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
            mobileTab === 'cart' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart size={16} />
          <span className="truncate">Cart ({cart.length}) {cart.length > 0 ? `• ৳${grandTotal.toLocaleString()}` : ''}</span>
        </button>
      </div>

      {/* LEFT: Product Grid & Search */}
      <div className={`flex-1 bg-white rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-200/90 flex flex-col min-w-0 shadow-sm ${
        mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 mb-3">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative min-w-0 flex items-center">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-2.5 text-slate-400" size={17} />
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode / code..."
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="absolute right-1 top-1 p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Open Camera Scanner"
              >
                <Camera size={16} />
              </button>
            </div>
          </form>

          <div className="flex gap-2 min-w-0">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 whitespace-nowrap shrink-0 shadow-sm shadow-blue-500/10 transition"
            >
              <PackagePlus size={15} />
              <span className="hidden sm:inline">+ Add Product</span>
              <span className="sm:hidden">+ Product</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-2.5 no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3 pr-1 content-start">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between group select-none min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-bold bg-slate-200/90 text-slate-700 px-1.5 py-0.5 rounded truncate max-w-[55%]">
                    {p.code}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
                    p.quantity <= (p.minQuantity || 0) ? 'bg-rose-100 text-rose-600 font-bold' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    Stock: {p.quantity}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs mt-1.5 sm:mt-2 line-clamp-2 min-h-[28px] sm:min-h-[30px] group-hover:text-blue-600 transition leading-snug break-words">
                  {p.name}
                </h4>
              </div>

              <div className="mt-2 flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-200/80">
                <span className="font-black text-xs sm:text-sm text-blue-600 truncate">৳{Number(p.sellingPrice).toLocaleString()}</span>
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition shrink-0">
                  <Plus size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Mobile Cart Bar when on Catalog Tab */}
      {mobileTab === 'catalog' && cart.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 lg:hidden z-30 animate-fadeIn">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-2 truncate pr-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                {cart.length}
              </span>
              <span className="text-xs truncate">Total:</span>
              <span className="text-sm font-black whitespace-nowrap">৳{grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold shrink-0">
              <span>View Cart &rarr;</span>
            </div>
          </button>
        </div>
      )}

      {/* RIGHT: Cart Drawer */}
      <div className={`w-full lg:w-[360px] xl:w-[400px] 2xl:w-[420px] bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 md:p-5 flex flex-col min-w-0 shadow-sm shrink-0 ${
        mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
      }`}>
        <h2 className="text-sm sm:text-base font-bold text-slate-800 pb-2.5 sm:pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Current Bill Cart</span>
          <span className="text-xs bg-blue-100 text-blue-700 font-mono px-2 py-0.5 rounded-full">
            {cart.length} items
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-2.5 my-2.5">
          <div className="relative" ref={clientDropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-500">Customer</label>
              <button
                type="button"
                onClick={() => {
                  setClientForm({ name: '', phone: '', email: '', address: '', due: 0 });
                  setShowAddClientModal(true);
                }}
                className="text-[10px] text-blue-600 font-bold hover:underline flex items-center space-x-0.5"
              >
                <UserPlus size={12} />
                <span>+ Add</span>
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className={`w-full px-2.5 py-2 bg-slate-50 border rounded-xl text-left text-xs font-semibold flex items-center justify-between transition ${
                  selectedClient
                    ? 'border-blue-300 bg-blue-50/40 text-blue-900'
                    : 'border-slate-200 text-slate-800 hover:bg-slate-100/80'
                }`}
              >
                <div className="min-w-0 flex-1 truncate pr-1">
                  {selectedClient ? (
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="font-bold truncate">{selectedClient}</span>
                      {selectedClientObj?.phone && (
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          ({selectedClientObj.phone})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium truncate block">
                      Select Customer (Walk-in)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {selectedClientObj?.due > 0 ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 whitespace-nowrap">
                      ৳{Number(selectedClientObj.due).toLocaleString()} Due
                    </span>
                  ) : selectedClient ? (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                      No Due
                    </span>
                  ) : null}

                  {selectedClient ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClient(null);
                      }}
                      className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition"
                      title="Clear Customer"
                    >
                      <X size={12} />
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">▼</span>
                  )}
                </div>
              </button>

              {/* Optimized Searchable Dropdown Popup */}
              {clientDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-[300px] sm:w-[380px] max-w-[calc(100vw-2.5rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3 space-y-2.5 max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
                    <input
                      type="text"
                      autoFocus
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search by name, phone, ID..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    {clientSearch && (
                      <button
                        type="button"
                        onClick={() => setClientSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Customer List Feed */}
                  <div className="overflow-y-auto flex-1 space-y-1.5 pr-0.5 max-h-64 custom-scrollbar">
                    {/* Walk-in Customer Option */}
                    <button
                      type="button"
                      onClick={() => handleSelectClient(null)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between border ${
                        !selectedClient
                          ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          W
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">Walk-in Customer</p>
                          <p className="text-[10px] text-slate-400">Regular counter checkout (No credit due)</p>
                        </div>
                      </div>
                      {!selectedClient && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          ✓
                        </span>
                      )}
                    </button>

                    {/* Filtered Clients */}
                    {(() => {
                      const q = clientSearch.toLowerCase().trim();
                      const matched = clients.filter(c => {
                        if (!q) return true;
                        return (
                          (c.name && c.name.toLowerCase().includes(q)) ||
                          (c.phone && c.phone.includes(q)) ||
                          (c.customerId && c.customerId.toLowerCase().includes(q))
                        );
                      });

                      if (matched.length === 0) {
                        return (
                          <div className="py-6 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-4 space-y-2">
                            <p className="text-xs font-semibold text-slate-600">
                              No customer matches &quot;{clientSearch}&quot;
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setClientForm({ name: clientSearch, phone: '', email: '', address: '', due: 0 });
                                setShowAddClientModal(true);
                                setClientDropdownOpen(false);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition"
                            >
                              + Add &quot;{clientSearch}&quot; as New Customer
                            </button>
                          </div>
                        );
                      }

                      return matched.map(c => {
                        const isSelected = selectedClient === c.name || selectedClient === c.id;
                        return (
                          <button
                            key={c.id || c.name}
                            type="button"
                            onClick={() => handleSelectClient(c)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between border ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-xs'
                                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {(c.name || 'C')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-slate-900 truncate">{c.name}</span>
                                  {c.customerId && (
                                    <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded shrink-0">
                                      {c.customerId}
                                    </span>
                                  )}
                                </div>
                                {c.phone && (
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                                    📞 {c.phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {Number(c.due) > 0 ? (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200/60 whitespace-nowrap">
                                  ৳{Number(c.due).toLocaleString()} Due
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  No Due
                                </span>
                              )}
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                  ✓
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Bottom Footer Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {clients.length} Registered Customers
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setClientForm({ name: '', phone: '', email: '', address: '', due: 0 });
                        setShowAddClientModal(true);
                        setClientDropdownOpen(false);
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <UserPlus size={12} />
                      <span>+ Create New Customer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-500">Seller / Staff</label>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Active</span>
            </div>
            <select
              value={selectedSaler}
              onChange={(e) => setSelectedSaler(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
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
                      <p className="text-[10px] text-slate-500">
                        {item.brand && <span className="font-semibold text-indigo-600 mr-1.5">[{item.brand}]</span>}
                        ৳{item.unitPrice} × {item.quantity}
                      </p>
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
                          🛡️ Warranty: {item.warranty}{item.warrantyType && item.warrantyType !== 'none' ? ` · ${item.warrantyType.charAt(0).toUpperCase() + item.warrantyType.slice(1)}` : ''}
                        </span>
                        <span className="text-slate-500 font-medium">Serial / IMEI</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item.serialNumber || ''}
                          onChange={(e) => updateItemSerialNumber(item.id, e.target.value)}
                          placeholder="Enter Serial No / IMEI..."
                          className="flex-1 min-w-0 px-2.5 py-1 bg-white border border-blue-200 rounded-md text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setScanningSerialItem(item)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-md transition shadow-xs flex items-center space-x-1 shrink-0 text-xs font-bold"
                          title="Scan Serial No / IMEI barcode with camera"
                        >
                          <Camera size={13} />
                          <span className="text-[10px]">Scan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Items Subtotal</span>
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

          {/* Previous Due Line if Included */}
          {includePreviousDue && previousDueAmount > 0 && (
            <div className="flex items-center justify-between p-2 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 font-semibold">
              <div className="flex items-center space-x-1.5">
                <span>⚠️ Previous Due Added:</span>
                <span className="font-bold font-mono">৳{previousDueAmount.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => setIncludePreviousDue(false)}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Prompt to add previous due if customer has due and not yet added */}
          {!includePreviousDue && selectedClientObj?.due > 0 && (
            <div className="flex items-center justify-between p-1.5 bg-slate-100 rounded-lg text-[11px] text-slate-600">
              <span>Customer Due: ৳{Number(selectedClientObj.due).toLocaleString()}</span>
              <button
                type="button"
                onClick={() => setIncludePreviousDue(true)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                + Add to Bill
              </button>
            </div>
          )}

          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Grand Total / Net Payable</span>
            <span className="text-blue-600">৳{grandTotal.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Paid Amount (৳)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Paid"
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="Cash">Cash</option>
                <option value="bKash/MFS">bKash / MFS</option>
                <option value="Card">Card</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Due">Credit Due</option>
              </select>
            </div>
          </div>

          {/* Sale Note & Payment Note Inputs */}
          <div className="space-y-1.5 pt-1">
            <div>
              <input
                type="text"
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
                placeholder="Sale Note / Instructions (Optional)..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Payment Note / Trx ID / Ref (Optional)..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-1.5"
          >
            Complete Sale & Print Receipt
          </button>
        </div>
      </div>

      {/* PREVIOUS DUE CONFIRMATION MODAL */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/95 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">Quick Add New Customer</h3>
              <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleQuickAddClient} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">Customer Name *</label>
                <input type="text" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500" placeholder="e.g. Rahim Chowdhury" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Phone Number</label>
                  <input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono focus:bg-white focus:outline-none focus:border-blue-500" placeholder="01700000000" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Email Address</label>
                  <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500" placeholder="customer@mail.com" />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Address</label>
                <input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500" placeholder="e.g. Dhaka, Bangladesh" />
              </div>
              <div className="pt-3 border-t flex space-x-3">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition">Save &amp; Select</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* QUICK ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/95 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <PackagePlus className="text-blue-600" size={20} />
                <span>Add New Product</span>
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleQuickAddProduct} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
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
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Enter barcode (optional)"
                        value={productForm.barcode}
                        onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                        className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowProductFormScanner(true)}
                        className="absolute right-1 top-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Scan Barcode using Camera"
                      >
                        <Camera size={15} />
                      </button>
                    </div>
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique barcode or scan via mobile camera</p>
                </div>
              </div>

              {/* Row 2: Name & Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
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
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung, Unilever"
                    value={productForm.brand || ''}
                    onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
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

              {/* Row 6: Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Warranty Duration (Days)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productForm.warrantyDays || '0'}
                    onChange={e => setProductForm({ ...productForm, warrantyDays: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Enter 0 for no warranty period</p>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Warranty Type</label>
                  <select
                    value={productForm.warrantyType || 'none'}
                    onChange={e => setProductForm({ ...productForm, warrantyType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    {WARRANTY_TYPES.map(wt => (
                      <option key={wt.value} value={wt.value}>{wt.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">Type of warranty coverage</p>
                </div>
              </div>

              {/* Row 7: Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Supplier</label>
                  <input
                    type="text"
                    placeholder="Enter supplier name (optional)"
                    value={productForm.supplier || ''}
                    onChange={e => setProductForm({ ...productForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Default supplier for this product</p>
                </div>
                <div className="hidden sm:block"></div>
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

      {/* PREVIOUS DUE CONFIRMATION MODAL */}
      {showPreviousDueModal && pendingDueClient && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center space-x-3 text-amber-700 font-bold">
                <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shadow-inner">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-base text-slate-900 leading-tight">Customer Previous Due</h3>
                  <p className="text-[11px] text-amber-700/80 font-medium">Outstanding balance detected</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIncludePreviousDue(false);
                  setShowPreviousDueModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-900 font-semibold">Customer:</span>
                  <span className="font-bold text-slate-900">{pendingDueClient.name}</span>
                </div>
                {pendingDueClient.phone && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-900 font-semibold">Phone:</span>
                    <span className="font-mono text-slate-700">{pendingDueClient.phone}</span>
                  </div>
                )}
                {pendingDueClient.customerId && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-900 font-semibold">Customer ID:</span>
                    <span className="font-mono text-slate-700">{pendingDueClient.customerId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-amber-200 text-sm">
                  <span className="font-bold text-amber-950">Previous Due Balance:</span>
                  <span className="font-black font-mono text-rose-600 text-lg">
                    ৳{Number(pendingDueClient.due || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed text-center font-medium">
                Do you want to add this outstanding <strong>৳{Number(pendingDueClient.due || 0).toLocaleString()}</strong> due to the current sales bill/invoice?
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIncludePreviousDue(false);
                    setShowPreviousDueModal(false);
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  No, Current Sale Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludePreviousDue(true);
                    setShowPreviousDueModal(false);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/25"
                >
                  Yes, Add to Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {printModal && completedVoucher && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 ${printLayout === 'A4' ? 'max-w-4xl' : 'max-w-lg'}`}>
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-10 no-print">
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <CheckCircle size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                  Invoice Created <span className="text-blue-600 font-mono">({completedVoucher.voucherNo})</span>
                </h3>
              </div>
              <button onClick={() => setPrintModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Layout Toggle & Sharing Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-slate-50/90 border-b border-slate-100 shrink-0 no-print">
              <div className="grid grid-cols-2 sm:flex items-center bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto gap-1">
                <button
                  type="button"
                  onClick={() => setPrintLayout('A4')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    printLayout === 'A4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={13} />
                  <span>A4 Paper Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout('thermal')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    printLayout === 'thermal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer size={13} />
                  <span>Thermal Slip (80mm)</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-xs transition"
                  title="Send WhatsApp Message"
                >
                  <Share2 size={13} className="shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const client = clients.find(c => c.name === completedVoucher.clientName);
                    if (client?.email) setRecipientEmail(client.email);
                    setEmailModal(true);
                  }}
                  className="px-2 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-xs transition"
                  title="Email Invoice"
                >
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">Email</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendSMS}
                  className="px-2 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-xs transition"
                  title="Send SMS"
                >
                  <MessageSquare size={13} className="shrink-0" />
                  <span className="truncate">SMS</span>
                </button>
              </div>
            </div>

            {/* Printable & Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 bg-slate-100/70">
              {printLayout === 'A4' ? (
                <div className="printable-area w-full min-w-fit flex justify-center">
                  <InvoiceA4
                    invoice={completedVoucher}
                    company={company}
                    settings={invoiceSettings}
                    isSample={false}
                  />
                </div>
              ) : (
                <div className="printable-area max-w-sm mx-auto border border-slate-200/80 p-4 sm:p-5 rounded-2xl bg-white font-mono text-xs text-slate-800 space-y-2 shadow-sm">
                  <div className="text-center pb-2 border-b border-slate-200">
                    <h2 className="font-bold text-sm text-slate-900">{company?.name || user?.storeName || 'BazarPOS Outlet'}</h2>
                    {company?.phone && <p>Phone: {company.phone}</p>}
                    {company?.address && <p className="text-[10px]">{company.address}</p>}
                    <p className="font-semibold text-blue-600 mt-1">Invoice: {completedVoucher.voucherNo}</p>
                    <p className="text-[10px] text-slate-500">{new Date(completedVoucher.date).toLocaleString()}</p>
                  </div>

                  <div className="py-1 border-b border-slate-100 text-[11px] space-y-1">
                    <p>Customer: <span className="font-bold text-slate-900">{completedVoucher.clientName}</span></p>
                    {completedVoucher.salerName && <p>Sales Rep: {completedVoucher.salerName}</p>}
                  </div>

                  <table className="w-full text-left text-[11px] border-b border-slate-200">
                    <thead>
                      <tr className="border-b font-bold text-slate-700">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedVoucher.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-1">
                            <p className="font-semibold text-slate-900">{item.name}</p>
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
                          <td className="py-1 text-center align-top font-bold">{item.quantity}</td>
                          <td className="py-1 text-right align-top font-mono font-semibold">৳{item.unitPrice * item.quantity}</td>
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

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 p-3 sm:px-6 sm:py-3.5 bg-white border-t border-slate-200 shrink-0 no-print">
              <button
                type="button"
                onClick={() => setPrintModal(false)}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 text-xs shadow-md shadow-blue-500/20 transition"
              >
                <Printer size={15} />
                <span>Print {printLayout === 'A4' ? 'A4' : 'Thermal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND EMAIL INVOICE MODAL */}
      {emailModal && completedVoucher && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <Mail className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-800 text-base">
                  Email Invoice &amp; Download Link
                </h3>
              </div>
              <button onClick={() => setEmailModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-medium">
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

              <form onSubmit={handleSendEmailInvoice} className="space-y-3.5">
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
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 text-xs shadow-md shadow-indigo-600/20 transition"
                  >
                    <Send size={14} />
                    <span>{sendingEmail ? 'Sending...' : 'Send Invoice Email'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE CAMERA BARCODE SCANNERS ================= */}
      <BarcodeScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanSuccess={handleCameraScan}
        continuous={false}
        title="POS Camera Barcode Scanner"
      />

      <BarcodeScannerModal
        isOpen={showProductFormScanner}
        onClose={() => setShowProductFormScanner(false)}
        onScanSuccess={(code) => {
          setProductForm(prev => ({ ...prev, barcode: code }));
        }}
        continuous={false}
        title="Scan Product Barcode"
      />

      <BarcodeScannerModal
        isOpen={!!scanningSerialItem}
        onClose={() => setScanningSerialItem(null)}
        onScanSuccess={(code) => {
          if (scanningSerialItem) {
            updateItemSerialNumber(scanningSerialItem.id, code);
          }
          setScanningSerialItem(null);
        }}
        continuous={false}
        title={scanningSerialItem ? `Scan Serial / IMEI (${scanningSerialItem.name})` : 'Scan Serial / IMEI Barcode'}
      />
    </div>
  );
}

