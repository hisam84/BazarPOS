import { NextResponse } from 'next/server';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const auth = verifyApiAuth(request, { allowedRoles: ['superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    const companies = await getCompanies();
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = verifyApiAuth(request, { allowedRoles: ['superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    const body = await request.json();
    const { name, owner, phone, email, address, username, password, planId, customDurationDays, notes } = body;

    if (!name || !username || !password || !email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Company Name, Username, Password, and a valid Email address are required' },
        { status: 400 }
      );
    }

    const newCompany = await createCompany({
      name,
      owner,
      phone,
      email: email.trim().toLowerCase(),
      address,
      username,
      password,
      planId: planId || '1month',
      customDurationDays: customDurationDays ? Number(customDurationDays) : null,
      notes: notes || ''
    });

    return NextResponse.json({ success: true, company: newCompany });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = verifyApiAuth(request, { allowedRoles: ['superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Company ID required' }, { status: 400 });
    }

    if (updates.email !== undefined && (!updates.email || !updates.email.includes('@'))) {
      return NextResponse.json({ success: false, message: 'A valid email address is required' }, { status: 400 });
    }

    const updated = await updateCompany(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = verifyApiAuth(request, { allowedRoles: ['superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Company ID required' }, { status: 400 });
    }

    await deleteCompany(id);
    return NextResponse.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
