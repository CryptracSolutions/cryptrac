import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TaxReportFilters {
  start_date?: string
  end_date?: string
  report_type?: 'calendar_year' | 'fiscal_year' | 'quarterly' | 'custom'
  year?: number
  quarter?: number
  fiscal_year_start?: string // Format: 'MM-DD' (e.g., '04-01' for April 1st)
  tax_only?: boolean
  export_format?: 'json' | 'csv'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse filters
    const filters: TaxReportFilters = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      report_type: (searchParams.get('report_type') as any) || 'custom',
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      quarter: searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : undefined,
      fiscal_year_start: searchParams.get('fiscal_year_start') || '01-01',
      tax_only: searchParams.get('tax_only') === 'true',
      export_format: (searchParams.get('export_format') as any) || 'json'
    }

    console.log('📊 Tax report request:', { user_id, filters })

    // Calculate date range based on report type
    const dateRange = calculateDateRange(filters)
    
    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        payment_links!inner(
          merchants!inner(user_id)
        )
      `)
      .eq('payment_links.merchants.user_id', user_id)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)
      .order('created_at', { ascending: false })

    // Apply tax filter if requested
    if (filters.tax_only) {
      query = query.eq('tax_enabled', true)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('❌ Error fetching transactions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const summary = calculateSummary(transactions || [])

    // Format response based on export format
    if (filters.export_format === 'csv') {
      const csv = generateCSV(transactions || [])
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tax-report-${dateRange.start_date}-to-${dateRange.end_date}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        summary,
        filters: {
          ...filters,
          applied_date_range: dateRange
        },
        total_count: transactions?.length || 0
      }
    })

  } catch (error) {
    console.error('💥 Error generating tax report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate tax report' },
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

function calculateSummary(transactions: any[]): TransactionSummary {
  const summary: TransactionSummary = {
    total_transactions: transactions.length,
    total_revenue: 0,
    total_tax_collected: 0,
    tax_breakdown: {},
    transactions_with_tax: 0,
    transactions_without_tax: 0,
    average_tax_rate: 0
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

function generateCSV(transactions: any[]): string {
  const headers = [
    'Transaction Date',
    'Payment ID',
    'Order ID',
    'Customer Email',
    'Base Amount',
    'Tax Enabled',
    'Tax Amount',
    'Total Amount',
    'Currency',
    'Crypto Amount',
    'Crypto Currency',
    'Payment Status',
    'Tax Rates',
    'Tax Breakdown',
    'Created At'
  ]

  const rows = transactions.map(transaction => [
    new Date(transaction.created_at).toLocaleDateString(),
    transaction.payment_id || '',
    transaction.order_id || '',
    transaction.customer_email || '',
    transaction.base_amount || transaction.amount || 0,
    transaction.tax_enabled ? 'Yes' : 'No',
    transaction.tax_amount || 0,
    transaction.amount || 0,
    transaction.currency || '',
    transaction.crypto_amount || 0,
    transaction.crypto_currency || '',
    transaction.status || '',
    JSON.stringify(transaction.tax_rates || []),
    JSON.stringify(transaction.tax_breakdown || {}),
    transaction.created_at || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => 
      typeof field === 'string' && field.includes(',') 
        ? `"${field.replace(/"/g, '""')}"` 
        : field
    ).join(','))
  ].join('\n')

  return csvContent
}

