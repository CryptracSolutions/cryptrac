"use client"

import React from 'react'
import {
  ExternalLink,
  Copy,
  DollarSign,
  Link2,
  Package,
  AlertCircle,
  Shield,
  Clock,
  CheckCircle,
  Activity
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { getBlockchainExplorerUrl } from '@/lib/utils/export-utils'
import { formatCompactDateTime } from '@/lib/utils/date-utils'
import toast from 'react-hot-toast'

interface TransactionDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
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
    fee_payer?: 'merchant' | 'customer'
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
  } | null
  timezone: string
}

export function TransactionDetailModal({
  open,
  onOpenChange,
  transaction,
  timezone
}: TransactionDetailModalProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const openBlockchainExplorer = () => {
    if (transaction?.tx_hash && transaction?.blockchain_network) {
      const url = getBlockchainExplorerUrl(transaction.tx_hash, transaction.blockchain_network)
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const openReceipt = () => {
    if (transaction?.public_receipt_id) {
      const receiptUrl = `${window.location.origin}/r/${transaction.public_receipt_id}`
      window.open(receiptUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (!transaction) return null

  const displayedTimestamp =
    transaction.payment_confirmed_at ||
    (((transaction.status === 'confirmed' || transaction.status === 'finished' || transaction.status === 'sending') && transaction.updated_at)
      ? transaction.updated_at
      : transaction.created_at)

  const saleTotal = transaction.gross_amount + transaction.tax_amount
  const feesAmount = transaction.fees
  const feePaidByCustomer = transaction.fee_payer === 'customer'
  const computedCustomerPaid = saleTotal + (feePaidByCustomer ? feesAmount : 0)
  const safeTotalPaid = Number.isFinite(transaction.total_paid) ? transaction.total_paid : 0
  const customerPaidAmount = safeTotalPaid > 0 ? safeTotalPaid : computedCustomerPaid
  const computedNetAmount = Math.max(saleTotal - (feePaidByCustomer ? 0 : feesAmount), 0)
  const safeNetAmount = Number.isFinite(transaction.net_amount) ? transaction.net_amount : computedNetAmount
  const merchantNetAmount = Math.max(safeNetAmount, 0)
  const hasBlockchainSection = Boolean(transaction.tx_hash || transaction.currency_received)
  const feesDisplay = feesAmount === 0
    ? `$${feesAmount.toFixed(2)}`
    : `${feePaidByCustomer ? '+' : '-'}$${feesAmount.toFixed(2)}`
  const paymentAmountText = transaction.currency_received
    ? `${transaction.amount_received !== null && transaction.amount_received !== undefined ? `${transaction.amount_received.toFixed(8)} ` : ''}${transaction.currency_received.toUpperCase()}`.trim()
    : ''
  const normalizedNetworkLabel = transaction.blockchain_network
    ? transaction.blockchain_network.replace('-', ' ').replace(/_/g, ' ').toUpperCase()
    : null
  const actionButtonClasses = 'flex items-center gap-2 bg-[#7f5efd] hover:bg-[#6b4fd8] text-white h-9 px-4 text-sm font-medium transition-all'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white border-[#7f5efd] shadow-xl rounded-xl p-0">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#7f5efd]/20 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="font-phonic text-xl font-bold text-gray-900 mb-1">
                Transaction Details
              </DialogTitle>
              <DialogDescription className="font-capsule text-sm text-gray-600">
                Full transaction information and blockchain verification
              </DialogDescription>
            </div>
            <Badge
              variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}
              className={`text-xs px-2.5 py-0.5 font-medium ${
                transaction.status === 'confirmed'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Date & Time */}
            <div className="bg-[#7f5efd]/5 rounded-lg p-3 border border-[#7f5efd]/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#7f5efd]/10 rounded flex items-center justify-center border border-[#7f5efd]/20">
                    <Clock className="h-4 w-4 text-[#7f5efd]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Timestamp</p>
                    <p className="font-medium text-gray-900 text-sm">{formatCompactDateTime(displayedTimestamp, timezone)}</p>
                  </div>
                </div>
              </div>

            {/* Link ID */}
            {transaction.link_id && (
              <div className="bg-[#7f5efd]/5 rounded-lg p-3 border border-[#7f5efd]/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#7f5efd]/10 rounded flex items-center justify-center border border-[#7f5efd]/20">
                    <Link2 className="h-4 w-4 text-[#7f5efd]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Link ID</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono text-sm text-gray-900 truncate">{transaction.link_id}</p>
                      <button
                        onClick={() => copyToClipboard(transaction.link_id!, 'Link ID')}
                        className="flex-shrink-0 p-1 hover:bg-[#7f5efd]/10 rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-[#7f5efd]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-[#7f5efd]/5 rounded-lg border border-[#7f5efd]/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-[#7f5efd]/10 rounded flex items-center justify-center">
                <Package className="h-3.5 w-3.5 text-[#7f5efd]" />
              </div>
              <h3 className="font-phonic text-sm font-semibold text-gray-900">Description</h3>
            </div>
            <p className="text-gray-800 text-sm ml-8">{transaction.product_description}</p>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-[#7f5efd]/5 rounded-lg border border-[#7f5efd]/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-[#7f5efd]/10 rounded flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-[#7f5efd]" />
              </div>
              <h3 className="font-phonic text-sm font-semibold text-gray-900">Financial Breakdown</h3>
            </div>

            <div className="space-y-2 ml-8">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">Base Amount</span>
                <span className="text-sm font-medium text-gray-900">${transaction.gross_amount.toFixed(2)}</span>
              </div>

              {transaction.tax_amount > 0 && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">
                    Tax {transaction.tax_label && `(${transaction.tax_label})`}
                    {transaction.tax_percentage > 0 && (
                      <span className="text-xs text-gray-500 ml-1">{transaction.tax_percentage}%</span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-gray-900">+${transaction.tax_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">${saleTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">
                  Gateway Fees
                  {transaction.fee_payer && (
                    <span className="text-xs text-gray-500 ml-1">({transaction.fee_payer} paid)</span>
                  )}
                </span>
                <span
                  className={`text-sm font-medium ${
                    feesAmount === 0 ? 'text-gray-500' : feePaidByCustomer ? 'text-gray-900' : 'text-red-600'
                  }`}
                >
                  {feesDisplay}
                </span>
              </div>

              <div className="pt-3 mt-2 border-t border-[#7f5efd]/15 grid gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Customer Paid</span>
                  <span className="text-base font-semibold text-gray-900">${customerPaidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">You Received</span>
                  <span className="text-base font-semibold text-[#7f5efd]">${merchantNetAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Refund Information */}
            {transaction.refund_amount > 0 && (
              <div className="mt-3 ml-8 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800 text-sm">Refund Issued</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-700">Amount</span>
                    <span className="text-sm font-medium text-red-800">-${transaction.refund_amount.toFixed(2)}</span>
                  </div>
                  {transaction.refund_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-700">Date</span>
                      <span className="text-xs text-red-800">{formatCompactDateTime(transaction.refund_date, timezone)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Blockchain Verification */}
          {hasBlockchainSection && (
            <div className="bg-[#7f5efd]/5 rounded-lg border border-[#7f5efd]/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#7f5efd]/10 rounded flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 text-[#7f5efd]" />
                  </div>
                  <h3 className="font-phonic text-sm font-semibold text-gray-900">Blockchain Verification</h3>
                </div>
                {transaction.tx_hash && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-0.5">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="space-y-3 ml-8">
                {paymentAmountText && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Received</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900">{paymentAmountText}</span>
                      <button
                        onClick={() => copyToClipboard(paymentAmountText, 'Payment amount')}
                        className="shrink-0 p-1 hover:bg-[#7f5efd]/10 rounded transition-colors"
                        aria-label="Copy payment amount"
                      >
                        <Copy className="h-3 w-3 text-[#7f5efd]" />
                      </button>
                    </div>
                  </div>
                )}

                {transaction.tx_hash && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</span>
                      <button
                        onClick={() => copyToClipboard(transaction.tx_hash!, 'Transaction Hash')}
                        className="p-1 hover:bg-[#7f5efd]/10 rounded transition-colors"
                        aria-label="Copy transaction hash"
                      >
                        <Copy className="h-3 w-3 text-[#7f5efd]" />
                      </button>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#7f5efd]/10">
                      <p className="font-mono text-xs text-gray-700 break-all">{transaction.tx_hash}</p>
                    </div>
                  </div>
                )}

                {normalizedNetworkLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Network</span>
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-[#7f5efd]" />
                      <p className="text-sm text-gray-900">{normalizedNetworkLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {transaction.public_receipt_id && (
              <Button
                onClick={openReceipt}
                className={actionButtonClasses}
              >
                <ExternalLink className="h-4 w-4" />
                View Receipt
              </Button>
            )}

            {transaction.tx_hash && transaction.blockchain_network && (
              <Button
                onClick={openBlockchainExplorer}
                className={actionButtonClasses}
              >
                <ExternalLink className="h-4 w-4" />
                View on Blockchain Explorer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
