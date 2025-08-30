import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle, Search, ExternalLink, Trash2, Info, Wallet, Shield, Coins, Star, Copy, Plus } from 'lucide-react'
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide'
import { CryptoIcon } from '@/app/components/ui/crypto-icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { isApprovedCurrency, getApprovedDisplayName } from '@/lib/approved-currencies'

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



interface WalletSetupStepProps {
  onNext: (wallets: Record<string, string>) => void
  onBack: () => void
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid'

// Popular cryptocurrencies for the first dropdown
const POPULAR_CURRENCIES: CompatibleCurrency[] = [
  { code: 'BTC', name: 'Bitcoin', network: 'Bitcoin', trust_wallet_compatible: true },
  { code: 'ETH', name: 'Ethereum', network: 'Ethereum', trust_wallet_compatible: true },
  { code: 'SOL', name: 'Solana', network: 'Solana', trust_wallet_compatible: true },
  { code: 'BNB', name: 'BNB', network: 'BSC', trust_wallet_compatible: true },
  { code: 'TRX', name: 'TRON', network: 'TRON', trust_wallet_compatible: true },
  { code: 'TON', name: 'Toncoin', network: 'TON', trust_wallet_compatible: true },
  { code: 'AVAX', name: 'Avalanche', network: 'Avalanche', trust_wallet_compatible: true },
  { code: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', trust_wallet_compatible: true },
  { code: 'XRP', name: 'XRP', network: 'XRP Ledger', trust_wallet_compatible: true },
  { code: 'LTC', name: 'Litecoin', network: 'Litecoin', trust_wallet_compatible: true },
  { code: 'ADA', name: 'Cardano', network: 'Cardano', trust_wallet_compatible: true },
  { code: 'SUI', name: 'Sui', network: 'Sui', trust_wallet_compatible: true },
  { code: 'MATIC', name: 'Polygon', network: 'Polygon', trust_wallet_compatible: true },
  { code: 'ALGO', name: 'Algorand', network: 'Algorand', trust_wallet_compatible: true }
]

// Stable coin associations for automatic inclusion
const stableCoinAssociations: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD'],
  BNB: ['USDTBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO'],
}

const CURRENCY_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  TRX: 'TRON',
  TON: 'Toncoin',
  AVAX: 'Avalanche',
  DOGE: 'Dogecoin',
  XRP: 'XRP',
  SUI: 'Sui',
  MATIC: 'Polygon',
  ADA: 'Cardano',
  DOT: 'Polkadot',
  LTC: 'Litecoin',
  XLM: 'Stellar',
  ARB: 'Arbitrum',
  OP: 'Optimism',
  ETHBASE: 'ETH (Base)',
  ALGO: 'Algorand',
  USDT: 'Tether (Ethereum)',
  USDC: 'USD Coin (Ethereum)',
  DAI: 'Dai (Ethereum)',
  PYUSD: 'PayPal USD (Ethereum)',
  USDCSOL: 'USD Coin (Solana)',
  USDTSOL: 'Tether (Solana)',
  USDTBSC: 'Tether (BSC)',
  USDCBSC: 'USD Coin (BSC)',
  USDTMATIC: 'Tether (Polygon)',
  USDCMATIC: 'USD Coin (Polygon)',
  USDTTRC20: 'Tether (Tron)',
  USDTTON: 'Tether (TON)',
  USDTARB: 'Tether (Arbitrum)',
  USDCARB: 'USD Coin (Arbitrum)',
  USDTOP: 'Tether (Optimism)',
  USDCOP: 'USD Coin (Optimism)',
  USDCBASE: 'USD Coin (Base)',
  USDCALGO: 'USD Coin (Algorand)',
}

export default function WalletSetupStep({ onNext, onBack }: WalletSetupStepProps) {
  const [wallets, setWallets] = useState<Record<string, string>>({})
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({})
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false)
  const [selectedPopularCurrency, setSelectedPopularCurrency] = useState<string>('')
  const [selectedAdditionalCurrency, setSelectedAdditionalCurrency] = useState<string>('')

  useEffect(() => {
    loadAdditionalCurrencies()
  }, [])

  const loadAdditionalCurrencies = async () => {
    try {
      setLoadingCurrencies(true)
      console.log('📡 Loading additional currencies from nowpayments API...')

      const response = await fetch('/api/nowpayments/currencies')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.currencies) {
          // Filter to only include approved currencies
          const approvedCurrencies = data.currencies.filter((currency: CurrencyInfo) => 
            isApprovedCurrency(currency.code)
          )
          
          // Update display names and filter out popular currencies
          const popularCodes = POPULAR_CURRENCIES.map(c => c.code)
          const processedCurrencies = approvedCurrencies.map((currency: CurrencyInfo) => ({
            ...currency,
            display_name: getApprovedDisplayName(currency.code)
          })).filter((c: CurrencyInfo) => {
            return !popularCodes.includes(c.code) && c.enabled
          }).sort((a: CurrencyInfo, b: CurrencyInfo) => 
            (a.display_name || a.name || a.code).localeCompare(b.display_name || b.name || b.code)
          )
          
          console.log(`📊 Loaded ${processedCurrencies.length} additional approved currencies`)
          setAdditionalCurrencies(processedCurrencies)
        } else {
          console.error('Failed to load currencies:', data.message || 'Unknown error')
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

  const getCurrencyDisplayName = (code: string) => {
    return CURRENCY_NAMES[code] || code
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

  const handleAddPopularCurrency = () => {
    if (selectedPopularCurrency && !wallets[selectedPopularCurrency]) {
      setWallets(prev => ({ ...prev, [selectedPopularCurrency]: '' }))
      setValidationStatus(prev => ({ ...prev, [selectedPopularCurrency]: 'idle' }))
      setSelectedPopularCurrency('')
    }
  }

  const handleAddAdditionalCurrency = () => {
    if (selectedAdditionalCurrency && !wallets[selectedAdditionalCurrency]) {
      setWallets(prev => ({ ...prev, [selectedAdditionalCurrency]: '' }))
      setValidationStatus(prev => ({ ...prev, [selectedAdditionalCurrency]: 'idle' }))
      setSelectedAdditionalCurrency('')
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

  // Filter additional currencies based on search term (same logic as wallets page)
  const filteredAdditionalCurrencies = additionalCurrencies.filter(currency => {
    // Check if this currency is a stable coin of any base currency
    const isStableCoin = Object.values(stableCoinAssociations).some(stableCoins => 
      stableCoins.includes(currency.code)
    )
    
    // Check if this currency already has a wallet configured
    const hasExistingWallet = Object.keys(wallets).includes(currency.code)
    
    // Include if not a stable coin, doesn't have existing wallet, and matches search term
    return !isStableCoin && !hasExistingWallet && (
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Debug state updates
  useEffect(() => {
    console.log('🔄 State update - Wallets:', wallets)
    console.log('🔄 State update - Validation Status:', validationStatus)
  }, [wallets, validationStatus])

  const renderCurrencyInput = (currency: CompatibleCurrency, isAutoIncluded: boolean = false) => (
    <div key={currency.code} className={`relative border-2 rounded-lg p-6 transition-all duration-200 ${
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
              className={`form-input-enhanced h-12 text-sm transition-all duration-200 ${
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
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
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
      <div className="text-center space-y-4">
        <h2 className="heading-lg text-gray-900">Set Up Your Crypto Wallets</h2>
        <p className="text-body text-gray-600 max-w-3xl mx-auto leading-relaxed">
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

      {/* Smart Wallet Info - simplified and neutral */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="heading-sm mb-2 text-gray-900">Smart Wallet Setup - Automatic Stable Coin Support</h3>
        <p className="text-sm text-gray-600 mb-3">
          Configure one wallet address per ecosystem and automatically support multiple payment options:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          <li className="flex items-start gap-2"><span className="text-[#7f5efd] mt-0.5">•</span><span><strong>SOL wallet</strong> enables SOL + USDC & USDT on Solana</span></li>
          <li className="flex items-start gap-2"><span className="text-[#7f5efd] mt-0.5">•</span><span><strong>ETH wallet</strong> enables ETH + USDT, USDC, DAI & PYUSD on Ethereum</span></li>
          <li className="flex items-start gap-2"><span className="text-[#7f5efd] mt-0.5">•</span><span><strong>BNB wallet</strong> enables BNB + USDT & USDC on BSC</span></li>
          <li className="flex items-start gap-2"><span className="text-[#7f5efd] mt-0.5">•</span><span><strong>MATIC wallet</strong> enables MATIC + USDT & USDC on Polygon</span></li>
          <li className="flex items-start gap-2"><span className="text-[#7f5efd] mt-0.5">•</span><span><strong>TRX wallet</strong> enables TRX + USDT on Tron</span></li>
          <li className="flex items-start gap-2"><span className="text-[#7f5efd] mt-0.5">•</span><span><strong>TON wallet</strong> enables TON + USDT on TON</span></li>
        </ul>
      </div>

      {/* Recommended Cryptocurrencies Dropdown */}
      <Card className="shadow-medium border rounded-lg transition-all duration-200">
        <CardHeader className="space-y-6">
          <div className="flex items-center gap-6">
            <div>
              <CardTitle className="heading-sm text-gray-900">Recommended Cryptocurrencies</CardTitle>
              <p className="text-body text-gray-600 mt-1">
                Add support for the most widely used cryptocurrencies
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={selectedPopularCurrency} onValueChange={setSelectedPopularCurrency}>
              <SelectTrigger className="form-input-enhanced flex-1 h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                <SelectValue placeholder="Select a recommended cryptocurrency..." />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.filter(currency => !wallets[currency.code]).map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <CryptoIcon currency={currency.code} className="h-4 w-4" />
                      <span>{currency.code} - {getCurrencyDisplayName(currency.code)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddPopularCurrency}
              disabled={!selectedPopularCurrency}
              className="h-12 px-6 bg-[#7f5efd] hover:bg-[#6b4fd8] text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Cryptocurrencies Dropdown */}
      <Card className="border rounded-lg shadow-medium transition-all duration-200">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="heading-sm text-gray-900">Additional Cryptocurrencies</CardTitle>
              <p className="text-body text-gray-600 mt-1">
                Search and add support for more cryptocurrencies
              </p>
            </div>
          </div>
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

          <div className="flex items-center gap-4">
            <Select value={selectedAdditionalCurrency} onValueChange={setSelectedAdditionalCurrency}>
              <SelectTrigger className="form-input-enhanced flex-1 h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20">
                <SelectValue placeholder="Select an additional cryptocurrency..." />
              </SelectTrigger>
              <SelectContent>
                {filteredAdditionalCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <CryptoIcon currency={currency.code} className="h-4 w-4" />
                      <span>{currency.code} - {currency.display_name || currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddAdditionalCurrency}
              disabled={!selectedAdditionalCurrency}
              className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {loadingCurrencies && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#7f5efd]" />
              <span className="ml-3 text-base">Loading additional currencies...</span>
            </div>
          )}

          {searchTerm && filteredAdditionalCurrencies.length === 0 && !loadingCurrencies && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No cryptocurrencies found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configured Wallets */}
      {Object.keys(wallets).length > 0 && (
        <Card className="border rounded-lg shadow-medium transition-all duration-200">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="heading-sm text-gray-900">Configured Wallets</CardTitle>
                <p className="text-body text-gray-600 mt-1">
                  Enter wallet addresses for your selected cryptocurrencies
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
                         {Object.keys(wallets).map(currency => {
               const currencyInfo = POPULAR_CURRENCIES.find(c => c.code === currency) || 
                                  additionalCurrencies.find(c => c.code === currency)
               if (!currencyInfo) return null
               
               return renderCurrencyInput({
                 code: currency,
                 name: currencyInfo.name,
                 network: currencyInfo.network,
                 trust_wallet_compatible: currencyInfo.trust_wallet_compatible || false
               })
             })}
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      <Card className="border rounded-lg shadow-soft">
        <CardContent className="py-4">
          <p className="text-sm text-gray-700 text-center">
            {canProceed
              ? `${configuredCurrencies.length} configured ${configuredCurrencies.length === 1 ? 'cryptocurrency' : 'cryptocurrencies'} — you can add more later in settings`
              : 'Configure at least 1 cryptocurrency to continue'}
          </p>
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

