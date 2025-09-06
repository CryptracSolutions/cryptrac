// Enhanced NOWPayments library with dynamic currency support
const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1'
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY

interface RawNOWPaymentsCurrency {
  code?: unknown;
  currency?: unknown;
  name?: unknown;
  network?: unknown;
  networks?: unknown;
  min_amount?: unknown;
  max_amount?: unknown;
  min_deposit_amount?: unknown;
  max_deposit_amount?: unknown;
  min_trx_amount?: unknown;
  max_trx_amount?: unknown;
  is_available?: unknown;
  is_deprecated?: unknown;
  rate_usd?: unknown;
}

// Cache for currency data
let currencyCache: {
  data: NOWPaymentsCurrency[] | null
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export interface NOWPaymentsCurrency {
  code: string
  name: string
  network: string
  is_available: boolean
  min_amount: number
  max_amount: number
  rate_usd?: number
}

export interface EstimateRequest {
  amount: number
  currency_from: string
  currency_to: string
}

export interface EstimateResponse {
  currency_from: string
  amount_from: number
  currency_to: string
  estimated_amount: number
  fiat_equivalent?: number
  min_amount?: number
  max_amount?: number
}

export interface CreatePaymentRequest {
  price_amount: number
  price_currency: string
  pay_currency: string
  ipn_callback_url?: string
  order_id?: string
  order_description?: string
  purchase_id?: string
  payout_address?: string
  payout_currency?: string
  payout_extra_id?: string
  fixed_rate?: boolean
}

export interface CreatePaymentResponse {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id?: string
  order_description?: string
  purchase_id?: string
  created_at: string
  updated_at: string
  outcome_amount?: number
  outcome_currency?: string
}

// Fetch available currencies from NOWPayments
export async function fetchAvailableCurrencies(): Promise<NOWPaymentsCurrency[]> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments API key not configured')
  }

  // Check cache first
  const now = Date.now()
  if (currencyCache.data && (now - currencyCache.timestamp) < CACHE_DURATION) {
    return currencyCache.data
  }

  try {
    // Helper to transform a variety of NOWPayments responses into our shape
    const normalize = (items: Array<Record<string, unknown>> | string[]): NOWPaymentsCurrency[] => {
      if (Array.isArray(items) && items.length > 0 && typeof items[0] === 'string') {
        // Simple list like ["btc","eth",...]
        return (items as string[]).map((ticker) => ({
          code: String(ticker).toUpperCase(),
          name: String(ticker).toUpperCase(),
          network: 'Unknown',
          is_available: true,
          min_amount: 0.00000001,
          max_amount: 1000000,
          rate_usd: 0
        }))
      }

      // Detailed objects
      return (items as Array<Record<string, unknown>>).map((currency) => {
        const codeValue =
          typeof currency.code === 'string'
            ? currency.code
            : typeof currency.ticker === 'string'
              ? currency.ticker
              : typeof currency.currency === 'string'
                ? currency.currency
                : ''

        // Try to infer network if provided in nested structure
        const network =
          typeof currency.network === 'string'
            ? currency.network
            : Array.isArray((currency as any).networks) && (currency as any).networks.length > 0
              ? String((currency as any).networks[0]?.network || (currency as any).networks[0])
              : 'Unknown'

        // NOWPayments may use other names for min/max; default safely
        const minAmtRaw = (currency as any).min_amount ?? (currency as any).min_deposit_amount ?? (currency as any).min_trx_amount
        const maxAmtRaw = (currency as any).max_amount ?? (currency as any).max_deposit_amount ?? (currency as any).max_trx_amount

        return {
          code: String(codeValue).toUpperCase(),
          name: String((currency as any).name ?? codeValue).trim() || String(codeValue).toUpperCase(),
          network: String(network),
          is_available: (currency as any).is_available !== false && (currency as any).is_deprecated !== true,
          min_amount: parseFloat(String(minAmtRaw)) || 0.00000001,
          max_amount: parseFloat(String(maxAmtRaw)) || 1000000,
          rate_usd: parseFloat(String((currency as any).rate_usd)) || 0
        }
      })
    }

    // Try the detailed coins endpoint first
    let endpointTried: string | null = null
    let lastError: Error

    const tryFetch = async (path: string) => {
      endpointTried = path
      const response = await fetch(`${NOWPAYMENTS_API_BASE}${path}`, {
        method: 'GET',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(12000)
      })
      return response
    }

    let response = await tryFetch('/coins')

    if (!response.ok) {
      // Fallback to /currencies (list of tickers)
      lastError = new Error(`Primary endpoint failed: ${response.status} ${response.statusText}`)
      response = await tryFetch('/currencies')
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`NOWPayments API error (${endpointTried}): ${response.status} ${response.statusText} ${text?.slice(0, 120)}`)
    }

    // Parse JSON safely (some outages return HTML)
    const text = await response.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      // If it looks like HTML, surface a clearer error
      if (/<!DOCTYPE html>|<html[\s>]/i.test(text)) {
        throw new Error('NOWPayments service issue: returned HTML instead of JSON')
      }
      throw new Error('Invalid JSON response from NOWPayments')
    }

    // Determine array payload
    let items: Array<Record<string, unknown>> | string[] | null = null
    if (Array.isArray(data)) items = data
    else if (Array.isArray(data?.coins)) items = data.coins
    else if (Array.isArray(data?.currencies)) items = data.currencies

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid response format from NOWPayments API')
    }

    const currencies = normalize(items)

    const filtered = currencies.filter(
      (currency) => currency.is_available && currency.code.length >= 2
    )

    // Update cache
    currencyCache = {
      data: filtered,
      timestamp: now
    }

    return filtered

  } catch (error) {
    console.error('Error fetching currencies from NOWPayments:', error)
    throw error
  }
}

// Get estimate for payment conversion
export async function getEstimate(request: EstimateRequest): Promise<EstimateResponse> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments API key not configured')
  }

  try {
    // Format currency codes for NOWPayments (lowercase)
    const currencyFrom = request.currency_from.toLowerCase()
    const currencyTo = request.currency_to.toLowerCase()

    const url = `${NOWPAYMENTS_API_BASE}/estimate?amount=${request.amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NOWPayments estimate error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    return {
      currency_from: data.currency_from,
      amount_from: parseFloat(data.amount_from),
      currency_to: data.currency_to,
      estimated_amount: parseFloat(data.estimated_amount),
      fiat_equivalent: data.fiat_equivalent ? parseFloat(data.fiat_equivalent) : undefined,
      min_amount: data.min_amount ? parseFloat(data.min_amount) : undefined,
      max_amount: data.max_amount ? parseFloat(data.max_amount) : undefined
    }

  } catch (error) {
    console.error('Error getting estimate from NOWPayments:', error)
    throw error
  }
}

// Create a payment
export async function createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments API key not configured')
  }

  try {
    // Format currency codes for NOWPayments (lowercase)
    const paymentData = {
      ...request,
      price_currency: request.price_currency.toLowerCase(),
      pay_currency: request.pay_currency.toLowerCase(),
      payout_currency: request.payout_currency?.toLowerCase()
    }

    const response = await fetch(`${NOWPAYMENTS_API_BASE}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData),
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NOWPayments payment creation error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    return {
      payment_id: data.payment_id,
      payment_status: data.payment_status,
      pay_address: data.pay_address,
      price_amount: parseFloat(data.price_amount),
      price_currency: data.price_currency,
      pay_amount: parseFloat(data.pay_amount),
      pay_currency: data.pay_currency,
      order_id: data.order_id,
      order_description: data.order_description,
      purchase_id: data.purchase_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      outcome_amount: data.outcome_amount ? parseFloat(data.outcome_amount) : undefined,
      outcome_currency: data.outcome_currency
    }

  } catch (error) {
    console.error('Error creating payment with NOWPayments:', error)
    throw error
  }
}

// Get payment status
export async function getPaymentStatus(paymentId: string) {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments API key not configured')
  }

  try {
    const response = await fetch(`${NOWPAYMENTS_API_BASE}/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NOWPayments status error: ${response.status} ${errorText}`)
    }

    return await response.json()

  } catch (error) {
    console.error('Error getting payment status from NOWPayments:', error)
    throw error
  }
}

// Get minimum payment amount
export async function getMinimumAmount(currencyFrom: string, currencyTo: string): Promise<number> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments API key not configured')
  }

  try {
    const from = currencyFrom.toLowerCase()
    const to = currencyTo.toLowerCase()
    
    const response = await fetch(`${NOWPAYMENTS_API_BASE}/min-amount?currency_from=${from}&currency_to=${to}`, {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NOWPayments min amount error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return parseFloat(data.min_amount) || 0.00000001

  } catch (error) {
    console.error('Error getting minimum amount from NOWPayments:', error)
    // Return a reasonable default if API fails
    return 0.00000001
  }
}

// Get NOWPayments client configuration
export function getNOWPaymentsClient() {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments API key not configured')
  }

  return {
    apiKey: NOWPAYMENTS_API_KEY,
    baseUrl: NOWPAYMENTS_API_BASE,
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    }
  }
}

// Utility function to format currency code for NOWPayments
export function formatCurrencyForNOWPayments(currencyCode: string): string {
  // NOWPayments expects lowercase currency codes
  return currencyCode.toLowerCase()
}

// Utility function to check if currency is supported
export async function isCurrencySupported(currencyCode: string): Promise<boolean> {
  try {
    const currencies = await fetchAvailableCurrencies()
    const formattedCode = formatCurrencyForNOWPayments(currencyCode)
    return currencies.some(currency => currency.code === formattedCode && currency.is_available)
  } catch (error) {
    console.error('Error checking currency support:', error)
    return false
  }
}

// Clear currency cache (useful for testing or manual refresh)
export function clearCurrencyCache(): void {
  currencyCache = {
    data: null,
    timestamp: 0
  }
}
