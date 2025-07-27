"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Copy, QrCode, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPaymentInstructions, getNetworkDisplayInfo } from '@/lib/trust-wallet-service'

interface PaymentDisplayProps {
  currency: string
  address: string
  amount?: number
  usdAmount?: number
  merchantName?: string
  description?: string
  orderId?: string
  onPaymentDetected?: () => void
}

export default function PaymentDisplay({
  currency,
  address,
  amount,
  usdAmount,
  merchantName,
  description,
  orderId,
  onPaymentDetected
}: PaymentDisplayProps) {
  const [addressCopied, setAddressCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Get payment instructions and network info
  const paymentInfo = getPaymentInstructions(currency)
  const networkInfo = paymentInfo ? getNetworkDisplayInfo(paymentInfo.currency.network) : null

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setAddressCopied(true)
      toast.success('Address copied to clipboard!')
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy address')
    }
  }

  const formatAmount = (amount: number, decimals: number = 8) => {
    return amount.toFixed(decimals).replace(/\.?0+$/, '')
  }

  if (!paymentInfo) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Unsupported currency: {currency}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const { currency: currencyInfo, instructions, warning } = paymentInfo

  return (
    <Card className="max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{currencyInfo.symbol}</span>
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Pay with {currencyInfo.code}
            </CardTitle>
            {merchantName && (
              <p className="text-sm text-gray-600">to {merchantName}</p>
            )}
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex justify-center">
          <Badge className={`${networkInfo?.color} border-0`}>
            {networkInfo?.name} Network
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Amount */}
        {amount && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatAmount(amount, currencyInfo.decimals)} {currencyInfo.code}
            </div>
            {usdAmount && (
              <div className="text-sm text-gray-600">
                ≈ ${usdAmount.toFixed(2)} USD
              </div>
            )}
          </div>
        )}

        {/* Payment Instructions */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>{instructions}</strong>
            {currencyInfo.display_name && (
              <div className="text-sm mt-1">
                Network: {currencyInfo.display_name}
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Network Warning */}
        {warning && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Important:</strong> {warning}
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Payment Address
            </label>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                className={addressCopied ? 'bg-green-50 border-green-200' : ''}
              >
                {addressCopied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {addressCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-gray-100 rounded-lg border">
            <div className="font-mono text-sm break-all text-gray-800">
              {address}
            </div>
          </div>
        </div>

        {/* QR Code Placeholder */}
        {showQR && (
          <div className="flex justify-center p-4 bg-white border rounded-lg">
            <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
              <div className="text-center text-gray-500">
                <QrCode className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">QR Code</p>
                <p className="text-xs">(Install qrcode-react for QR generation)</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Information */}
        {(description || orderId) && (
          <div className="pt-4 border-t border-gray-200">
            {description && (
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-700">Description: </span>
                <span className="text-sm text-gray-600">{description}</span>
              </div>
            )}
            {orderId && (
              <div>
                <span className="text-sm font-medium text-gray-700">Order ID: </span>
                <span className="text-sm text-gray-600 font-mono">{orderId}</span>
              </div>
            )}
          </div>
        )}

        {/* Payment Status */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>Waiting for payment...</span>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Payment will be confirmed automatically once received
          </p>
        </div>

        {/* Trust Wallet Badge */}
        <div className="flex justify-center pt-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            Trust Wallet Compatible
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

