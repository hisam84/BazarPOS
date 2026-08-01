import { getDb, getStores, getStoreData } from './db';

export function authenticateUser(username, password) {
  const db = getDb();

  // 1. Check Super Admin
  if (username === db.superAdmin.username && password === db.superAdmin.password) {
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
  const stores = getStores();
  for (const storeId in stores) {
    const store = stores[storeId];
    if (store.username === username && store.password === password) {
      if (store.status !== 'active') {
        return { success: false, message: 'This store account is suspended. Contact Super Admin.' };
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
    const storeData = getStoreData(storeId);
    const staffMember = (storeData.staff || []).find(
      s => s.username === username && s.password === password
    );
    if (staffMember) {
      return {
        success: true,
        role: staffMember.role || 'cashier',
        storeId: storeId,
        user: {
          username: staffMember.username,
          fullName: staffMember.name,
          storeId: storeId,
          storeName: stores[storeId]?.name || 'Outlet',
          role: staffMember.role || 'cashier'
        }
      };
    }
  }

  return { success: false, message: 'Invalid username or password' };
}
