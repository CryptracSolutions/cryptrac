import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ArrowRight, ArrowLeft, Settings, HelpCircle, Loader2, Plus } from 'lucide-react'
import Tooltip from '@/app/components/ui/tooltip'
import { CryptoIcon } from '@/app/components/ui/crypto-icon'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Checkbox } from '@/app/components/ui/checkbox'
import toast from 'react-hot-toast'

interface TaxRate {
  id: string
  label: string
  percentage: string
}

interface PaymentConfigData {
  acceptedCryptos: string[]
  autoForward: boolean
  autoConvert: boolean
  preferredPayoutCurrency: string | null
  chargeCustomerFee: boolean
  // Tax configuration
  taxEnabled?: boolean
  taxStrategy?: 'origin' | 'destination' | 'custom'
  salesType?: 'local' | 'online' | 'both'
  taxRates?: TaxRate[]
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
    acceptedCryptos: data.acceptedCryptos.length > 0 ? data.acceptedCryptos : Object.keys(walletConfig.wallets || {}),
    // Tax configuration defaults
    taxEnabled: data.taxEnabled ?? false,
    taxStrategy: data.taxStrategy ?? 'origin',
    salesType: data.salesType ?? 'local',
    taxRates: data.taxRates ?? [{ id: '1', label: '', percentage: '' }]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get configured wallet currencies
  const configuredCurrencies = Object.keys(walletConfig.wallets || {})

  // Determine base currencies, automatically including ETH on Base if ETH is configured
  const baseCurrencies = useMemo(() => {
    const bases = [...configuredCurrencies]
    return bases
  }, [configuredCurrencies])

  // Expand base currencies to include available stable coins
  const expandedCurrencies = useMemo(() => {
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
    
    const expanded = [...baseCurrencies]
    baseCurrencies.forEach(currency => {
      const associatedStableCoins = stableCoinAssociations[currency] || []
      expanded.push(...associatedStableCoins)
    })
    return expanded
  }, [baseCurrencies])

  
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


  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Save only base currencies; stable coins are derived automatically
      const finalData = {
        ...formData,
        acceptedCryptos: baseCurrencies,
        autoForward: true, // Always enabled for non-custodial compliance
        // Include tax configuration
        taxEnabled: formData.taxEnabled,
        taxStrategy: formData.taxStrategy,
        salesType: formData.salesType,
        taxRates: formData.taxRates
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
      {/* Main Configuration Card */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-2xl font-bold text-gray-900 leading-tight">
              Payment Configuration
            </CardTitle>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Configure your payment preferences and fee settings. All cryptocurrencies from your wallet setup will be accepted.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-10">

            {/* Configured Cryptocurrencies Display */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Accepted Cryptocurrencies</h2>
                <div className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                  <span className="text-[#7f5efd] font-bold">{expandedCurrencies.length}</span> Total
                </div>
              </div>
              
              <Tooltip
                trigger={
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                }
                title="Accepted Cryptocurrencies"
                description={`Your ${baseCurrencies.length} base cryptocurrencies automatically include ${expandedCurrencies.length - baseCurrencies.length} stable coins for maximum payment flexibility. Customers can pay with any of these currencies, and you'll receive payments directly to your configured wallet addresses. All major stablecoins (USDC, USDT, DAI) are included automatically for each supported network.`}
                recommendedCurrencies={[]}
                className="w-full flex justify-start"
              />

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
                        <CryptoIcon currency={currency} size="sm" />
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
                          <CryptoIcon currency={currency} size="sm" />
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
          </CardContent>
        </Card>


        {/* Gateway Fee Settings */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-8 space-y-8">

            {/* Fee Responsibility Setting */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Gateway Fee Settings</h2>
              
              <Tooltip
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                }
                title="Gateway Fee Settings"
                description="Choose who pays the gateway fee. This setting can be overridden for individual payment links. Gateway fees are 0.5% for direct payments or 1% for auto-convert payments. When merchants pay the fee, customers see cleaner pricing. When customers pay the fee, you receive the full payment amount."
                recommendedCurrencies={[]}
                className="w-full flex justify-start"
              />

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
          </CardContent>
        </Card>

        {/* Tax Configuration */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">Tax Configuration</h2>
              <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Optional</Badge>
            </div>

            <Tooltip
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              }
              title="Tax Collection Settings"
              description="Configure tax collection for your payments. You can skip this step and configure it later in your settings. Tax collection automatically calculates and adds applicable taxes to payment amounts. Choose between origin-based (your location), destination-based (customer location), or custom rates. Cryptrac helps collect taxes but doesn't file them - consult your tax professional."
              recommendedCurrencies={[]}
              className="w-full flex justify-start"
            />

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  className="mt-1 data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd]"
                  checked={formData.taxEnabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      taxEnabled: !!checked
                    }))
                  }
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Enable Tax Collection</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically calculate and collect taxes on your payments
                  </p>
                </div>
              </div>

              {formData.taxEnabled && (
                <div className="ml-8 space-y-6">
                  {/* Tax Strategy */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Tax Strategy
                    </label>
                    <Select
                      value={formData.taxStrategy}
                      onValueChange={(value: 'origin' | 'destination' | 'custom') => 
                        setFormData(prev => ({ 
                          ...prev, 
                          taxStrategy: value 
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="origin">Origin-based (charge tax based on business location)</SelectItem>
                        <SelectItem value="destination">Destination-based (charge tax based on customer location)</SelectItem>
                        <SelectItem value="custom">Custom rates per transaction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sales Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Sales Type
                    </label>
                    <Select
                      value={formData.salesType}
                      onValueChange={(value: 'local' | 'online' | 'both') => 
                        setFormData(prev => ({ 
                          ...prev, 
                          salesType: value 
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Sales Only</SelectItem>
                        <SelectItem value="online">Online Sales Only</SelectItem>
                        <SelectItem value="both">Both Local and Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Default Tax Rates */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Default Tax Rates
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRate = {
                            id: `rate-${Date.now()}`,
                            label: '',
                            percentage: ''
                          }
                          setFormData(prev => ({
                            ...prev,
                            taxRates: [...(prev.taxRates || []), newRate]
                          }))
                        }}
                        className="text-sm h-8 px-3"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Rate
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.taxRates?.map((rate, index) => (
                        <div key={rate.id} className="flex items-center gap-3">
                          <Input
                            placeholder="Tax label (e.g., Sales Tax)"
                            value={rate.label}
                            onChange={(e) => {
                              const newRates = [...(formData.taxRates || [])]
                              newRates[index] = { ...rate, label: e.target.value }
                              setFormData(prev => ({ ...prev, taxRates: newRates }))
                            }}
                            className="flex-1 h-11 border-gray-300 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.0"
                              value={rate.percentage}
                              onChange={(e) => {
                                const newRates = [...(formData.taxRates || [])]
                                newRates[index] = { ...rate, percentage: e.target.value }
                                setFormData(prev => ({ ...prev, taxRates: newRates }))
                              }}
                              className="w-24 h-11 border-gray-300 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                          {(formData.taxRates?.length || 0) > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newRates = formData.taxRates?.filter((_, i) => i !== index) || []
                                setFormData(prev => ({ ...prev, taxRates: newRates }))
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-11 px-3"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Add tax rates that will be applied to your payments. You can customize these later.
                    </p>
                  </div>

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription className="text-yellow-800 text-sm">
                      <strong>Note:</strong> Cryptrac helps you charge and report taxes but does not file or remit taxes. Consult with a tax professional for compliance requirements.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto-Conversion Feature */}
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">Auto-Conversion</h2>
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Optional</Badge>
              </div>

              <Tooltip
                trigger={
                    <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                }
                title="Auto-Conversion Feature"
                description="Automatically convert all received payments to your preferred cryptocurrency. Higher gateway fee (1%) applies when enabled. This feature converts any crypto payment (Bitcoin, Ethereum, etc.) into your chosen currency before sending to your wallet. Useful for maintaining consistent holdings or receiving payments in stablecoins for price stability."
                recommendedCurrencies={[]}
                className="w-full flex justify-start"
              />

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
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
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
        </CardContent>
      </Card>


    </div>
  )
}