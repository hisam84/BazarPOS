import nodemailer from 'nodemailer';
import { getStoreData } from './db';
import { renderTemplate, getStoreTemplate } from './email-templates';

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
export async function sendPasswordResetOtpEmail({ toEmail, otpCode, username, role = 'User', storeName = 'BazarPOS', logoUrl = '', storeId = 'default' }) {
  const mailConfig = await getActiveMailConfig(storeId);

  if (!mailConfig.configured) {
    return {
      success: false,
      smtpConfigured: false,
      message: 'ইমেইল সার্ভিস (Brevo / SMTP) সেটআপ করা নেই। পাসওয়ার্ড রিসেট করতে অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।'
    };
  }

  let storeData = null;
  try {
    storeData = await getStoreData(storeId);
  } catch (e) {
    // Ignore
  }

  const template = getStoreTemplate(storeData, 'password_reset');
  const variables = {
    company_name: storeData?.company?.name || storeName || 'BazarPOS',
    logo_url: storeData?.company?.logoUrl || logoUrl || '',
    user_name: username || 'User',
    user_role: role || 'Staff Member',
    user_email: toEmail,
    otp_code: otpCode,
    expiry_minutes: '15'
  };

  const subject = renderTemplate(template.subject, variables);
  const html = renderTemplate(template.bodyHtml, variables);

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
