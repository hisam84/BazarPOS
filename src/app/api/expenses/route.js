import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Shop Rent',
  'Electricity & Utilities',
  'Staff Salary & Wages',
  'Office Supplies & Stationery',
  'Marketing & Advertising',
  'Transport & Courier Delivery',
  'Repair & Maintenance',
  'Refreshments & Snacks',
  'Software & Subscriptions',
  'Miscellaneous & Others'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    const storeData = await getStoreData(storeId);
    const categories = storeData.expenseCategories && storeData.expenseCategories.length > 0
      ? storeData.expenseCategories
      : DEFAULT_EXPENSE_CATEGORIES;

    return NextResponse.json({
      success: true,
      data: storeData.externalIncomeExpense || { income: [], expense: [] },
      categories
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', action, categoryName, type, category, amount, description, paymentSource = 'Cash', date } = body;

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    const storeData = await getStoreData(storeId);
    storeData.expenseCategories = storeData.expenseCategories && storeData.expenseCategories.length > 0
      ? storeData.expenseCategories
      : [...DEFAULT_EXPENSE_CATEGORIES];

    // 1. Action: Add New Expense Category
    if (action === 'add_category') {
      const trimmed = (categoryName || '').trim();
      if (!trimmed) {
        return NextResponse.json({ success: false, message: 'Category name required' }, { status: 400 });
      }

      const exists = storeData.expenseCategories.some(c => c.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        storeData.expenseCategories.push(trimmed);
        await saveStoreData(storeId, storeData);
      }

      return NextResponse.json({
        success: true,
        message: 'Category added successfully',
        categories: storeData.expenseCategories,
        newCategory: trimmed
      });
    }

    // 2. Action: Delete Expense Category
    if (action === 'delete_category') {
      const trimmed = (categoryName || '').trim();
      storeData.expenseCategories = storeData.expenseCategories.filter(
        c => c.toLowerCase() !== trimmed.toLowerCase()
      );
      await saveStoreData(storeId, storeData);

      return NextResponse.json({
        success: true,
        message: 'Category removed successfully',
        categories: storeData.expenseCategories
      });
    }

    // 3. Action: Add Transaction Entry (Expense / Income)
    if (!type || !amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, message: 'Type and valid amount required' }, { status: 400 });
    }

    storeData.externalIncomeExpense = storeData.externalIncomeExpense || { income: [], expense: [] };

    // Auto-save new category if not in list
    const chosenCategory = (category || 'Miscellaneous & Others').trim();
    if (!storeData.expenseCategories.some(c => c.toLowerCase() === chosenCategory.toLowerCase())) {
      storeData.expenseCategories.push(chosenCategory);
    }

    const entry = {
      id: (type === 'income' ? 'inc_' : 'exp_') + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      category: chosenCategory,
      amount: Number(amount),
      description: description || '',
      paymentSource: paymentSource || 'Cash',
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    if (type === 'income') {
      storeData.externalIncomeExpense.income.unshift(entry);
    } else {
      storeData.externalIncomeExpense.expense.unshift(entry);
    }

    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      entry,
      categories: storeData.expenseCategories
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'expense';

    const auth = verifyApiAuth(request, { requiredStoreId: storeId });
    if (!auth.authenticated) return auth.errorResponse;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Transaction ID required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    storeData.externalIncomeExpense = storeData.externalIncomeExpense || { income: [], expense: [] };

    if (type === 'income') {
      storeData.externalIncomeExpense.income = (storeData.externalIncomeExpense.income || []).filter(e => e.id !== id);
    } else {
      storeData.externalIncomeExpense.expense = (storeData.externalIncomeExpense.expense || []).filter(e => e.id !== id);
    }

    await saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
