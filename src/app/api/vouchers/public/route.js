import { NextResponse } from 'next/server';
import { getStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get('id') || searchParams.get('token') || '').trim();
    const storeId = searchParams.get('storeId') || 'default';

    if (!token) {
      return NextResponse.json({ success: false, message: 'Secure access token is required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    
    // SECURITY CHECK:
    // Only allow matching via cryptographic publicToken or secure ID.
    // Explicitly reject direct sequential invoice numbers (e.g., INV-1001) to prevent URL tampering & enumeration.
    const voucher = (storeData.vouchers || []).find(v => 
      (v.publicToken && v.publicToken === token) || 
      (v.id && v.id === token)
    );

    if (!voucher) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invoice not found or access denied. Direct sequential invoice numbers cannot be viewed without the secret link.' 
      }, { status: 404 });
    }

    const company = storeData.company || {};
    const settings = storeData.company?.invoiceSettings || storeData.invoiceSettings || {};

    // Sanitize and protect internal store data (hide profit, totalCost, internal supplier notes)
    const sanitizedVoucher = {
      id: voucher.id,
      publicToken: voucher.publicToken,
      voucherNo: voucher.voucherNo,
      date: voucher.date,
      clientName: voucher.clientName,
      clientPhone: voucher.clientPhone,
      salerName: voucher.salerName,
      items: (voucher.items || []).map(it => ({
        name: it.name,
        code: it.code,
        unit: it.unit,
        warranty: it.warranty,
        serialNumber: it.serialNumber || it.serialNo || '',
        description: it.description || '',
        unitPrice: Number(it.unitPrice || 0),
        quantity: Number(it.quantity || 1),
        discount: Number(it.discount || 0)
      })),
      subTotal: Number(voucher.subTotal || 0),
      discount: Number(voucher.discount || 0),
      totalAmount: Number(voucher.totalAmount || 0),
      paidAmount: Number(voucher.paidAmount || 0),
      dueAmount: Number(voucher.dueAmount || 0),
      status: voucher.status,
      paymentMethod: voucher.paymentMethod,
      note: voucher.note
    };

    return NextResponse.json({
      success: true,
      voucher: sanitizedVoucher,
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
