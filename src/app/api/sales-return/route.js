import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const invoiceQuery = searchParams.get('searchInvoice');

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    const storeData = await getStoreData(storeId);
    const returns = storeData.salesReturns || [];

    // If searching for an invoice to return
    if (invoiceQuery) {
      const q = invoiceQuery.toLowerCase().trim();
      const vouchers = storeData.vouchers || [];
      const matched = vouchers.filter(v => 
        (v.voucherNumber && v.voucherNumber.toLowerCase().includes(q)) ||
        (v.voucherNo && v.voucherNo.toLowerCase().includes(q)) ||
        (v.id && v.id.toLowerCase().includes(q)) ||
        (v.clientName && v.clientName.toLowerCase().includes(q)) ||
        (v.clientPhone && v.clientPhone.includes(q)) ||
        (v.items && v.items.some(it => 
          (it.code && it.code.toLowerCase().includes(q)) ||
          (it.name && it.name.toLowerCase().includes(q)) ||
          (it.serialNumber && it.serialNumber.toLowerCase().includes(q)) ||
          (it.serial && it.serial.toLowerCase().includes(q))
        ))
      );
      return NextResponse.json({ success: true, vouchers: matched });
    }

    return NextResponse.json({ success: true, returns });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      storeId = 'default',
      voucherId,
      voucherNo,
      clientId,
      clientName,
      clientPhone,
      itemsReturned = [],
      totalRefundAmount = 0,
      refundMethod = 'Cash',
      returnType = 'refund', // 'refund' | 'warranty_replacement' | 'warranty_service'
      status = 'Refunded', // 'Refunded' | 'Replacement Issued' | 'Sent for Service' | 'Under Inspection'
      notes = '',
      processedBy = 'Admin'
    } = body;

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    if (!itemsReturned || itemsReturned.length === 0) {
      return NextResponse.json({ success: false, message: 'Please select at least one item to return or claim warranty.' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.salesReturns = storeData.salesReturns || [];
    storeData.products = storeData.products || [];
    storeData.clients = storeData.clients || [];

    // Generate Return ID
    const returnCount = storeData.salesReturns.length;
    const returnNumber = `RET-${1001 + returnCount}`;

    const returnRecord = {
      id: 'ret_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      returnNumber,
      voucherId: voucherId || '',
      voucherNo: voucherNo || '',
      clientId: clientId || '',
      clientName: clientName || 'Walk-in Customer',
      clientPhone: clientPhone || '',
      itemsReturned: itemsReturned.map(it => ({
        productId: it.productId || it.id,
        productCode: it.productCode || it.code || '',
        name: it.name || '',
        brand: it.brand || '',
        warrantyType: it.warrantyType || '',
        serialNumber: it.serialNumber || it.serial || '',
        returnedQty: Number(it.returnedQty) || 1,
        unitPrice: Number(it.unitPrice) || Number(it.price) || 0,
        refundAmount: Number(it.refundAmount) || 0,
        reason: it.reason || 'Customer Return',
        condition: it.condition || 'Restock to Inventory' // 'Restock to Inventory' | 'Defective / Damaged' | 'Supplier Warranty'
      })),
      totalRefundAmount: Number(totalRefundAmount) || 0,
      refundMethod,
      returnType,
      status,
      notes,
      processedBy,
      createdAt: new Date().toISOString()
    };

    // 1. Process Inventory Adjustments for Restockable Items
    for (const retItem of returnRecord.itemsReturned) {
      if (retItem.condition === 'Restock to Inventory' && retItem.productId) {
        const prodIndex = storeData.products.findIndex(p => p.id === retItem.productId || p.code === retItem.productCode);
        if (prodIndex !== -1) {
          storeData.products[prodIndex].quantity = (Number(storeData.products[prodIndex].quantity) || 0) + Number(retItem.returnedQty);
        }
      }
    }

    // 2. Adjust Customer Due if refundMethod is 'Adjust Customer Due' or customer has due
    if (refundMethod === 'Adjust Customer Due' && clientId && Number(totalRefundAmount) > 0) {
      const clientIndex = storeData.clients.findIndex(c => c.id === clientId || c.name === clientName);
      if (clientIndex !== -1) {
        storeData.clients[clientIndex].due = Math.max(0, (Number(storeData.clients[clientIndex].due) || 0) - Number(totalRefundAmount));
      }
    }

    // 3. Save Sales Return Record
    storeData.salesReturns.unshift(returnRecord);
    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      message: 'Sales return / warranty claim processed successfully!',
      salesReturn: returnRecord
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
