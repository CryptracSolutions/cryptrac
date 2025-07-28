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

// Top 10 cryptocurrencies + major stablecoins (required)
const REQUIRED_CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', network: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', network: 'Ethereum' },
  { code: 'BNB', name: 'BNB', symbol: 'BNB', network: 'BSC' },
  { code: 'SOL', name: 'Solana', symbol: 'SOL', network: 'Solana' },
  { code: 'TRX', name: 'TRON', symbol: 'TRX', network: 'TRON' },
  { code: 'TON', name: 'Toncoin', symbol: 'TON', network: 'TON' },
  { code: 'DOGE', name: 'Dogecoin', symbol: 'Ð', network: 'Dogecoin' },
  { code: 'XRP', name: 'XRP', symbol: 'XRP', network: 'XRP Ledger' },
  { code: 'SUI', name: 'Sui', symbol: 'SUI', network: 'Sui' },
  { code: 'AVAX', name: 'Avalanche', symbol: 'AVAX', network: 'Avalanche' },
  { code: 'USDT_ERC20', name: 'Tether (ERC-20)', symbol: '₮', network: 'Ethereum' },
  { code: 'USDT_TRC20', name: 'Tether (TRC-20)', symbol: '₮', network: 'TRON' },
  { code: 'USDT_BEP20', name: 'Tether (BEP-20)', symbol: '₮', network: 'BSC' },
  { code: 'USDC_ERC20', name: 'USD Coin (ERC-20)', symbol: '$', network: 'Ethereum' },
  { code: 'USDC_TRC20', name: 'USD Coin (TRC-20)', symbol: '$', network: 'TRON' },
  { code: 'USDC_BEP20', name: 'USD Coin (BEP-20)', symbol: '$', network: 'BSC' }
]

export default function WalletSetupStep({ data, onComplete, onPrevious }: WalletSetupStepProps) {
  const [wallets, setWallets] = useState<Record<string, string>>(data.wallets || {})
  const [validationStatus, setValidationStatus] = useState<Record<string, 'valid' | 'invalid' | 'checking'>>({})
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          // Filter out required currencies to show only additional ones
          const requiredCodes = REQUIRED_CURRENCIES.map(c => c.code)
          const additional = result.currencies.filter((c: CurrencyInfo) => 
            !requiredCodes.includes(c.code) && c.enabled
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
      return
    }

    setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }))

    try {
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: currency.toLowerCase(),
          address: address.trim()
        })
      })

      const result = await response.json()
      setValidationStatus(prev => ({ 
        ...prev, 
        [currency]: result.valid ? 'valid' : 'invalid' 
      }))

      if (!result.valid && result.message) {
        toast.error(`Invalid ${currency} address: ${result.message}`)
      }
    } catch (error) {
      console.error('Address validation error:', error)
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }))
      toast.error(`Failed to validate ${currency} address`)
    }
  }

  const handleAddressChange = (currency: string, address: string) => {
    setWallets(prev => ({ ...prev, [currency]: address }))
    
    // Debounce validation
    setTimeout(() => {
      validateAddress(currency, address)
    }, 500)
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

  const getRequiredCurrenciesWithAddresses = () => {
    return REQUIRED_CURRENCIES.filter(currency => wallets[currency.code]?.trim())
  }

  const canProceed = () => {
    const requiredWithAddresses = getRequiredCurrenciesWithAddresses()
    const hasMinimumRequired = requiredWithAddresses.length >= 1
    
    // Check that all provided addresses are valid
    const allValid = Object.entries(wallets).every(([currency, address]) => {
      if (!address?.trim()) return true // Empty addresses are okay
      return validationStatus[currency] === 'valid'
    })

    return hasMinimumRequired && allValid
  }

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error('Please provide at least one valid wallet address from the required currencies')
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
          Enter your cryptocurrency wallet addresses. You need at least one address from the Top 10 + major stablecoins.
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
              {getRequiredCurrenciesWithAddresses().length} of {REQUIRED_CURRENCIES.length} configured
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#7f5efd] h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(getRequiredCurrenciesWithAddresses().length / REQUIRED_CURRENCIES.length) * 100}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Minimum required: 1 address • Recommended: Configure all for maximum payment options
          </p>
        </div>

        {/* Required Currencies */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Top 10 + Major Stablecoins</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <Star className="w-3 h-3 mr-1" />
              Required (min. 1)
            </Badge>
          </div>

          <div className="grid gap-4">
            {REQUIRED_CURRENCIES.map((currency) => (
              <div key={currency.code} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {currency.symbol} {currency.code}
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

        {/* Additional Currencies */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Additional Cryptocurrencies</h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
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

        {/* Validation Summary */}
        {!canProceed() && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Setup Required:</strong> Please provide at least one valid wallet address 
              from the Top 10 + Major Stablecoins section to continue.
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

