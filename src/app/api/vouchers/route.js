import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    const storeData = await getStoreData(storeId);

    // Auto-upgrade legacy vouchers with secure publicToken if missing
    let modified = false;
    const vouchers = (storeData.vouchers || []).map(v => {
      if (!v.publicToken) {
        v.publicToken = 'inv_' + crypto.randomBytes(16).toString('hex');
        modified = true;
      }
      return v;
    });

    if (modified) {
      storeData.vouchers = vouchers;
      await saveStoreData(storeId, storeData);
    }

    return NextResponse.json({
      success: true,
      vouchers: vouchers,
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

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Voucher must have at least one item' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.voucherCounter = (storeData.voucherCounter || 1000) + 1;
    
    // Read custom invoice prefix from store settings (default to INV-)
    const rawPrefix = (storeData.company?.invoiceSettings?.invoicePrefix || storeData.invoiceSettings?.invoicePrefix || 'INV-').trim();
    const prefix = rawPrefix ? (
      rawPrefix.endsWith('-') || rawPrefix.endsWith('/') || rawPrefix.endsWith('_') || rawPrefix.endsWith('#')
        ? rawPrefix
        : rawPrefix + '-'
    ) : 'INV-';
    const voucherNo = prefix + storeData.voucherCounter;

    const grandTotal = Math.max(0, Number(totalAmount) - Number(discount));
    const dueAmount = Math.max(0, grandTotal - Number(paidAmount));
    const status = dueAmount === 0 ? 'PAID' : (Number(paidAmount) > 0 ? 'PARTIAL' : 'DUE');

    // Calculate total cost & profit
    let totalCost = 0;
    items.forEach(item => {
      totalCost += (Number(item.costPrice) || 0) * (Number(item.quantity) || 1);
    });
    const profit = Math.max(0, grandTotal - totalCost);

    // Secure non-guessable random token for public link sharing (prevents URL guessing/IDOR)
    const publicToken = 'inv_' + crypto.randomBytes(16).toString('hex');
    const voucherId = 'v_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

    // Resolve client phone from client list if not directly provided
    let resolvedPhone = (clientPhone || '').trim();
    if (!resolvedPhone && clientName && clientName !== 'Walk-in Customer') {
      const matchedClient = (storeData.clients || []).find(c => c.name === clientName || c.id === clientName);
      if (matchedClient?.phone) {
        resolvedPhone = matchedClient.phone.trim();
      }
    }

    const newVoucher = {
      id: voucherId,
      publicToken,
      voucherNo,
      date: new Date().toISOString(),
      clientName: clientName || 'Walk-in Customer',
      clientPhone: resolvedPhone,
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

    await saveStoreData(storeId, storeData);

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

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Voucher ID required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.vouchers = (storeData.vouchers || []).filter(v => v.id !== id);
    await saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, message: 'Voucher deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
