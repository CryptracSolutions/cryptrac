'use client'

import React, { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { 
  CheckCircle,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  Download,
  Wallet,
  Clock,
  DollarSign,
  Hash,
  Building,
  Loader2,
  AlertCircle
} from 'lucide-react'

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
  payout_currency: string
  payout_amount: number
  created_at: string
  updated_at: string
  tx_hash?: string
  is_fee_paid_by_user: boolean
  gateway_fee?: number
  merchant_receives?: number
  amount_received?: number
  currency_received?: string
  payment_link: {
    title: string
    description?: string
    merchant: {
      business_name: string
    }
  }
}

export default function PaymentSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailForReceipt, setEmailForReceipt] = useState('')
  const [phoneForReceipt, setPhoneForReceipt] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [sendingSMS, setSendingSMS] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const [txHashCopied, setTxHashCopied] = useState(false)

  useEffect(() => {
    if (id) {
      loadPaymentData()
    }
  }, [id])

  const loadPaymentData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading payment success data for ID:', id)

      const response = await fetch(`/api/payments/success/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment not found')
        }
        throw new Error('Failed to load payment data')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to load payment data')
      }

      console.log('✅ Payment data loaded:', data.payment)
      setPayment(data.payment)

    } catch (error) {
      console.error('Error loading payment data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const sendEmailReceipt = async () => {
    if (!payment || !emailForReceipt.trim()) return

    try {
      setSendingEmail(true)
      
      const response = await fetch('/api/receipts/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: payment.id,
          email: emailForReceipt.trim(),
        }),
      })

      if (response.ok) {
        setEmailSent(true)
        console.log('✅ Email receipt sent successfully')
      } else {
        throw new Error('Failed to send email receipt')
      }
    } catch (error) {
      console.error('Error sending email receipt:', error)
      alert('Failed to send email receipt. Please try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  const sendSMSReceipt = async () => {
    if (!payment || !phoneForReceipt.trim()) return

    try {
      setSendingSMS(true)
      
      const response = await fetch('/api/receipts/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: payment.id,
          phone: phoneForReceipt.trim(),
        }),
      })

      if (response.ok) {
        setSmsSent(true)
        console.log('✅ SMS receipt sent successfully')
      } else {
        throw new Error('Failed to send SMS receipt')
      }
    } catch (error) {
      console.error('Error sending SMS receipt:', error)
      alert('Failed to send SMS receipt. Please try again.')
    } finally {
      setSendingSMS(false)
    }
  }

  const copyTransactionHash = async () => {
    if (!payment?.tx_hash) return

    try {
      await navigator.clipboard.writeText(payment.tx_hash)
      setTxHashCopied(true)
      setTimeout(() => setTxHashCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy transaction hash:', error)
    }
  }

  const formatAmount = (amount: number, decimals: number = 8) => {
    return amount.toFixed(decimals).replace(/\.?0+$/, '')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getBlockExplorerUrl = (txHash: string, currency: string) => {
    const lowerCurrency = currency.toLowerCase()
    
    if (lowerCurrency === 'btc') {
      return `https://blockstream.info/tx/${txHash}`
    } else if (lowerCurrency === 'eth' || lowerCurrency.includes('erc20')) {
      return `https://etherscan.io/tx/${txHash}`
    } else if (lowerCurrency === 'bnb' || lowerCurrency.includes('bep20')) {
      return `https://bscscan.com/tx/${txHash}`
    } else if (lowerCurrency === 'sol') {
      return `https://solscan.io/tx/${txHash}`
    }
    
    return null
  }

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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h2>
            <p className="text-gray-600">This payment does not exist or could not be loaded.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const blockExplorerUrl = payment.tx_hash ? getBlockExplorerUrl(payment.tx_hash, payment.pay_currency) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Success Header */}
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-4">
                Your payment has been confirmed and processed successfully.
              </p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Confirmed
              </Badge>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Payment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment For</label>
                    <p className="font-semibold">{payment.payment_link.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Merchant</label>
                    <p className="font-semibold flex items-center">
                      <Building className="w-4 h-4 mr-1" />
                      {payment.payment_link.merchant.business_name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                    <p className="font-semibold text-lg">
                      {formatAmount(payment.pay_amount)} {payment.pay_currency}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">USD Value</label>
                    <p className="font-semibold flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${payment.price_amount.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Time</label>
                    <p className="font-semibold flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(payment.updated_at)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Order ID</label>
                    <p className="font-mono text-sm">{payment.order_id}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Hash */}
              {payment.tx_hash && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Transaction Hash</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={payment.tx_hash}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={copyTransactionHash}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {txHashCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    {blockExplorerUrl && (
                      <Button
                        onClick={() => window.open(blockExplorerUrl, '_blank')}
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {blockExplorerUrl && (
                    <p className="text-xs text-gray-500 mt-1">
                      Click the external link icon to view on blockchain explorer
                    </p>
                  )}
                </div>
              )}

              {/* Fee Information */}
              {payment.gateway_fee && payment.gateway_fee > 0 && (
                <Alert>
                  <DollarSign className="w-4 h-4" />
                  <AlertDescription>
                    {payment.is_fee_paid_by_user 
                      ? `Gateway fee of $${payment.gateway_fee.toFixed(2)} was included in your payment.`
                      : `Gateway fee of $${payment.gateway_fee.toFixed(2)} was deducted from the merchant payout.`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Receipt Options */}
          <Card>
            <CardHeader>
              <CardTitle>Get Your Receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Email Receipt */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Receipt
                </h3>
                {emailSent ? (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Receipt sent successfully to {emailForReceipt}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={emailForReceipt}
                      onChange={(e) => setEmailForReceipt(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendEmailReceipt}
                      disabled={!emailForReceipt.trim() || sendingEmail}
                      className="bg-[#7f5efd] hover:bg-[#6d4fd2] text-white"
                    >
                      {sendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* SMS Receipt */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  SMS Receipt
                </h3>
                {smsSent ? (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Receipt sent successfully to {phoneForReceipt}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneForReceipt}
                      onChange={(e) => setPhoneForReceipt(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendSMSReceipt}
                      disabled={!phoneForReceipt.trim() || sendingSMS}
                      variant="outline"
                    >
                      {sendingSMS ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Download Receipt */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </h3>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Receipt
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cryptrac Branding */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">
                <p>Payment processed securely by</p>
                <p className="font-semibold text-[#7f5efd] text-lg mt-1">Cryptrac</p>
                <p className="text-xs mt-2">
                  Non-custodial crypto payment processing
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

