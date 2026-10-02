'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  X,
  RefreshCw,
  ShieldCheck,
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';

const DEFAULT_UNITS = [
  'Pieces (pcs)',
  'Kilogram (kg)',
  'Gram (gm)',
  'Liter (ltr)',
  'Box (box)',
  'Packet (pkt)',
  'Dozen (dz)',
  'Meter (m)',
  'Carton (ctn)',
  'Pair (pr)'
];

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

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All', 'General']);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    code: '',
    barcode: '',
    name: '',
    category: 'General',
    brand: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '0',
    unit: 'Pieces (pcs)',
    minQuantity: '5',
    warrantyDays: '0',
    warrantyType: 'none',
    supplier: '',
    description: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadInventory(u.storeId || 'default');
    } else {
      loadInventory('default');
    }
  }, []);

  const loadInventory = async (storeId) => {
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.categories && data.categories.length > 0) {
          setCategories(['All', ...data.categories.filter(c => c !== 'All')]);
        }
        if (data.brands) {
          setBrands(data.brands);
        }
        if (data.units && data.units.length > 0) {
          setUnits(data.units);
        }
        if (data.suppliers && data.suppliers.length > 0) {
          setSuppliers(data.suppliers);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBarcode = () => {
    const code = form.code ? form.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '0') : 'PRD';
    const stamp = Date.now().toString().slice(-4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newBarcode = `${code}${stamp}${rand}`;
    setForm(prev => ({ ...prev, barcode: newBarcode }));
  };

  const handleOpenAddModal = () => {
    setEditProduct(null);
    const nextCode = 'PRD-' + (products.length + 1).toString().padStart(4, '0');
    setForm({
      code: nextCode,
      barcode: '',
      name: '',
      category: categories.find(c => c !== 'All') || 'General',
      brand: '',
      costPrice: '',
      sellingPrice: '',
      quantity: '0',
      unit: 'Pieces (pcs)',
      minQuantity: '5',
      warrantyDays: '0',
      warrantyType: 'none',
      supplier: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditProduct(prod);
    setForm({
      code: prod.code || '',
      barcode: prod.barcode || '',
      name: prod.name || '',
      category: prod.category || 'General',
      brand: prod.brand || '',
      costPrice: prod.costPrice !== undefined ? prod.costPrice : '',
      sellingPrice: prod.sellingPrice !== undefined ? prod.sellingPrice : '',
      quantity: prod.quantity !== undefined ? prod.quantity : '0',
      unit: prod.unit || 'Pieces (pcs)',
      minQuantity: prod.minQuantity !== undefined ? prod.minQuantity : '5',
      warrantyDays: prod.warrantyDays !== undefined ? prod.warrantyDays : '0',
      warrantyType: prod.warrantyType || 'none',
      supplier: prod.supplier || '',
      description: prod.description || ''
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};

      const url = '/api/products';
      const method = editProduct ? 'PUT' : 'POST';
      const body = editProduct
        ? { storeId: u.storeId || 'default', id: editProduct.id, ...form }
        : { storeId: u.storeId || 'default', ...form };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to save product');
        return;
      }

      setShowModal(false);
      loadInventory(u.storeId || 'default');
    } catch (err) {
      alert('Save error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch(`/api/products?id=${id}&storeId=${u.storeId || 'default'}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      alert('Delete error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search)) ||
      (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Package className="text-blue-600" size={24} />
            <span>Product Inventory & Stock Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage product catalog, barcode identifiers, brands, purchase & sale prices, stock limits, and suppliers.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 text-xs"
        >
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name, Code, Brand, Barcode, or Supplier..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading Products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No products found. Click "Add New Product" to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Purchase (৳)</th>
                  <th className="px-4 py-3">Selling (৳)</th>
                  <th className="px-4 py-3">Stock Qty</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{p.code}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{p.barcode || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      {p.warrantyDays > 0 && (
                        <span className="text-[10px] text-blue-600 font-medium">
                          🛡️ {p.warrantyDays}d
                          {p.warrantyType && p.warrantyType !== 'none' && (
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              (WARRANTY_TYPES.find(w => w.value === p.warrantyType) || {}).color || 'bg-slate-100 text-slate-500'
                            }`}>
                              {(WARRANTY_TYPES.find(w => w.value === p.warrantyType) || {}).label || p.warrantyType}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded font-medium">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.brand ? (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[11px] border border-indigo-100">
                          {p.brand}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono font-medium">৳{p.costPrice || 0}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">৳{p.sellingPrice}</td>
                    <td className="px-4 py-3 font-bold">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] ${
                        p.quantity <= (p.minQuantity || 5)
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.quantity <= (p.minQuantity || 5) && <AlertTriangle size={12} />}
                        <span>{p.quantity} {p.unit || 'pcs'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{p.supplier || '-'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL (MATCHING REQUESTED DESIGN) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Title Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <Package className="text-blue-600" size={22} />
                <span>{editProduct ? 'Edit Product Details' : 'Add New Product'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields Matching Reference Image */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs font-medium">
              {/* Row 1: Product Code * & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Product Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Barcode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter barcode (optional)"
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm shrink-0"
                    >
                      <RefreshCw size={13} />
                      <span>Generate</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Unique barcode for product identification</p>
                </div>
              </div>

              {/* Row 2: Product Name * & Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 mb-1.5 font-bold">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Category</label>
                  <div className="relative">
                    <input
                      type="text"
                      list="category-suggestions"
                      placeholder="Select Category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                    />
                    <datalist id="category-suggestions">
                      {categories.filter(c => c !== 'All').map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Brand / Manufacturer</label>
                  <div className="relative">
                    <input
                      type="text"
                      list="brand-suggestions"
                      placeholder="e.g. Samsung, Nestlé, Unilever"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                    />
                    <datalist id="brand-suggestions">
                      {brands.map((b, idx) => (
                        <option key={idx} value={b} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Row 3: Purchase Price (৳) * & Selling Price (৳) * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Purchase Price (৳) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 font-bold font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Cost price / buying price</p>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Selling Price (৳) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-blue-600 font-bold font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unit price for customers</p>
                </div>
              </div>

              {/* Row 4: Quantity * & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 font-bold text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Required for Physical products only</p>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Unit of measurement for this product</p>
                </div>
              </div>

              {/* Row 5: Low Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Low Stock Alert</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={form.minQuantity}
                    onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>
                <div className="hidden sm:block"></div>
              </div>

              {/* Row 6: Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Warranty Duration (Days)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.warrantyDays}
                    onChange={(e) => setForm({ ...form, warrantyDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Enter 0 for no warranty period</p>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Warranty Type</label>
                  <select
                    value={form.warrantyType || 'none'}
                    onChange={(e) => setForm({ ...form, warrantyType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  >
                    {WARRANTY_TYPES.map(wt => (
                      <option key={wt.value} value={wt.value}>{wt.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Type of warranty coverage</p>
                </div>
              </div>

              {/* Row 7: Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Supplier</label>
                  <input
                    type="text"
                    list="supplier-suggestions"
                    placeholder="Enter supplier name (optional)"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                  />
                  <datalist id="supplier-suggestions">
                    {suppliers.map((s, idx) => (
                      <option key={idx} value={s} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-slate-400 mt-1">Default supplier for this product</p>
                </div>
                <div className="hidden sm:block"></div>
              </div>

              {/* Row 7: Description */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">Description</label>
                <textarea
                  rows="3"
                  placeholder="Enter product description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-sm"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/20"
                >
                  {editProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
