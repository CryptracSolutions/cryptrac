"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Link2, 
  QrCode, 
  FileText, 
  Eye, 
  Edit, 
  Trash2,
  Copy,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

// Mock data for payment links
const mockPaymentLinks = [
  {
    id: '1',
    title: 'Website Development Service',
    description: 'Full-stack web development project',
    amount: 2500.00,
    currency: 'USD',
    status: 'active',
    created: '2025-01-15',
    expires: '2025-02-15',
    payments: 0,
    totalReceived: 0,
    link: 'https://pay.cryptrac.com/pl_abc123',
    acceptedCryptos: ['BTC', 'ETH', 'LTC']
  },
  {
    id: '2',
    title: 'Consulting Session',
    description: 'One-hour business consultation',
    amount: 150.00,
    currency: 'USD',
    status: 'active',
    created: '2025-01-18',
    expires: '2025-01-25',
    payments: 2,
    totalReceived: 300.00,
    link: 'https://pay.cryptrac.com/pl_def456',
    acceptedCryptos: ['BTC', 'ETH']
  },
  {
    id: '3',
    title: 'Digital Marketing Package',
    description: 'Complete social media management',
    amount: 800.00,
    currency: 'USD',
    status: 'expired',
    created: '2025-01-10',
    expires: '2025-01-17',
    payments: 1,
    totalReceived: 800.00,
    link: 'https://pay.cryptrac.com/pl_ghi789',
    acceptedCryptos: ['BTC', 'ETH', 'LTC', 'USDT']
  }
]

// Mock data for recent payments
const mockRecentPayments = [
  {
    id: '1',
    paymentLinkTitle: 'Consulting Session',
    amount: 150.00,
    crypto: 'BTC',
    cryptoAmount: '0.00234',
    status: 'completed',
    timestamp: '2025-01-20 14:30',
    txHash: '1a2b3c4d5e6f...'
  },
  {
    id: '2',
    paymentLinkTitle: 'Consulting Session',
    amount: 150.00,
    crypto: 'ETH',
    cryptoAmount: '0.0456',
    status: 'completed',
    timestamp: '2025-01-19 09:15',
    txHash: '7g8h9i0j1k2l...'
  },
  {
    id: '3',
    paymentLinkTitle: 'Digital Marketing Package',
    amount: 800.00,
    crypto: 'BTC',
    cryptoAmount: '0.01234',
    status: 'completed',
    timestamp: '2025-01-17 16:45',
    txHash: '3m4n5o6p7q8r...'
  }
]

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('links')

  const filteredPaymentLinks = mockPaymentLinks.filter(link =>
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalLinks: mockPaymentLinks.length,
    activeLinks: mockPaymentLinks.filter(l => l.status === 'active').length,
    totalReceived: mockPaymentLinks.reduce((sum, l) => sum + l.totalReceived, 0),
    totalPayments: mockPaymentLinks.reduce((sum, l) => sum + l.payments, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Manage your payment links, invoices, and track incoming payments
          </p>
        </div>
        <Button className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Payment Link
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Links</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLinks}</p>
              </div>
              <div className="w-12 h-12 bg-[#7f5efd]/10 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-[#7f5efd]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Links</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeLinks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalReceived.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payment Management</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search payment links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="links">Payment Links</TabsTrigger>
              <TabsTrigger value="payments">Recent Payments</TabsTrigger>
            </TabsList>

            {/* Payment Links Tab */}
            <TabsContent value="links" className="space-y-4">
              {filteredPaymentLinks.length === 0 ? (
                <div className="text-center py-12">
                  <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Create your first payment link to get started.'}
                  </p>
                  <Button className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Payment Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPaymentLinks.map((link) => (
                    <div key={link.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{link.title}</h3>
                            <Badge className={getStatusColor(link.status)}>
                              {link.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{link.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <p className="font-medium">${link.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Payments:</span>
                              <p className="font-medium">{link.payments}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Received:</span>
                              <p className="font-medium">${link.totalReceived.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Expires:</span>
                              <p className="font-medium">{link.expires}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 mt-3">
                            <span className="text-sm text-gray-500">Accepts:</span>
                            {link.acceptedCryptos.map((crypto) => (
                              <Badge key={crypto} variant="secondary" className="text-xs">
                                {crypto}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(link.link)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(link.link, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Recent Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              {mockRecentPayments.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent payments</h3>
                  <p className="text-gray-600">
                    Payments will appear here once customers start paying your links.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockRecentPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {payment.paymentLinkTitle}
                            </h3>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
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
                              <span className="text-gray-500">Time:</span>
                              <p className="font-medium">{payment.timestamp}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Transaction:</span>
                              <p className="font-medium font-mono text-xs">{payment.txHash}</p>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

