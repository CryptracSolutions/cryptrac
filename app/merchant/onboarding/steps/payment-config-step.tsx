'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { ArrowRight, ArrowLeft, Settings, DollarSign, HelpCircle, Info, Loader2, Shield } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Checkbox } from '@/app/components/ui/checkbox'
import toast from 'react-hot-toast'

interface PaymentConfigData {
  acceptedCryptos: string[]
  feePercentage: number
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

  // Get configured wallet currencies
  const configuredCurrencies = Object.keys(walletConfig.wallets || {})
  
  // Stable coin associations for automatic inclusion
  const stableCoinAssociations: Record<string, string[]> = {
    'SOL': ['USDCSOL', 'USDTSOL'],
    'ETH': ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'LUSD', 'USDP', 'GUSD', 'PYUSD', 'USDE', 'FDUSD'],
    'BNB': ['USDTBSC', 'USDCBSC', 'BUSDBSC', 'DAIBSC', 'TUSDBSC', 'FDUSDBSC'],
    'MATIC': ['USDTMATIC', 'USDCMATIC', 'DAIMATIC'],
    'AVAX': ['USDTAVAX', 'USDCAVAX'],
    'TRX': ['USDTTRC20', 'USDDTRC20'],
    'ARB': ['USDTARB', 'USDCARB'],
    'OP': ['USDTOP', 'USDCOP']
  }

  // Expand configured currencies to include available stable coins
  const expandedCurrencies = React.useMemo(() => {
    const expanded = [...configuredCurrencies]
    
    configuredCurrencies.forEach(currency => {
      const associatedStableCoins = stableCoinAssociations[currency] || []
      expanded.push(...associatedStableCoins)
    })
    
    return expanded
  }, [configuredCurrencies])
  
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
    // Stable coins
    'USDT': 'Tether (Ethereum)',
    'USDC': 'USD Coin (Ethereum)', 
    'DAI': 'Dai (Ethereum)',
    'BUSD': 'BUSD (Ethereum)',
    'TUSD': 'TrueUSD (Ethereum)',
    'FRAX': 'Frax (Ethereum)',
    'LUSD': 'Liquity USD (Ethereum)',
    'USDP': 'Pax Dollar (Ethereum)',
    'GUSD': 'Gemini Dollar (Ethereum)',
    'PYUSD': 'PayPal USD (Ethereum)',
    'USDE': 'Ethena USDe (Ethereum)',
    'FDUSD': 'First Digital USD (Ethereum)',
    'USDCSOL': 'USD Coin (Solana)',
    'USDTSOL': 'Tether (Solana)',
    'USDTBSC': 'Tether (BSC)',
    'USDCBSC': 'USD Coin (BSC)',
    'BUSDBSC': 'BUSD (BSC)',
    'DAIBSC': 'Dai (BSC)',
    'TUSDBSC': 'TrueUSD (BSC)',
    'FDUSDBSC': 'First Digital USD (BSC)',
    'USDTMATIC': 'Tether (Polygon)',
    'USDCMATIC': 'USD Coin (Polygon)',
    'DAIMATIC': 'Dai (Polygon)',
    'USDTAVAX': 'Tether (Avalanche)',
    'USDCAVAX': 'USD Coin (Avalanche)',
    'USDTTRC20': 'Tether (Tron)',
    'USDDTRC20': 'USDD (Tron)',
    'USDTARB': 'Tether (Arbitrum)',
    'USDCARB': 'USD Coin (Arbitrum)',
    'USDTOP': 'Tether (Optimism)',
    'USDCOP': 'USD Coin (Optimism)'
  }

  const getCurrencyDisplayName = (code: string) => {
    return CURRENCY_NAMES[code] || code
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Ensure accepted cryptos includes all configured wallet currencies and their stable coins
      // and autoForward is always true for non-custodial compliance
      const finalData = {
        ...formData,
        acceptedCryptos: expandedCurrencies, // Use expanded currencies including stable coins
        autoForward: true // Always enabled for non-custodial compliance
      }
      
      onComplete(finalData)
      toast.success('Payment configuration saved!')
      
    } catch (error) {
      console.error('Error saving payment config:', error)
      toast.error('Failed to save payment configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-[#7f5efd]" />
          <span>Payment Configuration</span>
        </CardTitle>
        <p className="text-gray-600">
          Configure your payment preferences and fee settings. All cryptocurrencies from your wallet setup will be accepted.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Non-Custodial Compliance Notice */}
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Non-Custodial Security:</strong> Cryptrac automatically forwards all payments directly to your wallet addresses 
            immediately upon confirmation. We never hold your funds, ensuring maximum security and regulatory compliance.
          </AlertDescription>
        </Alert>

        {/* Configured Cryptocurrencies Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>Accepted Cryptocurrencies</span>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              {expandedCurrencies.length} Total ({configuredCurrencies.length} Base + {expandedCurrencies.length - configuredCurrencies.length} Stable Coins)
            </Badge>
          </h3>
          
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Smart Configuration:</strong> Your {configuredCurrencies.length} base cryptocurrencies automatically include {expandedCurrencies.length - configuredCurrencies.length} stable coins for maximum payment flexibility.
            </AlertDescription>
          </Alert>

          {/* Base Currencies */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Base Cryptocurrencies</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {configuredCurrencies.map((currency) => (
                <div
                  key={currency}
                  className="border border-green-200 bg-green-50 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-green-900">
                        {currency}
                      </div>
                      <div className="text-xs text-green-700">
                        {getCurrencyDisplayName(currency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stable Coins */}
          {expandedCurrencies.length > configuredCurrencies.length && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Included Stable Coins</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {expandedCurrencies.filter(currency => !configuredCurrencies.includes(currency)).map((currency) => (
                  <div
                    key={currency}
                    className="border border-blue-200 bg-blue-50 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-blue-900">
                          {currency}
                        </div>
                        <div className="text-xs text-blue-700">
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

        {/* Fee Responsibility Setting */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Gateway Fee Settings</span>
          </h3>
          
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Gateway Fee Responsibility:</strong> Choose who pays the gateway processing fees.
              This setting can be overridden for individual payment links.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
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
                <div className="text-sm text-gray-600">
                  You absorb the gateway fee. Customers pay the exact amount shown.
                </div>
                <div className="text-xs text-green-600 mt-1">
                  ✓ Better customer experience - no surprise fees
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <HelpCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">How Gateway Fees Work</h4>
                <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                  <li>• <strong>Merchant pays (Auto-convert OFF):</strong> $100 payment = customer pays $100, you receive $99.50 (0.5% fee)</li>
                  <li>• <strong>Customer pays (Auto-convert OFF):</strong> $100 payment = customer pays $100.50, you receive $100</li>
                  <li>• <strong>Merchant pays (Auto-convert ON):</strong> $100 payment = customer pays $100, you receive $99.00 (1% fee)</li>
                  <li>• <strong>Customer pays (Auto-convert ON):</strong> $100 payment = customer pays $101.00, you receive $100</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Conversion Feature */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Auto-Conversion</h3>
          
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Auto-Conversion:</strong> Automatically convert all received payments to your preferred cryptocurrency.
              Higher gateway fee (1%) applies when enabled.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select preferred payout currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {expandedCurrencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency} - {getCurrencyDisplayName(currency)}
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
  )
}

