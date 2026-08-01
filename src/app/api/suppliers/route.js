import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({ success: true, suppliers: storeData.suppliers || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', name, phone, email, address, payable = 0 } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Supplier name required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    const newSupplier = {
      id: 'sup_' + Date.now(),
      name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      payable: Number(payable) || 0
    };

    storeData.suppliers = storeData.suppliers || [];
    storeData.suppliers.push(newSupplier);
    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, supplier: newSupplier });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
