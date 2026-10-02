import { NextResponse } from 'next/server';
import { getStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId') || 'default';

    if (!id) {
      return NextResponse.json({ success: false, message: 'Invoice ID or number required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    const voucher = (storeData.vouchers || []).find(v => v.id === id || v.voucherNo === id);

    if (!voucher) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }

    const company = storeData.company || {};
    const settings = storeData.company?.invoiceSettings || storeData.invoiceSettings || {};

    return NextResponse.json({
      success: true,
      voucher,
      company: {
        name: company.name || 'BazarPOS Outlet',
        tagline: company.tagline || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        address: company.address || '',
        logoUrl: company.logoUrl || ''
      },
      settings
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
