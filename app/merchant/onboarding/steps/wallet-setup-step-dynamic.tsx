import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Loader2, Search, ExternalLink, Trash2, Info, CheckCircle, AlertCircle } from 'lucide-react'
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
      { code: 'BASE', name: 'ETH (Base)', network: 'Base', trust_wallet_compatible: true },
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

  const handleAddressChange = (currency: string, address: string) => {
    setWallets(prev => ({ ...prev, [currency]: address }))
  }

  const handleRemoveWallet = (currency: string) => {
    setWallets(prev => {
      const newWallets = { ...prev }
      delete newWallets[currency]
      return newWallets
    })
  }

  const configuredCurrencies = Object.keys(wallets).filter(currency =>
    wallets[currency]?.trim()
  )

  const canProceed = configuredCurrencies.length >= 1

  const handleNext = () => {
    const validWallets = Object.fromEntries(
      Object.entries(wallets).filter(([_, address]) => address?.trim())
    )
    onNext(validWallets)
  }

  const filteredAdditionalCurrencies = additionalCurrencies.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderCurrencyInput = (currency: CompatibleCurrency, isAutoIncluded: boolean = false) => (
    <div key={currency.code} className={`relative border rounded-xl p-4 transition-all ${
      isAutoIncluded ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
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
        </div>
      </div>

      {!isAutoIncluded ? (
        <div className="space-y-2">
          <Input
            placeholder={`Enter your ${currency.code} wallet address`}
            value={wallets[currency.code] || ''}
            onChange={(e) => handleAddressChange(currency.code, e.target.value)}
            className="transition-colors focus:border-blue-400"
          />
          {wallets[currency.code] && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs font-medium text-green-800 mb-2">
                ✅ Automatically includes these stable coins:
              </div>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const stableCoins = {
                    'SOL': ['USDC (Solana)', 'USDT (Solana)'],
                    'ETH': ['USDT (ERC-20)', 'USDC (ERC-20)', 'DAI', 'PYUSD', 'ETH (Base)', 'USDC (Base)'],
                    'BNB': ['USDT (BSC)', 'USDC (BSC)'],
                    'MATIC': ['USDT (Polygon)', 'USDC (Polygon)'],
                    'TRX': ['USDT (TRC-20)'],
                    'TON': ['USDT (TON)'],
                    'BASE': ['USDC (Base)'],
                    'ALGO': ['USDC (Algorand)']
                  }[currency.code] || [];

                  return stableCoins.map((coin, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
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
                    'BASE': ['USDC (Base)'],
                    'ALGO': ['USDC (Algorand)']
                  }[currency.code] || [];

                return stableCoins.length === 0 ? null : (
                  <div className="mt-2 text-xs text-green-700">
                    Customers can pay with {currency.code} or any of these {stableCoins.length} stable coins using the same address.
                  </div>
                );
              })()}
            </div>
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

      {/* Stable Coin Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-blue-800">
            <h3 className="font-semibold mb-2">Smart Wallet Setup - Automatic Stable Coin Support</h3>
            <p className="text-sm mb-2">
              Configure one wallet address per ecosystem and automatically support multiple payment options:
            </p>
            <div className="text-sm space-y-1">
              • <strong>SOL wallet</strong> → enables SOL + USDC & USDT on Solana
              • <strong>ETH wallet</strong> → enables ETH + USDT, USDC, DAI & PYUSD on Ethereum
              • <strong>BNB wallet</strong> → enables BNB + USDT & USDC on BSC
              • <strong>MATIC wallet</strong> → enables MATIC + USDT & USDC on Polygon
              • <strong>TRX wallet</strong> → enables TRX + USDT on Tron
              • <strong>TON wallet</strong> → enables TON + USDT on TON
            </div>
            <p className="text-sm mt-2 font-medium">
              No need for separate addresses - stable coins use the same wallet as their base currency!
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Cryptocurrency Groups */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Recommended Cryptocurrencies
          </h3>
          <p className="text-sm text-gray-600">
            Configure at least one cryptocurrency to start accepting payments.
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
                    ✨ Automatically includes stable coins for customer payments
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Currency */}
              {renderCurrencyInput(group.primary)}

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
                      No cryptocurrencies found matching &quot;{searchTerm}&quot;
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

