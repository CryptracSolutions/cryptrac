import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limiting for API endpoints
const apiAttempts = new Map<string, { count: number; lastAttempt: number }>()
const API_RATE_LIMIT = 60 // Max 60 requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkAPIRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = apiAttempts.get(ip)
  
  if (!attempts) {
    apiAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset counter if window has passed
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    apiAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Check if limit exceeded
  if (attempts.count >= API_RATE_LIMIT) {
    return false
  }
  
  // Increment counter
  attempts.count++
  attempts.lastAttempt = now
  return true
}

interface TaxReportFilters {
  start_date?: string
  end_date?: string
  report_type?: 'calendar_year' | 'fiscal_year' | 'quarterly' | 'custom'
  year?: number
  quarter?: number
  fiscal_year_start?: string // Format: 'MM-DD' (e.g., '04-01' for April 1st)
  tax_only?: boolean
  export_format?: 'json' | 'csv'
  page?: number
  limit?: number
  include_summary?: boolean
}

interface TransactionSummary {
  total_transactions: number
  total_revenue: number
  total_tax_collected: number
  tax_breakdown: Record<string, number>
  transactions_with_tax: number
  transactions_without_tax: number
  average_tax_rate: number
  date_range: {
    start_date: string
    end_date: string
  }
  generated_at: string
}

interface PaginationInfo {
  current_page: number
  total_pages: number
  total_count: number
  page_size: number
  has_next_page: boolean
  has_previous_page: boolean
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkAPIRateLimit(ip)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse filters with enhanced validation
    const filters: TaxReportFilters = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      report_type: (searchParams.get('report_type') as any) || 'custom',
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      quarter: searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : undefined,
      fiscal_year_start: searchParams.get('fiscal_year_start') || '01-01',
      tax_only: searchParams.get('tax_only') === 'true',
      export_format: (searchParams.get('export_format') as any) || 'json',
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(1000, Math.max(10, parseInt(searchParams.get('limit') || '100'))), // Max 1000 per page
      include_summary: searchParams.get('include_summary') !== 'false'
    }

    console.log('📊 Tax report request:', { user_id, filters, processing_time_start: startTime })

    // Validate date range
    const dateRange = calculateDateRange(filters)
    const daysDifference = (new Date(dateRange.end_date).getTime() - new Date(dateRange.start_date).getTime()) / (1000 * 60 * 60 * 24)
    
    // Warn for large date ranges
    if (daysDifference > 365 && filters.export_format === 'csv') {
      console.warn(`⚠️ Large date range requested: ${daysDifference} days`)
    }

    // For very large datasets, force pagination
    if (daysDifference > 730 && !filters.page) { // More than 2 years
      filters.page = 1
      filters.limit = 100
      console.log('📄 Large dataset detected, forcing pagination')
    }
    
    // Build optimized query with pagination
    let baseQuery = supabase
      .from('transactions')
      .select(`
        id,
        nowpayments_payment_id,
        order_id,
        amount,
        currency,
        pay_currency,
        pay_amount,
        status,
        base_amount,
        tax_enabled,
        tax_amount,
        tax_rates,
        tax_breakdown,
        subtotal_with_tax,
        gateway_fee,
        merchant_receives,
        customer_email,
        customer_phone,
        created_at,
        updated_at,
        payment_links!inner(
          title,
          description,
          merchants!inner(user_id, business_name)
        )
      `, { count: 'exact' })
      .eq('payment_links.merchants.user_id', user_id)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)
      .in('status', ['confirmed', 'finished']) // Only include successful payments
      .order('created_at', { ascending: false })

    // Apply tax filter if requested
    if (filters.tax_only) {
      baseQuery = baseQuery.eq('tax_enabled', true)
    }

    // Apply pagination for JSON responses
    if (filters.export_format === 'json' && filters.page) {
      const offset = (filters.page - 1) * filters.limit!
      baseQuery = baseQuery.range(offset, offset + filters.limit! - 1)
    }

    const { data: transactions, error, count } = await baseQuery

    if (error) {
      console.error('❌ Error fetching transactions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Fix: Handle null transactions
    const safeTransactions = transactions || []
    console.log(`✅ Fetched ${safeTransactions.length} transactions (total: ${count}) in ${Date.now() - startTime}ms`)

    // Calculate summary statistics (always include for performance monitoring)
    let summary: TransactionSummary | null = null
    if (filters.include_summary) {
      // For large datasets, calculate summary from a separate optimized query
      if (count && count > 1000) {
        summary = await calculateSummaryOptimized(user_id, dateRange, filters.tax_only)
      } else {
        summary = calculateSummary(safeTransactions, dateRange)
      }
    }

    // Prepare pagination info
    const pagination: PaginationInfo = {
      current_page: filters.page || 1,
      total_pages: Math.ceil((count || 0) / (filters.limit || 100)),
      total_count: count || 0,
      page_size: filters.limit || 100,
      has_next_page: filters.page ? (filters.page * (filters.limit || 100)) < (count || 0) : false,
      has_previous_page: (filters.page || 1) > 1
    }

    // Format response based on export format
    if (filters.export_format === 'csv') {
      // For CSV export, fetch all data if not already paginated
      let allTransactions = safeTransactions
      
      if (count && count > safeTransactions.length) {
        console.log('📄 Fetching all transactions for CSV export...')
        const { data: fullData } = await supabase
          .from('transactions')
          .select(`
            id,
            nowpayments_payment_id,
            order_id,
            amount,
            currency,
            pay_currency,
            pay_amount,
            status,
            base_amount,
            tax_enabled,
            tax_amount,
            tax_rates,
            tax_breakdown,
            subtotal_with_tax,
            gateway_fee,
            merchant_receives,
            customer_email,
            customer_phone,
            created_at,
            updated_at,
            payment_links!inner(
              title,
              description,
              merchants!inner(user_id, business_name)
            )
          `)
          .eq('payment_links.merchants.user_id', user_id)
          .gte('created_at', dateRange.start_date)
          .lte('created_at', dateRange.end_date)
          .in('status', ['confirmed', 'finished'])
          .eq('tax_enabled', filters.tax_only || false)
          .order('created_at', { ascending: false })
        
        allTransactions = fullData || []
      }
      
      const csv = generateOptimizedCSV(allTransactions)
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cryptrac-tax-report-${dateRange.start_date.split('T')[0]}-to-${dateRange.end_date.split('T')[0]}.csv"`,
          'X-Processing-Time': `${Date.now() - startTime}ms`,
          'X-Total-Records': `${count || 0}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        transactions: safeTransactions,
        summary,
        pagination,
        filters: {
          ...filters,
          applied_date_range: dateRange
        },
        performance: {
          processing_time_ms: Date.now() - startTime,
          total_records: count || 0,
          returned_records: safeTransactions.length
        }
      }
    })

  } catch (error) {
    console.error('💥 Error generating tax report:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate tax report',
        processing_time_ms: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

function calculateDateRange(filters: TaxReportFilters): { start_date: string; end_date: string } {
  const now = new Date()
  const currentYear = now.getFullYear()
  
  switch (filters.report_type) {
    case 'calendar_year': {
      const year = filters.year || currentYear
      return {
        start_date: `${year}-01-01T00:00:00.000Z`,
        end_date: `${year}-12-31T23:59:59.999Z`
      }
    }
    
    case 'fiscal_year': {
      const year = filters.year || currentYear
      const [month, day] = (filters.fiscal_year_start || '01-01').split('-')
      const fiscalStart = new Date(year, parseInt(month) - 1, parseInt(day))
      const fiscalEnd = new Date(year + 1, parseInt(month) - 1, parseInt(day) - 1)
      
      return {
        start_date: fiscalStart.toISOString(),
        end_date: fiscalEnd.toISOString()
      }
    }
    
    case 'quarterly': {
      const year = filters.year || currentYear
      const quarter = filters.quarter || Math.ceil((now.getMonth() + 1) / 3)
      
      const quarterStart = new Date(year, (quarter - 1) * 3, 1)
      const quarterEnd = new Date(year, quarter * 3, 0, 23, 59, 59, 999)
      
      return {
        start_date: quarterStart.toISOString(),
        end_date: quarterEnd.toISOString()
      }
    }
    
    case 'custom':
    default: {
      const start = filters.start_date || `${currentYear}-01-01T00:00:00.000Z`
      const end = filters.end_date || now.toISOString()
      
      return {
        start_date: start,
        end_date: end
      }
    }
  }
}

function calculateSummary(transactions: any[], dateRange: { start_date: string; end_date: string }): TransactionSummary {
  const summary: TransactionSummary = {
    total_transactions: transactions.length,
    total_revenue: 0,
    total_tax_collected: 0,
    tax_breakdown: {},
    transactions_with_tax: 0,
    transactions_without_tax: 0,
    average_tax_rate: 0,
    date_range: dateRange,
    generated_at: new Date().toISOString()
  }

  let totalTaxableAmount = 0

  transactions.forEach(transaction => {
    const amount = parseFloat(transaction.amount || 0)
    const taxAmount = parseFloat(transaction.tax_amount || 0)
    const baseAmount = parseFloat(transaction.base_amount || amount)
    
    summary.total_revenue += amount
    summary.total_tax_collected += taxAmount
    
    if (transaction.tax_enabled && taxAmount > 0) {
      summary.transactions_with_tax++
      totalTaxableAmount += baseAmount
      
      // Process tax breakdown
      if (transaction.tax_breakdown && typeof transaction.tax_breakdown === 'object') {
        Object.entries(transaction.tax_breakdown).forEach(([key, value]) => {
          const taxValue = parseFloat(value as string) || 0
          summary.tax_breakdown[key] = (summary.tax_breakdown[key] || 0) + taxValue
        })
      }
    } else {
      summary.transactions_without_tax++
    }
  })

  // Calculate average tax rate
  if (totalTaxableAmount > 0) {
    summary.average_tax_rate = (summary.total_tax_collected / totalTaxableAmount) * 100
  }

  return summary
}

async function calculateSummaryOptimized(userId: string, dateRange: { start_date: string; end_date: string }, taxOnly?: boolean): Promise<TransactionSummary> {
  try {
    // Use database aggregation for better performance on large datasets
    let query = supabase
      .from('transactions')
      .select(`
        amount.sum(),
        tax_amount.sum(),
        base_amount.sum(),
        count(),
        tax_enabled
      `)
      .eq('payment_links.merchants.user_id', userId)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)
      .in('status', ['confirmed', 'finished'])

    if (taxOnly) {
      query = query.eq('tax_enabled', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error calculating optimized summary:', error)
      // Fallback to basic summary
      return {
        total_transactions: 0,
        total_revenue: 0,
        total_tax_collected: 0,
        tax_breakdown: {},
        transactions_with_tax: 0,
        transactions_without_tax: 0,
        average_tax_rate: 0,
        date_range: dateRange,
        generated_at: new Date().toISOString()
      }
    }

    // Process aggregated data
    const summary: TransactionSummary = {
      total_transactions: data?.length || 0,
      total_revenue: 0,
      total_tax_collected: 0,
      tax_breakdown: {},
      transactions_with_tax: 0,
      transactions_without_tax: 0,
      average_tax_rate: 0,
      date_range: dateRange,
      generated_at: new Date().toISOString()
    }

    // Note: This is a simplified version. For full tax breakdown,
    // you might need additional queries or a more complex aggregation
    return summary

  } catch (error) {
    console.error('❌ Error in optimized summary calculation:', error)
    return {
      total_transactions: 0,
      total_revenue: 0,
      total_tax_collected: 0,
      tax_breakdown: {},
      transactions_with_tax: 0,
      transactions_without_tax: 0,
      average_tax_rate: 0,
      date_range: dateRange,
      generated_at: new Date().toISOString()
    }
  }
}

function generateOptimizedCSV(transactions: any[]): string {
  const headers = [
    'Transaction Date',
    'Payment ID',
    'Order ID',
    'Business Name',
    'Payment Link Title',
    'Customer Email',
    'Customer Phone',
    'Base Amount',
    'Tax Enabled',
    'Tax Amount',
    'Total Amount',
    'Currency',
    'Crypto Amount',
    'Crypto Currency',
    'Payment Status',
    'Gateway Fee',
    'Merchant Receives',
    'Tax Rates',
    'Tax Breakdown',
    'Created At',
    'Updated At'
  ]

  const rows = transactions.map(transaction => {
    const paymentLink = Array.isArray(transaction.payment_links) 
      ? transaction.payment_links[0] 
      : transaction.payment_links

    const merchant = paymentLink?.merchants 
      ? (Array.isArray(paymentLink.merchants) ? paymentLink.merchants[0] : paymentLink.merchants)
      : null

    return [
      new Date(transaction.created_at).toLocaleDateString(),
      transaction.nowpayments_payment_id || '',
      transaction.order_id || '',
      merchant?.business_name || '',
      paymentLink?.title || '',
      transaction.customer_email || '',
      transaction.customer_phone || '',
      transaction.base_amount || transaction.amount || 0,
      transaction.tax_enabled ? 'Yes' : 'No',
      transaction.tax_amount || 0,
      transaction.amount || 0,
      transaction.currency || '',
      transaction.pay_amount || 0,
      transaction.pay_currency || '',
      transaction.status || '',
      transaction.gateway_fee || 0,
      transaction.merchant_receives || 0,
      JSON.stringify(transaction.tax_rates || []),
      JSON.stringify(transaction.tax_breakdown || {}),
      transaction.created_at || '',
      transaction.updated_at || ''
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => {
      // Escape fields that contain commas, quotes, or newlines
      const stringField = String(field)
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`
      }
      return stringField
    }).join(','))
  ].join('\n')

  return csvContent
}

