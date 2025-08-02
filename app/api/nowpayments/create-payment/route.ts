import { NextRequest, NextResponse } from 'next/server'
import { createPayment, formatCurrencyForNOWPayments } from '@/lib/nowpayments-dynamic'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
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

    // Validate amount
    const amount = parseFloat(price_amount)
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

    if (payment_link_id && !payout_address) {
      console.log('🔍 Looking up merchant wallet address for payment link:', payment_link_id)
      
      try {
        // Get payment link with merchant wallet addresses
        const { data: paymentLink, error: linkError } = await supabase
          .from('payment_links')
          .select(`
            id,
            metadata,
            merchant_id,
            merchants!inner(
              id,
              wallets,
              preferred_payout_currency,
              auto_convert_enabled
            )
          `)
          .eq('id', payment_link_id)
          .single()

        if (linkError || !paymentLink) {
          console.error('❌ Payment link not found:', linkError)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Payment link not found' 
            },
            { status: 404 }
          )
        }

        // Access merchant data correctly (it's an array due to the join)
        const merchant = Array.isArray(paymentLink.merchants) 
          ? paymentLink.merchants[0] 
          : paymentLink.merchants

        console.log('✅ Payment link found:', {
          id: paymentLink.id,
          merchant_id: merchant.id,
          has_wallets: !!merchant.wallets
        })

        // Get wallet addresses from merchant or payment link metadata
        const merchantWallets = merchant.wallets || {}
        const metadataWallets = paymentLink.metadata?.wallet_addresses || {}
        const allWallets = { ...merchantWallets, ...metadataWallets }

        console.log('💰 Available wallet addresses:', Object.keys(allWallets))

        // Map pay_currency to wallet address
        // Handle currency code variations (e.g., USDT_ERC20 -> USDT_ERC20, usdt -> USDT, etc.)
        const payCurrencyUpper = pay_currency.toUpperCase()
        let walletAddress = null

        // Direct match first
        if (allWallets[payCurrencyUpper]) {
          walletAddress = allWallets[payCurrencyUpper]
          console.log(`✅ Direct wallet match for ${payCurrencyUpper}:`, walletAddress ? '***' : 'null')
        } else {
          // Try common variations
          const variations = [
            pay_currency.toLowerCase(),
            pay_currency.toUpperCase(),
            payCurrencyUpper.replace('_', ''),
            payCurrencyUpper.replace('-', '_'),
          ]

          for (const variation of variations) {
            if (allWallets[variation]) {
              walletAddress = allWallets[variation]
              console.log(`✅ Wallet match found for ${payCurrencyUpper} via variation ${variation}:`, walletAddress ? '***' : 'null')
              break
            }
          }

          // Special handling for common currency mappings
          if (!walletAddress) {
            const currencyMappings: Record<string, string[]> = {
              'USDT': ['USDT_ERC20', 'USDT_TRC20', 'USDT_BSC', 'USDT_POLYGON'],
              'USDC': ['USDC_ERC20', 'USDC_POLYGON', 'USDC_BSC'],
              'ETH': ['ETH', 'ETHEREUM'],
              'BTC': ['BTC', 'BITCOIN'],
              'BNB': ['BNB', 'BSC'],
              'MATIC': ['MATIC', 'POLYGON'],
              'TRX': ['TRX', 'TRON']
            }

            for (const [baseCode, variants] of Object.entries(currencyMappings)) {
              if (payCurrencyUpper.includes(baseCode)) {
                for (const variant of variants) {
                  if (allWallets[variant]) {
                    walletAddress = allWallets[variant]
                    console.log(`✅ Wallet match found for ${payCurrencyUpper} via mapping ${variant}:`, walletAddress ? '***' : 'null')
                    break
                  }
                }
                if (walletAddress) break
              }
            }
          }
        }

        if (!walletAddress) {
          console.warn(`⚠️ No wallet address found for currency: ${payCurrencyUpper}`)
          console.log('Available wallets:', Object.keys(allWallets))
          // Don't fail the payment - NOWPayments will handle without auto-forwarding
        } else {
          merchantPayoutAddress = walletAddress
          console.log(`✅ Using merchant wallet address for auto-forwarding: ${payCurrencyUpper}`)
          
          // Set payout currency for auto-convert if enabled
          const autoConvertEnabled = merchant.auto_convert_enabled || 
                                   paymentLink.metadata?.fee_breakdown?.effective_auto_convert_enabled
          const preferredPayoutCurrency = merchant.preferred_payout_currency ||
                                        paymentLink.metadata?.fee_breakdown?.effective_preferred_payout_currency

          if (autoConvertEnabled && preferredPayoutCurrency) {
            merchantPayoutCurrency = formatCurrencyForNOWPayments(preferredPayoutCurrency)
            console.log(`🔄 Auto-convert enabled, payout currency: ${merchantPayoutCurrency}`)
          } else {
            // Use the same currency as payment for direct forwarding
            merchantPayoutCurrency = formatCurrencyForNOWPayments(pay_currency)
            console.log(`➡️ Direct forwarding, payout currency: ${merchantPayoutCurrency}`)
          }
        }

      } catch (error) {
        console.error('❌ Error looking up merchant wallet:', error)
        // Continue without auto-forwarding rather than failing the payment
      }
    }

    // Prepare payment request
    const paymentRequest = {
      price_amount: amount,
      price_currency: formatCurrencyForNOWPayments(price_currency),
      pay_currency: formatCurrencyForNOWPayments(pay_currency),
      order_id: order_id || `cryptrac_${Date.now()}`,
      order_description: order_description || 'Cryptrac Payment',
      payout_address: merchantPayoutAddress,
      payout_currency: merchantPayoutCurrency,
      ipn_callback_url: ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      fixed_rate: false // Use floating rate for better success rate
    }

    console.log('📡 Sending payment request to NOWPayments:', {
      ...paymentRequest,
      payout_address: paymentRequest.payout_address ? '***' : undefined
    })

    // Create payment with NOWPayments
    const payment = await createPayment(paymentRequest)

    console.log('✅ Payment created successfully:', {
      payment_id: payment.payment_id,
      payment_status: payment.payment_status,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      payout_configured: !!merchantPayoutAddress
    })

    return NextResponse.json({
      success: true,
      payment: {
        payment_id: payment.payment_id,
        payment_status: payment.payment_status,
        pay_address: payment.pay_address,
        price_amount: payment.price_amount,
        price_currency: payment.price_currency.toUpperCase(),
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency.toUpperCase(),
        order_id: payment.order_id,
        order_description: payment.order_description,
        purchase_id: payment.purchase_id,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        outcome_amount: payment.outcome_amount,
        outcome_currency: payment.outcome_currency?.toUpperCase(),
        payout_configured: !!merchantPayoutAddress
      },
      source: 'nowpayments_dynamic_api'
    })

  } catch (error) {
    console.error('💥 Error creating payment:', error)
    
    // Parse NOWPayments error messages for better user feedback
    let errorMessage = 'Failed to create payment'
    let statusCode = 500

    if (error instanceof Error) {
      const errorText = error.message.toLowerCase()
      
      if (errorText.includes('amount too small') || errorText.includes('min_amount')) {
        errorMessage = 'Payment amount is too small for this currency'
        statusCode = 400
      } else if (errorText.includes('amount too large') || errorText.includes('max_amount')) {
        errorMessage = 'Payment amount is too large for this currency'
        statusCode = 400
      } else if (errorText.includes('currency not supported') || errorText.includes('invalid currency')) {
        errorMessage = 'Currency not supported'
        statusCode = 400
      } else if (errorText.includes('invalid address') || errorText.includes('payout_address')) {
        errorMessage = 'Invalid payout address for auto-forwarding'
        statusCode = 400
      } else if (errorText.includes('rate')) {
        errorMessage = 'Unable to get exchange rate for this currency pair'
        statusCode = 400
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    )
  }
}

