/**
 * BazarPOS Email Templates & Variable Interpolator Engine
 */

export const DEFAULT_EMAIL_TEMPLATES = {
  invoice: {
    id: 'invoice',
    name: 'Digital Sales Invoice',
    category: 'Billing & POS',
    description: 'Sent to customers when a sale is completed or when emailing an invoice.',
    subject: 'Invoice #{{invoice_no}} from {{company_name}}',
    variables: [
      { key: '{{company_name}}', desc: 'Store / Company Name' },
      { key: '{{company_phone}}', desc: 'Store Phone Number' },
      { key: '{{company_email}}', desc: 'Store Email Address' },
      { key: '{{company_address}}', desc: 'Store Address' },
      { key: '{{logo_url}}', desc: 'Store Logo URL' },
      { key: '{{customer_name}}', desc: 'Customer / Client Name' },
      { key: '{{customer_phone}}', desc: 'Customer Phone Number' },
      { key: '{{invoice_no}}', desc: 'Invoice / Voucher Number' },
      { key: '{{invoice_date}}', desc: 'Date of Sale / Issue' },
      { key: '{{invoice_link}}', desc: 'Online Digital Invoice Link' },
      { key: '{{items_table}}', desc: 'HTML Table Rows for Purchased Items' },
      { key: '{{subtotal}}', desc: 'Subtotal Amount (formatted)' },
      { key: '{{discount}}', desc: 'Discount Amount (formatted)' },
      { key: '{{tax}}', desc: 'Tax / VAT Amount (formatted)' },
      { key: '{{total_amount}}', desc: 'Total Payable Amount (formatted)' },
      { key: '{{paid_amount}}', desc: 'Amount Paid (formatted)' },
      { key: '{{due_amount}}', desc: 'Remaining Due Amount (formatted)' },
      { key: '{{payment_status}}', desc: 'PAID / PARTIAL / DUE status' },
      { key: '{{saler_name}}', desc: 'Cashier / Sales Representative' }
    ],
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; color: #1e293b;">
  <div style="background-color: #ffffff; padding: 28px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; text-align: left;">
      {{#if logo_url}}
      <div style="margin-bottom: 10px;">
        <img src="{{logo_url}}" alt="{{company_name}}" style="max-height: 48px; max-width: 180px; object-fit: contain;" />
      </div>
      {{/if}}
      <h2 style="margin: 0 0 4px 0; color: #0f172a; font-size: 22px; font-weight: 800;">{{company_name}}</h2>
      <p style="margin: 0; color: #64748b; font-size: 12px;">Official Sales Receipt & Invoice</p>
    </div>

    <!-- Summary Info -->
    <table style="width: 100%; margin-bottom: 20px; font-size: 12px; color: #475569; border-collapse: collapse;">
      <tr>
        <td style="padding: 4px 0;"><strong>Invoice #:</strong> <span style="color: #0f172a; font-weight: bold;">{{invoice_no}}</span></td>
        <td style="text-align: right; padding: 4px 0;"><strong>Date:</strong> {{invoice_date}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0;"><strong>Customer:</strong> {{customer_name}}</td>
        <td style="text-align: right; padding: 4px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 8px; border-radius: 6px; border: 1px solid #a7f3d0;">{{payment_status}}</span></td>
      </tr>
      {{#if customer_phone}}
      <tr>
        <td style="padding: 4px 0;"><strong>Phone:</strong> {{customer_phone}}</td>
        <td style="text-align: right; padding: 4px 0;"><strong>Served By:</strong> {{saler_name}}</td>
      </tr>
      {{/if}}
    </table>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
          <th style="padding: 10px 8px;">Item Description</th>
          <th style="padding: 10px 8px; text-align: center;">Qty</th>
          <th style="padding: 10px 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table}}
      </tbody>
    </table>

    <!-- Financial Breakdown -->
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 10px; margin-bottom: 24px; font-size: 13px; border: 1px solid #e2e8f0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
          <td style="text-align: right; font-weight: 600; color: #0f172a;">{{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Discount:</td>
          <td style="text-align: right; color: #dc2626; font-weight: 600;">-{{discount}}</td>
        </tr>
        <tr style="border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 8px 0; font-size: 16px; font-weight: 800; color: #2563eb;">Grand Total:</td>
          <td style="text-align: right; font-size: 16px; font-weight: 800; color: #2563eb;">{{total_amount}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0 2px 0; color: #059669; font-weight: 600;">Paid Amount:</td>
          <td style="text-align: right; color: #059669; font-weight: bold;">{{paid_amount}}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0 4px 0; color: #d97706; font-weight: 600;">Due Balance:</td>
          <td style="text-align: right; color: #d97706; font-weight: bold;">{{due_amount}}</td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="{{invoice_link}}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
        📥 View &amp; Print Full Tax Invoice
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Thank you for your business with {{company_name}}!</p>
      <p style="margin: 0;">{{company_address}} | Hotline: {{company_phone}} | Email: {{company_email}}</p>
    </div>
  </div>
</div>`
  },

  password_reset: {
    id: 'password_reset',
    name: 'Password Reset Verification',
    category: 'Security & Auth',
    description: 'Sent when an owner or staff member requests to reset their forgotten password.',
    subject: '[{{company_name}}] Password Reset Verification Code: {{otp_code}}',
    variables: [
      { key: '{{company_name}}', desc: 'Store / Company Name' },
      { key: '{{logo_url}}', desc: 'Store Logo URL' },
      { key: '{{user_name}}', desc: 'Staff / Owner Full Name or Username' },
      { key: '{{user_role}}', desc: 'User Role (e.g. Owner, Manager, Cashier)' },
      { key: '{{user_email}}', desc: 'User Registered Email Address' },
      { key: '{{otp_code}}', desc: '6-digit Security Verification Code' },
      { key: '{{expiry_minutes}}', desc: 'Code Expiration Time in Minutes (e.g. 15)' }
    ],
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 20px; border-radius: 12px; color: #ffffff; text-align: center;">
    {{#if logo_url}}
    <div style="margin-bottom: 12px; text-align: center;">
      <img src="{{logo_url}}" alt="{{company_name}} Logo" style="max-height: 48px; max-width: 160px; object-fit: contain; border-radius: 8px; background: #ffffff; padding: 4px;" />
    </div>
    {{/if}}
    <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">{{company_name}}</h1>
    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Password Recovery &amp; Security Portal</p>
  </div>

  <div style="padding: 24px 8px; line-height: 1.6;">
    <p style="font-size: 14px; margin-top: 0;">Hello <strong>{{user_name}}</strong> ({{user_role}}),</p>
    <p style="font-size: 13px; color: #475569;">
      We received a request to reset the password for your <strong>{{company_name}}</strong> account ({{user_email}}). Use the 6-digit verification code below to proceed:
    </p>

    <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
      <span style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #2563eb; font-family: monospace;">{{otp_code}}</span>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">Valid for {{expiry_minutes}} minutes only</p>
    </div>

    <p style="font-size: 12px; color: #64748b;">
      If you did not request this password reset, please ignore this email or notify your system administrator immediately.
    </p>
  </div>

  <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
    This is an automated security message from {{company_name}} Cloud POS ERP. Please do not reply directly to this email.
  </div>
</div>`
  },

  low_stock: {
    id: 'low_stock',
    name: 'Low Stock Alert Notification',
    category: 'Inventory & Alerts',
    description: 'Sent to store managers when an item stock drops below its reorder threshold.',
    subject: '⚠️ Low Stock Alert: {{product_name}} (Only {{current_stock}} left) - {{company_name}}',
    variables: [
      { key: '{{company_name}}', desc: 'Store / Company Name' },
      { key: '{{product_name}}', desc: 'Product Name' },
      { key: '{{product_code}}', desc: 'Product Code / SKU' },
      { key: '{{current_stock}}', desc: 'Current Remaining Units' },
      { key: '{{reorder_level}}', desc: 'Minimum Alert Threshold' },
      { key: '{{unit}}', desc: 'Unit of Measure (pcs, kg, etc.)' },
      { key: '{{date}}', desc: 'Date and Time of Alert' }
    ],
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #fffaf5; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 18px; border-radius: 12px; color: #ffffff; text-align: center;">
    <h2 style="margin: 0; font-size: 18px; font-weight: bold;">⚠️ Low Stock Warning Alert</h2>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.95;">{{company_name}} Inventory Notification</p>
  </div>

  <div style="padding: 20px 8px; line-height: 1.6; background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px solid #fed7aa;">
    <p style="font-size: 13px; margin-top: 0; color: #334155;">
      Attention Store Manager, the inventory level for <strong>{{product_name}}</strong> has fallen below the safety threshold.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;">Product Name:</td>
        <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">{{product_name}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;">Product Code (SKU):</td>
        <td style="padding: 8px 0; font-mono; color: #334155;">{{product_code}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #ea580c; font-weight: bold;">Current Stock:</td>
        <td style="padding: 8px 0; font-weight: 800; color: #dc2626; font-size: 15px;">{{current_stock}} {{unit}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Reorder Level:</td>
        <td style="padding: 8px 0; color: #334155;">{{reorder_level}} {{unit}}</td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
      Please restock or issue a Purchase Order to maintain uninterrupted retail operations.
    </p>
  </div>

  <div style="padding-top: 14px; text-align: center; font-size: 11px; color: #9a3412;">
    Generated automatically by {{company_name}} BazarPOS Inventory Tracker at {{date}}.
  </div>
</div>`
  },

  daily_summary: {
    id: 'daily_summary',
    name: 'Daily Sales & Revenue Summary',
    category: 'Reports & Analytics',
    description: 'Sent at day close to summarize gross sales, collections, profit, and order metrics.',
    subject: '📊 Daily Sales Summary - {{date}} ({{company_name}})',
    variables: [
      { key: '{{company_name}}', desc: 'Store / Company Name' },
      { key: '{{date}}', desc: 'Summary Reporting Date' },
      { key: '{{total_sales}}', desc: 'Total Sales Revenue (formatted)' },
      { key: '{{total_orders}}', desc: 'Total Invoices / Orders Count' },
      { key: '{{cash_received}}', desc: 'Cash Collected (formatted)' },
      { key: '{{due_collected}}', desc: 'Due / Credit Collected (formatted)' },
      { key: '{{total_profit}}', desc: 'Estimated Gross Profit (formatted)' },
      { key: '{{top_products}}', desc: 'Top Selling Products Summary' }
    ],
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #059669, #047857); padding: 20px; border-radius: 12px; color: #ffffff; text-align: center;">
    <h2 style="margin: 0; font-size: 20px; font-weight: bold;">Daily Business Performance Report</h2>
    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">{{company_name}} | Date: {{date}}</p>
  </div>

  <div style="padding: 20px 0;">
    <!-- Metric Cards Grid -->
    <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 16px;">
      <tr>
        <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; width: 50%;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block;">Total Revenue</span>
          <span style="font-size: 20px; font-weight: 800; color: #059669; display: block; margin-top: 4px;">{{total_sales}}</span>
        </td>
        <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; width: 50%;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block;">Total Orders</span>
          <span style="font-size: 20px; font-weight: 800; color: #2563eb; display: block; margin-top: 4px;">{{total_orders}}</span>
        </td>
      </tr>
      <tr>
        <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; width: 50%;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block;">Cash Received</span>
          <span style="font-size: 18px; font-weight: bold; color: #0f172a; display: block; margin-top: 4px;">{{cash_received}}</span>
        </td>
        <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; width: 50%;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block;">Gross Profit</span>
          <span style="font-size: 18px; font-weight: bold; color: #10b981; display: block; margin-top: 4px;">{{total_profit}}</span>
        </td>
      </tr>
    </table>

    <div style="background: #f1f5f9; padding: 14px; border-radius: 10px; font-size: 12px; color: #475569;">
      <strong>Top Selling Products:</strong>
      <div style="margin-top: 6px;">{{top_products}}</div>
    </div>
  </div>

  <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
    Automated Daily Digest generated by {{company_name}} BazarPOS ERP.
  </div>
</div>`
  }
};

/**
 * Render email template content by interpolating variable map
 * Supports {{variable}}, {{ variable }}, and conditional {{#if variable}}...{{/if}}
 */
export function renderTemplate(templateString = '', variables = {}) {
  if (!templateString) return '';

  let rendered = templateString;

  // 1. Process conditional blocks: {{#if key}} content {{/if}}
  rendered = rendered.replace(/\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, innerContent) => {
    const val = variables[key];
    if (val && String(val).trim() !== '' && val !== '0' && val !== 0 && val !== false) {
      return innerContent;
    }
    return '';
  });

  // 2. Replace variables: {{key}} and {{ key }}
  rendered = rendered.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (key in variables) {
      const val = variables[key];
      return val !== null && val !== undefined ? String(val) : '';
    }
    return match;
  });

  return rendered;
}

/**
 * Get active template for a store, falling back to default
 */
export function getStoreTemplate(storeData, templateId) {
  const customTemplates = storeData?.mailTemplates || storeData?.mailSettings?.templates || {};
  const defaultTemplate = DEFAULT_EMAIL_TEMPLATES[templateId] || DEFAULT_EMAIL_TEMPLATES.invoice;

  if (customTemplates[templateId]) {
    return {
      ...defaultTemplate,
      ...customTemplates[templateId]
    };
  }

  return defaultTemplate;
}
