import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const internalKey = request.headers.get('X-Internal-Key');
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const body = await request.json();
  const {
    merchant_id,
    title,
    description,
    amount,
    currency = 'USD',
    accepted_cryptos = [],
    expires_at,
    max_uses,
    source,
    subscription_id,
    pos_device_id,
    metadata = {},
    charge_customer_fee = null,
    auto_convert_enabled = null,
    preferred_payout_currency = null,
    tax_enabled = false,
    tax_rates = []
  } = body;
  if (!merchant_id || !title || !amount || !accepted_cryptos.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('wallets, charge_customer_fee, auto_convert_enabled, preferred_payout_currency')
    .eq('id', merchant_id)
    .single();
  if (merchantError || !merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }
  const merchantWallets = merchant.wallets || {};
  const missingWallets = accepted_cryptos.filter((c: string) => !merchantWallets[c]);
  if (missingWallets.length > 0) {
    return NextResponse.json({ error: `Missing wallet addresses for: ${missingWallets.join(', ')}` }, { status: 400 });
  }
  const effectiveChargeCustomerFee = charge_customer_fee !== null ? charge_customer_fee : merchant.charge_customer_fee;
  const effectiveAutoConvertEnabled = auto_convert_enabled !== null ? auto_convert_enabled : merchant.auto_convert_enabled;
  const effectivePreferredPayoutCurrency = preferred_payout_currency !== null ? preferred_payout_currency : merchant.preferred_payout_currency;
  const amountNum = parseFloat(amount);
  let totalTaxAmount = 0;
  const taxBreakdown: Record<string, number> = {};
  if (tax_enabled && Array.isArray(tax_rates)) {
    tax_rates.forEach((t: { percentage: number; label: string }) => {
      const percentage = parseFloat(String(t.percentage)) || 0;
      const taxAmount = (amountNum * percentage) / 100;
      totalTaxAmount += taxAmount;
      taxBreakdown[t.label.toLowerCase().replace(/\s+/g, '_')] = taxAmount;
    });
  }
  const subtotalWithTax = amountNum + totalTaxAmount;
  
  // Task 1: Enforce fee math to exactly 0.5% or 1.0%
  const baseFeePct = 0.005; // 0.5%
  const autoConvertFeePct = effectiveAutoConvertEnabled ? 0.005 : 0; // +0.5% if auto-convert
  const totalFeePct = baseFeePct + autoConvertFeePct; // => 0.5% or 1.0%
  
  const feeAmount = subtotalWithTax * totalFeePct;
  
  // Customer total: if charge_customer_fee is true, customer pays extra to offset NOWPayments fee deduction
  const customerPaysTotal = effectiveChargeCustomerFee ? subtotalWithTax + feeAmount : subtotalWithTax;
  
  // Merchant receives: NOWPayments always deducts fee from payout, regardless of charge_customer_fee
  // When charge_customer_fee is true, the extra customer payment offsets this deduction
  const merchantReceives = subtotalWithTax - feeAmount;
  const linkId = generateLinkId();
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${linkId}`;
  // Normalize source to satisfy DB constraint: allow only 'manual' | 'subscription' | 'pos'
  const normalizedSource = (() => {
    const s = String(source || '').toLowerCase();
    if (!s) return 'manual';
    if (s === 'dashboard') return 'manual';
    if (s === 'subscription' || s === 'pos' || s === 'manual') return s;
    return 'manual';
  })();

  const insert: Record<string, unknown> = {
    merchant_id,
    title,
    description,
    amount: amountNum,
    base_amount: amountNum,
    currency,
    accepted_cryptos,
    link_id: linkId,
    qr_code_data: paymentUrl,
    expires_at: expires_at ? new Date(expires_at).toISOString() : null,
    max_uses: max_uses || null,
    status: 'active',
    charge_customer_fee: effectiveChargeCustomerFee,
    auto_convert_enabled: effectiveAutoConvertEnabled,
    preferred_payout_currency: effectivePreferredPayoutCurrency,
    fee_percentage: totalFeePct,
    tax_enabled,
    tax_rates: tax_enabled ? tax_rates : [],
    tax_amount: totalTaxAmount,
    subtotal_with_tax: subtotalWithTax,
    metadata: {
      ...metadata,
      fee_breakdown: {
        base_fee_percentage: baseFeePct * 100,
        auto_convert_fee_percentage: autoConvertFeePct * 100,
        total_fee_percentage: totalFeePct * 100,
        fee_amount: feeAmount,
        merchant_receives: merchantReceives,
        effective_charge_customer_fee: effectiveChargeCustomerFee,
        effective_auto_convert_enabled: effectiveAutoConvertEnabled,
        effective_preferred_payout_currency: effectivePreferredPayoutCurrency
      },
      tax_breakdown: taxBreakdown,
      wallet_addresses: Object.fromEntries(
        accepted_cryptos.map((c: string) => [c, merchantWallets[c]])
      )
    }
  };
  insert.source = normalizedSource;
  if (subscription_id) insert.subscription_id = subscription_id;
  if (pos_device_id) insert.pos_device_id = pos_device_id;
  const { data: paymentLink, error: insertError } = await supabase
    .from('payment_links')
    .insert(insert)
    .select()
    .single();
  if (insertError) {
    console.error('failed to create link', insertError);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    payment_link: { ...paymentLink, payment_url: paymentUrl, metadata: { ...paymentLink.metadata, fee_amount: feeAmount, customer_pays_total: customerPaysTotal } }
  });
}

function generateLinkId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'pl_';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
