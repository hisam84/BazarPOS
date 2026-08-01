import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({ success: true, staff: storeData.staff || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', name, username, password, role = 'cashier' } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ success: false, message: 'Name, username, and password required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    const newStaff = {
      id: 'st_' + Date.now(),
      name,
      username,
      password,
      role
    };

    storeData.staff = storeData.staff || [];
    storeData.staff.push(newStaff);
    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
