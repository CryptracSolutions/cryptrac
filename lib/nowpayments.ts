// NOWPayments API integration
const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1'

export interface NOWPaymentsEstimate {
  currency_from: string
  amount_from: number
  currency_to: string
  estimated_amount: string
}

export interface NOWPaymentsPayment {
  payment_id: string
  payment_status: string
  pay_address: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  payout_address?: string
  payout_currency?: string
  payout_extra_id?: string
  order_id: string
  order_description?: string
  created_at: string
  updated_at: string
  outcome_amount?: number
  outcome_currency?: string
  // Additional fields that might be present in responses
  actually_paid?: number
  outcome?: string
  network?: string
  network_fee?: number
  txn_id?: string
  burning_percent?: number
  expiration_estimate_date?: string
}

export interface CreatePaymentRequest {
  price_amount: number
  price_currency: string
  pay_currency: string
  payout_address?: string
  payout_currency?: string
  payout_extra_id?: string
  order_id: string
  order_description?: string
  success_url?: string
  cancel_url?: string
  is_fee_paid_by_user?: boolean
}

// Currency code formatting for NOWPayments compatibility
function formatCurrencyForNOWPayments(currency: string): string {
  // NOWPayments expects lowercase alphanumeric only (no underscores)
  return currency.toLowerCase().replace(/_/g, '')
}

// Get payment estimate from NOWPayments
export async function getPaymentEstimate(
  amount: number,
  currencyFrom: string,
  currencyTo: string
): Promise<NOWPaymentsEstimate> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('NOWPayments API key not configured')
  }

  // Format currencies for NOWPayments
  const formattedFrom = formatCurrencyForNOWPayments(currencyFrom)
  const formattedTo = formatCurrencyForNOWPayments(currencyTo)

  console.log('💰 Getting estimate:', amount, formattedFrom, '->', formattedTo)

  const url = `${NOWPAYMENTS_API_BASE}/estimate?amount=${amount}&currency_from=${formattedFrom}&currency_to=${formattedTo}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    console.log('📊 NOWPayments estimate response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ NOWPayments estimate error:', response.status, errorText)
      
      // Handle specific error cases
      if (response.status === 400) {
        throw new Error(`Invalid currency pair: ${formattedFrom} -> ${formattedTo}`)
      } else if (response.status === 404) {
        throw new Error(`Currency not supported: ${formattedTo}`)
      } else {
        throw new Error(`NOWPayments estimate error: ${response.status} - ${errorText}`)
      }
    }

    const estimate = await response.json()
    console.log('✅ Estimate received for', formattedTo + ':', estimate)

    return {
      currency_from: currencyFrom, // Return original format for display
      amount_from: amount,
      currency_to: currencyTo, // Return original format for display
      estimated_amount: estimate.estimated_amount,
    }
  } catch (error) {
    console.error('❌ Error in getPaymentEstimate:', error)
    throw error
  }
}

// Create payment with NOWPayments
export async function createPayment(paymentData: CreatePaymentRequest): Promise<NOWPaymentsPayment> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('NOWPayments API key not configured')
  }

  // Format currencies for NOWPayments
  const formattedPaymentData = {
    ...paymentData,
    pay_currency: formatCurrencyForNOWPayments(paymentData.pay_currency),
    price_currency: formatCurrencyForNOWPayments(paymentData.price_currency),
    payout_currency: paymentData.payout_currency ? formatCurrencyForNOWPayments(paymentData.payout_currency) : undefined
  }

  console.log('🔄 Creating NOWPayments payment:', formattedPaymentData)

  // Use the correct NOWPayments payment creation endpoint
  const url = `${NOWPAYMENTS_API_BASE}/payment`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedPaymentData),
    })

    console.log('📊 NOWPayments payment response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('❌ NOWPayments payment creation error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        request_data: formattedPaymentData
      })
      
      // Handle specific error cases
      if (response.status === 400) {
        const errorMessage = errorData.message || 'Invalid payment parameters'
        throw new Error(`Payment validation error: ${errorMessage}`)
      } else if (response.status === 422) {
        throw new Error(`Payment amount too small or invalid currency`)
      } else {
        throw new Error(`NOWPayments payment error: ${response.status} - ${errorData.message || response.statusText}`)
      }
    }

    const payment = await response.json()
    console.log('✅ NOWPayments payment created:', {
      payment_id: payment.payment_id,
      pay_address: payment.pay_address,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency
    })

    return payment
  } catch (error) {
    console.error('❌ Error in createPayment:', error)
    throw error
  }
}

// Get payment status from NOWPayments
export async function getPaymentStatus(paymentId: string): Promise<NOWPaymentsPayment> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('NOWPayments API key not configured')
  }

  const url = `${NOWPAYMENTS_API_BASE}/payment/${paymentId}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NOWPayments status error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('❌ Error in getPaymentStatus:', error)
    throw error
  }
}

// Generate unique order ID
export function generateOrderId(merchantId: string, paymentLinkId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `cryptrac_${merchantId.substring(0, 8)}_${timestamp}_${random}`
}

// Calculate fees based on settings
export function calculateFees(
  baseAmount: number,
  hasConversion: boolean = false,
  chargeCustomerFee: boolean = false
): {
  gatewayFee: number
  networkFee: number
  totalFee: number
  customerPays: number
  merchantReceives: number
} {
  // NOWPayments fees:
  // - 0.5% for direct payments
  // - 1% for payments with conversion
  const gatewayFeeRate = hasConversion ? 0.01 : 0.005
  const gatewayFee = baseAmount * gatewayFeeRate
  
  // Network fees are typically small and handled by NOWPayments
  const networkFee = 0
  
  const totalFee = gatewayFee + networkFee
  
  if (chargeCustomerFee) {
    // Customer pays the fee
    return {
      gatewayFee,
      networkFee,
      totalFee,
      customerPays: baseAmount + totalFee,
      merchantReceives: baseAmount
    }
  } else {
    // Merchant absorbs the fee
    return {
      gatewayFee,
      networkFee,
      totalFee,
      customerPays: baseAmount,
      merchantReceives: baseAmount - totalFee
    }
  }
}

// Get available currencies from NOWPayments
export async function getAvailableCurrencies(): Promise<string[]> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('NOWPayments API key not configured')
  }

  const url = `${NOWPAYMENTS_API_BASE}/currencies`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NOWPayments currencies error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.currencies || []
  } catch (error) {
    console.error('❌ Error in getAvailableCurrencies:', error)
    throw error
  }
}

// Validate NOWPayments API key
export async function validateApiKey(): Promise<boolean> {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY
    if (!apiKey) {
      return false
    }

    const url = `${NOWPAYMENTS_API_BASE}/status`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    return response.ok
  } catch (error) {
    console.error('Error validating NOWPayments API key:', error)
    return false
  }
}

// Get minimum payment amounts for currencies
export async function getMinimumAmounts(): Promise<{ [currency: string]: number }> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('NOWPayments API key not configured')
  }

  try {
    const url = `${NOWPAYMENTS_API_BASE}/min-amount`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('Could not fetch minimum amounts from NOWPayments')
      return {}
    }

    const data = await response.json()
    return data || {}
  } catch (error) {
    console.warn('Error fetching minimum amounts:', error)
    return {}
  }
}

// Check if currency pair is supported
export async function isCurrencyPairSupported(from: string, to: string): Promise<boolean> {
  try {
    // Try to get a small estimate to check if the pair is supported
    await getPaymentEstimate(1, from, to)
    return true
  } catch (error) {
    console.warn(`Currency pair ${from} -> ${to} not supported:`, error)
    return false
  }
}

// Get exchange rate between two currencies
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  try {
    const estimate = await getPaymentEstimate(1, from, to)
    return parseFloat(estimate.estimated_amount)
  } catch (error) {
    console.warn(`Could not get exchange rate for ${from} -> ${to}:`, error)
    return null
  }
}

