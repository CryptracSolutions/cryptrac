'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ArrowRight, ArrowLeft, Wallet, Plus, Trash2, Loader2, CheckCircle, XCircle, Search, Star, AlertTriangle, Info, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import toast from 'react-hot-toast'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'

interface WalletConfigData {
  wallets: Record<string, string>
  wallet_generation_method: string
  walletType: 'generate' | 'existing'
  mnemonic?: string
  selectedCurrencies?: string[]
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
  rate_usd?: number
  display_name?: string
}

// Final verified currency grouping with NOWPayments supported currencies
const CURRENCY_GROUPS = [
  {
    id: 'bitcoin',
    title: 'Bitcoin',
    primary: { code: 'BTC', name: 'Bitcoin', symbol: '₿', network: 'Bitcoin' },
    compatible: []
  },
  {
    id: 'ethereum',
    title: 'Ethereum Ecosystem',
    primary: { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', network: 'Ethereum' },
    compatible: [
      { code: 'USDT_ERC20', name: 'Tether (ERC-20)', symbol: '₮', network: 'Ethereum' },
      { code: 'USDC_ERC20', name: 'USD Coin (ERC-20)', symbol: '$', network: 'Ethereum' }
    ]
  },
  {
    id: 'bsc',
    title: 'BNB Smart Chain',
    primary: { code: 'BNB', name: 'BNB', symbol: 'BNB', network: 'BSC' },
    compatible: [
      { code: 'USDT_BEP20', name: 'Tether (BEP-20)', symbol: '₮', network: 'BSC' },
      { code: 'USDC_BEP20', name: 'USD Coin (BEP-20)', symbol: '$', network: 'BSC' }
    ]
  },
  {
    id: 'solana',
    title: 'Solana Ecosystem',
    primary: { code: 'SOL', name: 'Solana', symbol: 'SOL', network: 'Solana' },
    compatible: [
      { code: 'USDT_SOL', name: 'Tether (Solana)', symbol: '₮', network: 'Solana' },
      { code: 'USDC_SOL', name: 'USD Coin (Solana)', symbol: '$', network: 'Solana' }
    ]
  },
  {
    id: 'tron',
    title: 'TRON Ecosystem',
    primary: { code: 'TRX', name: 'TRON', symbol: 'TRX', network: 'TRON' },
    compatible: [
      { code: 'USDT_TRC20', name: 'Tether (TRC-20)', symbol: '₮', network: 'TRON' },
      { code: 'USDC_TRC20', name: 'USD Coin (TRC-20)', symbol: '$', network: 'TRON' }
    ]
  },
  {
    id: 'ton',
    title: 'TON Ecosystem',
    primary: { code: 'TON', name: 'Toncoin', symbol: 'TON', network: 'TON' },
    compatible: [
      { code: 'USDT_TON', name: 'Tether (TON)', symbol: '₮', network: 'TON' }
    ]
  },
  {
    id: 'avax',
    title: 'AVAX Ecosystem',
    primary: { code: 'AVAX', name: 'Avalanche', symbol: 'AVAX', network: 'Avalanche' },
    compatible: [
      { code: 'USDT_AVAX', name: 'Tether (Avalanche)', symbol: '₮', network: 'Avalanche' },
      { code: 'USDC_AVAX', name: 'USD Coin (Avalanche)', symbol: '$', network: 'Avalanche' }
    ]
  },
  {
    id: 'standalone',
    title: 'Other Networks',
    primary: null,
    compatible: [
      { code: 'DOGE', name: 'Dogecoin', symbol: 'Ð', network: 'Dogecoin' },
      { code: 'XRP', name: 'XRP', symbol: 'XRP', network: 'XRP Ledger' },
      { code: 'SUI', name: 'Sui', symbol: 'SUI', network: 'Sui' }
    ]
  }
]

// Currency code mapping for validation API
const CURRENCY_CODE_MAPPING: Record<string, string> = {
  'USDT': 'USDT_ERC20',
  'USDC': 'USDC_ERC20',
  'LTC': 'LTC',
  'MATIC': 'MATIC',
  'ADA': 'ADA',
  'DOT': 'DOT',
  // Add more mappings as needed
}

export default function WalletSetupStep({ data, onComplete, onPrevious }: WalletSetupStepProps) {
  const [wallets, setWallets] = useState<Record<string, string>>(data.wallets || {})
  const [validationStatus, setValidationStatus] = useState<Record<string, 'valid' | 'invalid' | 'checking'>>({})
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoFilledCurrencies, setAutoFilledCurrencies] = useState<string[]>([])
  const [validationTimeouts, setValidationTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    loadAdditionalCurrencies()
  }, [])

  const loadAdditionalCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      const response = await fetch('/api/currencies')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Filter out currencies that are already in our groups
          const groupedCodes = CURRENCY_GROUPS.flatMap(group => [
            group.primary?.code,
            ...group.compatible.map(c => c.code)
          ]).filter(Boolean)
          
          const additional = result.currencies.filter((c: CurrencyInfo) => 
            !groupedCodes.includes(c.code) && c.enabled
          )
          setAdditionalCurrencies(additional)
        }
      }
    } catch (error) {
      console.error('Failed to load additional currencies:', error)
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const validateAddress = async (currency: string, address: string) => {
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }))
      return false
    }

    setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }))

    try {
      // Map currency code for validation API
      const validationCurrency = CURRENCY_CODE_MAPPING[currency] || currency

      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: validationCurrency.toUpperCase(),
          address: address.trim()
        })
      })

      const result = await response.json()
      
      // The API returns { success: true, validation: { valid: boolean, ... } }
      const isValid = result.success && result.validation?.valid
      
      setValidationStatus(prev => ({ 
        ...prev, 
        [currency]: isValid ? 'valid' : 'invalid' 
      }))

      if (!isValid) {
        const errorMsg = result.validation?.error || result.error || 'Invalid address format'
        toast.error(`Invalid ${currency} address: ${errorMsg}`)
      }

      return isValid
    } catch (error) {
      console.error('Address validation error:', error)
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }))
      toast.error(`Failed to validate ${currency} address`)
      return false
    }
  }

  const autoFillCompatibleCurrencies = (primaryCurrency: string, address: string) => {
    const group = CURRENCY_GROUPS.find(g => g.primary?.code === primaryCurrency)
    if (!group || !group.compatible.length) return

    const newAutoFilled: string[] = []

    // Create a new wallets object without modifying the primary currency
    setWallets(prevWallets => {
      const updatedWallets = { ...prevWallets }
      
      group.compatible.forEach(compatible => {
        // Only auto-fill if the field is empty
        if (!updatedWallets[compatible.code]?.trim()) {
          updatedWallets[compatible.code] = address
          newAutoFilled.push(compatible.code)
        }
      })

      return updatedWallets
    })

    if (newAutoFilled.length > 0) {
      setAutoFilledCurrencies(prev => [...prev, ...newAutoFilled])
      
      // Validate auto-filled currencies
      newAutoFilled.forEach(code => {
        setTimeout(() => validateAddress(code, address), 300)
      })
      
      const compatibleNames = newAutoFilled.map(code => 
        group.compatible.find(c => c.code === code)?.name
      ).join(', ')
      
      toast.success(`Auto-filled compatible currencies: ${compatibleNames}`, {
        duration: 4000,
        icon: '⚡'
      })
    }
  }

  const handleAddressChange = (currency: string, address: string) => {
    // Update the wallet address - use functional update to avoid race conditions
    setWallets(prev => ({ ...prev, [currency]: address }))
    
    // Remove from auto-filled list if manually changed
    if (autoFilledCurrencies.includes(currency)) {
      setAutoFilledCurrencies(prev => prev.filter(c => c !== currency))
    }
    
    // Clear existing timeout for this currency
    if (validationTimeouts[currency]) {
      clearTimeout(validationTimeouts[currency])
    }
    
    // Set new validation timeout
    const timeout = setTimeout(async () => {
      if (address.trim()) {
        const isValid = await validateAddress(currency, address)
        
        // Auto-fill compatible currencies if this is a primary currency and validation passed
        if (isValid) {
          const isPrimary = CURRENCY_GROUPS.some(group => group.primary?.code === currency)
          if (isPrimary) {
            // Wait a bit more to ensure validation is complete
            setTimeout(() => {
              autoFillCompatibleCurrencies(currency, address)
            }, 1000)
          }
        }
      } else {
        setValidationStatus(prev => {
          const updated = { ...prev }
          delete updated[currency]
          return updated
        })
      }
    }, 1000) // Increased debounce time
    
    setValidationTimeouts(prev => ({ ...prev, [currency]: timeout }))
  }

  const handleRemoveWallet = (currency: string) => {
    setWallets(prev => {
      const updated = { ...prev }
      delete updated[currency]
      return updated
    })
    setValidationStatus(prev => {
      const updated = { ...prev }
      delete updated[currency]
      return updated
    })
    setAutoFilledCurrencies(prev => prev.filter(c => c !== currency))
    
    // Clear timeout if exists
    if (validationTimeouts[currency]) {
      clearTimeout(validationTimeouts[currency])
      setValidationTimeouts(prev => {
        const updated = { ...prev }
        delete updated[currency]
        return updated
      })
    }
  }

  const getValidationIcon = (currency: string) => {
    const status = validationStatus[currency]
    const hasAddress = wallets[currency]?.trim()

    if (!hasAddress) return null

    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getConfiguredCurrenciesCount = () => {
    return Object.values(wallets).filter(address => address?.trim()).length
  }

  const canProceed = () => {
    const hasMinimumRequired = getConfiguredCurrenciesCount() >= 1
    
    // Check that all provided addresses are valid
    const allValid = Object.entries(wallets).every(([currency, address]) => {
      if (!address?.trim()) return true // Empty addresses are okay
      return validationStatus[currency] === 'valid'
    })

    return hasMinimumRequired && allValid
  }

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error('Please provide at least one valid wallet address')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Filter out empty addresses
      const validWallets = Object.entries(wallets).reduce((acc, [currency, address]) => {
        if (address?.trim()) {
          acc[currency] = address.trim()
        }
        return acc
      }, {} as Record<string, string>)

      const walletConfigData: WalletConfigData = {
        wallets: validWallets,
        wallet_generation_method: 'trust_wallet',
        walletType: 'existing',
        selectedCurrencies: Object.keys(validWallets)
      }

      onComplete(walletConfigData)
      toast.success('Wallet configuration saved!')
      
    } catch (error) {
      console.error('Error saving wallet config:', error)
      toast.error('Failed to save wallet configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTrustWalletGuideComplete = () => {
    setShowTrustWalletGuide(false)
    toast.success('Great! Now you can enter your wallet addresses below.')
  }

  const handleTrustWalletGuideSkip = () => {
    setShowTrustWalletGuide(false)
  }

  const filteredAdditionalCurrencies = additionalCurrencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-6 h-6 text-[#7f5efd]" />
          <span>Wallet Setup</span>
        </CardTitle>
        <p className="text-gray-600">
          Enter your cryptocurrency wallet addresses. Compatible stablecoins will be auto-filled.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trust Wallet Guide Toggle */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Need help setting up Trust Wallet?</h3>
              <p className="text-sm text-blue-700">
                Get step-by-step instructions for creating and managing your crypto wallets
              </p>
            </div>
            <Button
              onClick={() => setShowTrustWalletGuide(!showTrustWalletGuide)}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {showTrustWalletGuide ? 'Hide Guide' : 'Show Guide'}
            </Button>
          </div>
        </div>

        {/* Trust Wallet Guide */}
        {showTrustWalletGuide && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <TrustWalletGuide 
              onComplete={handleTrustWalletGuideComplete}
              onSkip={handleTrustWalletGuideSkip}
            />
          </div>
        )}

        {/* Progress Indicator */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm text-gray-600">
              {getConfiguredCurrenciesCount()} currencies configured
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#7f5efd] h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((getConfiguredCurrenciesCount() / 10) * 100, 100)}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Minimum required: 1 address • Auto-fill saves time for compatible currencies
          </p>
        </div>

        {/* Smart Auto-Fill Info */}
        {autoFilledCurrencies.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Auto-filled {autoFilledCurrencies.length} compatible currencies!</strong> 
              {' '}Compatible stablecoins use the same wallet address as their parent network.
            </AlertDescription>
          </Alert>
        )}

        {/* Currency Groups */}
        <div className="space-y-6">
          {CURRENCY_GROUPS.map((group) => (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {group.primary ? 'Primary + Stablecoins' : 'Individual Networks'}
                </Badge>
              </div>

              <div className="grid gap-4">
                {/* Primary Currency */}
                {group.primary && (
                  <div className="border rounded-lg p-4 space-y-3 bg-blue-50/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{group.primary.symbol} {group.primary.code}</span>
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                              Primary
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">{group.primary.name}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {group.primary.network}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getValidationIcon(group.primary.code)}
                        {wallets[group.primary.code] && (
                          <Button
                            onClick={() => handleRemoveWallet(group.primary.code)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder={`Enter your ${group.primary.code} wallet address`}
                        value={wallets[group.primary.code] || ''}
                        onChange={(e) => handleAddressChange(group.primary.code, e.target.value)}
                        className={`font-mono text-sm ${
                          validationStatus[group.primary.code] === 'valid' ? 'border-green-300 bg-green-50' :
                          validationStatus[group.primary.code] === 'invalid' ? 'border-red-300 bg-red-50' :
                          'border-gray-300'
                        }`}
                      />
                      {validationStatus[group.primary.code] === 'invalid' && (
                        <p className="text-xs text-red-600">
                          Please enter a valid {group.primary.code} address
                        </p>
                      )}
                      {group.compatible.length > 0 && (
                        <p className="text-xs text-blue-600">
                          <Info className="w-3 h-3 inline mr-1" />
                          Will auto-fill {group.compatible.length} compatible stablecoin{group.compatible.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Compatible Currencies */}
                {group.compatible.map((currency) => (
                  <div key={currency.code} className={`border rounded-lg p-4 space-y-3 ${
                    autoFilledCurrencies.includes(currency.code) ? 'bg-green-50/30 border-green-200' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{currency.symbol} {currency.code}</span>
                            {autoFilledCurrencies.includes(currency.code) && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                <Zap className="w-3 h-3 mr-1" />
                                Auto-filled
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{currency.name}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {currency.network}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getValidationIcon(currency.code)}
                        {wallets[currency.code] && (
                          <Button
                            onClick={() => handleRemoveWallet(currency.code)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder={`Enter your ${currency.code} wallet address`}
                        value={wallets[currency.code] || ''}
                        onChange={(e) => handleAddressChange(currency.code, e.target.value)}
                        className={`font-mono text-sm ${
                          validationStatus[currency.code] === 'valid' ? 'border-green-300 bg-green-50' :
                          validationStatus[currency.code] === 'invalid' ? 'border-red-300 bg-red-50' :
                          autoFilledCurrencies.includes(currency.code) ? 'border-green-200 bg-green-50' :
                          'border-gray-300'
                        }`}
                      />
                      {validationStatus[currency.code] === 'invalid' && (
                        <p className="text-xs text-red-600">
                          Please enter a valid {currency.code} address
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Currencies */}
        {additionalCurrencies.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Additional Cryptocurrencies</h3>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                Optional
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search for additional cryptocurrencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingCurrencies ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading additional currencies...</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredAdditionalCurrencies.map((currency) => (
                    <div key={currency.code} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {currency.symbol} {currency.code}
                            </div>
                            <div className="text-xs text-gray-500">{currency.name}</div>
                          </div>
                          {currency.network && (
                            <Badge variant="outline" className="text-xs">
                              {currency.network}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getValidationIcon(currency.code)}
                          {wallets[currency.code] && (
                            <Button
                              onClick={() => handleRemoveWallet(currency.code)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <Input
                        placeholder={`Enter your ${currency.code} wallet address`}
                        value={wallets[currency.code] || ''}
                        onChange={(e) => handleAddressChange(currency.code, e.target.value)}
                        className={`font-mono text-sm ${
                          validationStatus[currency.code] === 'valid' ? 'border-green-300 bg-green-50' :
                          validationStatus[currency.code] === 'invalid' ? 'border-red-300 bg-red-50' :
                          'border-gray-300'
                        }`}
                      />
                      {validationStatus[currency.code] === 'invalid' && (
                        <p className="text-xs text-red-600 mt-1">
                          Please enter a valid {currency.code} address
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validation Summary */}
        {!canProceed() && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Setup Required:</strong> Please provide at least one valid wallet address to continue.
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            onClick={onPrevious}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
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

