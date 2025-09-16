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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 shadow-2xl rounded-xl">
        <DialogHeader className="relative pb-6 border-b border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7f5efd] via-[#a855f7] to-[#7f5efd] rounded-t-xl"></div>
          <div className="flex items-start justify-between pt-4">
            <div className="flex-1">
              <DialogTitle className="font-phonic text-2xl font-bold text-gray-900 mb-2">
                Transaction Details
              </DialogTitle>
              <DialogDescription className="font-capsule text-gray-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#7f5efd] rounded-full"></div>
                Payment ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{transaction.payment_id}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}
                className={`text-sm px-3 py-1 font-semibold ${
                  transaction.status === 'confirmed'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Transaction Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</p>
                  <p className="font-semibold text-gray-900">{formatDateShort(transaction.created_at, timezone)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">💰</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</p>
                  <p className="font-bold text-gray-900 text-lg">${transaction.total_paid.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {transaction.link_id && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">🔗</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Link ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">{transaction.link_id}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transaction.link_id!, 'Link ID')}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <Copy className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">📦</span>
              </div>
              <h3 className="font-phonic text-lg font-semibold text-gray-900">Product Details</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 font-medium">{transaction.product_description}</p>
              {transaction.currency_received && (
                <p className="text-sm text-gray-600 mt-2">
                  Received: <span className="font-mono font-semibold">{transaction.amount_received?.toFixed(8)} {transaction.currency_received.toUpperCase()}</span>
                </p>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 font-bold">💵</span>
              </div>
              <h3 className="font-phonic text-lg font-semibold text-gray-900">Financial Breakdown</h3>
            </div>

            <div className="space-y-4">
              {/* Amount Flow */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-100">
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Base Amount</div>
                    <div className="text-xl font-bold text-blue-700">${transaction.gross_amount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-100">
                    <div className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Tax Added</div>
                    <div className="text-xl font-bold text-amber-700">${transaction.tax_amount.toFixed(2)}</div>
                    {transaction.tax_percentage > 0 && (
                      <div className="text-xs text-amber-600 mt-1">{transaction.tax_percentage.toFixed(1)}%</div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-red-50 rounded-lg p-4 border-2 border-red-100">
                    <div className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">Gateway Fees</div>
                    <div className="text-xl font-bold text-red-700">${transaction.fees.toFixed(2)}</div>
                    {transaction.fee_payer && (
                      <div className="text-xs text-red-600 mt-1">Paid by {transaction.fee_payer}</div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">You Received</div>
                    <div className="text-2xl font-bold text-green-700">${transaction.net_amount.toFixed(2)}</div>
                    <div className="text-xs text-green-600 mt-1">Net Amount</div>
                  </div>
                </div>
              </div>

              {/* Visual Flow Arrows */}
              <div className="hidden md:flex items-center justify-center text-gray-400 -mt-2 -mb-2">
                <div className="flex items-center space-x-8">
                  <span>→</span>
                  <span>+</span>
                  <span>→</span>
                  <span>-</span>
                  <span>→</span>
                  <span>=</span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Customer Paid:</span>
                  <span className="text-lg font-bold text-gray-900">${transaction.total_paid.toFixed(2)}</span>
                </div>
                {transaction.tax_label && (
                  <div className="text-sm text-gray-600 mt-1">Tax: {transaction.tax_label}</div>
                )}
              </div>

              {/* Refund Information */}
              {transaction.refund_amount > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span className="font-semibold text-red-700">Refund Issued</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Refund Amount:</span>
                    <span className="text-lg font-bold text-red-700">-${transaction.refund_amount.toFixed(2)}</span>
                  </div>
                  {transaction.refund_date && (
                    <div className="text-sm text-red-600 mt-1">
                      Refunded on: {formatDateShort(transaction.refund_date, timezone)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Blockchain Verification */}
          {transaction.tx_hash && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <span className="text-violet-600 font-bold">⛓️</span>
                </div>
                <h3 className="font-phonic text-lg font-semibold text-gray-900">Blockchain Verification</h3>
                <div className="ml-auto">
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">✓ Verified</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Transaction Hash</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.tx_hash!, 'Transaction Hash')}
                      className="h-8 px-2 hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                      <span className="ml-1 text-xs">Copy</span>
                    </Button>
                  </div>
                  <div className="font-mono text-sm text-gray-900 bg-white p-3 rounded border break-all">
                    {transaction.tx_hash}
                  </div>
                </div>

                {transaction.blockchain_network && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Network</span>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                        {transaction.blockchain_network.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    onClick={openBlockchainExplorer}
                    className="w-full bg-gradient-to-r from-[#7f5efd] to-[#a855f7] hover:from-[#6b4fd8] hover:to-[#9333ea] text-white flex items-center justify-center gap-2 py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink className="h-5 w-5" />
                    View on Blockchain Explorer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-bold">⚡</span>
              </div>
              <h3 className="font-phonic text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {transaction.public_receipt_id && (
                <Button
                  onClick={openReceipt}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors px-4 py-2 rounded-lg font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Customer Receipt
                </Button>
              )}

              <Button
                onClick={() => copyToClipboard(transaction.payment_id, 'Payment ID')}
                className="flex items-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors px-4 py-2 rounded-lg font-medium"
              >
                <Copy className="h-4 w-4" />
                Copy Payment ID
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}