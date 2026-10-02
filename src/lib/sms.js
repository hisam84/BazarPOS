import { getStoreData } from './db';
import { renderTemplate } from './email-templates';
import { DEFAULT_SMS_SETTINGS } from './sms-constants';

export { DEFAULT_SMS_SETTINGS };

/**
 * Clean and format Bangladeshi or international phone number
 */
export function formatPhoneNumber(phone = '', format = '880') {
  let cleaned = String(phone).replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);

  // If local Bangladeshi number starting with 01
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    if (format === '880') return `880${cleaned.substring(1)}`;
    if (format === '01') return cleaned;
  }

  // If starts with 8801
  if (cleaned.startsWith('8801') && cleaned.length === 13) {
    if (format === '01') return `0${cleaned.substring(3)}`;
    return cleaned;
  }

  return cleaned;
}

/**
 * Dispatch SMS via configured Gateway
 */
export async function sendSmsMessage({ storeId = 'default', phone, message, templateId, variables = {} }) {
  if (!phone) {
    return { success: false, message: 'Phone number is required' };
  }

  const storeData = await getStoreData(storeId);
  const smsSettings = {
    ...DEFAULT_SMS_SETTINGS,
    ...(storeData.smsSettings || storeData.company?.smsSettings || {})
  };

  if (!smsSettings.enabled) {
    return {
      success: false,
      configured: false,
      message: 'SMS Gateway is currently disabled in Settings.'
    };
  }

  // Prepare final text message
  let finalMessage = message;
  if (!finalMessage && templateId) {
    const template = smsSettings.templates?.[templateId] || DEFAULT_SMS_SETTINGS.templates[templateId];
    if (template) {
      finalMessage = renderTemplate(template, {
        company_name: storeData?.company?.name || 'BazarPOS Store',
        ...variables
      });
    }
  }

  if (!finalMessage) {
    return { success: false, message: 'SMS message content is empty' };
  }

  const provider = smsSettings.provider || 'bulksmsbd';

  try {
    // 1. BulkSMS BD Gateway (bulksmsbd.net)
    if (provider === 'bulksmsbd') {
      if (!smsSettings.apiKey) {
        throw new Error('BulkSMS BD API Key is missing. Please configure it in Settings.');
      }

      const formattedNumber = formatPhoneNumber(phone, '880');
      const params = new URLSearchParams({
        api_key: smsSettings.apiKey,
        type: 'text',
        number: formattedNumber,
        senderid: smsSettings.senderId || '',
        message: finalMessage
      });

      const res = await fetch(`https://bulksmsbd.net/api/smsapi?${params.toString()}`, {
        method: 'GET'
      });
      const resText = await res.text();

      // BulkSMS BD response typically JSON {"response_code": 202, "success_message": "..."}
      let resJson = null;
      try { resJson = JSON.parse(resText); } catch (e) {}

      if (resJson && (resJson.response_code === 202 || resJson.response_code === 200 || resJson.success_message)) {
        return {
          success: true,
          provider: 'bulksmsbd',
          recipient: formattedNumber,
          message: resJson.success_message || 'SMS dispatched successfully via BulkSMS BD'
        };
      }

      if (resJson && resJson.error_message) {
        throw new Error(`BulkSMS BD Error: ${resJson.error_message}`);
      }

      if (resText.includes('success') || resText.includes('202')) {
        return { success: true, provider: 'bulksmsbd', recipient: formattedNumber, message: 'SMS sent successfully' };
      }

      throw new Error(`BulkSMS BD response: ${resText}`);
    }

    // 2. Greenweb BD Gateway (greenweb.com.bd)
    if (provider === 'greenweb') {
      if (!smsSettings.apiKey) {
        throw new Error('Greenweb SMS Token is missing.');
      }

      const formattedNumber = formatPhoneNumber(phone, '880');
      const params = new URLSearchParams({
        token: smsSettings.apiKey,
        to: formattedNumber,
        message: finalMessage
      });

      const res = await fetch(`https://api.greenweb.com.bd/api.php?${params.toString()}`, {
        method: 'GET'
      });
      const resText = await res.text();

      if (resText.toLowerCase().includes('ok') || resText.toLowerCase().includes('success') || resText.includes('100')) {
        return {
          success: true,
          provider: 'greenweb',
          recipient: formattedNumber,
          message: 'SMS dispatched successfully via Greenweb BD'
        };
      }

      throw new Error(`Greenweb response: ${resText}`);
    }

    // 3. Mimi SMS Gateway (mimisms.com)
    if (provider === 'mimisms') {
      if (!smsSettings.apiKey) {
        throw new Error('Mimi SMS API Key is missing.');
      }

      const formattedNumber = formatPhoneNumber(phone, '880');
      const res = await fetch('https://api.mimisms.com/api/v1/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${smsSettings.apiKey}`
        },
        body: JSON.stringify({
          sender_id: smsSettings.senderId || 'Default',
          recipient: formattedNumber,
          message: finalMessage
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.status === 'success' || data.success)) {
        return {
          success: true,
          provider: 'mimisms',
          recipient: formattedNumber,
          message: 'SMS sent successfully via Mimi SMS'
        };
      }

      throw new Error(data.message || `Mimi SMS error (HTTP ${res.status})`);
    }

    // 4. Twilio SMS
    if (provider === 'twilio') {
      if (!smsSettings.username || !smsSettings.password) {
        throw new Error('Twilio Account SID (Username) and Auth Token (Password) are required.');
      }

      const formattedNumber = phone.startsWith('+') ? phone : `+${formatPhoneNumber(phone, '880')}`;
      const authHeader = 'Basic ' + Buffer.from(`${smsSettings.username}:${smsSettings.password}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('To', formattedNumber);
      formData.append('From', smsSettings.senderId || smsSettings.apiKey);
      formData.append('Body', finalMessage);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${smsSettings.username}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sid) {
        return {
          success: true,
          provider: 'twilio',
          recipient: formattedNumber,
          message: `SMS queued successfully via Twilio (SID: ${data.sid})`
        };
      }

      throw new Error(data.message || `Twilio error: ${data.detail || res.statusText}`);
    }

    // 5. Custom HTTP Gateway (Universal REST / Webhook)
    if (provider === 'custom') {
      if (!smsSettings.apiUrl) {
        throw new Error('Custom Gateway API URL is required.');
      }

      const formattedNumber = formatPhoneNumber(phone, '880');
      let targetUrl = smsSettings.apiUrl
        .replace(/\{phone\}|\{\{phone\}\}/g, encodeURIComponent(formattedNumber))
        .replace(/\{message\}|\{\{message\}\}/g, encodeURIComponent(finalMessage))
        .replace(/\{api_key\}|\{\{api_key\}\}/g, encodeURIComponent(smsSettings.apiKey || ''))
        .replace(/\{sender_id\}|\{\{sender_id\}\}/g, encodeURIComponent(smsSettings.senderId || ''));

      let res;
      if (smsSettings.httpMethod === 'GET') {
        res = await fetch(targetUrl, { method: 'GET' });
      } else {
        // POST JSON
        let reqBody = smsSettings.customBodyTemplate || '{"recipient": "{{phone}}", "message": "{{message}}"}';
        reqBody = reqBody
          .replace(/\{\{phone\}\}/g, formattedNumber)
          .replace(/\{\{message\}\}/g, finalMessage.replace(/"/g, '\\"'))
          .replace(/\{\{api_key\}\}/g, smsSettings.apiKey || '')
          .replace(/\{\{sender_id\}\}/g, smsSettings.senderId || '');

        res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody
        });
      }

      const resText = await res.text();
      if (res.ok) {
        return {
          success: true,
          provider: 'custom',
          recipient: formattedNumber,
          message: `Custom gateway dispatched (HTTP ${res.status})`
        };
      }

      throw new Error(`Custom SMS Gateway returned HTTP ${res.status}: ${resText.substring(0, 150)}`);
    }

    throw new Error(`Unsupported SMS provider: ${provider}`);
  } catch (error) {
    console.error('SMS Gateway Dispatch Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to dispatch SMS'
    };
  }
}
