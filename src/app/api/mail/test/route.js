import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { recipient, settings } = await request.json();

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid recipient email address' },
        { status: 400 }
      );
    }

    const {
      provider = 'smtp',
      fromName = 'BazarPOS Test',
      fromEmail = 'noreply@bazarpos.com',
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      apiKey,
      domain
    } = settings || {};

    const subject = `[BazarPOS] Test Email - ${new Date().toLocaleTimeString()}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 16px 20px; border-radius: 8px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">BazarPOS Email Test Successful</h2>
        </div>
        <div style="padding: 20px 10px; color: #334155; line-height: 1.6;">
          <p>Hello,</p>
          <p>This is a test notification confirming that your BazarPOS <strong>${provider.toUpperCase()}</strong> mailing gateway is configured correctly and operational!</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Provider:</strong></td>
              <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${provider.toUpperCase()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Sender:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${fromName} &lt;${fromEmail}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Sent At:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
          Sent automatically from BazarPOS Cloud ERP
        </div>
      </div>
    `;

    // 1. Brevo (Bravo) API Handler
    if (provider === 'brevo') {
      if (!apiKey && (!smtpHost || !smtpUser)) {
        return NextResponse.json(
          { success: false, message: 'Brevo API Key (xkeysib-...) or Brevo SMTP credentials are required' },
          { status: 400 }
        );
      }

      if (apiKey) {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [{ email: recipient }],
            subject: subject,
            htmlContent: htmlBody
          })
        });

        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
          return NextResponse.json(
            { success: false, message: resData.message || 'Brevo API rejected the request', details: resData },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Test email successfully dispatched to ${recipient} via Brevo API! (Message ID: ${resData.messageId || 'Delivered'})`
        });
      }
    }

    // 2. Resend API Handler
    if (provider === 'resend') {
      if (!apiKey) {
        return NextResponse.json(
          { success: false, message: 'Resend API Key is required (e.g. re_xxxx)' },
          { status: 400 }
        );
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [recipient],
          subject: subject,
          html: htmlBody
        })
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { success: false, message: resData.message || 'Resend API rejected the request', details: resData },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Test email successfully dispatched to ${recipient} via Resend API! (ID: ${resData.id || 'OK'})`
      });
    }

    // 3. SendGrid API Handler
    if (provider === 'sendgrid') {
      if (!apiKey) {
        return NextResponse.json(
          { success: false, message: 'SendGrid API Key is required' },
          { status: 400 }
        );
      }

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: fromEmail, name: fromName },
          subject: subject,
          content: [{ type: 'text/html', value: htmlBody }]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { success: false, message: `SendGrid Error (${res.status}): ${errText}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Test email successfully dispatched to ${recipient} via SendGrid API!`
      });
    }

    // 4. Standard SMTP / Brevo SMTP Relay / Gmail Gateway
    if (provider === 'smtp' || provider === 'gmail' || (provider === 'brevo' && !apiKey)) {
      if (!smtpHost || !smtpUser) {
        return NextResponse.json(
          { success: false, message: 'SMTP Host and Username/Email are required' },
          { status: 400 }
        );
      }

      if (!smtpPassword) {
        return NextResponse.json(
          { success: false, message: 'SMTP Password (or Gmail 16-character App Password) is required' },
          { status: 400 }
        );
      }

      try {
        const nodemailer = (await import('nodemailer')).default;
        const port = Number(smtpPort) || 587;
        const isSecure = port === 465 || settings.smtpSecure === 'ssl';

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: port,
          secure: isSecure,
          auth: {
            user: smtpUser.trim(),
            pass: smtpPassword.trim().replace(/\s+/g, '') // remove spaces from Gmail app passwords
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail || smtpUser}>`,
          to: recipient,
          subject: subject,
          html: htmlBody
        });

        return NextResponse.json({
          success: true,
          message: `Test email successfully sent to ${recipient} via ${smtpHost}:${port}! (Message ID: ${info.messageId})`
        });
      } catch (err) {
        console.error('SMTP test delivery error:', err);
        let helpfulMessage = err.message;
        if (err.message?.includes('Invalid login') || err.message?.includes('BadCredentials') || err.code === 'EAUTH') {
          helpfulMessage = 'Authentication failed (Invalid login): For Gmail, you MUST use a 16-character "App Password" (Google Account > Security > 2-Step Verification > App Passwords), NOT your regular Gmail password.';
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          helpfulMessage = `Connection to ${smtpHost}:${smtpPort || 587} timed out. Please check SMTP Host and Port.`;
        }
        return NextResponse.json(
          { success: false, message: helpfulMessage },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Test email queued successfully for ${recipient} via ${provider.toUpperCase()}`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred while sending test email' },
      { status: 500 }
    );
  }
}
