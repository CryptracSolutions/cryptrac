import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ArrowRight, ArrowLeft, Settings, DollarSign, HelpCircle, Info, Loader2, Shield } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Separator } from '@/app/components/ui/separator'
import FeeDocumentation from '@/app/components/fee-documentation'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import toast from 'react-hot-toast'

interface PaymentConfigData {
  acceptedCryptos: string[]
  autoForward: boolean
  autoConvert: boolean
  preferredPayoutCurrency: string | null
  chargeCustomerFee: boolean
}

interface PaymentConfigStepProps {
  data: PaymentConfigData
  walletConfig: {
    wallets: Record<string, string>
    selectedCurrencies?: string[]
  }
  onComplete: (data: PaymentConfigData) => void
  onPrevious: () => void
}

export default function PaymentConfigStep({ data, walletConfig, onComplete, onPrevious }: PaymentConfigStepProps) {
  const [formData, setFormData] = useState<PaymentConfigData>({
    ...data,
    chargeCustomerFee: data.chargeCustomerFee ?? false,
    autoForward: true, // Always enabled for non-custodial compliance
    // Auto-set accepted cryptos from wallet config
    acceptedCryptos: data.acceptedCryptos.length > 0 ? data.acceptedCryptos : Object.keys(walletConfig.wallets || {})
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [calculatorAmount, setCalculatorAmount] = useState<string>('100')

  // Get configured wallet currencies
  const configuredCurrencies = Object.keys(walletConfig.wallets || {})

  // Determine base currencies, automatically including ETH on Base if ETH is configured
  const baseCurrencies = React.useMemo(() => {
    const bases = [...configuredCurrencies]

    return bases
  }, [configuredCurrencies])

  // Stable coin associations for automatic inclusion
  const stableCoinAssociations: Record<string, string[]> = {
    'SOL': ['USDCSOL', 'USDTSOL'],
    'ETH': ['USDT', 'USDC', 'DAI', 'PYUSD'],
    'BNB': ['USDTBSC', 'USDCBSC'],
    'MATIC': ['USDTMATIC', 'USDCMATIC'],
    'TRX': ['USDTTRC20'],
    'TON': ['USDTTON'],
    'ARB': ['USDTARB', 'USDCARB'],
    'OP': ['USDTOP', 'USDCOP'],
    'ETHBASE': ['USDCBASE'],
    'ALGO': ['USDCALGO']
  }

  // Expand base currencies to include available stable coins
  const expandedCurrencies = React.useMemo(() => {
    const expanded = [...baseCurrencies]
    baseCurrencies.forEach(currency => {
      const associatedStableCoins = stableCoinAssociations[currency] || []
      expanded.push(...associatedStableCoins)
    })
    return expanded
  }, [baseCurrencies]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Currency display names mapping (updated with comprehensive stable coins)
  const CURRENCY_NAMES: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'BNB',
    'SOL': 'Solana',
    'TRX': 'TRON',
    'TON': 'Toncoin',
    'AVAX': 'Avalanche',
    'DOGE': 'Dogecoin',
    'XRP': 'XRP',
    'SUI': 'Sui',
    'MATIC': 'Polygon',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'LTC': 'Litecoin',
    'XLM': 'Stellar',
    'ARB': 'Arbitrum',
    'OP': 'Optimism',
    'ETHBASE': 'ETH (Base)',
    'ALGO': 'Algorand',
    // Stable coins
    'USDT': 'Tether (Ethereum)',
    'USDC': 'USD Coin (Ethereum)',
    'DAI': 'Dai (Ethereum)',
    'PYUSD': 'PayPal USD (Ethereum)',
    'USDCSOL': 'USD Coin (Solana)',
    'USDTSOL': 'Tether (Solana)',
    'USDTBSC': 'Tether (BSC)',
    'USDCBSC': 'USD Coin (BSC)',
    'USDTMATIC': 'Tether (Polygon)',
    'USDCMATIC': 'USD Coin (Polygon)',
    'USDTTRC20': 'Tether (Tron)',
    'USDTTON': 'Tether (TON)',
    'USDTARB': 'Tether (Arbitrum)',
    'USDCARB': 'USD Coin (Arbitrum)',
    'USDTOP': 'Tether (Optimism)',
    'USDCOP': 'USD Coin (Optimism)',
    'USDCBASE': 'USD Coin (Base)',
    'USDCALGO': 'USD Coin (Algorand)'
  }

  const getCurrencyDisplayName = (code: string) => {
    return CURRENCY_NAMES[code] || code
  }

  // Fee calculation helper
  const calculateFees = (amount: number, isAutoConvert: boolean, customerPays: boolean) => {
    const gatewayRate = isAutoConvert ? 0.01 : 0.005
    const gatewayFee = amount * gatewayRate
    
    if (customerPays) {
      return {
        customerPays: amount + gatewayFee,
        merchantReceives: amount,
        gatewayFee: gatewayFee
      }
    } else {
      return {
        customerPays: amount,
        merchantReceives: amount - gatewayFee,
        gatewayFee: gatewayFee
      }
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Save only base currencies; stable coins are derived automatically
      const finalData = {
        ...formData,
        acceptedCryptos: baseCurrencies,
        autoForward: true // Always enabled for non-custodial compliance
      }
      
      onComplete(finalData)
              toast.success('Saved')
      
    } catch (error) {
      console.error('Error saving payment config:', error)
      toast.error('Failed to save payment configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Settings className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Payment Configuration</h1>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Configure your payment preferences and fee settings. All cryptocurrencies from your wallet setup will be accepted.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Main Configuration Card */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-8 space-y-10">
            {/* Non-Custodial Compliance Notice */}
            <Alert className="border-gray-200 bg-gray-50">
              <Shield className="h-5 w-5 text-[#7f5efd]" />
              <AlertDescription className="text-gray-700">
                <span className="font-semibold text-gray-900">Non-Custodial Security:</span> Cryptrac automatically forwards all payments directly to your wallet addresses immediately upon confirmation. We never hold your funds.
              </AlertDescription>
            </Alert>

            {/* Configured Cryptocurrencies Display */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Accepted Cryptocurrencies</h2>
                <div className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                  {expandedCurrencies.length} Total
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#7f5efd] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">
                      Your <span className="font-semibold">{baseCurrencies.length} base cryptocurrencies</span> automatically include <span className="font-semibold">{expandedCurrencies.length - baseCurrencies.length} stable coins</span> for maximum payment flexibility.
                    </p>
                  </div>
                </div>
              </div>

              {/* Base Currencies */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Base Cryptocurrencies</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {baseCurrencies.map((currency) => (
                    <div
                      key={currency}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#7f5efd]/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#7f5efd] rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {currency.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {currency}
                          </div>
                          <div className="text-xs text-gray-600">
                            {getCurrencyDisplayName(currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stable Coins */}
              {expandedCurrencies.length > baseCurrencies.length && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Included Stable Coins</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {expandedCurrencies.filter(currency => !baseCurrencies.includes(currency)).map((currency) => (
                      <div
                        key={currency}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            $
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {currency}
                            </div>
                            <div className="text-xs text-gray-600">
                              {getCurrencyDisplayName(currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {configuredCurrencies.length === 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  No wallet addresses configured. Please go back to the wallet setup step.
                </AlertDescription>
              </Alert>
            )}
          </div>

        </Card>

        {/* Fee Calculator Section */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-[#7f5efd]" />
                <h2 className="text-lg font-bold text-gray-900">Fee Calculator</h2>
              </div>
              
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <Input
                    type="number"
                    value={calculatorAmount}
                    onChange={(e) => setCalculatorAmount(e.target.value)}
                    className="pl-8 h-11 border-gray-300 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Direct Payments */}
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 mb-1">Direct Payments</h3>
                      <div className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border">
                        0.5% Gateway Fee
                      </div>
                    </div>
                    
                    {(() => {
                      const amount = parseFloat(calculatorAmount) || 0
                      const merchantPays = calculateFees(amount, false, false)
                      const customerPays = calculateFees(amount, false, true)
                      
                      return (
                        <div className="space-y-3 text-sm">
                          <div className="bg-white rounded p-3 border">
                            <div className="font-medium text-gray-700 mb-1">Merchant Pays</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Customer pays: <span className="font-semibold text-gray-900">${merchantPays.customerPays.toFixed(2)}</span></div>
                              <div>You receive: <span className="font-semibold text-[#7f5efd]">${merchantPays.merchantReceives.toFixed(2)}</span></div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded p-3 border">
                            <div className="font-medium text-gray-700 mb-1">Customer Pays</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Customer pays: <span className="font-semibold text-gray-900">${customerPays.customerPays.toFixed(2)}</span></div>
                              <div>You receive: <span className="font-semibold text-[#7f5efd]">${customerPays.merchantReceives.toFixed(2)}</span></div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Auto-Convert */}
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 mb-1">Auto-Convert</h3>
                      <div className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border">
                        1% Gateway Fee
                      </div>
                    </div>
                    
                    {(() => {
                      const amount = parseFloat(calculatorAmount) || 0
                      const merchantPays = calculateFees(amount, true, false)
                      const customerPays = calculateFees(amount, true, true)
                      
                      return (
                        <div className="space-y-3 text-sm">
                          <div className="bg-white rounded p-3 border">
                            <div className="font-medium text-gray-700 mb-1">Merchant Pays</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Customer pays: <span className="font-semibold text-gray-900">${merchantPays.customerPays.toFixed(2)}</span></div>
                              <div>You receive: <span className="font-semibold text-[#7f5efd]">${merchantPays.merchantReceives.toFixed(2)}</span></div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded p-3 border">
                            <div className="font-medium text-gray-700 mb-1">Customer Pays</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Customer pays: <span className="font-semibold text-gray-900">${customerPays.customerPays.toFixed(2)}</span></div>
                              <div>You receive: <span className="font-semibold text-[#7f5efd]">${customerPays.merchantReceives.toFixed(2)}</span></div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gateway Fee Settings */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-8 space-y-8">

            {/* Fee Responsibility Setting */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Gateway Fee Settings</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFeeDetails(!showFeeDetails)}
                  className="text-gray-600 hover:text-[#7f5efd] border-gray-300 hover:border-[#7f5efd] text-sm"
                >
                  {showFeeDetails ? 'Hide' : 'Learn More'}
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#7f5efd] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Choose who pays the gateway fee. This setting can be overridden for individual payment links.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    className="mt-1 data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd]"
                    checked={!formData.chargeCustomerFee}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        chargeCustomerFee: !checked
                      }))
                    }
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Merchant pays gateway fee</div>
                    <p className="text-sm text-gray-600 mt-1">
                      You absorb the gateway fee. Customers pay the exact amount shown.
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      Better customer experience
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Checkbox
                    className="mt-1 data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd]"
                    checked={formData.chargeCustomerFee}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        chargeCustomerFee: !!checked
                      }))
                    }
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Customer pays gateway fee</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Gateway fee is added to the payment amount. You receive the full amount.
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      You receive full payment amount
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </Card>

          {/* Auto-Conversion Feature */}
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">Auto-Conversion</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#7f5efd] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Automatically convert all received payments to your preferred cryptocurrency. Higher gateway fee (1%) applies when enabled.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    className="mt-1 data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd]"
                    checked={formData.autoConvert}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        autoConvert: !!checked,
                        preferredPayoutCurrency: checked ? prev.preferredPayoutCurrency : null
                      }))
                    }
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Enable Auto-Conversion</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically convert all received payments to your preferred currency
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      Higher gateway fee (1% instead of 0.5%) applies when enabled
                    </div>
                  </div>
                </div>

                {formData.autoConvert && (
                  <div className="ml-8 space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Preferred Payout Currency
                    </label>
                    <Select
                      value={formData.preferredPayoutCurrency || ''}
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          preferredPayoutCurrency: value 
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                        <SelectValue placeholder="Select preferred payout currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {expandedCurrencies.map((currency) => (
                          <SelectItem
                            key={currency}
                            value={currency}
                          >
                            {`${currency} - ${getCurrencyDisplayName(currency)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      All payments will be automatically converted to this currency before payout
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            onClick={onPrevious}
            variant="outline"
            className="flex items-center gap-2 px-6 h-11"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || configuredCurrencies.length === 0}
            className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white flex items-center gap-2 px-6 h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Fee Documentation */}
      {showFeeDetails && (
        <div className="mt-8">
          <FeeDocumentation 
            variant="full" 
            showComparison={true}
            showNetworkFees={true}
            showGatewayFees={true}
          />
        </div>
      )}
    </div>
  )
}
