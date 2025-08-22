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
  if (!serviceKey) return { error: 'Server misconfigured' };
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: merchant, error: merchantError } = await service
    .from('merchants')
    .select('charge_customer_fee, auto_convert_enabled, tax_enabled, tax_rates')
    .eq('user_id', user.id)
    .single();
  if (merchantError || !merchant) return { error: 'Merchant account not found' };
  return { merchant };
}

export async function POST(request: NextRequest) {
  const auth = await getMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { merchant } = auth;
  const body = await request.json();
  const { amount, tax_enabled, charge_customer_fee } = body;
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
  }
  const effectiveTaxEnabled = typeof tax_enabled === 'boolean' ? tax_enabled : merchant.tax_enabled;
  const effectiveChargeCustomerFee = typeof charge_customer_fee === 'boolean' ? charge_customer_fee : merchant.charge_customer_fee;
  
  let taxAmount = 0;
  let taxBreakdown: Record<string, number> = {};
  
  if (effectiveTaxEnabled && merchant.tax_rates && merchant.tax_rates.length > 0) {
    merchant.tax_rates.forEach((t: { label: string; percentage: number | string }) => {
      const pct = parseFloat(String(t.percentage)) || 0;
      const individualTaxAmount = (amountNum * pct) / 100;
      taxAmount += individualTaxAmount;
      
      // Create breakdown key from label (lowercase, replace spaces with underscores)
      const breakdownKey = t.label.toLowerCase().replace(/\s+/g, '_');
      taxBreakdown[breakdownKey] = individualTaxAmount;
    });
  }
  
  const subtotalWithTax = amountNum + taxAmount;
  const baseFeePercentage = 0.005;
  const autoConvertFeePercentage = merchant.auto_convert_enabled ? 0.005 : 0;
  const feeAmount = subtotalWithTax * (baseFeePercentage + autoConvertFeePercentage);
  const gatewayFee = effectiveChargeCustomerFee ? feeAmount : 0;
  const preTipTotal = subtotalWithTax + gatewayFee;
  
  return NextResponse.json({
    tax_amount: taxAmount,
    subtotal_with_tax: subtotalWithTax,
    gateway_fee: gatewayFee,
    pre_tip_total: preTipTotal,
    effective: {
      tax_enabled: effectiveTaxEnabled,
      charge_customer_fee: effectiveChargeCustomerFee,
      auto_convert_enabled: merchant.auto_convert_enabled
    },
    tax_breakdown: taxBreakdown,
    fee_breakdown: {
      base_fee_percentage: baseFeePercentage * 100,
      auto_convert_fee_percentage: autoConvertFeePercentage * 100,
      total_fee_percentage: (baseFeePercentage + autoConvertFeePercentage) * 100,
      fee_amount: feeAmount
    }
  });
}
