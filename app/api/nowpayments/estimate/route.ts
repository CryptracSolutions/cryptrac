import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency_from, currency_to } = body

    console.log('📊 Estimate request received:', { amount, currency_from, currency_to })

    if (!amount || !currency_from || !currency_to) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: amount, currency_from, currency_to' 
        },
        { status: 400 }
      )
    }

    try {
      console.log(`📊 Getting estimate for ${currency_from} -> ${currency_to}`)
      
      // Call NOWPayments estimate API
      const response = await fetch('https://api.nowpayments.io/v1/estimate', {
        method: 'GET',
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
          'Content-Type': 'application/json',
        },
        // Use query parameters for GET request
      })

      // Build query string manually for GET request
      const params = new URLSearchParams({
        amount: amount.toString(),
        currency_from: currency_from.toLowerCase(),
        currency_to: currency_to.toLowerCase()
      })

      const estimateResponse = await fetch(`https://api.nowpayments.io/v1/estimate?${params}`, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
          'Content-Type': 'application/json',
        },
      })

      if (!estimateResponse.ok) {
        const errorText = await estimateResponse.text()
        console.error(`❌ NOWPayments estimate error (${estimateResponse.status}):`, errorText)
        throw new Error(`NOWPayments API error: ${estimateResponse.status}`)
      }

      const estimateData = await estimateResponse.json()
      console.log(`✅ Estimate for ${currency_to}: ${estimateData.estimated_amount}`)

      return NextResponse.json({
        success: true,
        estimate: {
          currency_from: currency_from.toUpperCase(),
          currency_to: currency_to.toUpperCase(),
          amount_from: parseFloat(amount),
          estimated_amount: estimateData.estimated_amount,
          fee_amount: estimateData.fee_amount || 0,
          fee_percentage: estimateData.fee_percentage || 0,
          min_amount: estimateData.min_amount,
          max_amount: estimateData.max_amount
        }
      })

    } catch (error) {
      console.error(`❌ Error getting estimate for ${currency_to}:`, error)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to get estimate from NOWPayments',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Error in estimate API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process estimate request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

