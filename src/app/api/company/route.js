import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({ success: true, company: storeData.company || {} });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', ...companyInfo } = body;

    const storeData = getStoreData(storeId);
    storeData.company = {
      ...storeData.company,
      ...companyInfo
    };

    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, company: storeData.company });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
