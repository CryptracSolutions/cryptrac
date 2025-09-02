import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

// Enhanced network-to-wallet mapping with proper validation
const NETWORK_WALLET_MAPPING: Record<string, string[]> = {
  // Bitcoin network
  'BTC': ['BTC', 'BITCOIN'],
  
  // Ethereum network (includes ERC-20 tokens)
  'ETH': ['ETH', 'ETHEREUM', 'USDT', 'USDTERC20', 'USDC', 'USDCERC20', 'DAI', 'PYUSD'],
  
  // Binance Smart Chain
  'BNB': ['BNB', 'BSC', 'BINANCE', 'BNBBSC', 'USDTBSC', 'USDCBSC'],
  
  // Solana network
  'SOL': ['SOL', 'SOLANA', 'USDTSOL', 'USDCSOL'],
  
  // Polygon network
  'MATIC': ['MATIC', 'POLYGON', 'USDTMATIC', 'USDCMATIC'],
  
  // Avalanche network
  'AVAX': ['AVAX', 'AVALANCHE'],
  
  // Tron network
  'TRX': ['TRX', 'TRON', 'USDTTRC20'],
  
  // TON network
  'TON': ['TON', 'USDTTON'],
  
  // Other networks
  'LTC': ['LTC', 'LITECOIN'],
  'ADA': ['ADA', 'CARDANO'],
  'DOT': ['DOT', 'POLKADOT'],
  'XRP': ['XRP', 'RIPPLE'],
  'NEAR': ['NEAR'],
  'ALGO': ['ALGO', 'ALGORAND', 'USDCALGO'],
  'XLM': ['XLM', 'STELLAR'],
  'ARB': ['ARB', 'ARBITRUM', 'USDTARB', 'USDCARB'],
  'OP': ['OP', 'OPTIMISM', 'USDTOP', 'USDCOP'],
  'ETHBASE': ['ETHBASE', 'USDCBASE', 'ETH']
}

// Stable coins that can fall back to a base network wallet if no direct key exists
const stableCoinAssociations: Record<string, string> = {
  USDTARB: 'ETH',
  USDCARB: 'ETH',
  USDTOP: 'ETH',
  USDCOP: 'ETH',
  USDCBASE: 'ETHBASE'
}

// Function to determine which wallet to use for a given currency
function getWalletKeyForCurrency(currency: string, wallets: Record<string, string>): string | null {
  const currencyUpper = currency.toUpperCase()
  
  // First, try exact match
  if (wallets[currencyUpper]) {
    return currencyUpper
  }
  
  // Then, try to find the network this currency belongs to
  for (const [networkKey, currencies] of Object.entries(NETWORK_WALLET_MAPPING)) {
    if (currencies.includes(currencyUpper)) {
      // Check if we have a wallet for this network
      if (wallets[networkKey]) {
        return networkKey
      }
      // Also check alternative names
      for (const altName of currencies) {
        if (wallets[altName]) {
          return altName
        }
      }
    }
  }

  // Fallback to associated base currency wallet for stable coins
  const associatedBase = stableCoinAssociations[currencyUpper]
  if (associatedBase && wallets[associatedBase]) {
    return associatedBase
  }

  return null
}

// Function to validate wallet address format (basic validation)
function isValidWalletAddress(address: string, currency: string): boolean {
  if (!address || address.length < 10) return false
  
  const currencyUpper = currency.toUpperCase()
  
  // Basic format validation
  if (currencyUpper === 'BTC' && !address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/)) {
    return false
  }
  
  if (['ETH', 'BNB', 'MATIC', 'AVAX'].some(net => NETWORK_WALLET_MAPPING[net]?.includes(currencyUpper))) {
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return false
    }
  }
  
  return true
}

// Enhanced error response handler with retry logic
function handleNOWPaymentsError(error: unknown, context: string): NextResponse {
  console.error(`❌ ${context}:`, error)

  let errorMessage = 'Payment creation failed'
  let statusCode = 500
  let retryAfter: number | null = null

  const message = error instanceof Error ? error.message : ''

  if (message.includes('429')) {
    errorMessage = 'Too many requests. Please wait a moment and try again.'
    statusCode = 429
    retryAfter = 30 // Suggest 30 second retry
  } else if (message.includes('400')) {
    errorMessage = 'Invalid payment request. Please check your payment details.'
    statusCode = 400
  } else if (message.includes('service temporarily unavailable')) {
    errorMessage = 'Payment service temporarily unavailable. Please try again in a few minutes.'
    statusCode = 503
    retryAfter = 120 // Suggest 2 minute retry for service issues
  }

  const response: {
    success: false
    error: string
    details: string
    retry_after?: number
  } = {
    success: false,
    error: errorMessage,
    details: message || 'Unknown error',
  }

  if (retryAfter) {
    response.retry_after = retryAfter
  }

  const headers: Record<string, string> = {}
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString()
  }

  return NextResponse.json(response, { status: statusCode, headers })
}

// Function to get minimum amount for a currency pair
async function getMinimumAmount(currencyFrom: string, currencyTo: string): Promise<number> {
  const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!
  const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1'
  
  try {
    const from = currencyFrom.toLowerCase()
    const to = currencyTo.toLowerCase()
    
    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/min-amount?currency_from=${from}&currency_to=${to}`, {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.warn(`⚠️ Could not fetch minimum amount for ${from}→${to}: ${response.status}`)
      // Return reasonable defaults based on currency type
      if (to === 'btc') return 0.000001 // 1 satoshi
      if (to === 'eth' || to === 'ethbase') return 0.0001
      if (to.includes('usdt') || to.includes('usdc') || to === 'dai' || to === 'pyusd') return 1.0
      return 0.01 // Default minimum
    }

    const data = await response.json()
    return parseFloat(data.min_amount) || 0.01

  } catch (error) {
    console.warn(`⚠️ Error fetching minimum amount for ${currencyFrom}→${currencyTo}:`, error)
    // Return reasonable defaults
    if (currencyTo.toLowerCase() === 'btc') return 0.000001
    if (currencyTo.toLowerCase() === 'eth' || currencyTo.toLowerCase() === 'ethbase') return 0.0001
    if (currencyTo.toLowerCase().includes('usdt') || currencyTo.toLowerCase().includes('usdc') || currencyTo.toLowerCase() === 'dai' || currencyTo.toLowerCase() === 'pyusd') return 1.0
    return 0.01
  }
}

// Validate that the *pay amount* in the customer's coin is high enough for NOWPayments auto-forwarding.
// IMPORTANT: NOWPayments min-amount is defined for (payment currency -> payout currency).
// Do not use fiat here; if the price is fiat, estimate the pay amount first and compare coin-to-coin.
async function validateAmountForAutoForwarding(
  priceAmount: number,
  priceCurrency: string,
  payCurrency: string,
  payoutCurrency: string
): Promise<{ isValid: boolean; minAmount?: number; suggestedAmount?: number }> {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY!;
    const baseUrl = 'https://api.nowpayments.io/v1';

    const fiatSet = new Set([
      'usd','eur','gbp','aud','cad','chf','jpy','sgd','aed','inr','brl','mxn'
    ]);
    const isFiat = fiatSet.has(priceCurrency.toLowerCase());

    console.log(
      `🔍 Validating amount for auto-forwarding: ${priceAmount} ${priceCurrency} (pay=${payCurrency}) → payout=${payoutCurrency}`
    );

    // 1) Fetch minimum *pay* amount for pair payCurrency -> payoutCurrency
    const minRes = await fetch(
      `${baseUrl}/min-amount?currency_from=${payCurrency.toLowerCase()}&currency_to=${payoutCurrency.toLowerCase()}`,
      { method: 'GET', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } }
    );

    if (!minRes.ok) {
      const errText = await minRes.text();
      console.warn(`⚠️ Could not fetch min-amount for ${payCurrency}→${payoutCurrency}: ${minRes.status} ${errText}`);
      // Do not block if we cannot verify to avoid false floors
      return { isValid: true };
    }

    const minData = await minRes.json();
    const minPayAmount = parseFloat(minData.min_amount);
    if (!isFinite(minPayAmount) || minPayAmount <= 0) {
      console.warn('⚠️ Invalid min-amount response:', minData);
      return { isValid: true };
    }
    console.log(`📊 Minimum *pay* amount for ${payCurrency}→${payoutCurrency}: ${minPayAmount} ${payCurrency}`);

    // 2) If priced in fiat, estimate how much of the *pay coin* the customer will actually send
    if (isFiat) {
      const estRes = await fetch(
        `${baseUrl}/estimate?amount=${priceAmount}&currency_from=${priceCurrency.toLowerCase()}&currency_to=${payCurrency.toLowerCase()}`,
        { method: 'GET', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } }
      );

      if (!estRes.ok) {
        const errText = await estRes.text();
        console.warn(`⚠️ Could not fetch estimate for ${priceAmount} ${priceCurrency}→${payCurrency}: ${estRes.status} ${errText}`);
        return { isValid: true };
      }

      const estData = await estRes.json();
      const estimatedPayAmount = parseFloat(estData.estimated_amount);
      if (!isFinite(estimatedPayAmount)) {
        console.warn('⚠️ Invalid estimate response:', estData);
        return { isValid: true };
      }

      console.log(`📈 Estimated pay amount: ${estimatedPayAmount} ${payCurrency}`);

      if (estimatedPayAmount < minPayAmount) {
        // Suggest a new fiat price to meet min pay amount (linear on current quote)
        const coinPerFiat = estimatedPayAmount / priceAmount; // payCoin per 1 fiat
        const suggestedPriceAmount = Math.ceil((minPayAmount / coinPerFiat) * 100) / 100;
        return { isValid: false, minAmount: minPayAmount, suggestedAmount: suggestedPriceAmount };
      }
      return { isValid: true };
    }

    // 3) If priced in crypto, compare directly
    if (priceAmount < minPayAmount) {
      return { isValid: false, minAmount: minPayAmount, suggestedAmount: Math.ceil(minPayAmount * 100) / 100 };
    }

    return { isValid: true };
  } catch (error) {
    console.warn('⚠️ Could not validate amount for auto-forwarding:', error);
    return { isValid: true }; // do not block on transient errors
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;

    const body = await request.json()
    const {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      order_description,
      payment_link_id,
      // Tax information
      tax_enabled,
      base_amount,
      tax_rates,
      tax_amount,
      subtotal_with_tax
    } = body

    console.log('💳 Payment creation request:', {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      payment_link_id
    })

    // Validate required fields
    if (!price_amount || !price_currency || !pay_currency || !order_id || !payment_link_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      )
    }

    // Get payment link and merchant info
    const { data: paymentLinkData, error: paymentLinkError } = await supabase
      .from('payment_links')
      .select(`
        *,
        merchants!inner(
          id,
          business_name,
          auto_convert_enabled,
          charge_customer_fee,
          wallets,
          preferred_payout_currency
        )
      `)
      .eq('id', payment_link_id)
      .single()

    if (paymentLinkError || !paymentLinkData) {
      console.error('❌ Payment link not found:', paymentLinkError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment link not found' 
        },
        { status: 404 }
      )
    }

    console.log('✅ Payment link found:', {
      id: paymentLinkData.id,
      merchant_id: paymentLinkData.merchant_id
    })

    const merchant = Array.isArray(paymentLinkData.merchants)
      ? paymentLinkData.merchants[0]
      : paymentLinkData.merchants

    const preferredPayoutCurrency =
      paymentLinkData.preferred_payout_currency ||
      merchant.preferred_payout_currency

    const autoConvertEnabled =
      paymentLinkData.auto_convert_enabled &&
      !!preferredPayoutCurrency

    // Determine target payout currency
    const targetPayoutCurrency = autoConvertEnabled
      ? preferredPayoutCurrency
      : pay_currency.toUpperCase()

    // Calculate fee breakdown using the exact same logic as internal payments create
    const baseFeePct = 0.005; // 0.5%
    const autoConvertFeePct = autoConvertEnabled ? 0.005 : 0; // +0.5% if auto-convert
    const totalFeePct = baseFeePct + autoConvertFeePct; // => 0.5% or 1.0%

    // Determine if customer pays fee
    const chargeCustomerFee = paymentLinkData.charge_customer_fee ?? merchant.charge_customer_fee ?? false;

    // Detect link-driven flows where our frontend already computes the customer total
    // and shows it to the user (including fee if applicable). In these cases we should
    // NOT ask NOWPayments to add the fee on top again; it will always be deducted from payout.
    const sourceStr = String((paymentLinkData as any).source || '').toLowerCase()
    const isLinkFlow = sourceStr === 'pos' || sourceStr === 'dashboard' || sourceStr === 'subscription'

    // Prepare payment request for NOWPayments
    interface PaymentRequest {
      price_amount: number
      price_currency: string
      pay_currency: string
      order_id: string
      order_description: string
      ipn_callback_url: string
      success_url: string
      cancel_url: string
      payout_address?: string
      payout_currency?: string
      is_fee_paid_by_user?: boolean
    }

    // Normalize fiat price precision to 2 decimals to avoid float precision artifacts
    const fiatSet = new Set(['usd','eur','gbp','aud','cad','chf','jpy','sgd','aed','inr','brl','mxn'])
    const normalizedPriceAmount = (() => {
      const amt = parseFloat(price_amount.toString())
      return fiatSet.has(String(price_currency).toLowerCase())
        ? Math.round(amt * 100) / 100
        : amt
    })()

    const paymentRequest: PaymentRequest = {
      price_amount: normalizedPriceAmount,
      price_currency: price_currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      order_id: order_id,
      order_description: order_description || `Payment for ${merchant.business_name}`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success/${payment_link_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${payment_link_id}`,
      // For link-driven flows (POS, Dashboard-created links, Subscriptions),
      // the displayed price already reflects our fee logic. Always prevent
      // NOWPayments from adding fee on top to avoid double-charging customers.
      is_fee_paid_by_user: isLinkFlow ? false : chargeCustomerFee === true
    }

    // Enhanced auto-forwarding logic with amount validation
    let autoForwardingConfigured = false
    const wallets = merchant.wallets || {}

    console.log('🔍 Available wallets:', Object.keys(wallets))

    if (targetPayoutCurrency && Object.keys(wallets).length > 0) {
      const walletKey = getWalletKeyForCurrency(targetPayoutCurrency, wallets)

      if (walletKey && wallets[walletKey]) {
        const walletAddress = wallets[walletKey]

        console.log(
          `🔍 Found wallet for ${targetPayoutCurrency} using ${walletKey}: ${walletAddress.substring(0, 10)}...`
        )

        // Validate wallet address format
        if (isValidWalletAddress(walletAddress, targetPayoutCurrency)) {
          // Validate amount for auto-forwarding before configuring it
          const validation = await validateAmountForAutoForwarding(
            paymentRequest.price_amount,
            paymentRequest.price_currency,
            paymentRequest.pay_currency,                  // ⬅️ NEW: validate against the coin the customer will pay in
            targetPayoutCurrency.toLowerCase()
          )

          if (!validation.isValid) {
            console.warn(`⚠️ Amount too small for auto-forwarding to ${targetPayoutCurrency}`)
            console.warn(`   Required minimum: ${validation.minAmount} ${targetPayoutCurrency}`)
            console.warn(`   Suggested amount: $${validation.suggestedAmount}`)
            
            // Return detailed error with suggestions
            return NextResponse.json(
              { 
                success: false, 
                error: 'Payment amount too small for auto-forwarding',
                details: `The minimum payout amount for ${targetPayoutCurrency} is ${validation.minAmount}. Please increase the payment amount to at least $${validation.suggestedAmount}.`,
                code: 'AMOUNT_TOO_SMALL_FOR_AUTO_FORWARDING',
                minAmount: validation.minAmount,
                suggestedAmount: validation.suggestedAmount,
                currency: targetPayoutCurrency
              },
              { status: 400 }
            )
          }

          paymentRequest.payout_address = walletAddress
          paymentRequest.payout_currency = targetPayoutCurrency.toLowerCase()
          autoForwardingConfigured = true

          console.log(
            `✅ Auto-forwarding configured for ${targetPayoutCurrency}: ${walletAddress.substring(0, 10)}...`
          )
        } else {
          console.warn(
            `⚠️ Invalid wallet address format for ${targetPayoutCurrency}: ${walletAddress}`
          )
        }
      } else {
        console.warn(
          `⚠️ No wallet address found for payout currency ${targetPayoutCurrency}`
        )
        console.log('Available wallet keys:', Object.keys(wallets))
      }
    }

    // Create payment with NOWPayments
    console.log('📡 Sending payment request to NOWPayments:')
    console.log('- price_amount:', paymentRequest.price_amount)
    console.log('- price_currency:', paymentRequest.price_currency)
    console.log('- pay_currency:', paymentRequest.pay_currency)
    console.log('- order_id:', paymentRequest.order_id)
    console.log('- is_fee_paid_by_user:', paymentRequest.is_fee_paid_by_user)
    if (isLinkFlow) {
      console.log(`ℹ️ Link flow detected (${sourceStr || 'unknown'}): price reflects fee math; not delegating fee to NOWPayments`)
    }
    console.log('- auto_forwarding_enabled:', autoForwardingConfigured)
    if (autoForwardingConfigured) {
      console.log('- payout_address:', paymentRequest.payout_address?.substring(0, 10) + '...')
    }

    interface PaymentResponse {
      payment_id: string
      payment_status: string
      pay_address: string
      price_amount: number
      price_currency: string
      pay_amount: number
      pay_currency: string
      order_id?: string
      order_description?: string
      created_at?: string
      updated_at?: string
      [key: string]: unknown
    }

    let paymentResponse: PaymentResponse | undefined

    try {
      const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      })

      const responseText = await response.text()
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<')) {
        console.error('❌ NOWPayments service issue - returned HTML instead of API response')
        console.error('Response preview:', responseText.substring(0, 200))
        throw new Error(`NOWPayments service temporarily unavailable - please try again later`)
      }

      let responseData: unknown
      try {
        responseData = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        throw new Error(`Invalid JSON response from NOWPayments: ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        const errorText = responseText
        console.error('❌ NOWPayments API error:', response.status, errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        // Handle specific NOWPayments errors
        if (errorData.code === 'BAD_REQUEST' && errorData.message?.includes('amountTo is too small')) {
          // Try to get minimum amount information for better error message
          let minAmountInfo = ''
          if (autoForwardingConfigured && paymentRequest.payout_currency) {
            try {
              const minAmount = await getMinimumAmount(
                // Provide min for the actual on-chain route (pay -> payout)
                paymentRequest.pay_currency,
                paymentRequest.payout_currency
              )
              const suggestedAmount = minAmount / (1 - totalFeePct)
              minAmountInfo = ` The minimum payout amount for ${paymentRequest.payout_currency.toUpperCase()} is ${minAmount}. Please increase the payment amount to at least $${Math.ceil(suggestedAmount * 100) / 100}.`
            } catch (error) {
              console.warn('Could not fetch minimum amount for error message:', error)
            }
          }
          
          return NextResponse.json(
            { 
              success: false, 
              error: 'Payment amount too small for processing after fees. Please try a larger amount.',
              details: `The payout amount after fees is below the minimum threshold for auto-forwarding to your wallet.${minAmountInfo}`,
              code: 'AMOUNT_TOO_SMALL'
            },
            { status: 400 }
          )
        }
        
        // If auto-forwarding failed, don't retry without it - fail the payment
        if (autoForwardingConfigured && (
          errorData.code === 'BAD_CREATE_PAYMENT_REQUEST' ||
          errorData.message?.includes('payout_extra_id') ||
          errorData.message?.includes('payout_address')
        )) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Auto-forwarding configuration failed. Please check your wallet address.',
              details: errorData.message || 'Auto-forwarding is required but failed to configure'
            },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Payment creation failed',
              details: errorData.message || 'Unknown error from payment provider'
            },
            { status: response.status }
          )
        }
      } else {
        paymentResponse = responseData as PaymentResponse
      }

    } catch (error: unknown) {
      console.error('❌ Payment creation failed:', error)
      return handleNOWPaymentsError(error, 'Payment creation failed')
    }



    if (!paymentResponse) {
      throw new Error('No payment response received')
    }

    console.log('✅ Payment created successfully:', {
      payment_id: paymentResponse.payment_id,
      payment_status: paymentResponse.payment_status,
      pay_address: paymentResponse.pay_address?.substring(0, 10) + '...',
      auto_forwarding: autoForwardingConfigured
    })

    // Calculate fee and tax details for reporting using exact same logic as internal payments create
    const feePercentage = totalFeePct; // Use calculated fee percentage
    const feeBaseAmount = Number(paymentLinkData.subtotal_with_tax || paymentLinkData.amount || 0)
    const feeAmount = feeBaseAmount * feePercentage
    
    // Customer total: if charge_customer_fee is true, customer pays extra to offset NOWPayments fee deduction
    const customerTotal = chargeCustomerFee ? feeBaseAmount + feeAmount : feeBaseAmount
    
    // Merchant receives: NOWPayments always deducts fee from payout, regardless of charge_customer_fee
    // When charge_customer_fee is true, the extra customer payment offsets this deduction
    const merchantReceives = feeBaseAmount - feeAmount
    
    // Cryptrac fee represents the fee amount deducted from merchant payout
    const cryptracFee = feeAmount

    const taxLabel = tax_enabled && Array.isArray(tax_rates) && tax_rates.length > 0
      ? tax_rates.map((r: { label: string }) => r.label).join(', ')
      : ''
    const taxPercentage = tax_enabled && Array.isArray(tax_rates) && tax_rates.length > 0
      ? tax_rates.reduce((sum: number, r: { percentage: number | string }) => sum + (parseFloat(r.percentage as string) || 0), 0)
      : 0

    // FIXED: Save transaction to correct table name "transactions" instead of "merchant_payments"
    const transactionData = {
      nowpayments_payment_id: paymentResponse.payment_id,
      order_id: paymentResponse.order_id,
      payment_link_id: payment_link_id,
      merchant_id: paymentLinkData.merchant_id,
      amount: paymentResponse.price_amount,
      currency: paymentResponse.price_currency.toUpperCase(),
      pay_amount: paymentResponse.pay_amount,
      pay_currency: paymentResponse.pay_currency.toUpperCase(),
      status: paymentResponse.payment_status,
      pay_address: paymentResponse.pay_address,
      // Tax information
      tax_enabled: tax_enabled || false,
      tax_label: taxLabel,
      tax_percentage: taxPercentage,
      base_amount: base_amount || paymentResponse.price_amount,
      tax_rates: tax_rates || [],
      tax_amount: tax_amount || 0,
      subtotal_with_tax: subtotal_with_tax || paymentResponse.price_amount,
      total_amount_paid: customerTotal,
      cryptrac_fee: cryptracFee,
      gateway_fee: 0,
      merchant_receives: merchantReceives,
      // Auto-forwarding info - store in payment_data JSONB field
      payment_data: {
        auto_forwarding_enabled: autoForwardingConfigured,
        payout_address: autoForwardingConfigured ? paymentRequest.payout_address : null,
        payout_currency: autoForwardingConfigured ? paymentRequest.payout_currency : null,
        fee_breakdown: {
          base_fee_percentage: baseFeePct * 100,
          auto_convert_fee_percentage: autoConvertFeePct * 100,
          total_fee_percentage: totalFeePct * 100,
          fee_amount: feeAmount,
          merchant_receives: merchantReceives,
          effective_charge_customer_fee: chargeCustomerFee,
          effective_auto_convert_enabled: autoConvertEnabled
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Saving transaction to database...')

    // FIXED: Use correct table name "transactions"
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Failed to save transaction:', transactionError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save transaction',
          details: transactionError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Transaction saved successfully:', transaction.id)

    // Update payment link usage count
    const { error: updateError } = await supabase
      .from('payment_links')
      .update({ 
        usage_count: paymentLinkData.usage_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_link_id)

    if (updateError) {
      console.warn('⚠️ Failed to update payment link usage count:', updateError)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      payment: paymentResponse,
      transaction_id: transaction.id,
      fee_breakdown: {
        base_fee_percentage: baseFeePct * 100,
        auto_convert_fee_percentage: autoConvertFeePct * 100,
        total_fee_percentage: totalFeePct * 100,
        fee_amount: feeAmount,
        customer_total: customerTotal,
        merchant_receives: merchantReceives,
        charge_customer_fee: chargeCustomerFee
      }
    })

  } catch (error) {
    return handleNOWPaymentsError(error, 'Payment creation failed')
  }
}
