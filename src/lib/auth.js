import { getDb, getStores, getStoreData, getNeonSql, initPostgresTables } from './db';

export async function authenticateUser(username, password) {
  const sql = getNeonSql();
  const today = new Date().toISOString().slice(0, 10);

  // 1. Check Super Admin via PostgreSQL or In-Memory
  if (sql) {
    try {
      await initPostgresTables();
      const admins = await sql`SELECT * FROM bazarpos_superadmin WHERE username = ${username} AND password = ${password} LIMIT 1`;
      if (admins.length > 0) {
        return {
          success: true,
          role: 'superadmin',
          user: {
            username: admins[0].username,
            fullName: admins[0].full_name || 'System Super Admin',
            role: 'superadmin'
          }
        };
      }
    } catch (e) {
      console.warn('Neon SuperAdmin check error:', e.message);
    }
  }

  const db = getDb();
  if (username === db.superAdmin?.username && password === db.superAdmin?.password) {
    return {
      success: true,
      role: 'superadmin',
      user: {
        username: db.superAdmin.username,
        fullName: db.superAdmin.fullName,
        role: 'superadmin'
      }
    };
  }

  // 2. Check Store Owners (Full Store Admin)
  const stores = await getStores();
  for (const storeId in stores) {
    const store = stores[storeId];
    if (store.username === username && store.password === password) {
      if (store.status === 'suspended') {
        return { success: false, message: 'This company account has been suspended. Please contact Super Admin.' };
      }
      
      const expiry = store.subscription?.expiryDate;
      const isExpired = store.subscription?.status === 'expired' || (expiry && expiry < today);
      if (isExpired) {
        return { 
          success: false, 
          message: `Your company subscription validity expired on ${expiry || 'date'}. Please contact Super Admin to renew.` 
        };
      }

      return {
        success: true,
        role: 'owner',
        storeId: store.id,
        user: {
          username: store.username,
          fullName: store.name,
          storeId: store.id,
          storeName: store.name,
          role: 'owner'
        }
      };
    }
  }

  // 3. Check Store Staff (Manager / Cashier)
  for (const storeId in stores) {
    const parentStore = stores[storeId];
    if (!parentStore) continue;

    const storeData = await getStoreData(storeId);
    const staffMember = (storeData.staff || []).find(
      s => s.username === username && s.password === password
    );
    if (staffMember) {
      if (parentStore.status === 'suspended') {
        return { success: false, message: 'This company account has been suspended. Please contact Super Admin.' };
      }

      const expiry = parentStore.subscription?.expiryDate;
      const isExpired = parentStore.subscription?.status === 'expired' || (expiry && expiry < today);
      if (isExpired) {
        return { 
          success: false, 
          message: `Store subscription validity expired on ${expiry || 'date'}. Please contact Super Admin to renew.` 
        };
      }

      return {
        success: true,
        role: staffMember.role || 'cashier',
        storeId: storeId,
        user: {
          username: staffMember.username,
          fullName: staffMember.name,
          storeId: storeId,
          storeName: parentStore.name || 'Outlet',
          role: staffMember.role || 'cashier'
        }
      };
    }
  }

  return { success: false, message: 'Invalid username or password' };
}
