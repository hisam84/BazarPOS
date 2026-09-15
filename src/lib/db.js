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
      phone: '',
      address: '',
      username: 'admin',
      password: 'superadmin@123',
      status: 'active',
      createdAt: new Date().toISOString(),
      subscription: {
        planId: '1year',
        planName: '1 Year Full Access',
        durationDays: 365,
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        notes: 'Initial license'
      }
    }
  },
  storeData: {
    'default': {
      company: {
        name: 'BazarPOS Outlet',
        tagline: 'Point of Sale System',
        phone: '',
        email: '',
        website: '',
        address: '',
        logoUrl: ''
      },
      products: [],
      categories: ['General'],
      brands: ['General'],
      units: ['Pcs'],
      clients: [
        { id: 'c1', name: 'Walk-in Customer', phone: '', address: 'Counter', due: 0 }
      ],
      salers: [
        { id: 's1', name: 'Main Counter', phone: '', role: 'Sales' }
      ],
      suppliers: [],
      purchases: [],
      staff: [],
      vouchers: [],
      externalIncomeExpense: {
        income: [],
        expense: []
      },
      stockAdjustments: [],
      cashRegisters: [],
      branches: [
        { id: 'b1', name: 'Main Outlet', code: 'MAIN', address: '', phone: '', isPrimary: true }
      ],
      stockTransfers: [],
      auditLogs: [],
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

let dbInitPromise = null;

export async function initPostgresTables() {
  const sql = getNeonSql();
  if (!sql) return false;

  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      // Create tables
      await sql`
        CREATE TABLE IF NOT EXISTS bazarpos_superadmin (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) DEFAULT 'System Super Admin',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS bazarpos_stores (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          owner VARCHAR(255),
          phone VARCHAR(50),
          email VARCHAR(255),
          address TEXT,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subscription JSONB
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS bazarpos_store_data (
          store_id VARCHAR(100) PRIMARY KEY,
          company JSONB,
          products JSONB,
          categories JSONB,
          brands JSONB,
          units JSONB,
          clients JSONB,
          salers JSONB,
          suppliers JSONB,
          purchases JSONB,
          staff JSONB,
          vouchers JSONB,
          external_income_expense JSONB,
          stock_adjustments JSONB,
          cash_registers JSONB,
          branches JSONB,
          stock_transfers JSONB,
          audit_logs JSONB,
          voucher_counter INTEGER DEFAULT 1001,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Check and seed superadmin
      const admins = await sql`SELECT * FROM bazarpos_superadmin WHERE username = 'superadmin' LIMIT 1`;
      if (admins.length === 0) {
        await sql`
          INSERT INTO bazarpos_superadmin (username, password, full_name)
          VALUES ('superadmin', 'superadmin@123', 'System Super Admin')
        `;
      }

      // Check and seed default store
      const stores = await sql`SELECT * FROM bazarpos_stores WHERE id = 'default' LIMIT 1`;
      if (stores.length === 0) {
        const localDb = ensureDb();
        const def = localDb.stores['default'] || INITIAL_DATA.stores['default'];
        await sql`
          INSERT INTO bazarpos_stores (id, name, owner, phone, address, username, password, status, subscription)
          VALUES (
            'default', 
            ${def.name}, 
            ${def.owner || ''}, 
            ${def.phone || ''}, 
            ${def.address || ''}, 
            ${def.username}, 
            ${def.password}, 
            'active',
            ${JSON.stringify(def.subscription || { planId: '1year', planName: '1 Year Full Access', durationDays: 365, status: 'active', startDate: new Date().toISOString().slice(0, 10), expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10), notes: 'Default initial license' })}
          )
        `;
      }

      // Check and seed default store data
      const sData = await sql`SELECT * FROM bazarpos_store_data WHERE store_id = 'default' LIMIT 1`;
      if (sData.length === 0) {
        const localDb = ensureDb();
        const sd = localDb.storeData['default'] || INITIAL_DATA.storeData['default'];
        await sql`
          INSERT INTO bazarpos_store_data (
            store_id, company, products, categories, brands, units, clients, salers, suppliers, purchases, staff, vouchers, external_income_expense, stock_adjustments, cash_registers, branches, stock_transfers, audit_logs, voucher_counter
          ) VALUES (
            'default',
            ${JSON.stringify(sd.company || {})},
            ${JSON.stringify(sd.products || [])},
            ${JSON.stringify(sd.categories || ['General'])},
            ${JSON.stringify(sd.brands || ['General'])},
            ${JSON.stringify(sd.units || ['Pcs'])},
            ${JSON.stringify(sd.clients || [])},
            ${JSON.stringify(sd.salers || [])},
            ${JSON.stringify(sd.suppliers || [])},
            ${JSON.stringify(sd.purchases || [])},
            ${JSON.stringify(sd.staff || [])},
            ${JSON.stringify(sd.vouchers || [])},
            ${JSON.stringify(sd.externalIncomeExpense || { income: [], expense: [] })},
            ${JSON.stringify(sd.stockAdjustments || [])},
            ${JSON.stringify(sd.cashRegisters || [])},
            ${JSON.stringify(sd.branches || [{ id: 'b1', name: 'Main Outlet', code: 'MAIN', address: '', phone: '', isPrimary: true }])},
            ${JSON.stringify(sd.stockTransfers || [])},
            ${JSON.stringify(sd.auditLogs || [])},
            ${sd.voucherCounter || 1001}
          )
        `;
      }

      return true;
    } catch (err) {
      console.warn('Error initializing PostgreSQL tables:', err.message);
      return false;
    }
  })();

  return dbInitPromise;
}

// Trigger initial setup if DATABASE_URL exists
if (process.env.DATABASE_URL) {
  initPostgresTables().catch(() => {});
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

  // Sync to PostgreSQL if DATABASE_URL active
  const sql = getNeonSql();
  if (sql) {
    (async () => {
      try {
        await sql`
          INSERT INTO bazarpos_store_data (
            store_id, company, products, categories, brands, units, clients, salers, suppliers, purchases, staff, vouchers, external_income_expense, stock_adjustments, cash_registers, branches, stock_transfers, audit_logs, voucher_counter, updated_at
          ) VALUES (
            ${storeId},
            ${JSON.stringify(storeData.company || {})},
            ${JSON.stringify(storeData.products || [])},
            ${JSON.stringify(storeData.categories || [])},
            ${JSON.stringify(storeData.brands || [])},
            ${JSON.stringify(storeData.units || [])},
            ${JSON.stringify(storeData.clients || [])},
            ${JSON.stringify(storeData.salers || [])},
            ${JSON.stringify(storeData.suppliers || [])},
            ${JSON.stringify(storeData.purchases || [])},
            ${JSON.stringify(storeData.staff || [])},
            ${JSON.stringify(storeData.vouchers || [])},
            ${JSON.stringify(storeData.externalIncomeExpense || { income: [], expense: [] })},
            ${JSON.stringify(storeData.stockAdjustments || [])},
            ${JSON.stringify(storeData.cashRegisters || [])},
            ${JSON.stringify(storeData.branches || [])},
            ${JSON.stringify(storeData.stockTransfers || [])},
            ${JSON.stringify(storeData.auditLogs || [])},
            ${storeData.voucherCounter || 1001},
            NOW()
          )
          ON CONFLICT (store_id) DO UPDATE SET
            company = EXCLUDED.company,
            products = EXCLUDED.products,
            categories = EXCLUDED.categories,
            brands = EXCLUDED.brands,
            units = EXCLUDED.units,
            clients = EXCLUDED.clients,
            salers = EXCLUDED.salers,
            suppliers = EXCLUDED.suppliers,
            purchases = EXCLUDED.purchases,
            staff = EXCLUDED.staff,
            vouchers = EXCLUDED.vouchers,
            external_income_expense = EXCLUDED.external_income_expense,
            stock_adjustments = EXCLUDED.stock_adjustments,
            cash_registers = EXCLUDED.cash_registers,
            branches = EXCLUDED.branches,
            stock_transfers = EXCLUDED.stock_transfers,
            audit_logs = EXCLUDED.audit_logs,
            voucher_counter = EXCLUDED.voucher_counter,
            updated_at = NOW();
        `;
      } catch (e) {
        console.warn('Postgres store_data sync error:', e.message);
      }
    })();
  }

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
    durationDays: 14,
    badgeColor: 'blue',
    maxBranches: 1,
    maxStaff: 2,
    maxProducts: 100,
    features: ['14 Days Free Access', 'Single Branch Terminal', 'Basic Inventory Catalog', 'Standard Sales Invoicing']
  },
  {
    id: '1month',
    name: '1 Month Access',
    durationDays: 30,
    badgeColor: 'emerald',
    maxBranches: 1,
    maxStaff: 5,
    maxProducts: 5000,
    features: ['30 Days Validity', '1 POS Branch Terminal', 'Up to 5 Staff Accounts', 'Stock Adjustment & Loss Tracking', 'Cash Register Reconciliation']
  },
  {
    id: '3months',
    name: '3 Months Pass',
    durationDays: 90,
    badgeColor: 'purple',
    maxBranches: 2,
    maxStaff: 10,
    maxProducts: 15000,
    features: ['90 Days Validity (3 Months)', 'Up to 2 Outlets / Branches', 'Inter-Branch Stock Transfers', 'Full RBAC Roles Matrix', 'System Audit Trail Logs']
  },
  {
    id: '6months',
    name: '6 Months Pass',
    durationDays: 180,
    badgeColor: 'indigo',
    maxBranches: 3,
    maxStaff: 20,
    maxProducts: 50000,
    features: ['180 Days Validity (6 Months)', 'Up to 3 Outlets / Branches', 'Full Financial & Income Reports', 'Priority System Backup']
  },
  {
    id: '1year',
    name: '1 Year Full Access',
    durationDays: 365,
    badgeColor: 'amber',
    maxBranches: 10,
    maxStaff: 50,
    maxProducts: 100000,
    features: ['365 Days Validity (1 Year)', 'Up to 10 Outlets', 'Unlimited Staff & Products', 'Dedicated 24/7 Technical Support']
  },
  {
    id: 'lifetime',
    name: 'Lifetime / Custom',
    durationDays: 3650,
    badgeColor: 'teal',
    maxBranches: 50,
    maxStaff: 100,
    maxProducts: 500000,
    features: ['10 Years / Lifetime Access', 'Unlimited Outlets & Staff', 'Custom Domain & Enterprise Privileges']
  }
];

export function getStores() {
  const db = ensureDb();
  // Ensure subscription duration data exists for each store
  Object.values(db.stores).forEach(st => {
    if (!st.subscription) {
      st.subscription = {
        planId: '1year',
        planName: '1 Year Full Access',
        durationDays: 365,
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        notes: 'Initial activation'
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
  planId = '1month',
  customDurationDays = null,
  notes = ''
}) {
  const db = ensureDb();
  const companyId = 'comp_' + Date.now();

  const plan = DEFAULT_SUBSCRIPTION_PLANS.find(p => p.id === planId) || DEFAULT_SUBSCRIPTION_PLANS[1];
  const days = customDurationDays && !isNaN(customDurationDays) ? Number(customDurationDays) : plan.durationDays;

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
      durationDays: days,
      status: 'active',
      startDate: startDate,
      expiryDate: expiryDate,
      notes: notes || `Created with ${plan.name} (${days} days)`
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
        details: `Company "${name}" created with validity for ${days} days`
      }
    ],
    voucherCounter: 1001
  };

  saveDb(db);

  // Sync store creation to PostgreSQL
  const sql = getNeonSql();
  if (sql) {
    (async () => {
      try {
        await sql`
          INSERT INTO bazarpos_stores (id, name, owner, phone, email, address, username, password, status, subscription)
          VALUES (
            ${companyId},
            ${newCompany.name},
            ${newCompany.owner || ''},
            ${newCompany.phone || ''},
            ${newCompany.email || ''},
            ${newCompany.address || ''},
            ${newCompany.username},
            ${newCompany.password},
            ${newCompany.status},
            ${JSON.stringify(newCompany.subscription)}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            owner = EXCLUDED.owner,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            address = EXCLUDED.address,
            username = EXCLUDED.username,
            password = EXCLUDED.password,
            status = EXCLUDED.status,
            subscription = EXCLUDED.subscription;
        `;
      } catch (e) {
        console.warn('Postgres create company sync error:', e.message);
      }
    })();
  }

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

  const sql = getNeonSql();
  if (sql) {
    (async () => {
      try {
        const store = db.stores[companyId];
        await sql`
          UPDATE bazarpos_stores SET
            name = ${store.name},
            owner = ${store.owner || ''},
            phone = ${store.phone || ''},
            email = ${store.email || ''},
            address = ${store.address || ''},
            username = ${store.username},
            password = ${store.password},
            status = ${store.status},
            subscription = ${JSON.stringify(store.subscription || {})}
          WHERE id = ${companyId};
        `;
      } catch (e) {
        console.warn('Postgres update company sync error:', e.message);
      }
    })();
  }

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

    const sql = getNeonSql();
    if (sql) {
      (async () => {
        try {
          await sql`DELETE FROM bazarpos_stores WHERE id = ${companyId};`;
          await sql`DELETE FROM bazarpos_store_data WHERE store_id = ${companyId};`;
        } catch (e) {
          console.warn('Postgres delete company sync error:', e.message);
        }
      })();
    }

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

  const sql = getNeonSql();
  if (sql) {
    (async () => {
      try {
        const store = db.stores[companyId];
        await sql`
          UPDATE bazarpos_stores SET
            status = ${store.status},
            subscription = ${JSON.stringify(store.subscription || {})}
          WHERE id = ${companyId};
        `;
      } catch (e) {
        console.warn('Postgres update subscription sync error:', e.message);
      }
    })();
  }

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

  let activeSubs = 0;
  let expiringSoon = 0;
  let expiredSubs = 0;

  companies.forEach(c => {
    const sub = c.subscription;
    if (sub) {
      if (sub.status === 'active') {
        activeSubs++;
      } else if (sub.status === 'expired') {
        expiredSubs++;
      }

      if (sub.expiryDate) {
        const exp = new Date(sub.expiryDate);
        if (exp < now) {
          // expired
        } else if (exp <= sevenDaysFromNow) {
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
    expiringSoon
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


