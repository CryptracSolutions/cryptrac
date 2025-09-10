"use client"

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Info,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  Shield,
  Coins,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { CryptoIcon } from '@/app/components/ui/crypto-icon';
import { isApprovedCurrency, getApprovedDisplayName } from '@/lib/approved-currencies';
import { requiresExtraId, validateExtraId, getExtraIdLabel, getExtraIdPlaceholder, getExtraIdDescription } from '@/lib/extra-id-validation';
import DestinationTagModal from '@/app/components/DestinationTagModal';

// Stable coin associations for automatic inclusion
const stableCoinAssociations: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD'],
  BNB: ['USDTBSC', 'USDCBSC'],
  BNBBSC: ['USDTBSC', 'USDCBSC', 'BUSDBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20', 'TUSDTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO'],
  AVAXC: ['USDCARC20', 'USDTARC20'],
  AVAX: ['USDCARC20', 'USDTARC20'],
};

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
};

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  network?: string;
  is_token?: boolean;
  parent_currency?: string;
  trust_wallet_compatible?: boolean;
  address_format?: string;
  enabled: boolean;
  min_amount: number;
  max_amount?: number;
  decimals: number;
  icon_url?: string;
  rate_usd?: number;
  display_name?: string;
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

interface WalletsManagerProps<T = Record<string, unknown>> {
  settings: T & {
    wallets: Record<string, string>;
    wallet_extra_ids?: Record<string, string>;
  };
  setSettings: React.Dispatch<React.SetStateAction<T & {
    wallets: Record<string, string>;
    wallet_extra_ids?: Record<string, string>;
  }>>;
  focusCurrency?: string;
  onValidationChange?: (currency: string, isValid: boolean) => void;
}

export default function WalletsManager<T = Record<string, unknown>>({ settings, setSettings, focusCurrency, onValidationChange }: WalletsManagerProps<T>) {
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});
  const [extraIdValidationStatus, setExtraIdValidationStatus] = useState<Record<string, ValidationStatus>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [expandedStableCoins, setExpandedStableCoins] = useState<Record<string, boolean>>({});
  const [hiddenAddresses, setHiddenAddresses] = useState<Record<string, boolean>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [copiedExtraId, setCopiedExtraId] = useState<string | null>(null);
  const [walletsExpanded, setWalletsExpanded] = useState(false);
  const [newlyAddedWallet, setNewlyAddedWallet] = useState<string | null>(null);
  const [showDestinationTagModal, setShowDestinationTagModal] = useState(false);
  const [modalCurrency, setModalCurrency] = useState<string>('');
  const [shownModals, setShownModals] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize validation status for all currencies
  useEffect(() => {
    const initialValidation: Record<string, ValidationStatus> = {};
    const initialHidden: Record<string, boolean> = {};
    const initialExtraIdValidation: Record<string, ValidationStatus> = {};

    // Initialize for existing wallets (do NOT auto-mark as valid)
    if (settings.wallets) {
      Object.keys(settings.wallets).forEach(currency => {
        if (settings.wallets[currency] && settings.wallets[currency].trim()) {
          // Default to idle; validation will be triggered on input change
          initialValidation[currency] = 'idle';
          initialHidden[currency] = true; // Start with addresses hidden
        } else {
          initialValidation[currency] = 'idle';
        }

        // Initialize extra ID validation for currencies that require it
        if (requiresExtraId(currency)) {
          const extra = settings.wallet_extra_ids?.[currency] || '';
          if (!extra) {
            initialExtraIdValidation[currency] = 'idle';
          } else if (validateExtraId(currency, extra)) {
            initialExtraIdValidation[currency] = 'valid';
          } else {
            initialExtraIdValidation[currency] = 'invalid';
          }
        }
      });
    }

    // Preserve any existing validation states to avoid flipping statuses
    setValidationStatus(prev => ({ ...initialValidation, ...prev }));
    setHiddenAddresses(prev => ({ ...initialHidden, ...prev }));
    setExtraIdValidationStatus(prev => ({ ...initialExtraIdValidation, ...prev }));
  }, [settings.wallets, settings.wallet_extra_ids]);

  // Handle focusCurrency prop to automatically focus and search for a currency
  useEffect(() => {
    if (focusCurrency) {
      // Set the search term to the currency code to filter the list
      setSearchTerm(focusCurrency.toLowerCase());

      // Focus the search input after a short delay to ensure the component has updated
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [focusCurrency]);

  // Load additional currencies
  useEffect(() => {
    const loadAdditionalCurrencies = async () => {
      try {
        setLoadingCurrencies(true);
        const response = await fetch('/api/nowpayments/currencies');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.currencies) {
            // Filter to only include approved currencies
            const approvedCurrencies = data.currencies.filter((currency: CurrencyInfo) => 
              isApprovedCurrency(currency.code)
            );
            
            // Update display names and sort alphabetically
            const processedCurrencies = approvedCurrencies.map((currency: CurrencyInfo) => ({
              ...currency,
              display_name: getApprovedDisplayName(currency.code)
            })).sort((a: CurrencyInfo, b: CurrencyInfo) => 
              (a.display_name || a.name || a.code).localeCompare(b.display_name || b.name || b.code)
            );
            
            setAdditionalCurrencies(processedCurrencies);
          
            // Initialize validation status for additional currencies
            setValidationStatus(prev => {
              const newStatus = { ...prev };
              processedCurrencies.forEach((currency: CurrencyInfo) => {
                if (!newStatus[currency.code]) {
                  // If an address exists, do not assume validity; start as idle
                  newStatus[currency.code] = 'idle';
                }
              });
              return newStatus;
            });

            // Initialize extra ID validation for additional currencies
            setExtraIdValidationStatus(prev => {
              const next = { ...prev } as Record<string, ValidationStatus>;
              processedCurrencies.forEach((currency: CurrencyInfo) => {
                if (requiresExtraId(currency.code)) {
                  const extra = settings.wallet_extra_ids?.[currency.code] || '';
                  if (!extra) {
                    next[currency.code] = next[currency.code] || 'idle';
                  } else if (validateExtraId(currency.code, extra)) {
                    next[currency.code] = 'valid';
                  } else {
                    next[currency.code] = 'invalid';
                  }
                }
              });
              return next;
            });
          }
        }
      } catch (error) {
        console.error('Failed to load additional currencies:', error);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    loadAdditionalCurrencies();
  }, [settings.wallets]);

  // Handle newly added wallet animation
  useEffect(() => {
    if (newlyAddedWallet) {
      // Auto-expand wallets section when a new wallet is added
      setWalletsExpanded(true);
      
      // Clear the animation after 3 seconds
      const timer = setTimeout(() => {
        setNewlyAddedWallet(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [newlyAddedWallet]);

  const getCurrencyDisplayName = (code: string) => {
    return CURRENCY_NAMES[code] || code;
  };

  const validateWalletAddress = async (currency: string, address: string) => {
    const trimmed = address.trim();
    if (!trimmed) {
      // No address entered yet
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      return;
    }

    // For currencies with optional extra IDs: mark extra ID validation state
    // but do not block address validation when it's missing.
    if (requiresExtraId(currency)) {
      const extra = (settings.wallet_extra_ids?.[currency] || '').trim();
      if (!extra) {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      } else if (!validateExtraId(currency, extra)) {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      }
    }

    setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }));
    if (requiresExtraId(currency)) {
      const extra = (settings.wallet_extra_ids?.[currency] || '').trim();
      if (extra) {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'checking' }));
      } else {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      }
    }

    try {
      interface ValidationPayload {
        currency: string;
        address: string;
        extra_id?: string;
      }
      
      const payload: ValidationPayload = {
        currency,
        address: trimmed
      };

      if (requiresExtraId(currency)) {
        payload.extra_id = (settings.wallet_extra_ids?.[currency] || '').trim();
      }

      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.validation && result.validation.valid) {
        setValidationStatus(prev => ({ ...prev, [currency]: 'valid' }));
        if (requiresExtraId(currency)) {
          const extra = (settings.wallet_extra_ids?.[currency] || '').trim();
          if (extra) setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'valid' }));
          else setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));

          // Show modal for XRP/XLM when wallet is validated and modal hasn't been shown yet
          const currenciesWithModal = ['XRP', 'XLM'];
          if (currenciesWithModal.includes(currency.toUpperCase()) && !shownModals.has(currency)) {
            setModalCurrency(currency);
            setShowDestinationTagModal(true);
            setShownModals(prev => new Set(Array.from(prev).concat(currency)));
          }
        }

        // Check if this is a new wallet being added
        const existingWallets = Object.keys(settings.wallets || {}).filter(curr =>
          settings.wallets[curr] && settings.wallets[curr].trim() && curr !== currency
        );
        if (!existingWallets.includes(currency)) {
          setNewlyAddedWallet(currency);
          setHiddenAddresses(prev => ({ ...prev, [currency]: true }));
        }
        onValidationChange?.(currency, true);
      } else {
        setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
        if (requiresExtraId(currency)) {
          const extra = (settings.wallet_extra_ids?.[currency] || '').trim();
          if (extra) setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
          else setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
        }
        onValidationChange?.(currency, false);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
    }
  };

  const handleWalletInputChange = async (currency: string, address: string) => {
    const prevAddress = settings.wallets?.[currency] || '';
    const wasEmpty = !prevAddress.trim();
    const nowNonEmpty = !!address.trim();

    setSettings(prev => ({ ...prev, wallets: { ...prev.wallets, [currency]: address } }));

    // Auto-open Your Wallets and highlight the newly added currency when
    // a wallet address transitions from empty -> non-empty
    if (wasEmpty && nowNonEmpty) {
      setWalletsExpanded(true);
      setNewlyAddedWallet(currency);
    }
    
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      // Clearing the address should remove any prior invalid flag for this currency
      onValidationChange?.(currency, true);
      return;
    }

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateWalletAddress(currency, address);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const removeWallet = (currency: string) => {
    setSettings(prev => {
      const newWallets = { ...prev.wallets };
      delete newWallets[currency];
      const newExtraIds = { ...prev.wallet_extra_ids };
      delete newExtraIds[currency];
      return { ...prev, wallets: newWallets, wallet_extra_ids: newExtraIds };
    });

    setValidationStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[currency];
      return newStatus;
    });

    setExtraIdValidationStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[currency];
      return newStatus;
    });

    setHiddenAddresses(prev => {
      const newHidden = { ...prev };
      delete newHidden[currency];
      return newHidden;
    });

    // Removing a wallet should clear any invalid state for this currency in the parent
    onValidationChange?.(currency, true);
  };

  const handleExtraIdInputChange = (currency: string, extraId: string) => {
    setSettings(prev => ({
      ...prev,
      wallet_extra_ids: {
        ...prev.wallet_extra_ids,
        [currency]: extraId
      }
    }));

    // Validate extra ID format and re-run address validation when appropriate
    if (requiresExtraId(currency)) {
      const trimmed = extraId.trim();
      if (!trimmed) {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
        setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
        return;
      }

      if (validateExtraId(currency, trimmed)) {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'valid' }));
        const addr = settings.wallets[currency] || '';
        if (addr && addr.trim()) {
          // Re-validate the wallet address now that extra ID is valid
          validateWalletAddress(currency, addr);
        }
      } else {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
        setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      }
    }
  };

  const getValidationIcon = (currency: string) => {
    const status = validationStatus[currency] || 'idle';
    
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = (currency: string) => {
    const status = validationStatus[currency] || 'idle';
    
    switch (status) {
      case 'valid':
        return 'Valid address';
      case 'invalid':
        return 'Invalid address';
      case 'checking':
        return 'Checking...';
      default:
        return '';
    }
  };

  const toggleAddressVisibility = (currency: string) => {
    setHiddenAddresses(prev => ({
      ...prev,
      [currency]: !prev[currency]
    }));
  };

  const copyToClipboard = async (text: string, currency: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(currency);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };


  const handleWalletCardClick = (currency: string, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Don't toggle if clicking on interactive elements
    if (target.closest('button') || target.closest('input')) {
      return;
    }
    
    // If clicking on a currency with stable coins, toggle them
    if (hasStableCoins(currency)) {
      event.stopPropagation();
      toggleStableCoins(currency);
    }
  };

  // Get existing wallets
  const existingWallets = Object.keys(settings.wallets || {})
    .filter(currency => settings.wallets[currency] && settings.wallets[currency].trim())
    .filter(currency => isApprovedCurrency(currency));

  const filteredCurrencies = additionalCurrencies.filter(currency => {
    // First check if currency is approved
    if (!isApprovedCurrency(currency.code)) {
      return false;
    }
    
    // Check if this currency already has a wallet configured
    const hasExistingWallet = existingWallets.includes(currency.code);
    
    // Include if approved, doesn't have existing wallet, and matches search term
    // Note: We do NOT filter out stablecoins - users should be able to add any approved currency
    return !hasExistingWallet && (
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const hasExistingWallets = existingWallets.length > 0;

  const toggleStableCoins = (currency: string) => {
    setExpandedStableCoins(prev => ({
      ...prev,
      [currency]: !prev[currency]
    }));
  };

  const hasStableCoins = (currency: string) => {
    return stableCoinAssociations[currency] && stableCoinAssociations[currency].length > 0;
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Smart Setup Info */}
      <Alert className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Info className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <AlertDescription className="text-purple-800">
              <div className="font-semibold mb-1">Smart Wallet Setup</div>
              <p className="text-sm leading-relaxed">
                Add a base cryptocurrency wallet and automatically support its stable coins.
                Click on wallets with stable coins to see what&apos;s included!
              </p>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Enhanced Configured Wallets Section - Collapsible */}
      {hasExistingWallets && (
        <Card 
          className="border-gray-200 shadow-medium hover:shadow-large transition-all duration-200"
          onClick={(e) => {
            // Only collapse if clicking on the card background
            if (e.target === e.currentTarget) {
              setWalletsExpanded(!walletsExpanded);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <CardHeader 
            className="pb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-[#7f5efd]/10 to-[#7c3aed]/10 rounded-lg shadow-soft">
                  <Wallet className="h-6 w-6 text-[#7f5efd]" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Your Wallets
                    <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                      {existingWallets.length}
                    </div>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    {walletsExpanded ? 'Click to collapse' : 'Click to view and manage your wallets'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Secured</span>
                </div>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${walletsExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </CardHeader>
          
          {walletsExpanded && (
            <CardContent>
              <div className="grid gap-4">
                {existingWallets.map((currency) => (
                  <Card 
                    key={currency} 
                    className={`bg-white border-gray-200 shadow-soft hover:shadow-medium hover:border-purple-300 transition-all duration-200 ${hasStableCoins(currency) ? 'cursor-pointer' : ''} ${
                      newlyAddedWallet === currency ? 'ring-2 ring-purple-500 ring-opacity-50 animate-pulse' : ''
                    }`}
                    onClick={(e) => handleWalletCardClick(currency, e)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <CryptoIcon currency={currency} className="h-12 w-12" />
                            <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            {newlyAddedWallet === currency && (
                              <div className="absolute -top-1 -right-1 p-1 bg-purple-500 rounded-full animate-pulse">
                                <Star className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                              {getCurrencyDisplayName(currency)}
                              {newlyAddedWallet === currency && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium animate-pulse">
                                  Added!
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 font-medium">{currency}</div>
                            {hasStableCoins(currency) && (
                              <div className="flex items-center gap-1 mt-1">
                                <Coins className="h-3 w-3 text-purple-500" />
                                <span className="text-xs text-purple-600 font-medium">
                                  +{stableCoinAssociations[currency].length} stablecoins
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasStableCoins(currency) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStableCoins(currency);
                              }}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                            >
                              {expandedStableCoins[currency] ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeWallet(currency);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            placeholder={`${getCurrencyDisplayName(currency)} wallet address`}
                            value={settings.wallets[currency] || ''}
                            onChange={(e) => handleWalletInputChange(currency, e.target.value)}
                            className={`border-gray-300 bg-white pr-20 font-mono text-sm ${
                              requiresExtraId(currency) && validationStatus[currency] === 'invalid' ? 'border-red-300 focus-visible:ring-red-300' : ''
                            }`}
                            type={hiddenAddresses[currency] ? "password" : "text"}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAddressVisibility(currency);
                              }}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              {hiddenAddresses[currency] ? 
                                <Eye className="h-4 w-4 text-gray-500" /> : 
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(settings.wallets[currency] || '', currency);
                              }}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              {copiedAddress === currency ? 
                                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                <Copy className="h-4 w-4 text-gray-500" />
                              }
                            </Button>
                          </div>
                        </div>
                        
                        {/* Extra ID input for currencies that require it */}
                        {requiresExtraId(currency) && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">
                              {getExtraIdLabel(currency)} (if required by your wallet)
                            </label>
                            <div className="relative">
                              <Input
                                placeholder={getExtraIdPlaceholder(currency)}
                                value={settings.wallet_extra_ids?.[currency] || ''}
                                onChange={(e) => handleExtraIdInputChange(currency, e.target.value)}
                                className={`border-gray-300 bg-white pr-12 font-mono text-sm ${
                                  extraIdValidationStatus[currency] === 'idle' || extraIdValidationStatus[currency] === 'checking' ? 'border-[#7f5efd] focus-visible:ring-[#7f5efd]' : ''
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const extraId = settings.wallet_extra_ids?.[currency];
                                    if (extraId) {
                                      navigator.clipboard.writeText(extraId);
                                      setCopiedExtraId(currency);
                                      setTimeout(() => setCopiedExtraId(null), 2000);
                                    }
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  {copiedExtraId === currency ?
                                    <CheckCircle className="h-4 w-4 text-green-500" /> :
                                    <Copy className="h-4 w-4 text-gray-500" />
                                  }
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {getExtraIdDescription(currency)}
                            </p>
                            {extraIdValidationStatus[currency] && extraIdValidationStatus[currency] !== 'idle' && (
                              <div className="flex items-center gap-2 text-sm">
                                {extraIdValidationStatus[currency] === 'valid' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : extraIdValidationStatus[currency] === 'invalid' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                                )}
                                <span className={`font-medium ${
                                  extraIdValidationStatus[currency] === 'valid' ? 'text-green-600' :
                                  extraIdValidationStatus[currency] === 'invalid' ? 'text-red-600' :
                                  'text-purple-600'
                                }`}>
                                  {extraIdValidationStatus[currency] === 'valid' ? `Valid ${getExtraIdLabel(currency).toLowerCase()}` :
                                   extraIdValidationStatus[currency] === 'invalid' ? `Invalid ${getExtraIdLabel(currency).toLowerCase()} format` :
                                   `Checking ${getExtraIdLabel(currency).toLowerCase()}...`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getValidationIcon(currency)}
                            <span className={`text-sm font-medium ${
                              validationStatus[currency] === 'valid' ? 'text-green-600' :
                              validationStatus[currency] === 'invalid' ? 'text-red-600' :
                              validationStatus[currency] === 'checking' ? 'text-purple-600' :
                              'text-gray-600'
                            }`}>
                              {getValidationMessage(currency)}
                            </span>
                          </div>
                          {validationStatus[currency] === 'valid' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                              <Star className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced stable coins display */}
                      {expandedStableCoins[currency] && hasStableCoins(currency) && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Coins className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-bold text-purple-800">
                              Supported Stablecoins
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stableCoinAssociations[currency].map((code) => (
                              <div key={code} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 shadow-soft">
                                <CryptoIcon currency={code} className="h-8 w-8" />
                                <div>
                                  <div className="text-sm font-semibold text-purple-900">{getCurrencyDisplayName(code)}</div>
                                  <div className="text-xs text-purple-600">{code}</div>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Enhanced Add New Wallet Section */}
      <Card className="border-gray-200 shadow-medium hover:shadow-large transition-all duration-200">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#7f5efd]/10 to-[#7c3aed]/10 rounded-lg shadow-soft">
              <Plus className="h-6 w-6 text-[#7f5efd]" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Add New Wallet
              </CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                Search and configure cryptocurrency wallets
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              ref={searchInputRef}
              placeholder="Search cryptocurrencies (e.g., Bitcoin, Ethereum, Solana...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-base border-gray-200 focus:border-purple-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-purple-500 rounded-lg"
            />
          </div>
          
          {loadingCurrencies ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 rounded-lg inline-block">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 font-medium">Loading currencies...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {filteredCurrencies.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-50 rounded-lg inline-block">
                    <Search className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">
                      {searchTerm ? 'No cryptocurrencies found' : 'Start typing to search currencies'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredCurrencies.map((currency) => (
                  <Card key={currency.code} className="border border-gray-200 hover:border-purple-300 hover:shadow-medium transition-all duration-200 card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <CryptoIcon currency={currency.code} className="h-10 w-10" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm uppercase bg-gray-100 px-2 py-0.5 rounded">{currency.code}</span>
                              <span className="font-semibold text-gray-900">{currency.display_name || currency.name}</span>
                            </div>
                            <div className="text-sm text-gray-500">{currency.network}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getValidationIcon(currency.code)}
                          {settings.wallets[currency.code] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWallet(currency.code)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          placeholder={`Enter ${currency.display_name || currency.name} wallet address`
                          }
                          value={settings.wallets[currency.code] || ''}
                          onChange={(e) => handleWalletInputChange(currency.code, e.target.value)}
                          className={`font-mono text-sm ${
                            requiresExtraId(currency.code) && validationStatus[currency.code] === 'invalid' ? 'border-red-300 focus-visible:ring-red-300' : ''
                          }`}
                        />
                        
                        {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
                          <div className="flex items-center gap-2 text-sm">
                            {getValidationIcon(currency.code)}
                            <span className={`font-medium ${
                              validationStatus[currency.code] === 'valid' ? 'text-green-600' :
                              validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                              'text-purple-600'
                            }`}>
                              {getValidationMessage(currency.code)}
                            </span>
                          </div>
                        )}
                        
                        {/* Extra ID input for currencies that require it */}
                        {requiresExtraId(currency.code) && (
                          <>
                            <label className="text-xs font-medium text-gray-700">
                              {getExtraIdLabel(currency.code)} (if required by your wallet)
                            </label>
                            <div className="relative">
                              <Input
                                placeholder={getExtraIdPlaceholder(currency.code)}
                                value={settings.wallet_extra_ids?.[currency.code] || ''}
                                onChange={(e) => handleExtraIdInputChange(currency.code, e.target.value)}
                                className={`pr-12 font-mono text-sm ${
                                  extraIdValidationStatus[currency.code] === 'idle' || extraIdValidationStatus[currency.code] === 'checking' ? 'border-[#7f5efd] focus-visible:ring-[#7f5efd]' : ''
                                }`}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const extraId = settings.wallet_extra_ids?.[currency.code];
                                    if (extraId) {
                                      navigator.clipboard.writeText(extraId);
                                      setCopiedExtraId(currency.code);
                                      setTimeout(() => setCopiedExtraId(null), 2000);
                                    }
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  {copiedExtraId === currency.code ?
                                    <CheckCircle className="h-4 w-4 text-green-500" /> :
                                    <Copy className="h-4 w-4 text-gray-500" />
                                  }
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {getExtraIdDescription(currency.code)}
                            </p>
                            {extraIdValidationStatus[currency.code] && extraIdValidationStatus[currency.code] !== 'idle' && (
                              <div className="flex items-center gap-2 text-sm">
                                {extraIdValidationStatus[currency.code] === 'valid' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : extraIdValidationStatus[currency.code] === 'invalid' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                                )}
                                <span className={`font-medium ${
                                  extraIdValidationStatus[currency.code] === 'valid' ? 'text-green-600' :
                                  extraIdValidationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                                  'text-purple-600'
                                }`}>
                                  {extraIdValidationStatus[currency.code] === 'valid' ? `Valid ${getExtraIdLabel(currency.code).toLowerCase()}` :
                                   extraIdValidationStatus[currency.code] === 'invalid' ? `Invalid ${getExtraIdLabel(currency.code).toLowerCase()} format` :
                                   `Checking ${getExtraIdLabel(currency.code).toLowerCase()}...`}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destination Tag Modal */}
      {showDestinationTagModal && (
        <DestinationTagModal
          isOpen={showDestinationTagModal}
          onClose={() => setShowDestinationTagModal(false)}
          currency={modalCurrency}
        />
      )}
    </div>
  );
}
