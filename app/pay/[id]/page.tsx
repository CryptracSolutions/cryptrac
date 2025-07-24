'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { 
  CreditCard,
  Shield,
  AlertCircle,
  RefreshCw,
  Copy,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  Wallet
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

  const startPaymentPolling = (paymentId: string) => {
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
            }
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }, 10000) // Poll every 10 seconds

    // Stop polling after 1 hour
    setTimeout(() => clearInterval(pollInterval), 60 * 60 * 1000)
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'confirming': return 'bg-blue-100 text-blue-800'
      case 'confirmed': 
      case 'finished': return 'bg-green-100 text-green-800'
      case 'failed':
      case 'expired':
      case 'refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4" />
      case 'confirming': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'confirmed':
      case 'finished': return <CheckCircle className="h-4 w-4" />
      case 'failed':
      case 'expired':
      case 'refunded': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
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
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Wallet className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
            <p className="text-gray-600">Send {paymentDetails.pay_currency} to the address below</p>
          </div>

          {/* Payment Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payment Status</span>
                <Badge className={getStatusColor(paymentDetails.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(paymentDetails.status)}
                    <span className="capitalize">{paymentDetails.status}</span>
                  </div>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount to Pay</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ≈ {formatCurrency(paymentDetails.price_amount, paymentDetails.price_currency)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Address</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                      {paymentDetails.pay_address}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentDetails.pay_address, 'address')}
                    >
                      {copied === 'address' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Exact Amount</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                      {paymentDetails.pay_amount}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentDetails.pay_amount.toString(), 'amount')}
                    >
                      {copied === 'amount' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Send exactly this amount to ensure proper processing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  Scan this QR code with your {paymentDetails.pay_currency} wallet
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Copy the payment address above or scan the QR code</li>
                <li>Send exactly {formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)} from your wallet</li>
                <li>Wait for blockchain confirmation (usually 1-6 confirmations)</li>
                <li>You&apos;ll see the status update automatically when payment is confirmed</li>
              </ol>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Important:</p>
                    <p className="text-yellow-700">
                      Send only {paymentDetails.pay_currency} to this address. 
                      Sending other cryptocurrencies may result in permanent loss.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Breakdown */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Fee Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Amount:</span>
                  <span className="font-medium">{formatCurrency(paymentDetails.price_amount, paymentDetails.price_currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee (2.9%):</span>
                  <span className="font-medium">{formatCurrency(paymentDetails.fees.total_fees, paymentDetails.price_currency)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Merchant Receives:</span>
                  <span>{formatCurrency(paymentDetails.fees.merchant_receives, paymentDetails.price_currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 mb-1">Secure Payment</p>
                  <p className="text-gray-600">
                    This payment is processed securely through the blockchain. 
                    Your transaction will be visible on the public ledger once confirmed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Powered by Cryptrac • Secure Cryptocurrency Payments</p>
          </div>
        </div>
      </div>
    )
  }

  // Initial payment selection screen
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cryptrac Payment</h1>
          <p className="text-gray-600">Secure cryptocurrency payment processing</p>
        </div>

        {/* Payment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{paymentLink.title}</span>
              <Badge className="bg-green-100 text-green-800">
                {paymentLink.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </p>
              </div>
              
              {paymentLink.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700">{paymentLink.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Merchant</label>
                <p className="text-gray-700">{paymentLink.merchant.business_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Email (Optional) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="email"
              placeholder="your@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Receive payment confirmation and receipt via email
            </p>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Payment Method</CardTitle>
            <p className="text-sm text-gray-600">
              Select your preferred cryptocurrency to complete the payment
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {paymentLink.accepted_cryptos.map((crypto) => {
                const estimate = estimates.find(e => e.currency_to === crypto.toUpperCase())
                
                return (
                  <Button
                    key={crypto}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => createPayment(crypto)}
                    disabled={creating}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">
                            {crypto}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Pay with {crypto}</p>
                          <p className="text-sm text-gray-500">
                            {crypto === 'BTC' && 'Bitcoin'}
                            {crypto === 'ETH' && 'Ethereum'}
                            {crypto === 'LTC' && 'Litecoin'}
                            {crypto === 'USDT' && 'Tether'}
                            {crypto === 'USDC' && 'USD Coin'}
                          </p>
                        </div>
                      </div>
                      {estimate && (
                        <div className="text-right">
                          <p className="font-medium">{estimate.estimated_amount_formatted}</p>
                          <p className="text-sm text-gray-500">{crypto.toUpperCase()}</p>
                        </div>
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>
            
            {creating && (
              <div className="mt-4 text-center">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Creating payment...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 mb-1">Secure Payment</p>
                <p className="text-gray-600">
                  Your payment is processed securely through our encrypted payment system. 
                  No sensitive information is stored on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by Cryptrac • Secure Cryptocurrency Payments</p>
        </div>
      </div>
    </div>
  )
}

