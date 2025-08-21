import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from 'https://esm.sh/luxon@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRecord {
  id: string;
  title: string;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  next_billing_at: string;
  status: string;
  max_cycles?: number;
  total_cycles: number;
  merchant_id: string;
  customer_id: string;
  invoice_due_days: number;
  generate_days_in_advance: number;
  merchants: {
    id: string;
    business_name: string;
    timezone?: string;
  };
  customers: {
    id: string;
    name?: string;
    email: string;
  };
}

interface AmountOverride {
  id: string;
  amount: number;
  effective_from: string;
  effective_until?: string;
  note?: string;
}

// Generate unique link ID for payment links
function generateLinkId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'pl_';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Calculate next billing date based on interval
function calculateNextBillingDate(currentDate: DateTime, interval: string, intervalCount: number): DateTime {
  switch (interval) {
    case 'day':
      return currentDate.plus({ days: intervalCount });
    case 'week':
      return currentDate.plus({ weeks: intervalCount });
    case 'month':
      return currentDate.plus({ months: intervalCount });
    case 'year':
      return currentDate.plus({ years: intervalCount });
    default:
      throw new Error(`Unsupported interval: ${interval}`);
  }
}

// Get applicable amount override for a specific date
function getApplicableOverride(overrides: AmountOverride[], cycleDate: string): AmountOverride | null {
  const applicableOverrides = overrides.filter(override => 
    override.effective_from <= cycleDate && 
    (!override.effective_until || override.effective_until >= cycleDate)
  );
  
  // Return the most recent applicable override
  return applicableOverrides.sort((a, b) => 
    b.effective_from.localeCompare(a.effective_from)
  )[0] || null;
}

// Generate invoice for a subscription
async function generateInvoiceForSubscription(
  supabase: any, 
  subscription: SubscriptionRecord,
  overrides: AmountOverride[]
): Promise<{ success: boolean; error?: string; invoiceId?: string; paymentUrl?: string }> {
  try {
    console.log(`🔄 Processing subscription: ${subscription.id} (${subscription.title})`);
    
    const timezone = subscription.merchants.timezone || 'UTC';
    const now = DateTime.now().setZone(timezone);
    const nextBilling = DateTime.fromISO(subscription.next_billing_at).setZone(timezone);
    const cycleStart = nextBilling;
    const cycleStartISO = cycleStart.toISODate();
    
    // Check if we should generate the invoice (considering generate_days_in_advance)
    const generateDate = nextBilling.minus({ days: subscription.generate_days_in_advance });
    
    if (now < generateDate) {
      console.log(`⏳ Too early to generate invoice for ${subscription.id}. Generate date: ${generateDate.toISO()}`);
      return { success: false, error: 'Too early to generate' };
    }
    
    // Check if invoice already exists for this cycle (idempotency)
    const { data: existingInvoice } = await supabase
      .from('subscription_invoices')
      .select('id, payment_link_id')
      .eq('subscription_id', subscription.id)
      .eq('cycle_start_at', cycleStartISO)
      .maybeSingle();
      
    if (existingInvoice) {
      console.log(`✅ Invoice already exists for ${subscription.id} cycle ${cycleStartISO}`);
      return { success: true, invoiceId: existingInvoice.id };
    }
    
    // Check max cycles limit
    if (subscription.max_cycles && subscription.total_cycles >= subscription.max_cycles) {
      console.log(`🏁 Subscription ${subscription.id} has reached max cycles (${subscription.max_cycles})`);
      
      // Mark subscription as completed
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'completed',
          completed_at: now.toISO()
        })
        .eq('id', subscription.id);
        
      return { success: false, error: 'Max cycles reached' };
    }
    
    // Get applicable amount override
    const applicableOverride = getApplicableOverride(overrides, cycleStartISO);
    const invoiceAmount = applicableOverride?.amount || subscription.amount;
    
    console.log(`💰 Invoice amount: $${invoiceAmount} ${subscription.currency} ${applicableOverride ? '(override applied)' : '(base amount)'}`);
    
    // Calculate due date
    const dueDate = cycleStart.plus({ days: subscription.invoice_due_days });
    
    // Generate unique link ID
    const linkId = generateLinkId();
    
    // Create payment link first
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .insert({
        merchant_id: subscription.merchant_id,
        title: `${subscription.title} - Invoice`,
        amount: invoiceAmount,
        currency: subscription.currency,
        link_id: linkId,
        subscription_id: subscription.id,
        source: 'subscription',
        metadata: {
          subscription_id: subscription.id,
          cycle_start_at: cycleStartISO,
          cycle_number: subscription.total_cycles + 1,
          type: 'subscription_invoice'
        }
      })
      .select('id, link_id')
      .single();
      
    if (linkError) {
      console.error(`❌ Failed to create payment link for ${subscription.id}:`, linkError);
      return { success: false, error: 'Failed to create payment link' };
    }
    
    // Generate proper invoice number using atomic counter
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('get_next_invoice_number', { merchant_uuid: subscription.merchant_id });
    
    if (numberError) {
      console.error(`❌ Failed to generate invoice number for ${subscription.id}:`, numberError);
      return { success: false, error: 'Failed to generate invoice number' };
    }
    
    console.log(`📄 Generated invoice number: ${invoiceNumber}`);
    
    // Create subscription invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('subscription_invoices')
      .insert({
        subscription_id: subscription.id,
        merchant_id: subscription.merchant_id,
        payment_link_id: paymentLink.id,
        amount: invoiceAmount,
        currency: subscription.currency,
        cycle_start_at: cycleStartISO,
        due_date: dueDate.toISODate(),
        status: 'pending',
        invoice_number: invoiceNumber
      })
      .select('id')
      .single();
      
    if (invoiceError) {
      console.error(`❌ Failed to create invoice for ${subscription.id}:`, invoiceError);
      return { success: false, error: 'Failed to create invoice' };
    }
    
    // Calculate next billing date
    const nextNextBilling = calculateNextBillingDate(nextBilling, subscription.interval, subscription.interval_count);
    
    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        next_billing_at: nextNextBilling.toISO(),
        total_cycles: subscription.total_cycles + 1,
        updated_at: now.toISO()
      })
      .eq('id', subscription.id);
      
    if (updateError) {
      console.error(`❌ Failed to update subscription ${subscription.id}:`, updateError);
      return { success: false, error: 'Failed to update subscription' };
    }
    
    // Generate payment URL
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://cryptrac.com';
    const paymentUrl = `${appOrigin}/pay/${paymentLink.link_id}`;
    
    console.log(`✅ Invoice created for ${subscription.id}: ${invoice.id}`);
    
    return { 
      success: true, 
      invoiceId: invoice.id,
      paymentUrl: paymentUrl
    };
    
  } catch (error) {
    console.error(`❌ Error generating invoice for ${subscription.id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send invoice notification email
async function sendInvoiceNotification(
  supabase: any,
  subscription: SubscriptionRecord,
  paymentUrl: string,
  invoiceAmount: number
): Promise<boolean> {
  try {
    console.log(`📧 Sending invoice notification for ${subscription.id} to ${subscription.customers.email}`);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Make direct HTTP request to notification function
    const response = await fetch(`${supabaseUrl}/functions/v1/subscriptions-send-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        type: 'invoice',
        subscription_id: subscription.id,
        customer_email: subscription.customers.email,
        payment_url: paymentUrl,
        invoice_data: {
          amount: invoiceAmount
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to send notification for ${subscription.id}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return false;
    }
    
    const result = await response.json();
    console.log(`✅ Notification sent successfully for ${subscription.id}:`, result);
    return true;
    
  } catch (error) {
    console.error(`❌ Error sending notification for ${subscription.id}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Subscription scheduler started');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get current time in UTC for comparison
    const now = DateTime.now();
    const checkTime = now.plus({ days: 1 }); // Look ahead 1 day to catch early generation
    
    console.log(`🔍 Checking for subscriptions due before: ${checkTime.toISO()}`);

    // Find subscriptions that need invoice generation
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        id, title, amount, currency, interval, interval_count, 
        next_billing_at, status, max_cycles, total_cycles,
        merchant_id, customer_id,
        invoice_due_days, generate_days_in_advance,
        merchants!inner(id, business_name, timezone),
        customers!inner(id, name, email)
      `)
      .eq('status', 'active')
      .not('next_billing_at', 'is', null)
      .lte('next_billing_at', checkTime.toISO());

    if (subscriptionsError) {
      console.error('❌ Error fetching subscriptions:', subscriptionsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch subscriptions' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Found ${subscriptions?.length || 0} subscriptions to process`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No subscriptions due for processing',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each subscription
    for (const subscription of subscriptions) {
      results.processed++;
      
      try {
        // Get amount overrides for this subscription
        const { data: overrides } = await supabase
          .from('subscription_amount_overrides')
          .select('id, amount, effective_from, effective_until, note')
          .eq('subscription_id', subscription.id)
          .order('effective_from', { ascending: false });

        // Generate invoice
        const invoiceResult = await generateInvoiceForSubscription(
          supabase, 
          subscription as SubscriptionRecord,
          overrides || []
        );

        if (invoiceResult.success && invoiceResult.paymentUrl) {
          // Send notification email
          const applicableOverride = getApplicableOverride(
            overrides || [], 
            DateTime.fromISO(subscription.next_billing_at).toISODate()
          );
          const invoiceAmount = applicableOverride?.amount || subscription.amount;
          
          await sendInvoiceNotification(
            supabase,
            subscription as SubscriptionRecord,
            invoiceResult.paymentUrl,
            invoiceAmount
          );
          
          results.successful++;
          console.log(`✅ Successfully processed subscription: ${subscription.id}`);
        } else {
          results.failed++;
          if (invoiceResult.error && invoiceResult.error !== 'Too early to generate' && invoiceResult.error !== 'Max cycles reached') {
            results.errors.push(`${subscription.id}: ${invoiceResult.error}`);
          }
          console.log(`⚠️ Failed to process subscription: ${subscription.id} - ${invoiceResult.error}`);
        }
        
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${subscription.id}: ${errorMsg}`);
        console.error(`❌ Error processing subscription ${subscription.id}:`, error);
      }
    }

    console.log(`🏁 Scheduler completed: ${results.successful} successful, ${results.failed} failed`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${results.processed} subscriptions`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Scheduler error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


