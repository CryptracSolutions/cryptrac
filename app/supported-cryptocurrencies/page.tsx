'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { ArrowLeft, Search, Bitcoin, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { CryptoIcon } from "@/app/components/ui/crypto-icon";

interface Currency {
  code: string;
  name: string;
  display_name?: string;
  image?: string;
  network?: string;
  is_stablecoin?: boolean;
  rate_usd?: number;
}

// Approved cryptocurrencies list - exactly 153 currencies
const APPROVED_CURRENCIES: Record<string, string> = {
  '1INCH': '1inch Network',
  'AAVE': 'Aave',
  'ALGO': 'Algorand',
  'APT': 'Aptos',
  'ARB': 'Arbitrum',
  'ARV': 'Ariva',
  'ARK': 'Ark',
  'AVAXC': 'Avalanche',
  'AVAX': 'AVAX',
  'AXS': 'Axie Infinity',
  'BABYDOGE': 'Baby Doge Coin',
  'BAT': 'Basic Attention Token',
  'BAZED': 'Bazed Games',
  'BEAM': 'Beam',
  'BERA': 'Berachain',
  'BNBBSC': 'Binance Coin (BSC)',
  'BNBMAINNET': 'Binance Coin',
  'BUSD': 'Binance USD',
  'BUSDBSC': 'Binance USD',
  'BUSDMATIC': 'Binance USD',
  'BTC': 'Bitcoin',
  'BCH': 'Bitcoin Cash',
  'BRETTBASE': 'Brett',
  'CAKE': 'CAKE',
  'ADA': 'Cardano',
  'CSPR': 'Casper',
  'LINK': 'Chainlink',
  'CSWAP': 'ChainSwap',
  'CHZ': 'Chiliz',
  'CFX': 'Conflux',
  'CFXMAINNET': 'Conflux',
  'ATOM': 'Cosmos',
  'COTI': 'COTI',
  'CRO': 'Cronos',
  'CROMAINNET': 'Cronos',
  'DAI': 'DAI',
  'DASH': 'Dash',
  'MANA': 'Decentraland',
  'DOGE': 'Dogecoin',
  'ENJ': 'Enjin Coin',
  'ETH': 'Ethereum',
  'ETHARB': 'Ethereum',
  'ETHBASE': 'Ethereum',
  'ZKSYNC': 'Ethereum (zkSync Era)',
  'ETC': 'Ethereum Classic',
  'FTM': 'Fantom',
  'FTMMAINNET': 'Fantom',
  'FIL': 'Filecoin',
  'FLOKI': 'Floki',
  'FRONT': 'Frontier',
  'FTT': 'FTT',
  'FUN': 'FUNToken',
  'GALAERC20': 'GALAERC20',
  'ONE': 'Harmony',
  'HBAR': 'Hedera Hashgraph',
  'HEX': 'Hex',
  'HYPE': 'Hyperliquid',
  'ILV': 'Illuvium',
  'INJERC20': 'Injective',
  'INJMAINNET': 'Injective Protocol',
  'INJ': 'Injective Protocol',
  'IOTA': 'IOTA',
  'IOTX': 'IOTX',
  'JASMY': 'JasmyCoin',
  'JETTON': 'JetTon Games',
  'KAIA': 'Kaia',
  'KAS': 'Kaspa',
  'KMD': 'Komodo',
  'KNC': 'Kyber Network Crystal',
  'ZROARB': 'LayerZero (Arbitrum)',
  'LGCY': 'LGCY Network',
  'LTC': 'Litecoin',
  'MATIC': 'Polygon',
  'XMR': 'Monero',
  'MYRO': 'Myro',
  'NANO': 'Nano',
  'NEAR': 'Near',
  'NEO': 'NEO',
  'NOT': 'Notcoin',
  'OCEAN': 'Ocean Protocol',
  'TRUMP': 'OFFICIAL TRUMP',
  'OKB': 'OKB',
  'OMG': 'OMG Network',
  'PYUSD': 'PayPal USD',
  'PEPE': 'Pepe',
  'DOT': 'Polkadot',
  'MATICMAINNET': 'Polygon',
  'PLS': 'Pulsechain',
  'RVN': 'Ravencoin',
  'XRP': 'Ripple',
  'SEI': 'Sei',
  'SHIB': 'Shiba Inu',
  'SOL': 'Solana',
  'STX': 'Stacks',
  'STRKMAINNET': 'Starknet',
  'XLM': 'Stellar',
  'STRAX': 'Stratis',
  'SUI': 'Sui',
  'SUPER': 'SUPER',
  'TET': 'Tectum',
  'TENSHI': 'Tenshi',
  'LUNA': 'Terra',
  'LUNC': 'Terra Classic',
  'USDTARB': 'Tether',
  'USDTARC20': 'Tether',
  'USDTOP': 'Tether',
  'USDTALGO': 'Tether USD',
  'USDTBSC': 'Tether USD',
  'USDTCELO': 'Tether USD',
  'USDTEOS': 'Tether USD',
  'USDTERC20': 'Tether USD',
  'USDTKAVA': 'Tether USD',
  'USDTNEAR': 'Tether USD',
  'USDTMATIC': 'Tether USD',
  'USDTSOL': 'Tether USD',
  'USDTXTZ': 'Tether USD',
  'USDTTON': 'Tether USD',
  'USDTTRC20': 'Tether USD',
  'USDTDOT': 'Tether',
  'XTZ': 'Tezos',
  'GRT': 'The Graph',
  'THETA': 'THETA',
  'RUNE': 'THORChain',
  'TON': 'Toncoin',
  'TRX': 'Tron',
  'TUSDTRC20': 'TrueUSD',
  'UNI': 'Uniswap',
  'USDCALGO': 'USD Coin',
  'USDCARC20': 'USD Coin',
  'USDCBASE': 'USD Coin',
  'USDCBSC': 'USD Coin',
  'USDC': 'USD Coin',
  'USDCKCC': 'USD Coin',
  'USDCOP': 'USD Coin',
  'USDCMATIC': 'USD Coin',
  'USDCSOL': 'USD Coin',
  'USDCARB': 'USD Coin',
  'OPUSDCE': 'USD Coin',
  'MATICUSDCE': 'USD Coin',
  'USDCXLM': 'USDC',
  'VET': 'VeChain',
  'VLX': 'Velas',
  'VELO': 'Velo',
  'VERSE': 'Verse',
  'WAVES': 'Waves',
  'WBTCMATIC': 'Wrapped Bitcoin (Polygon)',
  'XDC': 'XDC Network',
  'XYO': 'XYO Network',
  'YFI': 'yearn.finance',
  'ZBC': 'Zebec Protocol',
  'ZK': 'zkSync',
  'ZROERC20': 'LayerZero (Ethereum)'
};

// Helper to check if currency is approved
function isApprovedCurrency(code: string): boolean {
  return code.toUpperCase() in APPROVED_CURRENCIES;
}

// Helper to get display name for approved currency
function getApprovedDisplayName(code: string): string {
  return APPROVED_CURRENCIES[code.toUpperCase()] || code;
}

export default function SupportedCryptocurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const response = await fetch('/api/nowpayments/currencies');
        if (!response.ok) {
          throw new Error('Failed to fetch currencies');
        }
        const data = await response.json();
        
        if (data.success && data.currencies) {
          // Filter to only include approved currencies
          const approvedCurrencies = data.currencies.filter((currency: Currency) => 
            isApprovedCurrency(currency.code)
          );
          
          // Update display names and sort alphabetically
          const processedCurrencies = approvedCurrencies.map((currency: Currency) => ({
            ...currency,
            display_name: getApprovedDisplayName(currency.code)
          })).sort((a: Currency, b: Currency) => 
            (a.display_name || a.name || a.code).localeCompare(b.display_name || b.name || b.code)
          );
          
          setCurrencies(processedCurrencies);
        } else {
          throw new Error(data.message || 'Failed to fetch currencies');
        }
      } catch (err) {
        setError('Unable to load supported currencies. Please try again later.');
        console.error('Error fetching currencies:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrencies();
  }, []);

  // Filter currencies based on search term
  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return currencies;
    
    const searchLower = searchTerm.toLowerCase();
    return currencies.filter(currency => 
      (currency.display_name || currency.name || '').toLowerCase().includes(searchLower) ||
      currency.code.toLowerCase().includes(searchLower)
    );
  }, [currencies, searchTerm]);

  // Separate stablecoins and regular currencies
  const stablecoins = filteredCurrencies.filter(c => c.is_stablecoin);
  const regularCurrencies = filteredCurrencies.filter(c => !c.is_stablecoin);

  // Count total displayed currencies
  const displayedCurrencyCount = filteredCurrencies.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="/help" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Help
            </Link>
            <Link href="/contact" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white py-16 sm:py-24">
        <div className="container-wide">
          <div className="mx-auto max-w-4xl text-center">
            <Link href="/" className="inline-flex items-center text-[#7f5efd] hover:text-[#7c3aed] transition-colors mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="font-phonic text-6xl font-normal tracking-tight text-gray-900 mb-6 leading-tight">
              All Supported <span className="text-[#7f5efd]">Cryptocurrencies</span>
            </h1>
            <p className="font-capsule text-base font-normal leading-8 text-gray-600 max-w-3xl mx-auto mb-10">
              <span className="font-phonic text-base font-normal text-[#7f5efd]">{Object.keys(APPROVED_CURRENCIES).length} supported cryptocurrencies</span> for instant, secure payments
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or ticker symbol..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:border-transparent font-phonic text-base font-normal text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 font-phonic text-sm font-normal text-gray-600">
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Shield className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-phonic text-sm font-normal">Non-Custodial</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Zap className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-phonic text-sm font-normal">Instant Processing</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Globe className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-phonic text-sm font-normal">Global Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Currencies Grid Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-wide">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5efd]"></div>
              <p className="mt-4 text-gray-600">Loading supported currencies...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <Bitcoin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="text-center mb-8">
                <p className="text-gray-600">
                  Showing <span className="font-semibold text-[#7f5efd]">{displayedCurrencyCount}</span> {displayedCurrencyCount === 1 ? 'cryptocurrency' : 'cryptocurrencies'}
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>

              {/* Stablecoins Section */}
              {stablecoins.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Stablecoins</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 max-w-7xl mx-auto mb-12">
                    {stablecoins.map((currency) => (
                      <Card key={currency.code} className="p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-[#ede9fe] bg-[#f5f3ff]/30">
                        <div className="flex flex-col items-center h-full">
                          <div className="p-2 bg-[#ede9fe] rounded-lg mb-3 flex-shrink-0">
                            <CryptoIcon currency={currency.code} size="md" />
                          </div>
                          <div className="text-center flex-1 flex flex-col justify-center min-h-0">
                            <div className="font-semibold text-gray-900 text-sm mb-1 uppercase">{currency.code}</div>
                            <div className="text-xs text-gray-500 leading-tight px-1" title={currency.display_name}>
                              {currency.display_name}
                            </div>
                            {currency.network && (
                              <div className="text-xs text-[#7f5efd] mt-1">
                                {currency.network}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Regular Cryptocurrencies Section */}
              {regularCurrencies.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Cryptocurrencies</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 max-w-7xl mx-auto">
                    {regularCurrencies.map((currency) => (
                      <Card key={currency.code} className="p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-gray-200 bg-white">
                        <div className="flex flex-col items-center h-full">
                          <div className="p-2 bg-gray-100 rounded-lg mb-3 flex-shrink-0">
                            <CryptoIcon currency={currency.code} size="md" />
                          </div>
                          <div className="text-center flex-1 flex flex-col justify-center min-h-0">
                            <div className="font-semibold text-gray-900 text-sm mb-1 uppercase">{currency.code}</div>
                            <div className="text-xs text-gray-500 leading-tight px-1" title={currency.display_name}>
                              {currency.display_name}
                            </div>
                            {currency.network && (
                              <div className="text-xs text-[#7f5efd] mt-1">
                                {currency.network}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* No results */}
              {filteredCurrencies.length === 0 && !loading && (
                <div className="text-center py-20">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No currencies found matching "{searchTerm}"</p>
                  <p className="text-gray-500">Try searching with a different name or ticker symbol</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#7f5efd] to-[#7c3aed] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7f5efd]/90 to-[#7c3aed]/90"></div>
        <div className="container-wide text-center relative">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to accept crypto payments?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start accepting any of these cryptocurrencies in minutes with our simple integration.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-white text-[#7f5efd] hover:bg-gray-50" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" asChild>
              <Link href="/#pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Logo variant="white" size="md" className="mb-4" />
              <p className="text-gray-400">
                Accept cryptocurrency payments with confidence
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            &copy; 2025 Cryptrac. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}