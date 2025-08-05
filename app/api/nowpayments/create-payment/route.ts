import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1'

// Enhanced network-to-wallet mapping with proper validation
const NETWORK_WALLET_MAPPING: Record<string, string[]> = {
  // Bitcoin network
  'BTC': ['BTC', 'BITCOIN'],
  
  // Ethereum network (includes ERC-20 tokens)
  'ETH': ['ETH', 'ETHEREUM', 'USDT', 'USDTERC20', 'USDC', 'USDCERC20'],
  
  // Binance Smart Chain - FIXED: Use correct NOWPayments currency codes
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
  'BASE': ['BASE', 'USDCBASE']
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

// Enhanced error response handler
function handleNOWPaymentsError(error: any, context: string): NextResponse {
  console.error(`❌ ${context}:`, error)
  
  let errorMessage = 'Payment creation failed'
  let statusCode = 500
  
  if (error.response) {
    statusCode = error.response.status
    try {
      const errorData = typeof error.response.data === 'string' 
        ? JSON.parse(error.response.data) 
        : error.response.data
      
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
      
      // Specific error handling
      if (errorData.code === 'BAD_CREATE_PAYMENT_REQUEST') {
        if (errorData.message.includes('validate address')) {
          errorMessage = 'Invalid wallet address configuration. Please contact support.'
        }
      }
      
    } catch (parseError) {
      console.error('❌ Error parsing NOWPayments response:', parseError)
      errorMessage = 'Invalid response from payment processor'
    }
  } else if (error.message) {
    errorMessage = error.message
  }
  
  return NextResponse.json(
    { 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    },
    { status: statusCode }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      order_description,
      payment_link_id,
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
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Look up payment link and merchant - FIXED: Use correct column name 'wallets'
    console.log('🔍 Looking up payment link:', payment_link_id)
    
    const { data: paymentLinkData, error: linkError } = await supabase
      .from('payment_links')
      .select(`
        id,
        merchant_id,
        merchants!inner(
          id,
          user_id,
          business_name,
          wallets,
          auto_convert_enabled,
          charge_customer_fee
        )
      `)
      .eq('id', payment_link_id)
      .single()

    if (linkError || !paymentLinkData) {
      console.error('❌ Payment link not found:', linkError)
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
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

    // Prepare payment request for NOWPayments
    const paymentRequest: any = {
      price_amount: parseFloat(price_amount.toString()),
      price_currency: price_currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      order_id: order_id,
      order_description: order_description || `Payment for ${merchant.business_name}`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success/${payment_link_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${payment_link_id}`
    }

    // Enhanced auto-forwarding logic - FIXED: Use 'wallets' instead of 'wallet_addresses'
    let autoForwardingConfigured = false
    const wallets = merchant.wallets || {}
    
    console.log('🔍 Available wallets:', Object.keys(wallets))
    
    if (merchant.auto_convert_enabled && Object.keys(wallets).length > 0) {
      const walletKey = getWalletKeyForCurrency(pay_currency, wallets)
      
      if (walletKey && wallets[walletKey]) {
        const walletAddress = wallets[walletKey]
        
        console.log(`🔍 Found wallet for ${pay_currency} using ${walletKey}: ${walletAddress.substring(0, 10)}...`)
        
        // Validate wallet address format
        if (isValidWalletAddress(walletAddress, pay_currency)) {
          paymentRequest.payout_address = walletAddress
          paymentRequest.payout_currency = pay_currency.toLowerCase()
          paymentRequest.payout_extra_id = null
          autoForwardingConfigured = true
          
          console.log(`✅ Auto-forwarding configured for ${pay_currency}: ${walletAddress.substring(0, 10)}...`)
        } else {
          console.warn(`⚠️ Invalid wallet address format for ${pay_currency}: ${walletAddress}`)
        }
      } else {
        console.warn(`⚠️ No wallet address found for ${pay_currency}`)
        console.log('Available wallet keys:', Object.keys(wallets))
      }
    }

    // Create payment with NOWPayments
    console.log('📡 Sending payment request to NOWPayments:')
    console.log('- price_amount:', paymentRequest.price_amount)
    console.log('- price_currency:', paymentRequest.price_currency)
    console.log('- pay_currency:', paymentRequest.pay_currency)
    console.log('- order_id:', paymentRequest.order_id)
    console.log('- auto_forwarding_enabled:', autoForwardingConfigured)
    if (autoForwardingConfigured) {
      console.log('- payout_address:', paymentRequest.payout_address?.substring(0, 10) + '...')
    }

    let paymentResponse
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

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid JSON response from NOWPayments: ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        console.error('NOWPayments API error:', response.status, responseData)
        
        // If auto-forwarding failed, try without it
        if (autoForwardingConfigured && responseData.code === 'BAD_CREATE_PAYMENT_REQUEST') {
          console.log('🔄 Auto-forwarding failed, retrying without auto-forwarding...')
          retryWithoutForwarding = true
        } else {
          throw new Error(`NOWPayments API error: ${response.status} ${JSON.stringify(responseData, null, 2)}`)
        }
      } else {
        paymentResponse = responseData
      }

    } catch (error: any) {
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
      delete retryRequest.payout_extra_id
      
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

        let retryResponseData
        try {
          retryResponseData = JSON.parse(retryResponseText)
        } catch (parseError) {
          throw new Error(`Invalid JSON response from NOWPayments: ${retryResponseText.substring(0, 100)}...`)
        }

        if (!retryResponse.ok) {
          throw new Error(`NOWPayments API error: ${retryResponse.status} ${JSON.stringify(retryResponseData, null, 2)}`)
        }

        paymentResponse = retryResponseData
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

    // Save transaction to database - FIXED: Use correct column name
    const transactionData = {
      nowpayments_payment_id: paymentResponse.payment_id,
      order_id: paymentResponse.order_id,
      payment_link_id: payment_link_id,
      merchant_id: merchant.id,
      amount: paymentResponse.price_amount,
      currency: paymentResponse.price_currency.toUpperCase(),
      pay_amount: paymentResponse.pay_amount,
      pay_currency: paymentResponse.pay_currency.toUpperCase(),
      status: paymentResponse.payment_status,
      pay_address: paymentResponse.pay_address,
      // Tax information
      tax_enabled: tax_enabled || false,
      base_amount: base_amount || paymentResponse.price_amount,
      tax_rates: tax_rates || [],
      tax_amount: tax_amount || 0,
      subtotal_with_tax: subtotal_with_tax || paymentResponse.price_amount,
      // Auto-forwarding info
      auto_forwarding_enabled: autoForwardingConfigured,
      payout_address: autoForwardingConfigured ? paymentRequest.payout_address : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Error saving transaction:', transactionError)
      // Don't fail the payment creation, just log the error
    } else {
      console.log('✅ Transaction saved to database:', transaction.id)
    }

    return NextResponse.json({
      success: true,
      payment: {
        payment_id: paymentResponse.payment_id,
        payment_status: paymentResponse.payment_status,
        pay_address: paymentResponse.pay_address,
        price_amount: paymentResponse.price_amount,
        price_currency: paymentResponse.price_currency,
        pay_amount: paymentResponse.pay_amount,
        pay_currency: paymentResponse.pay_currency,
        order_id: paymentResponse.order_id,
        order_description: paymentResponse.order_description,
        created_at: paymentResponse.created_at,
        updated_at: paymentResponse.updated_at,
        auto_forwarding_enabled: autoForwardingConfigured
      }
    })

  } catch (error: any) {
    return handleNOWPaymentsError(error, 'Payment creation error')
  }
}

