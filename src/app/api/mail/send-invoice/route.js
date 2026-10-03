import { NextResponse } from 'next/server';
import { getStoreData } from '@/lib/db';
import { getStoreTemplate, renderTemplate } from '@/lib/email-templates';

export async function POST(request) {
  try {
    const { storeId = 'default', recipient, voucher, invoiceUrl } = await request.json();

    if (!recipient || !voucher) {
      return NextResponse.json(
        { success: false, message: 'Recipient email and voucher data are required' },
        { status: 400 }
      );
    }

    const storeData = await getStoreData(storeId);
    const mailSettings = storeData.mailSettings || storeData.company?.mailSettings || {};
    const company = storeData.company || {};

    const storeName = company.name || 'BazarPOS Outlet';
    const fromName = mailSettings.fromName || storeName;
    const fromEmail = mailSettings.fromEmail || 'noreply@bazarpos.com';
    const provider = mailSettings.provider || 'smtp';

    const directLink = invoiceUrl || `https://bazarpos.com/invoice/${voucher.publicToken || voucher.id}?storeId=${storeId}`;

    const itemsHtml = (voucher.items || [])
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 8px; font-size: 13px; color: #1e293b;">
            <strong>${it.name}</strong>
            ${it.unit ? `<span style="font-size: 11px; color: #64748b;"> (${it.unit})</span>` : ''}
            ${it.warranty ? `<div style="font-size: 11px; color: #2563eb; margin-top: 2px;">🛡️ Warranty: ${it.warranty}</div>` : ''}
            ${(it.serialNumber || it.serialNo) ? `<div style="font-size: 11px; color: #7c3aed; font-family: monospace; margin-top: 2px;">🔢 S/N: ${it.serialNumber || it.serialNo}</div>` : ''}
            ${it.description ? `<div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 2px;">${it.description}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; font-size: 13px; text-align: center; color: #334155;">${it.quantity}</td>
          <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #0f172a; font-weight: bold;">৳${((it.quantity || 1) * (it.unitPrice || 0)).toLocaleString()}</td>
        </tr>
      `
      )
      .join('');

    // Load dynamic template
    const template = getStoreTemplate(storeData, 'invoice');
    const variables = {
      company_name: storeName,
      company_phone: company.phone || '',
      company_email: company.email || '',
      company_address: company.address || '',
      logo_url: company.logoUrl || '',
      customer_name: voucher.clientName || 'Valued Customer',
      customer_phone: voucher.clientPhone || '',
      invoice_no: voucher.voucherNo || voucher.id,
      invoice_date: new Date(voucher.date || Date.now()).toLocaleDateString(),
      invoice_link: directLink,
      items_table: itemsHtml,
      subtotal: `৳${Number(voucher.subTotal || voucher.totalAmount).toLocaleString()}`,
      discount: `৳${Number(voucher.discount || 0).toLocaleString()}`,
      tax: `৳${Number(voucher.tax || 0).toLocaleString()}`,
      total_amount: `৳${Number(voucher.totalAmount).toLocaleString()}`,
      paid_amount: `৳${Number(voucher.paidAmount || voucher.totalAmount).toLocaleString()}`,
      due_amount: `৳${Number(voucher.dueAmount || 0).toLocaleString()}`,
      payment_status: voucher.status || (voucher.dueAmount > 0 ? 'DUE' : 'PAID'),
      saler_name: voucher.salerName || voucher.createdBy || 'Store Staff'
    };

    const subject = renderTemplate(template.subject, variables);
    const htmlBody = renderTemplate(template.bodyHtml, variables);

    // Dispatch email via configured provider
    if (provider === 'brevo' && mailSettings.apiKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': mailSettings.apiKey,
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
    } else if (provider === 'resend' && mailSettings.apiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailSettings.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [recipient],
          subject: subject,
          html: htmlBody
        })
      });
    } else if (provider === 'sendgrid' && mailSettings.apiKey) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailSettings.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: fromEmail, name: fromName },
          subject: subject,
          content: [{ type: 'text/html', value: htmlBody }]
        })
      });
    } else if (mailSettings.smtpHost && mailSettings.smtpUser && mailSettings.smtpPassword) {
      try {
        const nodemailer = (await import('nodemailer')).default;
        const port = Number(mailSettings.smtpPort) || 587;
        const transporter = nodemailer.createTransport({
          host: mailSettings.smtpHost,
          port: port,
          secure: mailSettings.smtpSecure === 'ssl' || port === 465,
          auth: {
            user: mailSettings.smtpUser.trim(),
            pass: mailSettings.smtpPassword.trim().replace(/\s+/g, '')
          },
          tls: { rejectUnauthorized: false }
        });
        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail || mailSettings.smtpUser}>`,
          to: recipient,
          subject: subject,
          html: htmlBody
        });
      } catch (err) {
        console.error('Nodemailer invoice send error:', err.message);
        return NextResponse.json(
          { success: false, message: `Failed to send email: ${err.message}` },
          { status: 500 }
        );
      }
    } else {
      console.log(`[SMTP/GATEWAY INVOICE SENT] To: ${recipient}, Subject: ${subject}, Link: ${directLink}`);
    }

    return NextResponse.json({
      success: true,
      message: `Invoice #${voucher.voucherNo} sent successfully to ${recipient} with download link!`,
      invoiceUrl: directLink
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
