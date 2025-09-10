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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Main Configuration Card */}
      <Card className="shadow-medium">
        <CardHeader className="space-y-6">
          <CardTitle className="flex items-center gap-6">
            <Settings className="w-6 h-6 text-[#7f5efd]" />
            <span>Payment Configuration</span>
          </CardTitle>
          <p className="text-body text-gray-600">
            Configure your payment preferences and fee settings. All cryptocurrencies from your wallet setup will be accepted.
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Non-Custodial Compliance Notice */}
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Non-Custodial Security:</strong> Cryptrac automatically forwards all payments directly to your wallet addresses 
              immediately upon confirmation. We never hold your funds, ensuring maximum security and regulatory compliance.
            </AlertDescription>
          </Alert>

          {/* Configured Cryptocurrencies Display */}
          <div className="space-y-6">
            <h3 className="heading-sm text-gray-900 flex items-center gap-6">
              <span>Accepted Cryptocurrencies</span>
              <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                {expandedCurrencies.length} Total ({baseCurrencies.length} Base + {expandedCurrencies.length - baseCurrencies.length} Stable Coins)
              </div>
            </h3>
            
            <Alert className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 shadow-soft">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Info className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <AlertDescription className="text-purple-800">
                  <div className="font-semibold mb-1">Smart Configuration: Your X base cryptocurrencies automatically include X stable coins for maximum payment flexibility</div>
                  <p className="text-sm leading-relaxed">
                    Your {baseCurrencies.length} base cryptocurrencies automatically include {expandedCurrencies.length - baseCurrencies.length} stable coins for maximum payment flexibility.
                  </p>
                </AlertDescription>
              </div>
            </Alert>

            {/* Base Currencies */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-gray-700 leading-snug">Base Cryptocurrencies</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {baseCurrencies.map((currency) => (
                  <div
                    key={currency}
                    className="bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5 border border-[#7f5efd]/20 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:border-[#7f5efd]/40"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                        {currency.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base text-gray-900 leading-snug">
                          {currency}
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
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
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-gray-700 leading-snug">Included Stable Coins</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expandedCurrencies.filter(currency => !baseCurrencies.includes(currency)).map((currency) => (
                    <div
                      key={currency}
                      className="bg-gradient-to-br from-blue-50 to-emerald-50/50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                          $
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base text-gray-900 leading-snug">
                            {currency}
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            {getCurrencyDisplayName(currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {configuredCurrencies.length === 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  No wallet addresses configured. Please go back to the wallet setup step.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Interactive Fee Calculator */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 leading-snug">
              <DollarSign className="w-6 h-6 text-[#7f5efd]" />
              Fee Calculator
            </h3>
            
            <div className="bg-gradient-to-br from-[#7f5efd]/5 via-blue-50/30 to-[#9f7aea]/5 rounded-xl p-6 border border-[#7f5efd]/20 shadow-sm">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <Input
                        type="number"
                        value={calculatorAmount}
                        onChange={(e) => setCalculatorAmount(e.target.value)}
                        className="pl-8 h-12 text-lg font-semibold border-[#7f5efd]/30 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Fee Calculation Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Direct Payments (0.5%) */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="text-center space-y-4">
                      <h4 className="font-bold text-gray-900 text-lg leading-snug">Direct Payments</h4>
                      <div className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        0.5% Gateway Fee
                      </div>
                      
                      {(() => {
                        const amount = parseFloat(calculatorAmount) || 0
                        const merchantPays = calculateFees(amount, false, false)
                        const customerPays = calculateFees(amount, false, true)
                        
                        return (
                          <div className="space-y-3">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-sm font-semibold text-blue-900 mb-2">Merchant Pays Fee</div>
                              <div className="space-y-1 text-sm">
                                <div>Customer pays: <span className="font-bold">${merchantPays.customerPays.toFixed(2)}</span></div>
                                <div>You receive: <span className="font-bold text-green-600">${merchantPays.merchantReceives.toFixed(2)}</span></div>
                                <div className="text-xs text-gray-600">Gateway fee: ${merchantPays.gatewayFee.toFixed(2)}</div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="text-sm font-semibold text-gray-900 mb-2">Customer Pays Fee</div>
                              <div className="space-y-1 text-sm">
                                <div>Customer pays: <span className="font-bold">${customerPays.customerPays.toFixed(2)}</span></div>
                                <div>You receive: <span className="font-bold text-green-600">${customerPays.merchantReceives.toFixed(2)}</span></div>
                                <div className="text-xs text-gray-600">Gateway fee: ${customerPays.gatewayFee.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Auto-Convert (1%) */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="text-center space-y-4">
                      <h4 className="font-bold text-gray-900 text-lg leading-snug">Auto-Convert</h4>
                      <div className="text-sm text-gray-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                        1% Gateway Fee
                      </div>
                      
                      {(() => {
                        const amount = parseFloat(calculatorAmount) || 0
                        const merchantPays = calculateFees(amount, true, false)
                        const customerPays = calculateFees(amount, true, true)
                        
                        return (
                          <div className="space-y-3">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-sm font-semibold text-blue-900 mb-2">Merchant Pays Fee</div>
                              <div className="space-y-1 text-sm">
                                <div>Customer pays: <span className="font-bold">${merchantPays.customerPays.toFixed(2)}</span></div>
                                <div>You receive: <span className="font-bold text-green-600">${merchantPays.merchantReceives.toFixed(2)}</span></div>
                                <div className="text-xs text-gray-600">Gateway fee: ${merchantPays.gatewayFee.toFixed(2)}</div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="text-sm font-semibold text-gray-900 mb-2">Customer Pays Fee</div>
                              <div className="space-y-1 text-sm">
                                <div>Customer pays: <span className="font-bold">${customerPays.customerPays.toFixed(2)}</span></div>
                                <div>You receive: <span className="font-bold text-green-600">${customerPays.merchantReceives.toFixed(2)}</span></div>
                                <div className="text-xs text-gray-600">Gateway fee: ${customerPays.gatewayFee.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fee Responsibility Setting */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 leading-snug">
                <DollarSign className="w-6 h-6 text-[#7f5efd]" />
                Gateway Fee Settings
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeeDetails(!showFeeDetails)}
                className="text-[#7f5efd] hover:text-[#6b4fd8] border-[#7f5efd] hover:border-[#6b4fd8] hover:bg-[#7f5efd]/5"
              >
                {showFeeDetails ? 'Hide' : 'Learn More'} About Fees
              </Button>
            </div>
            
            <Alert className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 shadow-soft">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Info className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <AlertDescription className="text-purple-800">
                  <div className="font-semibold mb-1">Gateway Fee Responsibility: Choose who pays the gateway fee. This setting can be overridden for individual payment links.</div>
                  <p className="text-sm leading-relaxed">
                    Choose who pays the gateway fee. This setting can be overridden for individual payment links.
                  </p>
                </AlertDescription>
              </div>
            </Alert>

            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <Checkbox
                  className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd] data-[state=checked]:text-white transition-all duration-200 hover:border-[#7f5efd] focus:ring-2 focus:ring-[#7f5efd]/20"
                  checked={!formData.chargeCustomerFee}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      chargeCustomerFee: !checked
                    }))
                  }
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Merchant pays gateway fee</div>
                  <div className="text-body text-gray-600">
                    You absorb the gateway fee. Customers pay the exact amount shown.
                  </div>
                  <div className="text-body-sm text-green-600 mt-1">
                    ✓ Better customer experience - no surprise fees
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <Checkbox
                  className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd] data-[state=checked]:text-white transition-all duration-200 hover:border-[#7f5efd] focus:ring-2 focus:ring-[#7f5efd]/20"
                  checked={formData.chargeCustomerFee}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      chargeCustomerFee: !!checked
                    }))
                  }
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Customer pays gateway fee</div>
                  <div className="text-sm text-gray-600">
                    Gateway fee is added to the payment amount. You receive the full amount.
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    ✓ You receive the full payment amount
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-lg p-4 shadow-soft">
              <div className="flex items-start space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900">Gateway Fee Examples</h4>
                  <ul className="text-sm text-purple-800 mt-2 space-y-1">
                    <li>• <strong>Merchant pays (Direct):</strong> $100 payment = customer pays $100, you receive $99.50 (0.5% fee)</li>
                    <li>• <strong>Customer pays (Direct):</strong> $100 payment = customer pays $100.50, you receive $100</li>
                    <li>• <strong>Merchant pays (Auto-convert):</strong> $100 payment = customer pays $100, you receive $99.00 (1% fee)</li>
                    <li>• <strong>Customer pays (Auto-convert):</strong> $100 payment = customer pays $101.00, you receive $100</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Auto-Conversion Feature */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Auto-Conversion</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">About Auto-Convert OFF</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:rounded-xl bg-white">
                  <DialogHeader>
                    <DialogTitle>Auto-Convert OFF (Receive the Same Crypto)</DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="space-y-2 text-sm">
                    <p><strong>How it works:</strong> You receive exactly the same coin or token that your customer pays.</p>
                    <p><strong>Fees:</strong> Gateway Fee 0.5% per payment plus network fee. No conversion spread.</p>
                    <p><strong>Pros:</strong> Maximum payout predictability and lowest total fees—ideal for merchants comfortable holding or managing crypto.</p>
                  </DialogDescription>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">About Auto-Convert ON</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:rounded-xl bg-white">
                  <DialogHeader>
                    <DialogTitle>Auto-Convert ON (Auto-Convert to Preferred Cryptocurrency)</DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="space-y-2 text-sm">
                    <p><strong>How it works:</strong> Your payment is automatically converted to your chosen asset before being sent to your wallet.</p>
                    <p><strong>Fees:</strong> Gateway Fee 1% per payment plus conversion spread and network fee.</p>
                    <p><strong>Pros:</strong> Stable value and simplified accounting—ideal if you want payouts in one asset without price swings.</p>
                  </DialogDescription>
                </DialogContent>
              </Dialog>
            </div>

            <Alert className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 shadow-soft">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Info className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <AlertDescription className="text-purple-800">
                  <div className="font-semibold mb-1">Auto-Conversion: Automatically convert all received payments to your preferred cryptocurrency. Higher gateway fee (1%) applies when enabled.</div>
                  <p className="text-sm leading-relaxed">
                    Automatically convert all received payments to your preferred cryptocurrency. Higher gateway fee (1%) applies when enabled.
                  </p>
                </AlertDescription>
              </div>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd] data-[state=checked]:text-white transition-all duration-200 hover:border-[#7f5efd] focus:ring-2 focus:ring-[#7f5efd]/20"
                  checked={formData.autoConvert}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      autoConvert: !!checked,
                      // Clear preferred currency if auto-convert is disabled
                      preferredPayoutCurrency: checked ? prev.preferredPayoutCurrency : null
                    }))
                  }
                />
                <div>
                  <div className="font-medium text-gray-900">Enable Auto-Conversion</div>
                  <div className="text-sm text-gray-600">
                    Automatically convert all received payments to your preferred currency
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    ⚠️ Higher gateway fee (1% instead of 0.5%) applies when enabled
                  </div>
                </div>
              </div>

              {formData.autoConvert && (
                <div className="space-y-2 ml-6">
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
                    <SelectTrigger className="form-input-enhanced w-full">
                      <SelectValue placeholder="Select preferred payout currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {expandedCurrencies.map((currency) => (
                        <SelectItem
                          key={currency}
                          value={currency}
                          textValue={`${currency} - ${getCurrencyDisplayName(currency)}`}
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
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              onClick={onPrevious}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || configuredCurrencies.length === 0}
              className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Fee Documentation */}
      {showFeeDetails && (
        <FeeDocumentation 
          variant="full" 
          showComparison={true}
          showNetworkFees={true}
          showGatewayFees={true}
        />
      )}
    </div>
  )
}
