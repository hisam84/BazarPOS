import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { DEFAULT_ROLES, SYSTEM_PERMISSIONS, getStoreRoles } from '@/lib/permissions';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    const roles = await getStoreRoles(storeId);

    return NextResponse.json({
      success: true,
      roles,
      permissions: SYSTEM_PERMISSIONS
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', role } = body;

    const auth = verifyApiAuth(request, { requiredStoreId: storeId, allowedRoles: ['owner', 'superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    if (!role || !role.id || !role.name) {
      return NextResponse.json({ success: false, message: 'Role ID and Name are required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    let roles = storeData.roles && storeData.roles.length > 0 ? storeData.roles : [...DEFAULT_ROLES];

    const existingIndex = roles.findIndex(r => r.id === role.id);
    if (existingIndex !== -1) {
      // Update existing role
      roles[existingIndex] = {
        ...roles[existingIndex],
        name: role.name,
        description: role.description || roles[existingIndex].description,
        permissions: Array.isArray(role.permissions) ? role.permissions : roles[existingIndex].permissions,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new custom role
      const newRole = {
        id: role.id.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        name: role.name.trim(),
        description: role.description || 'Custom defined role',
        isSystem: false,
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
        createdAt: new Date().toISOString()
      };
      roles.push(newRole);
    }

    storeData.roles = roles;
    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      message: `Role "${role.name}" saved successfully!`,
      roles
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('id');
    const storeId = searchParams.get('storeId') || 'default';

    const auth = verifyApiAuth(request, { requiredStoreId: storeId, allowedRoles: ['owner', 'superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    if (!roleId) {
      return NextResponse.json({ success: false, message: 'Role ID is required' }, { status: 400 });
    }

    if (['owner', 'manager', 'cashier'].includes(roleId)) {
      return NextResponse.json({ success: false, message: 'System built-in roles cannot be deleted' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    let roles = storeData.roles && storeData.roles.length > 0 ? storeData.roles : [...DEFAULT_ROLES];

    roles = roles.filter(r => r.id !== roleId);
    storeData.roles = roles;
    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
      roles
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
