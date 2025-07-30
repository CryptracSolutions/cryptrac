import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAvailableCurrencies } from '@/lib/nowpayments-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = params.id

    console.log(`🔍 Getting supported currencies for merchant: ${merchantId}`)

    // Get merchant wallet configuration
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('wallets')
      .eq('id', merchantId)
      .single()

    if (merchantError) {
      console.error('Error fetching merchant:', merchantError)
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      )
    }

    const merchantWallets = merchant.wallets || {}
    const configuredCurrencies = Object.keys(merchantWallets)

    console.log(`💰 Merchant has ${configuredCurrencies.length} configured wallets:`, configuredCurrencies)

    // Get all available currencies from NOWPayments
    let allCurrencies
    try {
      allCurrencies = await fetchAvailableCurrencies()
      console.log(`📡 Fetched ${allCurrencies.length} currencies from NOWPayments`)
    } catch (error) {
      console.error('Error fetching currencies from NOWPayments:', error)
      // Fallback to merchant wallets only if NOWPayments fails
      const fallbackCurrencies = configuredCurrencies.map(code => ({
        code: code.toUpperCase(),
        name: code,
        network: 'Unknown',
        is_available: true,
        min_amount: 0.00000001,
        max_amount: 1000000,
        rate_usd: 0,
        has_wallet: true,
        wallet_address: merchantWallets[code],
        display_name: code
      }))

      return NextResponse.json({
        success: true,
        currencies: fallbackCurrencies,
        total_count: fallbackCurrencies.length,
        source: 'fallback_merchant_wallets',
        message: 'Using merchant wallet configuration due to API error'
      })
    }

    // Filter currencies to only include those with configured wallets
    const supportedCurrencies = allCurrencies
      .filter(currency => {
        // Check if merchant has a wallet for this currency (case-insensitive)
        const hasWallet = configuredCurrencies.some(walletCurrency => 
          walletCurrency.toUpperCase() === currency.code.toUpperCase()
        )
        return hasWallet && currency.is_available
      })
      .map(currency => {
        // Find the matching wallet address
        const walletKey = configuredCurrencies.find(walletCurrency => 
          walletCurrency.toUpperCase() === currency.code.toUpperCase()
        )
        
        return {
          code: currency.code.toUpperCase(),
          name: currency.name,
          network: currency.network,
          is_available: currency.is_available,
          min_amount: currency.min_amount,
          max_amount: currency.max_amount,
          rate_usd: currency.rate_usd,
          has_wallet: true,
          wallet_address: walletKey ? merchantWallets[walletKey] : null,
          display_name: currency.name || currency.code.toUpperCase(),
          enabled: true,
          trust_wallet_compatible: true
        }
      })

    console.log(`✅ Found ${supportedCurrencies.length} supported currencies for merchant`)

    return NextResponse.json({
      success: true,
      currencies: supportedCurrencies,
      total_count: supportedCurrencies.length,
      merchant_id: merchantId,
      configured_wallets: configuredCurrencies.length,
      source: 'nowpayments_dynamic_filtered',
      last_updated: new Date().toISOString(),
      message: 'Supported currencies based on merchant wallet configuration and NOWPayments availability'
    })

  } catch (error) {
    console.error('💥 Error in supported currencies API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get supported currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

