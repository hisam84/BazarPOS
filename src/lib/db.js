import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from './password';

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
      inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DATA));
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
    } else {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      inMemoryDb = JSON.parse(content);
    }
  } catch (err) {
    if (!inMemoryDb) {
      inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DATA));
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

function parseJsonField(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

export async function getStoreData(storeId = 'default') {
  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
      const rows = await sql`SELECT * FROM bazarpos_store_data WHERE store_id = ${storeId} LIMIT 1`;
      if (rows && rows.length > 0) {
        const row = rows[0];
        return {
          company: parseJsonField(row.company, { name: 'Store Outlet', phone: '', address: '' }),
          products: parseJsonField(row.products, []),
          categories: parseJsonField(row.categories, ['General']),
          brands: parseJsonField(row.brands, ['General']),
          units: parseJsonField(row.units, ['Pcs']),
          clients: parseJsonField(row.clients, []),
          salers: parseJsonField(row.salers, []),
          suppliers: parseJsonField(row.suppliers, []),
          purchases: parseJsonField(row.purchases, []),
          staff: parseJsonField(row.staff, []),
          vouchers: parseJsonField(row.vouchers, []),
          externalIncomeExpense: parseJsonField(row.external_income_expense, { income: [], expense: [] }),
          stockAdjustments: parseJsonField(row.stock_adjustments, []),
          cashRegisters: parseJsonField(row.cash_registers, []),
          branches: parseJsonField(row.branches, [{ id: 'b1', name: 'Main Outlet', code: 'MAIN', address: '', phone: '', isPrimary: true }]),
          stockTransfers: parseJsonField(row.stock_transfers, []),
          auditLogs: parseJsonField(row.audit_logs, []),
          voucherCounter: row.voucher_counter || 1001
        };
      } else {
        const defaultData = {
          company: { name: 'Store Outlet', phone: '', address: '' },
          products: [],
          categories: ['General'],
          brands: ['General'],
          units: ['Pcs'],
          clients: [{ id: 'c1', name: 'Walk-in Customer', phone: '', address: '', due: 0 }],
          salers: [{ id: 's1', name: 'Main Saler', phone: '', role: 'Sales Representative' }],
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
        await sql`
          INSERT INTO bazarpos_store_data (
            store_id, company, products, categories, brands, units, clients, salers, suppliers, purchases, staff, vouchers, external_income_expense, stock_adjustments, cash_registers, branches, stock_transfers, audit_logs, voucher_counter
          ) VALUES (
            ${storeId},
            ${JSON.stringify(defaultData.company)},
            ${JSON.stringify(defaultData.products)},
            ${JSON.stringify(defaultData.categories)},
            ${JSON.stringify(defaultData.brands)},
            ${JSON.stringify(defaultData.units)},
            ${JSON.stringify(defaultData.clients)},
            ${JSON.stringify(defaultData.salers)},
            ${JSON.stringify(defaultData.suppliers)},
            ${JSON.stringify(defaultData.purchases)},
            ${JSON.stringify(defaultData.staff)},
            ${JSON.stringify(defaultData.vouchers)},
            ${JSON.stringify(defaultData.externalIncomeExpense)},
            ${JSON.stringify(defaultData.stockAdjustments)},
            ${JSON.stringify(defaultData.cashRegisters)},
            ${JSON.stringify(defaultData.branches)},
            ${JSON.stringify(defaultData.stockTransfers)},
            ${JSON.stringify(defaultData.auditLogs)},
            ${defaultData.voucherCounter}
          ) ON CONFLICT (store_id) DO NOTHING
        `;
        return defaultData;
      }
    } catch (err) {
      console.warn('Neon getStoreData error, falling back to local:', err.message);
    }
  }

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

export async function saveStoreData(storeId, storeData) {
  const db = ensureDb();
  db.storeData[storeId] = storeData;
  saveDb(db);

  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
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
  }

  return storeData;
}

export async function logAuditAction(storeId = 'default', username = 'system', action, details) {
  const storeData = await getStoreData(storeId);
  storeData.auditLogs = storeData.auditLogs || [];
  storeData.auditLogs.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    username,
    action,
    details
  });
  await saveStoreData(storeId, storeData);
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

export async function getStores() {
  const sql = getNeonSql();
  const today = new Date().toISOString().slice(0, 10);

  if (sql) {
    try {
      await initPostgresTables();
      const rows = await sql`SELECT * FROM bazarpos_stores ORDER BY created_at ASC`;
      const stores = {};
      rows.forEach(r => {
        let sub = parseJsonField(r.subscription, null);
        if (!sub) {
          sub = {
            planId: '1year',
            planName: '1 Year Full Access',
            durationDays: 365,
            status: 'active',
            startDate: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : today,
            expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
            notes: 'Initial activation'
          };
        }

        // Real-time validity resolution
        if (r.status !== 'suspended') {
          if (sub.expiryDate && sub.expiryDate < today) {
            sub.status = 'expired';
          } else if (sub.status === 'expired' && sub.expiryDate && sub.expiryDate >= today) {
            sub.status = 'active';
          }
        }

        stores[r.id] = {
          id: r.id,
          name: r.name,
          owner: r.owner || '',
          phone: r.phone || '',
          email: r.email || '',
          address: r.address || '',
          username: r.username,
          password: r.password,
          status: r.status || 'active',
          createdAt: r.created_at,
          subscription: sub
        };
      });
      return stores;
    } catch (err) {
      console.warn('Neon getStores error, falling back to local:', err.message);
    }
  }

  const db = ensureDb();
  Object.values(db.stores).forEach(st => {
    if (!st.subscription) {
      st.subscription = {
        planId: '1year',
        planName: '1 Year Full Access',
        durationDays: 365,
        status: 'active',
        startDate: st.createdAt ? st.createdAt.slice(0, 10) : today,
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        notes: 'Initial activation'
      };
    }

    if (st.status !== 'suspended') {
      if (st.subscription.expiryDate && st.subscription.expiryDate < today) {
        st.subscription.status = 'expired';
      } else if (st.subscription.status === 'expired' && st.subscription.expiryDate && st.subscription.expiryDate >= today) {
        st.subscription.status = 'active';
      }
    }
  });
  return db.stores;
}

export async function getCompanies() {
  const stores = await getStores();
  return Object.values(stores);
}

export async function createCompany({
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
  const companyId = 'comp_' + Date.now();
  const plan = DEFAULT_SUBSCRIPTION_PLANS.find(p => p.id === planId) || DEFAULT_SUBSCRIPTION_PLANS[1];
  const days = customDurationDays && !isNaN(customDurationDays) ? Number(customDurationDays) : plan.durationDays;

  const startDate = new Date().toISOString().slice(0, 10);
  const expiryDate = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  const hashedPassword = await hashPassword(password);

  const newCompany = {
    id: companyId,
    name,
    owner,
    phone,
    email,
    address,
    username,
    password: hashedPassword,
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

  const initialStoreData = {
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

  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
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
      `;

      await sql`
        INSERT INTO bazarpos_store_data (
          store_id, company, products, categories, brands, units, clients, salers, suppliers, purchases, staff, vouchers, external_income_expense, stock_adjustments, cash_registers, branches, stock_transfers, audit_logs, voucher_counter
        ) VALUES (
          ${companyId},
          ${JSON.stringify(initialStoreData.company)},
          ${JSON.stringify(initialStoreData.products)},
          ${JSON.stringify(initialStoreData.categories)},
          ${JSON.stringify(initialStoreData.brands)},
          ${JSON.stringify(initialStoreData.units)},
          ${JSON.stringify(initialStoreData.clients)},
          ${JSON.stringify(initialStoreData.salers)},
          ${JSON.stringify(initialStoreData.suppliers)},
          ${JSON.stringify(initialStoreData.purchases)},
          ${JSON.stringify(initialStoreData.staff)},
          ${JSON.stringify(initialStoreData.vouchers)},
          ${JSON.stringify(initialStoreData.externalIncomeExpense)},
          ${JSON.stringify(initialStoreData.stockAdjustments)},
          ${JSON.stringify(initialStoreData.cashRegisters)},
          ${JSON.stringify(initialStoreData.branches)},
          ${JSON.stringify(initialStoreData.stockTransfers)},
          ${JSON.stringify(initialStoreData.auditLogs)},
          ${initialStoreData.voucherCounter}
        )
      `;
    } catch (err) {
      console.error('Postgres create company error:', err.message);
    }
  }

  const db = ensureDb();
  db.stores[companyId] = newCompany;
  db.storeData[companyId] = initialStoreData;
  saveDb(db);

  return newCompany;
}

export async function updateCompany(companyId, updates) {
  let safeUpdates = { ...updates };
  if (safeUpdates.password && safeUpdates.password.trim() !== '') {
    safeUpdates.password = await hashPassword(safeUpdates.password);
  }

  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
      const existing = await sql`SELECT * FROM bazarpos_stores WHERE id = ${companyId} LIMIT 1`;
      if (existing.length > 0) {
        const row = existing[0];
        const updatedName = safeUpdates.name !== undefined ? safeUpdates.name : row.name;
        const updatedOwner = safeUpdates.owner !== undefined ? safeUpdates.owner : row.owner;
        const updatedPhone = safeUpdates.phone !== undefined ? safeUpdates.phone : row.phone;
        const updatedEmail = safeUpdates.email !== undefined ? safeUpdates.email : row.email;
        const updatedAddress = safeUpdates.address !== undefined ? safeUpdates.address : row.address;
        const updatedUsername = safeUpdates.username !== undefined ? safeUpdates.username : row.username;
        const updatedPassword = safeUpdates.password !== undefined && safeUpdates.password.trim() !== '' ? safeUpdates.password : row.password;
        const updatedStatus = safeUpdates.status !== undefined ? safeUpdates.status : row.status;

        await sql`
          UPDATE bazarpos_stores SET
            name = ${updatedName},
            owner = ${updatedOwner || ''},
            phone = ${updatedPhone || ''},
            email = ${updatedEmail || ''},
            address = ${updatedAddress || ''},
            username = ${updatedUsername},
            password = ${updatedPassword},
            status = ${updatedStatus}
          WHERE id = ${companyId}
        `;
      }
    } catch (e) {
      console.warn('Postgres update company error:', e.message);
    }
  }

  const db = ensureDb();
  if (db.stores[companyId]) {
    db.stores[companyId] = {
      ...db.stores[companyId],
      ...safeUpdates,
      id: companyId
    };
    saveDb(db);
  }

  const stores = await getStores();
  return stores[companyId] || null;
}

export async function deleteCompany(companyId) {
  if (companyId === 'default') {
    throw new Error('Default main store cannot be deleted');
  }

  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
      await sql`DELETE FROM bazarpos_stores WHERE id = ${companyId}`;
      await sql`DELETE FROM bazarpos_store_data WHERE store_id = ${companyId}`;
    } catch (e) {
      console.warn('Postgres delete company error:', e.message);
    }
  }

  const db = ensureDb();
  if (db.stores[companyId]) {
    delete db.stores[companyId];
    if (db.storeData[companyId]) {
      delete db.storeData[companyId];
    }
    saveDb(db);
    return true;
  }
  return true;
}

export async function updateCompanySubscription(companyId, subscriptionUpdates) {
  const stores = await getStores();
  const target = stores[companyId];
  if (!target) return null;

  const currentSub = target.subscription || {};
  const today = new Date().toISOString().slice(0, 10);

  const updatedSub = {
    ...currentSub,
    ...subscriptionUpdates
  };

  if (updatedSub.expiryDate) {
    if (updatedSub.expiryDate >= today && updatedSub.status === 'expired') {
      updatedSub.status = 'active';
    } else if (updatedSub.expiryDate < today) {
      updatedSub.status = 'expired';
    }
  }

  let nextStoreStatus = target.status;
  if (subscriptionUpdates.status === 'suspended') {
    nextStoreStatus = 'suspended';
  } else if (subscriptionUpdates.status === 'active' && target.status === 'suspended') {
    nextStoreStatus = 'active';
  }

  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
      await sql`
        UPDATE bazarpos_stores SET
          status = ${nextStoreStatus},
          subscription = ${JSON.stringify(updatedSub)}
        WHERE id = ${companyId}
      `;
    } catch (e) {
      console.warn('Postgres update subscription error:', e.message);
    }
  }

  const db = ensureDb();
  if (db.stores[companyId]) {
    db.stores[companyId].subscription = updatedSub;
    db.stores[companyId].status = nextStoreStatus;
    saveDb(db);
  }

  return updatedSub;
}

export function getSubscriptionPlans() {
  return DEFAULT_SUBSCRIPTION_PLANS;
}

export async function getSaaSStats() {
  const companies = await getCompanies();
  const today = new Date().toISOString().slice(0, 10);
  const total = companies.length;
  const active = companies.filter(c => c.status === 'active' && c.subscription?.status !== 'expired').length;
  const suspended = companies.filter(c => c.status === 'suspended').length;

  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  let activeSubs = 0;
  let expiringSoon = 0;
  let expiredSubs = 0;

  companies.forEach(c => {
    const sub = c.subscription;
    if (sub) {
      const isExpired = sub.status === 'expired' || (sub.expiryDate && sub.expiryDate < today);
      if (isExpired) {
        expiredSubs++;
      } else if (c.status === 'active') {
        activeSubs++;
      }

      if (sub.expiryDate && !isExpired && sub.expiryDate <= sevenDaysFromNow) {
        expiringSoon++;
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

export async function getSuperAdmin() {
  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
      const rows = await sql`SELECT username, full_name FROM bazarpos_superadmin WHERE username = 'superadmin' LIMIT 1`;
      if (rows.length > 0) {
        return {
          username: rows[0].username,
          fullName: rows[0].full_name || 'System Super Admin'
        };
      }
    } catch (e) {
      console.warn('Postgres getSuperAdmin error:', e.message);
    }
  }

  const db = ensureDb();
  return {
    username: db.superAdmin.username,
    fullName: db.superAdmin.fullName
  };
}

export async function updateSuperAdminPassword(newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  const sql = getNeonSql();
  if (sql) {
    try {
      await initPostgresTables();
      await sql`UPDATE bazarpos_superadmin SET password = ${hashedPassword} WHERE username = 'superadmin'`;
    } catch (e) {
      console.warn('Postgres updateSuperAdminPassword error:', e.message);
    }
  }

  const db = ensureDb();
  db.superAdmin.password = hashedPassword;
  saveDb(db);
  return true;
}

export async function createStore(args) {
  return createCompany(args);
}

export async function updateStoreStatus(storeId, status) {
  return updateCompany(storeId, { status });
}
