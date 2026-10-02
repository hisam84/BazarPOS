import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData } from '@/lib/db';
import { DEFAULT_EMAIL_TEMPLATES, renderTemplate } from '@/lib/email-templates';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const storeData = await getStoreData(storeId);
    const customTemplates = storeData.mailTemplates || storeData.mailSettings?.templates || {};

    // Merge default templates with custom overrides
    const templates = {};
    for (const [id, defaultTpl] of Object.entries(DEFAULT_EMAIL_TEMPLATES)) {
      templates[id] = {
        ...defaultTpl,
        ...(customTemplates[id] || {})
      };
    }

    return NextResponse.json({
      success: true,
      templates,
      defaultTemplates: DEFAULT_EMAIL_TEMPLATES
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storeId = 'default', templates, action } = body;

    const storeData = await getStoreData(storeId);

    if (action === 'reset') {
      // Reset all or a specific template to default
      const { templateId } = body;
      if (templateId) {
        if (!storeData.mailTemplates) storeData.mailTemplates = {};
        delete storeData.mailTemplates[templateId];
      } else {
        storeData.mailTemplates = {};
      }
      await saveStoreData(storeId, storeData);

      return NextResponse.json({
        success: true,
        message: templateId ? `Template '${templateId}' reset to default` : 'All templates reset to defaults',
        templates: DEFAULT_EMAIL_TEMPLATES
      });
    }

    if (!templates) {
      return NextResponse.json(
        { success: false, message: 'Missing templates payload' },
        { status: 400 }
      );
    }

    storeData.mailTemplates = {
      ...(storeData.mailTemplates || {}),
      ...templates
    };

    await saveStoreData(storeId, storeData);

    return NextResponse.json({
      success: true,
      message: 'Email templates saved successfully',
      templates: storeData.mailTemplates
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
