import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({ success: true, purchases: storeData.purchases || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', supplierName, productCode, quantity, unitCost, totalCost, note } = body;

    if (!productCode || !quantity || Number(quantity) <= 0) {
      return NextResponse.json({ success: false, message: 'Product code and valid quantity required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    
    // Find Product & increase stock!
    const productIndex = (storeData.products || []).findIndex(p => p.code === productCode);
    if (productIndex === -1) {
      return NextResponse.json({ success: false, message: 'Product code not found in inventory' }, { status: 404 });
    }

    const recQty = Number(quantity);
    const cost = Number(unitCost) || storeData.products[productIndex].costPrice;

    // Auto update stock & cost price
    storeData.products[productIndex].quantity = (storeData.products[productIndex].quantity || 0) + recQty;
    if (unitCost && Number(unitCost) > 0) {
      storeData.products[productIndex].costPrice = cost;
    }

    const purchaseEntry = {
      id: 'po_' + Date.now(),
      date: new Date().toISOString(),
      supplierName: supplierName || 'General Supplier',
      productCode,
      productName: storeData.products[productIndex].name,
      quantity: recQty,
      unitCost: cost,
      totalCost: Number(totalCost) || (cost * recQty),
      note: note || ''
    };

    storeData.purchases = storeData.purchases || [];
    storeData.purchases.unshift(purchaseEntry);

    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, purchase: purchaseEntry, updatedProduct: storeData.products[productIndex] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
