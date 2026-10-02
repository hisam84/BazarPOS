import { NextResponse } from 'next/server';
import { getStores, updateCompany, getStoreData, saveStoreData } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    const stores = await getStores();
    const store = stores[storeId] || stores['default'] || {};

    const rawSub = store.subscription || {};
    const startDate = rawSub.startDate || (store.createdAt ? String(store.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10));
    const expiryDate = rawSub.expiryDate || new Date(new Date(startDate).getTime() + 365 * 86400000).toISOString().slice(0, 10);
    const planName = rawSub.planName || 'Enterprise POS Edition (1 Year)';
    const status = rawSub.status || 'active';

    const now = Date.now();
    const expTime = new Date(expiryDate).getTime();
    const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      owner: {
        id: store.id || storeId,
        storeName: store.name || '',
        owner: store.owner || '',
        phone: store.phone || '',
        email: store.email || '',
        address: store.address || '',
        username: store.username || '',
        status: store.status || 'active',
        subscription: {
          planId: rawSub.planId || '1year',
          planName,
          status,
          startDate,
          expiryDate,
          daysRemaining: diffDays > 0 ? diffDays : 0,
          isExpired: diffDays <= 0,
          durationDays: rawSub.durationDays || 365,
          notes: rawSub.notes || ''
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', owner, phone, email, address, username, password } = body;

    const auth = verifyApiAuth(request, { requiredStoreId: storeId, allowedRoles: ['owner', 'superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    if (!storeId) {
      return NextResponse.json({ success: false, message: 'Store ID required' }, { status: 400 });
    }

    const updates = {};
    if (owner !== undefined) updates.owner = owner.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (email !== undefined) updates.email = email.trim();
    if (address !== undefined) updates.address = address.trim();
    if (username !== undefined && username.trim()) updates.username = username.trim();
    if (password !== undefined && password.trim()) updates.password = password.trim();

    const updated = await updateCompany(storeId, updates);

    // Also sync company contact info in storeData
    const storeData = await getStoreData(storeId);
    if (storeData.company) {
      if (phone) storeData.company.phone = phone.trim();
      if (email) storeData.company.email = email.trim();
      if (address) storeData.company.address = address.trim();
      await saveStoreData(storeId, storeData);
    }

    return NextResponse.json({
      success: true,
      message: 'Owner information updated successfully',
      owner: updated
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
