import { NextResponse } from 'next/server';
import { sendSmsMessage } from '@/lib/sms';

export async function POST(request) {
  try {
    const { storeId = 'default', phone, testMessage } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Recipient phone number is required' },
        { status: 400 }
      );
    }

    const message = testMessage || `[BazarPOS Test] Your SMS Gateway is configured and operational! Sent at ${new Date().toLocaleTimeString()}`;

    const result = await sendSmsMessage({
      storeId,
      phone,
      message
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || `Test SMS sent to ${phone} successfully!`
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message || 'Failed to dispatch test SMS'
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
