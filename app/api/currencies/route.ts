import { NextRequest, NextResponse } from 'next/server'

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
let currencyCache: {
  data: any[] | null
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

// NOWPayments API configuration
const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1'
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY

// Top currencies that should be prioritized (same as before for consistency)
const TOP_CURRENCY_CODES = [
  'BTC', 'ETH', 'BNB', 'SOL', 'TRX', 'TON', 'AVAX', 'DOGE', 'XRP', 'SUI',
  'USDT_ERC20', 'USDC_ERC20', 'USDT_BEP20', 'USDC_BEP20', 'USDT_SOL', 'USDC_SOL',
  'USDT_TRC20', 'USDC_TRC20', 'USDT_TON', 'USDT_AVAX', 'USDC_AVAX'
]

// Fallback static currencies in case NOWPayments API fails
const FALLBACK_CURRENCIES = [
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    network: 'Bitcoin',
    rate_usd: 45000.00,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Bitcoin'
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    network: 'Ethereum',
    rate_usd: 2800.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Ethereum'
  },
  {
    code: 'USDT_ERC20',
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.01,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'USDT (ERC-20)'
  },
  {
    code: 'USDC_ERC20',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.01,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'USDC (ERC-20)'
  }
]

// Function to fetch currencies from NOWPayments API
async function fetchNOWPaymentsCurrencies(): Promise<any[]> {
  if (!NOWPAYMENTS_API_KEY) {
    console.warn('⚠️ NOWPayments API key not found, using fallback currencies')
    return FALLBACK_CURRENCIES
  }

  try {
    console.log('📡 Fetching currencies from NOWPayments API...')
    
    // Fetch detailed currency information
    const response = await fetch(`${NOWPAYMENTS_API_BASE}/full-currencies`, {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`NOWPayments API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Fetched ${data.currencies?.length || 0} currencies from NOWPayments`)

    if (!data.currencies || !Array.isArray(data.currencies)) {
      throw new Error('Invalid response format from NOWPayments API')
    }

    // Transform NOWPayments data to our format
    const transformedCurrencies = data.currencies.map((currency: any) => ({
      code: currency.code?.toUpperCase() || currency.ticker?.toUpperCase(),
      name: currency.name || currency.code,
      symbol: currency.code?.toUpperCase() || currency.ticker?.toUpperCase(),
      network: currency.network || 'Unknown',
      rate_usd: parseFloat(currency.rate_usd) || 0,
      min_amount: parseFloat(currency.min_amount) || 0.00000001,
      max_amount: parseFloat(currency.max_amount) || 1000000,
      decimals: parseInt(currency.decimals) || 8,
      enabled: currency.is_available !== false,
      trust_wallet_compatible: true, // Assume compatible unless specified
      display_name: currency.name || currency.code?.toUpperCase()
    })).filter((currency: any) => 
      currency.code && 
      currency.enabled && 
      currency.code.length >= 2 && 
      currency.code.length <= 20
    )

    return transformedCurrencies

  } catch (error) {
    console.error('❌ Error fetching from NOWPayments API:', error)
    console.log('🔄 Falling back to static currency list')
    return FALLBACK_CURRENCIES
  }
}

// Function to get currencies with caching
async function getCurrenciesWithCache(): Promise<any[]> {
  const now = Date.now()
  
  // Check if cache is valid
  if (currencyCache.data && (now - currencyCache.timestamp) < CACHE_DURATION) {
    console.log('📦 Using cached currency data')
    return currencyCache.data
  }

  // Fetch fresh data
  const currencies = await fetchNOWPaymentsCurrencies()
  
  // Update cache
  currencyCache = {
    data: currencies,
    timestamp: now
  }

  return currencies
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const popularOnly = searchParams.get('popular') === 'true'

    console.log(`📡 Currencies API called, popular: ${popularOnly}`)

    // Get currencies (with caching)
    const allCurrencies = await getCurrenciesWithCache()

    if (popularOnly) {
      // Return only top currencies
      const topCurrencies = allCurrencies.filter(currency => 
        TOP_CURRENCY_CODES.includes(currency.code)
      ).sort((a, b) => {
        const aIndex = TOP_CURRENCY_CODES.indexOf(a.code)
        const bIndex = TOP_CURRENCY_CODES.indexOf(b.code)
        return aIndex - bIndex
      })

      console.log(`✅ Returning ${topCurrencies.length} top currencies (popular: ${popularOnly})`)

      return NextResponse.json({
        success: true,
        currencies: topCurrencies,
        total_count: topCurrencies.length,
        popular_only: true,
        last_updated: new Date().toISOString(),
        source: 'nowpayments_api',
        cache_status: currencyCache.timestamp > 0 ? 'cached' : 'fresh',
        message: 'Top cryptocurrencies loaded successfully from NOWPayments'
      })
    } else {
      // Return all currencies, sorted with top currencies first
      const sortedCurrencies = allCurrencies.sort((a, b) => {
        const aIsTop = TOP_CURRENCY_CODES.includes(a.code)
        const bIsTop = TOP_CURRENCY_CODES.includes(b.code)
        
        if (aIsTop && !bIsTop) return -1
        if (!aIsTop && bIsTop) return 1
        if (aIsTop && bIsTop) {
          return TOP_CURRENCY_CODES.indexOf(a.code) - TOP_CURRENCY_CODES.indexOf(b.code)
        }
        return a.name.localeCompare(b.name)
      })

      console.log(`✅ Returning ${sortedCurrencies.length} currencies (popular: ${popularOnly})`)

      return NextResponse.json({
        success: true,
        currencies: sortedCurrencies,
        total_count: sortedCurrencies.length,
        popular_only: false,
        last_updated: new Date().toISOString(),
        source: 'nowpayments_api',
        cache_status: currencyCache.timestamp > 0 ? 'cached' : 'fresh',
        message: 'All supported cryptocurrencies loaded successfully from NOWPayments'
      })
    }

  } catch (error) {
    console.error('💥 Error in currencies API:', error)
    
    // Return fallback currencies in case of complete failure
    const fallbackResponse = {
      success: true,
      currencies: FALLBACK_CURRENCIES,
      total_count: FALLBACK_CURRENCIES.length,
      popular_only: false,
      last_updated: new Date().toISOString(),
      source: 'fallback_static',
      cache_status: 'error',
      message: 'Fallback currencies loaded due to API error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json(fallbackResponse, { status: 200 }) // Return 200 to avoid breaking the frontend
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

