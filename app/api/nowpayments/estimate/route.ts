import { NextRequest, NextResponse } from 'next/server'
import { getPaymentEstimate } from '@/lib/nowpayments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency_from, currencies_to } = body

    console.log('📊 Estimate API called with:', {
      amount,
      currency_from,
      currencies_to,
      api_key_exists: !!process.env.NOWPAYMENTS_API_KEY,
      api_key_length: process.env.NOWPAYMENTS_API_KEY?.length || 0
    })

    if (!amount || !currency_from || !currencies_to || !Array.isArray(currencies_to)) {
      console.error('❌ Invalid estimate request parameters')
      return NextResponse.json(
        { success: false, message: 'Invalid parameters' },
        { status: 400 }
      )
    }

    if (!process.env.NOWPAYMENTS_API_KEY) {
      console.error('❌ NOWPAYMENTS_API_KEY not found in environment')
      return NextResponse.json(
        { success: false, message: 'NOWPayments API key not configured' },
        { status: 500 }
      )
    }

    const estimates = []

    // Get estimates for each currency
    for (const currency_to of currencies_to) {
      try {
        console.log(`📊 Getting estimate: ${amount} ${currency_from} -> ${currency_to}`)
        
        // Fix: Pass 3 separate arguments instead of 1 object
        const estimate = await getPaymentEstimate(amount, currency_from, currency_to)

        console.log(`✅ Estimate result for ${currency_to}:`, estimate)
        
        if (estimate) {
          estimates.push(estimate)
        } else {
          console.warn(`⚠️ No estimate returned for ${currency_to}`)
        }
      } catch (error) {
        console.error(`❌ Error getting estimate for ${currency_to}:`, error)
        // Continue with other currencies even if one fails
      }
    }

    console.log('📊 Final estimates array:', estimates)

    return NextResponse.json({
      success: true,
      estimates,
      debug: {
        requested_currencies: currencies_to,
        successful_estimates: estimates.length,
        api_key_configured: !!process.env.NOWPAYMENTS_API_KEY
      }
    })

  } catch (error) {
    console.error('❌ Error in estimate API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

