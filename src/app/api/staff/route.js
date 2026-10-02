import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = await getStoreData(storeId);

    return NextResponse.json({ success: true, staff: storeData.staff || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', name, username, password, role = 'cashier', phone = '' } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ success: false, message: 'Name, username, and password required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.staff = storeData.staff || [];

    // Check duplicate username
    if (storeData.staff.some(s => s.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'Username already taken by another staff member' }, { status: 400 });
    }

    const newStaff = {
      id: 'st_' + Date.now(),
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      role: role || 'cashier',
      phone: phone ? phone.trim() : '',
      createdAt: new Date().toISOString()
    };

    storeData.staff.push(newStaff);
    await saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', id, name, username, password, role, phone } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Staff ID required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    const index = (storeData.staff || []).findIndex(s => s.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Staff member not found' }, { status: 404 });
    }

    const existing = storeData.staff[index];
    storeData.staff[index] = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      username: username !== undefined ? username.trim() : existing.username,
      password: (password !== undefined && password.trim() !== '') ? password.trim() : existing.password,
      role: role !== undefined ? role : existing.role,
      phone: phone !== undefined ? phone.trim() : (existing.phone || ''),
      updatedAt: new Date().toISOString()
    };

    await saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, staff: storeData.staff[index] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId') || 'default';

    if (!id) {
      return NextResponse.json({ success: false, message: 'Staff ID required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.staff = (storeData.staff || []).filter(s => s.id !== id);
    await saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
