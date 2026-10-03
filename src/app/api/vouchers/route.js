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
      note = '',
      saleNote = '',
      paymentNote = '',
      previousDue = 0,
      includePreviousDue = false
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

    const itemsSubTotal = Number(totalAmount) || 0;
    const discountAmount = Number(discount) || 0;
    const itemsTotal = Math.max(0, itemsSubTotal - discountAmount);
    const prevDueAmount = (includePreviousDue && Number(previousDue) > 0) ? Number(previousDue) : 0;
    const grandTotal = itemsTotal + prevDueAmount;
    const dueAmount = Math.max(0, grandTotal - Number(paidAmount));
    const status = dueAmount === 0 ? 'PAID' : (Number(paidAmount) > 0 ? 'PARTIAL' : 'DUE');

    // Calculate total cost & profit
    let totalCost = 0;
    items.forEach(item => {
      totalCost += (Number(item.costPrice) || 0) * (Number(item.quantity) || 1);
    });
    const profit = Math.max(0, itemsTotal - totalCost);

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
      subTotal: itemsSubTotal,
      discount: discountAmount,
      previousDue: prevDueAmount,
      includePreviousDue: Boolean(includePreviousDue && prevDueAmount > 0),
      totalAmount: grandTotal,
      paidAmount: Number(paidAmount),
      dueAmount,
      status,
      paymentMethod,
      totalCost,
      profit,
      note: note || saleNote || '',
      saleNote: saleNote || '',
      paymentNote: paymentNote || ''
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

    // Update Client Due if applicable and settle older due vouchers
    if (clientName && clientName !== 'Walk-in Customer') {
      const client = (storeData.clients || []).find(c => c.name === clientName || c.id === clientName);
      if (client) {
        if (includePreviousDue && prevDueAmount > 0) {
          // Previous due was factored into this invoice, so client's remaining due is now this voucher's dueAmount
          client.due = dueAmount;
        } else if (dueAmount > 0) {
          // Added new due on top of existing due
          client.due = (Number(client.due) || 0) + dueAmount;
        }
      }
    }

    // Auto-settle older due vouchers when previous due is included and paid
    if (includePreviousDue && prevDueAmount > 0 && storeData.vouchers?.length > 0) {
      // Calculate how much payment went toward previous due
      const prevDuePaid = Math.min(prevDueAmount, Math.max(0, Number(paidAmount) - itemsTotal));
      
      if (prevDuePaid > 0) {
        let remainingToClear = prevDuePaid;
        // Loop through older vouchers from oldest to newest
        for (let i = storeData.vouchers.length - 1; i >= 0; i--) {
          if (remainingToClear <= 0) break;
          const oldV = storeData.vouchers[i];
          if (
            oldV.clientName === clientName &&
            Number(oldV.dueAmount) > 0
          ) {
            const clearAmt = Math.min(Number(oldV.dueAmount), remainingToClear);
            oldV.paidAmount = Number(oldV.paidAmount || 0) + clearAmt;
            oldV.dueAmount = Math.max(0, Number(oldV.dueAmount) - clearAmt);
            oldV.status = oldV.dueAmount === 0 ? 'PAID' : 'PARTIAL';
            oldV.paymentHistory = oldV.paymentHistory || [];
            oldV.paymentHistory.push({
              id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              date: new Date().toISOString(),
              amount: clearAmt,
              paymentMethod: paymentMethod || 'Cash',
              note: `Paid via new invoice ${voucherNo}`,
              voucherNo
            });
            remainingToClear -= clearAmt;
          }
        }
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

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      storeId = 'default',
      id,
      action, // 'add_payment' | 'edit'
      paymentAmount,
      paymentMethod = 'Cash',
      paymentDate,
      paymentNote,
      // For edit:
      clientName,
      clientPhone,
      salerName,
      items,
      subTotal,
      discount,
      totalAmount,
      paidAmount,
      saleNote,
      note
    } = body;

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Voucher ID is required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.vouchers = storeData.vouchers || [];
    const voucherIndex = storeData.vouchers.findIndex(v => v.id === id || v.voucherNo === id);

    if (voucherIndex === -1) {
      return NextResponse.json({ success: false, message: 'Voucher not found' }, { status: 404 });
    }

    const voucher = storeData.vouchers[voucherIndex];

    // 1. ADD PAYMENT TO DUE / PARTIAL INVOICE
    if (action === 'add_payment' || (paymentAmount !== undefined && action !== 'edit')) {
      const payAmt = Number(paymentAmount);
      if (isNaN(payAmt) || payAmt <= 0) {
        return NextResponse.json({ success: false, message: 'Invalid payment amount' }, { status: 400 });
      }

      const prevPaid = Number(voucher.paidAmount || 0);
      const prevDue = Number(voucher.dueAmount || 0);
      const totalAmt = Number(voucher.totalAmount || (prevPaid + prevDue));
      const newPaid = prevPaid + payAmt;
      const newDue = Math.max(0, totalAmt - newPaid);
      const newStatus = newDue === 0 ? 'PAID' : 'PARTIAL';

      voucher.paidAmount = newPaid;
      voucher.dueAmount = newDue;
      voucher.status = newStatus;
      voucher.paymentHistory = voucher.paymentHistory || [];
      voucher.paymentHistory.push({
        id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date: paymentDate || new Date().toISOString(),
        amount: payAmt,
        paymentMethod: paymentMethod || voucher.paymentMethod || 'Cash',
        note: paymentNote || ''
      });

      // Update client due balance
      if (voucher.clientName && voucher.clientName !== 'Walk-in Customer') {
        const client = (storeData.clients || []).find(c => c.name === voucher.clientName || c.id === voucher.clientId);
        if (client) {
          client.due = Math.max(0, (Number(client.due) || 0) - payAmt);
        }
      }

      storeData.vouchers[voucherIndex] = voucher;
      await saveStoreData(storeId, storeData);

      return NextResponse.json({
        success: true,
        message: 'Payment recorded successfully',
        voucher
      });
    }

    // 2. FULL INVOICE EDIT
    if (action === 'edit' || items) {
      const oldItems = voucher.items || [];
      const newItems = items || oldItems;
      const itemsSubTotal = Number(subTotal !== undefined ? subTotal : totalAmount) || 0;
      const discountAmount = Number(discount) || 0;
      const itemsTotal = Math.max(0, itemsSubTotal - discountAmount);
      const prevDueAmount = Number(voucher.previousDue || 0);
      const grandTotal = itemsTotal + prevDueAmount;
      const updatedPaidAmount = Number(paidAmount !== undefined ? paidAmount : voucher.paidAmount);
      const updatedDueAmount = Math.max(0, grandTotal - updatedPaidAmount);
      const updatedStatus = updatedDueAmount === 0 ? 'PAID' : (updatedPaidAmount > 0 ? 'PARTIAL' : 'DUE');

      // Adjust inventory stock difference:
      // Revert old items back to stock
      oldItems.forEach(oldItem => {
        const prod = (storeData.products || []).find(p => p.code === oldItem.code || p.id === oldItem.id);
        if (prod) {
          prod.quantity = (Number(prod.quantity) || 0) + Number(oldItem.quantity || 1);
        }
      });
      // Deduct new items from stock
      newItems.forEach(newItem => {
        const prod = (storeData.products || []).find(p => p.code === newItem.code || p.id === newItem.id);
        if (prod) {
          prod.quantity = Math.max(0, (Number(prod.quantity) || 0) - Number(newItem.quantity || 1));
        }
      });

      // Recalculate profit & cost
      let totalCost = 0;
      newItems.forEach(item => {
        totalCost += (Number(item.costPrice) || 0) * (Number(item.quantity) || 1);
      });
      const profit = Math.max(0, itemsTotal - totalCost);

      // Adjust client due
      const oldClientName = voucher.clientName;
      const newClientName = clientName !== undefined ? clientName : voucher.clientName;
      const oldDue = Number(voucher.dueAmount || 0);
      const dueDiff = updatedDueAmount - oldDue;

      if (oldClientName && oldClientName !== 'Walk-in Customer') {
        const client = (storeData.clients || []).find(c => c.name === oldClientName);
        if (client) {
          client.due = Math.max(0, (Number(client.due) || 0) + dueDiff);
        }
      }

      // Update voucher object
      voucher.clientName = newClientName;
      voucher.clientPhone = clientPhone !== undefined ? clientPhone : voucher.clientPhone;
      voucher.salerName = salerName !== undefined ? salerName : voucher.salerName;
      voucher.items = newItems;
      voucher.subTotal = itemsSubTotal;
      voucher.discount = discountAmount;
      voucher.totalAmount = grandTotal;
      voucher.paidAmount = updatedPaidAmount;
      voucher.dueAmount = updatedDueAmount;
      voucher.status = updatedStatus;
      if (paymentMethod) voucher.paymentMethod = paymentMethod;
      voucher.saleNote = saleNote !== undefined ? saleNote : (voucher.saleNote || '');
      voucher.paymentNote = paymentNote !== undefined ? paymentNote : (voucher.paymentNote || '');
      voucher.note = note || saleNote || voucher.note || '';
      voucher.totalCost = totalCost;
      voucher.profit = profit;
      voucher.updatedAt = new Date().toISOString();

      storeData.vouchers[voucherIndex] = voucher;
      await saveStoreData(storeId, storeData);

      return NextResponse.json({
        success: true,
        message: 'Invoice updated successfully',
        voucher
      });
    }

    return NextResponse.json({ success: false, message: 'No valid action specified' }, { status: 400 });
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
