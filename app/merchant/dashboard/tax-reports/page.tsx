"use client"

import React, { useState, useEffect } from 'react'
import { useTimezone } from '@/lib/contexts/TimezoneContext'
import { formatDateShort, formatFullDate } from '@/lib/utils/date-utils'

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Receipt,
  Loader2,
  RefreshCw,
  ExternalLink,
  BarChart3,
  FileText,
  Eye,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog'

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
  updated_at: string
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
  payment_confirmed_at: string | null
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
  const [exportReportData, setExportReportData] = useState<TaxReportData | null>(null)
  const [displayReportData, setDisplayReportData] = useState<TaxReportData | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>('audit')

  // DECOUPLING: State for transactions displayed in the UI
  const [transactionsForDisplay, setTransactionsForDisplay] = useState<Transaction[]>([])
  const [displayLimit, setDisplayLimit] = useState(5)

  // Transaction filtering states
  const [transactionStartDate, setTransactionStartDate] = useState<string>('')
  const [transactionEndDate, setTransactionEndDate] = useState<string>('')
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])

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
      setExportReportData(data.data)
      setDisplayReportData(data.data)
      // DECOUPLING: Set both display transactions and filtered transactions
      setTransactionsForDisplay(data.data.transactions)
      setFilteredTransactions(data.data.transactions)

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
      setExportReportData(data.data)
      setDisplayReportData(data.data)
      // DECOUPLING: Update display transactions since this is a user action to load more transactions
      setTransactionsForDisplay(data.data.transactions)
      setFilteredTransactions(data.data.transactions)
      // Clear transaction date filters when loading new report
      setTransactionStartDate('')
      setTransactionEndDate('')

    } catch (error) {
      console.error('❌ Error loading tax report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load tax report')
    } finally {
      setLoadingReport(false)
    }
  }

  const exportToCSV = async (template: ExportTemplate = 'audit') => {
    if (!user || !exportReportData || !merchantInfo) return

    try {
      setExportingCSV(true)
      console.log('📥 Exporting tax report to CSV...')

      const exportTransactions: ExportTransaction[] = exportReportData.transactions.map(tx => ({
        id: tx.id,
        payment_id: tx.payment_id,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
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
        amount_received: tx.amount_received,
        payment_confirmed_at: tx.payment_confirmed_at
      }))

      // Use actual date range based on filter type
      const dateRange = getActualDateRange(filters)

      const exportSummary: ExportSummary = {
        total_transactions: exportReportData.summary.total_transactions,
        total_gross_sales: exportReportData.summary.total_gross_sales,
        total_tax_collected: exportReportData.summary.total_tax_collected,
        total_fees: exportReportData.summary.total_fees,
        total_net_revenue: exportReportData.summary.total_net_revenue,
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
    if (!exportReportData || !merchantInfo) return

    try {
      setExportingPDF(true)
      console.log('📄 Exporting tax report to PDF...')

      const exportTransactions: ExportTransaction[] = exportReportData.transactions.map(tx => ({
        id: tx.id,
        payment_id: tx.payment_id,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
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
        amount_received: tx.amount_received,
        payment_confirmed_at: tx.payment_confirmed_at
      }))

      // Use actual date range based on filter type
      const dateRange = getActualDateRange(filters)

      const exportSummary: ExportSummary = {
        total_transactions: exportReportData.summary.total_transactions,
        total_gross_sales: exportReportData.summary.total_gross_sales,
        total_tax_collected: exportReportData.summary.total_tax_collected,
        total_fees: exportReportData.summary.total_fees,
        total_net_revenue: exportReportData.summary.total_net_revenue,
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
    if (!exportReportData || !merchantInfo) return

    try {
      setExportingExcel(true)
      console.log('📊 Exporting tax report to Excel...')

      const exportTransactions: ExportTransaction[] = exportReportData.transactions.map(tx => ({
        id: tx.id,
        payment_id: tx.payment_id,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
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
        amount_received: tx.amount_received,
        payment_confirmed_at: tx.payment_confirmed_at
      }))

      // Use actual date range based on filter type
      const dateRange = getActualDateRange(filters)

      const exportSummary: ExportSummary = {
        total_transactions: exportReportData.summary.total_transactions,
        total_gross_sales: exportReportData.summary.total_gross_sales,
        total_tax_collected: exportReportData.summary.total_tax_collected,
        total_fees: exportReportData.summary.total_fees,
        total_net_revenue: exportReportData.summary.total_net_revenue,
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

  const [selectedRefundTransaction, setSelectedRefundTransaction] = useState<Transaction | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundDate, setRefundDate] = useState(new Date().toISOString().split('T')[0])

  const handleRefundConfirm = async () => {
    if (!selectedRefundTransaction || !user) return
    try {
      const parsedAmount = parseFloat(refundAmount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error('Invalid refund amount')
        return
      }
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'refunded',
          refund_amount: parsedAmount,
          refunded_at: `${refundDate}T00:00:00.000Z`
        })
        .eq('id', selectedRefundTransaction.id)
      if (error) throw error
      toast.success('Transaction marked as refunded')
      setShowRefundModal(false)
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

  const getTransactionTimestamp = (transaction: Transaction): string => {
    if (transaction.payment_confirmed_at) {
      return transaction.payment_confirmed_at
    }

    if ((transaction.status === 'confirmed' || transaction.status === 'finished' || transaction.status === 'sending') && transaction.updated_at) {
      return transaction.updated_at
    }

    return transaction.created_at
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

  // Filter transactions by date range
  const filterTransactionsByDate = () => {
    // DECOUPLING: Use transactionsForDisplay as the source of truth, not reportData
    if (!transactionsForDisplay) return

    if (!transactionStartDate && !transactionEndDate) {
      setFilteredTransactions(transactionsForDisplay)
      return
    }

    const filtered = transactionsForDisplay.filter(tx => {
      const txDate = new Date(getTransactionTimestamp(tx))
      const txDateStr = txDate.toLocaleDateString('sv-SE', { timeZone: timezone })

      const startMatch = !transactionStartDate || txDateStr >= transactionStartDate
      const endMatch = !transactionEndDate || txDateStr <= transactionEndDate

      return startMatch && endMatch
    })

    setFilteredTransactions(filtered)
  }

  // Apply date filters when they change
  useEffect(() => {
    filterTransactionsByDate()
  }, [transactionStartDate, transactionEndDate, transactionsForDisplay]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear transaction date filters
  const clearTransactionFilters = () => {
    setTransactionStartDate('')
    setTransactionEndDate('')
    // DECOUPLING: Reset to the full list of transactions for display
    setFilteredTransactions(transactionsForDisplay)
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

      // DECOUPLING: Only update reportData, not the displayed transactions
      setExportReportData(data.data)
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

        {/* REFACTOR: Remove full-page loader to prevent page jump */}
        <>
          {/* Enhanced Statistics Cards */}
          {displayReportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Gross Sales</CardTitle>
                  <div className="p-2 bg-[#7f5efd] rounded-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold mb-2 text-gray-900">${displayReportData.summary.total_gross_sales.toFixed(2)}</div>
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
                  <div className="text-2xl font-semibold mb-2 text-gray-900">${displayReportData.summary.total_tax_collected.toFixed(2)}</div>
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
                  <div className="text-2xl font-semibold mb-2 text-gray-900">${displayReportData.summary.total_net_revenue.toFixed(2)}</div>
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
                  <div className="text-2xl font-semibold mb-2 text-gray-900">{displayReportData.summary.total_transactions}</div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <BarChart3 className="h-3 w-3" />
                    <span className="font-capsule text-xs">Total processed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Transactions */}
          {displayReportData && (
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                        Transaction Details
                        <Badge variant="outline" className="bg-[#7f5efd]/10 text-[#7f5efd] border-[#7f5efd]/20">
                          {filteredTransactions.length}
                          {filteredTransactions.length !== displayReportData.transactions.length && (
                            <span className="text-xs"> / {displayReportData.transactions.length}</span>
                          )}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="font-capsule text-sm text-gray-600">
                        Select any transaction for a detailed view
                      </CardDescription>
                    </div>
                  </div>

                  {/* Date Filter Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tx-start-date" className="font-capsule text-xs text-gray-500 whitespace-nowrap">
                          From:
                        </Label>
                        <Input
                          id="tx-start-date"
                          type="date"
                          value={transactionStartDate}
                          onChange={(e) => setTransactionStartDate(e.target.value)}
                          max={transactionEndDate || undefined}
                          className="h-9 text-sm bg-white border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                          placeholder="Start date"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tx-end-date" className="font-capsule text-xs text-gray-500 whitespace-nowrap">
                          To:
                        </Label>
                        <Input
                          id="tx-end-date"
                          type="date"
                          value={transactionEndDate}
                          onChange={(e) => setTransactionEndDate(e.target.value)}
                          min={transactionStartDate || undefined}
                          className="h-9 text-sm bg-white border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                          placeholder="End date"
                        />
                      </div>

                      {/* REFACTOR: Moved Show dropdown here */}
                      {filteredTransactions.length > 5 && (
                        <div className="flex items-center gap-2">
                          <Label className="font-capsule text-xs text-gray-600">Show</Label>
                          <Select value={displayLimit.toString()} onValueChange={(value) => setDisplayLimit(Number(value))}>
                            <SelectTrigger className="w-20 h-9 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value={filteredTransactions.length.toString()}>All</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {(transactionStartDate || transactionEndDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearTransactionFilters}
                        className="h-9 px-3 text-xs hover:bg-[#7f5efd]/10 hover:text-[#7f5efd] transition-colors"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Link ID</th>
                        <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Gross Amount</th>
                        <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Tax</th>
                        <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Fees</th>
                        <th className="text-right py-3 px-4 font-phonic text-base font-normal text-gray-900">Net Amount</th>
                        <th className="text-center py-3 px-4 font-phonic text-base font-normal text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-phonic text-base font-normal text-gray-900">Description</th>
                        <th className="text-center py-3 px-4 font-phonic text-base font-normal text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="p-3 bg-gray-50 rounded-full">
                                <FileText className="h-6 w-6 text-gray-400" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-phonic text-sm font-medium text-gray-600">
                                  No transactions found
                                </p>
                                <p className="font-capsule text-xs text-gray-500">
                                  Try adjusting your date filters
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.slice(0, displayLimit).map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleTransactionClick(transaction)}
                        >
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDateShort(getTransactionTimestamp(transaction), timezone)}
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
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                            {transaction.product_description}
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
                                  className="h-8 px-2 text-xs hover:bg-[#7f5efd] hover:text-white"
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
                                    setSelectedRefundTransaction(transaction)
                                    setRefundAmount(transaction.total_paid.toString())
                                    setRefundDate(new Date().toISOString().split('T')[0])
                                    setShowRefundModal(true)
                                  }}
                                  className="h-8 px-2 text-xs hover:bg-[#7f5efd] hover:text-white"
                                  title="Mark as refunded"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Refund
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  
                  <div className="flex flex-col items-center gap-4 pt-6 border-t border-gray-200 mt-6">
                    {/* Load all transactions button */}
                    {displayReportData && displayReportData.transactions.length < displayReportData.total_count && (
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
                        {loadingReport ? 'Loading...' : `View All Transactions (${displayReportData.total_count})`}
                      </Button>
                    )}

                    {/* REFACTOR: Removed Show dropdown from here */}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Combined Report Configuration & Export */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                    Report Configuration
                    {exportReportData && (
                      <Badge variant="outline" className="bg-[#7f5efd]/10 text-[#7f5efd] border-[#7f5efd]/20">
                        Ready to Export
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="font-capsule text-sm text-gray-600">
                    Configure parameters and export your tax report in multiple formats
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              {/* Filter Section */}
              <div>
                <h3 className="font-phonic text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[#7f5efd]" />
                  Report Filters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="font-capsule text-xs text-gray-600">Report Type</Label>
                    <Select value={filters.report_type} onValueChange={(value: 'calendar_year' | 'fiscal_year' | 'quarterly' | 'custom') => setFilters({ ...filters, report_type: value })}>
                      <SelectTrigger className="w-full h-10 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 text-sm">
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
                    <Label className="font-capsule text-xs text-gray-600">Year</Label>
                    <Select value={filters.year.toString()} onValueChange={(value) => setFilters({ ...filters, year: parseInt(value) })}>
                      <SelectTrigger className="w-full h-10 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 text-sm">
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
                      <Label className="font-capsule text-xs text-gray-600">Quarter</Label>
                      <Select value={filters.quarter.toString()} onValueChange={(value) => setFilters({ ...filters, quarter: parseInt(value) })}>
                        <SelectTrigger className="w-full h-10 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 text-sm">
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
                    <Label className="font-capsule text-xs text-gray-600">Status</Label>
                    <Select value={filters.status} onValueChange={(value: 'confirmed' | 'refunded' | 'all') => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="w-full h-10 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 text-sm">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="font-capsule text-xs text-gray-600">Start Date</Label>
                      <Input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                        className="w-full h-10 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-capsule text-xs text-gray-600">End Date</Label>
                      <Input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        className="w-full h-10 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.tax_only}
                      onCheckedChange={(checked) => setFilters({ ...filters, tax_only: checked as boolean })}
                      className="border-gray-300"
                    />
                    <Label className="font-capsule text-sm text-gray-700 cursor-pointer">Show tax-only transactions</Label>
                  </div>

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
              </div>

              {/* Export Section - Only show when report data is available */}
              {exportReportData && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-phonic text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#7f5efd]" />
                      Export Options
                    </h3>

                    {/* REFACTOR: Improved alignment for export controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
                      {/* Template Selection */}
                      <div className="space-y-2">
                        <Label className="font-capsule text-xs text-gray-600">Export Template</Label>
                        <Select value={selectedTemplate} onValueChange={(value: ExportTemplate) => setSelectedTemplate(value)}>
                          <SelectTrigger className="w-full lg:w-[calc(50%-0.75rem)] h-10 bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 text-sm">
                            <SelectValue className="text-left" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="audit">Audit Template - Full transaction details</SelectItem>
                            <SelectItem value="tax_filing">Tax Filing - IRS compliant format</SelectItem>
                            <SelectItem value="accounting">Accounting - QuickBooks ready</SelectItem>
                            <SelectItem value="summary">Summary - Executive overview</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="font-capsule text-xs text-gray-500 mt-1">
                          Choose a template based on your intended use
                        </p>
                      </div>

                      {/* Export Buttons */}
                      <div className="space-y-2">
                        <Label className="font-capsule text-xs text-gray-600 text-center block lg:text-left">Export Report</Label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            disabled={exportingCSV}
                            size="default"
                            onClick={() => exportToCSV(selectedTemplate)}
                            variant="outline"
                            className="border-[#7f5efd]/20 hover:bg-[#7f5efd]/10 hover:border-[#7f5efd] text-[#7f5efd] flex items-center gap-2"
                          >
                            {exportingCSV ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            {exportingCSV ? 'Exporting...' : 'CSV'}
                          </Button>

                          <Button
                            disabled={exportingPDF}
                            size="default"
                            onClick={() => exportToPDF(selectedTemplate)}
                            variant="outline"
                            className="border-[#7f5efd]/20 hover:bg-[#7f5efd]/10 hover:border-[#7f5efd] text-[#7f5efd] flex items-center gap-2"
                          >
                            {exportingPDF ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            {exportingPDF ? 'Generating...' : 'PDF'}
                          </Button>

                          <Button
                            disabled={exportingExcel}
                            size="default"
                            onClick={() => exportToExcel(selectedTemplate)}
                            variant="outline"
                            className="border-[#7f5efd]/20 hover:bg-[#7f5efd]/10 hover:border-[#7f5efd] text-[#7f5efd] flex items-center gap-2"
                          >
                            {exportingExcel ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <BarChart3 className="h-4 w-4" />
                            )}
                            {exportingExcel ? 'Generating...' : 'Excel'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Report Date Range Info */}
                  <div className="bg-[#7f5efd]/10 border border-[#7f5efd]/20 rounded-lg p-4 flex items-start gap-3">
                    <Info className="h-4 w-4 text-[#7f5efd] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-capsule text-xs text-gray-700">
                        Current report includes transactions from{' '}
                        <span className="font-semibold">
                          {formatFullDate(exportReportData.filters.applied_date_range?.start_date || getActualDateRange(filters).start_date, timezone)}
                        </span>{' '}
                        to{' '}
                        <span className="font-semibold">
                          {formatFullDate(exportReportData.filters.applied_date_range?.end_date || getActualDateRange(filters).end_date, timezone)}
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* No Data State */}
          {!displayReportData && !loadingReport && (
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
        

        {/* Transaction Detail Modal */}
        <TransactionDetailModal
          open={showTransactionModal}
          onOpenChange={setShowTransactionModal}
          transaction={selectedTransaction}
          timezone={timezone}
        />

        {/* Refund Modal */}
        <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
          <DialogContent className="sm:max-w-md bg-white border-[#7f5efd] shadow-xl rounded-lg">
            <DialogHeader className="pb-4 border-b border-[#7f5efd]/20">
              <DialogTitle className="font-phonic text-xl font-bold text-gray-900 mb-1">
                Mark as Refunded
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="refund-amount" className="text-right">
                  Refund Amount
                </Label>
                <Input
                  id="refund-amount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="refund-date" className="text-right">
                  Refund Date
                </Label>
                <Input
                  id="refund-date"
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-[#7f5efd]/20 pt-4">
              <Button variant="outline" onClick={() => setShowRefundModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleRefundConfirm}>Confirm Refund</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
    );
  }
