import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Copy, QrCode, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentDisplayProps {
  currency: string
  address: string
  amount?: number
  usdAmount?: number
  merchantName?: string
  description?: string
  orderId?: string
}

// Payment instructions and network info (inline implementation)
const PAYMENT_INFO: Record<string, {
  currency: { code: string; symbol: string; name: string; network: string };
  instructions: string[];
  warning?: string;
}> = {
  BTC: {
    currency: { code: 'BTC', symbol: '₿', name: 'Bitcoin', network: 'Bitcoin' },
    instructions: [
      'Open your Bitcoin wallet',
      'Send the exact amount to the address below',
      'Wait for network confirmation'
    ],
    warning: 'Bitcoin transactions may take 10-60 minutes to confirm'
  },
  ETH: {
    currency: { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', network: 'Ethereum' },
    instructions: [
      'Open your Ethereum wallet',
      'Send the exact amount to the address below',
      'Ensure sufficient gas fees'
    ],
    warning: 'Gas fees may vary based on network congestion'
  },
  USDT_ERC20: {
    currency: { code: 'USDT', symbol: '₮', name: 'Tether', network: 'Ethereum' },
    instructions: [
      'Open your Ethereum wallet',
      'Send USDT (ERC-20) to the address below',
      'Ensure sufficient ETH for gas fees'
    ],
    warning: 'This is an ERC-20 token on Ethereum network'
  },
  USDC_ERC20: {
    currency: { code: 'USDC', symbol: '$', name: 'USD Coin', network: 'Ethereum' },
    instructions: [
      'Open your Ethereum wallet',
      'Send USDC (ERC-20) to the address below',
      'Ensure sufficient ETH for gas fees'
    ],
    warning: 'This is an ERC-20 token on Ethereum network'
  },
  DAI: {
    currency: { code: 'DAI', symbol: '$', name: 'Dai', network: 'Ethereum' },
    instructions: [
      'Open your Ethereum wallet',
      'Send DAI to the address below',
      'Ensure sufficient ETH for gas fees'
    ],
    warning: 'This is an ERC-20 token on Ethereum network'
  },
  PYUSD: {
    currency: { code: 'PYUSD', symbol: '$', name: 'PayPal USD', network: 'Ethereum' },
    instructions: [
      'Open your Ethereum wallet',
      'Send PYUSD to the address below',
      'Ensure sufficient ETH for gas fees'
    ],
    warning: 'This is an ERC-20 token on Ethereum network'
  },
  TRX: {
    currency: { code: 'TRX', symbol: 'TRX', name: 'TRON', network: 'Tron' },
    instructions: [
      'Open your TRON wallet',
      'Send the exact amount to the address below',
      'Low transaction fees on TRON network'
    ]
  },
  USDT_TRC20: {
    currency: { code: 'USDT', symbol: '₮', name: 'Tether', network: 'Tron' },
    instructions: [
      'Open your TRON wallet',
      'Send USDT (TRC-20) to the address below',
      'Very low transaction fees'
    ],
    warning: 'This is a TRC-20 token on TRON network'
  },
  SOL: {
    currency: { code: 'SOL', symbol: 'SOL', name: 'Solana', network: 'Solana' },
    instructions: [
      'Open your Solana wallet',
      'Send the exact amount to the address below',
      'Fast and low-cost transactions'
    ]
  },
  USDC_SOL: {
    currency: { code: 'USDC', symbol: '$', name: 'USD Coin', network: 'Solana' },
    instructions: [
      'Open your Solana wallet',
      'Send USDC (SPL) to the address below',
      'Fast and low-cost transactions'
    ],
    warning: 'This is an SPL token on Solana network'
  }
};

const NETWORK_INFO: Record<string, { name: string; color: string }> = {
  Bitcoin: { name: 'Bitcoin', color: 'bg-orange-100 text-orange-800' },
  Ethereum: { name: 'Ethereum', color: 'bg-blue-100 text-blue-800' },
  Tron: { name: 'TRON', color: 'bg-red-100 text-red-800' },
  Solana: { name: 'Solana', color: 'bg-green-100 text-green-800' },
  BSC: { name: 'BSC', color: 'bg-yellow-100 text-yellow-800' }
};

function getPaymentInstructions(currency: string) {
  return PAYMENT_INFO[currency.toUpperCase()];
}

function getNetworkDisplayInfo(network: string) {
  return NETWORK_INFO[network];
}

export default function PaymentDisplay({
  currency,
  address,
  amount,
  usdAmount,
  merchantName,
  description,
  orderId
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
    } catch {
      toast.error('Failed to copy address')
    }
  }

  const formatAmount = (amount: number, decimals: number = 8) => {
    return amount.toFixed(decimals).replace(/\.?0+$/, '')
  }

  if (!paymentInfo) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8">
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
              {formatAmount(amount)} {currencyInfo.code}
            </div>
            {usdAmount && (
              <div className="text-sm text-gray-600">
                ≈ ${usdAmount.toFixed(2)} USD
              </div>
            )}
          </div>
        )}

        {/* Payment Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Send to this address:
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
              <div className="font-mono text-sm break-all text-gray-900">
                {address}
              </div>
            </div>
            <Button
              onClick={copyAddress}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {addressCopied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* QR Code Button */}
        <Button
          onClick={() => setShowQR(!showQR)}
          variant="outline"
          className="w-full"
        >
          <QrCode className="w-4 h-4 mr-2" />
          {showQR ? 'Hide' : 'Show'} QR Code
        </Button>

        {/* Payment Instructions */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Payment Instructions:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="font-medium text-[#7f5efd] mt-0.5">{index + 1}.</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Warning */}
        {warning && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {warning}
            </AlertDescription>
          </Alert>
        )}

        {/* Order Info */}
        {(description || orderId) && (
          <div className="pt-4 border-t border-gray-200">
            {description && (
              <div className="text-sm text-gray-600 mb-2">
                <strong>Description:</strong> {description}
              </div>
            )}
            {orderId && (
              <div className="text-sm text-gray-600">
                <strong>Order ID:</strong> {orderId}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

