import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({
      success: true,
      data: storeData.externalIncomeExpense || { income: [], expense: [] }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', type, category, amount, description, date } = body;

    if (!type || !amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, message: 'Type and valid amount required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    storeData.externalIncomeExpense = storeData.externalIncomeExpense || { income: [], expense: [] };

    const entry = {
      id: (type === 'income' ? 'inc_' : 'exp_') + Date.now(),
      category: category || 'General',
      amount: Number(amount),
      description: description || '',
      date: date || new Date().toISOString()
    };

    if (type === 'income') {
      storeData.externalIncomeExpense.income.unshift(entry);
    } else {
      storeData.externalIncomeExpense.expense.unshift(entry);
    }

    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
