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

  console.log('💰 Getting estimate:', amount, currencyFrom, '->', currencyTo)

  const url = `${NOWPAYMENTS_API_BASE}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`
  
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
    throw new Error(`NOWPayments estimate error: ${response.status} - ${errorText}`)
  }

  const estimate = await response.json()
  console.log('✅ Estimate received for', currencyTo + ':', estimate)

  return {
    currency_from: currencyFrom,
    amount_from: amount,
    currency_to: currencyTo,
    estimated_amount: estimate.estimated_amount,
  }
}

// Create payment with NOWPayments
export async function createPayment(paymentData: CreatePaymentRequest): Promise<NOWPaymentsPayment> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('NOWPayments API key not configured')
  }

  console.log('🔄 Creating NOWPayments payment:', paymentData)

  // Use the correct NOWPayments payment creation endpoint
  const url = `${NOWPAYMENTS_API_BASE}/payment`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  })

  console.log('📊 NOWPayments payment response status:', response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    console.error('❌ NOWPayments payment creation error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    })
    throw new Error(`NOWPayments payment error: ${response.status} - ${errorData.message || response.statusText}`)
  }

  const payment = await response.json()
  console.log('✅ NOWPayments payment created:', {
    payment_id: payment.payment_id,
    pay_address: payment.pay_address,
    pay_amount: payment.pay_amount,
    pay_currency: payment.pay_currency
  })

  return payment
}

// Get payment status from NOWPayments
export async function getPaymentStatus(paymentId: string): Promise<NOWPaymentsPayment> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('NOWPayments API key not configured')
  }

  const url = `${NOWPAYMENTS_API_BASE}/payment/${paymentId}`
  
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

