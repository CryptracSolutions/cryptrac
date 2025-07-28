import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ArrowRight, ArrowLeft, Settings, Shield, Loader2, CheckCircle, Info, DollarSign, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Checkbox } from '@/app/components/ui/checkbox'
import toast from 'react-hot-toast'

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  network?: string;
  is_token?: boolean;
  parent_currency?: string;
  trust_wallet_compatible?: boolean;
  address_format?: string;
  enabled: boolean;
  min_amount: number;
  max_amount?: number;
  decimals: number;
  icon_url?: string;
  rate_usd?: number;
}

interface PaymentConfigData {
  acceptedCryptos: string[]
  feePercentage: number
  autoForward: boolean
  autoConvert: boolean
  preferredPayoutCurrency: string | null
  chargeCustomerFee: boolean // New field for fee responsibility
}

interface PaymentConfigStepProps {
  data: PaymentConfigData
  onComplete: (data: PaymentConfigData) => void
  onPrevious: () => void
}

export default function PaymentConfigStep({ data, onComplete, onPrevious }: PaymentConfigStepProps) {
  const [formData, setFormData] = useState<PaymentConfigData>({
    ...data,
    chargeCustomerFee: data.chargeCustomerFee ?? false // Default to false if not set
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [popularCurrencies, setPopularCurrencies] = useState<string[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Popular cryptocurrencies for quick selection
  const POPULAR_CRYPTOS = [
    'BTC', 'ETH', 'USDT_ERC20', 'USDC_ERC20', 'BNB', 'SOL', 'TRX', 'USDT_TRC20', 'DOGE', 'XRP'
  ]

  useEffect(() => {
    loadAvailableCurrencies()
  }, [])

  const loadAvailableCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      
      const response = await fetch('/api/currencies')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAvailableCurrencies(result.currencies)
          
          // Set popular currencies based on what's available
          const availableCodes = result.currencies.map((c: CurrencyInfo) => c.code)
          const filteredPopular = POPULAR_CRYPTOS.filter(code => availableCodes.includes(code))
          setPopularCurrencies(filteredPopular)
          
          // Auto-select popular currencies if none selected
          if (formData.acceptedCryptos.length === 0) {
            setFormData(prev => ({
              ...prev,
              acceptedCryptos: filteredPopular.slice(0, 5) // Select first 5 popular
            }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load currencies:', error)
      toast.error('Failed to load available currencies')
      
      // Fallback to basic currencies
      const fallbackCurrencies = [
        { code: 'BTC', name: 'Bitcoin', symbol: '₿', enabled: true, min_amount: 0.00000001, decimals: 8 },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', enabled: true, min_amount: 0.000000001, decimals: 18 },
        { code: 'USDT_ERC20', name: 'Tether (ERC-20)', symbol: '₮', enabled: true, min_amount: 0.000001, decimals: 6 },
        { code: 'USDC_ERC20', name: 'USD Coin (ERC-20)', symbol: '$', enabled: true, min_amount: 0.000001, decimals: 6 }
      ]
      setAvailableCurrencies(fallbackCurrencies)
      setPopularCurrencies(['BTC', 'ETH', 'USDT_ERC20', 'USDC_ERC20'])
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const handleCryptoToggle = (crypto: string) => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptos: prev.acceptedCryptos.includes(crypto)
        ? prev.acceptedCryptos.filter(c => c !== crypto)
        : [...prev.acceptedCryptos, crypto]
    }))
  }

  const handleSelectAllPopular = () => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptos: [...new Set([...prev.acceptedCryptos, ...popularCurrencies])]
    }))
  }

  const handleClearAll = () => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptos: []
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.acceptedCryptos.length === 0) {
      newErrors.acceptedCryptos = 'Please select at least one cryptocurrency'
    }

    if (formData.feePercentage < 0 || formData.feePercentage > 10) {
      newErrors.feePercentage = 'Fee percentage must be between 0% and 10%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onComplete(formData)
      toast.success('Payment configuration saved!')
      
    } catch (error) {
      console.error('Error saving payment config:', error)
      toast.error('Failed to save payment configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrencyInfo = (code: string) => {
    return availableCurrencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8
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
          Configure which cryptocurrencies you want to accept and set your payment preferences.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Fee Responsibility Setting */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Fee Settings</span>
          </h3>
          
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Gateway Fee Responsibility:</strong> Choose who pays the gateway processing fees.
              This can be overridden for individual payment links.
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
                <h4 className="font-medium text-yellow-900">How it works</h4>
                <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                  <li>• <strong>Merchant pays:</strong> $100 payment = customer pays $100, you receive ~$98.50</li>
                  <li>• <strong>Customer pays:</strong> $100 payment = customer pays ~$101.50, you receive $100</li>
                  <li>• You can override this setting for individual payment links</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Accepted Cryptocurrencies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Accepted Cryptocurrencies</h3>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleSelectAllPopular}
                variant="outline"
                size="sm"
                disabled={loadingCurrencies}
              >
                Select Popular
              </Button>
              <Button
                type="button"
                onClick={handleClearAll}
                variant="outline"
                size="sm"
                disabled={loadingCurrencies}
              >
                Clear All
              </Button>
            </div>
          </div>

          {errors.acceptedCryptos && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {errors.acceptedCryptos}
              </AlertDescription>
            </Alert>
          )}

          {loadingCurrencies ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading available cryptocurrencies...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableCurrencies.map((currency) => (
                <div
                  key={currency.code}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    formData.acceptedCryptos.includes(currency.code)
                      ? 'border-[#7f5efd] bg-[#7f5efd]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCryptoToggle(currency.code)}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.acceptedCryptos.includes(currency.code)}
                      onChange={() => handleCryptoToggle(currency.code)}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {currency.symbol} {currency.code}
                      </div>
                      <div className="text-xs text-gray-500">{currency.name}</div>
                    </div>
                  </div>
                  {popularCurrencies.includes(currency.code) && (
                    <Badge variant="outline" className="mt-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Popular
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600">
            Selected: {formData.acceptedCryptos.length} cryptocurrencies
          </div>
        </div>

        {/* Fee Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Fee Configuration</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Processing Fee Percentage
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.feePercentage}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  feePercentage: parseFloat(e.target.value) || 0
                }))}
                className="w-32"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            {errors.feePercentage && (
              <p className="text-sm text-red-600">{errors.feePercentage}</p>
            )}
            <p className="text-xs text-gray-500">
              Additional fee charged on top of gateway fees (0-10%)
            </p>
          </div>
        </div>

        {/* Auto-Conversion (Coming Soon) */}
        <div className="space-y-4 opacity-50">
          <h3 className="text-lg font-semibold text-gray-900">Auto-Conversion</h3>
          
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Coming Soon:</strong> Auto-conversion features will allow you to automatically 
              convert received payments to your preferred cryptocurrency.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox disabled />
              <div>
                <div className="font-medium text-gray-700">Enable Auto-Conversion</div>
                <div className="text-sm text-gray-500">
                  Automatically convert all received payments to your preferred currency
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Preferred Payout Currency
              </label>
              <Select disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select preferred currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            disabled={isSubmitting || loadingCurrencies}
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

