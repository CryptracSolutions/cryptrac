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
    customer_pays_fee: boolean
  }
}

interface CurrencyEstimate {
  currency_to: string
  estimated_amount: string
  estimated_amount_formatted: string
  success: boolean
  has_wallet: boolean
  wallet_address?: string
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
  const [availableCurrencies, setAvailableCurrencies] = useState<AvailableCurrency[]>([])
  const [estimates, setEstimates] = useState<CurrencyEstimate[]>([])
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string>('')
  const [isPolling, setIsPolling] = useState(false)
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)

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

        // Load available currencies for this merchant (only those with wallet addresses)
        await loadAvailableCurrencies(data.payment_link.merchant.id, data.payment_link.accepted_cryptos)

      } catch (error) {
        console.error('Error fetching payment link:', error)
        setError(error instanceof Error ? error.message : 'Failed to load payment information')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentLink()
  }, [id])

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
              filteredCurrencies.map(c => c.code)
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
          currency_from: fromCurrency,
          currencies_to: toCurrencies
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Enhance estimates with wallet information
        const enhancedEstimates = data.estimates?.map((estimate: CurrencyEstimate) => {
          const currency = availableCurrencies.find(c => c.code === estimate.currency_to)
          return {
            ...estimate,
            has_wallet: currency?.has_wallet || false,
            wallet_address: currency?.wallet_address
          }
        }) || []
        
        setEstimates(enhancedEstimates)
      }
    } catch (error) {
      console.error('Error fetching estimates:', error)
    }
  }

  const createPayment = async (crypto: string) => {
    if (!paymentLink) return

    // Verify the selected crypto has a wallet address
    const selectedCurrency = availableCurrencies.find(c => c.code === crypto)
    if (!selectedCurrency || !selectedCurrency.has_wallet) {
      setError(`No wallet address configured for ${crypto}. Please contact the merchant.`)
      return
    }

    try {
      setCreating(true)
      setError(null)

      // Determine fee setting (per-link override or merchant global)
      const chargeCustomerFee = paymentLink.charge_customer_fee !== null 
        ? paymentLink.charge_customer_fee 
        : paymentLink.merchant.charge_customer_fee

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
          cancel_url: `${window.location.origin}/payment/cancelled`,
          is_fee_paid_by_user: chargeCustomerFee, // Pass fee setting to NOWPayments
          payout_address: selectedCurrency.wallet_address // Use merchant's wallet address
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

  const getNetworkBadgeColor = (network: string) => {
    const colorMap: Record<string, string> = {
      'Bitcoin': 'bg-orange-100 text-orange-800',
      'Ethereum': 'bg-blue-100 text-blue-800',
      'BSC': 'bg-yellow-100 text-yellow-800',
      'Solana': 'bg-green-100 text-green-800',
      'Tron': 'bg-red-100 text-red-800',
      'TON': 'bg-indigo-100 text-indigo-800',
      'Dogecoin': 'bg-amber-100 text-amber-800',
      'XRP Ledger': 'bg-purple-100 text-purple-800',
      'Sui': 'bg-cyan-100 text-cyan-800',
      'Avalanche': 'bg-rose-100 text-rose-800'
    }
    return colorMap[network] || 'bg-gray-100 text-gray-800'
  }

  // Enhanced: Use status config for consistent styling
  const getStatusConfig = (status: string) => {
    return PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.waiting
  }

  // Get effective fee setting (per-link override or merchant global)
  const getEffectiveFeeSettings = () => {
    if (!paymentLink) return { chargeCustomerFee: false, source: 'default' }
    
    if (paymentLink.charge_customer_fee !== null) {
      return {
        chargeCustomerFee: paymentLink.charge_customer_fee,
        source: 'link'
      }
    }
    
    return {
      chargeCustomerFee: paymentLink.merchant.charge_customer_fee,
      source: 'merchant'
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

          {/* Fee Information */}
          {paymentDetails.fees && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payment Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-medium">{formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)}</span>
                </div>
                
                {paymentDetails.fees.customer_pays_fee && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Base Amount:</span>
                      <span>{formatCurrency(paymentLink.amount, paymentLink.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Gateway Fee:</span>
                      <span>+{paymentDetails.fees.gateway_fee.toFixed(2)} {paymentLink.currency}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total (including fees):</span>
                        <span>{formatCrypto(paymentDetails.pay_amount, paymentDetails.pay_currency)}</span>
                      </div>
                    </div>
                  </>
                )}
                
                {!paymentDetails.fees.customer_pays_fee && (
                  <div className="text-sm text-green-600">
                    ✓ Gateway fee absorbed by merchant
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                        <h4 className="font-medium text-blue-900">Important Instructions</h4>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                          <li>• Send only {paymentDetails.pay_currency.toUpperCase()} to this address</li>
                          <li>• Send the exact amount shown above</li>
                          <li>• Payment will be confirmed after network confirmations</li>
                          <li>• Do not send from an exchange (use a personal wallet)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Success/Complete states */}
          {['finished', 'confirmed'].includes(paymentDetails.status) && (
            <Card className="mb-6">
              <CardContent className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-4">
                  Your payment has been confirmed and processed successfully.
                </p>
                <p className="text-sm text-gray-500">
                  Transaction ID: {paymentDetails.nowpayments_payment_id}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Show currency selection
  const feeSettings = getEffectiveFeeSettings()

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
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(paymentLink.amount, paymentLink.currency)}
            </div>
            
            {/* Fee Information */}
            <div className="mt-2">
              {feeSettings.chargeCustomerFee ? (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  + Gateway fee (charged to customer)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Gateway fee absorbed by merchant
                </Badge>
              )}
            </div>
          </div>
        </div>

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
            <p className="text-sm text-gray-500 mt-2">
              Receive payment confirmation and updates
            </p>
          </CardContent>
        </Card>

        {/* Currency Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Choose Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCurrencies ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading payment options...</p>
              </div>
            ) : availableCurrencies.length === 0 ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>No payment methods available.</strong> The merchant has not configured wallet addresses 
                  for the accepted cryptocurrencies. Please contact the merchant for assistance.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {availableCurrencies.map((currency) => {
                  const estimate = estimates.find(e => e.currency_to === currency.code)
                  const estimatedAmount = estimate ? parseFloat(estimate.estimated_amount) : null
                  
                  return (
                    <div
                      key={currency.code}
                      className="border rounded-lg p-4 hover:border-[#7f5efd] transition-colors cursor-pointer"
                      onClick={() => createPayment(currency.code)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-sm">{currency.symbol}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{currency.code}</span>
                              {currency.network && (
                                <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currency.network)}`}>
                                  {currency.network}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {currency.display_name || currency.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {estimatedAmount ? (
                            <>
                              <div className="font-medium">
                                {estimatedAmount.toFixed(currency.decimals)} {currency.code}
                              </div>
                              {feeSettings.chargeCustomerFee && (
                                <div className="text-xs text-yellow-600">
                                  + gateway fee
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-gray-400">
                              Calculating...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {creating && (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Creating payment...</p>
              </div>
            )}
            
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Payment Link Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>Powered by Cryptrac</p>
              <p className="mt-1">Secure cryptocurrency payments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

