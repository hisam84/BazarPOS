import { getStoreData } from './db';
import { SYSTEM_PERMISSIONS, DEFAULT_ROLES } from './permissions-data';

export { SYSTEM_PERMISSIONS, DEFAULT_ROLES };

/**
 * Retrieve roles configured for a specific store, merging with defaults
 */
export async function getStoreRoles(storeId = 'default') {
  try {
    const storeData = await getStoreData(storeId);
    const customRoles = storeData.roles || [];
    
    // Merge or use defaults
    if (!customRoles || customRoles.length === 0) {
      return DEFAULT_ROLES;
    }

    // Ensure system roles always exist
    const mergedRoles = [...DEFAULT_ROLES];
    customRoles.forEach(cRole => {
      const idx = mergedRoles.findIndex(r => r.id === cRole.id);
      if (idx !== -1) {
        mergedRoles[idx] = { ...mergedRoles[idx], ...cRole };
      } else {
        mergedRoles.push(cRole);
      }
    });

    return mergedRoles;
  } catch (e) {
    console.warn('Could not load store roles:', e.message);
    return DEFAULT_ROLES;
  }
}

/**
 * Compute the effective permissions for a user
 * - If user is Owner / Superadmin -> All permissions
 * - If user has customPermissions set -> Custom permissions take precedence
 * - Otherwise -> Inherits permissions from assigned Role
 */
export function getEffectivePermissions(user, storeRoles = DEFAULT_ROLES) {
  if (!user) return [];
  if (user.role === 'owner' || user.role === 'superadmin') {
    return ['*'];
  }

  // Individual user overrides
  if (Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
    return user.customPermissions;
  }

  // Role-based permissions
  const roleObj = storeRoles.find(r => r.id === user.role);
  if (roleObj && Array.isArray(roleObj.permissions)) {
    return roleObj.permissions;
  }

  // Fallback for cashier / manager
  const defaultRole = DEFAULT_ROLES.find(r => r.id === user.role);
  return defaultRole ? defaultRole.permissions : ['pos_terminal', 'view_invoices'];
}

/**
 * Check if a user has a specific permission
 */
export function userHasPermission(userPermissions = [], requiredPermission) {
  if (!userPermissions) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}
