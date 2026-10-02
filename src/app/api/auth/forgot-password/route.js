import { NextResponse } from 'next/server';
import { getNeonSql, getDb, getStores, getStoreData, saveStoreData, updateCompany, updateSuperAdminPassword, initPostgresTables } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { sendPasswordResetOtpEmail, getActiveMailConfig } from '@/lib/mail';

// In-memory OTP storage (with 15-minute TTL)
// Maps email -> { otp, expiresAt, role, storeId, username }
const globalResetOtps = globalThis._bazarpos_reset_otps || new Map();
globalThis._bazarpos_reset_otps = globalResetOtps;

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'request-otp', email, otp, newPassword } = body;

    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // ================= ACTION 1: REQUEST OTP =================
    if (action === 'request-otp') {
      // 1. Locate user by email
      const userFound = await findUserByEmail(cleanEmail);

      if (!userFound) {
        return NextResponse.json(
          {
            success: false,
            message: 'No account found registered with this email address. Please check your email or contact support.'
          },
          { status: 404 }
        );
      }

      // 2. Check SMTP configuration
      const mailConfig = await getActiveMailConfig(userFound.storeId || 'default');
      if (!mailConfig.configured) {
        return NextResponse.json(
          {
            success: false,
            smtpConfigured: false,
            message: 'ইমেইল সার্ভার (SMTP) সেটআপ করা নেই। পাসওয়ার্ড রিসেট করতে অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।'
          },
          { status: 400 }
        );
      }

      // 3. Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      globalResetOtps.set(cleanEmail, {
        otp: otpCode,
        expiresAt,
        role: userFound.role,
        storeId: userFound.storeId,
        username: userFound.username,
        staffId: userFound.staffId
      });

      // 4. Send Email
      const emailResult = await sendPasswordResetOtpEmail({
        toEmail: cleanEmail,
        otpCode,
        username: userFound.username,
        role: userFound.role.toUpperCase(),
        storeName: userFound.storeName || 'BazarPOS',
        logoUrl: userFound.logoUrl || ''
      });

      if (!emailResult.success) {
        return NextResponse.json(
          {
            success: false,
            smtpConfigured: true,
            message: emailResult.message || 'Failed to dispatch email. Please verify SMTP settings.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        smtpConfigured: true,
        message: 'A 6-digit password reset verification code has been sent to your email.'
      });
    }

    // ================= ACTION 2: VERIFY OTP AND RESET PASSWORD =================
    if (action === 'verify-and-reset') {
      if (!otp || !otp.trim()) {
        return NextResponse.json(
          { success: false, message: 'Please enter the 6-digit verification code.' },
          { status: 400 }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      const record = globalResetOtps.get(cleanEmail);
      if (!record) {
        return NextResponse.json(
          { success: false, message: 'Verification code not found or expired. Please request a new code.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        globalResetOtps.delete(cleanEmail);
        return NextResponse.json(
          { success: false, message: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (record.otp !== otp.trim()) {
        return NextResponse.json(
          { success: false, message: 'Invalid verification code. Please check your email and try again.' },
          { status: 400 }
        );
      }

      // Password Reset Execution
      const hashedPassword = await hashPassword(newPassword.trim());
      const sql = getNeonSql();

      if (record.role === 'superadmin') {
        if (sql) {
          try {
            await initPostgresTables();
            await sql`UPDATE bazarpos_superadmin SET password = ${hashedPassword} WHERE username = ${record.username}`;
          } catch (e) {
            console.warn('Superadmin reset error:', e.message);
          }
        }
        await updateSuperAdminPassword(newPassword.trim());
      } else if (record.role === 'owner') {
        await updateCompany(record.storeId, { password: newPassword.trim() });
      } else if (record.role === 'staff' || record.role === 'cashier' || record.role === 'manager') {
        const storeData = await getStoreData(record.storeId);
        const staffList = storeData.staff || [];
        const staffIndex = staffList.findIndex(s => s.id === record.staffId || s.username === record.username);
        if (staffIndex !== -1) {
          staffList[staffIndex].password = hashedPassword;
          staffList[staffIndex].updatedAt = new Date().toISOString();
          await saveStoreData(record.storeId, storeData);
        }
      }

      // Invalidate OTP
      globalResetOtps.delete(cleanEmail);

      return NextResponse.json({
        success: true,
        message: 'Password successfully reset! You can now sign in with your new password.'
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error processing password reset' },
      { status: 500 }
    );
  }
}

/**
 * Search user across SuperAdmin, Store Owners, and Staff by email
 */
async function findUserByEmail(email) {
  const sql = getNeonSql();

  // 1. Check SuperAdmin in Postgres & Local
  if (sql) {
    try {
      await initPostgresTables();
      const admins = await sql`SELECT * FROM bazarpos_superadmin WHERE LOWER(email) = ${email} OR (email IS NULL AND LOWER(username) = 'superadmin' AND ${email} = 'superadmin@bazarpos.com') LIMIT 1`;
      if (admins.length > 0) {
        return {
          role: 'superadmin',
          username: admins[0].username,
          storeName: 'SaaS Platform Admin',
          storeId: null
        };
      }
    } catch (e) {}
  }

  const db = getDb();
  if (db.superAdmin?.email?.toLowerCase() === email || email === 'superadmin@bazarpos.com') {
    return {
      role: 'superadmin',
      username: db.superAdmin.username,
      storeName: 'SaaS Platform Admin',
      storeId: null
    };
  }

  // 2. Check Store Owners
  const stores = await getStores();
  for (const storeId in stores) {
    const store = stores[storeId];
    if (store.email && store.email.trim().toLowerCase() === email) {
      const storeData = await getStoreData(storeId);
      return {
        role: 'owner',
        username: store.username,
        storeName: store.name || 'Store Owner',
        storeId: store.id,
        logoUrl: storeData?.company?.logoUrl || ''
      };
    }
  }

  // 3. Check Staff
  for (const storeId in stores) {
    const storeData = await getStoreData(storeId);
    const staffList = storeData.staff || [];
    for (const staff of staffList) {
      if (staff.email && staff.email.trim().toLowerCase() === email) {
        return {
          role: staff.role || 'cashier',
          username: staff.username,
          staffId: staff.id,
          storeName: stores[storeId]?.name || 'Store Staff',
          storeId: storeId,
          logoUrl: storeData?.company?.logoUrl || ''
        };
      }
    }
  }

  return null;
}
