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
  } else if (message.includes('HTML error page')) {
    errorMessage = 'Payment service temporarily unavailable. Please try again.'
    statusCode = 503
    retryAfter = 60 // Suggest 1 minute retry for service issues
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

    const paymentRequest: PaymentRequest = {
      price_amount: parseFloat(price_amount.toString()),
      price_currency: price_currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      order_id: order_id,
      order_description: order_description || `Payment for ${merchant.business_name}`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success/${payment_link_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${payment_link_id}`,
      is_fee_paid_by_user: chargeCustomerFee === true
    }

    // Enhanced auto-forwarding logic
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
    let retryWithoutForwarding = false

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
        throw new Error(`NOWPayments returned HTML error page: ${responseText.substring(0, 100)}...`)
      }

      let responseData: unknown
      try {
        responseData = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        throw new Error(`Invalid JSON response from NOWPayments: ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        console.error('NOWPayments API error:', response.status, responseData)

        const errorData = responseData as { code?: string; message?: string }

        // If auto-forwarding failed, try without it
        if (autoForwardingConfigured && (
          errorData.code === 'BAD_CREATE_PAYMENT_REQUEST' ||
          errorData.message?.includes('payout_extra_id')
        )) {
          console.log('🔄 Auto-forwarding failed, retrying without auto-forwarding...')
          retryWithoutForwarding = true
        } else {
          throw new Error(`NOWPayments API error: ${response.status} ${JSON.stringify(errorData, null, 2)}`)
        }
      } else {
        paymentResponse = responseData as PaymentResponse
      }

    } catch (error: unknown) {
      if (autoForwardingConfigured && !retryWithoutForwarding) {
        console.log('🔄 Auto-forwarding failed, retrying without auto-forwarding...')
        retryWithoutForwarding = true
      } else {
        throw error
      }
    }

    // Retry without auto-forwarding if needed
    if (retryWithoutForwarding) {
      const retryRequest = { ...paymentRequest }
      delete retryRequest.payout_address
      delete retryRequest.payout_currency
      // FIXED: Don't add payout_extra_id at all
      
      console.log('🔄 Retrying payment creation without auto-forwarding...')
      
      try {
        const retryResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/payment`, {
          method: 'POST',
          headers: {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retryRequest),
        })

        const retryResponseText = await retryResponse.text()
        
        // Check if response is HTML (error page)
        if (retryResponseText.trim().startsWith('<')) {
          throw new Error(`NOWPayments returned HTML error page: ${retryResponseText.substring(0, 100)}...`)
        }

        let retryResponseData: unknown
        try {
          retryResponseData = JSON.parse(retryResponseText) as Record<string, unknown>
        } catch {
          throw new Error(`Invalid JSON response from NOWPayments: ${retryResponseText.substring(0, 100)}...`)
        }

        if (!retryResponse.ok) {
          throw new Error(`NOWPayments API error: ${retryResponse.status} ${JSON.stringify(retryResponseData, null, 2)}`)
        }

        paymentResponse = retryResponseData as PaymentResponse
        autoForwardingConfigured = false
        console.log('✅ Payment created successfully without auto-forwarding')
        
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError)
        return handleNOWPaymentsError(retryError, 'Payment creation retry failed')
      }
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

    // Save transaction to database
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

    const { data: transaction, error: transactionError } = await supabase
      .from('merchant_payments')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Failed to save transaction:', transactionError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save transaction' 
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

