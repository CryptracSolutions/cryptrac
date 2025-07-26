'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
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
  Info
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
  merchant: {
    business_name: string
  }
}

interface PaymentDetails {
  id: string
  nowpayments_payment_id: string
  order_id: string
  status: string
  pay_address: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  qr_code_data: string
  payment_url?: string
  expires_at: string
  fees: {
    cryptrac_fee: number
    gateway_fee: number
    total_fees: number
    merchant_receives: number
  }
}

interface CurrencyEstimate {
  currency_to: string
  estimated_amount: string
  estimated_amount_formatted: string
  success: boolean
}

// Enhanced: Payment status configurations with better UX
const PAYMENT_STATUS_CONFIG = {
  waiting: {
    label: 'Waiting for Payment',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Send the exact amount to complete your payment',
    showInstructions: true
  },
  confirming: {
    label: 'Confirming Payment',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Loader2,
    description: 'Payment received! Waiting for blockchain confirmation...',
    showInstructions: false
  },
  confirmed: {
    label: 'Payment Confirmed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Payment confirmed and processing',
    showInstructions: false
  },
  finished: {
    label: 'Payment Complete',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Payment successfully completed!',
    showInstructions: false
  },
  partially_paid: {
    label: 'Partially Paid',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
    description: 'Partial payment received. Please send the remaining amount.',
    showInstructions: true
  },
  failed: {
    label: 'Payment Failed',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Payment failed. Please try again.',
    showInstructions: false
  },
  expired: {
    label: 'Payment Expired',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    description: 'Payment window has expired',
    showInstructions: false
  }
} as const

export default function CustomerPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const { id } = use(params)
  
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [estimates, setEstimates] = useState<CurrencyEstimate[]>([])
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string>('')
  // Enhanced: Add polling state
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    const fetchPaymentLink = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch payment link from public API
        const response = await fetch(`/api/payments/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Payment link not found')
          }
          throw new Error('Failed to load payment information')
        }

        const data = await response.json()
        setPaymentLink(data.payment_link)

        // Fetch currency estimates for accepted cryptos
        if (data.payment_link.accepted_cryptos?.length > 0) {
          await fetchEstimates(data.payment_link.amount, data.payment_link.currency, data.payment_link.accepted_cryptos)
        }

      } catch (error) {
        console.error('Error fetching payment link:', error)
        setError(error instanceof Error ? error.message : 'Failed to load payment information')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentLink()
  }, [id])

  const fetchEstimates = async (amount: number, fromCurrency: string, toCurrencies: string[]) => {
    try {
      const response = await fetch('/api/nowpayments/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency_from: fromCurrency,
          currencies_to: toCurrencies
        })
      })

      if (response.ok) {
        const data = await response.json()
        setEstimates(data.estimates || [])
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

  // Enhanced: Better polling with visual feedback
  const startPaymentPolling = (paymentId: string) => {
    setIsPolling(true)
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/nowpayments/create-payment?payment_id=${paymentId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.payment.payment_status !== paymentDetails?.status) {
            setPaymentDetails(prev => prev ? { ...prev, status: data.payment.payment_status } : null)
            
            // Stop polling if payment is complete or failed
            if (['finished', 'confirmed', 'failed', 'expired', 'refunded'].includes(data.payment.payment_status)) {
              clearInterval(pollInterval)
              setIsPolling(false)
            }
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }, 5000) // Enhanced: Faster polling - every 5 seconds

    // Stop polling after 1 hour
    setTimeout(() => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }, 60 * 60 * 1000)
  }

  // Enhanced: Better copy feedback
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const formatCrypto = (amount: number, currency: string) => {
    return `${amount.toFixed(8)} ${currency.toUpperCase()}`
  }

  // Enhanced: Use status config for consistent styling
  const getStatusConfig = (status: string) => {
    return PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.waiting
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Not Found</h1>
            <p className="text-gray-600 mb-4">
              {error || 'This payment link is invalid or has expired.'}
            </p>
            <p className="text-sm text-gray-500">
              Please contact the merchant for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If payment is created, show payment details
  if (paymentDetails) {
    const statusConfig = getStatusConfig(paymentDetails.status)
    const StatusIcon = statusConfig.icon

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{paymentLink.title}</h1>
            <p className="text-gray-600">from {paymentLink.merchant.business_name}</p>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(paymentLink.amount, paymentLink.currency)}
              </div>
            </div>
          </div>

          {/* Enhanced: Better status display */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${statusConfig.color}`}>
                  <StatusIcon className={`h-4 w-4 ${paymentDetails.status === 'confirming' ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{statusConfig.label}</span>
                </div>
                <p className="text-gray-600 mt-3">{statusConfig.description}</p>
                
                {/* Enhanced: Show polling indicator */}
                {isPolling && (
                  <div className="flex items-center justify-center space-x-2 mt-2 text-sm text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Checking for updates...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced: Show payment instructions only when needed */}
          {statusConfig.showInstructions && (
            <>
              {/* QR Code */}
              {qrCodeUrl && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <QrCode className="h-5 w-5" />
                      <span>Scan to Pay</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Image 
                      src={qrCodeUrl} 
                      alt="Payment QR Code" 
                      width={256}
                      height={256}
                      className="mx-auto mb-4 border rounded-lg"
                    />
                    <p className="text-sm text-gray-600">
                      Scan with your {paymentDetails.pay_currency.toUpperCase()} wallet
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Payment Details */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send {paymentDetails.pay_currency.toUpperCase()} to this address:
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        value={paymentDetails.pay_address}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paymentDetails.pay_address, 'address')}
                        className="shrink-0"
                      >
                        {copied === 'address' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Payment Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exact amount to send:
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        value={formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paymentDetails.pay_amount.toString(), 'amount')}
                        className="shrink-0"
                      >
                        {copied === 'amount' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced: Special handling for partial payments */}
                  {paymentDetails.status === 'partially_paid' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-900">Partial Payment Received</h4>
                          <p className="text-sm text-orange-800 mt-1">
                            We received part of your payment. Please send the remaining amount to the same address above to complete your payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Payment Instructions</h4>
                        <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
                          <li>Copy the address above or scan the QR code</li>
                          <li>Send exactly {formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)}</li>
                          <li>Wait for blockchain confirmation</li>
                          <li>Payment status will update automatically</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Important</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                          Only send {paymentDetails.pay_currency.toUpperCase()} to this address. 
                          Sending other cryptocurrencies may result in permanent loss.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Enhanced: Success message for completed payments */}
          {['confirmed', 'finished'].includes(paymentDetails.status) && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
                  <p className="text-green-700 mb-4">
                    Your payment of {formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)} has been confirmed.
                  </p>
                  <div className="bg-white border border-green-200 rounded-lg p-4 text-left">
                    <h3 className="font-semibold text-green-900 mb-2">Transaction Details</h3>
                    <div className="space-y-1 text-sm text-green-800">
                      <p><strong>Amount:</strong> {formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)}</p>
                      <p><strong>Payment ID:</strong> {paymentDetails.nowpayments_payment_id}</p>
                      <p><strong>Status:</strong> {statusConfig.label}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    )
  }

  // Show currency selection
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{paymentLink.title}</h1>
          <p className="text-gray-600">from {paymentLink.merchant.business_name}</p>
          {paymentLink.description && (
            <p className="text-gray-500 mt-2">{paymentLink.description}</p>
          )}
          <div className="mt-4">
            <div className="text-4xl font-bold text-gray-900">
              {formatCurrency(paymentLink.amount, paymentLink.currency)}
            </div>
          </div>
        </div>

        {/* Customer Email */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Contact Information (Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Optional: Receive payment confirmation and receipt
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cryptocurrency Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Cryptocurrency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {estimates.map((estimate) => (
                <div
                  key={estimate.currency_to}
                  className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                  onClick={() => createPayment(estimate.currency_to)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-6 w-6 text-gray-400" />
                      <div>
                        <div className="font-semibold text-lg">
                          {estimate.currency_to.toUpperCase()}
                        </div>
                        <div className="text-gray-600">
                          {formatCrypto(parseFloat(estimate.estimated_amount_formatted), estimate.currency_to)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600 font-medium">
                        Select to pay
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {creating && (
              <div className="mt-6 text-center">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Creating payment...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Powered by Cryptrac • Secure cryptocurrency payments</p>
        </div>
      </div>
    </div>
  )
}

