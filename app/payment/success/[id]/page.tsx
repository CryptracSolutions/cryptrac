'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { CheckCircle, Copy, ExternalLink, Mail, Loader2, AlertCircle, Shield, Zap, CreditCard, ArrowRight, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

import { requiresExtraId, getExtraIdLabel } from '@/lib/extra-id-validation'
import { trackPaymentSuccess } from '@/lib/uri-analytics'

interface PaymentData {
  id: string
  nowpayments_payment_id: string
  order_id: string
  status: string
  pay_currency: string
  pay_amount: number
  pay_address: string
  payin_extra_id?: string
  price_amount: number
  price_currency: string
  amount_received: number
  currency_received: string
  gateway_fee: number
  merchant_receives: number
  payout_amount: number
  payout_currency: string
  is_fee_paid_by_user: boolean
  tx_hash?: string
  payin_hash?: string
  payout_hash?: string
  customer_email?: string
  created_at: string
  updated_at: string
  payment_link: {
    title: string
    link_id: string
    description?: string
    merchant: {
      business_name: string
    }
  }
}

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
]

export default function PaymentSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const linkId = params.id as string
  const paymentId = searchParams.get('payment_id')

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // Receipt delivery states (email only)
  const [email, setEmail] = useState('')
  const [sendingEmailReceipt, setSendingEmailReceipt] = useState(false)
  const [emailReceiptSent, setEmailReceiptSent] = useState(false)

    useEffect(() => {
      if (linkId) {
        loadPaymentData()
      }
    }, [linkId, paymentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPaymentData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading payment success data for ID:', linkId)

      const response = await fetch(`/api/payments/success/${linkId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load payment data')
      }

      const data = await response.json()

      if (!data.success || !data.payment) {
        throw new Error(data.error || 'Payment not found')
      }

      console.log('✅ Payment data loaded:', data.payment)
      setPaymentData(data.payment)

      try {
        // Attribute A/B variant and client on success view
        const clientId = localStorage.getItem('cryptrac_client_id') || 'anon'
        const strategy = localStorage.getItem('cryptrac_uri_strategy') || undefined
        if (data.payment?.id) {
          trackPaymentSuccess(data.payment.id, { clientId, strategy, variant: strategy })
        }
      } catch {}

      // Pre-fill email if already provided
      if (data.payment.customer_email) {
        setEmail(data.payment.customer_email)
      }

    } catch (error) {
      console.error('Error loading payment data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const sendEmailReceipt = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    if (!paymentData) {
      toast.error('Payment data not available')
      return
    }

    try {
      setSendingEmailReceipt(true)

      const response = await fetch('/api/receipts/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentData.id,
          email: email.trim()
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email receipt')
      }

      console.log('✅ Email receipt sent successfully')
      setEmailReceiptSent(true)
      toast.success('Email receipt sent successfully!')

      // Update payment record with customer email
      await updateCustomerContact('email', email.trim())

    } catch (error) {
      console.error('Error sending email receipt:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send email receipt')
    } finally {
      setSendingEmailReceipt(false)
    }
  }

  const updateCustomerContact = async (type: 'email', value: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentData?.id}/update-contact`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [type === 'email' ? 'customer_email' : 'customer_phone']: value
        }),
      })

      if (response.ok) {
        console.log(`✅ Customer ${type} updated in database`)
      } else {
        console.error(`❌ Failed to update customer ${type}`)
      }
    } catch (error) {
      console.error(`Error updating customer ${type}:`, error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        toast.success('Copied!', {
          duration: 2000,
          position: 'top-center'
        })
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
        toast.success('Copied!', {
          duration: 2000,
          position: 'top-center'
        })
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = FIAT_CURRENCIES.find(c => c.code === currencyCode)
    if (currency) {
      return `${currency.symbol}${amount.toFixed(2)}`
    }
    return `${amount.toFixed(2)} ${currencyCode}`
  }

  const formatCrypto = (amount: number, currencyCode: string, decimals: number = 8) => {
    return `${amount.toFixed(decimals)} ${currencyCode}`
  }

  const getBlockExplorerUrl = (txHash: string, currency: string) => {
    const currencyUpper = currency.toUpperCase()
    
    if (currencyUpper === 'BTC') {
      return `https://blockstream.info/tx/${txHash}`
    } else if (
      currencyUpper === 'ETH' ||
      currencyUpper.includes('ERC20') ||
      currencyUpper.includes('USDT') ||
      currencyUpper.includes('USDC') ||
      currencyUpper === 'DAI' ||
      currencyUpper === 'PYUSD'
    ) {
      return `https://etherscan.io/tx/${txHash}`
    } else if (currencyUpper === 'LTC') {
      return `https://blockchair.com/litecoin/transaction/${txHash}`
    } else if (currencyUpper === 'SOL') {
      return `https://solscan.io/tx/${txHash}`
    } else if (currencyUpper === 'TRX' || currencyUpper.includes('TRC20')) {
      return `https://tronscan.org/#/transaction/${txHash}`
    } else if (currencyUpper === 'BNB' || currencyUpper.includes('BSC')) {
      return `https://bscscan.com/tx/${txHash}`
    } else if (currencyUpper === 'MATIC' || currencyUpper.includes('POLYGON')) {
      return `https://polygonscan.com/tx/${txHash}`
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#ede9fe] border-t-[#7f5efd] rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#ddd6fe] rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-2">Loading Payment Confirmation</h2>
          <p className="font-phonic text-base font-normal text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center container-narrow">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="font-phonic text-3xl font-normal text-gray-900 mb-3">Payment Not Found</h2>
          <p className="font-phonic text-base font-normal text-gray-600 mb-6 leading-relaxed">
            {error || "The payment confirmation you're looking for doesn't exist."}
          </p>
          <Button onClick={() => window.location.href = '/'} size="lg" className="font-phonic text-base font-normal px-8 py-3 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-narrow">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#ede9fe] to-[#ddd6fe] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="h-12 w-12 text-[#7f5efd]" />
            </div>
          </div>
          <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">Payment Confirmed!</h1>
          <p className="font-phonic text-base font-normal text-gray-600 mb-4">
            Your payment has been successfully processed and confirmed on the blockchain.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-[#7f5efd]" />
              <span className="font-phonic font-normal">Secure Transaction</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-[#7f5efd]" />
              <span className="font-phonic font-normal">Instant Confirmation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-[#7f5efd]" />
              <span className="font-phonic font-normal">Non-Custodial</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <Card className="mb-8 border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
          <CardHeader className="text-center pb-6">
            <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Payment Summary</CardTitle>
            <p className="font-phonic text-base font-normal text-gray-600">
              Payment to <span className="font-phonic font-medium text-gray-900">{paymentData.payment_link.merchant.business_name}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Amount Paid</Label>
                <p className="font-phonic text-3xl font-medium text-[#7f5efd] mb-2">
                  {formatCrypto(paymentData.pay_amount, paymentData.pay_currency.toUpperCase())}
                </p>
                <p className="font-phonic text-sm font-normal text-gray-600">
                  ≈ {formatCurrency(paymentData.price_amount, paymentData.price_currency.toUpperCase())}
                </p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Payment Method</Label>
                <p className="font-phonic text-2xl font-normal text-[#7f5efd] mb-2">{paymentData.pay_currency.toUpperCase()}</p>
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm font-semibold">
                  {paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1)}
                </Badge>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Transaction Details */}
            <div className="space-y-4">
              <div>
                <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Order ID</Label>
                <div className="flex gap-3 items-stretch">
                  <Input
                    value={paymentData.order_id}
                    readOnly
                    className="font-mono text-sm bg-gray-50 w-full flex-1"
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => copyToClipboard(paymentData.order_id)}
                    className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Destination Tag/Memo Display */}
              {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <Label className="font-phonic text-sm font-medium text-green-800 mb-1 block">
                        {getExtraIdLabel(paymentData.pay_currency)} Used
                      </Label>
                      <p className="font-phonic text-xs font-normal text-green-700 mb-2">
                        The {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} was successfully included with your payment
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      value={paymentData.payin_extra_id}
                      readOnly
                      className="font-mono text-sm bg-white border-green-300"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => copyToClipboard(paymentData.payin_extra_id!)}
                      className="font-phonic text-base font-normal border-green-600 text-green-700 hover:bg-green-50 shadow-sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Transaction Hash */}
              {paymentData.tx_hash && (
                <div>
                  <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Transaction Hash</Label>
                  <div className="flex gap-3 items-stretch">
                    <Input
                      value={paymentData.tx_hash}
                      readOnly
                      className="font-mono text-sm bg-gray-50 w-full flex-1"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => copyToClipboard(paymentData.tx_hash!)}
                      className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {getBlockExplorerUrl(paymentData.tx_hash, paymentData.pay_currency) && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          const explorerUrl = getBlockExplorerUrl(paymentData.tx_hash!, paymentData.pay_currency)
                          if (explorerUrl) {
                            window.open(explorerUrl, '_blank')
                          }
                        }}
                        className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              

              {/* Payout Hash */}
              {paymentData.payout_hash && (
                <div>
                  <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Payout Hash (Merchant Transaction)</Label>
                  <div className="flex gap-3">
                    <Input
                      value={paymentData.payout_hash}
                      readOnly
                      className="font-mono text-sm bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => copyToClipboard(paymentData.payout_hash!)}
                      className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {getBlockExplorerUrl(paymentData.payout_hash, paymentData.payout_currency || paymentData.pay_currency) && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          const explorerUrl = getBlockExplorerUrl(paymentData.payout_hash!, paymentData.payout_currency || paymentData.pay_currency)
                          if (explorerUrl) {
                            window.open(explorerUrl, '_blank')
                          }
                        }}
                        className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receipt Delivery */}
        <Card className="mb-8 border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
          <CardHeader className="text-center pb-6">
            <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Get Your Receipt</CardTitle>
            <p className="font-phonic text-base font-normal text-gray-600">
              Receive a detailed receipt for your records
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Receipt */}
            <div>
              <Label className="font-phonic text-sm font-normal text-gray-700 mb-3 block">Email Receipt</Label>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailReceiptSent}
                  className="flex-1"
                />
                <Button
                  onClick={sendEmailReceipt}
                  disabled={sendingEmailReceipt || emailReceiptSent || !email.trim()}
                  variant={emailReceiptSent ? "secondary" : "default"}
                  size="lg"
                  className={`font-phonic text-base font-normal px-8 py-3 shadow-sm ${emailReceiptSent ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-[#7f5efd] hover:bg-[#7c3aed] text-white'}`}
                >
                  {sendingEmailReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : emailReceiptSent ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {emailReceiptSent ? 'Sent' : 'Send Email'}
                  </span>
                </Button>
              </div>
              {emailReceiptSent && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-phonic text-sm font-medium text-green-800">
                    Receipt sent to {email}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="font-phonic text-sm font-normal text-gray-500">
                Receipts include complete transaction details for your records
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mb-8 border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
          <CardHeader className="text-center pb-6">
            <CardTitle className="font-phonic text-2xl font-normal text-gray-900">What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-phonic font-normal text-gray-900 mb-2">Payment Confirmed</h3>
                <p className="font-phonic text-sm font-normal text-gray-600">
                  Your payment has been confirmed on the blockchain and the merchant has been notified.
                </p>
              </div>
                              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-phonic font-normal text-gray-900 mb-2">Receipt Available</h3>
                <p className="font-phonic text-sm font-normal text-gray-600">
                  Request an email receipt above to keep detailed records of this transaction.
                </p>
              </div>
                              <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                <ExternalLink className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-phonic font-normal text-gray-900 mb-2">Blockchain Verification</h3>
                <p className="font-phonic text-sm font-normal text-gray-600">
                  Use the transaction hashes above to verify your payment on the blockchain explorer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
                      <div className="bg-gradient-to-r from-[#f5f3ff] to-purple-50 rounded-lg p-8 border border-[#ede9fe]">
            <h3 className="font-phonic text-xl font-normal text-gray-900 mb-3">Thank you for using Cryptrac!</h3>
            <p className="font-phonic text-base font-normal text-gray-600 mb-6">
              Your payment has been processed securely and efficiently using cryptocurrency technology.
            </p>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline" 
              size="lg"
              className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] shadow-sm"
            >
              Return Home
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
