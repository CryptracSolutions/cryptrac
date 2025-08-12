import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const NETWORK_WALLET_MAPPING: Record<string, string[]> = {
  BTC: ['BTC', 'BITCOIN'],
  ETH: ['ETH', 'ETHEREUM', 'USDT', 'USDTERC20', 'USDC', 'USDCERC20', 'DAI', 'PYUSD'],
  BNB: ['BNB', 'BSC', 'BINANCE', 'BNBBSC', 'USDTBSC', 'USDCBSC'],
  SOL: ['SOL', 'SOLANA', 'USDTSOL', 'USDCSOL'],
  MATIC: ['MATIC', 'POLYGON', 'USDTMATIC', 'USDCMATIC'],
  AVAX: ['AVAX', 'AVALANCHE'],
  TRX: ['TRX', 'TRON', 'USDTTRC20'],
  TON: ['TON', 'USDTTON'],
  LTC: ['LTC', 'LITECOIN'],
  ADA: ['ADA', 'CARDANO'],
  DOT: ['DOT', 'POLKADOT'],
  XRP: ['XRP', 'RIPPLE'],
  NEAR: ['NEAR'],
  ALGO: ['ALGO', 'ALGORAND', 'USDCALGO'],
  XLM: ['XLM', 'STELLAR'],
  ARB: ['ARB', 'ARBITRUM', 'USDTARB', 'USDCARB'],
  OP: ['OP', 'OPTIMISM', 'USDTOP', 'USDCOP'],
  ETHBASE: ['ETHBASE', 'USDCBASE', 'ETH']
};

const STABLE_FALLBACK: Record<string, string> = {
  USDTARB: 'ETH',
  USDCARB: 'ETH',
  USDTOP: 'ETH',
  USDCOP: 'ETH',
  USDCBASE: 'ETHBASE'
};

const BASE_STABLE_MAP: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD'],
  BNB: ['USDTBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO']
};

function getWalletKeyForCurrency(currency: string, wallets: Record<string, string>): string | null {
  const upper = currency.toUpperCase();
  if (wallets[upper]) return upper;
  for (const [network, currencies] of Object.entries(NETWORK_WALLET_MAPPING)) {
    if (currencies.includes(upper)) {
      if (wallets[network]) return network;
      for (const alt of currencies) {
        if (wallets[alt]) return alt;
      }
    }
  }
  const associatedBase = STABLE_FALLBACK[upper];
  if (associatedBase && wallets[associatedBase]) return associatedBase;
  return null;
}

function expandStableCoins(wallets: Record<string, string>): string[] {
  const bases = Object.keys(wallets);
  if (wallets['ETH'] && !bases.includes('ETHBASE')) bases.push('ETHBASE');
  const stable = new Set<string>();
  bases.forEach(base => {
    (BASE_STABLE_MAP[base] || []).forEach(sc => stable.add(sc));
  });
  return Array.from(stable);
}

function generateLinkId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'pl_';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
  if (!serviceKey) return { error: 'Server misconfigured' };
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: merchant, error: merchantError } = await service
    .from('merchants')
    .select('id, wallets, charge_customer_fee, auto_convert_enabled, tax_enabled, tax_rates')
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
  const { amount, tip_amount = 0, pay_currency, pos_device_id } = body;
  if (!amount || !pay_currency || !pos_device_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const amountNum = parseFloat(amount);
  const tipNum = parseFloat(tip_amount) || 0;
  if (isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }
  if (tipNum < 0) {
    return NextResponse.json({ error: 'Invalid tip amount' }, { status: 400 });
  }
  const { data: device, error: deviceError } = await service
    .from('terminal_devices')
    .select('charge_customer_fee, tax_enabled, accepted_cryptos')
    .eq('id', pos_device_id)
    .eq('merchant_id', merchant.id)
    .single();
  if (deviceError || !device) {
    return NextResponse.json({ error: 'Terminal device not found' }, { status: 404 });
  }
  const wallets = merchant.wallets || {};
  const walletKey = getWalletKeyForCurrency(pay_currency, wallets);
  if (!walletKey) {
    return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
  }
  const stableCoins = expandStableCoins(wallets);
  const deviceCryptos = device.accepted_cryptos && device.accepted_cryptos.length
    ? device.accepted_cryptos
    : Object.keys(wallets);
  const allowed = new Set([...deviceCryptos, ...stableCoins]);
  if (!allowed.has(pay_currency)) {
    return NextResponse.json({ error: 'Currency not accepted by device' }, { status: 400 });
  }
  const effectiveChargeCustomerFee = device.charge_customer_fee ?? merchant.charge_customer_fee;
  const effectiveTaxEnabled = device.tax_enabled ?? merchant.tax_enabled;
  const taxRates = effectiveTaxEnabled ? merchant.tax_rates || [] : [];
  let taxAmount = 0;
  taxRates.forEach((t: { percentage: number | string }) => {
    const pct = parseFloat(String(t.percentage)) || 0;
    taxAmount += (amountNum * pct) / 100;
  });
  const subtotalWithTax = amountNum + taxAmount;
  const baseFeePercentage = 0.005;
  const autoConvertFeePercentage = merchant.auto_convert_enabled ? 0.005 : 0;
  const feeAmount = subtotalWithTax * (baseFeePercentage + autoConvertFeePercentage);
  const gatewayFee = effectiveChargeCustomerFee ? feeAmount : 0;
  const preTipTotal = subtotalWithTax + gatewayFee;
  const finalTotal = preTipTotal + tipNum;
  const acceptedCryptos = Array.from(new Set([pay_currency, ...stableCoins]));
  const walletAddresses = Object.fromEntries(
    acceptedCryptos.map(c => {
      const key = getWalletKeyForCurrency(c, wallets);
      return [c, key ? wallets[key] : null];
    })
  );
  const linkId = generateLinkId();
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${linkId}`;
  const insert: Record<string, unknown> = {
    merchant_id: merchant.id,
    title: 'POS Sale',
    amount: amountNum,
    base_amount: amountNum,
    currency: 'USD',
    accepted_cryptos: acceptedCryptos,
    link_id: linkId,
    qr_code_data: paymentUrl,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    max_uses: 1,
    status: 'active',
    source: 'pos',
    pos_device_id,
    charge_customer_fee: effectiveChargeCustomerFee,
    tax_enabled: effectiveTaxEnabled,
    tax_rates: taxRates,
    tax_amount: taxAmount,
    subtotal_with_tax: subtotalWithTax,
    metadata: {
      pos: { device_id: pos_device_id, tip_amount: tipNum, pre_tip_total: preTipTotal },
      wallet_addresses: walletAddresses
    }
  };
  const { data: paymentLink, error: linkError } = await service
    .from('payment_links')
    .insert(insert)
    .select('id, link_id')
    .single();
  if (linkError || !paymentLink) {
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
  const paymentRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/nowpayments/create-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price_amount: finalTotal,
      price_currency: 'USD',
      pay_currency,
      order_id: `pos_${paymentLink.link_id}_${Date.now()}`,
      order_description: 'POS Sale',
      payment_link_id: paymentLink.id,
      base_amount: amountNum,
      tax_enabled: effectiveTaxEnabled,
      tax_rates: taxRates,
      tax_amount: taxAmount,
      subtotal_with_tax: subtotalWithTax
    })
  });
  const paymentJson = await paymentRes.json();
  if (!paymentRes.ok || !paymentJson?.payment?.pay_address) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
  return NextResponse.json({
    payment_link: paymentLink,
    now: {
      pay_address: paymentJson.payment.pay_address,
      pay_amount: paymentJson.payment.pay_amount,
      pay_currency: paymentJson.payment.pay_currency
    },
    breakdown: {
      tax_amount: taxAmount,
      subtotal_with_tax: subtotalWithTax,
      gateway_fee: gatewayFee,
      pre_tip_total: preTipTotal,
      tip_amount: tipNum,
      final_total: finalTotal
    }
  });
}