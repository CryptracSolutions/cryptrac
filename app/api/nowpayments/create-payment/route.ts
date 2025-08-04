import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Address validation functions
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

function isValidBitcoinAddress(address: string): boolean {
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || /^bc1[a-z0-9]{39,59}$/.test(address)
}

function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

function sanitizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, '')
}

function validateAddressForCurrency(address: string, currency: string): boolean {
  const sanitized = sanitizeAddress(address)
  const currencyUpper = currency.toUpperCase()
  
  // Enhanced ERC-20 token detection
  if (currencyUpper === 'ETH' || 
      currencyUpper === 'USDT' || 
      currencyUpper === 'USDC' || 
      currencyUpper === 'DAI' ||
      currencyUpper === 'TUSD' ||
      currencyUpper === 'USDP' ||
      currencyUpper === 'PYUSD' ||
      currencyUpper === 'BUSD' ||
      currencyUpper === 'FRAX' ||
      currencyUpper === 'LUSD' ||
      currencyUpper === 'CUSD' ||
      currencyUpper.includes('ERC20') || 
      currencyUpper.includes('ETHEREUM')) {
    return isValidEthereumAddress(sanitized)
  } else if (currencyUpper === 'BTC' || currencyUpper === 'BITCOIN') {
    return isValidBitcoinAddress(sanitized)
  } else if (currencyUpper === 'SOL' || currencyUpper === 'SOLANA' || currencyUpper.includes('SOL')) {
    return isValidSolanaAddress(sanitized)
  }
  
  // For other currencies, assume valid if not empty
  return sanitized.length > 10
}

// Simple currency mapping for auto-forwarding
const CURRENCY_WALLET_MAPPING: Record<string, string[]> = {
  // ERC-20 tokens use ETH addresses
  'USDT': ['ETH', 'ETHEREUM'],
  'USDC': ['ETH', 'ETHEREUM'],
  'DAI': ['ETH', 'ETHEREUM'],
  'PYUSD': ['ETH', 'ETHEREUM'],
  
  // BSC tokens use BNB addresses
  'USDTBSC': ['BNB', 'BINANCE', 'BSC'],
  'USDCBSC': ['BNB', 'BINANCE', 'BSC'],
  
  // Solana tokens use SOL addresses
  'USDTSOL': ['SOL', 'SOLANA'],
  'USDCSOL': ['SOL', 'SOLANA'],
  
  // Polygon tokens use MATIC addresses
  'USDTMATIC': ['MATIC', 'POLYGON'],
  'USDCMATIC': ['MATIC', 'POLYGON'],
  
  // Avalanche tokens use AVAX addresses
  'USDTAVAX': ['AVAX', 'AVALANCHE'],
  'USDCAVAX': ['AVAX', 'AVALANCHE'],
  
  // Tron tokens use TRX addresses
  'USDTTRC20': ['TRX', 'TRON'],
  
  // TON tokens use TON addresses
  'USDTTON': ['TON'],
  
  // XLM tokens use XLM addresses
  'USDCXLM': ['XLM', 'STELLAR'],
  
  // DOT tokens use DOT addresses
  'USDTDOT': ['DOT', 'POLKADOT'],
  
  // NEAR tokens use NEAR addresses
  'USDTNEAR': ['NEAR'],
  
  // ALGO tokens use ALGO addresses
  'USDTALGO': ['ALGO', 'ALGORAND'],
  'USDCALGO': ['ALGO', 'ALGORAND']
}

function formatCurrencyForNOWPayments(currency: string): string {
  return currency.toLowerCase()
}

async function createPayment(paymentData: any) {
  const response = await fetch('https://api.nowpayments.io/v1/payment', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('NOWPayments API error:', response.status, errorText)
    throw new Error(`NOWPayments API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  // Parse request body first to ensure variables are in scope for error handling
  const body = await request.json()
  const { 
    price_amount, 
    price_currency, 
    pay_currency, 
    order_id, 
    order_description,
    payout_address,
    payout_currency,
    ipn_callback_url,
    payment_link_id,
    customer_email,
    // Tax information
    tax_enabled,
    base_amount,
    tax_rates,
    tax_amount,
    subtotal_with_tax
  } = body

  // Validate amount early
  const amount = parseFloat(price_amount)

  try {

    console.log('💳 Payment creation request:', {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      payment_link_id,
      payout_address: payout_address ? '***' : undefined,
      payout_currency
    })

    // Validate required parameters
    if (!price_amount || !price_currency || !pay_currency) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: price_amount, price_currency, pay_currency' 
        },
        { status: 400 }
      )
    }

    // Validate amount (already parsed above)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid price_amount: must be a positive number' 
        },
        { status: 400 }
      )
    }

    // Get merchant wallet address for auto-forwarding if payment_link_id is provided
    let merchantPayoutAddress = payout_address
    let merchantPayoutCurrency = payout_currency
    let merchantId = null

    if (payment_link_id && !merchantPayoutAddress) {
      console.log('🔍 Looking up merchant wallet address for payment link:', payment_link_id)
      
      // First get the payment link
      const { data: paymentLinkData, error: linkError } = await supabase
        .from('payment_links')
        .select('id, merchant_id')
        .eq('id', payment_link_id)
        .single()

      if (linkError) {
        console.error('Error fetching payment link:', linkError)
        return NextResponse.json(
          { success: false, error: 'Payment link not found' },
          { status: 404 }
        )
      }

      if (!paymentLinkData) {
        return NextResponse.json(
          { success: false, error: 'Payment link not found' },
          { status: 404 }
        )
      }

      console.log('✅ Payment link found:', {
        id: paymentLinkData.id,
        merchant_id: paymentLinkData.merchant_id
      })

      merchantId = paymentLinkData.merchant_id

      // Then get the merchant data separately
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('id, auto_convert_enabled, preferred_payout_currency, wallet_addresses')
        .eq('id', paymentLinkData.merchant_id)
        .single()

      if (merchantError) {
        console.error('Error fetching merchant:', merchantError)
        console.log('⚠️ Merchant not found, proceeding without auto-forwarding')
      } else if (merchantData?.wallet_addresses) {
        const walletAddresses = merchantData.wallet_addresses as Record<string, string>
        const availableWallets = Object.keys(walletAddresses)
        
        console.log('💰 Available wallet addresses:', availableWallets)

        // Determine auto-convert settings
        const autoConvertEnabled = merchantData.auto_convert_enabled
        const preferredPayoutCurrency = merchantData.preferred_payout_currency

        console.log('🔄 Auto-convert settings:', {
          auto_convert_enabled: autoConvertEnabled,
          preferred_payout_currency: preferredPayoutCurrency,
          payment_currency: pay_currency
        })

        if (autoConvertEnabled && preferredPayoutCurrency) {
          // Auto-convert: use preferred payout currency
          console.log('🔄 Auto-convert mode: Looking for', preferredPayoutCurrency, 'wallet')
          
          const targetCurrency = preferredPayoutCurrency.toUpperCase()
          if (walletAddresses[targetCurrency]) {
            merchantPayoutAddress = walletAddresses[targetCurrency]
            merchantPayoutCurrency = formatCurrencyForNOWPayments(targetCurrency)
            console.log('✅ Auto-convert wallet found:', targetCurrency, '→', '***')
          } else {
            console.log('⚠️ Preferred payout currency wallet not found:', targetCurrency)
          }
        } else {
          // Direct forwarding: find wallet for the payment currency
          console.log('➡️ Direct forwarding: Looking for', pay_currency, 'wallet')
          
          const targetCurrency = pay_currency.toLowerCase()
          console.log('🔍 Target currency for wallet lookup:', targetCurrency)
          
          // Check direct match first
          let walletFound = false
          const targetCurrencyUpper = targetCurrency.toUpperCase()
          
          if (walletAddresses[targetCurrencyUpper]) {
            merchantPayoutAddress = walletAddresses[targetCurrencyUpper]
            merchantPayoutCurrency = targetCurrency
            console.log('✅ Direct wallet match found:', targetCurrencyUpper, '→', '***')
            walletFound = true
          } else {
            // Check currency mapping for tokens that use different wallet addresses
            const mappedCurrencies = CURRENCY_WALLET_MAPPING[targetCurrencyUpper] || []
            
            for (const mappedCurrency of mappedCurrencies) {
              if (walletAddresses[mappedCurrency]) {
                merchantPayoutAddress = walletAddresses[mappedCurrency]
                merchantPayoutCurrency = targetCurrency
                console.log('✅ Wallet match found for', targetCurrencyUpper, 'via mapping', mappedCurrency, '→', '***')
                walletFound = true
                break
              }
            }
          }
          
          if (!walletFound) {
            console.log('⚠️ No wallet address found for target currency:', targetCurrency)
            console.log('Available wallets:', availableWallets)
          }
        }
      } else {
        console.log('⚠️ No wallet addresses configured for merchant')
      }
    }

    // Validate merchant payout address if provided
    if (merchantPayoutAddress && merchantPayoutCurrency) {
      console.log('🔍 Raw wallet address:', JSON.stringify(merchantPayoutAddress))
      
      const sanitizedAddress = sanitizeAddress(merchantPayoutAddress)
      console.log('🧹 Sanitized wallet address:', JSON.stringify(sanitizedAddress))
      console.log('🔍 Address length:', sanitizedAddress.length)
      
      console.log('🔍 Validating address for currency:', merchantPayoutCurrency.toUpperCase())
      const isValidAddress = validateAddressForCurrency(sanitizedAddress, merchantPayoutCurrency)
      console.log('🔍 Address validation result:', isValidAddress)
      
      if (!isValidAddress) {
        console.log('❌ Invalid payout address for currency:', merchantPayoutCurrency)
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid payout address for ${merchantPayoutCurrency.toUpperCase()}` 
          },
          { status: 400 }
        )
      }
      
      console.log('✅ Using validated merchant wallet address for auto-forwarding')
      merchantPayoutAddress = sanitizedAddress
    }

    // Prepare payment request
    const paymentRequest: any = {
      price_amount: amount,
      price_currency: formatCurrencyForNOWPayments(price_currency),
      pay_currency: formatCurrencyForNOWPayments(pay_currency),
      order_id: order_id || `cryptrac_${Date.now()}`,
      order_description: order_description || 'Cryptrac Payment',
      ipn_callback_url: ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      fixed_rate: false
    }

    // Add auto-forwarding if merchant wallet is available
    if (merchantPayoutAddress && merchantPayoutCurrency) {
      paymentRequest.payout_address = merchantPayoutAddress
      paymentRequest.payout_currency = formatCurrencyForNOWPayments(merchantPayoutCurrency)
      
      console.log('✅ Payment flow:', pay_currency, '→', merchantPayoutCurrency === pay_currency ? 'direct' : 'auto-convert', '→', merchantPayoutAddress.substring(0, 6) + '...' + merchantPayoutAddress.substring(merchantPayoutAddress.length - 6))
    } else {
      console.log('ℹ️ Payment flow: No auto-forwarding (manual withdrawal)')
    }

    console.log('📡 Sending payment request to NOWPayments:')
    console.log('- price_amount:', paymentRequest.price_amount)
    console.log('- price_currency:', paymentRequest.price_currency)
    console.log('- pay_currency:', paymentRequest.pay_currency)
    console.log('- order_id:', paymentRequest.order_id)
    console.log('- payout_address:', paymentRequest.payout_address ? paymentRequest.payout_address.substring(0, 6) + '...' + paymentRequest.payout_address.substring(paymentRequest.payout_address.length - 6) : undefined)
    console.log('- payout_currency:', paymentRequest.payout_currency)
    console.log('- ipn_callback_url:', paymentRequest.ipn_callback_url)
    console.log('- fixed_rate:', paymentRequest.fixed_rate)

    // Create payment with NOWPayments
    const payment = await createPayment(paymentRequest)

    console.log('✅ Payment created successfully:', {
      payment_id: payment.payment_id,
      payment_status: payment.payment_status,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      payout_configured: !!paymentRequest.payout_address
    })

    // Create transaction record in database
    console.log('💾 Creating transaction record in database...')
    
    const transactionData = {
      merchant_id: merchantId,
      payment_id: payment.payment_id, // Use correct column name
      payment_link_id: payment_link_id,
      status: payment.payment_status,
      price_amount: amount,
      price_currency: price_currency.toUpperCase(),
      pay_amount: payment.pay_amount,
      pay_currency: pay_currency.toUpperCase(),
      pay_address: payment.pay_address,
      order_id: paymentRequest.order_id,
      order_description: paymentRequest.order_description,
      payout_configured: !!paymentRequest.payout_address,
      payout_address: paymentRequest.payout_address || null,
      payout_currency: paymentRequest.payout_currency ? paymentRequest.payout_currency.toUpperCase() : null,
      customer_email: customer_email || null,
      // Tax information
      tax_enabled: tax_enabled || false,
      base_amount: base_amount || amount,
      tax_rates: tax_rates || [],
      tax_amount: tax_amount || 0,
      subtotal_with_tax: subtotal_with_tax || amount
    }

    console.log('💾 Transaction data to insert:', {
      merchant_id: transactionData.merchant_id,
      payment_id: transactionData.payment_id,
      payment_link_id: transactionData.payment_link_id,
      status: transactionData.status,
      price_amount: transactionData.price_amount,
      pay_currency: transactionData.pay_currency,
      payout_configured: transactionData.payout_configured
    })

    const { data: transactionRecord, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Error creating transaction record:', transactionError)
      console.warn('⚠️ Payment created but transaction record failed - webhook will handle it')
      // Don't fail the entire request - the webhook can create the transaction record
    } else {
      console.log('✅ Transaction record created successfully:', transactionRecord?.id)
    }

    // Increment payment link usage count if applicable
    if (payment_link_id) {
      try {
        console.log('📊 Incrementing payment link usage count...')
        const { error: usageError } = await supabase.rpc('increment_payment_link_usage', {
          payment_link_id: payment_link_id
        })
        
        if (usageError) {
          console.error('❌ Error incrementing usage count:', usageError)
        } else {
          console.log('✅ Payment link usage count updated')
        }
      } catch (usageError) {
        console.error('❌ Error calling increment function:', usageError)
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        payment_id: payment.payment_id,
        payment_status: payment.payment_status,
        pay_address: payment.pay_address,
        price_amount: payment.price_amount,
        price_currency: payment.price_currency,
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency,
        order_id: payment.order_id,
        order_description: payment.order_description,
        purchase_id: payment.purchase_id,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        outcome_amount: payment.outcome_amount,
        outcome_currency: payment.outcome_currency
      }
    })

  } catch (error) {
    console.error('❌ Payment creation error:', error)
    
    // Check if this is an auto-forwarding error
    if (error instanceof Error && error.message.includes('payout_address')) {
      console.log('🔄 Auto-forwarding failed, attempting payment without auto-forwarding...')
      
      // Try to create payment without auto-forwarding
      try {
        console.log('🔄 Retrying payment creation without auto-forwarding...')
        
        const retryPaymentRequest = {
          price_amount: amount,
          price_currency: formatCurrencyForNOWPayments(price_currency),
          pay_currency: formatCurrencyForNOWPayments(pay_currency),
          order_id: order_id || `cryptrac_${Date.now()}`,
          order_description: order_description || 'Cryptrac Payment',
          ipn_callback_url: ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
          fixed_rate: false
          // No payout_address or payout_currency
        }
        
        console.log('📡 Retry payment request (no auto-forwarding):', retryPaymentRequest)
        
        const retryPayment = await createPayment(retryPaymentRequest)
        
        console.log('✅ Payment created successfully without auto-forwarding:', retryPayment.payment_id)
        
        return NextResponse.json({
          success: true,
          payment: {
            payment_id: retryPayment.payment_id,
            payment_status: retryPayment.payment_status,
            pay_address: retryPayment.pay_address,
            price_amount: retryPayment.price_amount,
            price_currency: retryPayment.price_currency,
            pay_amount: retryPayment.pay_amount,
            pay_currency: retryPayment.pay_currency,
            order_id: retryPayment.order_id,
            order_description: retryPayment.order_description,
            purchase_id: retryPayment.purchase_id,
            created_at: retryPayment.created_at,
            updated_at: retryPayment.updated_at,
            outcome_amount: retryPayment.outcome_amount,
            outcome_currency: retryPayment.outcome_currency
          },
          warning: 'Invalid payout address for auto-forwarding. Payment will proceed without auto-forwarding.'
        })
        
      } catch (retryError) {
        console.error('❌ Retry payment creation also failed:', retryError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create payment. Please try again or contact support.' 
          },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment' 
      },
      { status: 500 }
    )
  }
}

