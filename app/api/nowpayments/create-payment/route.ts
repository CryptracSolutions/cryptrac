import { createPayment, formatCurrencyForNOWPayments } from '@/lib/nowpayments-dynamic'
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
    let paymentLinkData = null
    let merchantId = null

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

        paymentLinkData = paymentLink
        merchantId = paymentLink.merchant_id

        // Access merchant data correctly (it's an array due to the join)
        const merchant = Array.isArray(paymentLink.merchants) 
          ? paymentLink.merchants[0] 
          : paymentLink.merchants

        console.log('✅ Payment link found:', {
          id: paymentLink.id,
          merchant_id: merchantId,
          has_wallets: !!merchant.wallets
        })

        // Get wallet addresses from merchant or payment link metadata
        const merchantWallets = merchant.wallets || {}
        const metadataWallets = paymentLink.metadata?.wallet_addresses || {}
        const allWallets = { ...merchantWallets, ...metadataWallets }

        console.log('💰 Available wallet addresses:', Object.keys(allWallets))

        // Determine auto-convert settings
        const autoConvertEnabled = merchant.auto_convert_enabled || 
                                 paymentLink.metadata?.fee_breakdown?.effective_auto_convert_enabled
        const preferredPayoutCurrency = merchant.preferred_payout_currency ||
                                      paymentLink.metadata?.fee_breakdown?.effective_preferred_payout_currency

        console.log('🔄 Auto-convert settings:', {
          auto_convert_enabled: autoConvertEnabled,
          preferred_payout_currency: preferredPayoutCurrency,
          payment_currency: pay_currency
        })

        // Determine which currency to look for wallet address
        let targetCurrency = pay_currency
        if (autoConvertEnabled && preferredPayoutCurrency) {
          targetCurrency = preferredPayoutCurrency
          merchantPayoutCurrency = formatCurrencyForNOWPayments(preferredPayoutCurrency)
          console.log(`🔄 Auto-convert enabled: Looking for ${preferredPayoutCurrency} wallet (not ${pay_currency})`)
        } else {
          merchantPayoutCurrency = formatCurrencyForNOWPayments(pay_currency)
          console.log(`➡️ Direct forwarding: Looking for ${pay_currency} wallet`)
        }

        console.log('🔍 Target currency for wallet lookup:', targetCurrency)

        // Map target currency to wallet address with enhanced logging
        const targetCurrencyUpper = targetCurrency.toUpperCase()
        let walletAddress = null
        let matchedKey = null

        // Direct match first
        if (allWallets[targetCurrencyUpper]) {
          walletAddress = allWallets[targetCurrencyUpper]
          matchedKey = targetCurrencyUpper
          console.log(`✅ Direct wallet match for ${targetCurrencyUpper}:`, walletAddress ? '***' : 'null')
        } else {
          // Try common variations
          const variations = [
            targetCurrency.toLowerCase(),
            targetCurrency.toUpperCase(),
            targetCurrencyUpper.replace('_', ''),
            targetCurrencyUpper.replace('-', '_'),
          ]

          for (const variation of variations) {
            if (allWallets[variation]) {
              walletAddress = allWallets[variation]
              matchedKey = variation
              console.log(`✅ Wallet match found for ${targetCurrencyUpper} via variation ${variation}:`, walletAddress ? '***' : 'null')
              break
            }
          }

          // Enhanced currency mappings for ERC-20 tokens
          if (!walletAddress) {
            const currencyMappings: Record<string, string[]> = {
              'ETH': ['ETH', 'ETHEREUM'],
              'USDT': ['ETH', 'ETHEREUM', 'USDT_ERC20', 'USDT_TRC20', 'USDT_BSC', 'USDT_POLYGON'], // USDT defaults to ETH address
              'USDC': ['ETH', 'ETHEREUM', 'USDC_ERC20', 'USDC_POLYGON', 'USDC_BSC'], // USDC defaults to ETH address
              'DAI': ['ETH', 'ETHEREUM'], // DAI is ERC-20
              'TUSD': ['ETH', 'ETHEREUM'], // TUSD is ERC-20
              'USDP': ['ETH', 'ETHEREUM'], // USDP is ERC-20
              'PYUSD': ['ETH', 'ETHEREUM'], // PYUSD is ERC-20
              'BTC': ['BTC', 'BITCOIN'],
              'BNB': ['BNB', 'BSC'],
              'MATIC': ['MATIC', 'POLYGON'],
              'TRX': ['TRX', 'TRON'],
              'SOL': ['SOL', 'SOLANA']
            }

            for (const [baseCode, variants] of Object.entries(currencyMappings)) {
              if (targetCurrencyUpper.includes(baseCode) || variants.includes(targetCurrencyUpper)) {
                for (const variant of variants) {
                  if (allWallets[variant]) {
                    walletAddress = allWallets[variant]
                    matchedKey = variant
                    console.log(`✅ Wallet match found for ${targetCurrencyUpper} via mapping ${variant}:`, walletAddress ? '***' : 'null')
                    break
                  }
                }
                if (walletAddress) break
              }
            }
          }
        }

        if (!walletAddress) {
          console.warn(`⚠️ No wallet address found for target currency: ${targetCurrencyUpper}`)
          console.log('Available wallets:', Object.keys(allWallets))
          console.log('Auto-convert scenario:', autoConvertEnabled ? `${pay_currency} → ${preferredPayoutCurrency}` : 'disabled')
          // Don't fail the payment - NOWPayments will handle without auto-forwarding
        } else {
          // Sanitize and validate the wallet address
          const sanitizedAddress = sanitizeAddress(walletAddress)
          console.log(`🔍 Raw wallet address: "${walletAddress}"`)
          console.log(`🧹 Sanitized wallet address: "${sanitizedAddress}"`)
          console.log(`🔍 Address length: ${sanitizedAddress.length}`)
          console.log(`🔍 Validating address for currency: ${targetCurrencyUpper}`)
          console.log(`🔍 Address validation result:`, validateAddressForCurrency(sanitizedAddress, targetCurrencyUpper))

          if (!validateAddressForCurrency(sanitizedAddress, targetCurrencyUpper)) {
            console.error(`❌ Invalid wallet address for ${targetCurrencyUpper}: ${sanitizedAddress}`)
            console.warn('⚠️ Proceeding without auto-forwarding due to invalid address')
            // Clear the payout address to proceed without auto-forwarding
            merchantPayoutAddress = null
            merchantPayoutCurrency = null
          } else {
            merchantPayoutAddress = sanitizedAddress
            console.log(`✅ Using validated merchant wallet address for auto-forwarding`)
            console.log(`✅ Payment flow: ${pay_currency} → ${autoConvertEnabled ? `convert to ${targetCurrencyUpper}` : 'direct'} → ${sanitizedAddress.substring(0, 6)}...${sanitizedAddress.substring(sanitizedAddress.length - 4)}`)
          }
        }

      } catch (error) {
        console.error('❌ Error looking up merchant wallet:', error)
        // Continue without auto-forwarding rather than failing the payment
        merchantPayoutAddress = null
        merchantPayoutCurrency = null
      }
    }

    // Prepare payment request with enhanced logging
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

    console.log('📡 Sending payment request to NOWPayments:')
    console.log('  - price_amount:', paymentRequest.price_amount)
    console.log('  - price_currency:', paymentRequest.price_currency)
    console.log('  - pay_currency:', paymentRequest.pay_currency)
    console.log('  - order_id:', paymentRequest.order_id)
    console.log('  - payout_address:', paymentRequest.payout_address ? `${paymentRequest.payout_address.substring(0, 6)}...${paymentRequest.payout_address.substring(paymentRequest.payout_address.length - 4)}` : 'null (no auto-forwarding)')
    console.log('  - payout_currency:', paymentRequest.payout_currency)
    console.log('  - ipn_callback_url:', paymentRequest.ipn_callback_url)
    console.log('  - fixed_rate:', paymentRequest.fixed_rate)

    // Create payment with NOWPayments
    const payment = await createPayment(paymentRequest)

    console.log('✅ Payment created successfully:', {
      payment_id: payment.payment_id,
      payment_status: payment.payment_status,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      payout_configured: !!merchantPayoutAddress
    })

    // Create transaction record in database with correct column names
    console.log('💾 Creating transaction record in database...')
    
    try {
      const transactionData = {
        merchant_id: merchantId,
        nowpayments_payment_id: payment.payment_id, // Fixed: use correct column name
        payment_link_id: payment_link_id,
        order_id: payment.order_id,
        status: 'waiting', // Initial status
        price_amount: payment.price_amount,
        price_currency: payment.price_currency.toUpperCase(),
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency.toUpperCase(),
        pay_address: payment.pay_address,
        payout_currency: merchantPayoutCurrency?.toUpperCase(),
        customer_email: customer_email,
        // Tax information
        tax_enabled: tax_enabled || false,
        base_amount: base_amount || payment.price_amount,
        tax_rates: tax_rates || [],
        tax_amount: tax_amount || 0,
        subtotal_with_tax: subtotal_with_tax || payment.price_amount,
        // Additional metadata in payment_data JSONB field
        payment_data: {
          nowpayments_data: {
            purchase_id: payment.purchase_id,
            outcome_amount: payment.outcome_amount,
            outcome_currency: payment.outcome_currency,
            created_at: payment.created_at,
            updated_at: payment.updated_at
          },
          payout_configured: !!merchantPayoutAddress,
          auto_forwarding_enabled: !!merchantPayoutAddress,
          payout_address: merchantPayoutAddress
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('💾 Transaction data to insert:', {
        merchant_id: transactionData.merchant_id,
        nowpayments_payment_id: transactionData.nowpayments_payment_id,
        payment_link_id: transactionData.payment_link_id,
        status: transactionData.status,
        price_amount: transactionData.price_amount,
        pay_currency: transactionData.pay_currency,
        payout_configured: !!merchantPayoutAddress
      })

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()

      if (transactionError) {
        console.error('❌ Error creating transaction record:', transactionError)
        // Don't fail the payment creation, just log the error
        console.warn('⚠️ Payment created but transaction record failed - webhook will handle it')
      } else {
        console.log('✅ Transaction record created successfully:', transaction.id)
        
        // Update payment link usage count if applicable
        if (payment_link_id) {
          try {
            const { error: usageError } = await supabase
              .rpc('increment_payment_link_usage', { payment_link_id })
            
            if (usageError) {
              console.error('❌ Error updating payment link usage:', usageError)
            } else {
              console.log('✅ Payment link usage count updated')
            }
          } catch (usageUpdateError) {
            console.error('❌ Error calling increment_payment_link_usage:', usageUpdateError)
          }
        }
      }

    } catch (dbError) {
      console.error('❌ Database error during transaction creation:', dbError)
      // Don't fail the payment creation, just log the error
      console.warn('⚠️ Payment created but database record failed - webhook will handle it')
    }

    // Return successful payment response
    return NextResponse.json({
      success: true,
      payment: payment,
      message: merchantPayoutAddress 
        ? 'Payment created with auto-forwarding enabled'
        : 'Payment created (auto-forwarding not configured)'
    })

  } catch (error) {
    console.error('❌ Error creating payment:', error)
    
    // Enhanced error handling for common NOWPayments errors
    let errorMessage = 'Failed to create payment'
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      if (errorMsg.includes('invalid payout address')) {
        errorMessage = 'Invalid payout address for auto-forwarding. Payment will proceed without auto-forwarding.'
        
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
            payment: retryPayment,
            message: 'Payment created without auto-forwarding (address validation failed)',
            warning: 'Auto-forwarding disabled due to invalid payout address'
          })
          
        } catch (retryError) {
          console.error('❌ Retry payment creation also failed:', retryError)
          errorMessage = retryError instanceof Error ? retryError.message : 'Failed to create payment'
        }
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 400 }
    )
  }
}

