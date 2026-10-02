import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

const DEFAULT_MAIL_SETTINGS = {
  enabled: false,
  provider: 'smtp', // 'smtp' | 'resend' | 'sendgrid' | 'mailgun' | 'gmail'
  fromName: 'BazarPOS Store',
  fromEmail: 'noreply@bazarpos.com',
  replyTo: '',
  // SMTP Config
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpSecure: 'tls', // 'tls' | 'ssl' | 'none'
  smtpUser: '',
  smtpPassword: '',
  // API Config
  apiKey: '',
  domain: '',
  // Automation Toggles
  sendInvoiceOnSale: false,
  sendLowStockAlert: true,
  sendDailySummary: false
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const storeData = await getStoreData(storeId);
    const mailSettings = storeData.mailSettings || storeData.company?.mailSettings || DEFAULT_MAIL_SETTINGS;

    return NextResponse.json({
      success: true,
      mailSettings: { ...DEFAULT_MAIL_SETTINGS, ...mailSettings }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', mailSettings } = body;

    if (!mailSettings) {
      return NextResponse.json(
        { success: false, message: 'Missing mailSettings payload' },
        { status: 400 }
      );
    }

    const storeData = await getStoreData(storeId);
    storeData.mailSettings = { ...DEFAULT_MAIL_SETTINGS, ...mailSettings };
    
    // Also save in company object for legacy compatibility
    if (storeData.company) {
      storeData.company.mailSettings = storeData.mailSettings;
    }

    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      message: 'Mailing settings saved successfully',
      mailSettings: storeData.mailSettings
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
