"use client"

import React, { useState, useEffect } from 'react'
import { useTimezone } from '@/lib/contexts/TimezoneContext'
import { formatDateShort } from '@/lib/utils/date-utils'

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation'
import {
  Calculator,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Receipt,
  Loader2,
  RefreshCw,
  ExternalLink,
  BarChart3,
  FileText,
  Eye,
  EyeOff,
  Printer,
  XCircle
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'

import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Badge } from '@/app/components/ui/badge'

import { supabase } from '@/lib/supabase-browser'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs'

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
  // Added link_id for payment link identification
  link_id: string | null
}

interface TaxReportData {
  transactions: Transaction[]
  summary: TransactionSummary
  filters: TaxReportFilters & { applied_date_range: { start_date: string; end_date: string } }
  total_count: number
}

export default function TaxReportsPage() {
  const router = useRouter()
  const { timezone } = useTimezone()

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
        loadInitialTransactions()
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
      // Start loading initial data after auth is complete
      setLoadingReport(true)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadInitialTransactions = async () => {
    if (!user) return

    try {
      setLoadingReport(true)
      console.log('📊 Loading initial transactions...')

      // Load just the last 5 transactions to start
      const params = new URLSearchParams({
        user_id: user.id,
        report_type: 'custom',
        start_date: '2020-01-01T00:00:00.000Z', // Wide date range
        end_date: new Date().toISOString(),
        status: 'all',
        export_format: 'json',
        limit: '5'
      })

      const response = await fetch(`/api/tax-reports?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load initial transactions')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load initial transactions')
      }

      console.log('✅ Initial transactions loaded:', data.data)
      setReportData(data.data)

    } catch (error) {
      console.error('❌ Error loading initial transactions:', error)
      // Don't show toast error for initial load - just quietly fail
      console.log('Continuing without initial data...')
    } finally {
      setLoadingReport(false)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
      <div className="px-6 py-8 space-y-8 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Transactions', href: '/merchant/dashboard/tax-reports' }
          ]} 
        />
        
        {/* Header */}
        <div className="flex items-center">
          <div>
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">Transactions</h1>
            <p className="font-phonic text-base font-normal text-gray-600 mt-2">View and manage all your transaction history</p>
          </div>
        </div>

        {loadingReport ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5efd]"></div>
          </div>
        ) : (
          <>
            {/* Report Summary Cards */}
            {reportData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-phonic text-sm font-normal text-gray-500">Gross Sales</p>
                        <p className="text-2xl font-bold text-gray-900">${reportData.summary.total_gross_sales.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                        <Receipt className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-phonic text-sm font-normal text-gray-500">Tax Collected</p>
                        <p className="text-2xl font-bold text-gray-900">${reportData.summary.total_tax_collected.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                        <Calculator className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-phonic text-sm font-normal text-gray-500">Net Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${reportData.summary.total_net_revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-phonic text-sm font-normal text-gray-500">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_transactions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Transactions */}
            {reportData && (
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Transaction Details</CardTitle>
                      <CardDescription className="font-phonic text-base font-normal text-gray-600 mt-1">
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
                          <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Date</th>
                          <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Description</th>
                          <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Link ID</th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Gross Amount</th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Tax</th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Fees</th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Net Amount</th>
                          <th className="text-center py-3 px-4 font-phonic text-base font-normal text-gray-900">Status</th>
                          <th className="text-center py-3 px-4 font-phonic text-base font-normal text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDateShort(transaction.created_at, timezone)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                              {transaction.product_description}
                            </td>
                            <td className="py-3 px-4 text-xs font-mono">
                              {transaction.link_id ? (
                                <span className="bg-[#7f5efd]/10 text-[#7f5efd] px-2 py-1 rounded">
                                  {transaction.link_id}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
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
                    
                    {/* View More button - only show if we have the initial 5 and there might be more */}
                    {reportData.transactions.length === 5 && reportData.total_count > 5 && (
                      <div className="flex justify-center pt-6 border-t border-gray-200 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => loadTaxReport()}
                          disabled={loadingReport}
                          className="font-phonic text-sm font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] flex items-center gap-2"
                        >
                          {loadingReport ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {loadingReport ? 'Loading...' : `View More (${reportData.total_count - 5} more)`}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters - Smaller and Less Intrusive */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <Filter className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Report Filters</CardTitle>
                    <CardDescription className="font-phonic text-base font-normal text-gray-600 mt-1">
                      Configure your tax report parameters
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="font-phonic text-sm font-normal text-gray-700">Report Type</Label>
                    <Select value={filters.report_type} onValueChange={(value: 'calendar_year' | 'fiscal_year' | 'quarterly' | 'custom') => setFilters({ ...filters, report_type: value })}>
                    <SelectTrigger className="form-input-enhanced">
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
                    <Label className="font-phonic text-sm font-normal text-gray-700">Year</Label>
                    <Select value={filters.year.toString()} onValueChange={(value) => setFilters({ ...filters, year: parseInt(value) })}>
                      <SelectTrigger className="form-input-enhanced">
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
                      <Label className="font-phonic text-sm font-normal text-gray-700">Quarter</Label>
                      <Select value={filters.quarter.toString()} onValueChange={(value) => setFilters({ ...filters, quarter: parseInt(value) })}>
                        <SelectTrigger className="form-input-enhanced">
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
                    <Label className="font-phonic text-sm font-normal text-gray-700">Status</Label>
                    <Select value={filters.status} onValueChange={(value: 'confirmed' | 'refunded' | 'all') => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="form-input-enhanced">
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
                      <Label className="font-phonic text-sm font-normal text-gray-700">Start Date</Label>
                      <Input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                        className="form-input-enhanced h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-phonic text-sm font-normal text-gray-700">End Date</Label>
                      <Input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        className="form-input-enhanced h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filters.tax_only}
                    onCheckedChange={(checked) => setFilters({ ...filters, tax_only: checked as boolean })}
                    className=""
                  />
                  <Label className="font-phonic text-sm font-normal text-gray-700">Show tax-only transactions</Label>
                </div>

                {/* Generate Report Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={generateReport}
                    disabled={loadingReport}
                    className="font-phonic text-base font-normal px-8 py-3 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white h-12 flex items-center gap-2"
                  >
                    {loadingReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {loadingReport ? 'Generating...' : 'Generate Report'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Report Section */}
            {reportData && (
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Export Report</CardTitle>
                      <CardDescription className="font-phonic text-base font-normal text-gray-600 mt-1">
                        Download your tax report in various formats
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => exportToCSV()}
                      disabled={exportingCSV}
                      className="font-phonic text-base font-normal px-8 py-3 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white h-12 flex items-center gap-2"
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
                      className="font-phonic text-base font-normal border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff] h-12 flex items-center gap-2"
                    >
                      <Printer className="h-5 w-5" />
                      Print Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {!reportData && !loadingReport && (
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-phonic text-2xl font-normal text-gray-900 mb-2">No Report Generated</h3>
                    <p className="font-phonic text-base font-normal text-gray-600 mb-6">Configure your filters and generate a tax report to see your data.</p>
                    <Button
                      onClick={generateReport}
                      disabled={loadingReport}
                      className="font-phonic text-base font-normal px-8 py-3 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
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
    );
  }

