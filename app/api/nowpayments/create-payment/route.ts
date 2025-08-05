import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Currency mapping for auto-forwarding
const CURRENCY_WALLET_MAPPING: Record<string, string[]> = {
  'USDT': ['ETH', 'ETHEREUM'],
  'USDC': ['ETH', 'ETHEREUM'],
  'DAI': ['ETH', 'ETHEREUM'],
  'PYUSD': ['ETH', 'ETHEREUM'],
  'USDTERC20': ['ETH', 'ETHEREUM'],
  'USDTBSC': ['BNB', 'BSC', 'BINANCE'],
  'USDCBSC': ['BNB', 'BSC', 'BINANCE'],
  'USDTSOL': ['SOL', 'SOLANA'],
  'USDCSOL': ['SOL', 'SOLANA'],
  'USDTTON': ['TON'],
  'USDTTRC20': ['TRX', 'TRON'],
  'USDTNEAR': ['NEAR'],
  'USDTDOT': ['DOT', 'POLKADOT'],
  'USDTMATIC': ['MATIC', 'POLYGON'],
  'USDCMATIC': ['MATIC', 'POLYGON'],
  'USDTAVAX': ['AVAX', 'AVALANCHE'],
  'USDCAVAX': ['AVAX', 'AVALANCHE'],
  'USDT_AVAX': ['AVAX', 'AVALANCHE'],
  'USDC_AVAX': ['AVAX', 'AVALANCHE'],
  'USDTALGO': ['ALGO', 'ALGORAND'],
  'USDCALGO': ['ALGO', 'ALGORAND'],
  'USDCXLM': ['XLM', 'STELLAR'],
  'USDTARBITRUM': ['ARB', 'ARBITRUM'],
  'USDCARBITRUM': ['ARB', 'ARBITRUM'],
  'USDTOP': ['OP', 'OPTIMISM'],
  'USDCOP': ['OP', 'OPTIMISM'],
  'USDCBASE': ['BASE'],
  'USDCKCC': ['KCC', 'KUCOIN'],
  'USDTEOS': ['EOS'],
  'USDTXTZ': ['XTZ', 'TEZOS'],
  'USDTKAVA': ['KAVA']
}

function formatCurrencyForNOWPayments(currency: string): string {
  return currency.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findWalletAddress(wallets: Record<string, string>, targetCurrency: string): string | null {
  const currencyUpper = targetCurrency.toUpperCase()
  
  // Direct match first
  if (wallets[currencyUpper]) {
    return wallets[currencyUpper]
  }
  
  // Check currency mapping
  const possibleWallets = CURRENCY_WALLET_MAPPING[currencyUpper]
  if (possibleWallets) {
    for (const walletType of possibleWallets) {
      if (wallets[walletType]) {
        console.log(`✅ Found wallet address for ${currencyUpper} using ${walletType} wallet`)
        return wallets[walletType]
      }
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  // Parse request body and extract variables at function scope
  const body = await request.json()
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
  } = body

  const amount = parseFloat(price_amount)

  try {
    console.log('💳 Payment creation request:', {
      price_amount: amount,
      price_currency: price_currency,
      pay_currency: pay_currency,
      order_id: order_id || `cryptrac_${Date.now()}`,
      payment_link_id: payment_link_id,
      payout_address: undefined,
      payout_currency: undefined
    })

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!price_currency || !pay_currency) {
      return NextResponse.json(
        { success: false, error: 'Missing currency information' },
        { status: 400 }
      )
    }

    if (!payment_link_id) {
      return NextResponse.json(
        { success: false, error: 'Missing payment link ID' },
        { status: 400 }
      )
    }

    // Step 1: Get payment link data
    console.log('🔍 Looking up merchant wallet address for payment link:', payment_link_id)
    
    const { data: paymentLinkData, error: linkError } = await supabase
      .from('payment_links')
      .select('id, merchant_id')
      .eq('id', payment_link_id)
      .single()

    if (linkError || !paymentLinkData) {
      console.error('Error fetching payment link:', linkError)
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment link found:', paymentLinkData)

    // Step 2: Get merchant data separately using correct column name 'wallets'
    let merchant = null
    let walletAddress = null
    let payoutCurrency = null

    try {
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('wallets, auto_convert_enabled, preferred_payout_currency')
        .eq('id', paymentLinkData.merchant_id)
        .single()

      if (merchantError) {
        console.error('Error fetching merchant:', merchantError)
        console.log('⚠️ Merchant not found, proceeding without auto-forwarding')
      } else {
        merchant = merchantData
        console.log('✅ Merchant found:', {
          auto_convert_enabled: merchant.auto_convert_enabled,
          preferred_payout_currency: merchant.preferred_payout_currency,
          wallet_count: Object.keys(merchant.wallets || {}).length
        })

        // Find appropriate wallet address for the selected currency
        if (merchant.wallets) {
          walletAddress = findWalletAddress(merchant.wallets, pay_currency)
          
          if (walletAddress) {
            console.log(`✅ Found wallet address for ${pay_currency}:`, walletAddress.substring(0, 10) + '...')
            
            // Set payout currency based on merchant settings
            if (merchant.auto_convert_enabled && merchant.preferred_payout_currency) {
              payoutCurrency = formatCurrencyForNOWPayments(merchant.preferred_payout_currency)
              console.log(`💱 Auto-convert enabled, payout currency: ${payoutCurrency}`)
            } else {
              payoutCurrency = formatCurrencyForNOWPayments(pay_currency)
              console.log(`💰 Direct crypto payout: ${payoutCurrency}`)
            }
          } else {
            console.log(`⚠️ No wallet address found for target currency: ${pay_currency}`)
            console.log('Available wallets:', Object.keys(merchant.wallets))
          }
        }
      }
    } catch (merchantError) {
      console.error('Error fetching merchant:', merchantError)
      console.log('⚠️ Merchant not found, proceeding without auto-forwarding')
    }

    // Log payment flow decision
    if (walletAddress && payoutCurrency) {
      console.log('ℹ️ Payment flow: Auto-forwarding enabled')
    } else {
      console.log('ℹ️ Payment flow: No auto-forwarding (manual withdrawal)')
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
    }

    console.log('📡 Sending payment request to NOWPayments:')
    console.log('- price_amount:', nowPaymentsPayload.price_amount)
    console.log('- price_currency:', nowPaymentsPayload.price_currency)
    console.log('- pay_currency:', nowPaymentsPayload.pay_currency)
    console.log('- order_id:', nowPaymentsPayload.order_id)
    console.log('- payout_address:', nowPaymentsPayload.payout_address || 'undefined')
    console.log('- payout_currency:', nowPaymentsPayload.payout_currency || 'undefined')
    console.log('- ipn_callback_url:', nowPaymentsPayload.ipn_callback_url)
    console.log('- fixed_rate:', nowPaymentsPayload.fixed_rate)

    // Create payment with NOWPayments
    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nowPaymentsPayload),
    })

    if (!nowPaymentsResponse.ok) {
      const errorData = await nowPaymentsResponse.json()
      console.error('NOWPayments API error:', nowPaymentsResponse.status, errorData)
      throw new Error(`NOWPayments API error: ${nowPaymentsResponse.status} ${JSON.stringify(errorData)}`)
    }

    const nowPaymentsData = await nowPaymentsResponse.json()
    console.log('✅ NOWPayments response received:', {
      payment_id: nowPaymentsData.payment_id,
      payment_status: nowPaymentsData.payment_status,
      pay_address: nowPaymentsData.pay_address?.substring(0, 10) + '...',
      pay_amount: nowPaymentsData.pay_amount
    })

    // Calculate fees and amounts
    const gatewayFee = nowPaymentsData.fee_amount || 0
    const merchantReceives = nowPaymentsData.outcome_amount || (amount - gatewayFee)

    // Store payment in database using correct column names
    const transactionData = {
      payment_link_id: payment_link_id,
      payment_id: nowPaymentsData.payment_id.toString(),
      order_id: nowPaymentsData.order_id,
      status: 'waiting',
      price_amount: amount,
      price_currency: price_currency.toUpperCase(),
      pay_amount: nowPaymentsData.pay_amount,
      pay_currency: nowPaymentsData.pay_currency.toUpperCase(),
      pay_address: nowPaymentsData.pay_address,
      payout_amount: nowPaymentsData.outcome_amount || 0,
      payout_currency: nowPaymentsData.outcome_currency || nowPaymentsData.pay_currency.toUpperCase(),
      gateway_fee: gatewayFee,
      merchant_receives: merchantReceives,
      is_fee_paid_by_user: nowPaymentsData.is_fee_paid_by_user || false,
      // Tax information
      tax_enabled: tax_enabled || false,
      base_amount: base_amount || amount,
      tax_rates: tax_rates || [],
      tax_amount: tax_amount || 0,
      subtotal_with_tax: subtotal_with_tax || amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Storing transaction in database:', {
      payment_id: transactionData.payment_id,
      status: transactionData.status,
      price_amount: transactionData.price_amount,
      pay_amount: transactionData.pay_amount,
      gateway_fee: transactionData.gateway_fee
    })

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Error storing transaction:', transactionError)
      // Continue anyway - payment was created successfully
    } else {
      console.log('✅ Transaction stored successfully:', transaction.id)
    }

    // Update payment link usage count using the payment link's link_id (not UUID)
    try {
      const { error: usageError } = await supabase.rpc('increment_payment_link_usage', {
        input_id: paymentLinkData.id // Use the UUID, function will handle both cases
      })
      
      if (usageError) {
        console.error('⚠️ Error updating payment link usage:', usageError)
      } else {
        console.log('✅ Payment link usage updated')
      }
    } catch (usageUpdateError) {
      console.error('⚠️ Error updating payment link usage:', usageUpdateError)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      payment: {
        payment_id: nowPaymentsData.payment_id,
        payment_status: nowPaymentsData.payment_status,
        pay_address: nowPaymentsData.pay_address,
        price_amount: amount,
        price_currency: price_currency.toUpperCase(),
        pay_amount: nowPaymentsData.pay_amount,
        pay_currency: nowPaymentsData.pay_currency.toUpperCase(),
        order_id: nowPaymentsData.order_id,
        order_description: nowPaymentsData.order_description,
        created_at: nowPaymentsData.created_at,
        updated_at: nowPaymentsData.updated_at,
        outcome_amount: nowPaymentsData.outcome_amount,
        outcome_currency: nowPaymentsData.outcome_currency
      }
    })

  } catch (error) {
    console.error('❌ Payment creation error:', error)
    
    // If auto-forwarding failed, try without it
    if (error instanceof Error && error.message.includes('payout_address')) {
      console.log('🔄 Retrying payment creation without auto-forwarding...')
      
      try {
        const retryPayload = {
          price_amount: amount,
          price_currency: formatCurrencyForNOWPayments(body.price_currency),
          pay_currency: formatCurrencyForNOWPayments(body.pay_currency),
          order_id: body.order_id || `cryptrac_${Date.now()}`,
          order_description: body.order_description || 'Cryptrac Payment',
          ipn_callback_url: body.ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
          fixed_rate: false
        }

        const retryResponse = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retryPayload),
        })

        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          console.log('✅ Retry successful - payment created without auto-forwarding')
          
          return NextResponse.json({
            success: true,
            payment: {
              payment_id: retryData.payment_id,
              payment_status: retryData.payment_status,
              pay_address: retryData.pay_address,
              price_amount: amount,
              price_currency: price_currency.toUpperCase(),
              pay_amount: retryData.pay_amount,
              pay_currency: retryData.pay_currency.toUpperCase(),
              order_id: retryData.order_id,
              order_description: retryData.order_description,
              created_at: retryData.created_at,
              updated_at: retryData.updated_at
            }
          })
        }
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError)
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

