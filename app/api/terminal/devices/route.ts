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
    .select('id, wallets, charge_customer_fee, tax_enabled, tax_rates')
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
  const { id, label, tip_presets, charge_customer_fee, tax_enabled, accepted_cryptos } = body;
  const payload: Record<string, unknown> = { merchant_id: merchant.id };
  if (label !== undefined) payload.label = label;
  if (tip_presets !== undefined) payload.tip_presets = tip_presets;
  if (charge_customer_fee !== undefined) payload.charge_customer_fee = charge_customer_fee;
  if (tax_enabled !== undefined) payload.tax_enabled = tax_enabled;
  if (accepted_cryptos !== undefined) payload.accepted_cryptos = accepted_cryptos;
  if (!id) {
    if (payload.accepted_cryptos === undefined) {
      payload.accepted_cryptos = Object.keys(merchant.wallets || {});
    }
    if (payload.charge_customer_fee === undefined) {
      payload.charge_customer_fee = merchant.charge_customer_fee;
    }
    if (payload.tax_enabled === undefined) {
      payload.tax_enabled = merchant.tax_enabled;
    }
  }
  let result;
  if (id) {
    result = await service
      .from('terminal_devices')
      .update(payload)
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .select('*')
      .single();
  } else {
    result = await service
      .from('terminal_devices')
      .insert(payload)
      .select('*')
      .single();
  }
  if (result.error) {
    return NextResponse.json({ error: 'Failed to save device' }, { status: 500 });
  }
  const data = {
    ...result.data,
    accepted_cryptos:
      (result.data.accepted_cryptos && result.data.accepted_cryptos.length)
        ? result.data.accepted_cryptos
        : Object.keys(merchant.wallets || {}),
    charge_customer_fee:
      result.data.charge_customer_fee ?? merchant.charge_customer_fee,
    tax_enabled:
      result.data.tax_enabled ?? merchant.tax_enabled,
    tax_rates: merchant.tax_rates || []
  };
  return NextResponse.json({ success: true, data });
}
