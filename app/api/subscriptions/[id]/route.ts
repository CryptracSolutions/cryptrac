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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const { data, error } = await service
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('merchant_id', merchant.id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const body = await request.json();
  
  // Task 9: Comprehensive list of allowed fields for PATCH updates
  const allowed = [
    'status',
    'title',
    'description',
    'pause_after_missed_payments',
    'accepted_cryptos',
    'charge_customer_fee',
    'auto_convert_enabled',
    'preferred_payout_currency',
    'tax_enabled',
    'tax_rates',
    // Task 3: Timing configuration fields
    'invoice_due_days',
    'generate_days_in_advance',
    'past_due_after_days',
    'auto_resume_on_payment'
  ];
  
  const updates: Record<string, unknown> = {};
  
  // Task 9: Validate and process each field
  for (const key of allowed) {
    if (key in body) {
      const value = body[key];
      
      // Task 9: Field-specific validation
      switch (key) {
        case 'invoice_due_days':
        case 'generate_days_in_advance':
        case 'past_due_after_days':
        case 'pause_after_missed_payments':
          if (typeof value !== 'number' || value < 0) {
            return NextResponse.json({ error: `${key} must be a non-negative number` }, { status: 400 });
          }
          break;
        case 'auto_resume_on_payment':
          if (typeof value !== 'boolean') {
            return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 });
          }
          break;
        case 'status':
          if (!['active', 'paused', 'canceled', 'completed'].includes(value)) {
            return NextResponse.json({ error: 'status must be active, paused, canceled, or completed' }, { status: 400 });
          }
          break;
        case 'accepted_cryptos':
          if (!Array.isArray(value)) {
            return NextResponse.json({ error: 'accepted_cryptos must be an array' }, { status: 400 });
          }
          break;
        case 'tax_rates':
          if (!Array.isArray(value)) {
            return NextResponse.json({ error: 'tax_rates must be an array' }, { status: 400 });
          }
          break;
      }
      
      updates[key] = value;
    }
  }
  
  // Task 9: Handle status changes with proper timestamp updates
  if (body.status) {
    const currentTime = new Date().toISOString();
    
    if (body.status === 'paused') {
      updates.status = 'paused';
      updates.paused_at = currentTime;
      // Clear resumed_at when pausing
      updates.resumed_at = null;
    } else if (body.status === 'canceled') {
      updates.status = 'canceled';
      updates.next_billing_at = null; // Cancel sets next_billing_at = NULL
      updates.canceled_at = currentTime;
    } else if (body.status === 'completed') {
      updates.status = 'completed';
      updates.next_billing_at = null; // Completed sets next_billing_at = NULL
      updates.completed_at = currentTime;
    } else if (body.status === 'active') {
      updates.status = 'active';
      updates.resumed_at = currentTime;
      // Clear paused_at when resuming
      updates.paused_at = null;
      
      // Task 9: Roll next_billing_at into the future if needed
      const { data: sub } = await service
        .from('subscriptions')
        .select('next_billing_at, billing_anchor, interval, interval_count')
        .eq('id', id)
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
  
  // Task 9: Update subscription with comprehensive error handling
  const { data, error } = await service
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .eq('merchant_id', merchant.id)
    .select('*')
    .single();
    
  if (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
  
  if (!data) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
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
