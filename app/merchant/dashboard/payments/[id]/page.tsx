'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { QRCode } from '@/app/components/ui/qr-code'
import { createBrowserClient } from '@/lib/supabase-browser'
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  Edit, 
  Trash2,
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
  created_at: string
}

export default function PaymentLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const { id } = use(params)
  
  const router = useRouter()
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const supabase = createBrowserClient()

  const fetchPaymentLink = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('No valid session')
      }

      // Make API call with Authorization header
      const response = await fetch(`/api/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Unauthorized')
      }

      const result = await response.json()
      
      if (result.success) {
        setPaymentLink(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch payment link')
      }
    } catch (error) {
      console.error('Error fetching payment link:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payment link')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentLink()
  }, [id])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/merchant/dashboard/payments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Button>
        </div>
      </div>
    )
  }

  if (!paymentLink) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Payment Link Not Found</h1>
          <Button onClick={() => router.push('/merchant/dashboard/payments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Button>
        </div>
      </div>
    )
  }

  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${paymentLink.link_id}`

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/merchant/dashboard/payments')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{paymentLink.title}</h1>
            <p className="text-muted-foreground">
              Created {formatDate(paymentLink.created_at)}
            </p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800">
          {paymentLink.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Link Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-2xl font-bold">{formatCurrency(paymentLink.amount, paymentLink.currency)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900">{paymentLink.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Payment URL</label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                  {paymentUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(paymentUrl)}
                >
                  {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(paymentUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <QRCode value={paymentUrl} size={200} />
              <p className="text-sm text-gray-500 text-center">
                Customers can scan this QR code to access the payment link
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

