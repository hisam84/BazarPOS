import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({ success: true, clients: storeData.clients || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', name, phone, email, address, due = 0 } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Client name required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    const newClient = {
      id: 'c_' + Date.now(),
      name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      due: Number(due) || 0
    };

    storeData.clients = storeData.clients || [];
    storeData.clients.push(newClient);
    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, client: newClient });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', id, payAmount, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Client ID required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    const index = (storeData.clients || []).findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    }

    const current = storeData.clients[index];
    let newDue = current.due;

    if (payAmount !== undefined) {
      newDue = Math.max(0, newDue - Number(payAmount));
    } else if (updates.due !== undefined) {
      newDue = Number(updates.due);
    }

    storeData.clients[index] = {
      ...current,
      ...updates,
      due: newDue
    };

    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, client: storeData.clients[index] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
