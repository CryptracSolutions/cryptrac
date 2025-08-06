import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYMENT CREATE API START ===');
    
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted from Authorization header');

    // Create regular Supabase client for authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the current user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      amount,
      currency = 'USD',
      accepted_cryptos = [],
      expires_at,
      max_uses,
      redirect_url,
      charge_customer_fee = null, // null = inherit from merchant global setting
      auto_convert_enabled = null, // null = inherit from merchant global setting
      preferred_payout_currency = null, // null = inherit from merchant global setting
      tax_enabled = false,
      tax_rates = []
    } = body;

    console.log('Request body parsed:', { title, amount, currency, accepted_cryptos });

    // Validate required fields
    if (!title || !amount) {
      return NextResponse.json(
        { error: 'Title and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate accepted_cryptos
    if (!Array.isArray(accepted_cryptos) || accepted_cryptos.length === 0) {
      return NextResponse.json(
        { error: 'At least one accepted cryptocurrency is required' },
        { status: 400 }
      );
    }

    // Create service role client for all database operations (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get merchant with wallet addresses and fee settings
    const { data: merchant, error: merchantError } = await serviceSupabase
      .from('merchants')
      .select('id, business_name, user_id, wallets, charge_customer_fee, auto_convert_enabled, preferred_payout_currency')
      .eq('user_id', user.id)
      .single();

    if (merchantError) {
      console.log('Merchant lookup error:', merchantError);
      return NextResponse.json(
        { error: 'Merchant account not found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    console.log('Found merchant:', merchant.id);

    // Validate that merchant has wallet addresses for all accepted cryptocurrencies
    const merchantWallets = merchant.wallets || {};
    const missingWallets = accepted_cryptos.filter(crypto => 
      !merchantWallets[crypto] || !merchantWallets[crypto].trim()
    );

    if (missingWallets.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing wallet addresses for: ${missingWallets.join(', ')}. Please configure wallet addresses in your settings.`,
          missing_wallets: missingWallets
        },
        { status: 400 }
      );
    }

    console.log('Wallet validation passed for currencies:', accepted_cryptos);

    // Determine effective settings (per-link override or merchant global)
    const effectiveChargeCustomerFee = charge_customer_fee !== null 
      ? charge_customer_fee 
      : (merchant.charge_customer_fee || false);

    const effectiveAutoConvertEnabled = auto_convert_enabled !== null 
      ? auto_convert_enabled 
      : (merchant.auto_convert_enabled || false);

    const effectivePreferredPayoutCurrency = preferred_payout_currency !== null 
      ? preferred_payout_currency 
      : merchant.preferred_payout_currency;

    // Parse amount for calculations
    const amountNum = parseFloat(amount);

    // Calculate taxes from tax rates
    let totalTaxAmount = 0;
    const taxBreakdown: Record<string, number> = {};
    
    if (tax_enabled && Array.isArray(tax_rates) && tax_rates.length > 0) {
      tax_rates.forEach((taxRate: { percentage: number | string; label: string }) => {
        const percentage = parseFloat(taxRate.percentage as string) || 0;
        const taxAmount = (amountNum * percentage) / 100;
        totalTaxAmount += taxAmount;
        
        // Create breakdown key from label
        const breakdownKey = taxRate.label.toLowerCase().replace(/\s+/g, '_');
        taxBreakdown[breakdownKey] = taxAmount;
      });
    }
    
    const subtotalWithTax = amountNum + totalTaxAmount;

    // Calculate fees based on settings (fees calculated on post-tax amount)
    const amountForFeeCalculation = subtotalWithTax;
    const baseFeePercentage = 0.005; // 0.5% base fee
    const autoConvertFeePercentage = effectiveAutoConvertEnabled ? 0.005 : 0; // Additional 0.5% for auto-convert
    const totalFeePercentage = baseFeePercentage + autoConvertFeePercentage;
    const feeAmount = amountForFeeCalculation * totalFeePercentage;
    
    // Calculate final amounts based on who pays the fee
    const customerPaysTotal = effectiveChargeCustomerFee ? subtotalWithTax + feeAmount : subtotalWithTax;
    const merchantReceives = effectiveChargeCustomerFee ? subtotalWithTax : subtotalWithTax - feeAmount;

    console.log('Fee calculation:', {
      effectiveChargeCustomerFee,
      effectiveAutoConvertEnabled,
      totalFeePercentage: totalFeePercentage * 100 + '%',
      feeAmount,
      customerPaysTotal,
      merchantReceives
    });

    // Generate unique link ID
    const linkId = generateLinkId();
    console.log('Generated link ID:', linkId);

    // Generate payment URL
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${linkId}`;

    // Create payment link with new fields
    const { data: paymentLink, error: insertError } = await serviceSupabase
      .from('payment_links')
      .insert({
        merchant_id: merchant.id,
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
        charge_customer_fee: effectiveChargeCustomerFee, // Store the effective value
        auto_convert_enabled: effectiveAutoConvertEnabled, // Store the effective value
        preferred_payout_currency: effectivePreferredPayoutCurrency, // Store the effective value
        fee_percentage: totalFeePercentage,
        tax_enabled: tax_enabled,
        tax_rates: tax_enabled ? tax_rates : [],
        tax_amount: totalTaxAmount,
        subtotal_with_tax: subtotalWithTax,
        metadata: {
          redirect_url: redirect_url || null,
          fee_breakdown: {
            base_fee_percentage: baseFeePercentage * 100,
            auto_convert_fee_percentage: autoConvertFeePercentage * 100,
            total_fee_percentage: totalFeePercentage * 100,
            fee_amount: feeAmount,
            merchant_receives: merchantReceives,
            effective_charge_customer_fee: effectiveChargeCustomerFee,
            effective_auto_convert_enabled: effectiveAutoConvertEnabled,
            effective_preferred_payout_currency: effectivePreferredPayoutCurrency
          },
          tax_breakdown: taxBreakdown,
          wallet_addresses: Object.fromEntries(
            accepted_cryptos.map(crypto => [crypto, merchantWallets[crypto]])
          )
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      );
    }

    console.log('Payment link created successfully:', paymentLink.id);

    // Return success response with enhanced metadata
    return NextResponse.json({
      success: true,
      payment_link: {
        ...paymentLink,
        payment_url: paymentUrl,
        qr_code_data: paymentUrl,
        metadata: {
          ...paymentLink.metadata,
          fee_amount: feeAmount,
          fee_percentage: totalFeePercentage * 100,
          merchant_receives: merchantReceives,
          effective_settings: {
            charge_customer_fee: effectiveChargeCustomerFee,
            auto_convert_enabled: effectiveAutoConvertEnabled,
            preferred_payout_currency: effectivePreferredPayoutCurrency
          }
        }
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a unique link ID
function generateLinkId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'pl_';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

