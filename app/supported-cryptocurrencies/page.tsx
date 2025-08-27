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

interface DeduplicatedCurrency {
  code: string;
  name: string;
  display_name: string;
  networks: string[];
  is_stablecoin: boolean;
  rate_usd?: number;
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
          // Sort currencies alphabetically by name
          const sortedCurrencies = data.currencies.sort((a: Currency, b: Currency) => 
            (a.display_name || a.name || a.code).localeCompare(b.display_name || b.name || b.code)
          );
          
          setCurrencies(sortedCurrencies);
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

  // Deduplicate currencies and group by networks
  const deduplicatedCurrencies = useMemo(() => {
    const currencyMap = new Map<string, DeduplicatedCurrency>();
    
    currencies.forEach(currency => {
      // Extract base code more reliably
      let baseCode = currency.code.toUpperCase();
      const originalCode = baseCode;
      
      // Special cases - don't modify these codes as they are actual currency symbols
      const doNotModify = [
        'DOT', 'ADA', 'XLM', 'ARB', 'OP', 'APT', 'NEAR', 'FTM', 'ONE', 'ROSE',
        // Add the 16 missing currencies that should not be deduplicated
        'CFXMAINNET', 'CROMAINNET', 'FTMMAINNET', 'INJMAINNET', 'MATICMAINNET', 
        'STRKMAINNET', 'BRGBSC', 'GALAERC20', 'INJERC20',
        // USD pair tokens that should remain separate
        'MATICUSDCE', 'OPUSDCE',
        // Stablecoins that should be allowed
        'BUSD', 'BUSDBSC', 'BUSDMATIC', 'PAX', 'TUSDTRC20'
      ];
      
      // Only process suffixes if not in the do-not-modify list
      if (!doNotModify.includes(baseCode)) {
        // Handle common network suffixes and variations
        if (baseCode.includes('BSC')) {
          baseCode = baseCode.replace('BSC', '');
        } else if (baseCode.includes('ERC20')) {
          baseCode = baseCode.replace('ERC20', '');
        } else if (baseCode.includes('MATIC')) {
          baseCode = baseCode.replace('MATIC', '');
        } else if (baseCode.includes('TRC20')) {
          baseCode = baseCode.replace('TRC20', '');
        } else if (baseCode.includes('BEP20')) {
          baseCode = baseCode.replace('BEP20', '');
        } else if (baseCode.includes('SOL')) {
          // Don't remove SOL as it's Solana
          if (baseCode !== 'SOL') {
            baseCode = baseCode.replace('SOL', '');
          }
        } else if (baseCode.includes('MAINNET')) {
          // Don't remove MAINNET suffix for certain tokens
          if (!['CFXMAINNET', 'CROMAINNET', 'FTMMAINNET', 'INJMAINNET', 'MATICMAINNET', 'STRKMAINNET'].includes(baseCode)) {
            baseCode = baseCode.replace('MAINNET', '');
          }
        }
      }
      
      // Clean up the base name
      const baseName = (currency.display_name || currency.name || currency.code)
        .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical network info
        .replace(/\s*\(Binance Smart Chain\)/g, '')
        .replace(/\s*\(ERC20\)/g, '')
        .replace(/\s*\(Polygon\)/g, '')
        .replace(/\s*\(C-Chain\)/g, '')
        .replace(/\s*Bridged/g, '') // Remove "Bridged" text
        .trim();
      
      // List of all cryptocurrencies to remove from the platform
      const blockedCurrencies = [
        'ZIL', 'ZENT', 'ZEN', 'ZEC', 'XZC', 'XYM', 'XVG', 'XEM', 'XEC', 'XCUR', 'XCAD', 'XAUT',
        'WINTRC20', 'WOLFERC20', 'WABI', 'VPS', 'VOLT', 'VIB', 'UST', 'USDSSOL', 'USDR', 'USDP',
        'USDJ', 'USDE', 'USDDTRC20', 'USDDBSC', 'TUSD', 'TUP', 'TTC', 'TRVL', 'TOMO', 'TLOSERC20',
        'TLOS', 'TKO', 'TFUEL', 'SYSEVM', 'SXPMAINNET', 'SUPER', 'SUNDOG', 'SUN', 'STZENT', 'STPT',
        'STKK', 'SRK', 'SPI', 'SOON', 'SNSY', 'SNEK', 'SIDUSERC20', 'SFUND', 'SCRAT', 'SAND',
        'RXCG', 'RJVERC20', 'RJVBSC', 'REP', 'RBIF', 'RAINCOIN', 'RACA', 'QUACK', 'QTUM', 'POOLZ',
        'POOLX', 'POODL', 'PONKE', 'PLX', 'PIVX', 'PIT', 'PIKA', 'PEW', 'PENG', 'PEIPEI', 'ONT',
        'ONIGI', 'OM', 'NWC', 'NTVRK', 'NPXS', 'NOW', 'NIKO', 'NFTB', 'NFAIERC20', 'NEVER', 'NETVR',
        'NEIROERC20', 'MX', 'MEW', 'MEMHASH', 'MCO', 'MARSH', 'MAJOR', 'LSK', 'LNQ', 'LINGO', 'LEASH',
        'LBPERC20', 'KLVMAINNET', 'KLV', 'KLAY', 'KISHU', 'KIBABSC', 'KIBA', 'KEANU', 'JST', 'IPMB',
        'IDBSC', 'ID', 'ICX', 'HT', 'HOTCROSS', 'HOT', 'HOGE', 'HMSTR', 'GUSD', 'GUARD', 'GT', 'GSPI',
        'GRS', 'GRAPE', 'GMXARB', 'GMX', 'GHC', 'GGTKN', 'GETH', 'GERC20', 'GBSC', 'GAS', 'GARI',
        'GAL', 'GAFA', 'FTN', 'FLUF', 'FITFI', 'FIRO', 'FEG', 'FDUSDERC20', 'FDUSDBSC', 'EURT', 'EURR',
        'ETHW', 'ETHLNA', 'EPIC', 'EOS', 'EGLDBSC', 'EGLD', 'DOGS', 'DOGECOIN', 'DIVI', 'DINO', 'DGMOON',
        'DGI', 'DGD', 'DGB', 'DCR', 'DAO', 'DAIARB', 'DADDY', 'CVC', 'CUSD', 'CULT', 'CUDOS', 'CTSI',
        'CNS', 'CHR', 'CGPTBSC', 'CGPT', 'CATSTON', 'CATI', 'C98', 'BTTCBSC', 'BTTC', 'BTG', 'BTFA',
        'BRISEMAINNET', 'BRISE', 'BONE', 'BOBA', 'BNBMAINNET', 'BLOCKS', 'BIFIERC20', 'BELBSC', 'BEL',
        'BEFI', 'BANANA', 'BAD', 'AWEBASE', 'AVN', 'AVA2ERC20', 'AVA2BSC', 'ATLAS', 'ARPABSC', 'ARPA',
        'APE', 'AITECH', 'AE'
      ];
      
      // Check if this currency should be blocked
      if (blockedCurrencies.includes(originalCode) || blockedCurrencies.includes(baseCode)) {
        return; // Skip this currency
      }
      
      if (currencyMap.has(baseCode)) {
        const existing = currencyMap.get(baseCode)!;
        if (currency.network && !existing.networks.includes(currency.network)) {
          existing.networks.push(currency.network);
        }
      } else {
        currencyMap.set(baseCode, {
          code: baseCode,
          name: baseName,
          display_name: baseName,
          networks: currency.network ? [currency.network] : [],
          is_stablecoin: currency.is_stablecoin || false,
          rate_usd: currency.rate_usd
        });
      }
    });
    
    return Array.from(currencyMap.values()).sort((a, b) => 
      a.display_name.localeCompare(b.display_name)
    );
  }, [currencies]);

  // Filter currencies based on search term
  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return deduplicatedCurrencies;
    
    const searchLower = searchTerm.toLowerCase();
    return deduplicatedCurrencies.filter(currency => 
      currency.display_name.toLowerCase().includes(searchLower) ||
      currency.code.toLowerCase().includes(searchLower)
    );
  }, [deduplicatedCurrencies, searchTerm]);

  // Separate stablecoins and regular currencies
  const stablecoins = filteredCurrencies.filter(c => c.is_stablecoin);
  const regularCurrencies = filteredCurrencies.filter(c => !c.is_stablecoin);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="/help" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Help
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
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

      {/* Hero Section with Background */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        {/* Minimal Geometric Line Background - Matching landing page */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none" aria-hidden="true">
          {/* Horizontal lines */}
          <div className="absolute top-[20%] left-0 right-0 h-px bg-[#7f5efd]/30"></div>
          <div className="absolute top-[40%] left-0 right-0 h-px bg-[#7f5efd]/25"></div>
          <div className="absolute top-[60%] left-0 right-0 h-px bg-[#7f5efd]/20"></div>
          <div className="absolute top-[80%] left-0 right-0 h-px bg-[#7f5efd]/25"></div>
          
          {/* Vertical lines */}
          <div className="absolute top-0 bottom-0 left-[15%] w-px bg-[#7f5efd]/20"></div>
          <div className="absolute top-0 bottom-0 left-[30%] w-px bg-[#7f5efd]/25"></div>
          <div className="absolute top-0 bottom-0 left-[45%] w-px bg-[#7f5efd]/18"></div>
          <div className="absolute top-0 bottom-0 left-[55%] w-px bg-[#7f5efd]/18"></div>
          <div className="absolute top-0 bottom-0 left-[70%] w-px bg-[#7f5efd]/25"></div>
          <div className="absolute top-0 bottom-0 left-[85%] w-px bg-[#7f5efd]/20"></div>
          
          {/* Diagonal accent lines */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
              {/* Main diagonal */}
              <line x1="0" y1="400" x2="1200" y2="200" stroke="#7f5efd" strokeWidth="0.5" opacity="0.4" />
              {/* Supporting diagonal */}
              <line x1="0" y1="600" x2="1200" y2="400" stroke="#7f5efd" strokeWidth="0.5" opacity="0.25" />
              {/* Counter diagonal */}
              <line x1="1200" y1="600" x2="0" y2="200" stroke="#7f5efd" strokeWidth="0.5" opacity="0.3" />
            </svg>
          </div>
          
          {/* Animated accent lines */}
          <div className="absolute top-[30%] left-0 w-32 h-px bg-gradient-to-r from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-right"></div>
          <div className="absolute top-[70%] right-0 w-32 h-px bg-gradient-to-l from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-left"></div>
          <div className="absolute left-[25%] top-0 h-32 w-px bg-gradient-to-b from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-down"></div>
          <div className="absolute right-[25%] bottom-0 h-32 w-px bg-gradient-to-t from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-up"></div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-24 h-24">
            <div className="absolute top-0 left-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute top-0 left-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24">
            <div className="absolute top-0 right-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute top-0 right-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24">
            <div className="absolute bottom-0 left-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute bottom-0 left-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24">
            <div className="absolute bottom-0 right-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute bottom-0 right-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
        </div>

        <div className="container-wide relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <Link href="/" className="inline-flex items-center text-[#7f5efd] hover:text-[#7c3aed] transition-colors mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
              All Supported <span className="text-[#7f5efd]">Cryptocurrencies</span>
            </h1>
            <p className="text-xl leading-8 text-gray-600 max-w-3xl mx-auto mb-10">
              Over <span className="font-semibold text-[#7f5efd]">300+ digital currencies</span> supported for instant, secure payments
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or ticker symbol..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:border-transparent text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Shield className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-medium">Non-Custodial</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Zap className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-medium">Instant Processing</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Globe className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-medium">Global Support</span>
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
                  Showing <span className="font-semibold text-[#7f5efd]">{filteredCurrencies.length}</span> unique cryptocurrencies
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
                            {currency.networks.length > 0 && (
                              <div className="text-xs text-[#7f5efd] mt-1">
                                {currency.networks.length > 1 ? `${currency.networks.length} networks` : currency.networks[0]}
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
                            {currency.networks.length > 0 && (
                              <div className="text-xs text-[#7f5efd] mt-1">
                                {currency.networks.length > 1 ? `${currency.networks.length} networks` : currency.networks[0]}
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