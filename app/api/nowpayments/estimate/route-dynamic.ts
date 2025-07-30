import { NextRequest, NextResponse } from 'next/server'
import { getEstimate, formatCurrencyForNOWPayments } from '@/lib/nowpayments-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency_from, currencies } = body

    console.log('📊 Estimate request received:', { amount, currency_from, currencies: currencies?.length })

    if (!amount || !currency_from || !currencies || !Array.isArray(currencies)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: amount, currency_from, currencies' 
        },
        { status: 400 }
      )
    }

    const estimates = []
    const errors = []

    // Process estimates for each currency
    for (const currency of currencies) {
      try {
        console.log(`📊 Getting estimate for ${currency_from} -> ${currency}`)
        
        const estimate = await getEstimate({
          amount: parseFloat(amount),
          currency_from: currency_from,
          currency_to: currency
        })

        estimates.push({
          currency: currency.toUpperCase(),
          estimated_amount: estimate.estimated_amount,
          currency_from: estimate.currency_from.toUpperCase(),
          amount_from: estimate.amount_from,
          fiat_equivalent: estimate.fiat_equivalent,
          min_amount: estimate.min_amount,
          max_amount: estimate.max_amount,
          rate: estimate.estimated_amount / estimate.amount_from
        })

        console.log(`✅ Estimate for ${currency}: ${estimate.estimated_amount}`)

      } catch (error) {
        console.error(`❌ Error getting estimate for ${currency}:`, error)
        errors.push({
          currency: currency.toUpperCase(),
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`📊 Completed estimates: ${estimates.length} successful, ${errors.length} failed`)

    return NextResponse.json({
      success: true,
      estimates,
      errors: errors.length > 0 ? errors : undefined,
      total_estimates: estimates.length,
      total_errors: errors.length,
      source: 'nowpayments_dynamic_api'
    })

  } catch (error) {
    console.error('💥 Error in estimate API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get estimates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

