import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportTransaction {
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
  public_receipt_id: string | null
  link_id: string | null
  tx_hash: string | null
  blockchain_network: string | null
  currency_received: string | null
  amount_received: number | null
  payment_confirmed_at: string | null
}

export interface ExportSummary {
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

export interface MerchantInfo {
  business_name: string
  business_address?: string
  tax_id?: string
  contact_email?: string
  phone?: string
  website?: string
}

export type ExportTemplate = 'tax_filing' | 'accounting' | 'audit' | 'summary'

export interface ExportOptions {
  template: ExportTemplate
  includeReceiptUrls: boolean
  includeBlockchainLinks: boolean
  timezone: string
}

const resolveTransactionTimestamp = (tx: Pick<ExportTransaction, 'payment_confirmed_at'>): string | null => {
  return tx.payment_confirmed_at
}

type JsPDFInstance = InstanceType<typeof jsPDF>

type JsPDFInternalWithPages = {
  getCurrentPageInfo: () => { pageNumber: number }
  getNumberOfPages: () => number
}

type JsPDFWithAutoTable = JsPDFInstance & {
  lastAutoTable?: {
    finalY?: number
  }
  internal: JsPDFInstance['internal'] & JsPDFInternalWithPages
}

const getDocumentMetrics = (doc: jsPDF): { pageNumber: number; totalPages: number } => {
  const docWithExtras = doc as unknown as JsPDFWithAutoTable
  const info = docWithExtras.internal.getCurrentPageInfo()
  const totalPages = docWithExtras.internal.getNumberOfPages()
  return { pageNumber: info.pageNumber, totalPages }
}

const getLastAutoTablePosition = (doc: jsPDF): number | null => {
  const docWithExtras = doc as unknown as JsPDFWithAutoTable
  return docWithExtras.lastAutoTable?.finalY ?? null
}

// Professional PDF Generation with improved formatting
export function generateTaxReportPDF(
  transactions: ExportTransaction[],
  summary: ExportSummary,
  merchantInfo: MerchantInfo,
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve) => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Color scheme - professional black and gray
    const colors = {
      primary: [0, 0, 0] as [number, number, number],        // Black for headers
      secondary: [128, 128, 128] as [number, number, number], // Gray for subtext
      accent: [127, 94, 253] as [number, number, number],     // Purple accent (used sparingly)
      border: [200, 200, 200] as [number, number, number],    // Light gray for borders
      background: [250, 250, 250] as [number, number, number]  // Light background
    }

    // Add logo/header background
    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
    doc.rect(0, 0, pageWidth, 50, 'F')

    // Main Title
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.text('TAX REPORT', pageWidth / 2, 20, { align: 'center' })

    // Report Type Subtitle
    const templateName = options.template.replace('_', ' ').toUpperCase()
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
    doc.text(`${templateName} TEMPLATE`, pageWidth / 2, 28, { align: 'center' })

    // Report Period - Make this prominent
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    const startDate = formatDateLong(summary.date_range.start_date)
    const endDate = formatDateLong(summary.date_range.end_date)
    doc.text(`Reporting Period: ${startDate} - ${endDate}`, pageWidth / 2, 36, { align: 'center' })

    // Generated Date
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
    doc.text(`Generated: ${formatDateTimeLong(summary.generated_at)}`, pageWidth / 2, 42, { align: 'center' })

    // Business Information Section
    let yPos = 60
    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
    doc.rect(margin, yPos - 5, contentWidth, 35, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.text('BUSINESS INFORMATION', margin, yPos)

    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Business details in two columns
    const leftCol = margin
    const rightCol = pageWidth / 2

    doc.setFont('helvetica', 'bold')
    doc.text('Business Name:', leftCol, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(merchantInfo.business_name || 'Not Provided', leftCol + 30, yPos)

    if (merchantInfo.tax_id) {
      doc.setFont('helvetica', 'bold')
      doc.text('Tax ID:', rightCol, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(merchantInfo.tax_id, rightCol + 15, yPos)
    }

    yPos += 6
    if (merchantInfo.business_address) {
      doc.setFont('helvetica', 'bold')
      doc.text('Address:', leftCol, yPos)
      doc.setFont('helvetica', 'normal')
      const addressLines = doc.splitTextToSize(merchantInfo.business_address, contentWidth - 35)
      doc.text(addressLines, leftCol + 20, yPos)
      yPos += (addressLines.length - 1) * 5
    }

    if (merchantInfo.contact_email) {
      doc.setFont('helvetica', 'bold')
      doc.text('Email:', rightCol, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(merchantInfo.contact_email, rightCol + 12, yPos)
    }

    yPos += 6
    if (merchantInfo.phone) {
      doc.setFont('helvetica', 'bold')
      doc.text('Phone:', leftCol, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(merchantInfo.phone, leftCol + 15, yPos)
    }

    if (merchantInfo.website) {
      doc.setFont('helvetica', 'bold')
      doc.text('Website:', rightCol, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(merchantInfo.website, rightCol + 17, yPos)
    }

    // Financial Summary Section
    yPos += 15
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2])
    doc.rect(margin, yPos - 5, contentWidth, 8, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('FINANCIAL SUMMARY', margin + 2, yPos)

    yPos += 12
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])

    // Summary grid
    const summaryData = [
      ['Total Transactions:', summary.total_transactions.toString(), 'Processing Fees:', `$${summary.total_fees.toFixed(2)}`],
      ['Gross Sales:', `$${summary.total_gross_sales.toFixed(2)}`, 'Net Revenue:', `$${summary.total_net_revenue.toFixed(2)}`],
      ['Tax Collected:', `$${summary.total_tax_collected.toFixed(2)}`, '', '']
    ]

    summaryData.forEach(row => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(row[0], leftCol, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(row[1], leftCol + 35, yPos)

      if (row[2]) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text(row[2], rightCol, yPos)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.text(row[3], rightCol + 30, yPos)
      }
      yPos += 7
    })

    // Transaction Details Table
    yPos += 10
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.text('TRANSACTION DETAILS', margin, yPos)

    yPos += 8

    // Prepare table data based on template
    const columns = getColumnsForPDFTemplate(options.template)
    const rows = transactions.map(tx => getRowDataForPDFTemplate(tx, options))

    // Configure column widths based on template
    const columnStyles = getColumnStylesForTemplate(options.template)

    // Generate the table with professional styling
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: colors.border,
        lineWidth: 0.1,
        textColor: colors.primary,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: colors.background
      },
      columnStyles,
      didDrawPage: () => {
        // Add footer on every page
        const { pageNumber, totalPages } = getDocumentMetrics(doc)

        // Footer background
        doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')

        // Footer text
        doc.setFontSize(8)
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        doc.text('Generated by Cryptrac Payment Platform', margin, pageHeight - 10)
        doc.text(formatDateTimeLong(new Date().toISOString()), pageWidth - margin, pageHeight - 10, { align: 'right' })

        // Legal disclaimer
        const disclaimer = 'This is a computer-generated document provided for informational purposes only and should not be considered legal or tax advice. Please consult a qualified professional for advice regarding your specific circumstances.'
        const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth)
        doc.setFontSize(7)
        doc.text(disclaimerLines, pageWidth / 2, pageHeight - 8, { align: 'center' })
      }
    })

    // Add digital verification notice on last page
    const { totalPages } = getDocumentMetrics(doc)
    const lastPageNumber = totalPages
    doc.setPage(lastPageNumber)

    const currentY = getLastAutoTablePosition(doc) ?? yPos
    if (currentY < pageHeight - 60) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
      doc.text('This is a computer-generated document. No signature is required.', pageWidth / 2, currentY + 20, { align: 'center' })
      doc.text('For verification, please contact the merchant directly.', pageWidth / 2, currentY + 25, { align: 'center' })
    }

    resolve(new Blob([doc.output('blob')], { type: 'application/pdf' }))
  })
}

// Enhanced Excel Generation with multiple sheets and formatting
export function generateTaxReportExcel(
  transactions: ExportTransaction[],
  summary: ExportSummary,
  merchantInfo: MerchantInfo,
  options: ExportOptions
): Blob {
  const workbook = XLSX.utils.book_new()

  // Cover Sheet with full details
  const coverData = [
    ['CRYPTRAC TAX REPORT'],
    [''],
    ['Report Type:', options.template.replace('_', ' ').toUpperCase()],
    ['Generated:', formatDateTimeLong(summary.generated_at)],
    [''],
    ['REPORTING PERIOD'],
    ['Start Date:', formatDateLong(summary.date_range.start_date)],
    ['End Date:', formatDateLong(summary.date_range.end_date)],
    [''],
    ['BUSINESS INFORMATION'],
    ['Business Name:', merchantInfo.business_name],
    ['Tax ID:', merchantInfo.tax_id || 'Not Provided'],
    ['Address:', merchantInfo.business_address || 'Not Provided'],
    ['Email:', merchantInfo.contact_email || 'Not Provided'],
    ['Phone:', merchantInfo.phone || 'Not Provided'],
    ['Website:', merchantInfo.website || 'Not Provided'],
    [''],
    ['FINANCIAL SUMMARY'],
    ['Total Transactions:', summary.total_transactions],
    ['Gross Sales:', `$${summary.total_gross_sales.toFixed(2)}`],
    ['Tax Collected:', `$${summary.total_tax_collected.toFixed(2)}`],
    ['Processing Fees:', `$${summary.total_fees.toFixed(2)}`],
    ['Net Revenue:', `$${summary.total_net_revenue.toFixed(2)}`],
    [''],
    ['Disclaimer:', 'This is a computer-generated document provided for informational purposes only and should not be considered legal or tax advice. Please consult a qualified professional for advice regarding your specific circumstances.'],
    [''],
    ['TRANSACTION DETAILS'],
    ['Date', 'Description', 'Gross Amount', 'Tax', 'Fees', 'Fee Payer', 'Net Amount', 'Link ID', 'Currency', 'Status', 'TX Hash', 'Blockchain', 'Receipt ID']
  ]

  const coverSheet = XLSX.utils.aoa_to_sheet(coverData)

  // Style the cover sheet
  coverSheet['!cols'] = [{ wch: 25 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, coverSheet, 'Summary')

  // Detailed Transactions Sheet
  const headers = getExcelHeadersForTemplate(options.template)
  const transactionData = [
    headers,
    ...transactions.map(tx => getExcelRowDataForTemplate(tx, options))
  ]

  const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData)

  // Auto-size columns
  const maxWidths = headers.map((h, i) => {
    const columnData = transactionData.map(row => row[i])
    return Math.max(...columnData.map(val => String(val).length)) + 2
  })
  transactionSheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w, 50) }))

  XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions')

  // Analytics Sheet (for accounting template)
  if (options.template === 'accounting' || options.template === 'audit') {
    const monthlyData = generateMonthlyAnalytics(transactions)
    const analyticsSheet = XLSX.utils.aoa_to_sheet(monthlyData)
    XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Monthly Analytics')
  }

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    bookSST: false,
    compression: true
  })

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

// Professional CSV Generation with proper headers
export function generateEnhancedCSV(
  transactions: ExportTransaction[],
  summary: ExportSummary,
  merchantInfo: MerchantInfo,
  options: ExportOptions
): string {
  const headers = getCSVHeadersForTemplate(options.template)
  const templateName = options.template.replace('_', ' ').toUpperCase()

  // Professional header with all relevant information
  const csvContent = [
    `"CRYPTRAC TAX REPORT - ${templateName}"`,
    `"Generated: ${formatDateTimeLong(summary.generated_at)}"`,
    `"Reporting Period: ${formatDateLong(summary.date_range.start_date)} to ${formatDateLong(summary.date_range.end_date)}"`,
    `""`,
    `"BUSINESS INFORMATION"`,
    `"Business Name:","${merchantInfo.business_name}"`,
    merchantInfo.tax_id ? `"Tax ID:","${merchantInfo.tax_id}"` : '',
    merchantInfo.business_address ? `"Address:","${merchantInfo.business_address}"` : '',
    merchantInfo.contact_email ? `"Email:","${merchantInfo.contact_email}"` : '',
    merchantInfo.phone ? `"Phone:","${merchantInfo.phone}"` : '',
    `""`,
    `"FINANCIAL SUMMARY"`,
    `"Total Transactions:","${summary.total_transactions}"`,
    `"Gross Sales:","$${summary.total_gross_sales.toFixed(2)}"`,
    `"Tax Collected:","$${summary.total_tax_collected.toFixed(2)}"`,
    `"Processing Fees:","$${summary.total_fees.toFixed(2)}"`,
    `"Net Revenue:","$${summary.total_net_revenue.toFixed(2)}"`,
    `""`,
    `"Disclaimer:","This is a computer-generated document provided for informational purposes only and should not be considered legal or tax advice. Please consult a qualified professional for advice regarding your specific circumstances."`,
    `""`,
    `"TRANSACTION DETAILS"`,
    headers.map(h => `"${h}"`).join(','),
    ...transactions.map(tx => getCSVRowDataForTemplate(tx, options).map(cell => {
      // Proper CSV escaping
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
  ].filter(line => line !== '').join('\n')

  return csvContent
}

// Template-specific column configurations for PDF
function getColumnsForPDFTemplate(template: ExportTemplate): string[] {
  switch (template) {
    case 'tax_filing':
      return ['Date', 'Description', 'Gross', 'Tax Rate', 'Tax', 'Net', 'Status']
    case 'accounting':
      return ['Date', 'Description', 'Gross', 'Tax', 'Fees', 'Net', 'Link ID', 'Status']
    case 'audit':
      return ['Date', 'Description', 'Gross', 'Tax', 'Fees', 'Net', 'TX Hash', 'Status']
    case 'summary':
      return ['Date', 'Description', 'Total', 'Status']
    default:
      return ['Date', 'Description', 'Gross', 'Tax', 'Fees', 'Net', 'Status']
  }
}

// Column styles for PDF tables
function getColumnStylesForTemplate(template: ExportTemplate): Record<number, Record<string, unknown>> {
  const baseStyles: Record<number, Record<string, unknown>> = {
    0: { cellWidth: 22, halign: 'left' },   // Date
    1: { cellWidth: 'auto', halign: 'left' }, // Description (auto-expand)
  }

  switch (template) {
    case 'tax_filing':
      return {
        ...baseStyles,
        2: { cellWidth: 20, halign: 'right' },  // Gross
        3: { cellWidth: 18, halign: 'center' }, // Tax Rate
        4: { cellWidth: 18, halign: 'right' },  // Tax
        5: { cellWidth: 20, halign: 'right' },  // Net
        6: { cellWidth: 20, halign: 'center' }  // Status
      }
    case 'accounting':
      return {
        ...baseStyles,
        2: { cellWidth: 18, halign: 'right' },  // Gross
        3: { cellWidth: 15, halign: 'right' },  // Tax
        4: { cellWidth: 15, halign: 'right' },  // Fees
        5: { cellWidth: 18, halign: 'right' },  // Net
        6: { cellWidth: 20, halign: 'center' }, // Link ID
        7: { cellWidth: 18, halign: 'center' }  // Status
      }
    case 'audit':
      return {
        ...baseStyles,
        2: { cellWidth: 18, halign: 'right' },  // Gross
        3: { cellWidth: 15, halign: 'right' },  // Tax
        4: { cellWidth: 15, halign: 'right' },  // Fees
        5: { cellWidth: 18, halign: 'right' },  // Net
        6: { cellWidth: 25, halign: 'left' },   // TX Hash
        7: { cellWidth: 18, halign: 'center' }  // Status
      }
    case 'summary':
      return {
        ...baseStyles,
        2: { cellWidth: 25, halign: 'right' },  // Total
        3: { cellWidth: 25, halign: 'center' }  // Status
      }
    default:
      return baseStyles
  }
}

// Row data for PDF templates
function getRowDataForPDFTemplate(tx: ExportTransaction, options: ExportOptions): string[] {
  const timestamp = resolveTransactionTimestamp(tx)
  const date = timestamp ? formatDate(timestamp) : 'N/A'
  const description = tx.product_description || 'Payment'

  switch (options.template) {
    case 'tax_filing':
      return [
        date,
        description,
        `$${tx.gross_amount.toFixed(2)}`,
        `${tx.tax_percentage}%`,
        `$${tx.tax_amount.toFixed(2)}`,
        `$${tx.net_amount.toFixed(2)}`,
        tx.status
      ]
    case 'accounting':
      return [
        date,
        description,
        `$${tx.gross_amount.toFixed(2)}`,
        `$${tx.tax_amount.toFixed(2)}`,
        `$${tx.fees.toFixed(2)}`,
        `$${tx.net_amount.toFixed(2)}`,
        tx.link_id || '-',
        tx.status
      ]
    case 'audit':
      return [
        date,
        description,
        `$${tx.gross_amount.toFixed(2)}`,
        `$${tx.tax_amount.toFixed(2)}`,
        `$${tx.fees.toFixed(2)}`,
        `$${tx.net_amount.toFixed(2)}`,
        tx.tx_hash ? tx.tx_hash.substring(0, 8) + '...' : '-',
        tx.status
      ]
    case 'summary':
      return [
        date,
        description,
        `$${tx.total_paid.toFixed(2)}`,
        tx.status
      ]
    default:
      return [
        date,
        description,
        `$${tx.gross_amount.toFixed(2)}`,
        `$${tx.tax_amount.toFixed(2)}`,
        `$${tx.fees.toFixed(2)}`,
        `$${tx.net_amount.toFixed(2)}`,
        tx.status
      ]
  }
}

// Excel headers based on template
function getExcelHeadersForTemplate(template: ExportTemplate): string[] {
  switch (template) {
    case 'tax_filing':
      return ['Date', 'Description', 'Gross Amount', 'Tax Rate', 'Tax Amount', 'Net Amount', 'Status', 'Link ID']
    case 'accounting':
      return ['Date', 'Description', 'Gross Amount', 'Tax', 'Fees', 'Fee Payer', 'Net Amount', 'Link ID', 'Currency', 'Status']
    case 'audit':
      return ['Date', 'Time', 'Transaction ID', 'Description', 'Gross Amount', 'Tax', 'Fees', 'Net Amount', 'Status', 'TX Hash', 'Blockchain', 'Receipt ID']
    case 'summary':
      return ['Date', 'Description', 'Total Amount', 'Status']
    default:
      return ['Date', 'Description', 'Gross Amount', 'Tax', 'Fees', 'Net Amount', 'Status']
  }
}

// Excel row data based on template
function getExcelRowDataForTemplate(tx: ExportTransaction, options: ExportOptions): (string | number)[] {
  const timestamp = resolveTransactionTimestamp(tx)
  const date = timestamp ? formatDate(timestamp) : 'N/A'
  const time = timestamp ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'

  switch (options.template) {
    case 'tax_filing':
      return [
        date,
        tx.product_description,
        tx.gross_amount,
        tx.tax_percentage,
        tx.tax_amount,
        tx.net_amount,
        tx.status,
        tx.link_id || ''
      ]
    case 'accounting':
      return [
        date,
        tx.product_description,
        tx.gross_amount,
        tx.tax_amount,
        tx.fees,
        tx.fee_payer,
        tx.net_amount,
        tx.link_id || '',
        tx.currency_received || 'USD',
        tx.status
      ]
    case 'audit':
      return [
        date,
        time,
        tx.id,
        tx.product_description,
        tx.gross_amount,
        tx.tax_amount,
        tx.fees,
        tx.net_amount,
        tx.status,
        tx.tx_hash || '',
        tx.blockchain_network || '',
        tx.public_receipt_id || ''
      ]
    case 'summary':
      return [
        date,
        tx.product_description,
        tx.total_paid,
        tx.status
      ]
    default:
      return [
        date,
        tx.product_description,
        tx.gross_amount,
        tx.tax_amount,
        tx.fees,
        tx.net_amount,
        tx.status
      ]
  }
}

// CSV headers based on template
function getCSVHeadersForTemplate(template: ExportTemplate): string[] {
  return getExcelHeadersForTemplate(template)
}

// CSV row data with proper escaping
function getCSVRowDataForTemplate(tx: ExportTransaction, options: ExportOptions): (string | number)[] {
  return getExcelRowDataForTemplate(tx, options)
}

// Generate monthly analytics for Excel
function generateMonthlyAnalytics(transactions: ExportTransaction[]): unknown[][] {
  const monthlyData: { [key: string]: { count: number, gross: number, tax: number, fees: number, net: number } } = {}

  transactions.forEach(tx => {
    const timestamp = resolveTransactionTimestamp(tx)
    if (!timestamp) {
      return // Skip transactions without a confirmed payment timestamp
    }
    const month = new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, gross: 0, tax: 0, fees: 0, net: 0 }
    }
    monthlyData[month].count++
    monthlyData[month].gross += tx.gross_amount
    monthlyData[month].tax += tx.tax_amount
    monthlyData[month].fees += tx.fees
    monthlyData[month].net += tx.net_amount
  })

  const analyticsData = [
    ['MONTHLY ANALYTICS'],
    [''],
    ['Month', 'Transactions', 'Gross Sales', 'Tax Collected', 'Fees', 'Net Revenue'],
    ...Object.entries(monthlyData).map(([month, data]) => [
      month,
      data.count,
      `$${data.gross.toFixed(2)}`,
      `$${data.tax.toFixed(2)}`,
      `$${data.fees.toFixed(2)}`,
      `$${data.net.toFixed(2)}`
    ]),
    [''],
    ['TOTALS',
     Object.values(monthlyData).reduce((sum, d) => sum + d.count, 0),
     `$${Object.values(monthlyData).reduce((sum, d) => sum + d.gross, 0).toFixed(2)}`,
     `$${Object.values(monthlyData).reduce((sum, d) => sum + d.tax, 0).toFixed(2)}`,
     `$${Object.values(monthlyData).reduce((sum, d) => sum + d.fees, 0).toFixed(2)}`,
     `$${Object.values(monthlyData).reduce((sum, d) => sum + d.net, 0).toFixed(2)}`
    ]
  ]

  return analyticsData
}

// Enhanced date formatting functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTimeLong(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

// Blockchain explorer URL generators
export function getBlockchainExplorerUrl(txHash: string, network: string): string {
  const networkMap: Record<string, string> = {
    'bitcoin': `https://blockstream.info/tx/${txHash}`,
    'btc': `https://blockstream.info/tx/${txHash}`,
    'ethereum': `https://etherscan.io/tx/${txHash}`,
    'eth': `https://etherscan.io/tx/${txHash}`,
    'litecoin': `https://blockexplorer.one/litecoin/mainnet/tx/${txHash}`,
    'ltc': `https://blockexplorer.one/litecoin/mainnet/tx/${txHash}`,
    'dogecoin': `https://dogechain.info/tx/${txHash}`,
    'doge': `https://dogechain.info/tx/${txHash}`,
    'bitcoin-cash': `https://blockchair.com/bitcoin-cash/transaction/${txHash}`,
    'bch': `https://blockchair.com/bitcoin-cash/transaction/${txHash}`,
    'polygon': `https://polygonscan.com/tx/${txHash}`,
    'matic': `https://polygonscan.com/tx/${txHash}`,
    'binance-smart-chain': `https://bscscan.com/tx/${txHash}`,
    'bsc': `https://bscscan.com/tx/${txHash}`,
    'bnb': `https://bscscan.com/tx/${txHash}`,
    'tron': `https://tronscan.org/#/transaction/${txHash}`,
    'trx': `https://tronscan.org/#/transaction/${txHash}`,
    'solana': `https://solscan.io/tx/${txHash}`,
    'sol': `https://solscan.io/tx/${txHash}`,
    'avalanche': `https://snowtrace.io/tx/${txHash}`,
    'avax': `https://snowtrace.io/tx/${txHash}`,
    'avaxc': `https://snowtrace.io/tx/${txHash}`,
    'avalanche-c-chain': `https://snowtrace.io/tx/${txHash}`,
    'cardano': `https://cardanoscan.io/transaction/${txHash}`,
    'ada': `https://cardanoscan.io/transaction/${txHash}`,
    'arbitrum': `https://arbiscan.io/tx/${txHash}`,
    'arb': `https://arbiscan.io/tx/${txHash}`,
    'optimism': `https://optimistic.etherscan.io/tx/${txHash}`,
    'op': `https://optimistic.etherscan.io/tx/${txHash}`,
    'base': `https://basescan.org/tx/${txHash}`,
    'ethbase': `https://basescan.org/tx/${txHash}`,
    'fantom': `https://ftmscan.com/tx/${txHash}`,
    'ftm': `https://ftmscan.com/tx/${txHash}`,
    'cosmos': `https://www.mintscan.io/cosmos/txs/${txHash}`,
    'atom': `https://www.mintscan.io/cosmos/txs/${txHash}`,
    'near': `https://nearblocks.io/txs/${txHash}`,
    'algorand': `https://algoexplorer.io/tx/${txHash}`,
    'algo': `https://algoexplorer.io/tx/${txHash}`,
    'ton': `https://tonscan.org/tx/${txHash}`,
    'ripple': `https://xrpscan.com/tx/${txHash}`,
    'xrp': `https://xrpscan.com/tx/${txHash}`,
    'stellar': `https://stellarchain.io/transactions/${txHash}`,
    'xlm': `https://stellarchain.io/transactions/${txHash}`
  }

  return networkMap[network.toLowerCase()] || `https://blockchain.info/tx/${txHash}`
}
