import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { DEFAULT_SMS_SETTINGS } from '@/lib/sms';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const storeData = await getStoreData(storeId);
    const smsSettings = storeData.smsSettings || storeData.company?.smsSettings || DEFAULT_SMS_SETTINGS;

    return NextResponse.json({
      success: true,
      smsSettings: { ...DEFAULT_SMS_SETTINGS, ...smsSettings }
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
    const { storeId = 'default', smsSettings } = body;

    if (!smsSettings) {
      return NextResponse.json(
        { success: false, message: 'Missing smsSettings payload' },
        { status: 400 }
      );
    }

    const storeData = await getStoreData(storeId);
    storeData.smsSettings = { ...DEFAULT_SMS_SETTINGS, ...smsSettings };

    if (storeData.company) {
      storeData.company.smsSettings = storeData.smsSettings;
    }

    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      message: 'SMS Gateway settings saved successfully',
      smsSettings: storeData.smsSettings
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
