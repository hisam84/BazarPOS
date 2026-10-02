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
  // Templates
  templates: {
    invoice: 'Dear {{customer_name}}, thank you for shopping at {{company_name}}. Invoice: #{{invoice_no}}, Total: {{total_amount}}, Paid: {{paid_amount}}, Due: {{due_amount}}. View invoice: {{invoice_link}}',
    due_reminder: 'Dear {{customer_name}}, you have an outstanding due balance of {{due_amount}} at {{company_name}} for Invoice #{{invoice_no}}. Please settle at your earliest convenience.',
    otp: 'Your {{company_name}} verification OTP code is {{otp_code}}. Valid for 15 minutes.'
  }
};
