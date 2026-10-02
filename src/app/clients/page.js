'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Users, Plus, DollarSign, Search, Phone, MapPin, X, Tag, Edit, 
  CheckCircle, Mail, UploadCloud, Download, Building2, UserCheck, 
  FileSpreadsheet, AlertCircle, Trash2, ArrowUpDown
} from 'lucide-react';

function ClientsContent() {
  const searchParams = useSearchParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'customer' | 'supplier'
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState({ 
    customerId: '', 
    name: '', 
    phone: '', 
    email: '', 
    address: '', 
    type: 'customer',
    due: 0 
  });

  // Pay Due Modal
  const [payModalClient, setPayModalClient] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  // Bulk Upload Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [parsedBulkData, setParsedBulkData] = useState([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadClients(u.storeId || 'default');
    } else {
      setLoading(false);
    }
  }, []);

  // Handle URL Query Params
  useEffect(() => {
    const action = searchParams.get('action');
    const typeParam = searchParams.get('type');

    if (typeParam === 'supplier') {
      setActiveTab('supplier');
    }

    if (action === 'new') {
      handleOpenAddModal(typeParam === 'supplier' ? 'supplier' : 'customer');
    } else if (action === 'import') {
      setShowBulkModal(true);
    }
  }, [searchParams, clients.length]);

  const loadClients = async (storeId) => {
    try {
      const res = await fetch(`/api/clients?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) setClients(data.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNextCustomerId = (type = 'customer') => {
    const prefix = type === 'supplier' ? 'SUPP' : 'CUST';
    const numbers = clients
      .map(c => {
        const match = (c.customerId || '').match(new RegExp(`${prefix}-(\\d+)`, 'i'));
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(n => n !== null && !isNaN(n));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : (1001 + clients.length);
    return `${prefix}-${nextNum}`;
  };

  const handleOpenAddModal = (presetType = null) => {
    const defaultType = presetType || (activeTab === 'supplier' ? 'supplier' : 'customer');
    setEditingClient(null);
    setForm({
      customerId: getNextCustomerId(defaultType),
      name: '',
      phone: '',
      email: '',
      address: '',
      type: defaultType,
      due: 0
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setForm({
      customerId: client.customerId || '',
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      type: client.type || 'customer',
      due: client.due || 0
    });
    setShowModal(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};

      if (editingClient) {
        const res = await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: u.storeId || 'default',
            id: editingClient.id,
            customerId: form.customerId,
            name: form.name,
            phone: form.phone,
            email: form.email,
            address: form.address,
            type: form.type,
            due: Number(form.due)
          })
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          loadClients(u.storeId || 'default');
        }
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: u.storeId || 'default', ...form })
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          loadClients(u.storeId || 'default');
        }
      }
    } catch (err) {
      alert('Error saving contact');
    }
  };

  const handlePayDue = async (e) => {
    e.preventDefault();
    if (!payModalClient || !payAmount || Number(payAmount) <= 0) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          id: payModalClient.id,
          payAmount: Number(payAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setPayModalClient(null);
        setPayAmount('');
        loadClients(u.storeId || 'default');
      }
    } catch (err) {
      alert('Payment save error');
    }
  };

  // Bulk CSV Parsing Logic
  const parseCsvText = (text) => {
    setBulkError('');
    if (!text.trim()) {
      setParsedBulkData([]);
      return;
    }

    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') || firstLine.includes('phone') || firstLine.includes('due');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed = [];
    dataLines.forEach((line, idx) => {
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length > 0 && cols[0]) {
        parsed.push({
          id: idx,
          name: cols[0] || '',
          phone: cols[1] || '',
          email: cols[2] || '',
          address: cols[3] || '',
          type: (cols[4] && cols[4].toLowerCase().includes('supp')) ? 'supplier' : 'customer',
          due: Number(cols[5]) || 0
        });
      }
    });

    setParsedBulkData(parsed);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setBulkCsvText(content);
      parseCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (parsedBulkData.length === 0) {
      setBulkError('Please paste or upload valid CSV rows first.');
      return;
    }
    setBulkImporting(true);
    setBulkError('');
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          bulkClients: parsedBulkData
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Successfully imported ${parsedBulkData.length} contacts!`);
        setShowBulkModal(false);
        setBulkCsvText('');
        setParsedBulkData([]);
        loadClients(u.storeId || 'default');
      } else {
        setBulkError(data.message || 'Import failed');
      }
    } catch (err) {
      setBulkError(err.message || 'Server error during import');
    } finally {
      setBulkImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Phone,Email,Address,Type,Due\n" +
      "Haji Karim Traders,01711000001,karim@trade.com,12 Kawran Bazar Dhaka,customer,2500\n" +
      "Apex Hardware Supply,01822000002,apex@supplies.com,Plot 4 Motijheel Dhaka,supplier,0\n" +
      "Nabil Ahmed,01933000003,nabil@gmail.com,Dhanmondi 27 Dhaka,customer,0\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bazarpos_contacts_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllContactsCsv = () => {
    if (clients.length === 0) {
      alert('No contacts to export.');
      return;
    }
    let csv = "Customer ID,Name,Type,Phone,Email,Address,Due Balance\n";
    clients.forEach(c => {
      csv += `"${c.customerId || ''}","${c.name || ''}","${c.type || 'customer'}","${c.phone || ''}","${c.email || ''}","${(c.address || '').replace(/"/g, '""')}",${c.due || 0}\n`;
    });
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredClients = clients.filter(c => {
    const matchesTab = activeTab === 'all' 
      ? true 
      : activeTab === 'supplier' 
        ? c.type === 'supplier' 
        : (c.type === 'customer' || !c.type);

    const q = search.toLowerCase();
    const matchesSearch = (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.customerId && c.customerId.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
    return matchesTab && matchesSearch;
  });

  const totalCustomers = clients.filter(c => c.type !== 'supplier').length;
  const totalSuppliers = clients.filter(c => c.type === 'supplier').length;
  const totalDueAmount = clients.reduce((acc, c) => acc + (Number(c.due) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="text-blue-600" size={22} />
            <span>Contact Directory & Vendors</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Manage your customer database, suppliers, credit due balances, and imports.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5">
          <button
            onClick={downloadSampleCsv}
            title="Download CSV Template"
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition text-center"
          >
            <Download size={14} />
            <span>Template</span>
          </button>

          <button
            onClick={exportAllContactsCsv}
            title="Export CSV"
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition text-center"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition border border-indigo-200 text-center"
          >
            <UploadCloud size={15} />
            <span>Bulk Upload</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs text-center"
          >
            <Plus size={16} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2.5 sm:space-x-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Customers</span>
            <p className="text-base sm:text-xl font-bold font-mono text-slate-800 truncate">{totalCustomers}</p>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2.5 sm:space-x-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Suppliers</span>
            <p className="text-base sm:text-xl font-bold font-mono text-slate-800 truncate">{totalSuppliers}</p>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2.5 sm:space-x-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <DollarSign size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Due</span>
            <p className="text-base sm:text-xl font-bold font-mono text-rose-600 truncate">৳{totalDueAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full">{clients.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'customer' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Customers</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded-full">{totalCustomers}</span>
          </button>
          <button
            onClick={() => setActiveTab('supplier')}
            className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'supplier' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Suppliers</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] rounded-full">{totalSuppliers}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 sm:top-3 text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, name, phone, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Clients Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading Contacts...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">No contacts found matching your filters.</div>
        ) : (
          <>
            {/* Mobile View: Clean App Cards (Zero Horizontal Scroll) */}
            <div className="block md:hidden space-y-2.5">
              {filteredClients.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.type === 'supplier'
                            ? 'text-purple-700 bg-purple-100 border border-purple-200'
                            : 'text-indigo-700 bg-indigo-100 border border-indigo-200'
                        }`}>
                          {c.customerId || (c.type === 'supplier' ? 'SUPP-1001' : 'CUST-1001')}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          c.type === 'supplier'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {c.type === 'supplier' ? 'Supplier' : 'Customer'}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 mt-1.5 truncate">
                        {c.name}
                      </h4>

                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="text-[11px] text-blue-600 font-mono flex items-center space-x-1 mt-0.5"
                        >
                          <Phone size={11} />
                          <span>{c.phone}</span>
                        </a>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {c.due > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold font-mono text-xs block">
                          Due: ৳{Number(c.due).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold block">
                          No Due
                        </span>
                      )}
                    </div>
                  </div>

                  {c.address && (
                    <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin size={11} className="shrink-0 text-slate-400" />
                      <span className="truncate">{c.address}</span>
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                      {c.email || 'No email provided'}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {c.due > 0 && (
                        <button
                          onClick={() => { setPayModalClient(c); setPayAmount(c.due); }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition shadow-xs"
                        >
                          Collect Due
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Edit Contact"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(c.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                        title="Delete Contact"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">ID / Code</th>
                    <th className="px-4 py-3.5">Contact Name</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Phone Number</th>
                    <th className="px-4 py-3.5">Address</th>
                    <th className="px-4 py-3.5">Current Due</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md inline-flex items-center space-x-1 ${
                          c.type === 'supplier'
                            ? 'text-purple-700 bg-purple-50 border border-purple-200/80'
                            : 'text-indigo-700 bg-indigo-50 border border-indigo-200/80'
                        }`}>
                          <Tag size={12} className={c.type === 'supplier' ? 'text-purple-500' : 'text-indigo-500'} />
                          <span>{c.customerId || (c.type === 'supplier' ? 'SUPP-1001' : 'CUST-1001')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block">{c.name}</span>
                        {c.email && (
                          <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Mail size={10} />
                            <span>{c.email}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.type === 'supplier' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                            Supplier
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            Customer
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">
                        {c.phone ? (
                          <span className="flex items-center space-x-1">
                            <Phone size={12} className="text-slate-400" />
                            <span>{c.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {c.address ? (
                          <span className="flex items-center space-x-1">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-xs">
                        {c.due > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                            ৳{Number(c.due).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[11px]">
                            ৳0 (Clear)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {c.due > 0 && (
                            <button
                              onClick={() => { setPayModalClient(c); setPayAmount(c.due); }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition shadow-xs"
                            >
                              Collect Due
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Contact"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Contact"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* BULK UPLOAD CONTACTS MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                  <UploadCloud size={20} className="text-indigo-600" />
                  <span>Bulk Upload Contacts & Suppliers</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload a CSV file or paste raw CSV lines below.</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs transition">
                  <UploadCloud size={15} className="text-indigo-600" />
                  <span>Choose CSV File</span>
                  <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="inline-flex items-center space-x-1.5 text-blue-600 hover:underline font-bold text-xs"
                >
                  <Download size={14} />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Raw CSV Text Input */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  Or Paste CSV Data (Format: <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">Name,Phone,Email,Address,Type,Due</code>)
                </label>
                <textarea
                  rows={4}
                  value={bulkCsvText}
                  onChange={(e) => {
                    setBulkCsvText(e.target.value);
                    parseCsvText(e.target.value);
                  }}
                  placeholder={`Rahim Traders,01700000001,rahim@traders.com,Dhaka,customer,0\nAbul Supply Corp,01800000002,abul@supply.com,Chittagong,supplier,1500`}
                  className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Parsed Preview Table */}
              {parsedBulkData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700">Preview Parsed Contacts ({parsedBulkData.length} rows ready)</span>
                    <button
                      type="button"
                      onClick={() => { setBulkCsvText(''); setParsedBulkData([]); }}
                      className="text-rose-500 hover:underline text-[11px]"
                    >
                      Clear Rows
                    </button>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Address</th>
                          <th className="p-2">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedBulkData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{row.name}</td>
                            <td className="p-2 font-mono text-slate-600">{row.phone || '-'}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.type === 'supplier' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500 max-w-[120px] truncate">{row.address || '-'}</td>
                            <td className="p-2 font-mono font-bold text-rose-600">৳{row.due}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={parsedBulkData.length === 0 || bulkImporting}
                  onClick={handleBulkSubmit}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-indigo-500/20 text-xs"
                >
                  {bulkImporting ? 'Importing...' : `Import ${parsedBulkData.length} Contacts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CLIENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                {form.type === 'supplier' ? (
                  <Building2 size={20} className="text-purple-600" />
                ) : (
                  <Users size={20} className="text-blue-600" />
                )}
                <span>{editingClient ? 'Edit Contact' : (form.type === 'supplier' ? 'Add Supplier / Vendor' : 'Add New Customer')}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              {/* Contact Type Toggle */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Contact Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: 'customer', customerId: editingClient ? form.customerId : getNextCustomerId('customer') });
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      form.type === 'customer' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck size={14} />
                    <span>Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: 'supplier', customerId: editingClient ? form.customerId : getNextCustomerId('supplier') });
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      form.type === 'supplier' 
                        ? 'bg-purple-50 border-purple-500 text-purple-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 size={14} />
                    <span>Supplier / Vendor</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold flex items-center justify-between">
                  <span>Unique ID / Code *</span>
                  <span className="text-[10px] text-blue-600 font-normal">Auto-Generated</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.customerId}
                  onChange={e => setForm({ ...form, customerId: e.target.value })}
                  placeholder="e.g. CUST-1001 or SUPP-1001"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:border-blue-500 text-xs shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Chowdhury or ABC Supplier"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Phone Number</label>
                  <input
                    type="text"
                    placeholder="01700000000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Email Address</label>
                  <input
                    type="email"
                    placeholder="contact@mail.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. House 42, Road 11, Banani, Dhaka"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Opening Due Balance (৳)</label>
                <input
                  type="number"
                  value={form.due}
                  onChange={e => setForm({ ...form, due: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-rose-600 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs"
                >
                  {editingClient ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT DUE MODAL */}
      {payModalClient && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Collect Due Payment</h3>
              <button onClick={() => setPayModalClient(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="text-slate-600 flex justify-between">
                <span>Contact ID:</span>
                <span className="font-mono font-bold text-indigo-700">{payModalClient.customerId || 'CUST-1001'}</span>
              </p>
              <p className="text-slate-600 flex justify-between">
                <span>Name:</span>
                <span className="font-bold text-slate-900">{payModalClient.name}</span>
              </p>
              <p className="text-rose-600 font-bold flex justify-between pt-1 border-t border-slate-200">
                <span>Pending Due:</span>
                <span className="font-mono">৳{Number(payModalClient.due).toLocaleString()}</span>
              </p>
            </div>

            <form onSubmit={handlePayDue} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Received Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-sm text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
              >
                Submit Payment Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm font-medium">Loading Contacts...</div>}>
      <ClientsContent />
    </Suspense>
  );
}
