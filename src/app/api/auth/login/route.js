import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { signJwt } from '@/lib/jwt';
import { getClientIp, checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limiter';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password required' }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const ipKey = `ip_${clientIp}`;
    const userKey = `user_${username.trim().toLowerCase()}`;

    // 1. Check IP and Username Rate Limit
    const ipLimit = checkRateLimit(ipKey);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, message: ipLimit.message, retryAfterSeconds: ipLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    const userLimit = checkRateLimit(userKey);
    if (!userLimit.allowed) {
      return NextResponse.json(
        { success: false, message: userLimit.message, retryAfterSeconds: userLimit.retryAfterSeconds },
        { status: 429 }
      );
    }

    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      // Record failed attempt
      const ipFail = recordFailedAttempt(ipKey);
      const userFail = recordFailedAttempt(userKey);

      const remaining = Math.min(ipFail.remainingAttempts, userFail.remainingAttempts);
      let errMsg = authResult.message || 'Invalid username or password';
      if (remaining > 0 && remaining <= 3) {
        errMsg += ` (${remaining} attempt${remaining > 1 ? 's' : ''} remaining before lockout)`;
      } else if (remaining === 0) {
        errMsg = 'Too many failed attempts. Account temporarily locked for 15 minutes for security.';
      }

      return NextResponse.json(
        { success: false, message: errMsg, remainingAttempts: remaining },
        { status: remaining === 0 ? 429 : 401 }
      );
    }

    // Success -> Reset rate limit trackers
    resetRateLimit(ipKey);
    resetRateLimit(userKey);

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
