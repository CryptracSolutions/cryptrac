import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getServiceAndMerchant(request: Request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return { error: 'Unauthorized' };
  const token = auth.substring(7);
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return { error: 'Unauthorized' };
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: merchant } = await service.from('merchants').select('id').eq('user_id', user.id).single();
  if (!merchant) return { error: 'Merchant not found' };
  return { service, merchant };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;

  const { data: sub } = await service
    .from('subscriptions')
    .select('id, title, amount, currency, accepted_cryptos, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, tax_enabled, tax_rates')
    .eq('id', id)
    .eq('merchant_id', merchant.id)
    .eq('status', 'active')
    .single();
  if (!sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: override } = await service
    .from('subscription_amount_overrides')
    .select('amount')
    .eq('subscription_id', id)
    .lte('effective_from', today)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  const amount = override?.amount ?? sub.amount;

  const internalKey = process.env.INTERNAL_API_KEY;
  const appOrigin = env.APP_ORIGIN;
  if (!internalKey || !appOrigin) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`${appOrigin}/api/internal/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Key': internalKey },
    body: JSON.stringify({
      merchant_id: merchant.id,
      title: sub.title,
      amount,
      currency: sub.currency,
      accepted_cryptos: sub.accepted_cryptos,
      charge_customer_fee: sub.charge_customer_fee,
      auto_convert_enabled: sub.auto_convert_enabled,
      preferred_payout_currency: sub.preferred_payout_currency,
      tax_enabled: sub.tax_enabled,
      tax_rates: sub.tax_rates,
      source: 'subscription',
      subscription_id: id,
      max_uses: 1,
      expires_at: expiresAt
    })
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
  const { payment_link } = await res.json();
  if (!payment_link) {
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }

  const { error: invError } = await service.from('subscription_invoices').insert({
    subscription_id: id,
    merchant_id: merchant.id,
    payment_link_id: payment_link.id,
    due_date: new Date().toISOString(),
    amount,
    currency: sub.currency,
    status: 'sent'
  });
  if (invError) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }

  return NextResponse.json({ payment_url: payment_link.payment_url, payment_link_id: payment_link.id });
}
