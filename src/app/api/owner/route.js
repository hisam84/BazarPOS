import { NextResponse } from 'next/server';
import { getStores, updateCompany, getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const stores = await getStores();
    const store = stores[storeId] || stores['default'] || {};

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
        subscription: store.subscription || {}
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
