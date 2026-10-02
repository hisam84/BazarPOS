import { getDb, getStores, getStoreData, getNeonSql, initPostgresTables, updateSuperAdminPassword, updateCompany, saveStoreData } from './db';
import { verifyPassword, hashPassword } from './password';

export async function authenticateUser(username, password) {
  const sql = getNeonSql();
  const today = new Date().toISOString().slice(0, 10);

  // 1. Check Super Admin via PostgreSQL or In-Memory
  if (sql) {
    try {
      await initPostgresTables();
      const admins = await sql`SELECT * FROM bazarpos_superadmin WHERE username = ${username} LIMIT 1`;
      if (admins.length > 0) {
        const admin = admins[0];
        const { valid, needsRehash } = await verifyPassword(password, admin.password);
        if (valid) {
          if (needsRehash) {
            const hashed = await hashPassword(password);
            await sql`UPDATE bazarpos_superadmin SET password = ${hashed} WHERE username = ${username}`;
          }
          return {
            success: true,
            role: 'superadmin',
            user: {
              username: admin.username,
              fullName: admin.full_name || 'System Super Admin',
              role: 'superadmin'
            }
          };
        }
      }
    } catch (e) {
      console.warn('Neon SuperAdmin check error:', e.message);
    }
  }

  const db = getDb();
  if (username === db.superAdmin?.username) {
    const { valid, needsRehash } = await verifyPassword(password, db.superAdmin.password);
    if (valid) {
      if (needsRehash) {
        await updateSuperAdminPassword(password);
      }
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
  }

  // 2. Check Store Owners (Full Store Admin)
  const stores = await getStores();
  for (const storeId in stores) {
    const store = stores[storeId];
    if (store.username === username) {
      const { valid, needsRehash } = await verifyPassword(password, store.password);
      if (valid) {
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

        // Auto-rehash stored password to bcrypt if it was plain text
        if (needsRehash) {
          const hashed = await hashPassword(password);
          await updateCompany(store.id, { password: hashed });
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
  }

  // 3. Check Store Staff (Manager / Cashier)
  for (const storeId in stores) {
    const parentStore = stores[storeId];
    if (!parentStore) continue;

    const storeData = await getStoreData(storeId);
    const staffList = storeData.staff || [];
    for (let i = 0; i < staffList.length; i++) {
      const staffMember = staffList[i];
      if (staffMember.username === username) {
        const { valid, needsRehash } = await verifyPassword(password, staffMember.password);
        if (valid) {
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

          // Auto-rehash staff password
          if (needsRehash) {
            staffMember.password = await hashPassword(password);
            await saveStoreData(storeId, storeData);
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
    }
  }

  return { success: false, message: 'Invalid username or password' };
}
