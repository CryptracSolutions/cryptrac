import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getUserAndMerchant(authHeader: string | null) {
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
    .select('id, wallets, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, timezone')
    .eq('user_id', user.id)
    .single();
  if (merchantError || !merchant) return { error: 'Merchant account not found' };
  return { service, merchant };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserAndMerchant(request.headers.get('Authorization'));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { service, merchant } = auth;
    const body = await request.json();
    const {
      title,
      description,
      amount,
      currency = 'USD',
      accepted_cryptos = [],
      interval,
      interval_count = 1,
      anchor,
      customer,
      pause_after_missed_payments = 0,
      charge_customer_fee = null,
      auto_convert_enabled = null,
      preferred_payout_currency = null,
      tax_enabled = false,
      tax_rates = [],
      // Task 6: Add amount override support
      amount_overrides = [],
      // Task 3: Add timing configuration support
      invoice_due_days = 0,
      generate_days_in_advance = 0,
      past_due_after_days = 2,
      auto_resume_on_payment = true
    } = body;
    
    if (!title || !amount || !interval || !anchor || !customer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const merchantWallets = merchant.wallets || {};
    const missingWallets = (accepted_cryptos || []).filter((c: string) => !merchantWallets[c]);
    if (missingWallets.length > 0) {
      return NextResponse.json({ error: `Missing wallet addresses for: ${missingWallets.join(', ')}` }, { status: 400 });
    }
    
    let customerId: string | null = null;
    if (customer.email || customer.phone) {
      const { data: existing } = await service
        .from('customers')
        .select('id')
        .eq('merchant_id', merchant.id)
        .or([
          customer.email ? `email.eq.${customer.email}` : '',
          customer.phone ? `phone.eq.${customer.phone}` : ''
        ].filter(Boolean).join(','))
        .maybeSingle();
      if (existing) customerId = existing.id;
      else {
        const { data: inserted } = await service
          .from('customers')
          .insert({ merchant_id: merchant.id, email: customer.email, phone: customer.phone, name: customer.name })
          .select('id')
          .single();
        customerId = inserted?.id || null;
      }
    }
    
    const anchorDate = new Date(anchor).toISOString();
    const { data: subscription, error: subError } = await service
      .from('subscriptions')
      .insert({
        merchant_id: merchant.id,
        customer_id: customerId,
        title,
        description,
        amount,
        currency,
        accepted_cryptos,
        interval,
        interval_count,
        billing_anchor: anchorDate,
        next_billing_at: anchorDate,
        pause_after_missed_payments,
        charge_customer_fee,
        auto_convert_enabled,
        preferred_payout_currency,
        tax_enabled,
        tax_rates,
        // Task 3: Include timing configuration
        invoice_due_days,
        generate_days_in_advance,
        past_due_after_days,
        auto_resume_on_payment
      })
      .select('*')
      .single();
      
    if (subError) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
    
    // Task 6: Insert amount overrides if provided
    if (amount_overrides && amount_overrides.length > 0) {
      const overridesToInsert = amount_overrides.map((override: any) => ({
        subscription_id: subscription.id,
        merchant_id: merchant.id,
        effective_from: override.effective_from,
        amount: override.amount,
        note: override.note || null
      }));
      
      const { error: overrideError } = await service
        .from('subscription_amount_overrides')
        .insert(overridesToInsert);
        
      if (overrideError) {
        console.warn('Failed to insert amount overrides:', overrideError);
        // Don't fail the entire request, just log the warning
      }
    }
    
    // Send welcome email if customer email is provided
    if (customer.email) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        console.log('Welcome email debug:', {
          hasCustomerEmail: !!customer.email,
          customerEmail: customer.email,
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          subscriptionId: subscription.id
        });
        
        if (supabaseUrl && supabaseServiceKey) {
          const emailPayload = {
            type: 'welcome',
            subscription_id: subscription.id,
            customer_email: customer.email
          };
          
          console.log('Calling welcome email function with payload:', emailPayload);
          
          const response = await fetch(`${supabaseUrl}/functions/v1/subscriptions-send-notifications`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify(emailPayload)
          });
          
          console.log('Welcome email function response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Welcome email function error response:', errorText);
          } else {
            console.log('Welcome email function called successfully');
          }
        } else {
          console.error('Missing environment variables for welcome email:', {
            hasSupabaseUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
          });
        }
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail subscription creation if email fails
      }
    } else {
      console.log('No customer email provided, skipping welcome email');
    }
    
    return NextResponse.json({ success: true, data: subscription });
  } catch (error) {
    console.error('create subscription error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserAndMerchant(request.headers.get('Authorization'));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { service, merchant } = auth;
    const { data, error } = await service
      .from('subscriptions')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('list subscriptions error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
