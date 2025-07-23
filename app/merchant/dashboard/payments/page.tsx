'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { 
  Plus, 
  Search, 
  Link2, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Copy, 
  Eye, 
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle
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
  expires_at?: string
  max_uses?: number
  accepted_cryptos: string[]
  payment_url: string
  statistics: {
    total_payments: number
    successful_payments: number
    total_received: number
  }
}

interface PaymentLinksResponse {
  success: boolean
  data: {
    payment_links: PaymentLink[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
    statistics: {
      total_links: number
      active_links: number
      total_payments: number
      total_received: number
    }
  }
}

export default function PaymentsPage() {
  const router = useRouter()
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [statistics, setStatistics] = useState({
    total_links: 0,
    active_links: 0,
    total_payments: 0,
    total_received: 0
  })

  const fetchPaymentLinks = async () => {
    try {
      console.log('Fetching payment links...')
      setLoading(true)
      setError(null)

      // Get session from Supabase
      const supabase = createBrowserClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('No valid session')
      }

      console.log('Session found, making API call...')

      // Make API call with Authorization header (same as working APIs)
      const response = await fetch('/api/payments?page=1&limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: PaymentLinksResponse = await response.json()
      console.log('API response:', data)

      if (data.success) {
        setPaymentLinks(data.data.payment_links)
        setStatistics(data.data.statistics)
      } else {
        throw new Error('API returned success: false')
      }

    } catch (error) {
      console.error('Error fetching payment links:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch payment links')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentLinks()
  }, [])

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(linkId)
      setTimeout(() => setCopied(null), 2000)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter payment links based on search and status
  const filteredLinks = paymentLinks.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">Loading payment links...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">Error loading payment links</p>
          </div>
          <Button onClick={() => router.push('/merchant/dashboard/payments/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Payment Link
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Failed to load payment links</h3>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchPaymentLinks}
                  className="mt-3"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Manage your payment links, invoices, and track incoming payments
          </p>
        </div>
        <Button onClick={() => router.push('/merchant/dashboard/payments/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Payment Link
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Link2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Links</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_links}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Links</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.active_links}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_payments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.total_received, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search payment links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="completed">Completed</option>
        </select>
        <Button variant="outline" onClick={fetchPaymentLinks}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Payment Links List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Links ({paymentLinks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLinks.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {paymentLinks.length === 0 ? 'No payment links found' : 'No payment links match your search'}
              </p>
              <Button 
                onClick={() => router.push('/merchant/dashboard/payments/create')}
              >
                Create Your First Payment Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLinks.map((link) => (
                <div key={link.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{link.title}</h3>
                        <Badge className={getStatusColor(link.status)}>
                          {link.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mt-1">{link.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{formatCurrency(link.amount, link.currency)}</span>
                        <span>•</span>
                        <span>Created {formatDate(link.created_at)}</span>
                        <span>•</span>
                        <span>{link.statistics.total_payments} payments</span>
                        <span>•</span>
                        <span>Received {formatCurrency(link.statistics.total_received, link.currency)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.payment_url, link.id)}
                      >
                        {copied === link.id ? 'Copied!' : <Copy className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.payment_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/merchant/dashboard/payments/${link.id}`)}
                      >
                        <Eye className="w-4 h-4" />
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
  )
}

