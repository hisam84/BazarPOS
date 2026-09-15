import { NextResponse } from 'next/server';
import { getSubscriptionPlans } from '@/lib/db';

export async function GET() {
  try {
    const plans = getSubscriptionPlans();
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
