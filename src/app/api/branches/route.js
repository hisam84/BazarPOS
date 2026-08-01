import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData, logAuditAction } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({
      success: true,
      branches: storeData.branches || [],
      transfers: storeData.stockTransfers || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', username = 'admin', type = 'branch', name, code, address, phone, fromBranch, toBranch, productCode, quantity } = body;
    const storeData = getStoreData(storeId);

    if (type === 'branch') {
      if (!name || !code) {
        return NextResponse.json({ success: false, message: 'Branch name and code required' }, { status: 400 });
      }

      const newBranch = {
        id: 'b_' + Date.now(),
        name,
        code: code.toUpperCase(),
        address: address || '',
        phone: phone || '',
        isPrimary: false
      };

      storeData.branches = storeData.branches || [];
      storeData.branches.push(newBranch);
      saveStoreData(storeId, storeData);

      logAuditAction(storeId, username, 'BRANCH_CREATE', `Created branch: ${name} (${code})`);

      return NextResponse.json({ success: true, branch: newBranch });
    } else if (type === 'transfer') {
      if (!fromBranch || !toBranch || !productCode || !quantity || Number(quantity) <= 0) {
        return NextResponse.json({ success: false, message: 'Source, destination, product code, and quantity required' }, { status: 400 });
      }

      const transferQty = Number(quantity);
      const prodIdx = (storeData.products || []).findIndex(p => p.code === productCode);

      if (prodIdx === -1) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }

      const transferRecord = {
        id: 'st_' + Date.now(),
        date: new Date().toISOString(),
        fromBranch,
        toBranch,
        productCode,
        productName: storeData.products[prodIdx].name,
        quantity: transferQty,
        status: 'COMPLETED',
        initiatedBy: username
      };

      storeData.stockTransfers = storeData.stockTransfers || [];
      storeData.stockTransfers.unshift(transferRecord);
      saveStoreData(storeId, storeData);

      logAuditAction(
        storeId,
        username,
        'STOCK_TRANSFER',
        `Transferred ${transferQty} units of ${productCode} from ${fromBranch} to ${toBranch}`
      );

      return NextResponse.json({ success: true, transfer: transferRecord });
    }

    return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
