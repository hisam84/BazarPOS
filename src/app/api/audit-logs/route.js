import { NextResponse } from 'next/server';
import { getStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({
      success: true,
      logs: storeData.auditLogs || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
