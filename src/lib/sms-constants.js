export const DEFAULT_SMS_SETTINGS = {
  enabled: false,
  provider: 'bulksmsbd', // 'bulksmsbd' | 'greenweb' | 'mimisms' | 'twilio' | 'custom'
  apiKey: '',
  senderId: '',
  username: '', // Or Twilio Account SID
  password: '', // Or Twilio Auth Token
  apiUrl: '',   // For Custom HTTP Gateway
  httpMethod: 'POST_JSON', // 'GET' | 'POST_JSON' | 'POST_FORMDATA'
  customBodyTemplate: '{"recipient": "{{phone}}", "message": "{{message}}", "sender_id": "{{sender_id}}"}',
  // Automation Triggers
  sendInvoiceOnSale: false,
  sendLowStockAlert: false,
  sendDueReminder: false,
  sendWelcomeCustomer: false,
  // Templates
  templates: {
    invoice: 'Dear {{customer_name}}, thank you for shopping at {{company_name}}! Invoice: #{{invoice_no}}, Total: {{total_amount}}, Paid: {{paid_amount}}, Due: {{due_amount}}. View receipt: {{invoice_link}}',
    due_reminder: 'Dear {{customer_name}}, you have a pending due balance of {{due_amount}} at {{company_name}} for Invoice #{{invoice_no}}. Please settle at your earliest convenience. Hotline: {{company_phone}}',
    welcome_customer: 'Welcome to {{company_name}}! Your customer ID is {{customer_id}}. Thank you for connecting with us.',
    low_stock: '⚠️ Alert: Stock for {{product_name}} (Code: {{product_code}}) is low ({{current_stock}} left). Please restock. - {{company_name}}',
    otp: 'Your {{company_name}} security verification OTP code is {{otp_code}}. Valid for 15 minutes.'
  }
};

export const SMS_AVAILABLE_VARIABLES = [
  { key: '{{customer_name}}', desc: 'Customer Full Name' },
  { key: '{{customer_id}}', desc: 'Customer Unique ID' },
  { key: '{{company_name}}', desc: 'Store / Company Name' },
  { key: '{{company_phone}}', desc: 'Store Phone / Hotline' },
  { key: '{{invoice_no}}', desc: 'Invoice Number' },
  { key: '{{total_amount}}', desc: 'Grand Total Payable' },
  { key: '{{paid_amount}}', desc: 'Amount Paid' },
  { key: '{{due_amount}}', desc: 'Remaining Due Balance' },
  { key: '{{invoice_link}}', desc: 'Online Digital Invoice URL' },
  { key: '{{product_name}}', desc: 'Product Name (For stock alert)' },
  { key: '{{product_code}}', desc: 'Product SKU / Code' },
  { key: '{{current_stock}}', desc: 'Current Units in Stock' },
  { key: '{{otp_code}}', desc: 'Security OTP Code' },
  { key: '{{date}}', desc: 'Current Date' },
];
