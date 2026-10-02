import { NextResponse } from 'next/server';
import { getSuperAdmin, updateSuperAdminPassword } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const auth = verifyApiAuth(request, { allowedRoles: ['superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    const admin = await getSuperAdmin();
    return NextResponse.json({ success: true, admin });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = verifyApiAuth(request, { allowedRoles: ['superadmin'] });
    if (!auth.authenticated) return auth.errorResponse;

    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }
    await updateSuperAdminPassword(password);
    return NextResponse.json({ success: true, message: 'Super Admin password updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
