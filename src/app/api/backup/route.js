import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const auth = verifyApiAuth(request, {
      requiredStoreId: storeId,
      allowedRoles: ['superadmin', 'owner', 'manager']
    });
    if (!auth.authenticated) return auth.errorResponse;

    const storeData = await getStoreData(storeId);

    return NextResponse.json({
      version: '4.0.0',
      exportDate: new Date().toISOString(),
      storeId,
      data: storeData
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', backupData } = body;

    const auth = verifyApiAuth(request, {
      requiredStoreId: storeId,
      allowedRoles: ['superadmin', 'owner']
    });
    if (!auth.authenticated) return auth.errorResponse;

    if (!backupData || typeof backupData !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid backup payload' }, { status: 400 });
    }

    const restoredData = backupData.data || backupData;
    await saveStoreData(storeId, restoredData);

    return NextResponse.json({ success: true, message: 'Store database successfully restored!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

