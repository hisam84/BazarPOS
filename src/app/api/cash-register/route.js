import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData, logAuditAction } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    const registers = storeData.cashRegisters || [];
    const openRegister = registers.find(r => r.status === 'open');

    return NextResponse.json({
      success: true,
      openRegister: openRegister || null,
      history: registers
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', username = 'admin', action = 'open', openingCash, closingCashActual, note } = body;
    const storeData = getStoreData(storeId);

    storeData.cashRegisters = storeData.cashRegisters || [];

    if (action === 'open') {
      const existingOpen = storeData.cashRegisters.find(r => r.status === 'open');
      if (existingOpen) {
        return NextResponse.json({ success: false, message: 'Cash register is already open for today' }, { status: 400 });
      }

      const newRegister = {
        id: 'reg_' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        openedAt: new Date().toISOString(),
        closedAt: null,
        openedBy: username,
        openingCash: Number(openingCash) || 0,
        closingCashExpected: Number(openingCash) || 0,
        closingCashActual: null,
        difference: 0,
        status: 'open',
        note: note || ''
      };

      storeData.cashRegisters.unshift(newRegister);
      saveStoreData(storeId, storeData);

      logAuditAction(storeId, username, 'REGISTER_OPEN', `Opened cash drawer with ৳${newRegister.openingCash}`);

      return NextResponse.json({ success: true, register: newRegister });
    } else if (action === 'close') {
      const openIdx = storeData.cashRegisters.findIndex(r => r.status === 'open');
      if (openIdx === -1) {
        return NextResponse.json({ success: false, message: 'No open cash register found to close' }, { status: 400 });
      }

      // Calculate total cash collected today from vouchers!
      const today = storeData.cashRegisters[openIdx].date;
      const todayCashSales = (storeData.vouchers || [])
        .filter(v => v.date.startsWith(today) && v.paymentMethod === 'Cash')
        .reduce((acc, v) => acc + (v.paidAmount || 0), 0);

      const expected = storeData.cashRegisters[openIdx].openingCash + todayCashSales;
      const actual = Number(closingCashActual) || 0;
      const diff = actual - expected;

      storeData.cashRegisters[openIdx].closedAt = new Date().toISOString();
      storeData.cashRegisters[openIdx].closedBy = username;
      storeData.cashRegisters[openIdx].closingCashExpected = expected;
      storeData.cashRegisters[openIdx].closingCashActual = actual;
      storeData.cashRegisters[openIdx].difference = diff;
      storeData.cashRegisters[openIdx].status = 'closed';
      storeData.cashRegisters[openIdx].closingNote = note || '';

      saveStoreData(storeId, storeData);

      logAuditAction(
        storeId,
        username,
        'REGISTER_CLOSE',
        `Closed cash drawer. Expected: ৳${expected}, Actual: ৳${actual}, Difference: ৳${diff}`
      );

      return NextResponse.json({ success: true, register: storeData.cashRegisters[openIdx] });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
