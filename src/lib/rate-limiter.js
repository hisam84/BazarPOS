/**
 * In-Memory Rate Limiter for Login Brute-Force Protection
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 Minutes

// Map to store attempt history: key -> { attempts: number, firstAttemptAt: number, lockedUntil: number }
const attemptsStore = new Map();

/**
 * Clean up expired records every 10 minutes to prevent memory leak
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attemptsStore.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      attemptsStore.delete(key);
    } else if (!record.lockedUntil && (now - record.firstAttemptAt) > LOCKOUT_WINDOW_MS) {
      attemptsStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref?.();

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Check if the given identifier (IP or username) is rate-limited
 * @param {string} key - e.g., `ip_192.168.1.1` or `user_admin`
 * @returns {{ allowed: boolean, remainingAttempts: number, retryAfterSeconds: number, message?: string }}
 */
export function checkRateLimit(key) {
  const now = Date.now();
  const record = attemptsStore.get(key);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      retryAfterSeconds: 0
    };
  }

  // Check if actively locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const retryMinutes = Math.ceil(retryAfterSeconds / 60);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
      message: `Too many failed login attempts. Account/IP temporarily locked for security. Please try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.`
    };
  }

  // If lockout or window expired, reset record
  if ((now - record.firstAttemptAt) > LOCKOUT_WINDOW_MS) {
    attemptsStore.delete(key);
    return {
      allowed: true,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      retryAfterSeconds: 0
    };
  }

  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return {
    allowed: remainingAttempts > 0,
    remainingAttempts,
    retryAfterSeconds: 0
  };
}

/**
 * Record a failed login attempt for a key
 * @param {string} key 
 */
export function recordFailedAttempt(key) {
  const now = Date.now();
  const record = attemptsStore.get(key);

  if (!record || (now - record.firstAttemptAt) > LOCKOUT_WINDOW_MS) {
    attemptsStore.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: 0
    });
    return { remainingAttempts: MAX_FAILED_ATTEMPTS - 1, locked: false };
  }

  record.attempts += 1;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_WINDOW_MS;
    return {
      remainingAttempts: 0,
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_WINDOW_MS / 1000)
    };
  }

  return {
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts),
    locked: false
  };
}

/**
 * Reset failed attempts upon successful login
 * @param {string} key 
 */
export function resetRateLimit(key) {
  attemptsStore.delete(key);
}
