import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAvailableCurrencies } from '@/lib/nowpayments-dynamic';
import { isApprovedCurrency } from '@/lib/approved-currencies';

const NETWORK_WALLET_MAPPING: Record<string, string[]> = {
  BTC: ['BTC', 'BITCOIN'],
  // ETH network and common ERC-20 tokens
  ETH: ['ETH', 'ETHEREUM', 'USDT', 'USDTERC20', 'USDC', 'USDCERC20', 'DAI', 'PYUSD', 'OCEAN'],
  BNB: ['BNB', 'BSC', 'BINANCE', 'BNBBSC', 'USDTBSC', 'USDCBSC'],
  SOL: ['SOL', 'SOLANA', 'USDTSOL', 'USDCSOL'],
  MATIC: ['MATIC', 'POLYGON', 'USDTMATIC', 'USDCMATIC'],
  AVAX: ['AVAX', 'AVALANCHE', 'AVAXC', 'USDTARC20', 'USDCARC20'],
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
  ETHBASE: ['ETHBASE', 'USDCBASE', 'ETH'],
  ZK: ['ZK', 'ZKSYNC'],
  // Additional networks
  FTM: ['FTM', 'FANTOM'],
  RUNE: ['RUNE', 'THORCHAIN'],
  CFX: ['CFX', 'CONFLUX', 'CFXMAINNET'],
  CRO: ['CRO', 'CRONOS', 'CROMAINNET'],
  INJ: ['INJ', 'INJMAINNET', 'INJERC20']
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
  BNB: ['USDTBSC', 'BUSDBSC', 'USDCBSC'],
  BNBBSC: ['USDTBSC', 'BUSDBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  // Avalanche C-Chain stablecoins
  AVAX: ['USDTARC20', 'USDCARC20'],
  AVAXC: ['USDTARC20', 'USDCARC20'],
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

  const stable = new Set<string>();
  bases.forEach(base => {
    (BASE_STABLE_MAP[base] || []).forEach(sc => stable.add(sc));
  });
  return Array.from(stable);
}

// FIXED: Updated mapping function to match the logic from /pay/[id] page
async function mapToNowPaymentsCode(displayCode: string): Promise<string | null> {
  const currencies = await fetchAvailableCurrencies();
  
  // Comprehensive alternative mapping for all currencies (copied from pay page)
  const currencyAlternatives: Record<string, string[]> = {
    // Major cryptocurrencies
    'BTC': ['BTC', 'BITCOIN', 'BTCLN', 'BTCSEGWIT'],
    'ETH': ['ETH', 'ETHEREUM', 'ETHBSC', 'ETHMATIC', 'ETHARB', 'ETHOP', 'ETHBASE', 'BASEETH', 'ETH_BASE'],
    'BNB': ['BNB', 'BNBBSC', 'BSC', 'BNB_BSC', 'BINANCE', 'BNBCHAIN'],
    'SOL': ['SOL', 'SOLANA', 'SOLSPL'],
    'ADA': ['ADA', 'CARDANO'],
    'DOT': ['DOT', 'POLKADOT'],
    'MATIC': ['MATIC', 'POLYGON', 'MATICMATIC'],
    'AVAX': ['AVAX', 'AVALANCHE', 'AVAXC'],
    'TRX': ['TRX', 'TRON'],
    'LTC': ['LTC', 'LITECOIN'],
    'XRP': ['XRP', 'RIPPLE'],
    'TON': ['TON', 'TONCOIN'],
    'NEAR': ['NEAR', 'NEARPROTOCOL'],
    'ALGO': ['ALGO', 'ALGORAND'],
    'XLM': ['XLM', 'STELLAR'],
    'ARB': ['ARB', 'ARBITRUM'],
    'OP': ['OP', 'OPTIMISM'],
    'ETHBASE': ['ETHBASE', 'BASE', 'BASECHAIN', 'BASEETH', 'ETH_BASE'],
    // zkSync
    'ZK': ['ZK', 'ZKSYNC', 'ZKERC20'],
    // Additional networks
    'FTM': ['FTM', 'FANTOM'],
    'RUNE': ['RUNE', 'THORCHAIN'],
    'CFX': ['CFX', 'CFXMAINNET', 'CONFLUX'],
    'CRO': ['CRO', 'CRONOS', 'CROMAINNET'],
    'INJ': ['INJ', 'INJMAINNET', 'INJERC20'],
    // Common ERC-20 tokens
    'OCEAN': ['OCEAN', 'OCEANERC20'],
    'GALA': ['GALA', 'GALAERC20'],

    // Network-suffixed stablecoin variants and aliases
    // Avalanche C-chain stablecoins (do not alias to Arbitrum)
    'USDTARC20': ['USDTARC20'],
    'USDCARC20': ['USDCARC20'],
    'OPUSDCE': ['USDCOP', 'OPUSDCE'],
    'MATICUSDCE': ['USDCMATIC', 'MATICUSDCE'],
    'MATICMAINNET': ['MATIC'],
    'USDTCELO': ['USDTCELO'],
    'ZROARB': ['ZROARB'],
    'ZROERC20': ['ZROERC20'],
    'BNBBSC': ['BNBBSC'],
    'BUSDBSC': ['BUSDBSC'],
    'ETHARB': ['ETHARB'],
    'BRETTBASE': ['BRETTBASE'],
    'WBTCMATIC': ['WBTCMATIC'],
    'TUSDTRC20': ['TUSDTRC20'],
    'STRKMAINNET': ['STRKMAINNET'],
    // Explicit identities for common USDT variants
    'USDTERC20': ['USDTERC20'],
    'USDTBSC': ['USDTBSC'],
    'USDTTRC20': ['USDTTRC20'],
    'USDTMATIC': ['USDTMATIC'],
    'USDTSOL': ['USDTSOL'],
    'USDTTON': ['USDTTON'],
    'USDTARB': ['USDTARB'],
    'USDTOP': ['USDTOP'],
    // Explicit identities for common USDC variants
    'USDCERC20': ['USDCERC20'],
    'USDCBSC': ['USDCBSC'],
    'USDCMATIC': ['USDCMATIC'],
    'USDCSOL': ['USDCSOL'],
    'USDCALGO': ['USDCALGO'],
    'USDCARB': ['USDCARB'],
    'USDCOP': ['USDCOP'],
    'USDCBASE': ['USDCBASE'],
    'CFXMAINNET': ['CFX'],
    'CROMAINNET': ['CRO'],
    'INJMAINNET': ['INJ'],
    'INJERC20': ['INJ'],
    
    // Stablecoins - FIXED: Proper mapping for USDT and USDC
    'USDT': ['USDTERC20', 'USDT', 'USDTBSC', 'USDTTRC20', 'USDTMATIC', 'USDTSOL', 'USDTTON', 'USDTARB', 'USDTOP'],
    'USDC': ['USDCERC20', 'USDC', 'USDCBSC', 'USDCMATIC', 'USDCSOL', 'USDCALGO', 'USDCARB', 'USDCOP', 'USDCBASE'],
    'DAI': ['DAI', 'DAIERC20'],
    'PYUSD': ['PYUSD', 'PYUSDERC20']
  };

  // Dynamic network patterns for comprehensive detection
  const networkPatterns = [
    'BSC', 'ERC20', 'TRC20', 'SOL', 'MATIC', 'ARB', 'OP', 'BASE', 'AVAX', 'TON', 'ALGO', 'NEAR'
  ];

  const displayCodeUpper = displayCode.toUpperCase();
  
  // Try predefined alternatives first
  const alternatives = currencyAlternatives[displayCodeUpper] || [];
  
  // Check predefined alternatives - FIXED: Use 'is_available' instead of 'enabled'
  for (const alt of alternatives) {
    const found = currencies.find(c => 
      c.code.toUpperCase() === alt.toUpperCase() && c.is_available
    );
    if (found) {
      console.log(`✅ Currency mapping: ${displayCode} → ${found.code}`);
      return found.code;
    }
  }
  
  // If no predefined alternative found, try dynamic patterns - FIXED: Use 'is_available' instead of 'enabled'
  const baseCode = displayCodeUpper;
  for (const pattern of networkPatterns) {
    const dynamicCode = `${baseCode}${pattern}`;
    const found = currencies.find(c => 
      c.code.toUpperCase() === dynamicCode && c.is_available
    );
    if (found) {
      console.log(`✅ Currency mapping (dynamic): ${displayCode} → ${found.code}`);
      return found.code;
    }
  }
  
  // Fallback to exact match - FIXED: Use 'is_available' instead of 'enabled'
  const exactMatch = currencies.find(c => 
    c.code.toUpperCase() === displayCodeUpper && c.is_available
  );
  if (exactMatch) {
    console.log(`✅ Currency mapping (exact): ${displayCode} → ${exactMatch.code}`);
    return exactMatch.code;
  }
  
  console.warn(`⚠️ No currency mapping found for: ${displayCode}`);
  return null;
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
    .select('id, wallets, charge_customer_fee, auto_convert_enabled, tax_enabled, tax_rates, preferred_payout_currency')
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
  
  return { service, merchant };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getMerchant(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { service, merchant } = auth;
    const body = await request.json();
    const { amount, tip_amount = 0, pay_currency, pos_device_id, tax_enabled, charge_customer_fee } = body;
    if (!amount || !pay_currency || !pos_device_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Reject unapproved currencies
    if (!isApprovedCurrency(String(pay_currency).toUpperCase())) {
      return NextResponse.json({ error: `Unsupported currency: ${String(pay_currency).toUpperCase()}` }, { status: 400 });
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
    
    // Expand stablecoins like payment links do
    const stableCoins = expandStableCoins(wallets);
    const deviceCryptos = (device.accepted_cryptos && device.accepted_cryptos.length
      ? device.accepted_cryptos
      : Object.keys(wallets))
      .filter((c: string) => isApprovedCurrency(c));
    
    // Create comprehensive accepted currencies list including stablecoins
    const acceptedCryptos = Array.from(new Set([...deviceCryptos, ...stableCoins])).filter(c => isApprovedCurrency(c));
    
    const allowed = new Set(acceptedCryptos);
    if (!allowed.has(pay_currency)) {
      return NextResponse.json({ error: 'Currency not accepted by device' }, { status: 400 });
    }
    const nowPayCurrency = await mapToNowPaymentsCode(pay_currency);
    if (!nowPayCurrency) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
    }
    const effectiveChargeCustomerFee =
      charge_customer_fee ?? device.charge_customer_fee ?? merchant.charge_customer_fee;
    const effectiveTaxEnabled =
      tax_enabled ?? device.tax_enabled ?? merchant.tax_enabled;
    const taxRates = effectiveTaxEnabled ? merchant.tax_rates || [] : [];
    let taxAmount = 0;
    taxRates.forEach((t: { percentage: number | string }) => {
      const pct = parseFloat(String(t.percentage)) || 0;
      taxAmount += (amountNum * pct) / 100;
    });
    const subtotalWithTax = amountNum + taxAmount;
    const baseFeePercentage = 0.005;
    const autoConvertFeePercentage = merchant.auto_convert_enabled ? 0.005 : 0;
    const feePercentage = baseFeePercentage + autoConvertFeePercentage;
    const feeAmount = subtotalWithTax * feePercentage;
    const gatewayFee = effectiveChargeCustomerFee ? feeAmount : 0;
    const preTipTotal = subtotalWithTax + gatewayFee;
    const finalTotal = preTipTotal + tipNum;
    const merchantReceives = effectiveChargeCustomerFee
      ? subtotalWithTax
      : subtotalWithTax - feeAmount;
    
    // Create wallet addresses mapping for all accepted currencies
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
      auto_convert_enabled: merchant.auto_convert_enabled,
      preferred_payout_currency: merchant.preferred_payout_currency,
      fee_percentage: feePercentage,
      tax_enabled: effectiveTaxEnabled,
      tax_rates: taxRates,
      tax_amount: taxAmount,
      subtotal_with_tax: subtotalWithTax,
      metadata: {
        pos: { device_id: pos_device_id, tip_amount: tipNum, pre_tip_total: preTipTotal },
        wallet_addresses: walletAddresses,
        fee_breakdown: {
          base_fee_percentage: baseFeePercentage * 100,
          auto_convert_fee_percentage: autoConvertFeePercentage * 100,
          total_fee_percentage: feePercentage * 100,
          fee_amount: feeAmount,
          merchant_receives: merchantReceives,
          effective_charge_customer_fee: effectiveChargeCustomerFee,
          effective_auto_convert_enabled: merchant.auto_convert_enabled,
          effective_preferred_payout_currency: merchant.preferred_payout_currency
        }
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
        pay_currency: nowPayCurrency,
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
      // Return detailed error information
      if (paymentJson?.code === 'AMOUNT_TOO_SMALL_FOR_AUTO_FORWARDING') {
        return NextResponse.json({ 
          error: 'Payment amount too small for auto-forwarding',
          details: paymentJson.details,
          suggestedAmount: paymentJson.suggestedAmount,
          code: paymentJson.code
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create payment',
        details: paymentJson?.error || paymentJson?.details || 'Unknown error'
      }, { status: 500 });
    }
    return NextResponse.json({
      payment_link: paymentLink,
      now: {
        payment_id: paymentJson.payment.payment_id,
        payment_status: paymentJson.payment.payment_status,
        pay_address: paymentJson.payment.pay_address,
        pay_amount: paymentJson.payment.pay_amount,
        pay_currency: paymentJson.payment.pay_currency,
        payin_extra_id: paymentJson.payment.payin_extra_id
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
  } catch (error) {
    console.error('Terminal invoice API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
