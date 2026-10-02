import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = await getStoreData(storeId);

    // Auto-migrate legacy clients to ensure all have customerId
    let changed = false;
    const clients = (storeData.clients || []).map((c, index) => {
      if (!c.customerId && !c.code) {
        changed = true;
        return {
          ...c,
          customerId: `CUST-${1001 + index}`
        };
      }
      return {
        ...c,
        customerId: c.customerId || c.code || `CUST-${1001 + index}`
      };
    });

    if (changed) {
      storeData.clients = clients;
      await saveStoreData(storeId, storeData);
    }

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', name, phone, email, address, due = 0, customerId } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Client name required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.clients = storeData.clients || [];

    // Generate unique Customer ID if not provided
    let generatedId = customerId?.trim();
    if (!generatedId) {
      const existingNumbers = storeData.clients
        .map(c => {
          const match = (c.customerId || '').match(/CUST-(\d+)/i);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter(n => n !== null && !isNaN(n));

      const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : (1001 + storeData.clients.length);
      generatedId = `CUST-${nextNum}`;
    }

    const newClient = {
      id: 'c_' + Date.now(),
      customerId: generatedId,
      name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      due: Number(due) || 0
    };

    storeData.clients.push(newClient);
    await saveStoreData(storeId, storeData);

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

    const storeData = await getStoreData(storeId);
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

    await saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, client: storeData.clients[index] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
