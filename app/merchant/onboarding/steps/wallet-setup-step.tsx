"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ArrowRight, ArrowLeft, Wallet, Plus, Trash2, Loader2, CheckCircle, XCircle, Search, Star, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import toast from 'react-hot-toast'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'

interface WalletConfigData {
  wallets: Record<string, string>
  wallet_generation_method: string
}

interface WalletSetupStepProps {
  data: WalletConfigData
  onComplete: (data: WalletConfigData) => void
  onPrevious: () => void
}

interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  network?: string
  is_token?: boolean
  parent_currency?: string
  trust_wallet_compatible?: boolean
  address_format?: string
  enabled: boolean
  min_amount: number
  max_amount?: number
  decimals: number
  icon_url?: string
  display_name?: string
}

// Top 10 + Major Stablecoins (Required for onboarding)
const TOP_10_CURRENCIES = [
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    network: 'Bitcoin',
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: 'Bitcoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Ethereum',
    enabled: true,
    is_required: true
  },
  {
    code: 'BNB',
    name: 'BNB',
    symbol: 'BNB',
    network: 'BSC',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'BNB (Binance Smart Chain)',
    enabled: true,
    is_required: true
  },
  {
    code: 'SOL',
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Solana',
    enabled: true,
    is_required: true
  },
  {
    code: 'TRX',
    name: 'TRON',
    symbol: 'TRX',
    network: 'Tron',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'TRON',
    enabled: true,
    is_required: true
  },
  {
    code: 'TON',
    name: 'Toncoin',
    symbol: 'TON',
    network: 'TON',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Toncoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'DOGE',
    name: 'Dogecoin',
    symbol: 'DOGE',
    network: 'Dogecoin',
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: 'Dogecoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'XRP',
    name: 'XRP',
    symbol: 'XRP',
    network: 'XRP Ledger',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'XRP',
    enabled: true,
    is_required: true
  },
  {
    code: 'SUI',
    name: 'Sui',
    symbol: 'SUI',
    network: 'Sui',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Sui',
    enabled: true,
    is_required: true
  },
  {
    code: 'AVAX',
    name: 'Avalanche',
    symbol: 'AVAX',
    network: 'Avalanche',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Avalanche',
    enabled: true,
    is_required: true
  },
  // Major Stablecoins
  {
    code: 'USDT_ERC20',
    name: 'Tether (Ethereum)',
    symbol: '₮',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'ETH',
    display_name: 'USDT via Ethereum',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_ERC20',
    name: 'USD Coin (Ethereum)',
    symbol: 'USDC',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'ETH',
    display_name: 'USDC via Ethereum',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_TRC20',
    name: 'Tether (TRON)',
    symbol: '₮',
    network: 'Tron',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'TRX',
    display_name: 'USDT via TRON',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_SOL',
    name: 'USD Coin (Solana)',
    symbol: 'USDC',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'SOL',
    display_name: 'USDC via Solana',
    enabled: true,
    is_required: true
  }
]

export default function WalletSetupStep({ data, onComplete, onPrevious }: WalletSetupStepProps) {
  const [formData, setFormData] = useState<WalletConfigData>({
    wallets: data.wallets || {},
    wallet_generation_method: 'trust_wallet'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false)
  
  // Additional currencies (searchable after onboarding)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)
  const [validationStates, setValidationStates] = useState<Record<string, 'validating' | 'valid' | 'invalid' | null>>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Load additional currencies for post-onboarding
  useEffect(() => {
    loadAvailableCurrencies()
  }, [])

  const loadAvailableCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      
      const response = await fetch('/api/currencies')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Filter out currencies that are already in TOP_10_CURRENCIES
          const additionalCurrencies = data.currencies.filter((currency: CurrencyInfo) => 
            !TOP_10_CURRENCIES.find(top10 => top10.code === currency.code)
          )
          setAvailableCurrencies(additionalCurrencies)
        }
      }
      
    } catch (error) {
      console.error('Failed to load currencies:', error)
      toast.error('Failed to load additional currencies')
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const validateWalletAddress = async (crypto: string, address: string): Promise<boolean> => {
    if (!address.trim()) return false
    
    try {
      setValidationStates(prev => ({ ...prev, [crypto]: 'validating' }))
      
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), currency: crypto })
      })
      
      if (response.ok) {
        const data = await response.json()
        const isValid = data.validation?.valid || false
        setValidationStates(prev => ({ ...prev, [crypto]: isValid ? 'valid' : 'invalid' }))
        return isValid
      }
      
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }))
      return false
    } catch (error) {
      console.error('Address validation failed:', error)
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }))
      return false
    }
  }

  const handleWalletChange = (crypto: string, address: string) => {
    setFormData(prev => ({
      ...prev,
      wallets: { ...prev.wallets, [crypto]: address }
    }))
    
    // Clear error when user starts typing
    if (errors[crypto]) {
      const newErrors = { ...errors }
      delete newErrors[crypto]
      setErrors(newErrors)
    }
    
    // Reset validation state
    setValidationStates(prev => ({ ...prev, [crypto]: null }))
    
    // Validate address after a short delay
    if (address.trim()) {
      setTimeout(() => validateWalletAddress(crypto, address), 500)
    }
  }

  const handleRemoveWallet = (crypto: string) => {
    const newWallets = { ...formData.wallets }
    delete newWallets[crypto]
    setFormData(prev => ({ ...prev, wallets: newWallets }))
    
    // Clear any errors and validation states for this wallet
    const newErrors = { ...errors }
    delete newErrors[crypto]
    setErrors(newErrors)
    
    const newValidationStates = { ...validationStates }
    delete newValidationStates[crypto]
    setValidationStates(newValidationStates)
  }

  const handleAddAdditionalCurrency = (currencyCode: string) => {
    if (!formData.wallets[currencyCode]) {
      setFormData(prev => ({
        ...prev,
        wallets: { ...prev.wallets, [currencyCode]: '' }
      }))
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // Check if at least one wallet address is provided from TOP_10_CURRENCIES
    const hasRequiredWallet = TOP_10_CURRENCIES.some(currency => 
      formData.wallets[currency.code] && formData.wallets[currency.code].trim()
    )

    if (!hasRequiredWallet) {
      newErrors.general = 'Please add at least one wallet address from the required cryptocurrencies above'
    }

    // Validate all wallet addresses
    const validationPromises = Object.entries(formData.wallets).map(async ([crypto, address]) => {
      if (!address.trim()) {
        newErrors[crypto] = 'Address is required'
        return false
      }
      
      const isValid = await validateWalletAddress(crypto, address)
      if (!isValid) {
        newErrors[crypto] = `Invalid ${crypto} address format`
        return false
      }
      
      return true
    })

    await Promise.all(validationPromises)
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onComplete(formData)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error('Failed to save wallet configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrencyInfo = (code: string) => {
    // First check TOP_10_CURRENCIES
    const top10Currency = TOP_10_CURRENCIES.find(c => c.code === code)
    if (top10Currency) {
      return top10Currency
    }
    
    // Then check available currencies
    return availableCurrencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      trust_wallet_compatible: false
    }
  }

  const getValidationIcon = (crypto: string) => {
    const state = validationStates[crypto]
    switch (state) {
      case 'validating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getNetworkBadgeColor = (network: string) => {
    const colorMap: Record<string, string> = {
      'Bitcoin': 'bg-orange-100 text-orange-800',
      'Ethereum': 'bg-blue-100 text-blue-800',
      'BSC': 'bg-yellow-100 text-yellow-800',
      'Solana': 'bg-green-100 text-green-800',
      'Tron': 'bg-red-100 text-red-800',
      'TON': 'bg-indigo-100 text-indigo-800',
      'Dogecoin': 'bg-amber-100 text-amber-800',
      'XRP Ledger': 'bg-purple-100 text-purple-800',
      'Sui': 'bg-cyan-100 text-cyan-800',
      'Avalanche': 'bg-rose-100 text-rose-800'
    }
    return colorMap[network] || 'bg-gray-100 text-gray-800'
  }

  const filteredAdditionalCurrencies = availableCurrencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (showTrustWalletGuide) {
    return (
      <TrustWalletGuide
        onComplete={() => setShowTrustWalletGuide(false)}
        onSkip={() => setShowTrustWalletGuide(false)}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Set up your crypto wallets
          </CardTitle>
          <p className="text-gray-600">
            Enter wallet addresses for cryptocurrencies you want to accept. All payments go directly to your wallets.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trust Wallet Setup Button */}
            <div className="text-center mb-6">
              <Button
                type="button"
                onClick={() => setShowTrustWalletGuide(true)}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Need help setting up Trust Wallet?
              </Button>
            </div>

            {/* Required Cryptocurrencies */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Required Cryptocurrencies</h3>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  At least 1 required
                </Badge>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50">
                <Star className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Top 10 + Major Stablecoins:</strong> You must provide at least one wallet address 
                  from the cryptocurrencies below to complete onboarding. You can add more later.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOP_10_CURRENCIES.map((currency) => (
                  <div key={currency.code} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{currency.symbol} {currency.code}</span>
                          <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currency.network)}`}>
                            {currency.network}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">{currency.display_name}</div>
                      </div>
                      {formData.wallets[currency.code] && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveWallet(currency.code)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder={`Enter your ${currency.code} wallet address`}
                          value={formData.wallets[currency.code] || ''}
                          onChange={(e) => handleWalletChange(currency.code, e.target.value)}
                          className={`flex-1 ${errors[currency.code] ? 'border-red-300' : ''}`}
                        />
                        {getValidationIcon(currency.code)}
                      </div>
                      {errors[currency.code] && (
                        <p className="text-sm text-red-600">{errors[currency.code]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Cryptocurrencies */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Cryptocurrencies (Optional)</h3>
              
              {/* Search for additional currencies */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search for additional cryptocurrencies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {searchTerm && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {filteredAdditionalCurrencies.length > 0 ? (
                      filteredAdditionalCurrencies.map((currency) => (
                        <div
                          key={currency.code}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{currency.symbol} {currency.code}</span>
                              <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currency.network || '')}`}>
                                {currency.network}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">{currency.display_name || currency.name}</div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleAddAdditionalCurrency(currency.code)}
                            variant="outline"
                            size="sm"
                            disabled={!!formData.wallets[currency.code]}
                          >
                            {formData.wallets[currency.code] ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No currencies found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Display added additional currencies */}
              {Object.entries(formData.wallets).filter(([code]) => 
                !TOP_10_CURRENCIES.find(top10 => top10.code === code)
              ).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Added Additional Currencies:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.wallets)
                      .filter(([code]) => !TOP_10_CURRENCIES.find(top10 => top10.code === code))
                      .map(([code, address]) => {
                        const currency = getCurrencyInfo(code)
                        return (
                          <div key={code} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{currency.symbol} {currency.code}</span>
                                  <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currency.network || '')}`}>
                                    {currency.network}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-500">{currency.display_name || currency.name}</div>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleRemoveWallet(code)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Input
                                  placeholder={`Enter your ${code} wallet address`}
                                  value={address}
                                  onChange={(e) => handleWalletChange(code, e.target.value)}
                                  className={`flex-1 ${errors[code] ? 'border-red-300' : ''}`}
                                />
                                {getValidationIcon(code)}
                              </div>
                              {errors[code] && (
                                <p className="text-sm text-red-600">{errors[code]}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* General error */}
            {errors.general && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                onClick={onPrevious}
                variant="outline"
                className="px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#7f5efd] hover:bg-[#6d4fd8] text-white px-8"
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

