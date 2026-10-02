import { NextResponse } from 'next/server';
import { verifyJwt } from './jwt';

/**
 * Extract token from Authorization header or Cookie
 */
export function extractToken(request) {
  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie: bazarpos_auth_token=<token>
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/bazarpos_auth_token=([^;]+)/);
    if (match) return match[1];
  }

  // 3. Query param token fallback
  try {
    const url = new URL(request.url);
    const qToken = url.searchParams.get('authToken');
    if (qToken) return qToken;
  } catch (e) {}

  return null;
}

/**
 * Verify API authorization with Tenant Isolation check
 * @param {Request} request
 * @param {Object} options - { requiredStoreId?: string, allowedRoles?: string[], requireAuth?: boolean }
 * @returns {{ authenticated: boolean, user?: Object, errorResponse?: NextResponse }}
 */
export function verifyApiAuth(request, options = {}) {
  const { requiredStoreId, allowedRoles } = options;
  const token = extractToken(request);

  if (!token) {
    // If no token is provided:
    // To maintain smooth compatibility with frontend while transitioning, we verify if token is present
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        { success: false, message: 'Authentication required. Please login to access this resource.' },
        { status: 401 }
      )
    };
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        { success: false, message: 'Invalid or expired session token. Please re-login.' },
        { status: 401 }
      )
    };
  }

  // Role verification (e.g., ['superadmin'] or ['owner', 'staff'])
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(payload.role)) {
      return {
        authenticated: false,
        user: payload,
        errorResponse: NextResponse.json(
          { success: false, message: 'Access denied: You do not have permission to perform this action.' },
          { status: 403 }
        )
      };
    }
  }

  // TENANT ISOLATION CHECK:
  // SuperAdmin has platform-wide access.
  // Store Owners & Staff CAN ONLY access their own storeId!
  if (requiredStoreId && payload.role !== 'superadmin') {
    if (payload.storeId !== requiredStoreId) {
      return {
        authenticated: false,
        user: payload,
        errorResponse: NextResponse.json(
          { success: false, message: 'Forbidden: Tenant isolation violation. You cannot access data from another store.' },
          { status: 403 }
        )
      };
    }
  }

  return { authenticated: true, user: payload };
}
