import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle, Search, ExternalLink, Trash2, Info, Wallet, Shield, Coins, Star, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'
import { CryptoIcon } from '@/app/components/ui/crypto-icon'

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
    description: 'Ethereum network - automatically includes USDT, USDC, DAI, PYUSD, ETH (Base) & USDC (Base)',
    primary: { code: 'ETH', name: 'Ethereum', network: 'Ethereum', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDT', name: 'USDT', network: 'Ethereum', trust_wallet_compatible: true },
      { code: 'USDC', name: 'USDC', network: 'Ethereum', trust_wallet_compatible: true },
      { code: 'DAI', name: 'DAI', network: 'Ethereum', trust_wallet_compatible: true },
      { code: 'PYUSD', name: 'PYUSD', network: 'Ethereum', trust_wallet_compatible: true },
      { code: 'ETHBASE', name: 'ETH (Base)', network: 'Base', trust_wallet_compatible: true },
      { code: 'USDCBASE', name: 'USDC (Base)', network: 'Base', trust_wallet_compatible: true },
    ],
    others: []
  },
  {
    id: 'binance',
    name: 'Binance Smart Chain',
    description: 'BSC network - automatically includes USDT & USDC',
    primary: { code: 'BNB', name: 'BNB', network: 'BSC', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDTBSC', name: 'USDT (BSC)', network: 'BSC', trust_wallet_compatible: true },
      { code: 'USDCBSC', name: 'USDC (BSC)', network: 'BSC', trust_wallet_compatible: true },
    ],
    others: []
  },
  {
    id: 'solana',
    name: 'Solana Ecosystem',
    description: 'Solana network - automatically includes USDC & USDT',
    primary: { code: 'SOL', name: 'Solana', network: 'Solana', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDCSOL', name: 'USDC (Solana)', network: 'Solana', trust_wallet_compatible: true },
      { code: 'USDTSOL', name: 'USDT (Solana)', network: 'Solana', trust_wallet_compatible: true },
    ],
    others: []
  },
  {
    id: 'tron',
    name: 'TRON Ecosystem',
    description: 'TRON network - automatically includes USDT',
    primary: { code: 'TRX', name: 'TRON', network: 'TRON', trust_wallet_compatible: true },
    autoIncludedStablecoins: [
      { code: 'USDTTRC20', name: 'USDT (TRC-20)', network: 'TRON', trust_wallet_compatible: true },
    ],
    others: []
  },
  {
    id: 'avalanche',
    name: 'Avalanche Ecosystem',
    description: 'Avalanche network',
    primary: { code: 'AVAX', name: 'Avalanche', network: 'Avalanche', trust_wallet_compatible: true },
    autoIncludedStablecoins: [],
    others: []
  }
]

const OTHER_POPULAR_CURRENCIES: CompatibleCurrency[] = [
  { code: 'XRP', name: 'XRP', network: 'XRP Ledger', trust_wallet_compatible: true },
  { code: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', trust_wallet_compatible: true },
  { code: 'LTC', name: 'Litecoin', network: 'Litecoin', trust_wallet_compatible: true },
  { code: 'ADA', name: 'Cardano', network: 'Cardano', trust_wallet_compatible: true },
  { code: 'TON', name: 'TON', network: 'TON', trust_wallet_compatible: true },
  { code: 'SUI', name: 'Sui', network: 'Sui', trust_wallet_compatible: true },
  { code: 'ALGO', name: 'Algorand', network: 'Algorand', trust_wallet_compatible: true }
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

          const additional = result.currencies.filter((c: CurrencyInfo) => {
            const stableCoins = ['USDT', 'USDC', 'DAI', 'PYUSD', 'BUSD', 'TUSD', 'FRAX', 'LUSD', 'USDP', 'GUSD', 'USDE', 'FDUSD', 'USDD']
            const isStable = stableCoins.some(sc => c.code.toUpperCase().includes(sc))
            return !groupedCodes.includes(c.code) && c.enabled && !isStable
          })
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
    setWallets(prev => {
      const updated = { ...prev, [currency]: address }
      if (currency === 'ETH') {
        updated['ETHBASE'] = address
      }
      return updated
    })

    if (address.trim()) {
      const isValid = await validateAddress(currency, address)
      if (currency === 'ETH') {
        setValidationStatus(prev => ({ ...prev, ETHBASE: isValid ? 'valid' : 'invalid' }))
      }
    } else {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle', ...(currency === 'ETH' ? { ETHBASE: 'idle' } : {}) }))
    }
  }

  const handleRemoveWallet = (currency: string) => {
    setWallets(prev => {
      const newWallets = { ...prev }
      delete newWallets[currency]
      if (currency === 'ETH') {
        delete newWallets['ETHBASE']
      }
      return newWallets
    })
    setValidationStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[currency]
      if (currency === 'ETH') {
        delete newStatus['ETHBASE']
      }
      return newStatus
    })
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
    <div key={currency.code} className={`relative border-2 rounded-xl p-6 transition-all duration-200 ${
      validationStatus[currency.code] === 'valid' ? 'border-green-300 bg-green-50/50 shadow-green-100' :
      validationStatus[currency.code] === 'invalid' ? 'border-red-300 bg-red-50/50 shadow-red-100' :
      isAutoIncluded ? 'border-blue-200 bg-blue-50/30 shadow-blue-100' :
      'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <CryptoIcon currency={currency.code} className="h-6 w-6" />
              <span className="font-bold text-lg text-gray-900">{currency.code}</span>
            </div>
            {isAutoIncluded && (
              <Badge variant="outline" className="text-xs font-medium text-blue-600 border-blue-200 bg-blue-50">
                Auto-included
              </Badge>
            )}
            {currency.trust_wallet_compatible && (
              <Badge variant="outline" className="text-xs font-medium text-green-600 border-green-200 bg-green-50">
                <Shield className="h-3 w-3 mr-1" />
                Trust Wallet
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{currency.name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Coins className="h-3 w-3" />
            Network: {currency.network}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wallets[currency.code] && !isAutoIncluded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveWallet(currency.code)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {getValidationIcon(currency.code)}
        </div>
      </div>

      {!isAutoIncluded ? (
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder={`Enter your ${currency.code} wallet address`}
              value={wallets[currency.code] || ''}
              onChange={(e) => handleAddressChange(currency.code, e.target.value)}
              className={`h-12 text-sm transition-all duration-200 ${
                validationStatus[currency.code] === 'valid' ? 'border-green-300 focus:border-green-400 focus:ring-green-100' :
                validationStatus[currency.code] === 'invalid' ? 'border-red-300 focus:border-red-400 focus:ring-red-100' :
                'focus:border-[#7f5efd] focus:ring-[#7f5efd]/20'
              }`}
            />
            {wallets[currency.code] && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(wallets[currency.code])}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
            <p className={`text-sm font-medium ${
              validationStatus[currency.code] === 'valid' ? 'text-green-600' :
              validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {getValidationMessage(currency.code)}
            </p>
          )}

          {/* Show included stable coins for validated base currencies */}
          {validationStatus[currency.code] === 'valid' && wallets[currency.code] && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-800 mb-3">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold text-sm">Automatically includes these stable coins:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const stableCoins = {
                    'SOL': ['USDC (Solana)', 'USDT (Solana)'],
                    'ETH': ['USDT (ERC-20)', 'USDC (ERC-20)', 'DAI', 'PYUSD', 'ETH (Base)', 'USDC (Base)'],
                    'BNB': ['USDT (BSC)', 'USDC (BSC)'],
                    'MATIC': ['USDT (Polygon)', 'USDC (Polygon)'],
                    'TRX': ['USDT (TRC-20)'],
                    'TON': ['USDT (TON)'],
                    'ETHBASE': ['USDC (Base)'],
                    'ALGO': ['USDC (Algorand)']
                  }[currency.code] || [];

                  return stableCoins.map((coin, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <Coins className="h-3 w-3" />
                      {coin}
                    </span>
                  ));
                })()}
              </div>
              {(() => {
                  const stableCoins = {
                    'SOL': ['USDC (Solana)', 'USDT (Solana)'],
                    'ETH': ['USDT (ERC-20)', 'USDC (ERC-20)', 'DAI', 'PYUSD', 'ETH (Base)', 'USDC (Base)'],
                    'BNB': ['USDT (BSC)', 'USDC (BSC)'],
                    'MATIC': ['USDT (Polygon)', 'USDC (Polygon)'],
                    'TRX': ['USDT (TRC-20)'],
                    'TON': ['USDT (TON)'],
                    'ETHBASE': ['USDC (Base)'],
                    'ALGO': ['USDC (Algorand)']
                  }[currency.code] || [];

                return stableCoins.length === 0 ? null : (
                  <div className="mt-3 text-xs text-green-700 font-medium">
                    Customers can pay with {currency.code} or any of these {stableCoins.length} stable coins using the same address.
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 text-blue-700">
              <Info className="h-5 w-5" />
              <span className="text-sm font-semibold">Uses same address as primary currency</span>
            </div>
            <p className="text-sm text-blue-600 mt-2 font-medium">
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
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] rounded-xl">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-900">Set Up Your Crypto Wallets</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Configure wallet addresses for the cryptocurrencies you want to accept. Major stablecoins will be automatically included for each ecosystem.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant={configuredCurrencies.length > 0 ? "default" : "outline"} className="text-sm font-medium px-4 py-2">
            {configuredCurrencies.length} configured
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTrustWalletGuide(true)}
            className="flex items-center gap-2 font-medium"
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

      {/* Stable Coin Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-blue-800">
            <h3 className="font-bold text-lg mb-3">Smart Wallet Setup - Automatic Stable Coin Support</h3>
            <p className="text-base mb-4 leading-relaxed">
              Configure one wallet address per ecosystem and automatically support multiple payment options:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span><strong>SOL wallet</strong> → enables SOL + USDC & USDT on Solana</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span><strong>ETH wallet</strong> → enables ETH + USDT, USDC, DAI & PYUSD on Ethereum</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span><strong>BNB wallet</strong> → enables BNB + USDT & USDC on BSC</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span><strong>MATIC wallet</strong> → enables MATIC + USDT & USDC on Polygon</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span><strong>TRX wallet</strong> → enables TRX + USDT on Tron</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span><strong>TON wallet</strong> → enables TON + USDT on TON</span>
              </div>
            </div>
            <p className="text-base mt-4 font-semibold">
              No need for separate addresses - stable coins use the same wallet as their base currency!
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Cryptocurrency Groups */}
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Recommended Cryptocurrencies
          </h3>
          <p className="text-base text-gray-600">
            Configure at least one cryptocurrency to start accepting payments.
          </p>
        </div>

        {CURRENCY_GROUPS.map((group) => (
          <Card key={group.id} className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-6">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <CryptoIcon currency={group.primary.code} className="h-6 w-6" />
                  {group.name}
                </CardTitle>
                <p className="text-base text-gray-600 mt-2">{group.description}</p>
                {group.autoIncludedStablecoins.length > 0 && (
                  <p className="text-sm text-blue-600 mt-3 font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    ✨ Automatically includes stable coins for customer payments
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Currency */}
              {renderCurrencyInput(group.primary)}

              {/* Other currencies */}
              {group.others.length > 0 && (
                <div className="space-y-4">
                  {group.others.map(currency => renderCurrencyInput(currency))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Other Popular Cryptocurrencies */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-6">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Other Popular Cryptocurrencies</CardTitle>
              <p className="text-base text-gray-600 mt-2">Additional widely used cryptocurrencies</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {OTHER_POPULAR_CURRENCIES.map(currency => renderCurrencyInput(currency))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Currencies Section */}
      {additionalCurrencies.length > 0 && (
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Additional Cryptocurrencies</CardTitle>
            <p className="text-base text-gray-600">
              Optional: Add support for more cryptocurrencies ({additionalCurrencies.length} available from NOWPayments)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search for cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>

            {loadingCurrencies ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#7f5efd]" />
                <span className="ml-3 text-lg">Loading additional currencies...</span>
              </div>
            ) : (
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {filteredAdditionalCurrencies.map((currency) =>
                  renderCurrencyInput({
                    code: currency.code,
                    name: currency.display_name,
                    network: currency.network,
                    trust_wallet_compatible: currency.trust_wallet_compatible
                  })
                )}

                  {searchTerm && filteredAdditionalCurrencies.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No cryptocurrencies found matching &quot;{searchTerm}&quot;</p>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      <Card className={`border-2 shadow-lg transition-all duration-200 ${
        canProceed ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <CardContent className="pt-8">
          <div className="flex items-center gap-4">
            {canProceed ? (
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div>
              <p className="text-lg font-bold">
                {canProceed
                  ? `✅ Ready to continue with ${configuredCurrencies.length} configured ${configuredCurrencies.length === 1 ? 'cryptocurrency' : 'cryptocurrencies'}`
                  : '⚠️ Configure at least 1 cryptocurrency to continue'
                }
              </p>
              <p className="text-base text-gray-600 mt-1">
                You can always add more cryptocurrencies later in your settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} className="px-8 h-12 text-base font-medium">
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="min-w-[140px] px-8 h-12 text-base font-medium bg-[#7f5efd] hover:bg-[#6b4fd8] text-white"
        >
          {canProceed ? 'Continue' : 'Configure Wallets'}
        </Button>
      </div>
    </div>
  )
}

