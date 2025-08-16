import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (merchantError || !merchant) return { error: 'Merchant account not found' };
  return { service, merchant };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getServiceAndMerchant(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { service, merchant } = auth;

    const { email, payment_url } = await request.json();
    
    if (!email || !payment_url) {
      return NextResponse.json({ error: 'Missing required fields: email, payment_url' }, { status: 400 });
    }

    // Verify subscription belongs to merchant
    const { data: subscription, error: subError } = await service
      .from('subscriptions')
      .select('id, title')
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Call the subscription notifications function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/subscriptions-send-notifications`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        type: 'invoice',
        subscription_id: id,
        customer_email: email,
        payment_url: payment_url
      })
    });
    
    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Invoice notification sent successfully' });
    } else {
      const errorText = await response.text();
      console.error('Failed to send invoice notification:', errorText);
      return NextResponse.json({ error: 'Failed to send invoice notification' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-invoice-notification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

