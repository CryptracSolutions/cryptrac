import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle, Search, ExternalLink, Trash2, Info } from 'lucide-react'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'

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
  description: string
  primary: CompatibleCurrency
  autoIncludedStablecoins: CompatibleCurrency[]
  others: CompatibleCurrency[]
}

interface WalletSetupStepProps {
  onNext: (wallets: Record<string, string>) => void
  onBack: () => void
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid'

// Improved currency groups with automatic stablecoin inclusion
const CURRENCY_GROUPS: CurrencyGroup[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    description: 'The original cryptocurrency',
    primary: { code: 'BTC', name: 'Bitcoin', network: 'Bitcoin', trust_wallet_compatible: true },
    autoIncludedStablecoins: [],
    others: []
  },
  {
    id: 'ethereum',
    name: 'Ethereum Ecosystem',
    description: 'Ethereum and major ERC-20 stablecoins',
    primary: { code: 'ETH', name: 'Ethereum', network: 'Ethereum', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDT_ERC20', name: 'USDT (ERC-20)', network: 'Ethereum', trust_wallet_compatible: true },
      { code: 'USDC_ERC20', name: 'USDC (ERC-20)', network: 'Ethereum', trust_wallet_compatible: true }
    ],
    others: []
  },
  {
    id: 'binance',
    name: 'Binance Smart Chain',
    description: 'BNB and major BEP-20 stablecoins',
    primary: { code: 'BNB', name: 'BNB', network: 'BSC', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDT_BEP20', name: 'USDT (BEP-20)', network: 'BSC', trust_wallet_compatible: true },
      { code: 'USDC_BEP20', name: 'USDC (BEP-20)', network: 'BSC', trust_wallet_compatible: true }
    ],
    others: []
  },
  {
    id: 'solana',
    name: 'Solana Ecosystem',
    description: 'Solana and major SPL stablecoins',
    primary: { code: 'SOL', name: 'Solana', network: 'Solana', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDT_SOL', name: 'USDT (Solana)', network: 'Solana', trust_wallet_compatible: true },
      { code: 'USDC_SOL', name: 'USDC (Solana)', network: 'Solana', trust_wallet_compatible: true }
    ],
    others: []
  },
  {
    id: 'tron',
    name: 'TRON Ecosystem',
    description: 'TRON and major TRC-20 stablecoins',
    primary: { code: 'TRX', name: 'TRON', network: 'TRON', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDT_TRC20', name: 'USDT (TRC-20)', network: 'TRON', trust_wallet_compatible: true },
      { code: 'USDC_TRC20', name: 'USDC (TRC-20)', network: 'TRON', trust_wallet_compatible: true }
    ],
    others: []
  },
  {
    id: 'avalanche',
    name: 'Avalanche Ecosystem',
    description: 'Avalanche and major AVAX stablecoins',
    primary: { code: 'AVAX', name: 'Avalanche', network: 'Avalanche', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDT_AVAX', name: 'USDT (Avalanche)', network: 'Avalanche', trust_wallet_compatible: true },
      { code: 'USDC_AVAX', name: 'USDC (Avalanche)', network: 'Avalanche', trust_wallet_compatible: true }
    ],
    others: []
  }
]

const OTHER_POPULAR_CURRENCIES: CompatibleCurrency[] = [
  { code: 'XRP', name: 'XRP', network: 'XRP Ledger', trust_wallet_compatible: true },
  { code: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', trust_wallet_compatible: true },
  { code: 'LTC', name: 'Litecoin', network: 'Litecoin', trust_wallet_compatible: true },
  { code: 'ADA', name: 'Cardano', network: 'Cardano', trust_wallet_compatible: true },
  { code: 'TON', name: 'TON', network: 'TON', trust_wallet_compatible: true },
  { code: 'SUI', name: 'Sui', network: 'Sui', trust_wallet_compatible: true }
]

export default function WalletSetupStep({ onNext, onBack }: WalletSetupStepProps) {
  const [wallets, setWallets] = useState<Record<string, string>>({})
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({})
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
          const groupedCodes = [
            ...CURRENCY_GROUPS.flatMap(group => [
              group.primary.code,
              ...group.autoIncludedStablecoins.map(c => c.code),
              ...group.others.map(c => c.code)
            ]),
            ...OTHER_POPULAR_CURRENCIES.map(c => c.code)
          ]
          
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
      const isValid = await validateAddress(currency, address)
      
      // Auto-include stablecoins when primary currency is validated
      if (isValid) {
        const group = CURRENCY_GROUPS.find(g => g.primary.code === currency)
        if (group && group.autoIncludedStablecoins.length > 0) {
          console.log(`🔄 Auto-including stablecoins for ${currency}:`, group.autoIncludedStablecoins.map(c => c.code))
          const newWallets = { ...wallets, [currency]: address }
          
          group.autoIncludedStablecoins.forEach(stablecoin => {
            newWallets[stablecoin.code] = address
            setValidationStatus(prev => ({ ...prev, [stablecoin.code]: 'valid' }))
          })
          
          setWallets(newWallets)
        }
      }
    } else {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }))
      
      // Remove auto-included stablecoins when primary currency is cleared
      const group = CURRENCY_GROUPS.find(g => g.primary.code === currency)
      if (group && group.autoIncludedStablecoins.length > 0) {
        const newWallets = { ...wallets }
        const newValidationStatus = { ...validationStatus }
        
        group.autoIncludedStablecoins.forEach(stablecoin => {
          delete newWallets[stablecoin.code]
          delete newValidationStatus[stablecoin.code]
        })
        
        setWallets(newWallets)
        setValidationStatus(newValidationStatus)
      }
    }
  }

  const handleRemoveWallet = (currency: string) => {
    setWallets(prev => {
      const newWallets = { ...prev }
      delete newWallets[currency]
      return newWallets
    })
    setValidationStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[currency]
      return newStatus
    })
    
    // Also remove auto-included stablecoins if removing primary currency
    const group = CURRENCY_GROUPS.find(g => g.primary.code === currency)
    if (group && group.autoIncludedStablecoins.length > 0) {
      const newWallets = { ...wallets }
      const newValidationStatus = { ...validationStatus }
      
      group.autoIncludedStablecoins.forEach(stablecoin => {
        delete newWallets[stablecoin.code]
        delete newValidationStatus[stablecoin.code]
      })
      
      setWallets(newWallets)
      setValidationStatus(newValidationStatus)
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
  }, [wallets, validationStatus])

  const renderCurrencyInput = (currency: CompatibleCurrency, isAutoIncluded: boolean = false) => (
    <div key={currency.code} className={`relative border rounded-xl p-4 transition-all ${
      validationStatus[currency.code] === 'valid' ? 'border-green-300 bg-green-50/50' :
      validationStatus[currency.code] === 'invalid' ? 'border-red-300 bg-red-50/50' :
      isAutoIncluded ? 'border-blue-200 bg-blue-50/30' :
      'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{currency.code}</span>
            {isAutoIncluded && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                Auto-included
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">{currency.name}</p>
          <p className="text-xs text-gray-500">Network: {currency.network}</p>
        </div>
        <div className="flex items-center gap-2">
          {wallets[currency.code] && !isAutoIncluded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveWallet(currency.code)}
              className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {getValidationIcon(currency.code)}
        </div>
      </div>
      
      {!isAutoIncluded ? (
        <div className="space-y-2">
          <Input
            placeholder={`Enter your ${currency.code} wallet address`}
            value={wallets[currency.code] || ''}
            onChange={(e) => handleAddressChange(currency.code, e.target.value)}
            className={`transition-colors ${
              validationStatus[currency.code] === 'valid' ? 'border-green-300 focus:border-green-400' :
              validationStatus[currency.code] === 'invalid' ? 'border-red-300 focus:border-red-400' :
              'focus:border-blue-400'
            }`}
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
      ) : (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">Uses same address as primary currency</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              This stablecoin will automatically use your {currency.network} address
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Set Up Your Crypto Wallets</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Configure wallet addresses for the cryptocurrencies you want to accept. Major stablecoins will be automatically included for each ecosystem.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant={configuredCurrencies.length > 0 ? "default" : "outline"} className="text-sm">
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
        <TrustWalletGuide 
          onComplete={() => setShowTrustWalletGuide(false)} 
          onSkip={() => setShowTrustWalletGuide(false)} 
        />
      )}

      {/* Recommended Cryptocurrency Groups */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Recommended Cryptocurrencies
          </h3>
          <p className="text-sm text-gray-600">
            Configure at least one cryptocurrency. Major stablecoins are automatically included.
          </p>
        </div>

        {CURRENCY_GROUPS.map((group) => (
          <Card key={group.id} className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="text-lg text-gray-900">{group.name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                {group.autoIncludedStablecoins.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    ✨ Includes {group.autoIncludedStablecoins.map(c => c.name).join(' and ')} automatically
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Currency */}
              {renderCurrencyInput(group.primary)}

              {/* Auto-included Stablecoins */}
              {group.autoIncludedStablecoins.length > 0 && wallets[group.primary.code] && validationStatus[group.primary.code] === 'valid' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-blue-200 flex-1"></div>
                    <span className="text-xs text-blue-600 bg-white px-2">Auto-included Stablecoins</span>
                    <div className="h-px bg-blue-200 flex-1"></div>
                  </div>
                  {group.autoIncludedStablecoins.map(currency => 
                    renderCurrencyInput(currency, true)
                  )}
                </div>
              )}

              {/* Other currencies */}
              {group.others.length > 0 && (
                <div className="space-y-3">
                  {group.others.map(currency => renderCurrencyInput(currency))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Other Popular Cryptocurrencies */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-lg text-gray-900">Other Popular Cryptocurrencies</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Additional widely used cryptocurrencies</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {OTHER_POPULAR_CURRENCIES.map(currency => renderCurrencyInput(currency))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Currencies Section */}
      {additionalCurrencies.length > 0 && (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Additional Cryptocurrencies</CardTitle>
            <p className="text-sm text-gray-600">
              Optional: Add support for more cryptocurrencies ({additionalCurrencies.length} available from NOWPayments)
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
                {filteredAdditionalCurrencies.map((currency) => 
                  renderCurrencyInput({
                    code: currency.code,
                    name: currency.display_name,
                    network: currency.network,
                    trust_wallet_compatible: currency.trust_wallet_compatible
                  })
                )}
                
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
      <Card className={`border-2 ${canProceed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
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
                  ? `✅ Ready to continue with ${configuredCurrencies.length} configured ${configuredCurrencies.length === 1 ? 'cryptocurrency' : 'cryptocurrencies'}`
                  : '⚠️ Configure at least 1 cryptocurrency to continue'
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
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="px-8">
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed}
          className="min-w-[120px] px-8"
        >
          {canProceed ? 'Continue' : 'Configure Wallets'}
        </Button>
      </div>
    </div>
  )
}

