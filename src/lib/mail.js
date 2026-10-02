import nodemailer from 'nodemailer';
import { getStoreData } from './db';

/**
 * Get active SMTP / Mailing configuration
 * Checks ENV variables first, then database store/system mail settings
 */
export async function getActiveMailConfig(storeId = 'default') {
  // 1. Check environment variables
  if (process.env.BREVO_API_KEY || process.env.BRAVO_API_KEY) {
    return {
      configured: true,
      provider: 'brevo',
      apiKey: process.env.BREVO_API_KEY || process.env.BRAVO_API_KEY,
      fromName: process.env.SMTP_FROM_NAME || 'BazarPOS Cloud ERP',
      fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@bazarpos.com'
    };
  }

  if (process.env.RESEND_API_KEY) {
    return {
      configured: true,
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
      fromName: process.env.SMTP_FROM_NAME || 'BazarPOS Cloud ERP',
      fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@bazarpos.com'
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
    return {
      configured: true,
      provider: 'smtp',
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      fromName: process.env.SMTP_FROM_NAME || 'BazarPOS Cloud ERP',
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    };
  }

  // 2. Check Database Mail Settings
  try {
    const storeData = await getStoreData(storeId || 'default');
    const settings = storeData?.mailSettings || storeData?.company?.mailSettings;

    if (settings) {
      // Brevo API
      if (settings.provider === 'brevo' && settings.apiKey) {
        return {
          configured: true,
          provider: 'brevo',
          apiKey: settings.apiKey,
          fromName: settings.fromName || 'BazarPOS Security Team',
          fromEmail: settings.fromEmail || 'noreply@bazarpos.com'
        };
      }

      // Resend API
      if (settings.provider === 'resend' && settings.apiKey) {
        return {
          configured: true,
          provider: 'resend',
          apiKey: settings.apiKey,
          fromName: settings.fromName || 'BazarPOS Security Team',
          fromEmail: settings.fromEmail || 'noreply@bazarpos.com'
        };
      }

      // SendGrid API
      if (settings.provider === 'sendgrid' && settings.apiKey) {
        return {
          configured: true,
          provider: 'sendgrid',
          apiKey: settings.apiKey,
          fromName: settings.fromName || 'BazarPOS Security Team',
          fromEmail: settings.fromEmail || 'noreply@bazarpos.com'
        };
      }

      // Standard SMTP / Brevo SMTP Relay / Gmail
      if (settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
        return {
          configured: true,
          provider: settings.provider || 'smtp',
          host: settings.smtpHost,
          port: Number(settings.smtpPort) || 587,
          secure: settings.smtpSecure === 'ssl' || Number(settings.smtpPort) === 465,
          user: settings.smtpUser,
          pass: settings.smtpPassword,
          fromName: settings.fromName || 'BazarPOS Security Team',
          fromEmail: settings.fromEmail || settings.smtpUser
        };
      }
    }
  } catch (e) {
    console.warn('Could not read DB mail settings:', e.message);
  }

  return {
    configured: false,
    message: 'ইমেইল সার্ভিস (Brevo / SMTP) সিস্টেমে কনফিগার করা নেই।'
  };
}

/**
 * Send Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail({ toEmail, otpCode, username, role = 'User', storeName = 'BazarPOS', logoUrl = '' }) {
  const mailConfig = await getActiveMailConfig();

  if (!mailConfig.configured) {
    return {
      success: false,
      smtpConfigured: false,
      message: 'ইমেইল সার্ভিস (Brevo / SMTP) সেটআপ করা নেই। পাসওয়ার্ড রিসেট করতে অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।'
    };
  }

  const subject = `[${storeName}] Password Reset Verification Code: ${otpCode}`;
  const logoHtml = logoUrl ? `
    <div style="margin-bottom: 12px; text-align: center;">
      <img src="${logoUrl}" alt="${storeName} Logo" style="max-height: 50px; max-width: 160px; object-fit: contain; border-radius: 8px; background: #ffffff; padding: 4px;" />
    </div>
  ` : '';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 20px; border-radius: 12px; color: #ffffff; text-align: center;">
        ${logoHtml}
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">${storeName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Password Recovery & Security Portal</p>
      </div>

      <div style="padding: 24px 8px; line-height: 1.6;">
        <p style="font-size: 14px; margin-top: 0;">Hello <strong>${username}</strong> (${role}),</p>
        <p style="font-size: 13px; color: #475569;">
          We received a request to reset your password for your <strong>${storeName}</strong> account. Use the 6-digit verification code below to complete the reset:
        </p>

        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; font-family: monospace;">${otpCode}</span>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">Valid for 15 minutes only</p>
        </div>

        <p style="font-size: 12px; color: #64748b;">
          If you did not request a password reset, please ignore this email or notify your system administrator immediately.
        </p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
        This is an automated security message from ${storeName} Cloud POS ERP. Please do not reply directly to this email.
      </div>
    </div>
  `;

  try {
    // 1. Brevo (Bravo) API Dispatch
    if (mailConfig.provider === 'brevo' && mailConfig.apiKey) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': mailConfig.apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: mailConfig.fromName, email: mailConfig.fromEmail },
          to: [{ email: toEmail, name: username }],
          subject: subject,
          htmlContent: html
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Brevo API rejected request with status ${res.status}`);
      }

      return {
        success: true,
        smtpConfigured: true,
        message: 'Verification code sent to your email successfully via Brevo.'
      };
    }

    // 2. Resend API Dispatch
    if (mailConfig.provider === 'resend' && mailConfig.apiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${mailConfig.fromName} <${mailConfig.fromEmail}>`,
          to: [toEmail],
          subject: subject,
          html: html
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Resend API rejected request with status ${res.status}`);
      }

      return {
        success: true,
        smtpConfigured: true,
        message: 'Verification code sent to your email successfully via Resend.'
      };
    }

    // 3. SendGrid API Dispatch
    if (mailConfig.provider === 'sendgrid' && mailConfig.apiKey) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: mailConfig.fromEmail, name: mailConfig.fromName },
          subject: subject,
          content: [{ type: 'text/html', value: html }]
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`SendGrid API error (${res.status}): ${errText}`);
      }

      return {
        success: true,
        smtpConfigured: true,
        message: 'Verification code sent to your email successfully via SendGrid.'
      };
    }

    // 4. Nodemailer Transport (SMTP / Brevo SMTP Relay / Gmail)
    if (mailConfig.host && mailConfig.user && mailConfig.pass) {
      const transporter = nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: {
          user: mailConfig.user,
          pass: mailConfig.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: `"${mailConfig.fromName}" <${mailConfig.fromEmail}>`,
        to: toEmail,
        subject: subject,
        html: html
      });

      return {
        success: true,
        smtpConfigured: true,
        message: 'Verification code sent to your email successfully.'
      };
    }

    throw new Error('No valid mail gateway connection found.');
  } catch (error) {
    console.error('Failed to dispatch password reset email:', error);
    return {
      success: false,
      smtpConfigured: true,
      message: `Failed to send email: ${error.message || 'Mailing Gateway Error'}`
    };
  }
}
