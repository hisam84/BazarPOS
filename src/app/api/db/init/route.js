import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getDb } from '@/lib/db';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({
      success: false,
      connected: false,
      message: 'DATABASE_URL is not defined in environment variables (.env / Vercel Environment Variables).'
    });
  }

  try {
    const sql = neon(dbUrl);
    // Test basic query
    const timeResult = await sql`SELECT NOW() as current_time, current_database() as db_name, version() as version`;
    
    // Check existing tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    return NextResponse.json({
      success: true,
      connected: true,
      database: timeResult[0]?.db_name || 'PostgreSQL',
      serverTime: timeResult[0]?.current_time,
      tables: tables.map(t => t.table_name),
      tableCount: tables.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({
      success: false,
      message: 'DATABASE_URL is missing. Please add DATABASE_URL in your .env or Vercel settings.'
    }, { status: 400 });
  }

  try {
    const sql = neon(dbUrl);

    // 1. Create SuperAdmin Table
    await sql`
      CREATE TABLE IF NOT EXISTS bazarpos_superadmin (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) DEFAULT 'System Super Admin',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Create Stores / Companies Table
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

    // 3. Create Store Data Table (Vouchers, Products, Staff, Inventory, Cash Registers, Audit Logs)
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

    // Seed SuperAdmin if not exists
    const existingAdmin = await sql`SELECT * FROM bazarpos_superadmin WHERE username = 'superadmin' LIMIT 1`;
    if (existingAdmin.length === 0) {
      await sql`
        INSERT INTO bazarpos_superadmin (username, password, full_name)
        VALUES ('superadmin', 'superadmin@123', 'System Super Admin')
      `;
    }

    // Seed default store and store_data if not exists
    const localDb = getDb();
    const existingDefaultStore = await sql`SELECT * FROM bazarpos_stores WHERE id = 'default' LIMIT 1`;
    if (existingDefaultStore.length === 0 && localDb.stores['default']) {
      const defStore = localDb.stores['default'];
      await sql`
        INSERT INTO bazarpos_stores (id, name, owner, phone, address, username, password, status, subscription)
        VALUES (
          ${defStore.id}, 
          ${defStore.name}, 
          ${defStore.owner || ''}, 
          ${defStore.phone || ''}, 
          ${defStore.address || ''}, 
          ${defStore.username}, 
          ${defStore.password}, 
          ${defStore.status || 'active'},
          ${JSON.stringify(defStore.subscription || { planId: '1year', planName: '1 Year Full Access', durationDays: 365, status: 'active', startDate: new Date().toISOString().slice(0, 10), expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10), notes: 'Default initial license' })}
        )
      `;
    }

    const existingStoreData = await sql`SELECT * FROM bazarpos_store_data WHERE store_id = 'default' LIMIT 1`;
    if (existingStoreData.length === 0 && localDb.storeData['default']) {
      const sd = localDb.storeData['default'];
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

    // List all created tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL Database schema initialized successfully with all tables and initial seed data!',
      tables: tables.map(t => t.table_name)
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Database schema initialization failed: ' + error.message
    }, { status: 500 });
  }
}
