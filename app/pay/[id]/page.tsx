'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Loader2, Copy, Check, AlertCircle, CreditCard, Wallet, QrCode } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentLink {
  id: string
  link_id: string
  title: string
  description?: string
  amount: number
  currency: string
  status: string
  accepted_cryptos: string[]
  expires_at?: string
  max_uses?: number
  current_uses: number
  charge_customer_fee?: boolean | null
  merchant: {
    id: string
    business_name: string
    charge_customer_fee: boolean
  }
}

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  network: string
  decimals: number
  enabled: boolean
  trust_wallet_compatible: boolean
  display_name: string
  has_wallet: boolean
  wallet_address: string
  rate_usd: number
  available: boolean
  last_updated: string
  min_amount: number
  max_amount: number
}

interface PaymentEstimate {
  currency_from: string
  currency_to: string
  amount_from: number
  estimated_amount: number
  rate: number
  fee_amount?: number
  total_amount?: number
}

interface PaymentData {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  purchase_id: string
  outcome_amount?: number
  outcome_currency?: string
  created_at: string
  updated_at: string
  expiration_estimate_date?: string
}

// Minimum amounts for different cryptocurrencies (NOWPayments requirements)
const MINIMUM_AMOUNTS: { [key: string]: number } = {
  BTC: 0.0001,
  ETH: 0.001,
  SOL: 0.1,
  BNB: 0.01,
  XRP: 1,
  TRX: 10,
  TON: 0.1,
  AVAX: 0.01,
  DOGE: 10,
  SUI: 1,
  USDT_ERC20: 1,
  USDC_ERC20: 1,
  USDT_BEP20: 1,
  USDC_BEP20: 1,
  USDT_SOL: 1,
  USDC_SOL: 1,
  USDT_TRC20: 1,
  USDC_TRC20: 1,
  USDT_TON: 1,
  USDT_AVAX: 1,
  USDC_AVAX: 1,
  LTC: 0.001,
  ADA: 1,
  DOT: 0.1,
  MATIC: 1,
  LINK: 0.1,
  UNI: 0.1,
  ATOM: 0.1,
  FTM: 1,
  NEAR: 0.1,
  ALGO: 1
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([])
  const [estimates, setEstimates] = useState<{ [key: string]: PaymentEstimate }>({})
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [estimatesLoading, setEstimatesLoading] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load payment link data
  useEffect(() => {
    loadPaymentLink()
  }, [id])

  // Load available currencies when payment link is loaded
  useEffect(() => {
    if (paymentLink?.merchant?.id) {
      loadAvailableCurrencies()
    }
  }, [paymentLink])

  // Fetch estimates when currencies are loaded
  useEffect(() => {
    if (paymentLink && availableCurrencies.length > 0) {
      console.log('🔄 useEffect: Fetching estimates because both paymentLink and currencies are ready')
      fetchEstimates()
    }
  }, [paymentLink, availableCurrencies])

  const loadPaymentLink = async () => {
    try {
      console.log('🔍 Loading payment link for ID:', id)
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load payment link')
      }

      if (!data.success || !data.payment_link) {
        throw new Error('Payment link not found')
      }

      console.log('✅ Payment link loaded:', data.payment_link)
      setPaymentLink(data.payment_link)

    } catch (error) {
      console.error('❌ Error loading payment link:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payment link')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableCurrencies = async () => {
    if (!paymentLink?.merchant?.id) {
      console.log('❌ No merchant ID available for loading currencies')
      return
    }

    try {
      console.log('💰 Loading available currencies for merchant:', paymentLink.merchant.id)
      
      const response = await fetch(`/api/merchants/${paymentLink.merchant.id}/supported-currencies`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load currencies')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to load currencies')
      }

      // Filter currencies to only show those accepted by this payment link
      const acceptedCurrencies = data.currencies.filter((currency: Currency) =>
        paymentLink.accepted_cryptos.includes(currency.code)
      )

      console.log('💰 Available currencies:', acceptedCurrencies)
      setAvailableCurrencies(acceptedCurrencies)

    } catch (error) {
      console.error('❌ Error loading currencies:', error)
      setError('Failed to load available currencies')
    }
  }

  const fetchEstimates = async () => {
    if (!paymentLink || availableCurrencies.length === 0) {
      console.log('❌ Not fetching estimates because:')
      console.log('- Filtered currencies length:', availableCurrencies.length)
      console.log('- Payment link exists:', !!paymentLink)
      return
    }

    try {
      setEstimatesLoading(true)
      console.log('📊 Fetching estimates for currencies:', availableCurrencies.map(c => c.code))
      console.log('📊 Amount:', paymentLink.amount, 'From currency:', paymentLink.currency)

      const currencyCodes = availableCurrencies.map(c => c.code)
      
      const response = await fetch('/api/nowpayments/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentLink.amount,
          currency_from: paymentLink.currency.toLowerCase(),
          currencies_to: currencyCodes
        })
      })

      console.log('📊 Estimate API response status:', response.status)

      const data = await response.json()
      console.log('📊 Estimate API response data:', data)

      if (data.success && data.estimates) {
        console.log('✅ Estimates received:', data.estimates)
        
        // Convert estimates array to object for easier lookup
        const estimatesMap: { [key: string]: PaymentEstimate } = {}
        data.estimates.forEach((estimate: PaymentEstimate) => {
          estimatesMap[estimate.currency_to.toUpperCase()] = estimate
        })
        
        setEstimates(estimatesMap)
      } else {
        console.error('❌ Failed to get estimates:', data.error || 'Unknown error')
        setError('Failed to load conversion rates')
      }

    } catch (error) {
      console.error('❌ Error fetching estimates:', error)
      setError('Failed to load conversion rates')
    } finally {
      setEstimatesLoading(false)
    }
  }

  const createPayment = async () => {
    if (!selectedCurrency || !paymentLink) {
      toast.error('Please select a cryptocurrency')
      return
    }

    try {
      console.log('🔄 Creating payment for currency:', selectedCurrency)
      setCreatingPayment(true)

      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_link_id: paymentLink.id,
          currency_to: selectedCurrency,
          customer_email: customerEmail || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const data = await response.json()

      if (!data.success || !data.payment) {
        throw new Error(data.error || 'Failed to create payment')
      }

      console.log('✅ Payment created successfully:', data.payment)
      setPaymentData(data.payment)
      
      // Redirect to success page after a short delay
      setTimeout(() => {
        window.location.href = `/payment/success/${data.payment.payment_id}`
      }, 2000)

    } catch (error) {
      console.error('❌ Error creating payment:', error)
      setError('Failed to create payment')
      toast.error('Payment Error', {
        description: 'Failed to create payment. Please try again.'
      })
    } finally {
      setCreatingPayment(false)
    }
  }

  const formatAmount = (amount: any, decimals: number = 8): string => {
    // Convert to number if it's not already
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount)
    
    // Check if it's a valid number
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      console.warn('⚠️ Invalid amount for formatting:', amount)
      return '0'
    }
    
    return numAmount.toFixed(decimals).replace(/\.?0+$/, '')
  }

  const getRateForCurrency = (currency: string): number => {
    const estimate = getEstimateForCurrency(currency)
    if (!estimate) return 0
    
    const estimatedAmount = parseFloat(estimate.estimated_amount.toString())
    const amountFrom = estimate.amount_from
    
    // Rate = USD per 1 unit of crypto
    return amountFrom / estimatedAmount
  }

  const getEstimateForCurrency = (currency: string) => {
    return estimates[currency.toUpperCase()]
  }

  const isAmountTooSmall = (currency: string): boolean => {
    const estimate = getEstimateForCurrency(currency)
    if (!estimate) return false
    
    const estimatedAmount = parseFloat(estimate.estimated_amount.toString())
    const minimumRequired = MINIMUM_AMOUNTS[currency] || 0.000001
    
    return estimatedAmount < minimumRequired
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment link...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Link Not Found</h2>
              <p className="text-gray-600 mb-4">
                {error || 'The payment link you\'re looking for doesn\'t exist or has expired.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show payment success/processing screen
  if (paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Created Successfully!</CardTitle>
              <p className="text-gray-600">
                Send exactly <strong>{formatAmount(paymentData.pay_amount)} {paymentData.pay_currency}</strong> to the address below
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-700">Payment Address</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 bg-white p-2 rounded border text-sm font-mono break-all">
                    {paymentData.pay_address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.pay_address)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-700">Amount to Pay</label>
                  <p className="font-semibold">{formatAmount(paymentData.pay_amount)} {paymentData.pay_currency}</p>
                </div>
                <div>
                  <label className="text-gray-700">Payment ID</label>
                  <p className="font-mono text-xs">{paymentData.payment_id}</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please send the exact amount to the address above. The payment will be confirmed automatically.
                  You will be redirected to the confirmation page once the payment is detected.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Payment Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">{paymentLink.title}</h1>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                ${paymentLink.amount.toFixed(2)}
                <span className="text-lg text-gray-500 ml-2">{paymentLink.currency}</span>
              </div>
              <p className="text-gray-600">
                to <span className="font-medium">{paymentLink.merchant?.business_name || 'Merchant'}</span>
              </p>
              {paymentLink.description && (
                <p className="text-sm text-gray-500 mt-2">{paymentLink.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Currency Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Select Cryptocurrency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableCurrencies.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading available cryptocurrencies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCurrencies.map((currency) => {
                  const estimate = getEstimateForCurrency(currency.code)
                  const isLoading = estimatesLoading && !estimate
                  const tooSmall = estimate && isAmountTooSmall(currency.code)
                  const rate = getRateForCurrency(currency.code)

                  return (
                    <div
                      key={currency.code}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCurrency === currency.code
                          ? 'border-blue-500 bg-blue-50'
                          : tooSmall
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => !tooSmall && setSelectedCurrency(currency.code)}
                    >
                      {tooSmall && (
                        <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                          Amount too small
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold">{currency.symbol}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{currency.code}</h3>
                            <p className="text-sm text-gray-600">{currency.name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        {isLoading ? (
                          <p className="text-gray-500">Loading...</p>
                        ) : estimate ? (
                          <>
                            <p className="font-semibold">
                              {formatAmount(estimate.estimated_amount)} {currency.code}
                            </p>
                            <p className="text-gray-600">
                              Rate: ${formatAmount(rate, 2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-red-500">Failed to load</p>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">{currency.network}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {availableCurrencies.some(c => isAmountTooSmall(c.code)) && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Some cryptocurrencies are disabled because the payment amount is below the minimum required.
                  Try increasing the payment amount or choose a different cryptocurrency.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Customer Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="email">Email Address</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Receive payment confirmation and receipt via email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Payment Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={createPayment}
              disabled={!selectedCurrency || creatingPayment || isAmountTooSmall(selectedCurrency)}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {creatingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5 mr-2" />
                  Create Payment
                </>
              )}
            </Button>

            {selectedCurrency && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>${paymentLink.amount.toFixed(2)} {paymentLink.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You'll pay:</span>
                    <span>
                      {getEstimateForCurrency(selectedCurrency) 
                        ? `${formatAmount(getEstimateForCurrency(selectedCurrency)!.estimated_amount)} ${selectedCurrency}`
                        : 'Loading...'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span>{availableCurrencies.find(c => c.code === selectedCurrency)?.network}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

