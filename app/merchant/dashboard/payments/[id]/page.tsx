"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { QRCode } from '@/app/components/ui/qr-code'
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  Edit, 
  Trash2,
  Share2,
  Download,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react'

// Mock payment link data (in real app, fetch by ID)
const mockPaymentLink = {
  id: 'pl_abc123',
  title: 'Website Development Service',
  description: 'Full-stack web development project including frontend, backend, and database setup. Includes responsive design, user authentication, and payment processing.',
  amount: 2500.00,
  currency: 'USD',
  status: 'active',
  created: '2025-01-15T10:30:00Z',
  expires: '2025-02-15T23:59:59Z',
  maxUses: null,
  currentUses: 0,
  totalReceived: 0,
  link: 'https://pay.cryptrac.com/pl_abc123',
  acceptedCryptos: ['BTC', 'ETH', 'LTC'],
  requireCustomerInfo: false,
  redirectUrl: 'https://mywebsite.com/thank-you',
  payments: []
}

// Mock recent payments for this link
const mockPayments = [
  {
    id: '1',
    amount: 2500.00,
    crypto: 'BTC',
    cryptoAmount: '0.03456',
    status: 'completed',
    timestamp: '2025-01-20T14:30:00Z',
    txHash: '1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    customerEmail: 'john@example.com'
  }
]

export default function PaymentLinkDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [showQRCode, setShowQRCode] = useState(true)
  const [copied, setCopied] = useState(false)

  const paymentLink = mockPaymentLink // In real app: fetch by params.id

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQRCode = () => {
    // TODO: Implement QR code download
    console.log('Download QR code')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = paymentLink.expires && new Date(paymentLink.expires) < new Date()
  const isMaxUsesReached = paymentLink.maxUses && paymentLink.currentUses >= paymentLink.maxUses

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{paymentLink.title}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <Badge className={getStatusColor(paymentLink.status)}>
                {paymentLink.status}
              </Badge>
              <span className="text-gray-500 text-sm">
                Created {formatDate(paymentLink.created)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">This payment link has expired</span>
          </div>
        </div>
      )}

      {isMaxUsesReached && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
            <span className="text-amber-800 font-medium">Maximum uses reached</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Link Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Link Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              {paymentLink.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{paymentLink.description}</p>
                </div>
              )}

              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium">${paymentLink.amount.toLocaleString()} {paymentLink.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Uses:</span>
                      <span className="font-medium">
                        {paymentLink.currentUses} / {paymentLink.maxUses || '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Received:</span>
                      <span className="font-medium">${paymentLink.totalReceived.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expires:</span>
                      <span className="font-medium">
                        {paymentLink.expires ? formatDate(paymentLink.expires) : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer Info:</span>
                      <span className="font-medium">
                        {paymentLink.requireCustomerInfo ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Redirect URL:</span>
                      <span className="font-medium">
                        {paymentLink.redirectUrl ? 'Yes' : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accepted Cryptocurrencies */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Accepted Cryptocurrencies</h3>
                <div className="flex flex-wrap gap-2">
                  {paymentLink.acceptedCryptos.map(crypto => (
                    <Badge key={crypto} variant="secondary">
                      {crypto}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Payment Link URL */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Payment Link URL</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
                    {paymentLink.link}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentLink.link)}
                  >
                    <Copy className="w-4 h-4" />
                    {copied && <span className="ml-1 text-xs">Copied!</span>}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(paymentLink.link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {mockPayments.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                  <p className="text-gray-600">
                    Payments will appear here once customers start using this link.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(payment.timestamp)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <p className="font-medium">${payment.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Crypto:</span>
                              <p className="font-medium">{payment.cryptoAmount} {payment.crypto}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Customer:</span>
                              <p className="font-medium">{payment.customerEmail}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Transaction:</span>
                              <p className="font-medium font-mono text-xs">
                                {payment.txHash.substring(0, 16)}...
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(payment.txHash)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total Uses</span>
                  </div>
                  <span className="font-semibold">{paymentLink.currentUses}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total Received</span>
                  </div>
                  <span className="font-semibold">${paymentLink.totalReceived.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                  </div>
                  <span className="font-semibold">0%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Days Active</span>
                  </div>
                  <span className="font-semibold">
                    {Math.ceil((Date.now() - new Date(paymentLink.created).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>QR Code</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQRCode(!showQRCode)}
                  >
                    {showQRCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showQRCode ? (
                  <div className="text-center space-y-4">
                    <QRCode 
                      value={paymentLink.link} 
                      size={200}
                      className="mx-auto"
                    />
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={downloadQRCode}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(paymentLink.link)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Click to show QR code</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

