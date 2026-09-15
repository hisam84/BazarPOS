import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const INITIAL_DATA = {
  superAdmin: {
    username: 'superadmin',
    password: 'superadmin@123',
    fullName: 'System Super Admin',
  },
  stores: {
    'default': {
      id: 'default',
      name: 'Main BazarPOS Store',
      owner: 'Admin',
      phone: '01700000000',
      address: 'Dhaka, Bangladesh',
      username: 'admin',
      password: 'superadmin@123',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  },
  storeData: {
    'default': {
      company: {
        name: 'BazarPOS Outlet',
        tagline: 'Modern POS & Voucher System',
        phone: '01700000000',
        email: 'info@bazarpos.com',
        website: 'https://bazarpos.com',
        address: 'Dhaka, Bangladesh',
        logoUrl: ''
      },
      products: [
        {
          id: 'p1',
          code: 'P001',
          name: 'Basmati Rice 5kg',
          category: 'Grocery',
          brand: 'Pran',
          unit: 'Pcs',
          costPrice: 480,
          sellingPrice: 550,
          quantity: 25,
          minQuantity: 5,
          barcode: 'GROC0010001'
        },
        {
          id: 'p2',
          code: 'P002',
          name: 'Soyabean Oil 5L',
          category: 'Grocery',
          brand: 'Rupchanda',
          unit: 'Liter',
          costPrice: 780,
          sellingPrice: 850,
          quantity: 12,
          minQuantity: 3,
          barcode: 'GROC0010002'
        }
      ],
      categories: ['Grocery', 'Electronics', 'Clothing', 'Stationery'],
      brands: ['Pran', 'Rupchanda', 'Square', 'ACI', 'Unilever'],
      units: ['Pcs', 'KG', 'Liter', 'Box', 'Dozen'],
      clients: [
        { id: 'c1', name: 'Standard Customer', phone: '01700000000', address: 'Cash Sale', due: 0 }
      ],
      salers: [
        { id: 's1', name: 'Main Counter', phone: '01700000000', role: 'Sales Representative' }
      ],
      suppliers: [
        { id: 'sup1', name: 'Arafat Wholesale Traders', phone: '01800000000', email: 'arafat@traders.com', address: 'Dhaka', payable: 0 }
      ],
      purchases: [],
      staff: [
        { id: 'st1', name: 'Counter Cashier', username: 'cashier1', password: '123', role: 'cashier' }
      ],
      vouchers: [],
      externalIncomeExpense: {
        income: [],
        expense: []
      },
      stockAdjustments: [],
      cashRegisters: [
        {
          id: 'cr1',
          date: new Date().toISOString().slice(0, 10),
          openedAt: new Date().toISOString(),
          closedAt: null,
          openingCash: 5000,
          closingCashExpected: 5000,
          closingCashActual: null,
          status: 'open'
        }
      ],
      branches: [
        { id: 'b1', name: 'Main Outlet (Uttara)', code: 'MAIN', address: 'Dhaka', phone: '01700000000', isPrimary: true }
      ],
      stockTransfers: [],
      auditLogs: [
        {
          id: 'log1',
          timestamp: new Date().toISOString(),
          username: 'admin',
          action: 'SYSTEM_INIT',
          details: 'Initialized Enterprise POS System'
        }
      ],
      voucherCounter: 1001
    }
  }
};

let inMemoryDb = null;

export function getNeonSql() {
  if (process.env.DATABASE_URL) {
    try {
      return neon(process.env.DATABASE_URL);
    } catch (e) {
      console.warn('Neon DB connection error:', e.message);
    }
  }
  return null;
}

function ensureDb() {
  if (inMemoryDb) return inMemoryDb;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
      inMemoryDb = INITIAL_DATA;
    } else {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      inMemoryDb = JSON.parse(content);
    }
  } catch (err) {
    if (!inMemoryDb) {
      inMemoryDb = INITIAL_DATA;
    }
  }
  return inMemoryDb;
}

function saveDb(data) {
  inMemoryDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Serverless filesystem
  }
}

export function getDb() {
  return ensureDb();
}

export function getStoreData(storeId = 'default') {
  const db = ensureDb();
  if (!db.storeData[storeId]) {
    db.storeData[storeId] = {
      company: { name: 'New Store', phone: '', address: '' },
      products: [],
      categories: ['General'],
      brands: ['General'],
      units: ['Pcs'],
      clients: [],
      salers: [],
      suppliers: [],
      purchases: [],
      staff: [],
      vouchers: [],
      externalIncomeExpense: { income: [], expense: [] },
      stockAdjustments: [],
      cashRegisters: [],
      branches: [{ id: 'b1', name: 'Main Outlet', code: 'MAIN', address: '', phone: '', isPrimary: true }],
      stockTransfers: [],
      auditLogs: [],
      voucherCounter: 1001
    };
    saveDb(db);
  }
  return db.storeData[storeId];
}

export function saveStoreData(storeId, storeData) {
  const db = ensureDb();
  db.storeData[storeId] = storeData;
  saveDb(db);
  return db.storeData[storeId];
}

export function logAuditAction(storeId = 'default', username = 'system', action, details) {
  const storeData = getStoreData(storeId);
  storeData.auditLogs = storeData.auditLogs || [];
  storeData.auditLogs.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    username,
    action,
    details
  });
  saveStoreData(storeId, storeData);
}

export const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    durationDays: 14,
    billingCycle: 'monthly',
    maxBranches: 1,
    maxStaff: 2,
    maxProducts: 100,
    badgeColor: 'blue',
    features: ['Single Branch Terminal', 'Basic Inventory Catalog', 'Standard Sales Invoicing', '14 Days Free Access']
  },
  {
    id: 'starter',
    name: 'Starter Business',
    price: 999,
    durationDays: 30,
    billingCycle: 'monthly',
    maxBranches: 1,
    maxStaff: 3,
    maxProducts: 1000,
    badgeColor: 'emerald',
    features: ['1 Branch POS Terminal', 'Up to 3 Staff Members', 'Stock Adjustment & Loss Tracking', 'Cash Register Reconciliation', 'Voucher & Due Management']
  },
  {
    id: 'standard',
    name: 'Standard Pro',
    price: 1999,
    durationDays: 30,
    billingCycle: 'monthly',
    maxBranches: 3,
    maxStaff: 10,
    maxProducts: 10000,
    badgeColor: 'purple',
    features: ['Up to 3 Outlets / Branches', 'Inter-Branch Stock Transfer', 'Full RBAC Roles Matrix', 'Financial & Income Reports', 'System Audit Trail Logs']
  },
  {
    id: 'enterprise',
    name: 'Enterprise VIP',
    price: 3999,
    durationDays: 30,
    billingCycle: 'monthly',
    maxBranches: 10,
    maxStaff: 50,
    maxProducts: 100000,
    badgeColor: 'amber',
    features: ['Up to 10 Outlets', 'Unlimited Staff & Products', 'Dedicated 24/7 SLA Support', 'Custom Domain & Branding', 'Data Backup & Priority Sync']
  }
];

export function getStores() {
  const db = ensureDb();
  // Ensure subscription data exists for each store
  Object.values(db.stores).forEach(st => {
    if (!st.subscription) {
      st.subscription = {
        planId: 'standard',
        planName: 'Standard Pro',
        price: 1999,
        billingCycle: 'monthly',
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        paymentStatus: 'paid',
        lastPaidAt: new Date().toISOString().slice(0, 10),
        notes: 'Default Subscription'
      };
    }
  });
  return db.stores;
}

export function getCompanies() {
  const stores = getStores();
  return Object.values(stores);
}

export function createCompany({
  name,
  owner = '',
  phone = '',
  email = '',
  address = '',
  username,
  password,
  planId = 'starter',
  billingCycle = 'monthly',
  customPrice = null,
  durationDays = 30
}) {
  const db = ensureDb();
  const companyId = 'comp_' + Date.now();

  const plan = DEFAULT_SUBSCRIPTION_PLANS.find(p => p.id === planId) || DEFAULT_SUBSCRIPTION_PLANS[1];
  const price = customPrice !== null && !isNaN(customPrice) ? Number(customPrice) : plan.price;
  const days = plan.id === 'trial' ? 14 : (billingCycle === 'yearly' ? 365 : 30);

  const startDate = new Date().toISOString().slice(0, 10);
  const expiryDate = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  const newCompany = {
    id: companyId,
    name,
    owner,
    phone,
    email,
    address,
    username,
    password,
    status: 'active',
    createdAt: new Date().toISOString(),
    subscription: {
      planId: plan.id,
      planName: plan.name,
      price: price,
      billingCycle: billingCycle,
      status: 'active',
      startDate: startDate,
      expiryDate: expiryDate,
      paymentStatus: plan.id === 'trial' ? 'paid' : 'paid',
      lastPaidAt: startDate,
      notes: 'Initial activation'
    }
  };

  db.stores[companyId] = newCompany;
  db.storeData[companyId] = {
    company: { name, phone, address, email, website: '', logoUrl: '' },
    products: [],
    categories: ['General'],
    brands: ['General'],
    units: ['Pcs'],
    clients: [{ id: 'c1', name: 'Walk-in Customer', phone: phone || '', address: address || '', due: 0 }],
    salers: [{ id: 's1', name: 'Main Saler', phone: phone || '', role: 'Sales Representative' }],
    suppliers: [],
    purchases: [],
    staff: [],
    vouchers: [],
    externalIncomeExpense: { income: [], expense: [] },
    stockAdjustments: [],
    cashRegisters: [],
    branches: [{ id: 'b1', name: name + ' Outlet', code: 'MAIN', address: address || '', phone: phone || '', isPrimary: true }],
    stockTransfers: [],
    auditLogs: [
      {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        username: 'superadmin',
        action: 'COMPANY_CREATED',
        details: `Company "${name}" created with ${plan.name}`
      }
    ],
    voucherCounter: 1001
  };

  saveDb(db);
  return newCompany;
}

export function updateCompany(companyId, updates) {
  const db = ensureDb();
  if (!db.stores[companyId]) return null;

  db.stores[companyId] = {
    ...db.stores[companyId],
    ...updates,
    id: companyId // ensure id immutable
  };

  if (updates.name && db.storeData[companyId]?.company) {
    db.storeData[companyId].company.name = updates.name;
  }
  if (updates.phone && db.storeData[companyId]?.company) {
    db.storeData[companyId].company.phone = updates.phone;
  }
  if (updates.address && db.storeData[companyId]?.company) {
    db.storeData[companyId].company.address = updates.address;
  }

  saveDb(db);
  return db.stores[companyId];
}

export function deleteCompany(companyId) {
  const db = ensureDb();
  if (companyId === 'default') {
    throw new Error('Default main store cannot be deleted');
  }
  if (db.stores[companyId]) {
    delete db.stores[companyId];
    if (db.storeData[companyId]) {
      delete db.storeData[companyId];
    }
    saveDb(db);
    return true;
  }
  return false;
}

export function updateCompanySubscription(companyId, subscriptionUpdates) {
  const db = ensureDb();
  if (!db.stores[companyId]) return null;

  const currentSub = db.stores[companyId].subscription || {};
  db.stores[companyId].subscription = {
    ...currentSub,
    ...subscriptionUpdates
  };

  // If status is suspended or active, sync company status too
  if (subscriptionUpdates.status === 'suspended') {
    db.stores[companyId].status = 'suspended';
  } else if (subscriptionUpdates.status === 'active' && db.stores[companyId].status === 'suspended') {
    db.stores[companyId].status = 'active';
  }

  saveDb(db);
  return db.stores[companyId].subscription;
}

export function getSubscriptionPlans() {
  return DEFAULT_SUBSCRIPTION_PLANS;
}

export function getSaaSStats() {
  const db = ensureDb();
  const companies = Object.values(db.stores);
  const total = companies.length;
  const active = companies.filter(c => c.status === 'active').length;
  const suspended = companies.filter(c => c.status === 'suspended').length;

  const now = new Date();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);

  let mrr = 0;
  let activeSubs = 0;
  let expiringSoon = 0;
  let expiredSubs = 0;

  companies.forEach(c => {
    const sub = c.subscription;
    if (sub) {
      if (sub.status === 'active') {
        activeSubs++;
        mrr += Number(sub.price) || 0;
      } else if (sub.status === 'expired') {
        expiredSubs++;
      }

      if (sub.expiryDate) {
        const exp = new Date(sub.expiryDate);
        if (exp > now && exp <= sevenDaysFromNow) {
          expiringSoon++;
        }
      }
    }
  });

  return {
    totalCompanies: total,
    activeCompanies: active,
    suspendedCompanies: suspended,
    activeSubscriptions: activeSubs,
    expiredSubscriptions: expiredSubs,
    expiringSoon,
    mrr
  };
}

export function getSuperAdmin() {
  const db = ensureDb();
  return {
    username: db.superAdmin.username,
    fullName: db.superAdmin.fullName
  };
}

export function updateSuperAdminPassword(newPassword) {
  const db = ensureDb();
  db.superAdmin.password = newPassword;
  saveDb(db);
  return true;
}

export function createStore(args) {
  return createCompany(args);
}

export function updateStoreStatus(storeId, status) {
  return updateCompany(storeId, { status });
}


