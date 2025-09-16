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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border-[#7f5efd] shadow-xl">
        <DialogHeader className="text-center pb-3">
          <DialogTitle className="font-phonic text-xl font-bold text-gray-900">
            Transaction Details
          </DialogTitle>
          <DialogDescription className="font-capsule text-sm text-gray-600 leading-relaxed">
            Complete information for transaction {transaction.payment_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Transaction Info */}
          <div className="bg-[#7f5efd]/5 p-4 rounded-lg border border-[#7f5efd]/20">
            <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-3">Transaction Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Payment ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-200">
                      {transaction.payment_id}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.payment_id, 'Payment ID')}
                      className="h-8 w-8 p-0 hover:bg-[#7f5efd]/10"
                    >
                      <Copy className="h-4 w-4 text-[#7f5efd]" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1 bg-white px-3 py-2 rounded border border-gray-200">
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
                      <span className="font-mono text-sm bg-[#7f5efd]/20 text-[#7f5efd] px-3 py-2 rounded border border-[#7f5efd]/30">
                        {transaction.link_id}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transaction.link_id!, 'Link ID')}
                        className="h-8 w-8 p-0 hover:bg-[#7f5efd]/10"
                      >
                        <Copy className="h-4 w-4 text-[#7f5efd]" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Description</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1 bg-white px-3 py-2 rounded border border-gray-200">
                    {transaction.product_description}
                  </p>
                </div>

                {transaction.currency_received && (
                  <div>
                    <label className="font-phonic text-sm font-medium text-gray-700">Currency Received</label>
                    <p className="font-capsule text-sm text-gray-900 mt-1 bg-white px-3 py-2 rounded border border-gray-200">
                      {transaction.amount_received?.toFixed(8)} {transaction.currency_received.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-[#7f5efd]/5 p-4 rounded-lg border border-[#7f5efd]/20">
            <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-3">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Gross Amount</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1 bg-white px-3 py-2 rounded border border-gray-200 font-semibold">
                    ${transaction.gross_amount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Tax</label>
                  <div className="mt-1 bg-white px-3 py-2 rounded border border-gray-200">
                    <p className="font-capsule text-sm text-gray-900 font-semibold">
                      ${transaction.tax_amount.toFixed(2)}
                    </p>
                    {transaction.tax_label && (
                      <p className="text-xs text-gray-600 mt-1">{transaction.tax_label}</p>
                    )}
                    {transaction.tax_percentage > 0 && (
                      <p className="text-xs text-gray-600 mt-1">{transaction.tax_percentage.toFixed(2)}% rate</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Gateway Fees</label>
                  <div className="mt-1 bg-white px-3 py-2 rounded border border-gray-200">
                    <p className="font-capsule text-sm text-gray-900 font-semibold">
                      ${transaction.fees.toFixed(2)}
                    </p>
                    {transaction.fee_payer && (
                      <span className="inline-block mt-1 text-xs bg-[#7f5efd]/20 text-[#7f5efd] px-2 py-1 rounded">
                        Paid by: {transaction.fee_payer}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Total Paid by Customer</label>
                  <p className="font-capsule text-lg text-gray-900 mt-1 font-bold bg-white px-3 py-2 rounded border border-gray-200">
                    ${transaction.total_paid.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Net Amount Received</label>
                  <p className="font-capsule text-lg text-green-600 mt-1 font-bold bg-white px-3 py-2 rounded border border-gray-200">
                    ${transaction.net_amount.toFixed(2)}
                  </p>
                </div>

                {transaction.refund_amount > 0 && (
                  <div>
                    <label className="font-phonic text-sm font-medium text-gray-700">Refund Amount</label>
                    <div className="mt-1 bg-red-50 px-3 py-2 rounded border border-red-200">
                      <p className="font-capsule text-sm text-red-600 font-semibold">
                        -${transaction.refund_amount.toFixed(2)}
                      </p>
                      {transaction.refund_date && (
                        <p className="text-xs text-red-500 mt-1">
                          Refunded: {formatDateShort(transaction.refund_date, timezone)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Blockchain Details */}
          {transaction.tx_hash && (
            <div className="bg-[#7f5efd]/5 p-4 rounded-lg border border-[#7f5efd]/20">
              <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-3">Blockchain Verification</h3>
              <div className="space-y-3">
                <div>
                  <label className="font-phonic text-sm font-medium text-gray-700">Transaction Hash</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-white px-3 py-2 rounded border border-gray-200 flex-1 break-all">
                      {transaction.tx_hash}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.tx_hash!, 'Transaction Hash')}
                      className="h-8 w-8 p-0 flex-shrink-0 hover:bg-[#7f5efd]/10"
                    >
                      <Copy className="h-4 w-4 text-[#7f5efd]" />
                    </Button>
                  </div>
                </div>

                {transaction.blockchain_network && (
                  <div>
                    <label className="font-phonic text-sm font-medium text-gray-700">Blockchain Network</label>
                    <p className="font-capsule text-sm text-gray-900 mt-1 bg-white px-3 py-2 rounded border border-gray-200 capitalize font-semibold">
                      {transaction.blockchain_network.replace('-', ' ')}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    onClick={openBlockchainExplorer}
                    className="bg-[#7f5efd] hover:bg-[#6b4fd8] text-white flex items-center gap-2 transition-colors duration-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Blockchain Explorer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {transaction.public_receipt_id && (
            <div className="bg-[#7f5efd]/5 p-4 rounded-lg border border-[#7f5efd]/20">
              <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={openReceipt}
                  className="border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd] hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Customer Receipt
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}