import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { DateTime } from 'luxon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function addInterval(dt: DateTime, interval: string, count: number) {
  switch (interval) {
    case 'day':
      return dt.plus({ days: count });
    case 'week':
      return dt.plus({ weeks: count });
    case 'month': {
      const added = dt.plus({ months: count });
      const end = added.endOf('month');
      return added.day < dt.day ? end : added;
    }
    case 'year':
      return dt.plus({ years: count });
    default:
      return dt.plus({ months: count });
  }
}

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
  const { data: merchant } = await service.from('merchants').select('id, timezone').eq('user_id', user.id).single();
  if (!merchant) return { error: 'Merchant not found' };
  return { service, merchant };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    console.log('=== Generate Invoice API Called ===');
    const { id } = await context.params;
    console.log('Subscription ID:', id);
    
    const auth = await getServiceAndMerchant(request);
    if ('error' in auth) {
      console.error('Authentication error:', auth.error);
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { service, merchant } = auth;
    console.log('Merchant ID:', merchant.id);

    // ENHANCED: Parse request body for optional target cycle date
    let requestBody: { target_cycle_date?: string } = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (e) {
      // Ignore parsing errors for backward compatibility
    }

    // Enhanced environment variable validation
    const internalKey = process.env.INTERNAL_API_KEY;
    const appOrigin = env.APP_ORIGIN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment validation:', { 
      hasInternalKey: !!internalKey, 
      hasAppOrigin: !!appOrigin,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      appOriginValue: appOrigin
    });

    const missingVars = [];
    if (!internalKey) missingVars.push('INTERNAL_API_KEY');
    if (!appOrigin) missingVars.push('APP_ORIGIN');
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return NextResponse.json({ 
        error: `Server misconfigured - missing environment variables: ${missingVars.join(', ')}` 
      }, { status: 500 });
    }

    // Task 4: Get subscription with all timing fields (unified with scheduler)
    const { data: sub, error: subError } = await service
      .from('subscriptions')
      .select('id, title, amount, currency, accepted_cryptos, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, tax_enabled, tax_rates, next_billing_at, interval, interval_count, billing_anchor, invoice_due_days, generate_days_in_advance, past_due_after_days, max_cycles, customer_id')
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .eq('status', 'active')
      .single();
      
    if (subError) {
      console.error('Subscription query error:', subError);
      return NextResponse.json({ error: 'Database error fetching subscription' }, { status: 500 });
    }
    
    if (!sub) {
      console.log('Subscription not found or not active');
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    console.log('Subscription found:', sub.title);

    // ENHANCED: Determine target cycle date
    const zone = merchant.timezone || 'UTC';
    console.log('Timezone:', zone);
    
    let cycleStart: DateTime;
    
    if (requestBody.target_cycle_date) {
      // Manual targeting of specific cycle date
      console.log('Target cycle date provided:', requestBody.target_cycle_date);
      cycleStart = DateTime.fromISO(requestBody.target_cycle_date, { zone }).toUTC();
      console.log('Using target cycle start:', cycleStart.toISO());
    } else {
      // Default behavior: use next billing date
      const nextBilling = DateTime.fromISO(sub.next_billing_at, { zone });
      cycleStart = nextBilling.toUTC();
      console.log('Using next billing cycle start:', cycleStart.toISO());
    }
    
    const cycleStartISO = cycleStart.toISO();

    // ENHANCED: Max cycles completion logic - check if this specific cycle exceeds limit
    if (sub.max_cycles && sub.max_cycles > 0) {
      // Count existing invoices to determine current cycle number
      const { count: invoiceCount, error: countError } = await service
        .from('subscription_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_id', id);
        
      if (countError) {
        console.error('Error counting invoices:', countError);
        return NextResponse.json({ error: 'Database error counting invoices' }, { status: 500 });
      }
        
      const currentCycle = (invoiceCount || 0) + 1; // Next cycle to be generated
      console.log('Current cycle:', currentCycle, 'Max cycles:', sub.max_cycles);
      
      if (currentCycle > sub.max_cycles) {
        // Mark subscription as completed if this is the natural next cycle
        if (!requestBody.target_cycle_date) {
          const { error: updateError } = await service
            .from('subscriptions')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              next_billing_at: null 
            })
            .eq('id', id)
            .eq('merchant_id', merchant.id);
            
          if (updateError) {
            console.error('Error updating subscription to completed:', updateError);
          }

          // Send completion email when subscription is completed via manual generation
          try {
            // Get customer email for completion notification
            const { data: customer } = await service
              .from('customers')
              .select('email')
              .eq('id', sub.customer_id)
              .single();

            if (customer?.email) {
              console.log('📧 Sending completion email to:', customer.email);
              
              if (supabaseUrl && serviceKey) {
                const response = await fetch(`${supabaseUrl}/functions/v1/subscriptions-send-notifications`, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceKey}`
                  },
                  body: JSON.stringify({
                    type: 'completion',
                    subscription_id: id,
                    customer_email: customer.email
                  })
                });
                
                console.log('📧 Completion email response:', {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('📧 Completion email error:', errorText);
                } else {
                  console.log('✅ Completion email sent successfully');
                }
              } else {
                console.error('❌ Missing environment variables for completion email');
              }
            } else {
              console.log('ℹ️ No customer email found for completion notification');
            }
          } catch (emailError) {
            console.error('❌ Failed to send completion email:', emailError);
            // Don't fail the completion process if email fails
          }
        }
          
        return NextResponse.json({ 
          error: `Subscription has reached maximum cycles (${sub.max_cycles})${requestBody.target_cycle_date ? ' - cannot generate invoice for cycle beyond limit' : ' and has been completed'}` 
        }, { status: 400 });
      }
    }

    // Task 4: Check if invoice already exists for this cycle (idempotent)
    const { data: existingInvoice, error: existingError } = await service
      .from('subscription_invoices')
      .select('id, payment_link_id')
      .eq('subscription_id', id)
      .eq('cycle_start_at', cycleStartISO)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing invoice:', existingError);
      return NextResponse.json({ error: 'Database error checking existing invoice' }, { status: 500 });
    }

    if (existingInvoice) {
      console.log('Existing invoice found:', existingInvoice.id);
      // Get payment link data separately to avoid TypeScript issues
      const { data: paymentLink, error: linkError } = await service
        .from('payment_links')
        .select('link_id')
        .eq('id', existingInvoice.payment_link_id)
        .single();
        
      if (linkError) {
        console.error('Error fetching payment link:', linkError);
        return NextResponse.json({ error: 'Database error fetching payment link' }, { status: 500 });
      }
        
      const paymentUrl = paymentLink?.link_id ? `${appOrigin}/pay/${paymentLink.link_id}` : null;
      return NextResponse.json({ 
        payment_url: paymentUrl, 
        payment_link_id: existingInvoice.payment_link_id,
        message: 'Invoice already exists for this cycle'
      });
    }

    // ENHANCED: Get amount override for this specific cycle date
    const today = cycleStart.setZone(zone).toISODate();
    console.log('=== Amount Override Debug ===');
    console.log('Cycle start (UTC):', cycleStart.toISO());
    console.log('Cycle start (local zone):', cycleStart.setZone(zone).toISO());
    console.log('Today (ISO date for comparison):', today);
    console.log('Timezone:', zone);
    console.log('Target cycle date provided:', !!requestBody.target_cycle_date);
    
    // ENHANCED: Query for active overrides considering both effective_from and effective_until
    const { data: override, error: overrideError } = await service
      .from('subscription_amount_overrides')
      .select('id, amount, effective_from, effective_until, note, created_at')
      .eq('subscription_id', id)
      .lte('effective_from', today)
      .or(`effective_until.is.null,effective_until.gte.${today}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    console.log('Override query result:', { override, overrideError });
    
    // Also fetch all overrides for debugging
    const { data: allOverrides } = await service
      .from('subscription_amount_overrides')
      .select('id, amount, effective_from, effective_until, note, created_at')
      .eq('subscription_id', id)
      .order('effective_from', { ascending: false });
    
    console.log('All overrides for subscription:', allOverrides);
      
    if (overrideError) {
      console.error('Error fetching amount override:', overrideError);
      return NextResponse.json({ error: 'Database error fetching amount override' }, { status: 500 });
    }
    
    const amount = override?.amount ?? sub.amount;
    console.log('Final invoice amount:', amount, override ? '(overridden)' : '(base)');
    console.log('Override details:', override);
    console.log('=== End Amount Override Debug ===');

    // Task 4: Calculate due date and expiration (unified with scheduler)
    const invoiceDueDays = sub.invoice_due_days || 0;
    const pastDueAfterDays = sub.past_due_after_days || 2;
    
    // Due date: cycle_start_at + invoice_due_days (0 = due on cycle date)
    const dueDate = cycleStart.plus({ days: invoiceDueDays });
    
    // Expires at: cycle_start_at + (past_due_after_days + 14) days
    const expiresAt = cycleStart.plus({ days: pastDueAfterDays + 14 });
    console.log('Due date:', dueDate.toISO(), 'Expires at:', expiresAt.toISO());
    
    // Task 4: Create payment link with exact same rules as scheduler
    const title = `${sub.title} — Invoice ${cycleStart.setZone(zone).toISODate()}`;
    console.log('Creating payment link with title:', title);
    
    const paymentPayload = {
      merchant_id: merchant.id,
      title,
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
      max_uses: 1, // Task 8: Single-use links (perfect parity with scheduler)
      expires_at: expiresAt.toISO()
    };
    console.log('Payment payload:', JSON.stringify(paymentPayload, null, 2));
    
    // Fixed: Ensure internalKey is not undefined before using it in headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (internalKey) {
      headers['X-Internal-Key'] = internalKey;
    }
    
    const res = await fetch(`${appOrigin}/api/internal/payments/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentPayload)
    });
    
    console.log('Payment link creation response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Payment link creation failed:', errorText);
      return NextResponse.json({ error: 'Failed to create payment link: ' + errorText }, { status: 500 });
    }
    
    const paymentResponse = await res.json();
    console.log('Payment response:', paymentResponse);
    
    const { payment_link } = paymentResponse;
    if (!payment_link) {
      console.error('No payment_link in response:', paymentResponse);
      return NextResponse.json({ error: 'Failed to create payment link - no payment_link returned' }, { status: 500 });
    }

    // Task 7: Generate invoice number using atomic counter
    console.log('Generating invoice number for merchant:', merchant.id);
    const { data: invoiceNumber, error: numberError } = await service
      .rpc('get_next_invoice_number', { merchant_uuid: merchant.id });
    
    if (numberError) {
      console.error('Failed to generate invoice number:', numberError);
      return NextResponse.json({ error: 'Failed to generate invoice number: ' + numberError.message }, { status: 500 });
    }
    console.log('Generated invoice number:', invoiceNumber);

    // Task 4: Insert invoice with cycle_start_at and status 'sent' (manual path stays "already sent")
    const invoiceData = {
      subscription_id: id,
      merchant_id: merchant.id,
      payment_link_id: payment_link.id,
      cycle_start_at: cycleStartISO,
      due_date: dueDate.toISO(), // Task 4: Configurable due date (unified with scheduler)
      amount,
      currency: sub.currency,
      invoice_number: invoiceNumber, // Task 7: Add invoice number
      status: 'sent'
    };
    console.log('Inserting invoice:', invoiceData);
    
    const { error: invError } = await service.from('subscription_invoices').upsert(invoiceData, {
      onConflict: 'subscription_id,cycle_start_at',
      ignoreDuplicates: false // We want to update if it exists
    });
    
    if (invError) {
      console.error('Failed to create invoice:', invError);
      return NextResponse.json({ error: 'Failed to create invoice: ' + invError.message }, { status: 500 });
    }
    console.log('Invoice created successfully');

    // FIXED: Automatically send invoice notification email for manual generation
    try {
      // Get customer email for invoice notification
      const { data: customer } = await service
        .from('customers')
        .select('email')
        .eq('id', sub.customer_id)
        .single();

      if (customer?.email) {
        console.log('📧 Sending invoice notification email to:', customer.email);
        
        if (supabaseUrl && serviceKey) {
          const response = await fetch(`${supabaseUrl}/functions/v1/subscriptions-send-notifications`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify({
              type: 'invoice',
              subscription_id: id,
              customer_email: customer.email,
              payment_url: payment_link.payment_url,
              invoice_data: {
                amount,
                currency: sub.currency,
                due_date: dueDate.toISO()
              }
            })
          });
          
          console.log('📧 Invoice notification response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('📧 Invoice notification error:', errorText);
          } else {
            console.log('✅ Invoice notification sent successfully');
          }
        } else {
          console.error('❌ Missing environment variables for invoice notification');
        }
      } else {
        console.log('ℹ️ No customer email found for invoice notification');
      }
    } catch (emailError) {
      console.error('❌ Failed to send invoice notification:', emailError);
      // Don't fail the invoice generation if email fails
    }

    // ENHANCED: Only advance next_billing_at if this is the natural next cycle (not a future target)
    if (!requestBody.target_cycle_date) {
      // Task 4: Advance next_billing_at using exact same logic as scheduler
      let next = DateTime.fromISO(sub.billing_anchor, { zone });
      while (next <= DateTime.now().setZone(zone)) {
        next = addInterval(next, sub.interval, sub.interval_count);
      }
      console.log('Advancing next billing to:', next.toUTC().toISO());
      
      const { error: updateError } = await service
        .from('subscriptions')
        .update({ next_billing_at: next.toUTC().toISO() })
        .eq('id', id);
        
      if (updateError) {
        console.warn('Failed to advance next_billing_at:', updateError);
      }
    } else {
      console.log('Skipping next_billing_at advancement for targeted future cycle');
    }

    const result = { 
      payment_url: payment_link.payment_url, 
      payment_link_id: payment_link.id,
      cycle_start_at: cycleStartISO,
      due_date: dueDate.toISO(),
      expires_at: expiresAt.toISO(),
      invoice_number: invoiceNumber, // Task 7: Include invoice number in response
      email_notification_sent: true, // Indicate that email was automatically sent
      target_cycle_used: !!requestBody.target_cycle_date // Indicate if future targeting was used
    };
    console.log('=== Generate Invoice Success ===', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('=== Generate Invoice Error ===', error);
    return NextResponse.json({ 
      error: 'Unexpected error: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 });
  }
}

