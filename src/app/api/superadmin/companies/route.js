import { NextResponse } from 'next/server';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '@/lib/db';

export async function GET() {
  try {
    const companies = getCompanies();
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, owner, phone, email, address, username, password, planId, customDurationDays, notes } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'Company Name, Username, and Password are required' },
        { status: 400 }
      );
    }

    const newCompany = createCompany({
      name,
      owner,
      phone,
      email,
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
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Company ID required' }, { status: 400 });
    }

    const updated = updateCompany(id, updates);
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Company ID required' }, { status: 400 });
    }

    deleteCompany(id);
    return NextResponse.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
