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
  const { id } = await context.params;
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const body = await request.json();
  const { effective_from, effective_until, amount, note, notice_sent_at } = body;
  
  if (!effective_from || !amount) {
    return NextResponse.json({ error: 'effective_from and amount required' }, { status: 400 });
  }
  
  // Validate date range if effective_until is provided
  if (effective_until && effective_until <= effective_from) {
    return NextResponse.json({ 
      error: 'effective_until must be after effective_from' 
    }, { status: 400 });
  }
  
  const { error } = await service
    .from('subscription_amount_overrides')
    .insert({
      subscription_id: id,
      merchant_id: merchant.id,
      effective_from,
      effective_until: effective_until || null,
      amount,
      note,
      notice_sent_at: notice_sent_at || null
    });
    
  if (error) {
    console.error('Failed to schedule amount override:', error);
    return NextResponse.json({ error: 'Failed to schedule amount change' }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}

