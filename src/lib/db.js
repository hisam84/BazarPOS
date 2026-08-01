import fs from 'fs';
import path from 'path';

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
          costPrice: 780,
          sellingPrice: 850,
          quantity: 12,
          minQuantity: 3,
          barcode: 'GROC0010002'
        }
      ],
      categories: ['Grocery', 'Electronics', 'Clothing', 'Stationery'],
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
      voucherCounter: 1001
    }
  }
};

let inMemoryDb = null;

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
    // Read-only serverless filesystem
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
      clients: [],
      salers: [],
      suppliers: [],
      purchases: [],
      staff: [],
      vouchers: [],
      externalIncomeExpense: { income: [], expense: [] },
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

export function getStores() {
  const db = ensureDb();
  return db.stores;
}

export function createStore({ name, owner, phone, address, username, password }) {
  const db = ensureDb();
  const storeId = 'store_' + Date.now();
  const newStore = {
    id: storeId,
    name,
    owner,
    phone,
    address,
    username,
    password,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  db.stores[storeId] = newStore;
  db.storeData[storeId] = {
    company: { name, phone, address, email: '', website: '', logoUrl: '' },
    products: [],
    categories: ['General'],
    clients: [{ id: 'c1', name: 'Walk-in Customer', phone: phone || '', address: address || '', due: 0 }],
    salers: [{ id: 's1', name: 'Main Saler', phone: phone || '', role: 'Sales Representative' }],
    suppliers: [],
    purchases: [],
    staff: [],
    vouchers: [],
    externalIncomeExpense: { income: [], expense: [] },
    voucherCounter: 1001
  };
  saveDb(db);
  return newStore;
}

export function updateStoreStatus(storeId, status) {
  const db = ensureDb();
  if (db.stores[storeId]) {
    db.stores[storeId].status = status;
    saveDb(db);
  }
  return db.stores[storeId];
}
