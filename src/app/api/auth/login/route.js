import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { signJwt } from '@/lib/jwt';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password required' }, { status: 400 });
    }

    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const userPayload = {
      username: authResult.user.username,
      fullName: authResult.user.fullName,
      role: authResult.role,
      storeId: authResult.storeId || 'default',
      storeName: authResult.user.storeName || ''
    };

    // Sign cryptographic JWT token valid for 30 days
    const token = signJwt(userPayload, 30 * 86400);

    const responseData = {
      ...authResult,
      token,
      user: {
        ...authResult.user,
        token
      }
    };

    const response = NextResponse.json(responseData);

    // Set secure HttpOnly cookie for automatic API authorization
    response.cookies.set('bazarpos_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 86400
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
