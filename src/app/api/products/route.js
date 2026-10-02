import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

const DEFAULT_UNITS = [
  'Pieces (pcs)',
  'Kilogram (kg)',
  'Gram (gm)',
  'Liter (ltr)',
  'Box (box)',
  'Packet (pkt)',
  'Dozen (dz)',
  'Meter (m)',
  'Carton (ctn)',
  'Pair (pr)'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = await getStoreData(storeId);

    const suppliers = (storeData.suppliers || []).map(s => typeof s === 'string' ? s : s.name);
    const units = Array.from(new Set([...DEFAULT_UNITS, ...(storeData.units || [])]));

    return NextResponse.json({
      success: true,
      products: storeData.products || [],
      categories: storeData.categories || ['General'],
      units: units,
      suppliers: suppliers
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
      code,
      name,
      category,
      costPrice,
      sellingPrice,
      quantity,
      unit = 'Pieces (pcs)',
      minQuantity = 5,
      warrantyDays = 0,
      supplier = '',
      description = '',
      barcode
    } = body;

    if (!code || !name || sellingPrice === undefined) {
      return NextResponse.json({ success: false, message: 'Product Code, Name, and Selling Price are required' }, { status: 400 });
    }

    const storeData = await getStoreData(storeId);
    
    // Generate barcode if missing
    let finalBarcode = barcode ? barcode.trim() : '';
    if (!finalBarcode) {
      const prefix = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '0');
      const stamp = Date.now().toString().slice(-4);
      const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalBarcode = prefix + stamp + rand;
    }

    const newProduct = {
      id: 'p_' + Date.now(),
      code: code.trim(),
      name: name.trim(),
      category: category || 'General',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      quantity: Number(quantity) || 0,
      unit: unit || 'Pieces (pcs)',
      minQuantity: Number(minQuantity) >= 0 ? Number(minQuantity) : 5,
      warrantyDays: Number(warrantyDays) || 0,
      supplier: supplier ? supplier.trim() : '',
      description: description ? description.trim() : '',
      barcode: finalBarcode,
      createdAt: new Date().toISOString()
    };

    storeData.products = storeData.products || [];
    storeData.products.push(newProduct);

    // Save category if new
    if (category && !storeData.categories.includes(category)) {
      storeData.categories.push(category);
    }

    await saveStoreData(storeId, storeData);

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

    const storeData = await getStoreData(storeId);
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
      unit: updates.unit !== undefined ? updates.unit : (storeData.products[index].unit || 'Pieces (pcs)'),
      minQuantity: updates.minQuantity !== undefined ? Number(updates.minQuantity) : storeData.products[index].minQuantity,
      warrantyDays: updates.warrantyDays !== undefined ? Number(updates.warrantyDays) : (storeData.products[index].warrantyDays || 0),
      supplier: updates.supplier !== undefined ? updates.supplier : (storeData.products[index].supplier || ''),
      description: updates.description !== undefined ? updates.description : (storeData.products[index].description || ''),
      updatedAt: new Date().toISOString()
    };

    if (updates.category && !storeData.categories.includes(updates.category)) {
      storeData.categories.push(updates.category);
    }

    await saveStoreData(storeId, storeData);

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

    const storeData = await getStoreData(storeId);
    storeData.products = (storeData.products || []).filter(p => p.id !== id);
    await saveStoreData(storeId, storeData);

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
