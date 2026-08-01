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
  X
} from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Grocery',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    minQuantity: 5,
    barcode: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadInventory(u.storeId || 'default');
    }
  }, []);

  const loadInventory = async (storeId) => {
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setCategories(['All', ...(data.categories || [])]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditProduct(null);
    setForm({
      code: 'P' + (products.length + 1).toString().padStart(3, '0'),
      name: '',
      category: categories[1] || 'General',
      costPrice: '',
      sellingPrice: '',
      quantity: '10',
      minQuantity: 5,
      barcode: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditProduct(prod);
    setForm({
      code: prod.code,
      name: prod.name,
      category: prod.category || 'General',
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      quantity: prod.quantity,
      minQuantity: prod.minQuantity || 5,
      barcode: prod.barcode || ''
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
        alert(data.message || 'Save failed');
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
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
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
          <p className="text-xs text-slate-500 mt-1">Manage store products, cost prices, selling prices, and stock counts.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20"
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
            placeholder="Search by Product Name, Code, or Barcode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
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
          <div className="text-center py-12 text-slate-400 text-sm">No products found. Add products to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Cost Price</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3">Stock Qty</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{p.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded font-medium">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">৳{p.costPrice}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">৳{p.sellingPrice}</td>
                    <td className="px-4 py-3 font-bold">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs ${
                        p.quantity <= (p.minQuantity || 5)
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.quantity <= (p.minQuantity || 5) && <AlertTriangle size={12} />}
                        <span>{p.quantity} Units</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.barcode || 'Auto'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-lg">
                {editProduct ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Product Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Grocery, Beverage"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full Product Name"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Cost Price (৳)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="Buy Price"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    placeholder="Sale Price"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Current Stock Qty *</label>
                  <input
                    type="number"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Low Stock Alert Limit</label>
                  <input
                    type="number"
                    value={form.minQuantity}
                    onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Barcode String (Optional)</label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                />
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
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
