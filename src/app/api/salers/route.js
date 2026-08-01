import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({ success: true, salers: storeData.salers || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', name, phone, role } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Saler name required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    const newSaler = {
      id: 's_' + Date.now(),
      name,
      phone: phone || '',
      role: role || 'Sales Representative'
    };

    storeData.salers = storeData.salers || [];
    storeData.salers.push(newSaler);
    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, saler: newSaler });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
