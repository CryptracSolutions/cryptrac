import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Rate limiting for API endpoints
const apiAttempts = new Map<string, { count: number; lastAttempt: number }>();
const API_RATE_LIMIT = 60; // Max 60 requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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
  status?: 'confirmed' | 'refunded' | 'all'
}

interface TransactionSummary {
  total_transactions: number
  total_gross_sales: number
  total_tax_collected: number
  total_fees: number
  total_net_revenue: number
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

interface ReportTransaction {
  id: string
  payment_id: string
  created_at: string | null
  updated_at: string | null
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

type RawTransactionRow = {
  tx_hash?: string | null
  payin_hash?: string | null
  blockchain_network?: string | null
  network?: string | null
  pay_currency?: string | null
  asset?: string | null
  currency_received?: string | null
  amount_received?: number | string | null
  fee_paid_by_customer?: boolean | null
  total_paid?: number | string | null
}

function normalizeNetwork(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (!value) continue
    const str = String(value).trim().toLowerCase()
    if (!str) continue

    if (str.includes('tron') || str.includes('trx') || str.includes('trc')) return 'tron'
    if (str.includes('bitcoin') || str === 'btc') return 'bitcoin'
    if (str.includes('litecoin') || str.includes('ltc')) return 'litecoin'
    if (str.includes('doge')) return 'dogecoin'
    if (str.includes('ethereum') || str.includes('eth') || str.includes('erc')) return 'ethereum'
    if (str.includes('polygon') || str.includes('matic')) return 'polygon'
    if (str.includes('bsc') || str.includes('bnb') || str.includes('binance')) return 'bsc'
    if (str.includes('solana') || str.includes('sol')) return 'solana'
    if (str.includes('avax') || str.includes('avalanche')) return 'avax'
    if (str.includes('cardano') || str.includes('ada')) return 'cardano'
    if (str.includes('arbitrum') || str.includes('arb')) return 'arbitrum'
    if (str.includes('optimism') || str === 'op') return 'optimism'
    if (str.includes('base')) return 'base'
    if (str.includes('fantom') || str.includes('ftm')) return 'fantom'
    if (str.includes('cosmos') || str.includes('atom')) return 'cosmos'
    if (str.includes('near')) return 'near'
    if (str.includes('algorand') || str.includes('algo')) return 'algorand'
    if (str.includes('ton')) return 'ton'
    if (str.includes('xrp') || str.includes('ripple')) return 'xrp'
    if (str.includes('stellar') || str.includes('xlm')) return 'xlm'
  }

  for (const value of values) {
    if (!value) continue
    const str = String(value).trim()
    if (str) return str.toLowerCase()
  }

  return null
}

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
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
      report_type: (searchParams.get('report_type') as TaxReportFilters['report_type']) || 'custom',
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      quarter: searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : undefined,
      fiscal_year_start: searchParams.get('fiscal_year_start') || '01-01',
      tax_only: searchParams.get('tax_only') === 'true',
      export_format: (searchParams.get('export_format') as TaxReportFilters['export_format']) || 'json',
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(1000, Math.max(10, parseInt(searchParams.get('limit') || '100'))), // Max 1000 per page
      include_summary: searchParams.get('include_summary') !== 'false',
      status: (searchParams.get('status') as TaxReportFilters['status']) || 'confirmed'
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
    
    // ENHANCED: Build optimized query with pagination and public_receipt_id
    let baseQuery = supabase
      .from('transactions')
      .select(`
        id,
        invoice_id,
        nowpayments_payment_id,
        order_id,
        base_amount,
        subtotal_with_tax,
        tax_label,
        tax_percentage,
        tax_amount,
        total_amount_paid,
        total_paid,
        tax_rates,
        merchant_receives,
        currency,
        pay_currency,
        asset,
        network,
        status,
        gateway_fee,
        cryptrac_fee,
        refund_amount,
        refunded_at,
        created_at,
        updated_at,
        payment_data,
        tx_hash,
        payin_hash,
        currency_received,
        amount_received,
        public_receipt_id,
        payment_links!inner(
          link_id,
          description,
          merchants!inner(user_id, business_name)
        )
      `, { count: 'exact' })
      .eq('payment_links.merchants.user_id', user_id)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)
      .order('created_at', { ascending: false })

    // Apply status filtering
    let statusFilter = ['confirmed', 'finished', 'refunded']
    if (filters.status === 'confirmed') {
      statusFilter = ['confirmed', 'finished']
    } else if (filters.status === 'refunded') {
      statusFilter = ['refunded']
    }
    baseQuery = baseQuery.in('status', statusFilter)

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

    const formattedTransactions: ReportTransaction[] = safeTransactions.map(t => {
      const paymentLink = Array.isArray(t.payment_links) ? t.payment_links[0] : t.payment_links
      const transactionRow = t as RawTransactionRow
      // const merchant = paymentLink?.merchants
      const paymentId = t.invoice_id || paymentLink?.link_id || t.nowpayments_payment_id || t.id
      const gross = Number(t.base_amount || 0)
      const label = t.tax_label || (Array.isArray(t.tax_rates) ? t.tax_rates.map((r: { label: string }) => r.label).join(', ') : '')
      const percentage = t.tax_percentage !== null && t.tax_percentage !== undefined
        ? Number(t.tax_percentage)
        : Array.isArray(t.tax_rates)
          ? t.tax_rates.reduce(
              (sum: number, r: { percentage?: string | number }) =>
                sum + (parseFloat(String(r.percentage)) || 0),
              0
            )
          : 0
      const taxAmt = t.tax_amount !== null && t.tax_amount !== undefined
        ? Number(t.tax_amount)
        : gross * (percentage / 100)
      const totalPaid = Number(t.total_amount_paid || t.subtotal_with_tax || gross + taxAmt)
      const fees = Number(t.gateway_fee || 0) + Number(t.cryptrac_fee || 0)
      const net = totalPaid - fees
      const txHash = transactionRow.tx_hash || transactionRow.payin_hash || null
      const blockchainNetwork = normalizeNetwork(
        transactionRow.blockchain_network,
        transactionRow.network,
        transactionRow.pay_currency,
        transactionRow.asset,
        t.currency
      )
      const rawCurrencyReceived =
        transactionRow.currency_received ||
        transactionRow.pay_currency ||
        transactionRow.asset ||
        t.currency ||
        null
      const currencyReceived = rawCurrencyReceived ? String(rawCurrencyReceived).toLowerCase() : null
      const amountReceivedValue = transactionRow.amount_received
      const amountReceived =
        amountReceivedValue !== null && amountReceivedValue !== undefined
          ? Number(amountReceivedValue)
          : null

      const paymentData = (t as { payment_data?: { payment_confirmed_at?: string } }).payment_data || null
      const paymentConfirmedAt =
        paymentData?.payment_confirmed_at ||
        (((t.status === 'confirmed' || t.status === 'finished') && t.updated_at)
          ? t.updated_at
          : null)

      // Determine fee payer: if fee_paid_by_customer is true, customer paid, otherwise merchant paid
      // Note: This field may not exist yet in the database, so we default to 'merchant' for backwards compatibility
      const feePayer: 'merchant' | 'customer' = transactionRow.fee_paid_by_customer ? 'customer' : 'merchant'

      return {
        id: t.id,
        payment_id: paymentId,
        created_at: t.created_at,
        updated_at: t.updated_at,
        product_description: paymentLink?.description || '',
        gross_amount: gross,
        tax_label: label,
        tax_percentage: percentage,
        tax_amount: taxAmt,
        total_paid: totalPaid,
        fees,
        fee_payer: feePayer,
        net_amount: net,
        status: t.status,
        refund_amount: Number(t.refund_amount || 0),
        refund_date: t.refunded_at,
        // ENHANCED: Include public_receipt_id for receipt links
        public_receipt_id: t.public_receipt_id,
        // Include link_id from payment_links for UI display
        link_id: paymentLink?.link_id || null,
        // ENHANCED: Include blockchain verification fields (may not exist yet in database)
        tx_hash: txHash,
        blockchain_network: blockchainNetwork,
        currency_received: currencyReceived,
        amount_received: amountReceived,
        payment_confirmed_at: paymentConfirmedAt
      }
    })

    // Calculate summary statistics
    const summary: TransactionSummary = calculateSummary(formattedTransactions, dateRange)

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
      let allData = formattedTransactions
      if (count && count > formattedTransactions.length) {
        console.log('📄 Fetching all transactions for CSV export...')
        let fullQuery = supabase
          .from('transactions')
          .select(`
            id,
            invoice_id,
            nowpayments_payment_id,
            order_id,
            base_amount,
            subtotal_with_tax,
            tax_label,
            tax_percentage,
            tax_amount,
            total_amount_paid,
            total_paid,
            tax_rates,
            merchant_receives,
            currency,
            pay_currency,
            asset,
            network,
            status,
            gateway_fee,
            cryptrac_fee,
            refund_amount,
            refunded_at,
            created_at,
            updated_at,
            payment_data,
            tx_hash,
            payin_hash,
            currency_received,
            amount_received,
            public_receipt_id,
            payment_links!inner(
              link_id,
              description,
              merchants!inner(user_id, business_name)
            )
          `)
          .eq('payment_links.merchants.user_id', user_id)
          .gte('created_at', dateRange.start_date)
          .lte('created_at', dateRange.end_date)
          .in('status', statusFilter)
          .order('created_at', { ascending: false })

        if (filters.tax_only) {
          fullQuery = fullQuery.eq('tax_enabled', true)
        }

        const { data: fullData } = await fullQuery
        allData = (fullData || []).map(t => {
          const paymentLink = Array.isArray(t.payment_links) ? t.payment_links[0] : t.payment_links
          const transactionRow = t as RawTransactionRow
          const paymentId = t.invoice_id || paymentLink?.link_id || t.nowpayments_payment_id || t.id
          const gross = Number(t.base_amount || 0)
          const label = t.tax_label || (Array.isArray(t.tax_rates) ? t.tax_rates.map((r: { label: string }) => r.label).join(', ') : '')
          const percentage = t.tax_percentage !== null && t.tax_percentage !== undefined
            ? Number(t.tax_percentage)
            : Array.isArray(t.tax_rates)
              ? t.tax_rates.reduce(
                  (sum: number, r: { percentage?: string | number }) =>
                    sum + (parseFloat(String(r.percentage)) || 0),
                  0
                )
              : 0
          const taxAmt = t.tax_amount !== null && t.tax_amount !== undefined
            ? Number(t.tax_amount)
            : gross * (percentage / 100)
          const totalPaid = Number(t.total_amount_paid || t.subtotal_with_tax || gross + taxAmt)
          const fees = Number(t.gateway_fee || 0) + Number(t.cryptrac_fee || 0)
          const net = totalPaid - fees
          const txHash = transactionRow.tx_hash || transactionRow.payin_hash || null
          const blockchainNetwork = normalizeNetwork(
            transactionRow.blockchain_network,
            transactionRow.network,
            transactionRow.pay_currency,
            transactionRow.asset,
            t.currency
          )
          const rawCurrencyReceived =
            transactionRow.currency_received ||
            transactionRow.pay_currency ||
            transactionRow.asset ||
            t.currency ||
            null
          const currencyReceived = rawCurrencyReceived ? String(rawCurrencyReceived).toLowerCase() : null
          const amountReceivedValue = transactionRow.amount_received
          const amountReceived =
            amountReceivedValue !== null && amountReceivedValue !== undefined
              ? Number(amountReceivedValue)
              : null

          const paymentData = (t as { payment_data?: { payment_confirmed_at?: string } }).payment_data || null
          const paymentConfirmedAt =
            paymentData?.payment_confirmed_at ||
            (((t.status === 'confirmed' || t.status === 'finished') && t.updated_at)
              ? t.updated_at
              : null)

          // Determine fee payer: if fee_paid_by_customer is true, customer paid, otherwise merchant paid
          // Note: This field may not exist yet in the database, so we default to 'merchant' for backwards compatibility
          const feePayer: 'merchant' | 'customer' = transactionRow.fee_paid_by_customer ? 'customer' : 'merchant'

          return {
            id: t.id,
            payment_id: paymentId,
            created_at: t.created_at,
            updated_at: t.updated_at,
            product_description: paymentLink?.description || '',
            gross_amount: gross,
            tax_label: label,
            tax_percentage: percentage,
            tax_amount: taxAmt,
            total_paid: totalPaid,
            fees,
            fee_payer: feePayer,
            net_amount: net,
            status: t.status,
            refund_amount: Number(t.refund_amount || 0),
            refund_date: t.refunded_at,
            public_receipt_id: t.public_receipt_id,
            link_id: paymentLink?.link_id || null,
            tx_hash: txHash,
            blockchain_network: blockchainNetwork,
            currency_received: currencyReceived,
            amount_received: amountReceived,
            payment_confirmed_at: paymentConfirmedAt
          }
        })
      }

      const csvSummary = calculateSummary(allData, dateRange)
      const csv = generateAuditCSV(allData, csvSummary)

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
        transactions: formattedTransactions,
        summary,
        pagination,
        filters: {
          ...filters,
          applied_date_range: dateRange
        },
        performance: {
          processing_time_ms: Date.now() - startTime,
          total_records: count || 0,
          returned_records: formattedTransactions.length
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

function calculateSummary(
  transactions: Array<{
    gross_amount: number
    tax_amount: number
    fees: number
    net_amount: number
  }>,
  dateRange: { start_date: string; end_date: string }
): TransactionSummary {
  const summary: TransactionSummary = {
    total_transactions: transactions.length,
    total_gross_sales: 0,
    total_tax_collected: 0,
    total_fees: 0,
    total_net_revenue: 0,
    date_range: dateRange,
    generated_at: new Date().toISOString()
  }

  transactions.forEach(t => {
    summary.total_gross_sales += t.gross_amount
    summary.total_tax_collected += t.tax_amount
    summary.total_fees += t.fees
    summary.total_net_revenue += t.net_amount
  })

  return summary
}

function generateAuditCSV(transactions: ReportTransaction[], summary: TransactionSummary): string {
  const headers = [
    'Payment ID',
    'Transaction Date (UTC)',
    'Transaction Time (UTC)',
    'Product/Service Description',
    'Gross Amount',
    'Tax Label',
    'Tax Rate (%)',
    'Tax Amount',
    'Total Paid by Customer',
    'Gateway Fees',
    'Fee Paid By',
    'Net Amount Received',
    'Payment Status',
    'Refund Amount',
    'Refund Date',
    'Transaction Hash',
    'Blockchain Network',
    'Currency Received',
    'Amount Received',
    'Link ID',
    'Receipt URL'
  ]

  const rows = transactions.map(tx => {
    const effectiveTimestamp =
      tx.payment_confirmed_at ||
      (((tx.status === 'confirmed' || tx.status === 'finished') && tx.updated_at)
        ? tx.updated_at
        : tx.created_at)
    const isoTimestamp = effectiveTimestamp ? new Date(effectiveTimestamp).toISOString() : null

    return [
    tx.payment_id,
    isoTimestamp ? isoTimestamp.split('T')[0] : '',
    isoTimestamp ? isoTimestamp.split('T')[1].split('.')[0] : '',
    tx.product_description || '',
    tx.gross_amount.toFixed(2),
    tx.tax_label || '',
    tx.tax_percentage.toFixed(2),
    tx.tax_amount.toFixed(2),
    tx.total_paid.toFixed(2),
    tx.fees.toFixed(2),
    tx.fee_payer,
    tx.net_amount.toFixed(2),
    tx.status,
    tx.refund_amount ? tx.refund_amount.toFixed(2) : '',
    tx.refund_date ? new Date(tx.refund_date).toISOString().split('T')[0] : '',
    tx.tx_hash || '',
    tx.blockchain_network || '',
    tx.currency_received || '',
    tx.amount_received ? tx.amount_received.toFixed(8) : '',
    tx.link_id || '',
    // ENHANCED: Include receipt URL in CSV export
    tx.public_receipt_id ? `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_ORIGIN}/r/${tx.public_receipt_id}` : ''
  ]})

  const csvContent = [
    `# Cryptrac Tax Report`,
    `# Generated: ${summary.generated_at}`,
    `# Date Range: ${summary.date_range.start_date.split('T')[0]} to ${summary.date_range.end_date.split('T')[0]}`,
    `# Total Transactions: ${summary.total_transactions}`,
    `# Total Gross Sales: $${summary.total_gross_sales.toFixed(2)}`,
    `# Total Tax Collected: $${summary.total_tax_collected.toFixed(2)}`,
    `# Total Fees: $${summary.total_fees.toFixed(2)}`,
    `# Total Net Revenue: $${summary.total_net_revenue.toFixed(2)}`,
    ``,
    headers.join(','),
    ...rows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(','))
  ].join('\n')

  return csvContent
}
