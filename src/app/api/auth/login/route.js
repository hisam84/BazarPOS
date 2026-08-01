import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password required' }, { status: 400 });
    }

    const authResult = authenticateUser(username, password);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    return NextResponse.json(authResult);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
