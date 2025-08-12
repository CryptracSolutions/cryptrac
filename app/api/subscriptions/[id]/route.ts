import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';

async function getServiceAndMerchant(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }
  const token = authHeader.substring(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Unauthorized' };
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: merchant, error: merchantError } = await service
    .from('merchants')
    .select('id, timezone')
    .eq('user_id', user.id)
    .single();
  if (merchantError || !merchant) return { error: 'Merchant account not found' };
  return { service, merchant };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const { data, error } = await service
    .from('subscriptions')
    .select('*')
    .eq('id', params.id)
    .eq('merchant_id', merchant.id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const body = await request.json();
  const allowed = ['status','pause_after_missed_payments','accepted_cryptos','tax_enabled','tax_rates'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (body.status) {
    if (body.status === 'paused') {
      updates.status = 'paused';
    } else if (body.status === 'canceled') {
      updates.status = 'canceled';
      updates.next_billing_at = null;
    } else if (body.status === 'active') {
      updates.status = 'active';
      const { data: sub } = await service
        .from('subscriptions')
        .select('next_billing_at, billing_anchor, interval, interval_count')
        .eq('id', params.id)
        .eq('merchant_id', merchant.id)
        .single();
      if (sub && sub.next_billing_at && new Date(sub.next_billing_at) < new Date()) {
        const zone = merchant.timezone || 'UTC';
        let next = DateTime.fromISO(sub.billing_anchor as string, { zone });
        while (next <= DateTime.now().setZone(zone)) {
          next = incrementInterval(next, sub.interval as string, sub.interval_count as number);
        }
        updates.next_billing_at = next.toUTC().toISO();
      }
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  const { data, error } = await service
    .from('subscriptions')
    .update(updates)
    .eq('id', params.id)
    .eq('merchant_id', merchant.id)
    .select('*')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

function incrementInterval(dt: DateTime, interval: string, count: number) {
  switch (interval) {
    case 'day':
      return dt.plus({ days: count });
    case 'week':
      return dt.plus({ weeks: count });
    case 'month': {
      const added = dt.plus({ months: count });
      const endOfMonth = added.endOf('month');
      return added.day < dt.day ? endOfMonth : added;
    }
    case 'year':
      return dt.plus({ years: count });
    default:
      return dt.plus({ months: count });
  }
}
