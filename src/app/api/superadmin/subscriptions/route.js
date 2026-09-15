import { NextResponse } from 'next/server';
import { getCompanies, getSaaSStats, getSubscriptionPlans, updateCompanySubscription } from '@/lib/db';

export async function GET() {
  try {
    const companies = getCompanies();
    const stats = getSaaSStats();
    const plans = getSubscriptionPlans();

    const subscriptions = companies.map(c => ({
      companyId: c.id,
      companyName: c.name,
      owner: c.owner,
      phone: c.phone,
      email: c.email,
      status: c.status,
      subscription: c.subscription || {
        planId: 'starter',
        planName: 'Starter Business',
        price: 999,
        billingCycle: 'monthly',
        status: 'active',
        startDate: c.createdAt ? c.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        paymentStatus: 'paid'
      }
    }));

    return NextResponse.json({
      success: true,
      stats,
      plans,
      subscriptions
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { companyId, ...subscriptionUpdates } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, message: 'companyId is required' }, { status: 400 });
    }

    const updated = updateCompanySubscription(companyId, subscriptionUpdates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
