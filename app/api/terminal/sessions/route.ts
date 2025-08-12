import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getMerchant(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  const auth = await getMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const body = await request.json();
  const { device_id } = body;
  const { data, error } = await service
    .from('pos_sessions')
    .insert({ merchant_id: merchant.id, device_id })
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest) {
  const auth = await getMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const body = await request.json();
  const { session_id } = body;
  const { data, error } = await service
    .from('pos_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', session_id)
    .eq('merchant_id', merchant.id)
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}
