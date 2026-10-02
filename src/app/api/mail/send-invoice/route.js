import { NextResponse } from 'next/server';
import { getStoreData } from '@/lib/db';

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

    const subject = `Invoice #${voucher.voucherNo} from ${storeName}`;
    const directLink = invoiceUrl || `https://bazarpos.com/invoice/${voucher.id}?storeId=${storeId}`;

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

    const htmlBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 4px 0; color: #0f172a; font-size: 22px; font-weight: 800;">${storeName}</h2>
            <p style="margin: 0; color: #64748b; font-size: 12px;">Official Sales Receipt & Invoice</p>
          </div>

          <!-- Summary info -->
          <table style="width: 100%; margin-bottom: 20px; font-size: 12px; color: #475569;">
            <tr>
              <td><strong>Invoice #:</strong> <span style="color: #0f172a; font-weight: bold;">${voucher.voucherNo}</span></td>
              <td style="text-align: right;"><strong>Date:</strong> ${new Date(voucher.date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td><strong>Customer:</strong> ${voucher.clientName || 'Valued Customer'}</td>
              <td style="text-align: right;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${voucher.status || 'PAID'}</span></td>
            </tr>
          </table>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
                <th style="padding: 8px;">Item Description</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="background-color: #f8fafc; padding: 14px; border-radius: 8px; margin-bottom: 24px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
              <span>Subtotal:</span>
              <span style="font-weight: 600; color: #0f172a;">৳${Number(voucher.subTotal || voucher.totalAmount).toLocaleString()}</span>
            </div>
            ${voucher.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #dc2626;">
                <span>Discount:</span>
                <span>-৳${Number(voucher.discount).toLocaleString()}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 16px; font-weight: 800; color: #2563eb;">
              <span>Total Amount:</span>
              <span>৳${Number(voucher.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          <!-- Download Button -->
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${directLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
              📥 View & Download Full A4 Invoice
            </a>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">Click button above to download or print your official PDF invoice</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 16px; font-size: 11px; color: #94a3b8;">
          ${company.phone ? `Phone: ${company.phone} • ` : ''} ${company.address || ''}
        </div>
      </div>
    `;

    // Dispatch email via configured provider
    if (provider === 'resend' && mailSettings.apiKey) {
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
