import React, { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle, Search, ExternalLink } from 'lucide-react'
import { TrustWalletGuide } from '@/app/components/onboarding/trust-wallet-guide'

interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  network: string
  rate_usd: number
  min_amount: number
  max_amount: number
  decimals: number
  enabled: boolean
  trust_wallet_compatible: boolean
  display_name: string
}

interface CompatibleCurrency {
  code: string
  name: string
  network: string
  trust_wallet_compatible: boolean
}

interface CurrencyGroup {
  id: string
  name: string
  primary?: CompatibleCurrency
  compatible: CompatibleCurrency[]
}

interface WalletSetupStepProps {
  onNext: (wallets: Record<string, string>) => void
  onBack: () => void
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid'

// Top currency groups (same as before for consistency)
const CURRENCY_GROUPS: CurrencyGroup[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    primary: { code: 'BTC', name: 'Bitcoin', network: 'Bitcoin', trust_wallet_compatible: true },
    compatible: []
  },
  {
    id: 'ethereum',
    name: 'Ethereum Ecosystem',
    primary: { code: 'ETH', name: 'Ethereum', network: 'Ethereum', trust_wallet_compatible: true },
    compatible: [
      { code: 'USDT_ERC20', name: 'USDT (ERC-20)', network: 'Ethereum', trust_wallet_compatible: true },
      { code: 'USDC_ERC20', name: 'USDC (ERC-20)', network: 'Ethereum', trust_wallet_compatible: true }
    ]
  },
  {
    id: 'binance',
    name: 'Binance Smart Chain',
    primary: { code: 'BNB', name: 'BNB', network: 'BSC', trust_wallet_compatible: true },
    compatible: [
      { code: 'USDT_BEP20', name: 'USDT (BEP-20)', network: 'BSC', trust_wallet_compatible: true },
      { code: 'USDC_BEP20', name: 'USDC (BEP-20)', network: 'BSC', trust_wallet_compatible: true }
    ]
  },
  {
    id: 'solana',
    name: 'Solana Ecosystem',
    primary: { code: 'SOL', name: 'Solana', network: 'Solana', trust_wallet_compatible: true },
    compatible: [
      { code: 'USDT_SOL', name: 'USDT (Solana)', network: 'Solana', trust_wallet_compatible: true },
      { code: 'USDC_SOL', name: 'USDC (Solana)', network: 'Solana', trust_wallet_compatible: true }
    ]
  },
  {
    id: 'tron',
    name: 'TRON Ecosystem',
    primary: { code: 'TRX', name: 'TRON', network: 'TRON', trust_wallet_compatible: true },
    compatible: [
      { code: 'USDT_TRC20', name: 'USDT (TRC-20)', network: 'TRON', trust_wallet_compatible: true },
      { code: 'USDC_TRC20', name: 'USDC (TRC-20)', network: 'TRON', trust_wallet_compatible: true }
    ]
  },
  {
    id: 'avalanche',
    name: 'Avalanche Ecosystem',
    primary: { code: 'AVAX', name: 'Avalanche', network: 'Avalanche', trust_wallet_compatible: true },
    compatible: [
      { code: 'USDT_AVAX', name: 'USDT (Avalanche)', network: 'Avalanche', trust_wallet_compatible: true },
      { code: 'USDC_AVAX', name: 'USDC (Avalanche)', network: 'Avalanche', trust_wallet_compatible: true }
    ]
  },
  {
    id: 'other',
    name: 'Other Popular Cryptocurrencies',
    compatible: [
      { code: 'XRP', name: 'XRP', network: 'XRP Ledger', trust_wallet_compatible: true },
      { code: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', trust_wallet_compatible: true },
      { code: 'TON', name: 'TON', network: 'TON', trust_wallet_compatible: true },
      { code: 'SUI', name: 'Sui', network: 'Sui', trust_wallet_compatible: true }
    ]
  }
]

export function WalletSetupStep({ onNext, onBack }: WalletSetupStepProps) {
  const [wallets, setWallets] = useState<Record<string, string>>({})
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({})
  const [autoFilledCurrencies, setAutoFilledCurrencies] = useState<string[]>([])
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false)

  useEffect(() => {
    loadAdditionalCurrencies()
  }, [])

  const loadAdditionalCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      console.log('📡 Loading additional currencies from dynamic API...')
      
      const response = await fetch('/api/currencies?popular=false')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Filter out currencies that are already in our groups
          const groupedCodes = CURRENCY_GROUPS.flatMap(group => [
            group.primary?.code,
            ...group.compatible.map((c: CompatibleCurrency) => c.code)
          ]).filter(Boolean)
          
          const additional = result.currencies.filter((c: CurrencyInfo) => 
            !groupedCodes.includes(c.code) && c.enabled
          )
          console.log(`📊 Loaded ${additional.length} additional currencies:`, additional.map((c: CurrencyInfo) => c.code))
          setAdditionalCurrencies(additional)
        } else {
          console.error('Failed to load currencies:', result.error)
        }
      } else {
        console.error('Failed to fetch currencies:', response.status)
      }
    } catch (error) {
      console.error('Failed to load additional currencies:', error)
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const validateAddress = async (currency: string, address: string) => {
    console.log(`🔍 Starting validation for ${currency} with address: ${address}`)
    
    if (!address.trim()) {
      console.log(`❌ Empty address for ${currency}`)
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }))
      return false
    }

    setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }))
    console.log(`⏳ Set ${currency} status to checking`)

    try {
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: currency.toUpperCase(),
          address: address.trim()
        })
      })

      const result = await response.json()
      console.log(`📨 Validation response for ${currency}:`, result)
      
      // The API returns { success: true, validation: { valid: boolean, ... } }
      const isValid = result.success && result.validation?.valid
      
      setValidationStatus(prev => ({ 
        ...prev, 
        [currency]: isValid ? 'valid' : 'invalid' 
      }))
      
      console.log(`✅ Set ${currency} validation status to: ${isValid ? 'valid' : 'invalid'}`)
      return isValid

    } catch (error) {
      console.error(`❌ Validation error for ${currency}:`, error)
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }))
      return false
    }
  }

  const handleAddressChange = async (currency: string, address: string) => {
    setWallets(prev => ({ ...prev, [currency]: address }))
    
    if (address.trim()) {
      await validateAddress(currency, address)
    } else {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }))
    }
  }

  const handleAutoFill = (fromCurrency: string, toCurrency: string) => {
    const sourceAddress = wallets[fromCurrency]
    if (sourceAddress && !wallets[toCurrency]) {
      setWallets(prev => ({ ...prev, [toCurrency]: sourceAddress }))
      setAutoFilledCurrencies(prev => [...prev, toCurrency])
      validateAddress(toCurrency, sourceAddress)
    }
  }

  const getValidationIcon = (currency: string) => {
    const status = validationStatus[currency] || 'idle'
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getValidationMessage = (currency: string) => {
    const status = validationStatus[currency] || 'idle'
    switch (status) {
      case 'checking':
        return 'Validating address...'
      case 'valid':
        return 'Valid address'
      case 'invalid':
        return 'Invalid address format'
      default:
        return ''
    }
  }

  const configuredCurrencies = Object.keys(wallets).filter(currency => 
    wallets[currency]?.trim() && validationStatus[currency] === 'valid'
  )

  const minRequiredMet = configuredCurrencies.length >= 1
  const allValid = Object.values(validationStatus).every(status => 
    status === 'idle' || status === 'valid'
  )
  const canProceed = minRequiredMet && allValid

  console.log('📊 Configured currencies count:', configuredCurrencies.length)
  console.log('🚦 Can proceed?', canProceed, '(min required:', minRequiredMet, ', all valid:', allValid, ')')

  const handleNext = () => {
    const validWallets = Object.fromEntries(
      Object.entries(wallets).filter(([currency, address]) => 
        address?.trim() && validationStatus[currency] === 'valid'
      )
    )
    onNext(validWallets)
  }

  const filteredAdditionalCurrencies = additionalCurrencies.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Debug state updates
  useEffect(() => {
    console.log('🔄 State update - Wallets:', wallets)
    console.log('🔄 State update - Validation Status:', validationStatus)
    console.log('🔄 State update - Auto-filled:', autoFilledCurrencies)
  }, [wallets, validationStatus, autoFilledCurrencies])

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Set Up Your Crypto Wallets</h2>
        <p className="mt-2 text-gray-600">
          Configure wallet addresses for the cryptocurrencies you want to accept
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Badge variant="outline" className="text-sm">
            {configuredCurrencies.length} configured
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTrustWalletGuide(true)}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Trust Wallet Guide
          </Button>
        </div>
      </div>

      {/* Trust Wallet Guide Modal */}
      {showTrustWalletGuide && (
        <TrustWalletGuide onClose={() => setShowTrustWalletGuide(false)} />
      )}

      {/* Top Cryptocurrency Groups */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Recommended Cryptocurrencies
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            These are the most popular cryptocurrencies. Configure at least one to continue.
          </p>
        </div>

        {CURRENCY_GROUPS.map((group) => (
          <Card key={group.id} className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Currency */}
              {group.primary && (
                <div key={`compatible-${group.primary.code}`} className={`border rounded-lg p-4 space-y-3 ${
                  validationStatus[group.primary.code] === 'valid' ? 'border-green-200 bg-green-50' :
                  validationStatus[group.primary.code] === 'invalid' ? 'border-red-200 bg-red-50' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.primary.code}</span>
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                        {autoFilledCurrencies.includes(group.primary.code) && (
                          <Badge variant="outline" className="text-xs text-blue-600">Auto-filled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{group.primary.name}</p>
                      <p className="text-xs text-gray-500">Network: {group.primary.network}</p>
                    </div>
                    {getValidationIcon(group.primary.code)}
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder={`Enter your ${group.primary.code} wallet address`}
                      value={wallets[group.primary.code] || ''}
                      onChange={(e) => handleAddressChange(group.primary.code, e.target.value)}
                      className={
                        validationStatus[group.primary.code] === 'valid' ? 'border-green-300' :
                        validationStatus[group.primary.code] === 'invalid' ? 'border-red-300' :
                        ''
                      }
                    />
                    {validationStatus[group.primary.code] && validationStatus[group.primary.code] !== 'idle' && (
                      <p className={`text-xs ${
                        validationStatus[group.primary.code] === 'valid' ? 'text-green-600' :
                        validationStatus[group.primary.code] === 'invalid' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {getValidationMessage(group.primary.code)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Compatible Currencies */}
              {group.compatible.map((currency) => (
                <div key={`compatible-${currency.code}`} className={`border rounded-lg p-4 space-y-3 ${
                  validationStatus[currency.code] === 'valid' ? 'border-green-200 bg-green-50' :
                  validationStatus[currency.code] === 'invalid' ? 'border-red-200 bg-red-50' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        {autoFilledCurrencies.includes(currency.code) && (
                          <Badge variant="outline" className="text-xs text-blue-600">Auto-filled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{currency.name}</p>
                      <p className="text-xs text-gray-500">Network: {currency.network}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.primary && wallets[group.primary.code] && !wallets[currency.code] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAutoFill(group.primary.code!, currency.code)}
                          className="text-xs"
                        >
                          Use {group.primary.code} address
                        </Button>
                      )}
                      {getValidationIcon(currency.code)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder={`Enter your ${currency.code} wallet address`}
                      value={wallets[currency.code] || ''}
                      onChange={(e) => handleAddressChange(currency.code, e.target.value)}
                      className={
                        validationStatus[currency.code] === 'valid' ? 'border-green-300' :
                        validationStatus[currency.code] === 'invalid' ? 'border-red-300' :
                        ''
                      }
                    />
                    {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
                      <p className={`text-xs ${
                        validationStatus[currency.code] === 'valid' ? 'text-green-600' :
                        validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {getValidationMessage(currency.code)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Currencies Section */}
      {additionalCurrencies.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Additional Cryptocurrencies</CardTitle>
            <p className="text-sm text-gray-600">
              Optional: Add support for more cryptocurrencies (loaded from NOWPayments)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingCurrencies ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading additional currencies...</span>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredAdditionalCurrencies.map((currency) => (
                  <div key={`additional-${currency.code}`} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.code}</span>
                          {autoFilledCurrencies.includes(currency.code) && (
                            <Badge variant="outline" className="text-xs text-blue-600">Auto-filled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{currency.display_name}</p>
                        <p className="text-xs text-gray-500">Network: {currency.network}</p>
                      </div>
                      {getValidationIcon(currency.code)}
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        placeholder={`Enter your ${currency.code} wallet address`}
                        value={wallets[currency.code] || ''}
                        onChange={(e) => handleAddressChange(currency.code, e.target.value)}
                        className={
                          validationStatus[currency.code] === 'valid' ? 'border-green-300' :
                          validationStatus[currency.code] === 'invalid' ? 'border-red-300' :
                          ''
                        }
                      />
                      {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
                        <p className={`text-xs ${
                          validationStatus[currency.code] === 'valid' ? 'text-green-600' :
                          validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {getValidationMessage(currency.code)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {searchTerm && filteredAdditionalCurrencies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No cryptocurrencies found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {canProceed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-500" />
            )}
            <div>
              <p className="font-medium">
                {canProceed 
                  ? `Ready to continue with ${configuredCurrencies.length} configured cryptocurrencies`
                  : 'Configure at least 1 cryptocurrency to continue'
                }
              </p>
              <p className="text-sm text-gray-600">
                You can always add more cryptocurrencies later in your settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed}
          className="min-w-[120px]"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

