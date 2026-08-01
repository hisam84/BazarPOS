import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: 'Phone number and message required' }, { status: 400 });
    }

    // Standardized SMS payload simulation (integratable with BulkSMSBD / Greenweb / Twilio)
    console.log(`[SMS GATEWAY LOG] Sending SMS to ${phone}: ${message}`);

    return NextResponse.json({
      success: true,
      message: `SMS successfully queued for ${phone}`
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
