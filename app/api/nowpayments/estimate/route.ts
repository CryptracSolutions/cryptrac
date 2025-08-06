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
      
      // Build query string for GET request (FIXED: Proper NOWPayments API usage)
      const params = new URLSearchParams({
        amount: amount.toString(),
        currency_from: currency_from.toLowerCase(),
        currency_to: currency_to.toLowerCase()
      })

      // Call NOWPayments estimate API with proper GET method
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
        
        // Handle 429 rate limiting gracefully
        if (estimateResponse.status === 429) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Rate limit exceeded. Please try again in a moment.',
              retry_after: 30 // Suggest 30 second retry
            },
            { status: 429 }
          )
        }
        
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
          estimated_amount: parseFloat(estimateData.estimated_amount),
          fee_amount: parseFloat(estimateData.fee_amount || '0'),
          fee_percentage: parseFloat(estimateData.fee_percentage || '0'),
          min_amount: parseFloat(estimateData.min_amount || '0'),
          max_amount: parseFloat(estimateData.max_amount || '0')
        }
      })

    } catch (error) {
      console.error(`❌ Error getting estimate for ${currency_to}:`, error)
      
      // Handle different error types
      let errorMessage = 'Failed to get estimate from NOWPayments'
      let statusCode = 500
      
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
          statusCode = 429
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid currency pair or amount'
          statusCode = 400
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: statusCode }
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

