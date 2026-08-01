import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData, logAuditAction } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({
      success: true,
      stockAdjustments: storeData.stockAdjustments || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', username = 'admin', productCode, type = 'damage', quantity, reason } = body;

    if (!productCode || !quantity || Number(quantity) <= 0) {
      return NextResponse.json({ success: false, message: 'Valid product code and quantity required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    const prodIdx = (storeData.products || []).findIndex(p => p.code === productCode);

    if (prodIdx === -1) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const adjQty = Number(quantity);
    const currentQty = storeData.products[prodIdx].quantity || 0;

    if (type === 'damage' || type === 'loss' || type === 'theft') {
      storeData.products[prodIdx].quantity = Math.max(0, currentQty - adjQty);
    } else if (type === 'addition') {
      storeData.products[prodIdx].quantity = currentQty + adjQty;
    }

    const adjustmentRecord = {
      id: 'adj_' + Date.now(),
      date: new Date().toISOString(),
      productCode,
      productName: storeData.products[prodIdx].name,
      type,
      quantity: adjQty,
      previousQuantity: currentQty,
      newQuantity: storeData.products[prodIdx].quantity,
      reason: reason || 'Manual adjustment',
      performedBy: username
    };

    storeData.stockAdjustments = storeData.stockAdjustments || [];
    storeData.stockAdjustments.unshift(adjustmentRecord);
    saveStoreData(storeId, storeData);

    logAuditAction(
      storeId,
      username,
      'STOCK_ADJUSTMENT',
      `Adjusted stock for ${productCode} (${type}): ${adjQty} units. Reason: ${reason || 'N/A'}`
    );

    return NextResponse.json({
      success: true,
      adjustment: adjustmentRecord,
      updatedProduct: storeData.products[prodIdx]
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
