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
  XCircle,
  Info
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
import { TransactionDetailModal } from '@/app/components/TransactionDetailModal'
import {
  generateTaxReportPDF,
  generateTaxReportExcel,
  generateEnhancedCSV,
  type ExportTransaction,
  type ExportSummary,
  type MerchantInfo,
  type ExportTemplate,
  type ExportOptions
} from '@/lib/utils/export-utils'

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
  fee_payer: 'merchant' | 'customer'
  net_amount: number
  status: string
  refund_amount: number
  refund_date: string | null
  // ENHANCED: Added public_receipt_id for receipt links
  public_receipt_id: string | null
  // Added link_id for payment link identification
  link_id: string | null
  // ENHANCED: Added blockchain verification fields
  tx_hash: string | null
  blockchain_network: string | null
  currency_received: string | null
  amount_received: number | null
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
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>('audit')

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

      // Fetch merchant info for exports
      const { data: merchant } = await supabase
        .from('merchants')
        .select('business_name')
        .eq('user_id', authUser.id)
        .single()

      if (merchant) {
        setMerchantInfo({
          business_name: merchant.business_name || 'Cryptrac Merchant',
          business_address: '',
          tax_id: '',
          contact_email: '',
          phone: '',
          website: ''
        })
      }

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

  const exportToCSV = async (template: ExportTemplate = 'audit') => {
    if (!user || !reportData || !merchantInfo) return

    try {
      setExportingCSV(true)
      console.log('📥 Exporting tax report to CSV...')

      const exportTransactions: ExportTransaction[] = reportData.transactions.map(tx => ({
        id: tx.id,
        payment_id: tx.payment_id,
        created_at: tx.created_at,
        product_description: tx.product_description,
        gross_amount: tx.gross_amount,
        tax_label: tx.tax_label,
        tax_percentage: tx.tax_percentage,
        tax_amount: tx.tax_amount,
        total_paid: tx.total_paid,
        fees: tx.fees,
        fee_payer: tx.fee_payer,
        net_amount: tx.net_amount,
        status: tx.status,
        refund_amount: tx.refund_amount,
        refund_date: tx.refund_date,
        public_receipt_id: tx.public_receipt_id,
        link_id: tx.link_id,
        tx_hash: tx.tx_hash,
        blockchain_network: tx.blockchain_network,
        currency_received: tx.currency_received,
        amount_received: tx.amount_received
      }))

      // Use actual date range based on filter type
      const dateRange = getActualDateRange(filters)

      const exportSummary: ExportSummary = {
        total_transactions: reportData.summary.total_transactions,
        total_gross_sales: reportData.summary.total_gross_sales,
        total_tax_collected: reportData.summary.total_tax_collected,
        total_fees: reportData.summary.total_fees,
        total_net_revenue: reportData.summary.total_net_revenue,
        date_range: dateRange,
        generated_at: new Date().toISOString()
      }

      const options: ExportOptions = {
        template,
        includeReceiptUrls: true,
        includeBlockchainLinks: true,
        timezone
      }

      const csvContent = generateEnhancedCSV(exportTransactions, exportSummary, merchantInfo, options)

      // Download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cryptrac-tax-report-${template}-${dateRange.start_date}-to-${dateRange.end_date}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('CSV report exported successfully!')

    } catch (error) {
      console.error('❌ Error exporting CSV report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export CSV report')
    } finally {
      setExportingCSV(false)
    }
  }

  const exportToPDF = async (template: ExportTemplate = 'audit') => {
    if (!reportData || !merchantInfo) return

    try {
      setExportingPDF(true)
      console.log('📄 Exporting tax report to PDF...')

      const exportTransactions: ExportTransaction[] = reportData.transactions.map(tx => ({
        id: tx.id,
        payment_id: tx.payment_id,
        created_at: tx.created_at,
        product_description: tx.product_description,
        gross_amount: tx.gross_amount,
        tax_label: tx.tax_label,
        tax_percentage: tx.tax_percentage,
        tax_amount: tx.tax_amount,
        total_paid: tx.total_paid,
        fees: tx.fees,
        fee_payer: tx.fee_payer,
        net_amount: tx.net_amount,
        status: tx.status,
        refund_amount: tx.refund_amount,
        refund_date: tx.refund_date,
        public_receipt_id: tx.public_receipt_id,
        link_id: tx.link_id,
        tx_hash: tx.tx_hash,
        blockchain_network: tx.blockchain_network,
        currency_received: tx.currency_received,
        amount_received: tx.amount_received
      }))

      // Use actual date range based on filter type
      const dateRange = getActualDateRange(filters)

      const exportSummary: ExportSummary = {
        total_transactions: reportData.summary.total_transactions,
        total_gross_sales: reportData.summary.total_gross_sales,
        total_tax_collected: reportData.summary.total_tax_collected,
        total_fees: reportData.summary.total_fees,
        total_net_revenue: reportData.summary.total_net_revenue,
        date_range: dateRange,
        generated_at: new Date().toISOString()
      }

      const options: ExportOptions = {
        template,
        includeReceiptUrls: true,
        includeBlockchainLinks: true,
        timezone
      }

      const pdfBlob = await generateTaxReportPDF(exportTransactions, exportSummary, merchantInfo, options)

      // Download the PDF file
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cryptrac-tax-report-${template}-${dateRange.start_date}-to-${dateRange.end_date}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF report exported successfully!')

    } catch (error) {
      console.error('❌ Error exporting PDF report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export PDF report')
    } finally {
      setExportingPDF(false)
    }
  }

  const exportToExcel = async (template: ExportTemplate = 'audit') => {
    if (!reportData || !merchantInfo) return

    try {
      setExportingExcel(true)
      console.log('📊 Exporting tax report to Excel...')

      const exportTransactions: ExportTransaction[] = reportData.transactions.map(tx => ({
        id: tx.id,
        payment_id: tx.payment_id,
        created_at: tx.created_at,
        product_description: tx.product_description,
        gross_amount: tx.gross_amount,
        tax_label: tx.tax_label,
        tax_percentage: tx.tax_percentage,
        tax_amount: tx.tax_amount,
        total_paid: tx.total_paid,
        fees: tx.fees,
        fee_payer: tx.fee_payer,
        net_amount: tx.net_amount,
        status: tx.status,
        refund_amount: tx.refund_amount,
        refund_date: tx.refund_date,
        public_receipt_id: tx.public_receipt_id,
        link_id: tx.link_id,
        tx_hash: tx.tx_hash,
        blockchain_network: tx.blockchain_network,
        currency_received: tx.currency_received,
        amount_received: tx.amount_received
      }))

      // Use actual date range based on filter type
      const dateRange = getActualDateRange(filters)

      const exportSummary: ExportSummary = {
        total_transactions: reportData.summary.total_transactions,
        total_gross_sales: reportData.summary.total_gross_sales,
        total_tax_collected: reportData.summary.total_tax_collected,
        total_fees: reportData.summary.total_fees,
        total_net_revenue: reportData.summary.total_net_revenue,
        date_range: dateRange,
        generated_at: new Date().toISOString()
      }

      const options: ExportOptions = {
        template,
        includeReceiptUrls: true,
        includeBlockchainLinks: true,
        timezone
      }

      const excelBlob = generateTaxReportExcel(exportTransactions, exportSummary, merchantInfo, options)

      // Download the Excel file
      const url = window.URL.createObjectURL(excelBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cryptrac-tax-report-${template}-${dateRange.start_date}-to-${dateRange.end_date}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Excel report exported successfully!')

    } catch (error) {
      console.error('❌ Error exporting Excel report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export Excel report')
    } finally {
      setExportingExcel(false)
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

  // Helper function to get the actual date range based on filter type
  const getActualDateRange = (filters: TaxReportFilters): { start_date: string, end_date: string } => {
    const currentYear = filters.year
    let startDate: Date
    let endDate: Date

    switch (filters.report_type) {
      case 'calendar_year':
        startDate = new Date(currentYear, 0, 1) // January 1st
        endDate = new Date(currentYear, 11, 31) // December 31st
        break

      case 'fiscal_year':
        const [month, day] = filters.fiscal_year_start.split('-').map(Number)
        startDate = new Date(currentYear, month - 1, day)
        endDate = new Date(currentYear + 1, month - 1, day - 1)
        break

      case 'quarterly':
        const quarterStartMonth = (filters.quarter - 1) * 3
        startDate = new Date(currentYear, quarterStartMonth, 1)
        endDate = new Date(currentYear, quarterStartMonth + 3, 0) // Last day of quarter
        break

      case 'custom':
        return {
          start_date: filters.start_date,
          end_date: filters.end_date
        }

      default:
        // Fallback to current year
        startDate = new Date(currentYear, 0, 1)
        endDate = new Date(currentYear, 11, 31)
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    }
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
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
        
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
              Tax Reports & Transactions
            </h1>
            <p className="font-phonic text-base font-normal text-gray-600">View and manage all your transaction history</p>
          </div>
        </div>

        {loadingReport ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
          </div>
        ) : (
          <>
            {/* Enhanced Statistics Cards */}
            {reportData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Gross Sales</CardTitle>
                    <div className="p-2 bg-[#7f5efd] rounded-lg">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-semibold mb-2 text-gray-900">${reportData.summary.total_gross_sales.toFixed(2)}</div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-capsule text-xs">Total revenue before fees</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Tax Collected</CardTitle>
                    <div className="p-2 bg-[#7f5efd] rounded-lg">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-semibold mb-2 text-gray-900">${reportData.summary.total_tax_collected.toFixed(2)}</div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calculator className="h-3 w-3" />
                      <span className="font-capsule text-xs">Tax from all transactions</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Net Revenue</CardTitle>
                    <div className="p-2 bg-[#7f5efd] rounded-lg">
                      <Calculator className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-semibold mb-2 text-gray-900">${reportData.summary.total_net_revenue.toFixed(2)}</div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-capsule text-xs">After fees and costs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Transactions</CardTitle>
                    <div className="p-2 bg-[#7f5efd] rounded-lg">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-semibold mb-2 text-gray-900">{reportData.summary.total_transactions}</div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <BarChart3 className="h-3 w-3" />
                      <span className="font-capsule text-xs">Total processed</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Transactions */}
            {reportData && (
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                        Transaction Details
                        <Badge variant="outline" className="bg-[#7f5efd]/10 text-[#7f5efd] border-[#7f5efd]/20">
                          {reportData.transactions.length}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="font-capsule text-sm text-gray-600">
                        Select any transaction for a detailed view
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Date</th>
                          <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Description</th>
                          <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Link ID</th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Gross Amount</th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Tax</th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">
                            <div className="flex items-center justify-end gap-1">
                              Fees
                              <div className="group relative">
                                <Info className="h-3 w-3 text-gray-400" />
                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                  Shows who paid the gateway fee
                                </div>
                              </div>
                            </div>
                          </th>
                          <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Net Amount</th>
                          <th className="text-center py-3 px-4 font-phonic text-base font-normal text-gray-900">Status</th>
                          <th className="text-center py-3 px-4 font-phonic text-base font-normal text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleTransactionClick(transaction)}
                          >
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDateShort(transaction.created_at, timezone)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                              <div className="flex items-center gap-2">
                                {transaction.product_description}
                                {transaction.tx_hash && (
                                  <span className="text-green-500" title="Blockchain verified">
                                    <ExternalLink className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
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
                              <div className="flex flex-col items-end">
                                <span>${transaction.fees.toFixed(2)}</span>
                                {transaction.fee_payer && (
                                  <span className="text-xs text-gray-400 mt-1">
                                    {transaction.fee_payer === 'customer' ? 'Customer paid' : 'Merchant paid'}
                                  </span>
                                )}
                              </div>
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
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      viewReceipt(transaction.public_receipt_id!)
                                    }}
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
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsRefunded(transaction)
                                    }}
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
                          className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200 flex items-center gap-2"
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
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                      Report Filters
                    </CardTitle>
                    <CardDescription className="font-capsule text-sm text-gray-600">
                      Configure your tax report parameters
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="font-phonic text-sm font-normal text-gray-700">Report Type</Label>
                    <Select value={filters.report_type} onValueChange={(value: 'calendar_year' | 'fiscal_year' | 'quarterly' | 'custom') => setFilters({ ...filters, report_type: value })}>
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
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
                      <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
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
                        <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
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
                      <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
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
                        className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-phonic text-sm font-normal text-gray-700">End Date</Label>
                      <Input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
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
                    size="default"
                    className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center gap-2"
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
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                        Export Report
                      </CardTitle>
                      <CardDescription className="font-capsule text-sm text-gray-600">
                        Download your tax report in multiple formats with different templates for various use cases
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label className="font-phonic text-sm font-normal text-gray-700">Report Template</Label>
                    <Select value={selectedTemplate} onValueChange={(value: ExportTemplate) => setSelectedTemplate(value)}>
                      <SelectTrigger className="w-full md:w-64 h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="audit">Audit Template - Full transaction details</SelectItem>
                        <SelectItem value="tax_filing">Tax Filing - IRS compliant format</SelectItem>
                        <SelectItem value="accounting">Accounting - QuickBooks ready</SelectItem>
                        <SelectItem value="summary">Summary - Executive overview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Export Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CSV Export Button */}
                    <Button
                      disabled={exportingCSV}
                      size="default"
                      onClick={() => exportToCSV(selectedTemplate)}
                      className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center gap-2"
                    >
                      {exportingCSV ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {exportingCSV ? 'Exporting...' : 'Export CSV'}
                    </Button>

                    {/* PDF Export Button */}
                    <Button
                      disabled={exportingPDF}
                      size="default"
                      onClick={() => exportToPDF(selectedTemplate)}
                      className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center gap-2"
                    >
                      {exportingPDF ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {exportingPDF ? 'Generating...' : 'Export PDF'}
                    </Button>

                    {/* Excel Export Button */}
                    <Button
                      disabled={exportingExcel}
                      size="default"
                      onClick={() => exportToExcel(selectedTemplate)}
                      className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center gap-2"
                    >
                      {exportingExcel ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BarChart3 className="h-4 w-4" />
                      )}
                      {exportingExcel ? 'Generating...' : 'Export Excel'}
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
                    <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
                    <p className="font-capsule text-sm text-gray-500 mb-6">Configure your filters and generate a tax report to see your data</p>
                    <Button
                      onClick={generateReport}
                      disabled={loadingReport}
                      size="default"
                      className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
                    >
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Transaction Detail Modal */}
        <TransactionDetailModal
          open={showTransactionModal}
          onOpenChange={setShowTransactionModal}
          transaction={selectedTransaction}
          timezone={timezone}
        />
        </div>
    );
  }

