import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = getStoreData(storeId);

    return NextResponse.json({
      success: true,
      products: storeData.products || [],
      categories: storeData.categories || ['General']
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', code, name, category, costPrice, sellingPrice, quantity, minQuantity, barcode } = body;

    if (!code || !name || sellingPrice === undefined) {
      return NextResponse.json({ success: false, message: 'Code, Name, and Selling Price required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    
    // Generate barcode if missing
    let finalBarcode = barcode;
    if (!finalBarcode) {
      const prefix = code.toUpperCase().slice(0, 4).padEnd(4, '0');
      const stamp = Date.now().toString().slice(-4);
      const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalBarcode = prefix + stamp + rand;
    }

    const newProduct = {
      id: 'p_' + Date.now(),
      code,
      name,
      category: category || 'General',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      quantity: Number(quantity) || 0,
      minQuantity: Number(minQuantity) || 5,
      barcode: finalBarcode
    };

    storeData.products = storeData.products || [];
    storeData.products.push(newProduct);

    // Save category if new
    if (category && !storeData.categories.includes(category)) {
      storeData.categories.push(category);
    }

    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    const index = (storeData.products || []).findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    storeData.products[index] = {
      ...storeData.products[index],
      ...updates,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : storeData.products[index].costPrice,
      sellingPrice: updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : storeData.products[index].sellingPrice,
      quantity: updates.quantity !== undefined ? Number(updates.quantity) : storeData.products[index].quantity,
      minQuantity: updates.minQuantity !== undefined ? Number(updates.minQuantity) : storeData.products[index].minQuantity,
    };

    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, product: storeData.products[index] });
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
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }

    const storeData = getStoreData(storeId);
    storeData.products = (storeData.products || []).filter(p => p.id !== id);
    saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
