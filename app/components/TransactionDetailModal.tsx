"use client"

import React from 'react'
import { ExternalLink, Copy } from 'lucide-react'
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
import { formatDateShort } from '@/lib/utils/date-utils'
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-phonic text-xl font-semibold text-gray-900">
            Transaction Details
          </DialogTitle>
          <DialogDescription className="font-capsule text-sm text-gray-600">
            Complete information for transaction {transaction.payment_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="font-phonic text-sm font-medium text-gray-700">Payment ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {transaction.payment_id}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transaction.payment_id, 'Payment ID')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="font-phonic text-sm font-medium text-gray-700">Date & Time</label>
                <p className="font-capsule text-sm text-gray-900 mt-1">
                  {formatDateShort(transaction.created_at, timezone)}
                </p>
              </div>

              <div>
                <label className="font-phonic text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge
                    variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>

              {transaction.link_id && (
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Link ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-[#7f5efd]/10 text-[#7f5efd] px-2 py-1 rounded">
                      {transaction.link_id}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.link_id!, 'Link ID')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-phonic text-sm font-medium text-gray-700">Description</label>
                <p className="font-capsule text-sm text-gray-900 mt-1">
                  {transaction.product_description}
                </p>
              </div>

              {transaction.currency_received && (
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Currency Received</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">
                    {transaction.amount_received?.toFixed(8)} {transaction.currency_received.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Details */}
          <div className="border-t pt-4">
            <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-3">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Gross Amount</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">
                    ${transaction.gross_amount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Tax</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">
                    ${transaction.tax_amount.toFixed(2)}
                    {transaction.tax_label && ` (${transaction.tax_label})`}
                    {transaction.tax_percentage > 0 && ` - ${transaction.tax_percentage.toFixed(2)}%`}
                  </p>
                </div>

                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Gateway Fees</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">
                    ${transaction.fees.toFixed(2)}
                    {transaction.fee_payer && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                        Paid by: {transaction.fee_payer}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Total Paid by Customer</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1 font-semibold">
                    ${transaction.total_paid.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Net Amount Received</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1 font-semibold">
                    ${transaction.net_amount.toFixed(2)}
                  </p>
                </div>

                {transaction.refund_amount > 0 && (
                  <div>
                    <label className="font-phonic text-sm font-medium text-gray-700">Refund Amount</label>
                    <p className="font-capsule text-sm text-red-600 mt-1">
                      -${transaction.refund_amount.toFixed(2)}
                      {transaction.refund_date && (
                        <span className="block text-xs text-gray-500">
                          Refunded: {formatDateShort(transaction.refund_date, timezone)}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Blockchain Details */}
          {transaction.tx_hash && (
            <div className="border-t pt-4">
              <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-3">Blockchain Verification</h3>
              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Transaction Hash</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                      {transaction.tx_hash}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.tx_hash!, 'Transaction Hash')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {transaction.blockchain_network && (
                  <div>
                    <label className="font-phonic text-sm font-medium text-gray-700">Blockchain Network</label>
                    <p className="font-capsule text-sm text-gray-900 mt-1 capitalize">
                      {transaction.blockchain_network.replace('-', ' ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={openBlockchainExplorer}
                    className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Blockchain Explorer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4">
            <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="flex gap-2">
              {transaction.public_receipt_id && (
                <Button
                  variant="outline"
                  onClick={openReceipt}
                  className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200 flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Customer Receipt
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}