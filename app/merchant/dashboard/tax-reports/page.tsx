"use client"

import React, { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation'
import {
  Calculator,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Star,
  Shield,
  Coins,
  Printer,
  XCircle
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { supabase } from '@/lib/supabase-browser'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'
import { BackToDashboard } from '@/app/components/ui/back-to-dashboard'

interface TaxReportFilters {
  start_date: string
  end_date: string
  report_type: 'calendar_year' | 'fiscal_year' | 'quarterly' | 'custom'
  year: number
  quarter: number
  fiscal_year_start: string
  tax_only: boolean
  status: 'confirmed' | 'refunded' | 'all'
}

interface TransactionSummary {
  total_transactions: number
  total_gross_sales: number
  total_tax_collected: number
  total_fees: number
  total_net_revenue: number
}

interface Transaction {
  id: string
  payment_id: string
  created_at: string
  product_description: string
  gross_amount: number
  tax_label: string
  tax_percentage: number
  tax_amount: number
  total_paid: number
  fees: number
  net_amount: number
  status: string
  refund_amount: number
  refund_date: string | null
  // ENHANCED: Added public_receipt_id for receipt links
  public_receipt_id: string | null
}

interface TaxReportData {
  transactions: Transaction[]
  summary: TransactionSummary
  filters: TaxReportFilters & { applied_date_range: { start_date: string; end_date: string } }
  total_count: number
}

export default function TaxReportsPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<TaxReportData | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [showDetailedView, setShowDetailedView] = useState(false)

  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

  const [filters, setFilters] = useState<TaxReportFilters>({
    start_date: `${currentYear}-01-01`,
    end_date: new Date().toISOString().split('T')[0],
    report_type: 'calendar_year',
    year: currentYear,
    quarter: currentQuarter,
    fiscal_year_start: '01-01',
    tax_only: false,
    status: 'confirmed'
  })

    useEffect(() => {
      checkAuth()
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      if (user) {
        loadTaxReport()
      }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      setUser(authUser)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadTaxReport = async () => {
    if (!user) return

    try {
      setLoadingReport(true)
      console.log('📊 Loading tax report with filters:', filters)

      const params = new URLSearchParams({
        user_id: user.id,
        report_type: filters.report_type,
        year: filters.year.toString(),
        quarter: filters.quarter.toString(),
        fiscal_year_start: filters.fiscal_year_start,
        tax_only: filters.tax_only.toString(),
        status: filters.status,
        export_format: 'json'
      })

      if (filters.report_type === 'custom') {
        params.append('start_date', `${filters.start_date}T00:00:00.000Z`)
        params.append('end_date', `${filters.end_date}T23:59:59.999Z`)
      }

      const response = await fetch(`/api/tax-reports?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load tax report')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load tax report')
      }

      console.log('✅ Tax report loaded:', data.data)
      setReportData(data.data)

    } catch (error) {
      console.error('❌ Error loading tax report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load tax report')
    } finally {
      setLoadingReport(false)
    }
  }

  const exportToCSV = async () => {
    if (!user) return

    try {
      setExportingCSV(true)
      console.log('📥 Exporting tax report to CSV...')

      const params = new URLSearchParams({
        user_id: user.id,
        report_type: filters.report_type,
        year: filters.year.toString(),
        quarter: filters.quarter.toString(),
        fiscal_year_start: filters.fiscal_year_start,
        tax_only: filters.tax_only.toString(),
        status: filters.status,
        export_format: 'csv'
      })

      if (filters.report_type === 'custom') {
        params.append('start_date', `${filters.start_date}T00:00:00.000Z`)
        params.append('end_date', `${filters.end_date}T23:59:59.999Z`)
      }

      const response = await fetch(`/api/tax-reports?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to export tax report')
      }

      // Download the CSV file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-report-${filters.start_date}-to-${filters.end_date}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Tax report exported successfully!')

    } catch (error) {
      console.error('❌ Error exporting tax report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export tax report')
    } finally {
      setExportingCSV(false)
    }
  }

  const markAsRefunded = async (transaction: Transaction) => {
    if (!user) return
    const refundAmountStr = prompt('Refund amount', transaction.total_paid.toString())
    if (refundAmountStr === null) return
    const refundAmount = parseFloat(refundAmountStr)
    const refundDate = prompt('Refund date (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'refunded',
          refund_amount: refundAmount,
          refunded_at: refundDate ? `${refundDate}T00:00:00.000Z` : new Date().toISOString()
        })
        .eq('id', transaction.id)
      if (error) throw error
      toast.success('Transaction marked as refunded')
      loadTaxReport()
    } catch (error) {
      console.error('Refund error:', error)
      toast.error('Failed to mark as refunded')
    }
  }

  // ENHANCED: Function to open receipt in new tab
  const viewReceipt = (publicReceiptId: string) => {
    const receiptUrl = `${window.location.origin}/r/${publicReceiptId}`
    window.open(receiptUrl, '_blank', 'noopener,noreferrer')
  }

  const updateFilters = (updates: Partial<TaxReportFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const generateReport = async () => {
    if (!user) return
    setLoadingReport(true)
    try {
      const params = new URLSearchParams({
        user_id: user.id,
        report_type: filters.report_type,
        year: filters.year.toString(),
        quarter: filters.quarter.toString(),
        fiscal_year_start: filters.fiscal_year_start,
        tax_only: filters.tax_only.toString(),
        status: filters.status,
        export_format: 'json'
      })

      if (filters.report_type === 'custom') {
        params.append('start_date', `${filters.start_date}T00:00:00.000Z`)
        params.append('end_date', `${filters.end_date}T23:59:59.999Z`)
      }

      const response = await fetch(`/api/tax-reports?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate tax report')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate tax report')
      }

      setReportData(data.data)
      toast.success('Tax report generated successfully!')
    } catch (error) {
      console.error('❌ Error generating tax report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate tax report')
    } finally {
      setLoadingReport(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading tax reports...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <BackToDashboard />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Tax Reports</h1>
            <p className="text-lg text-gray-600 mt-2">Generate and export tax reports for your business</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={generateReport}
              disabled={loadingReport}
              className="flex items-center gap-2 font-medium"
            >
              {loadingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loadingReport ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5efd]"></div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] rounded-lg">
                    <Filter className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Report Filters</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-1">
                      Configure your tax report parameters
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Report Type</Label>
                    <Select value={filters.report_type} onValueChange={(value: any) => setFilters({ ...filters, report_type: value })}>
                      <SelectTrigger className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calendar_year">Calendar Year</SelectItem>
                        <SelectItem value="fiscal_year">Fiscal Year</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Year</Label>
                    <Select value={filters.year.toString()} onValueChange={(value) => setFilters({ ...filters, year: parseInt(value) })}>
                      <SelectTrigger className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.report_type === 'quarterly' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Quarter</Label>
                      <Select value={filters.quarter.toString()} onValueChange={(value) => setFilters({ ...filters, quarter: parseInt(value) })}>
                        <SelectTrigger className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                          <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                          <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                          <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                    <Select value={filters.status} onValueChange={(value: any) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Transactions</SelectItem>
                        <SelectItem value="confirmed">Confirmed Only</SelectItem>
                        <SelectItem value="refunded">Refunded Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filters.report_type === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Start Date</Label>
                      <Input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                        className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">End Date</Label>
                      <Input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filters.tax_only}
                    onCheckedChange={(checked) => setFilters({ ...filters, tax_only: checked as boolean })}
                    className="text-[#7f5efd]"
                  />
                  <Label className="text-sm font-medium text-gray-700">Show tax-only transactions</Label>
                </div>
              </CardContent>
            </Card>

            {/* Report Summary */}
            {reportData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Gross Sales</p>
                          <p className="text-2xl font-bold text-gray-900">${reportData.summary.total_gross_sales.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                          <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Tax Collected</p>
                          <p className="text-2xl font-bold text-gray-900">${reportData.summary.total_tax_collected.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                          <Calculator className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">${reportData.summary.total_net_revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Transactions</p>
                          <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_transactions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Export Options */}
                <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                          <Download className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900">Export Report</CardTitle>
                          <CardDescription className="text-base text-gray-600 mt-1">
                            Download your tax report in various formats
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={() => exportToCSV()}
                        disabled={exportingCSV}
                        className="h-12 text-base font-medium bg-[#7f5efd] hover:bg-[#6b4fd8] text-white flex items-center gap-2"
                      >
                        {exportingCSV ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        {exportingCSV ? 'Exporting...' : 'Export to CSV'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="h-12 text-base font-medium flex items-center gap-2"
                      >
                        <Printer className="h-5 w-5" />
                        Print Report
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setShowDetailedView(!showDetailedView)}
                        className="h-12 text-base font-medium flex items-center gap-2"
                      >
                        {showDetailedView ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        {showDetailedView ? 'Hide Details' : 'Show Details'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Transactions */}
                {showDetailedView && (
                  <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900">Transaction Details</CardTitle>
                          <CardDescription className="text-base text-gray-600 mt-1">
                            Detailed view of all transactions in this report
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                              <th className="text-right py-3 px-4 font-semibold text-gray-900">Gross Amount</th>
                              <th className="text-right py-3 px-4 font-semibold text-gray-900">Tax</th>
                              <th className="text-right py-3 px-4 font-semibold text-gray-900">Fees</th>
                              <th className="text-right py-3 px-4 font-semibold text-gray-900">Net Amount</th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.transactions.map((transaction) => (
                              <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {new Date(transaction.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                                  {transaction.product_description}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900 text-right">
                                  ${transaction.gross_amount.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600 text-right">
                                  ${transaction.tax_amount.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600 text-right">
                                  ${transaction.fees.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                                  ${transaction.net_amount.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge
                                    variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {transaction.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {transaction.public_receipt_id && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => viewReceipt(transaction.public_receipt_id!)}
                                        className="h-8 px-2 text-xs"
                                        title="View customer receipt"
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Receipt
                                      </Button>
                                    )}
                                    {transaction.status !== 'refunded' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAsRefunded(transaction)}
                                        className="h-8 px-2 text-xs"
                                        title="Mark as refunded"
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Refund
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* No Data State */}
            {!reportData && !loadingReport && (
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
                    <p className="text-gray-600 mb-6">Configure your filters and generate a tax report to see your data.</p>
                    <Button
                      onClick={generateReport}
                      disabled={loadingReport}
                      className="bg-[#7f5efd] hover:bg-[#6b4fd8] text-white font-medium"
                    >
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

