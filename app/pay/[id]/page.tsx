'use client'

import React, { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { 
  CreditCard,
  Shield,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface PaymentLink {
  id: string
  link_id: string
  title: string
  description: string
  amount: number
  currency: string
  status: string
  accepted_cryptos: string[]
  require_customer_info: boolean
}

export default function CustomerPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const { id } = use(params)
  
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentLink = async () => {
      try {
        setLoading(true)
        setError(null)

        // For now, create a mock payment link based on the ID
        // In a real implementation, this would fetch from a public API endpoint
        const mockPaymentLink: PaymentLink = {
          id: id,
          link_id: id,
          title: 'Payment Request',
          description: 'Complete your payment using cryptocurrency',
          amount: 100.00,
          currency: 'USD',
          status: 'active',
          accepted_cryptos: ['BTC', 'ETH', 'LTC'],
          require_customer_info: false
        }

        setPaymentLink(mockPaymentLink)
      } catch (error) {
        console.error('Error fetching payment link:', error)
        setError('Failed to load payment information')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentLink()
  }, [id])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const handlePayment = (crypto: string) => {
    // TODO: Integrate with NOWPayments to create actual payment
    console.log(`Initiating payment with ${crypto}`)
    alert(`Payment with ${crypto} will be implemented in the next phase!`)
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
            </div>
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
              {paymentLink.accepted_cryptos.map((crypto) => (
                <Button
                  key={crypto}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handlePayment(crypto)}
                >
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
                </Button>
              ))}
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

