import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;
    const storeData = await getStoreData(storeId);

    return NextResponse.json({ success: true, staff: storeData.staff || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', name, username, password, email, role = 'cashier', phone = '' } = body;

    const auth = verifyApiAuth(request, { requiredStoreId: storeId, allowedRoles: ['owner', 'superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    if (!name || !username || !password || !email) {
      return NextResponse.json({ success: false, message: 'Name, username, password, and email are required' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Please provide a valid email address' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.staff = storeData.staff || [];

    // Check duplicate username or email
    if (storeData.staff.some(s => s.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'Username already taken by another staff member' }, { status: 400 });
    }
    if (storeData.staff.some(s => s.email && s.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'Email address is already registered to another staff member' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password.trim());

    const newStaff = {
      id: 'st_' + Date.now(),
      name: name.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
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
    const { storeId = 'default', id, name, username, email, password, role, phone } = body;

    const auth = verifyApiAuth(request, { requiredStoreId: storeId, allowedRoles: ['owner', 'superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Staff ID required' }, { status: 400 });
    }

    if (email !== undefined && (!email || !email.includes('@'))) {
      return NextResponse.json({ success: false, message: 'Valid email address is mandatory' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    const index = (storeData.staff || []).findIndex(s => s.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Staff member not found' }, { status: 404 });
    }

    const existing = storeData.staff[index];

    // Check duplicate email with other staff
    if (email && storeData.staff.some(s => s.id !== id && s.email && s.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'Email is already used by another staff member' }, { status: 400 });
    }

    let updatedPassword = existing.password;
    if (password !== undefined && password.trim() !== '') {
      updatedPassword = await hashPassword(password.trim());
    }

    storeData.staff[index] = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      username: username !== undefined ? username.trim() : existing.username,
      email: email !== undefined ? email.trim().toLowerCase() : (existing.email || ''),
      password: updatedPassword,
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

    const auth = verifyApiAuth(request, { requiredStoreId: storeId, allowedRoles: ['owner', 'superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

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
