import { NextRequest, NextResponse } from 'next/server'

interface Estimate {
  currency_from: string
  currency_to: string
  amount_from: number
  estimated_amount: number
  fee_amount: number
  fee_percentage: number
  min_amount: number
  max_amount: number
}

interface EstimateAPIResponse {
  estimated_amount: string
  fee_amount?: string
  fee_percentage?: string
  min_amount?: string
  max_amount?: string
}

const estimateCache = new Map<string, { timestamp: number; data: Estimate }>()
const CACHE_TTL = 60 * 1000 // 1 minute

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency_from, currency_to } = body as {
      amount: number
      currency_from: string
      currency_to: string
    }

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

    const cacheKey = `${amount}-${currency_from}-${currency_to}`.toLowerCase()
    const cached = estimateCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Returning cached estimate for', cacheKey)
      return NextResponse.json({ success: true, estimate: cached.data })
    }

    const params = new URLSearchParams({
      amount: amount.toString(),
      currency_from: currency_from.toLowerCase(),
      currency_to: currency_to.toLowerCase()
    })

    let estimateData: EstimateAPIResponse | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const estimateResponse = await fetch(`https://api.nowpayments.io/v1/estimate?${params}`, {
          method: 'GET',
          headers: {
            'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
            'Content-Type': 'application/json'
          }
        })

        if (estimateResponse.ok) {
          estimateData = (await estimateResponse.json()) as EstimateAPIResponse
          break
        }

        const errorText = await estimateResponse.text()
        console.error(`❌ NOWPayments estimate error (${estimateResponse.status}):`, errorText)

        if (estimateResponse.status === 429 && attempt < 2) {
          const wait = (attempt + 1) * 1000
          console.warn(`⚠️ Rate limited, retrying in ${wait}ms...`)
          await new Promise(resolve => setTimeout(resolve, wait))
          continue
        }

        if (estimateResponse.status === 429) {
          return NextResponse.json(
            {
              success: false,
              error: 'Rate limit exceeded. Please try again in a moment.',
              retry_after: 30
            },
            { status: 429 }
          )
        }

        throw new Error(`NOWPayments API error: ${estimateResponse.status}`)
      } catch (err) {
        if (attempt === 2) {
          throw err
        }
        const wait = (attempt + 1) * 1000
        console.warn(`⚠️ Error fetching estimate, retrying in ${wait}ms...`, err)
        await new Promise(resolve => setTimeout(resolve, wait))
      }
    }

    if (!estimateData) {
      throw new Error('Failed to fetch estimate')
    }

    const estimate: Estimate = {
      currency_from: currency_from.toUpperCase(),
      currency_to: currency_to.toUpperCase(),
      amount_from: amount,
      estimated_amount: parseFloat(estimateData.estimated_amount),
      fee_amount: parseFloat(estimateData.fee_amount || '0'),
      fee_percentage: parseFloat(estimateData.fee_percentage || '0'),
      min_amount: parseFloat(estimateData.min_amount || '0'),
      max_amount: parseFloat(estimateData.max_amount || '0')
    }

    estimateCache.set(cacheKey, { timestamp: Date.now(), data: estimate })
    console.log(`✅ Estimate for ${currency_to}: ${estimate.estimated_amount}`)

    return NextResponse.json({ success: true, estimate })
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

