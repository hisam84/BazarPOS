import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';

const DEFAULT_INVOICE_SETTINGS = {
  headerType: 'both', // 'banner', 'details', 'both'
  headerBanner: '',
  logoUrl: '',
  invoiceTitle: 'TAX INVOICE',
  invoiceSubtitle: 'Customer Copy',
  
  // Header Visibility
  showHeaderBanner: true,
  showLogo: true,
  showStoreName: true,
  showStoreAddress: true,
  showStorePhone: true,
  showStoreEmail: true,
  showStoreWebsite: true,
  showTaxBin: true,
  taxBinNumber: '',

  // Customer & Meta Info
  showCustomerName: true,
  showCustomerPhone: true,
  showCustomerAddress: true,
  showInvoiceDate: true,
  showDueDate: false,
  showSalerName: true,
  showPaymentMethod: true,
  showBarcode: true,

  // Item Table Columns
  showItemSl: true,
  showItemCode: false,
  showItemUnit: true,
  showItemDiscount: false,
  showItemTotal: true,

  // Summary
  showSubtotal: true,
  showDiscount: true,
  showTaxVat: true,
  taxVatPercent: 0,
  showDeliveryCharge: false,
  showPaidAmount: true,
  showDueAmount: true,

  // Footer & Notes
  showTerms: true,
  termsAndConditions: '1. Goods once sold can be exchanged within 7 days with this invoice.\n2. Warranty issues are subject to manufacturer terms.\n3. Perishable or discount items are non-refundable.',
  showFooterNote: true,
  footerNote: 'Thank you for choosing our store! We value your trust.',
  showSignatures: true,
  customerSignatureLabel: 'Customer Signature',
  authorizedSignatureLabel: 'Authorized Signature',

  // Layout & Styling
  paperSize: 'A4',
  accentColor: '#2563eb', // Royal Blue / Indigo
  compactTable: false,
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const storeData = await getStoreData(storeId);

    const savedSettings = storeData.company?.invoiceSettings || {};
    const company = storeData.company || {};

    const mergedSettings = {
      ...DEFAULT_INVOICE_SETTINGS,
      ...savedSettings,
      // fallback logo if not specified in invoice settings
      logoUrl: savedSettings.logoUrl || company.logoUrl || '',
    };

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
      company: {
        name: company.name || 'BazarPOS Outlet',
        tagline: company.tagline || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        address: company.address || '',
        logoUrl: company.logoUrl || ''
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', settings } = body;

    const storeData = await getStoreData(storeId);
    if (!storeData.company) {
      storeData.company = {};
    }

    storeData.company.invoiceSettings = {
      ...DEFAULT_INVOICE_SETTINGS,
      ...(storeData.company.invoiceSettings || {}),
      ...(settings || {})
    };

    // If logo was uploaded in invoice settings, optionally update company logo if empty
    if (settings?.logoUrl && !storeData.company.logoUrl) {
      storeData.company.logoUrl = settings.logoUrl;
    }

    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      settings: storeData.company.invoiceSettings,
      message: 'Invoice settings updated successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
