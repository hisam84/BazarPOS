import { NextResponse } from 'next/server';
import { checkNeonHealth, initPostgresTables } from '@/lib/db';
import { verifyApiAuth } from '@/lib/api-auth';

export async function GET() {
  const health = await checkNeonHealth();
  return NextResponse.json({
    success: health.connected,
    ...health
  });
}

export async function POST(request) {
  const auth = verifyApiAuth(request, {
    allowedRoles: ['superadmin']
  });
  if (!auth.authenticated) {
    return auth.errorResponse;
  }

  const success = await initPostgresTables();
  if (success) {
    const health = await checkNeonHealth();
    return NextResponse.json({
      success: true,
      message: 'PostgreSQL Database schema initialized and audited successfully!',
      tables: health.tables,
      tableCount: health.tableCount
    });
  } else {
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize database schema. Please verify DATABASE_URL.'
    }, { status: 500 });
  }
}

