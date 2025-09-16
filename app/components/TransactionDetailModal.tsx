"use client"

import React from 'react'
import {
  ExternalLink,
  Copy,
  Calendar,
  DollarSign,
  Link2,
  Package,
  TrendingUp,
  Receipt,
  AlertCircle,
  Shield,
  ChevronRight,
  Clock,
  Hash
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
    toast.success(`${label} copied to clipboard`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-lg">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="font-phonic text-xl font-semibold text-gray-900 mb-1">
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

        <div className="space-y-4 py-4">
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Date & Time */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Timestamp</p>
                  <p className="font-medium text-gray-900 text-sm">{formatCompactDateTime(transaction.created_at, timezone)}</p>
                </div>
              </div>
            </div>

            {/* Link ID */}
            {transaction.link_id && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                    <Link2 className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Link ID</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono text-sm text-gray-900 truncate">{transaction.link_id}</p>
                      <button
                        onClick={() => copyToClipboard(transaction.link_id!, 'Link ID')}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-gray-600" />
              <h3 className="font-phonic text-sm font-semibold text-gray-900">Product Description</h3>
            </div>
            <p className="text-gray-800 text-sm">{transaction.product_description}</p>
            {transaction.currency_received && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Payment received: <span className="font-mono font-medium text-gray-900">{transaction.amount_received?.toFixed(8)} {transaction.currency_received.toUpperCase()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <h3 className="font-phonic text-sm font-semibold text-gray-900">Financial Breakdown</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600">Base Amount</span>
                <span className="text-sm font-medium text-gray-900">${transaction.gross_amount.toFixed(2)}</span>
              </div>

              {transaction.tax_amount > 0 && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-600">
                    Tax {transaction.tax_label && `(${transaction.tax_label})`}
                    {transaction.tax_percentage > 0 && (
                      <span className="text-xs text-gray-500 ml-1">{transaction.tax_percentage}%</span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-gray-900">+${transaction.tax_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600">
                  Gateway Fees
                  {transaction.fee_payer && (
                    <span className="text-xs text-gray-500 ml-1">({transaction.fee_payer} paid)</span>
                  )}
                </span>
                <span className="text-sm font-medium text-gray-900">-${transaction.fees.toFixed(2)}</span>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Customer Paid</span>
                  <span className="text-base font-semibold text-gray-900">${transaction.total_paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-gray-700">You Received</span>
                  <span className="text-base font-semibold text-[#7f5efd]">${transaction.net_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Refund Information */}
            {transaction.refund_amount > 0 && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
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
          {transaction.tx_hash && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <h3 className="font-phonic text-sm font-semibold text-gray-900">Blockchain Verification</h3>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-0.5">
                  Verified
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</span>
                    <button
                      onClick={() => copyToClipboard(transaction.tx_hash!, 'Transaction Hash')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Copy className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <p className="font-mono text-xs text-gray-700 break-all">{transaction.tx_hash}</p>
                  </div>
                </div>

                {transaction.blockchain_network && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Network</span>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {transaction.blockchain_network.replace('-', ' ').replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                )}

                <Button
                  onClick={openBlockchainExplorer}
                  className="w-full bg-[#7f5efd] hover:bg-[#6b4fd8] text-white flex items-center justify-center gap-2 h-9 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Blockchain Explorer
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {transaction.public_receipt_id && (
              <Button
                onClick={openReceipt}
                variant="outline"
                className="flex items-center gap-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 h-9 text-sm"
              >
                <Receipt className="h-4 w-4" />
                View Receipt
              </Button>
            )}

            <Button
              onClick={() => copyToClipboard(transaction.payment_id, 'Payment ID')}
              variant="outline"
              className="flex items-center gap-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 h-9 text-sm"
            >
              <Hash className="h-4 w-4" />
              Copy Payment ID
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}