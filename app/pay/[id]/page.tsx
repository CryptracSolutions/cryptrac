'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { 
  CreditCard,
  AlertCircle,
  RefreshCw,
  Copy,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  Loader2,
  Info,
  DollarSign,
  AlertTriangle,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react'
import QRCode from 'qrcode'

interface PaymentLink {
  id: string
  link_id: string
  title: string
  description: string
  amount: number
  currency: string
  status: string
  accepted_cryptos: string[]
  expires_at?: string
  max_uses?: number
  current_uses: number
  charge_customer_fee: boolean | null
  merchant: {
    id: string
    business_name: string
    charge_customer_fee: boolean
  }
}

interface PaymentDetails {
  id: string
  nowpayments_payment_id: string
  order_id: string
  status: string
  pay_currency: string
  pay_amount: number
  pay_address: string
  price_amount: number
  price_currency: string
  payout_currency: string
  payout_amount: number
  created_at: string
  updated_at: string
  expires_at: string
  qr_code_data?: string
  payment_url?: string
  is_fee_paid_by_user: boolean
  gateway_fee?: number
  network_fee?: number
  total_fee?: number
  actual_amount_to_pay?: number
  merchant_receives?: number
}

interface PaymentEstimate {
  currency_from: string
  currency_to: string
  amount_from: number
  estimated_amount: number
  rate?: number
  fee?: number
  total_fee?: number
  actual_amount_to_pay?: number
}

interface AvailableCurrency {
  code: string
  name: string
  symbol: string
  network?: string
  has_wallet: boolean
  wallet_address?: string
  rate_usd?: number
  min_amount: number
  decimals: number
  display_name?: string
}

// Enhanced: Payment status configurations with better UX
const PAYMENT_STATUS_CONFIG = {
  waiting: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    title: 'Waiting for Payment',
    description: 'Send the exact amount to the address below'
  },
  confirming: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: RefreshCw,
    title: 'Confirming Payment',
    description: 'Payment detected, waiting for network confirmation'
  },
  confirmed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    title: 'Payment Confirmed',
    description: 'Payment successfully received and confirmed'
  },
  failed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    title: 'Payment Failed',
    description: 'Payment was not successful'
  },
  expired: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertCircle,
    title: 'Payment Expired',
    description: 'Payment window has expired'
  }
}

// Minimum payment amounts for popular cryptocurrencies (in crypto units)
const MINIMUM_AMOUNTS: { [key: string]: number } = {
  BTC: 0.0001,
  ETH: 0.001,
  SOL: 0.1,
  BNB: 0.01,
  XRP: 1,
  ADA: 10,
  DOT: 0.1,
  USDT_ERC20: 1,
  USDC_ERC20: 1,
  USDT_BEP20: 1,
  USDC_BEP20: 1,
  USDT_SOL: 1,
  USDC_SOL: 1,
  USDT_TRC20: 1,
  USDC_TRC20: 1,
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  // Properly unwrap params using React.use() for Next.js 15
  const { id } = use(params)
  
  // State management
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<AvailableCurrency[]>([])
  const [estimates, setEstimates] = useState<PaymentEstimate[]>([])
  const [selectedCrypto, setSelectedCrypto] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // UI states
  const [addressCopied, setAddressCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Load payment link data
  useEffect(() => {
    if (id) {
      loadPaymentLink()
    }
  }, [id])

  const loadPaymentLink = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading payment link for ID:', id)

      const response = await fetch(`/api/payments/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment link not found')
        }
        throw new Error('Failed to load payment link')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to load payment link')
      }

      console.log('✅ Payment link loaded:', data.payment_link)
      setPaymentLink(data.payment_link)
      
      // Load available currencies for this merchant
      if (data.payment_link.merchant?.id) {
        await loadAvailableCurrencies(data.payment_link.merchant.id, data.payment_link.accepted_cryptos)
      }

    } catch (error) {
      console.error('Error loading payment link:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payment link')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableCurrencies = async (merchantId: string, acceptedCryptos: string[]) => {
    try {
      setLoadingCurrencies(true)
      
      // Get merchant's supported currencies (only those with wallet addresses)
      const response = await fetch(`/api/merchants/${merchantId}/supported-currencies`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Filter to only show currencies that are both accepted by the payment link AND have wallet addresses
          const filteredCurrencies = data.currencies.filter((currency: AvailableCurrency) => 
            acceptedCryptos.includes(currency.code) && currency.has_wallet
          )
          
          setAvailableCurrencies(filteredCurrencies)
          console.log('💰 Available currencies:', filteredCurrencies)
          
          // DEBUG: Always fetch estimates if we have currencies and payment link
          if (filteredCurrencies.length > 0 && paymentLink) {
            console.log('🔄 About to fetch estimates...')
            console.log('Payment link amount:', paymentLink.amount)
            console.log('Payment link currency:', paymentLink.currency)
            console.log('Currencies to estimate:', filteredCurrencies.map((c: AvailableCurrency) => c.code))
            
            await fetchEstimates(
              paymentLink.amount, 
              paymentLink.currency, 
              filteredCurrencies.map((c: AvailableCurrency) => c.code)
            )
          } else {
            console.log('❌ Not fetching estimates because:')
            console.log('- Filtered currencies length:', filteredCurrencies.length)
            console.log('- Payment link exists:', !!paymentLink)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load available currencies:', error)
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const fetchEstimates = async (amount: number, fromCurrency: string, toCurrencies: string[]) => {
    try {
      console.log('📊 Fetching estimates for currencies:', toCurrencies)
      console.log('📊 Amount:', amount, 'From currency:', fromCurrency)
      
      const response = await fetch('/api/nowpayments/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency_from: fromCurrency.toLowerCase(),
          currencies_to: toCurrencies.map((c: string) => c.toLowerCase())
        })
      })

      console.log('📊 Estimate API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Estimate API response data:', data)
        if (data.success) {
          console.log('✅ Estimates received:', data.estimates)
          setEstimates(data.estimates)
        } else {
          console.error('❌ Estimate API returned error:', data.message)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Estimate API failed:', response.status, errorText)
      }
    } catch (error) {
      console.error('❌ Error fetching estimates:', error)
    }
  }

  // Fix: Fetch estimates when both paymentLink and availableCurrencies are ready
  useEffect(() => {
    if (paymentLink && availableCurrencies.length > 0 && estimates.length === 0) {
      console.log('🔄 useEffect: Fetching estimates because both paymentLink and currencies are ready')
      fetchEstimates(
        paymentLink.amount,
        paymentLink.currency,
        availableCurrencies.map((c: AvailableCurrency) => c.code)
      )
    }
  }, [paymentLink, availableCurrencies])

  const createPayment = async (crypto: string) => {
    if (!paymentLink) return

    try {
      setCreating(true)
      setError(null)

      // Check minimum amount before creating payment
      const estimate = getEstimateForCurrency(crypto)
      if (estimate) {
        const minAmount = MINIMUM_AMOUNTS[crypto] || 0
        const estimatedAmount = parseFloat(estimate.estimated_amount.toString())
        
        if (estimatedAmount < minAmount) {
          throw new Error(`Payment amount too small. Minimum ${minAmount} ${crypto} required (you would receive ${formatAmount(estimatedAmount)} ${crypto})`)
        }
      }

      console.log('🔄 Creating payment for currency:', crypto)

      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_link_id: paymentLink.id,
          pay_currency: crypto,
          customer_email: customerEmail || undefined,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create payment')
      }

      const data = await response.json()
      console.log('✅ Payment created:', data.payment)
      setPaymentDetails(data.payment)

      // Generate QR code
      if (data.payment.qr_code_data) {
        const qrUrl = await QRCode.toDataURL(data.payment.qr_code_data, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrUrl)
      }

      // Start polling for payment status
      startPaymentPolling(data.payment.nowpayments_payment_id)

    } catch (error) {
      console.error('Error creating payment:', error)
      setError(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setCreating(false)
    }
  }

  const startPaymentPolling = (paymentId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // Poll every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${id}/status`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.payment) {
            setPaymentDetails(data.payment)
            
            // Stop polling if payment is complete
            if (['confirmed', 'failed', 'expired'].includes(data.payment.status)) {
              clearInterval(interval)
              setPollingInterval(null)
              
              // Redirect to success page if confirmed
              if (data.payment.status === 'confirmed') {
                window.location.href = `/payment/success/${data.payment.id}`
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }, 10000)

    setPollingInterval(interval)
  }

  const copyAddress = async () => {
    if (!paymentDetails?.pay_address) return

    try {
      await navigator.clipboard.writeText(paymentDetails.pay_address)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  // Safe number formatting function
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

  const getEstimateForCurrency = (currency: string) => {
    return estimates.find((est: PaymentEstimate) => est.currency_to.toUpperCase() === currency.toUpperCase())
  }

  // Fixed: Calculate rate properly from estimate data
  const getRateForCurrency = (currency: string): number => {
    const estimate = getEstimateForCurrency(currency)
    if (!estimate) return 0
    
    const estimatedAmount = parseFloat(estimate.estimated_amount.toString())
    const amountFrom = estimate.amount_from
    
    if (amountFrom === 0) return 0
    
    // Rate = USD per 1 unit of crypto
    return amountFrom / estimatedAmount
  }

  // Check if amount is too small for a currency
  const isAmountTooSmall = (currency: string): boolean => {
    const estimate = getEstimateForCurrency(currency)
    if (!estimate) return false
    
    const minAmount = MINIMUM_AMOUNTS[currency] || 0
    const estimatedAmount = parseFloat(estimate.estimated_amount.toString())
    
    return estimatedAmount < minAmount
  }

  const shouldShowFeeInfo = () => {
    // Show fee info if customer pays fee (either from link override or merchant global)
    return paymentLink?.charge_customer_fee ?? paymentLink?.merchant?.charge_customer_fee ?? false
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#7f5efd]" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h2>
            <p className="text-gray-600">This payment link does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if payment link is expired
  const isExpired = paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()
  
  // Check if payment link has reached max uses
  const isMaxUsesReached = paymentLink.max_uses && paymentLink.current_uses >= paymentLink.max_uses

  if (isExpired || isMaxUsesReached) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isExpired ? 'Payment Link Expired' : 'Payment Link Unavailable'}
            </h2>
            <p className="text-gray-600">
              {isExpired 
                ? 'This payment link has expired and is no longer accepting payments.'
                : 'This payment link has reached its maximum number of uses.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Payment Link Header */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Wallet className="w-8 h-8 text-[#7f5efd]" />
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {paymentLink.title}
                </CardTitle>
              </div>
              {paymentLink.description && (
                <p className="text-gray-600">{paymentLink.description}</p>
              )}
              <div className="flex items-center justify-center space-x-4 mt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#7f5efd]">
                    ${paymentLink.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">{paymentLink.currency.toUpperCase()}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">to</div>
                  <div className="font-semibold text-gray-900">{paymentLink.merchant.business_name}</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Payment Details or Currency Selection */}
          {paymentDetails ? (
            <PaymentDetailsCard 
              paymentDetails={paymentDetails}
              paymentLink={paymentLink}
              qrCodeUrl={qrCodeUrl}
              showQR={showQR}
              setShowQR={setShowQR}
              addressCopied={addressCopied}
              copyAddress={copyAddress}
              formatAmount={formatAmount}
            />
          ) : (
            <CurrencySelectionCard
              availableCurrencies={availableCurrencies}
              loadingCurrencies={loadingCurrencies}
              selectedCrypto={selectedCrypto}
              setSelectedCrypto={setSelectedCrypto}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
              estimates={estimates}
              getEstimateForCurrency={getEstimateForCurrency}
              getRateForCurrency={getRateForCurrency}
              isAmountTooSmall={isAmountTooSmall}
              shouldShowFeeInfo={shouldShowFeeInfo}
              creating={creating}
              createPayment={createPayment}
              formatAmount={formatAmount}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Payment Details Component
function PaymentDetailsCard({ 
  paymentDetails, 
  paymentLink, 
  qrCodeUrl, 
  showQR, 
  setShowQR, 
  addressCopied, 
  copyAddress, 
  formatAmount 
}: {
  paymentDetails: PaymentDetails
  paymentLink: PaymentLink
  qrCodeUrl: string
  showQR: boolean
  setShowQR: (show: boolean) => void
  addressCopied: boolean
  copyAddress: () => void
  formatAmount: (amount: any, decimals?: number) => string
}) {
  const statusConfig = PAYMENT_STATUS_CONFIG[paymentDetails.status as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.waiting
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Payment Status */}
      <Card>
        <CardContent className="p-6">
          <div className={`flex items-center space-x-3 p-4 rounded-lg border ${statusConfig.color}`}>
            <StatusIcon className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">{statusConfig.title}</h3>
              <p className="text-sm">{statusConfig.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount to Pay */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount to Pay:</span>
              <span className="text-xl font-bold text-gray-900">
                {formatAmount(paymentDetails.pay_amount)} {paymentDetails.pay_currency}
              </span>
            </div>
          </div>

          {/* Payment Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send to Address:
            </label>
            <div className="flex items-center space-x-2">
              <Input
                value={paymentDetails.pay_address}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={copyAddress}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                {addressCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              className="mb-4"
            >
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Button>
            
            {showQR && qrCodeUrl && (
              <div className="inline-block p-4 bg-white rounded-lg border">
                <Image
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  width={256}
                  height={256}
                  className="mx-auto"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Scan with your crypto wallet
                </p>
              </div>
            )}
          </div>

          {/* Fee Information */}
          {paymentDetails.is_fee_paid_by_user && paymentDetails.gateway_fee && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Gateway fee of ${paymentDetails.gateway_fee.toFixed(2)} is included in the amount above.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Expires */}
          {paymentDetails.expires_at && (
            <div className="text-center text-sm text-gray-500">
              Payment expires: {new Date(paymentDetails.expires_at).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Currency Selection Component
function CurrencySelectionCard({
  availableCurrencies,
  loadingCurrencies,
  selectedCrypto,
  setSelectedCrypto,
  customerEmail,
  setCustomerEmail,
  estimates,
  getEstimateForCurrency,
  getRateForCurrency,
  isAmountTooSmall,
  shouldShowFeeInfo,
  creating,
  createPayment,
  formatAmount
}: {
  availableCurrencies: AvailableCurrency[]
  loadingCurrencies: boolean
  selectedCrypto: string
  setSelectedCrypto: (crypto: string) => void
  customerEmail: string
  setCustomerEmail: (email: string) => void
  estimates: PaymentEstimate[]
  getEstimateForCurrency: (currency: string) => PaymentEstimate | undefined
  getRateForCurrency: (currency: string) => number
  isAmountTooSmall: (currency: string) => boolean
  shouldShowFeeInfo: () => boolean
  creating: boolean
  createPayment: (crypto: string) => void
  formatAmount: (amount: any, decimals?: number) => string
}) {
  if (loadingCurrencies) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#7f5efd]" />
          <p className="text-gray-600">Loading available cryptocurrencies...</p>
        </CardContent>
      </Card>
    )
  }

  if (availableCurrencies.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Payment Methods Available</h2>
          <p className="text-gray-600">
            The merchant hasn't configured any cryptocurrency wallet addresses yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Select Cryptocurrency</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableCurrencies.map((currency) => {
              const estimate = getEstimateForCurrency(currency.code)
              const rate = getRateForCurrency(currency.code)
              const tooSmall = isAmountTooSmall(currency.code)
              
              return (
                <div
                  key={currency.code}
                  onClick={() => !tooSmall && setSelectedCrypto(currency.code)}
                  className={`p-4 border rounded-lg transition-all ${
                    tooSmall 
                      ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                      : selectedCrypto === currency.code
                        ? 'border-[#7f5efd] bg-[#7f5efd]/5 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{currency.code}</h3>
                      <p className="text-sm text-gray-600">{currency.name}</p>
                      {currency.network && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {currency.network}
                        </Badge>
                      )}
                      {tooSmall && (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          Amount too small
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      {estimate ? (
                        <>
                          <div className={`font-semibold ${tooSmall ? 'text-red-600' : ''}`}>
                            {formatAmount(estimate.estimated_amount)} {currency.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            Rate: ${formatAmount(rate, 2)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">Loading...</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Minimum Amount Warning */}
      {selectedCrypto && isAmountTooSmall(selectedCrypto) && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            The payment amount is too small for {selectedCrypto}. Minimum amount required: {MINIMUM_AMOUNTS[selectedCrypto]} {selectedCrypto}
          </AlertDescription>
        </Alert>
      )}

      {/* Customer Email (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Email Receipt (Optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="email"
            placeholder="Enter your email for payment receipt"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Fee Information */}
      {shouldShowFeeInfo() && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Gateway fees will be added to your payment amount.
          </AlertDescription>
        </Alert>
      )}

      {/* Create Payment Button */}
      <Card>
        <CardContent className="p-6">
          <Button
            onClick={() => createPayment(selectedCrypto)}
            disabled={!selectedCrypto || creating || isAmountTooSmall(selectedCrypto)}
            className="w-full bg-[#7f5efd] hover:bg-[#6d4fd2] text-white"
            size="lg"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Create Payment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

