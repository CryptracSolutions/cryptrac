import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BASE_STABLE_MAP: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD'],
  BNB: ['USDTBSC', 'BUSDBSC', 'USDCBSC'],
  BNBBSC: ['USDTBSC', 'BUSDBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20', 'TUSDTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  // Avalanche C-Chain support
  AVAX: ['USDTARC20', 'USDCARC20'],
  AVAXC: ['USDTARC20', 'USDCARC20'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO']
};

function expandStableCoins(wallets: Record<string, string>): string[] {
  const bases = Object.keys(wallets);

  const stable = new Set<string>();
  bases.forEach(base => {
    (BASE_STABLE_MAP[base] || []).forEach(sc => stable.add(sc));
  });
  return Array.from(stable);
}

function generatePublicId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TD';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getMerchant(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    return { error: 'Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.' };
  }
  
  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Unauthorized' };
  
  const service = createClient(
    supabaseUrl,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  // First check if merchant exists
  const { data: merchant, error: merchantError } = await service
    .from('merchants')
    .select('id, wallets, charge_customer_fee, tax_enabled, tax_rates')
    .eq('user_id', user.id)
    .single();
    
  if (merchantError) {
    console.error('Merchant lookup error:', merchantError);
    if (merchantError.code === 'PGRST116') {
      return { error: 'Merchant account not found. Please complete your merchant setup first.' };
    }
    return { error: 'Failed to load merchant account' };
  }
  
  if (!merchant) {
    return { error: 'Merchant account not found. Please complete your merchant setup first.' };
  }
  
  return { service, merchant, user };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getMerchant(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { service, merchant } = auth;
    const merchantWallets = merchant.wallets || {};
    const stableCoins = expandStableCoins(merchantWallets);
    const body = await request.json();
    const { id, label, tip_presets, charge_customer_fee, tax_enabled, accepted_cryptos } = body;
    
    const payload: Record<string, unknown> = { 
      merchant_id: merchant.id
    };
    
    // Temporarily skip registered_by to avoid foreign key issues
    // if (!id && user?.id) {
    //   payload.registered_by = user.id;
    // }
    
    if (label !== undefined) payload.label = label;
    if (tip_presets !== undefined) payload.tip_presets = tip_presets;
    if (charge_customer_fee !== undefined) payload.charge_customer_fee = charge_customer_fee;
    if (tax_enabled !== undefined) payload.tax_enabled = tax_enabled;
    if (accepted_cryptos !== undefined) payload.accepted_cryptos = accepted_cryptos;

    if (payload.charge_customer_fee === undefined) {
      payload.charge_customer_fee = merchant.charge_customer_fee;
    }
    if (payload.tax_enabled === undefined) {
      payload.tax_enabled = merchant.tax_enabled;
    }
    if (!id && payload.accepted_cryptos === undefined) {
      payload.accepted_cryptos = [...Object.keys(merchantWallets), ...stableCoins];
    }
    
    let result;
    if (id) {
      // Remove registered_by from update payload since it shouldn't change
      const updatePayload = { ...payload };
      delete updatePayload.registered_by;
      
      result = await service
        .from('terminal_devices')
        .update(updatePayload)
        .eq('id', id)
        .eq('merchant_id', merchant.id)
        .select('*')
        .single();
    } else {
      // Generate a unique public_id for new devices
      payload.public_id = generatePublicId();
      
      console.log('Creating terminal device with payload:', JSON.stringify(payload, null, 2));
      
      result = await service
        .from('terminal_devices')
        .insert(payload)
        .select('*')
        .single();
    }
    
    if (result.error) {
      console.error('Database error:', result.error);
      return NextResponse.json({ error: 'Failed to save device', details: result.error.message }, { status: 500 });
    }
    
    console.log('Terminal device created/updated successfully:', result.data);
    
    const data = {
      ...result.data,
      accepted_cryptos:
        (result.data.accepted_cryptos && result.data.accepted_cryptos.length)
          ? Array.from(new Set([...result.data.accepted_cryptos, ...stableCoins]))
          : [...Object.keys(merchantWallets), ...stableCoins],
      charge_customer_fee: result.data.charge_customer_fee,
      tax_enabled: result.data.tax_enabled,
      tax_rates: merchant.tax_rates || []
    };
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Terminal devices API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
