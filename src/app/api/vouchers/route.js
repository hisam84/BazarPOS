import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({
      success: true,
      vouchers: storeData.vouchers || [],
      voucherCounter: storeData.voucherCounter || 1001
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      storeId = 'default',
      clientName,
      clientPhone,
      salerName,
      items = [],
      totalAmount = 0,
      paidAmount = 0,
      discount = 0,
      paymentMethod = 'Cash',
      note = ''
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Voucher must have at least one item' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    storeData.voucherCounter = (storeData.voucherCounter || 1000) + 1;
    const voucherNo = 'INV-' + storeData.voucherCounter;

    const grandTotal = Math.max(0, Number(totalAmount) - Number(discount));
    const dueAmount = Math.max(0, grandTotal - Number(paidAmount));
    const status = dueAmount === 0 ? 'PAID' : (Number(paidAmount) > 0 ? 'PARTIAL' : 'DUE');

    // Calculate total cost & profit
    let totalCost = 0;
    items.forEach(item => {
      totalCost += (Number(item.costPrice) || 0) * (Number(item.quantity) || 1);
    });
    const profit = Math.max(0, grandTotal - totalCost);

    const newVoucher = {
      id: 'v_' + Date.now(),
      voucherNo,
      date: new Date().toISOString(),
      clientName: clientName || 'Walk-in Customer',
      clientPhone: clientPhone || '',
      salerName: salerName || 'Main Counter',
      items,
      subTotal: Number(totalAmount),
      discount: Number(discount),
      totalAmount: grandTotal,
      paidAmount: Number(paidAmount),
      dueAmount,
      status,
      paymentMethod,
      totalCost,
      profit,
      note
    };

    // Deduct stock from products
    storeData.products = (storeData.products || []).map(p => {
      const purchased = items.find(i => i.code === p.code || i.id === p.id);
      if (purchased) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - Number(purchased.quantity || 1))
        };
      }
      return p;
    });

    // Update Client Due if applicable
    if (clientName && dueAmount > 0) {
      const client = (storeData.clients || []).find(c => c.name === clientName);
      if (client) {
        client.due = (Number(client.due) || 0) + dueAmount;
      }
    }

    storeData.vouchers = storeData.vouchers || [];
    storeData.vouchers.unshift(newVoucher);

    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, voucher: newVoucher });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId') || 'default';

    if (!id) {
      return NextResponse.json({ success: false, message: 'Voucher ID required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    storeData.vouchers = (storeData.vouchers || []).filter(v => v.id !== id);
    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, message: 'Voucher deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
