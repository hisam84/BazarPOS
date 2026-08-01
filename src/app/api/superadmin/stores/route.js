import { NextResponse } from 'next/server';
import { getStores, createStore, updateStoreStatus } from '@/lib/db';

export async function GET() {
  try {
    const stores = getStores();
    return NextResponse.json({ success: true, stores: Object.values(stores) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, owner, phone, address, username, password } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ success: false, message: 'Store Name, Username, and Password are required' }, { status: 400 });
    }

    const newStore = createStore({ name, owner, phone, address, username, password });
    return NextResponse.json({ success: true, store: newStore });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { storeId, status } = await request.json();
    if (!storeId || !status) {
      return NextResponse.json({ success: false, message: 'Store ID and status required' }, { status: 400 });
    }

    const updated = updateStoreStatus(storeId, status);
    return NextResponse.json({ success: true, store: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
