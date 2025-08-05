import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Dynamic currency to wallet mapping for auto-forwarding
// This will be populated from NOWPayments API and cached
let DYNAMIC_CURRENCY_MAPPING: Record<string, string[]> = {};

// Static fallback mapping for critical currencies
const FALLBACK_CURRENCY_MAPPING: Record<string, string[]> = {
  // Major cryptocurrencies
  'BTC': ['BTC', 'BITCOIN'],
  'ETH': ['ETH', 'ETHEREUM'],
  'LTC': ['LTC', 'LITECOIN'],
  'XRP': ['XRP', 'RIPPLE'],
  'ADA': ['ADA', 'CARDANO'],
  'DOT': ['DOT', 'POLKADOT'],
  'SOL': ['SOL', 'SOLANA'],
  'AVAX': ['AVAX', 'AVALANCHE'],
  'MATIC': ['MATIC', 'POLYGON'],
  'BNB': ['BNB', 'BSC', 'BINANCE'],
  'TRX': ['TRX', 'TRON'],
  'TON': ['TON'],
  'NEAR': ['NEAR'],
  'ALGO': ['ALGO', 'ALGORAND'],
  'XLM': ['XLM', 'STELLAR'],
  'ARB': ['ARB', 'ARBITRUM'],
  'OP': ['OP', 'OPTIMISM'],
  'BASE': ['BASE'],
  
  // USDT variations (only USDT allowed as stablecoin)
  'USDT': ['ETH', 'ETHEREUM'], // USDT on Ethereum
  'USDTERC20': ['ETH', 'ETHEREUM'],
  'USDTBSC': ['BNB', 'BSC', 'BINANCE'],
  'USDTSOL': ['SOL', 'SOLANA'],
  'USDTMATIC': ['MATIC', 'POLYGON'],
  'USDTTRC20': ['TRX', 'TRON'],
  'USDTTON': ['TON'],
  'USDTARB': ['ARB', 'ARBITRUM'],
  'USDTOP': ['OP', 'OPTIMISM'],
  
  // USDC variations (only USDC allowed as stablecoin)
  'USDC': ['ETH', 'ETHEREUM'], // USDC on Ethereum
  'USDCERC20': ['ETH', 'ETHEREUM'],
  'USDCBSC': ['BNB', 'BSC', 'BINANCE'],
  'USDCSOL': ['SOL', 'SOLANA'],
  'USDCMATIC': ['MATIC', 'POLYGON'],
  'USDCARB': ['ARB', 'ARBITRUM'],
  'USDCOP': ['OP', 'OPTIMISM'],
  'USDCBASE': ['BASE'],
  'USDCALGO': ['ALGO', 'ALGORAND']
};

// Cache for NOWPayments currencies (refreshed every hour)
let currencyCache: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function loadNOWPaymentsCurrencies(): Promise<any[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (currencyCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return currencyCache;
  }

  try {
    console.log('🔄 Refreshing NOWPayments currency cache...');
    
    const response = await fetch('https://api.nowpayments.io/v1/currencies', {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`NOWPayments API error: ${response.status}`);
    }

    const data = await response.json();
    currencyCache = data.currencies || [];
    cacheTimestamp = now;
    
    // Build dynamic mapping
    buildDynamicCurrencyMapping(currencyCache);
    
    console.log(`✅ Loaded ${currencyCache.length} currencies from NOWPayments`);
    return currencyCache;
    
  } catch (error) {
    console.error('❌ Failed to load NOWPayments currencies:', error);
    // Return cached data if available, otherwise empty array
    return currencyCache;
  }
}

function buildDynamicCurrencyMapping(currencies: any[]) {
  DYNAMIC_CURRENCY_MAPPING = { ...FALLBACK_CURRENCY_MAPPING };
  
  currencies.forEach(currency => {
    const code = currency.toUpperCase();
    
    // Skip if already mapped
    if (DYNAMIC_CURRENCY_MAPPING[code]) {
      return;
    }
    
    // Determine network based on currency code patterns
    if (code.includes('ERC20') || code.includes('ETH')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['ETH', 'ETHEREUM'];
    } else if (code.includes('BSC') || code.includes('BEP20')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['BNB', 'BSC', 'BINANCE'];
    } else if (code.includes('TRC20') || code.includes('TRON')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['TRX', 'TRON'];
    } else if (code.includes('SOL') || code.includes('SOLANA')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['SOL', 'SOLANA'];
    } else if (code.includes('MATIC') || code.includes('POLYGON')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['MATIC', 'POLYGON'];
    } else if (code.includes('ARB') || code.includes('ARBITRUM')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['ARB', 'ARBITRUM'];
    } else if (code.includes('OP') || code.includes('OPTIMISM')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['OP', 'OPTIMISM'];
    } else if (code.includes('BASE')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['BASE'];
    } else if (code.includes('TON')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['TON'];
    } else if (code.includes('ALGO')) {
      DYNAMIC_CURRENCY_MAPPING[code] = ['ALGO', 'ALGORAND'];
    } else {
      // For standalone currencies, map to themselves
      DYNAMIC_CURRENCY_MAPPING[code] = [code];
    }
  });
  
  console.log(`🗺️ Built dynamic currency mapping for ${Object.keys(DYNAMIC_CURRENCY_MAPPING).length} currencies`);
}

function formatCurrencyForNOWPayments(currency: string): string {
  return currency.toLowerCase().trim();
}

function findWalletAddress(wallets: Record<string, string>, targetCurrency: string): string | null {
  const currencyUpper = targetCurrency.toUpperCase();
  const possibleWalletKeys = DYNAMIC_CURRENCY_MAPPING[currencyUpper] || FALLBACK_CURRENCY_MAPPING[currencyUpper] || [currencyUpper];
  
  console.log(`🔍 Looking for wallet address for ${currencyUpper}, checking keys:`, possibleWalletKeys);
  
  for (const key of possibleWalletKeys) {
    const keyUpper = key.toUpperCase();
    
    // Check exact match first
    if (wallets[keyUpper]) {
      console.log(`✅ Found wallet address for ${currencyUpper} using ${keyUpper} wallet`);
      return wallets[keyUpper];
    }
    
    // Check case-insensitive match
    const foundKey = Object.keys(wallets).find(k => k.toUpperCase() === keyUpper);
    if (foundKey && wallets[foundKey]) {
      console.log(`✅ Found wallet address for ${currencyUpper} using ${foundKey} wallet`);
      return wallets[foundKey];
    }
  }
  
  console.log(`⚠️ No wallet address found for target currency: ${currencyUpper}`);
  console.log(`Available wallets: [${Object.keys(wallets).map(k => `'${k}'`).join(', ')}]`);
  return null;
}

async function ensureAutoForwardingConfigured(merchantId: string, payCurrency: string): Promise<string | null> {
  try {
    // Get merchant data
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('wallets, auto_convert_enabled, preferred_payout_currency')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      console.error('❌ Merchant not found:', merchantError);
      return null;
    }

    // Ensure auto-forwarding is always enabled
    if (!merchant.auto_convert_enabled) {
      console.log('🔧 Enabling auto-forwarding for merchant...');
      await supabase
        .from('merchants')
        .update({ auto_convert_enabled: true })
        .eq('id', merchantId);
    }

    // Find appropriate wallet address
    if (merchant.wallets && typeof merchant.wallets === 'object') {
      const walletAddress = findWalletAddress(merchant.wallets, payCurrency);
      
      if (walletAddress) {
        console.log(`✅ Auto-forwarding configured for ${payCurrency}: ${walletAddress.substring(0, 10)}...`);
        return walletAddress;
      }
    }

    console.log(`⚠️ No wallet configured for ${payCurrency}, payment will require manual withdrawal`);
    return null;
    
  } catch (error) {
    console.error('❌ Error ensuring auto-forwarding configuration:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Parse request body and declare variables at function scope
  const body = await request.json();
  const {
    price_amount,
    price_currency,
    pay_currency,
    order_id,
    order_description,
    payment_link_id,
    ipn_callback_url,
    tax_enabled,
    base_amount,
    tax_rates,
    tax_amount,
    subtotal_with_tax
  } = body;

  const amount = parseFloat(price_amount);

  try {
    console.log('💳 Payment creation request:', {
      price_amount: amount,
      price_currency: price_currency,
      pay_currency: pay_currency,
      order_id: order_id,
      payment_link_id: payment_link_id
    });

    // Validate required fields
    if (!price_amount || !price_currency || !pay_currency || !payment_link_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid price amount' },
        { status: 400 }
      );
    }

    // Load latest currency data
    await loadNOWPaymentsCurrencies();

    // Step 1: Get payment link data
    console.log('🔍 Looking up payment link:', payment_link_id);
    
    const { data: paymentLinkData, error: linkError } = await supabase
      .from('payment_links')
      .select('id, merchant_id')
      .eq('id', payment_link_id)
      .single();

    if (linkError) {
      console.error('Error fetching payment link:', linkError);
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      );
    }

    console.log('✅ Payment link found:', {
      id: paymentLinkData.id,
      merchant_id: paymentLinkData.merchant_id
    });

    // Step 2: Ensure auto-forwarding is configured
    const walletAddress = await ensureAutoForwardingConfigured(paymentLinkData.merchant_id, pay_currency);

    // Prepare NOWPayments request with auto-forwarding
    const nowPaymentsPayload = {
      price_amount: amount,
      price_currency: formatCurrencyForNOWPayments(price_currency),
      pay_currency: formatCurrencyForNOWPayments(pay_currency),
      order_id: order_id || `cryptrac_${Date.now()}`,
      order_description: order_description || 'Cryptrac Payment',
      ipn_callback_url: ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      fixed_rate: false,
      // Always include payout_address if available (auto-forwarding should always be configured)
      ...(walletAddress && {
        payout_address: walletAddress
      })
    };

    console.log('📡 Sending payment request to NOWPayments:');
    console.log('- price_amount:', nowPaymentsPayload.price_amount);
    console.log('- price_currency:', nowPaymentsPayload.price_currency);
    console.log('- pay_currency:', nowPaymentsPayload.pay_currency);
    console.log('- order_id:', nowPaymentsPayload.order_id);
    console.log('- payout_address:', walletAddress ? `${walletAddress.substring(0, 10)}...` : 'NOT CONFIGURED');
    console.log('- auto_forwarding_enabled:', !!walletAddress);

    // Make request to NOWPayments
    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      },
      body: JSON.stringify(nowPaymentsPayload),
    });

    const nowPaymentsData = await nowPaymentsResponse.json();

    if (!nowPaymentsResponse.ok) {
      console.error('NOWPayments API error:', nowPaymentsResponse.status, nowPaymentsData);
      
      // If auto-forwarding failed, try without it as fallback
      if (walletAddress && nowPaymentsData.message?.includes('address')) {
        console.log('🔄 Auto-forwarding failed, retrying without auto-forwarding...');
        
        const retryPayload = {
          price_amount: amount,
          price_currency: formatCurrencyForNOWPayments(price_currency),
          pay_currency: formatCurrencyForNOWPayments(pay_currency),
          order_id: order_id || `cryptrac_${Date.now()}`,
          order_description: order_description || 'Cryptrac Payment',
          ipn_callback_url: ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
          fixed_rate: false
        };

        const retryResponse = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
          },
          body: JSON.stringify(retryPayload),
        });

        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          throw new Error(`NOWPayments API error: ${retryResponse.status} ${JSON.stringify(retryData)}`);
        }

        // Use retry data for the rest of the function
        Object.assign(nowPaymentsData, retryData);
      } else {
        throw new Error(`NOWPayments API error: ${nowPaymentsResponse.status} ${JSON.stringify(nowPaymentsData)}`);
      }
    }

    console.log('✅ NOWPayments response received:', {
      payment_id: nowPaymentsData.payment_id,
      payment_status: nowPaymentsData.payment_status,
      pay_address: nowPaymentsData.pay_address?.substring(0, 20) + '...',
      pay_amount: nowPaymentsData.pay_amount,
      auto_forwarding_active: !!walletAddress
    });

    // Calculate gateway fee (approximate)
    const gatewayFee = nowPaymentsData.price_amount * 0.005; // Approximate 0.5% fee

    // Store transaction in database using CORRECT column names
    console.log('💾 Storing transaction in database:', {
      nowpayments_payment_id: nowPaymentsData.payment_id, // UPDATED: Use correct column name
      status: nowPaymentsData.payment_status,
      amount: nowPaymentsData.price_amount,
      pay_amount: nowPaymentsData.pay_amount,
      gateway_fee: gatewayFee,
      auto_forwarding_enabled: !!walletAddress
    });

    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        nowpayments_payment_id: nowPaymentsData.payment_id.toString(), // UPDATED: Use correct column name
        payment_link_id: payment_link_id,
        order_id: nowPaymentsData.order_id,
        status: nowPaymentsData.payment_status,
        amount: nowPaymentsData.price_amount, // price_amount -> amount
        currency: nowPaymentsData.price_currency?.toUpperCase(), // price_currency -> currency
        pay_amount: nowPaymentsData.pay_amount,
        pay_currency: nowPaymentsData.pay_currency?.toUpperCase(),
        pay_address: nowPaymentsData.pay_address,
        payout_currency: nowPaymentsData.outcome_currency?.toUpperCase(),
        gateway_fee: gatewayFee,
        amount_received: 0,
        currency_received: nowPaymentsData.pay_currency?.toUpperCase(),
        merchant_receives: nowPaymentsData.outcome_amount || (nowPaymentsData.pay_amount - gatewayFee),
        // Tax information
        base_amount: base_amount || amount,
        tax_enabled: tax_enabled || false,
        tax_rates: tax_rates || [],
        tax_amount: tax_amount || 0,
        subtotal_with_tax: subtotal_with_tax || amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Error storing transaction:', transactionError);
      // Continue anyway - payment was created successfully
    } else {
      console.log('✅ Transaction stored successfully:', transactionData?.id);
    }

    // Update payment link usage count
    try {
      await supabase.rpc('increment_payment_link_usage', {
        input_id: paymentLinkData.id
      });
      console.log('✅ Payment link usage updated');
    } catch (usageError) {
      console.error('⚠️ Error updating payment link usage:', usageError);
      // Continue anyway - this is not critical
    }

    // Return success response
    return NextResponse.json({
      success: true,
      payment: {
        payment_id: nowPaymentsData.payment_id,
        payment_status: nowPaymentsData.payment_status,
        pay_address: nowPaymentsData.pay_address,
        pay_amount: nowPaymentsData.pay_amount,
        pay_currency: nowPaymentsData.pay_currency,
        price_amount: nowPaymentsData.price_amount,
        price_currency: nowPaymentsData.price_currency,
        order_id: nowPaymentsData.order_id,
        order_description: nowPaymentsData.order_description,
        created_at: nowPaymentsData.created_at,
        updated_at: nowPaymentsData.updated_at,
        outcome_amount: nowPaymentsData.outcome_amount,
        outcome_currency: nowPaymentsData.outcome_currency,
        auto_forwarding_enabled: !!walletAddress
      }
    });

  } catch (error) {
    console.error('❌ Payment creation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment'
      },
      { status: 500 }
    );
  }
}

