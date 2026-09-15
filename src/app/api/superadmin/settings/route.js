import { NextResponse } from 'next/server';
import { getSuperAdmin, updateSuperAdminPassword } from '@/lib/db';

export async function GET() {
  try {
    const admin = getSuperAdmin();
    return NextResponse.json({ success: true, admin });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }
    updateSuperAdminPassword(password);
    return NextResponse.json({ success: true, message: 'Super Admin password updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
