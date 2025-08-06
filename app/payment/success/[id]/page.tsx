'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { CheckCircle, Copy, ExternalLink, Mail, MessageSquare, Loader2, AlertCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentData {
  id: string
  nowpayments_payment_id: string
  order_id: string
  status: string
  pay_currency: string
  pay_amount: number
  pay_address: string
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
  customer_phone?: string
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
  
  // Receipt delivery states
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [sendingEmailReceipt, setSendingEmailReceipt] = useState(false)
  const [sendingSmsReceipt, setSendingSmsReceipt] = useState(false)
  const [emailReceiptSent, setEmailReceiptSent] = useState(false)
  const [smsReceiptSent, setSmsReceiptSent] = useState(false)

  useEffect(() => {
    if (linkId) {
      loadPaymentData()
    }
  }, [linkId, paymentId])

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

      // Pre-fill email if already provided
      if (data.payment.customer_email) {
        setEmail(data.payment.customer_email)
      }

      // Pre-fill phone if already provided
      if (data.payment.customer_phone) {
        setPhone(data.payment.customer_phone)
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

      const response = await fetch('/api/receipts/email', {
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

  const sendSmsReceipt = async () => {
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    if (!paymentData) {
      toast.error('Payment data not available')
      return
    }

    try {
      setSendingSmsReceipt(true)

      const response = await fetch('/api/receipts/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentData.id,
          phone: phone.trim()
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send SMS receipt')
      }

      console.log('✅ SMS receipt sent successfully')
      setSmsReceiptSent(true)
      toast.success('SMS receipt sent successfully!')

      // Update payment record with customer phone
      await updateCustomerContact('phone', phone.trim())

    } catch (error) {
      console.error('Error sending SMS receipt:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send SMS receipt')
    } finally {
      setSendingSmsReceipt(false)
    }
  }

  const updateCustomerContact = async (type: 'email' | 'phone', value: string) => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
              <p className="text-gray-600 mb-4">
                {error || "The payment confirmation you're looking for doesn't exist."}
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Confirmed!</h1>
          <p className="text-gray-600">
            Your payment has been successfully processed and confirmed on the blockchain.
          </p>
        </div>

        {/* Payment Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <p className="text-sm text-gray-600">
              Payment to {paymentData.payment_link.merchant.business_name}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Amount Paid</Label>
                <p className="text-lg font-semibold text-green-600">
                  {formatCrypto(paymentData.pay_amount, paymentData.pay_currency.toUpperCase())}
                </p>
                <p className="text-sm text-gray-500">
                  ≈ {formatCurrency(paymentData.price_amount, paymentData.price_currency.toUpperCase())}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                <p className="text-lg font-semibold">{paymentData.pay_currency.toUpperCase()}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Transaction Details */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Order ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={paymentData.order_id}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.order_id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Transaction Hash */}
              {paymentData.tx_hash && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Transaction Hash</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={paymentData.tx_hash}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.tx_hash!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {getBlockExplorerUrl(paymentData.tx_hash, paymentData.pay_currency) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const explorerUrl = getBlockExplorerUrl(paymentData.tx_hash!, paymentData.pay_currency)
                          if (explorerUrl) {
                            window.open(explorerUrl, '_blank')
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Payin Hash */}
              {paymentData.payin_hash && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Payin Hash (Customer Transaction)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={paymentData.payin_hash}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.payin_hash!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {getBlockExplorerUrl(paymentData.payin_hash, paymentData.pay_currency) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const explorerUrl = getBlockExplorerUrl(paymentData.payin_hash!, paymentData.pay_currency)
                          if (explorerUrl) {
                            window.open(explorerUrl, '_blank')
                          }
                        }}
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
                  <Label className="text-sm font-medium text-gray-700">Payout Hash (Merchant Transaction)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={paymentData.payout_hash}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.payout_hash!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {getBlockExplorerUrl(paymentData.payout_hash, paymentData.payout_currency || paymentData.pay_currency) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const explorerUrl = getBlockExplorerUrl(paymentData.payout_hash!, paymentData.payout_currency || paymentData.pay_currency)
                          if (explorerUrl) {
                            window.open(explorerUrl, '_blank')
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Created</Label>
                  <p className="text-gray-600">
                    {new Date(paymentData.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Confirmed</Label>
                  <p className="text-gray-600">
                    {new Date(paymentData.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Delivery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Get Your Receipt</CardTitle>
            <p className="text-sm text-gray-600">
              Receive a detailed receipt for your records
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Receipt */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Email Receipt</Label>
              <div className="flex gap-2 mt-2">
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
                <p className="text-sm text-green-600 mt-1">
                  ✅ Receipt sent to {email}
                </p>
              )}
            </div>

            {/* SMS Receipt */}
            <div>
              <Label className="text-sm font-medium text-gray-700">SMS Receipt</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={smsReceiptSent}
                  className="flex-1"
                />
                <Button
                  onClick={sendSmsReceipt}
                  disabled={sendingSmsReceipt || smsReceiptSent || !phone.trim()}
                  variant={smsReceiptSent ? "secondary" : "default"}
                >
                  {sendingSmsReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : smsReceiptSent ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {smsReceiptSent ? 'Sent' : 'Send SMS'}
                  </span>
                </Button>
              </div>
              {smsReceiptSent && (
                <p className="text-sm text-green-600 mt-1">
                  ✅ Receipt sent to {phone}
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Receipts include complete transaction details for your records
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                If you have any questions about this payment, please contact{' '}
                <span className="font-medium">{paymentData.payment_link.merchant.business_name}</span>{' '}
                with your Order ID: <span className="font-mono">{paymentData.order_id}</span>
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(paymentData.order_id)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Order ID
                </Button>
                
                {paymentData.tx_hash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.tx_hash!)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Transaction Hash
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

