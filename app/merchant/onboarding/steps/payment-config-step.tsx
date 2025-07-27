"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ArrowRight, ArrowLeft, Settings, Shield, Loader2, CheckCircle, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
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
}

interface PaymentConfigStepProps {
  data: PaymentConfigData
  onComplete: (data: PaymentConfigData) => void
  onPrevious: () => void
}

export default function PaymentConfigStep({ data, onComplete, onPrevious }: PaymentConfigStepProps) {
  const [formData, setFormData] = useState<PaymentConfigData>(data)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [popularCurrencies, setPopularCurrencies] = useState<string[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadAvailableCurrencies()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAvailableCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      
      // Load popular currencies first for better UX
      const popularResponse = await fetch('/api/currencies?popular=true')
      if (popularResponse.ok) {
        const popularData = await popularResponse.json()
        if (popularData.success) {
          setAvailableCurrencies(popularData.currencies)
          setPopularCurrencies(popularData.currencies.map((c: CurrencyInfo) => c.code))
          
          // Pre-select popular cryptocurrencies if none selected
          if (formData.acceptedCryptos.length === 0) {
            setFormData(prev => ({
              ...prev,
              acceptedCryptos: popularData.currencies.slice(0, 5).map((c: CurrencyInfo) => c.code)
            }))
          }
        }
      }
      
      // Then load all currencies
      const allResponse = await fetch('/api/currencies')
      if (allResponse.ok) {
        const allData = await allResponse.json()
        if (allData.success) {
          setAvailableCurrencies(allData.currencies)
        }
      }
      
    } catch (error) {
      console.error('Failed to load currencies:', error)
      toast.error('Failed to load available currencies')
      
      // Fallback to basic currencies
      const fallbackCurrencies = [
        { code: 'BTC', name: 'Bitcoin', symbol: '₿', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true, rate_usd: 45000 },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', enabled: true, min_amount: 0.000000001, decimals: 18, trust_wallet_compatible: true, rate_usd: 2800 },
        { code: 'USDT', name: 'Tether', symbol: '₮', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true, rate_usd: 1 },
        { code: 'USDC', name: 'USD Coin', symbol: '$', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true, rate_usd: 1 },
        { code: 'LTC', name: 'Litecoin', symbol: 'Ł', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true, rate_usd: 85 }
      ]
      setAvailableCurrencies(fallbackCurrencies)
      setPopularCurrencies(['BTC', 'ETH', 'USDT', 'USDC', 'LTC'])
      
      if (formData.acceptedCryptos.length === 0) {
        setFormData(prev => ({
          ...prev,
          acceptedCryptos: ['BTC', 'ETH', 'USDT', 'USDC', 'LTC']
        }))
      }
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
    
    // Clear error when user makes selection
    if (errors.acceptedCryptos) {
      setErrors(prev => ({ ...prev, acceptedCryptos: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.acceptedCryptos.length === 0) {
      newErrors.acceptedCryptos = 'Please select at least one cryptocurrency'
    }

    if (formData.feePercentage < 0 || formData.feePercentage > 10) {
      newErrors.feePercentage = 'Fee percentage must be between 0% and 10%'
    }

    if (formData.autoConvert && !formData.preferredPayoutCurrency) {
      newErrors.preferredPayoutCurrency = 'Please select a preferred payout currency for auto-conversion'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onComplete(formData)
    setIsSubmitting(false)
  }

  const getCurrencyInfo = (code: string) => {
    return availableCurrencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      trust_wallet_compatible: true
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Payment Configuration
          </CardTitle>
          <p className="text-gray-600">
            Configure which cryptocurrencies you accept and your payment settings
          </p>
          {loadingCurrencies && (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading available currencies...</span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Accepted Cryptocurrencies */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Accepted Cryptocurrencies *
              </label>
              
              {loadingCurrencies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading currencies...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Popular Currencies */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Popular Currencies</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableCurrencies
                        .filter(currency => popularCurrencies.includes(currency.code))
                        .map(currency => {
                          const isSelected = formData.acceptedCryptos.includes(currency.code)
                          
                          return (
                            <div
                              key={currency.code}
                              onClick={() => handleCryptoToggle(currency.code)}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-[#7f5efd] bg-[#7f5efd]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-lg">{currency.symbol}</span>
                                  <span className="text-sm font-medium">{currency.code}</span>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-[#7f5efd]" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {currency.name}
                                {currency.network && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    {currency.network}
                                  </Badge>
                                )}
                              </div>
                              {currency.rate_usd && (
                                <div className="text-xs text-gray-400 mt-1">
                                  ${currency.rate_usd.toLocaleString()}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* All Other Currencies */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      All Currencies ({availableCurrencies.length} available)
                    </h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
                      <div className="grid grid-cols-4 gap-2">
                        {availableCurrencies
                          .filter(currency => !popularCurrencies.includes(currency.code))
                          .map(currency => {
                            const isSelected = formData.acceptedCryptos.includes(currency.code)
                            
                            return (
                              <div
                                key={currency.code}
                                onClick={() => handleCryptoToggle(currency.code)}
                                className={`p-2 text-xs border rounded cursor-pointer transition-colors text-center ${
                                  isSelected
                                    ? 'border-[#7f5efd] bg-[#7f5efd]/5 text-[#7f5efd]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="font-medium">{currency.symbol}</div>
                                <div className="text-xs">{currency.code}</div>
                                {isSelected && <CheckCircle className="w-3 h-3 mx-auto mt-1" />}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Selected Summary */}
                  {formData.acceptedCryptos.length > 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-medium">
                            Selected: {formData.acceptedCryptos.length} cryptocurrencies
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {formData.acceptedCryptos.map(crypto => {
                              const currencyInfo = getCurrencyInfo(crypto)
                              return (
                                <Badge key={crypto} variant="secondary" className="text-xs">
                                  {currencyInfo.symbol} {crypto}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              {errors.acceptedCryptos && (
                <p className="text-sm text-red-600 mt-1">{errors.acceptedCryptos}</p>
              )}
            </div>

            {/* Payment Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Transaction Fee (%)
                </label>
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
                  className={errors.feePercentage ? 'border-red-300' : ''}
                />
                {errors.feePercentage && (
                  <p className="text-sm text-red-600">{errors.feePercentage}</p>
                )}
                <p className="text-xs text-gray-500">
                  Fee charged on each transaction (recommended: 2.5%)
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Auto-Forward Payments</h4>
                  <p className="text-sm text-gray-600">
                    Automatically forward payments to your wallets
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.autoForward ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    autoForward: !prev.autoForward
                  }))}
                  className={formData.autoForward ? "bg-[#7f5efd] hover:bg-[#7f5efd]/90" : ""}
                >
                  {formData.autoForward ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Auto-Convert to Preferred Currency</h4>
                  <p className="text-sm text-gray-600">
                    Convert all payments to a single currency
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.autoConvert ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    autoConvert: !prev.autoConvert
                  }))}
                  className={formData.autoConvert ? "bg-[#7f5efd] hover:bg-[#7f5efd]/90" : ""}
                >
                  {formData.autoConvert ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {formData.autoConvert && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Preferred Payout Currency *
                  </label>
                  <Select
                    value={formData.preferredPayoutCurrency || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      preferredPayoutCurrency: value
                    }))}
                  >
                    <SelectTrigger className={errors.preferredPayoutCurrency ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.preferredPayoutCurrency && (
                    <p className="text-sm text-red-600">{errors.preferredPayoutCurrency}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    All payments will be converted to this currency
                  </p>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Security:</strong> All payments are processed securely through our platform. 
                Your private keys remain in your control and are never stored on our servers.
              </AlertDescription>
            </Alert>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || loadingCurrencies || formData.acceptedCryptos.length === 0}
                className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

