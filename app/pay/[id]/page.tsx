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
  AlertTriangle
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
  payout_address: string
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
}

interface PaymentEstimate {
  currency_from: string
  currency_to: string
  amount_from: number
  estimated_amount: number
  rate: number
  fee: number
  total_fee: number
  actual_amount_to_pay: number
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
          
          // Fetch estimates for available currencies
          if (filteredCurrencies.length > 0 && paymentLink) {
            await fetchEstimates(
              paymentLink.amount, 
              paymentLink.currency, 
              filteredCurrencies.map((c: AvailableCurrency) => c.code)
            )
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

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEstimates(data.estimates)
        }
      }
    } catch (error) {
      console.error('Error fetching estimates:', error)
    }
  }

  const createPayment = async (crypto: string) => {
    if (!paymentLink) return

    try {
      setCreating(true)
      setError(null)

      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_link_id: paymentLink.id,
          pay_currency: crypto,
          customer_email: customerEmail || undefined,
          success_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancelled`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create payment')
      }

      const data = await response.json()
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

  const formatAmount = (amount: number, decimals: number = 8) => {
    return amount.toFixed(decimals).replace(/\.?0+$/, '')
  }

  const getEstimateForCurrency = (currency: string) => {
    return estimates.find((est: PaymentEstimate) => est.currency_to.toUpperCase() === currency.toUpperCase())
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
              <p className="text-gray-600">{paymentLink.description}</p>
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

          {/* Temporary message while API endpoints are being created */}
          <Card>
            <CardContent className="p-6 text-center">
              <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment System Loading</h2>
              <p className="text-gray-600 mb-4">
                Payment link loaded successfully! The payment processing system is being set up.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Payment ID:</strong> {paymentLink.link_id}</p>
                <p><strong>Amount:</strong> ${paymentLink.amount} {paymentLink.currency}</p>
                <p><strong>Accepted Currencies:</strong> {paymentLink.accepted_cryptos.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

