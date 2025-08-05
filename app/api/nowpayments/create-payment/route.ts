import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enhanced currency to wallet mapping for auto-forwarding
const CURRENCY_TO_WALLET_MAPPING: Record<string, string[]> = {
  // Ethereum and ERC-20 tokens
  'ETH': ['ETH', 'ETHEREUM'],
  'USDT': ['ETH', 'ETHEREUM'], // USDT on Ethereum
  'USDTERC20': ['ETH', 'ETHEREUM'], // USDT ERC-20
  'USDC': ['ETH', 'ETHEREUM'], // USDC on Ethereum
  'DAI': ['ETH', 'ETHEREUM'], // DAI on Ethereum
  'PYUSD': ['ETH', 'ETHEREUM'], // PYUSD on Ethereum
  
  // Binance Smart Chain
  'BNB': ['BNB', 'BSC', 'BINANCE'],
  'USDTBSC': ['BNB', 'BSC', 'BINANCE'],
  'USDCBSC': ['BNB', 'BSC', 'BINANCE'],
  
  // Solana
  'SOL': ['SOL', 'SOLANA'],
  'USDTSOL': ['SOL', 'SOLANA'],
  'USDCSOL': ['SOL', 'SOLANA'],
  
  // Polygon/MATIC
  'MATIC': ['MATIC', 'POLYGON'],
  'USDTMATIC': ['MATIC', 'POLYGON'],
  'USDCMATIC': ['MATIC', 'POLYGON'],
  
  // Tron
  'TRX': ['TRX', 'TRON'],
  'USDTTRC20': ['TRX', 'TRON'],
  'TUSDTRC20': ['TRX', 'TRON'],
  
  // TON
  'TON': ['TON'],
  'USDTTON': ['TON'],
  
  // Arbitrum
  'ARB': ['ARB', 'ARBITRUM'],
  'USDTARB': ['ARB', 'ARBITRUM'],
  'USDCARB': ['ARB', 'ARBITRUM'],
  
  // Optimism
  'OP': ['OP', 'OPTIMISM'],
  'USDTOP': ['OP', 'OPTIMISM'],
  'USDCOP': ['OP', 'OPTIMISM'],
  
  // Base
  'BASE': ['BASE'],
  'USDCBASE': ['BASE'],
  
  // Algorand
  'ALGO': ['ALGO', 'ALGORAND'],
  'USDCALGO': ['ALGO', 'ALGORAND'],
  
  // Other major currencies (no stable coins)
  'BTC': ['BTC', 'BITCOIN'],
  'LTC': ['LTC', 'LITECOIN'],
  'ADA': ['ADA', 'CARDANO'],
  'XRP': ['XRP', 'RIPPLE'],
  'DOT': ['DOT', 'POLKADOT'],
  'AVAX': ['AVAX', 'AVALANCHE'],
  'XLM': ['XLM', 'STELLAR'],
  'NEAR': ['NEAR']
};

function formatCurrencyForNOWPayments(currency: string): string {
  return currency.toLowerCase().trim();
}

function findWalletAddress(wallets: Record<string, string>, targetCurrency: string): string | null {
  const currencyUpper = targetCurrency.toUpperCase();
  const possibleWalletKeys = CURRENCY_TO_WALLET_MAPPING[currencyUpper] || [currencyUpper];
  
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
      payment_link_id: payment_link_id,
      payout_address: undefined,
      payout_currency: undefined
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

    // Step 1: Get payment link data
    console.log('🔍 Looking up merchant wallet address for payment link:', payment_link_id);
    
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

    // Step 2: Get merchant data separately
    let merchant = null;
    let walletAddress = null;
    let payoutCurrency = null;

    try {
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('wallets, auto_convert_enabled, preferred_payout_currency')
        .eq('id', paymentLinkData.merchant_id)
        .single();

      if (merchantError) {
        console.error('Error fetching merchant:', merchantError);
        console.log('⚠️ Merchant not found, proceeding without auto-forwarding');
      } else {
        merchant = merchantData;
        console.log('✅ Merchant found:', {
          auto_convert_enabled: merchant.auto_convert_enabled,
          preferred_payout_currency: merchant.preferred_payout_currency,
          wallet_count: merchant.wallets ? Object.keys(merchant.wallets).length : 0
        });

        // Find appropriate wallet address for the payment currency
        if (merchant.wallets && typeof merchant.wallets === 'object') {
          walletAddress = findWalletAddress(merchant.wallets, pay_currency);
          
          if (walletAddress) {
            console.log(`✅ Found wallet address for ${pay_currency}: ${walletAddress.substring(0, 10)}...`);
            
            // Set payout currency based on merchant settings
            if (merchant.auto_convert_enabled && merchant.preferred_payout_currency) {
              // Validate that the preferred payout currency is compatible with the wallet address
              const preferredCurrency = merchant.preferred_payout_currency.toUpperCase();
              const payCurrencyUpper = pay_currency.toUpperCase();
              
              // Check if the preferred payout currency can use the same wallet as the pay currency
              const payWalletKeys = CURRENCY_TO_WALLET_MAPPING[payCurrencyUpper] || [payCurrencyUpper];
              const preferredWalletKeys = CURRENCY_TO_WALLET_MAPPING[preferredCurrency] || [preferredCurrency];
              
              // Find if they share a common wallet type
              const hasCommonWallet = payWalletKeys.some(payKey => 
                preferredWalletKeys.some(prefKey => payKey === prefKey)
              );
              
              if (hasCommonWallet) {
                payoutCurrency = formatCurrencyForNOWPayments(merchant.preferred_payout_currency);
                console.log('💱 Auto-convert enabled, payout currency:', payoutCurrency);
              } else {
                console.log(`⚠️ Preferred payout currency ${preferredCurrency} not compatible with ${payCurrencyUpper} wallet, using direct payout`);
                payoutCurrency = formatCurrencyForNOWPayments(pay_currency);
              }
            } else {
              payoutCurrency = formatCurrencyForNOWPayments(pay_currency);
            }
          }
        }
      }
    } catch (merchantError) {
      console.error('Error fetching merchant:', merchantError);
      console.log('⚠️ Merchant not found, proceeding without auto-forwarding');
    }

    // Determine payment flow
    if (walletAddress && payoutCurrency) {
      console.log('ℹ️ Payment flow: Auto-forwarding enabled');
    } else {
      console.log('ℹ️ Payment flow: No auto-forwarding (manual withdrawal)');
    }

    // Prepare NOWPayments request
    const nowPaymentsPayload = {
      price_amount: amount,
      price_currency: formatCurrencyForNOWPayments(price_currency),
      pay_currency: formatCurrencyForNOWPayments(pay_currency),
      order_id: order_id || `cryptrac_${Date.now()}`,
      order_description: order_description || 'Cryptrac Payment',
      ipn_callback_url: ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      fixed_rate: false,
      ...(walletAddress && payoutCurrency && {
        payout_address: walletAddress,
        payout_currency: payoutCurrency
      })
    };

    console.log('📡 Sending payment request to NOWPayments:');
    console.log('- price_amount:', nowPaymentsPayload.price_amount);
    console.log('- price_currency:', nowPaymentsPayload.price_currency);
    console.log('- pay_currency:', nowPaymentsPayload.pay_currency);
    console.log('- order_id:', nowPaymentsPayload.order_id);
    console.log('- payout_address:', nowPaymentsPayload.payout_address || 'undefined');
    console.log('- payout_currency:', nowPaymentsPayload.payout_currency || 'undefined');
    console.log('- ipn_callback_url:', nowPaymentsPayload.ipn_callback_url);
    console.log('- fixed_rate:', nowPaymentsPayload.fixed_rate);

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
      
      // If auto-forwarding failed, try without it
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
      pay_amount: nowPaymentsData.pay_amount
    });

    // Calculate gateway fee (approximate)
    const gatewayFee = nowPaymentsData.price_amount * 0.005; // Approximate 0.5% fee

    // Store transaction in database
    console.log('💾 Storing transaction in database:', {
      payment_id: nowPaymentsData.payment_id,
      status: nowPaymentsData.payment_status,
      price_amount: nowPaymentsData.price_amount,
      pay_amount: nowPaymentsData.pay_amount,
      gateway_fee: gatewayFee
    });

    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        payment_id: nowPaymentsData.payment_id,
        payment_link_id: payment_link_id,
        order_id: nowPaymentsData.order_id,
        status: nowPaymentsData.payment_status,
        price_amount: nowPaymentsData.price_amount,
        price_currency: nowPaymentsData.price_currency?.toUpperCase(),
        pay_amount: nowPaymentsData.pay_amount,
        pay_currency: nowPaymentsData.pay_currency?.toUpperCase(),
        pay_address: nowPaymentsData.pay_address,
        payout_amount: nowPaymentsData.outcome_amount || 0,
        payout_currency: nowPaymentsData.outcome_currency?.toUpperCase(),
        gateway_fee: gatewayFee,
        amount_received: 0,
        currency_received: nowPaymentsData.pay_currency?.toUpperCase(),
        merchant_receives: nowPaymentsData.outcome_amount || (nowPaymentsData.pay_amount - gatewayFee),
        is_fee_paid_by_user: false, // NOWPayments always charges merchant
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
        outcome_currency: nowPaymentsData.outcome_currency
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

