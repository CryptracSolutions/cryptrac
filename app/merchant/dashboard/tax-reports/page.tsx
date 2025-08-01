"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calculator,
  Download,
  Calendar,
  Filter,
  FileText,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
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

interface TaxReportFilters {
  start_date: string
  end_date: string
  report_type: 'calendar_year' | 'fiscal_year' | 'quarterly' | 'custom'
  year: number
  quarter: number
  fiscal_year_start: string
  tax_only: boolean
}

interface TransactionSummary {
  total_transactions: number
  total_revenue: number
  total_tax_collected: number
  tax_breakdown: Record<string, number>
  transactions_with_tax: number
  transactions_without_tax: number
  average_tax_rate: number
}

interface Transaction {
  id: string
  payment_id: string
  order_id: string
  customer_email: string
  amount: number
  base_amount: number
  currency: string
  crypto_amount: number
  crypto_currency: string
  status: string
  tax_enabled: boolean
  tax_amount: number
  tax_rates: Array<{ label: string; percentage: number }>
  tax_breakdown: Record<string, number>
  created_at: string
}

interface TaxReportData {
  transactions: Transaction[]
  summary: TransactionSummary
  filters: TaxReportFilters & { applied_date_range: { start_date: string; end_date: string } }
  total_count: number
}

export default function TaxReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<TaxReportData | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)

  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

  const [filters, setFilters] = useState<TaxReportFilters>({
    start_date: `${currentYear}-01-01`,
    end_date: new Date().toISOString().split('T')[0],
    report_type: 'calendar_year',
    year: currentYear,
    quarter: currentQuarter,
    fiscal_year_start: '01-01',
    tax_only: false
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadTaxReport()
    }
  }, [user])

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

  const updateFilters = (updates: Partial<TaxReportFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-8 w-8" />
              Tax Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Generate comprehensive tax reports for your business
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={loadTaxReport}
              disabled={loadingReport}
              variant="outline"
            >
              {loadingReport ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            
            <Button
              onClick={exportToCSV}
              disabled={exportingCSV || !reportData}
            >
              {exportingCSV ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <CardDescription>
              Configure your tax report parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={filters.report_type}
                  onValueChange={(value: any) => updateFilters({ report_type: value })}
                >
                  <SelectTrigger>
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

              {/* Year */}
              {(filters.report_type === 'calendar_year' || filters.report_type === 'fiscal_year' || filters.report_type === 'quarterly') && (
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select
                    value={filters.year.toString()}
                    onValueChange={(value) => updateFilters({ year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quarter */}
              {filters.report_type === 'quarterly' && (
                <div className="space-y-2">
                  <Label>Quarter</Label>
                  <Select
                    value={filters.quarter.toString()}
                    onValueChange={(value) => updateFilters({ quarter: parseInt(value) })}
                  >
                    <SelectTrigger>
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

              {/* Fiscal Year Start */}
              {filters.report_type === 'fiscal_year' && (
                <div className="space-y-2">
                  <Label>Fiscal Year Start</Label>
                  <Select
                    value={filters.fiscal_year_start}
                    onValueChange={(value) => updateFilters({ fiscal_year_start: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01-01">January 1st</SelectItem>
                      <SelectItem value="04-01">April 1st</SelectItem>
                      <SelectItem value="07-01">July 1st</SelectItem>
                      <SelectItem value="10-01">October 1st</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Custom Date Range */}
            {filters.report_type === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => updateFilters({ start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => updateFilters({ end_date: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Additional Filters */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tax_only"
                checked={filters.tax_only}
                onCheckedChange={(checked) => updateFilters({ tax_only: checked === true })}
              />
              <Label htmlFor="tax_only">
                Show only transactions with tax
              </Label>
            </div>

            {/* Apply Filters Button */}
            <Button onClick={loadTaxReport} disabled={loadingReport}>
              {loadingReport ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold">{reportData.summary.total_transactions}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.total_revenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tax Collected</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.total_tax_collected)}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Tax Rate</p>
                    <p className="text-2xl font-bold">{reportData.summary.average_tax_rate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tax Breakdown */}
        {reportData && Object.keys(reportData.summary.tax_breakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tax Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of taxes collected by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(reportData.summary.tax_breakdown).map(([taxType, amount]) => (
                  <div key={taxType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize">
                      {taxType.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        {reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                {reportData.total_count} transactions found
                {filters.tax_only && ' (tax transactions only)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-600">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Payment ID</th>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-right p-2">Base Amount</th>
                        <th className="text-right p-2">Tax</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{formatDate(transaction.created_at)}</td>
                          <td className="p-2 font-mono text-xs">{transaction.payment_id}</td>
                          <td className="p-2">{transaction.customer_email || 'N/A'}</td>
                          <td className="p-2 text-right">{formatCurrency(transaction.base_amount || transaction.amount)}</td>
                          <td className="p-2 text-right">
                            {transaction.tax_enabled ? formatCurrency(transaction.tax_amount) : '-'}
                          </td>
                          <td className="p-2 text-right font-medium">{formatCurrency(transaction.amount)}</td>
                          <td className="p-2 text-center">
                            <Badge variant={transaction.status === 'finished' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Important Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This report is for informational purposes only. 
            Cryptrac helps you track and report taxes but does not file or remit taxes. 
            Please consult with a tax professional for compliance requirements in your jurisdiction.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  )
}

