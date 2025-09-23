"use client"

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
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
  X,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
// Removed Smart Wallet Setup alert
import { CryptoIcon } from '@/app/components/ui/crypto-icon';
import { isApprovedCurrency, getApprovedDisplayName } from '@/lib/approved-currencies';
import { requiresExtraId, validateExtraId, getExtraIdLabel, getExtraIdPlaceholder, getExtraIdDescription } from '@/lib/extra-id-validation';
import DestinationTagModal from '@/app/components/DestinationTagModal';
import { useIsMobile } from '@/lib/hooks/use-mobile';

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
  const [pendingHighlight, setPendingHighlight] = useState<string | null>(null);
  const [draftWallets, setDraftWallets] = useState<Record<string, string>>({});
  const [draftExtraIds, setDraftExtraIds] = useState<Record<string, string>>({});
  const [pendingWallets, setPendingWallets] = useState<Record<string, boolean>>({});
  const [showDestinationTagModal, setShowDestinationTagModal] = useState(false);
  const [modalCurrency, setModalCurrency] = useState<string>('');
  const [shownModals, setShownModals] = useState<Set<string>>(new Set());
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const validationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isMobileViewport = useIsMobile();

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

      if (isMobileViewport) {
        setIsMobileSearchOpen(true);
      }

      // Focus the search input after a short delay to ensure the component has updated
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [focusCurrency, isMobileViewport]);

  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const timeout = window.setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isMobileSearchOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSearchOpen]);

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
  }, [settings.wallets, settings.wallet_extra_ids]);

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

  useEffect(() => {
    const timers = validationTimers.current;
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!pendingHighlight) return;
    const timer = setTimeout(() => setPendingHighlight(null), 2000);
    return () => clearTimeout(timer);
  }, [pendingHighlight]);

  const getCurrencyDisplayName = (code: string) => {
    return CURRENCY_NAMES[code] || code;
  };

  const validateWalletAddress = async (
    currency: string,
    address: string,
    extraId?: string,
    options: { source: 'existing' | 'draft' } = { source: 'existing' }
  ) => {
    const trimmedAddress = address.trim();
    const trimmedExtra = extraId?.trim() ?? '';

    if (!trimmedAddress) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      if (requiresExtraId(currency)) {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: trimmedExtra ? prev[currency] ?? 'idle' : 'idle' }));
      }
      if (options.source === 'draft') {
        setPendingWallets(prev => {
          const next = { ...prev };
          delete next[currency];
          return next;
        });
        if (pendingHighlight === currency) {
          setPendingHighlight(null);
        }
      }
      onValidationChange?.(currency, true);
      return;
    }

    setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }));

    if (requiresExtraId(currency)) {
      if (trimmedExtra) {
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
        address: trimmedAddress,
      };

      if (requiresExtraId(currency) && trimmedExtra) {
        payload.extra_id = trimmedExtra;
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
          if (trimmedExtra) {
            setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'valid' }));
          } else {
            setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
          }

          const currenciesWithModal = ['XRP', 'XLM'];
          if (currenciesWithModal.includes(currency.toUpperCase()) && !shownModals.has(currency)) {
            setModalCurrency(currency);
            setShowDestinationTagModal(true);
            setShownModals(prev => new Set(Array.from(prev).concat(currency)));
          }
        }

        if (options.source === 'draft') {
          setPendingWallets(prev => ({ ...prev, [currency]: true }));
          setPendingHighlight(currency);
        } else {
          setHiddenAddresses(prev => ({ ...prev, [currency]: true }));
          setNewlyAddedWallet(currency);
        }

        onValidationChange?.(currency, true);
      } else {
        setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
        if (requiresExtraId(currency)) {
          if (trimmedExtra) {
            setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
          } else {
            setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
          }
        }

        if (options.source === 'draft') {
          setPendingWallets(prev => ({ ...prev, [currency]: true }));
        }

        onValidationChange?.(currency, false);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      if (options.source === 'draft') {
        setPendingWallets(prev => ({ ...prev, [currency]: true }));
      }
    }
  };

  const handleWalletInputChange = (currency: string, address: string) => {
    const trimmed = address.trim();
    const existingAddress = settings.wallets?.[currency] || '';
    const isExistingWallet = !!existingAddress.trim();

    if (isExistingWallet) {
      setSettings(prev => ({ ...prev, wallets: { ...prev.wallets, [currency]: address } }));
    } else {
      setDraftWallets(prev => {
        const next = { ...prev };
        if (trimmed) {
          next[currency] = address;
        } else {
          delete next[currency];
        }
        return next;
      });

      if (!trimmed) {
        setPendingWallets(prev => {
          const next = { ...prev };
          delete next[currency];
          return next;
        });
        if (pendingHighlight === currency) {
          setPendingHighlight(null);
        }
        setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
        return;
      }

      setPendingWallets(prev => ({ ...prev, [currency]: true }));
      setPendingHighlight(currency);
    }

    if (!trimmed) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      if (requiresExtraId(currency)) {
        setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      }
      onValidationChange?.(currency, true);
      return;
    }

    if (validationTimers.current[currency]) {
      clearTimeout(validationTimers.current[currency]);
    }

    const extra = isExistingWallet
      ? settings.wallet_extra_ids?.[currency] || ''
      : draftExtraIds[currency] || '';

    validationTimers.current[currency] = setTimeout(() => {
      validateWalletAddress(currency, address, extra, { source: isExistingWallet ? 'existing' : 'draft' });
    }, 500);
  };

  const removeWallet = (currency: string) => {
    setSettings(prev => {
      const newWallets = { ...prev.wallets };
      delete newWallets[currency];
      const newExtraIds = { ...prev.wallet_extra_ids };
      delete newExtraIds[currency];
      return { ...prev, wallets: newWallets, wallet_extra_ids: newExtraIds };
    });

    setDraftWallets(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    setDraftExtraIds(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    setPendingWallets(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    if (validationTimers.current[currency]) {
      clearTimeout(validationTimers.current[currency]);
      delete validationTimers.current[currency];
    }

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
    const trimmed = extraId.trim();
    const existingAddress = settings.wallets?.[currency] || '';
    const isExistingWallet = !!existingAddress.trim();

    if (isExistingWallet) {
      setSettings(prev => ({
        ...prev,
        wallet_extra_ids: {
          ...prev.wallet_extra_ids,
          [currency]: extraId,
        },
      }));
    } else {
      setDraftExtraIds(prev => {
        const next = { ...prev };
        if (trimmed) {
          next[currency] = extraId;
        } else {
          delete next[currency];
        }
        return next;
      });

      setPendingWallets(prev => ({ ...prev, [currency]: true }));
    }

    if (!requiresExtraId(currency)) return;

    if (!trimmed) {
      setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
      return;
    }

    if (validateExtraId(currency, trimmed)) {
      setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'valid' }));
      const address = isExistingWallet ? existingAddress : draftWallets[currency] || '';
      if (address.trim()) {
        if (validationTimers.current[currency]) {
          clearTimeout(validationTimers.current[currency]);
        }
        validationTimers.current[currency] = setTimeout(() => {
          validateWalletAddress(currency, address, extraId, { source: isExistingWallet ? 'existing' : 'draft' });
        }, 300);
      }
    } else {
      setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
    }
  };

  const handleRemovePendingWallet = (currency: string) => {
    setDraftWallets(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    setDraftExtraIds(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    setPendingWallets(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
    setExtraIdValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));

    if (validationTimers.current[currency]) {
      clearTimeout(validationTimers.current[currency]);
      delete validationTimers.current[currency];
    }

    if (pendingHighlight === currency) {
      setPendingHighlight(null);
    }

    onValidationChange?.(currency, true);
  };

  const handleConfirmPendingWallet = (currency: string, options?: { addAnother?: boolean }) => {
    const address = (draftWallets[currency] || '').trim();
    if (!address) return;

    const extra = (draftExtraIds[currency] || '').trim();

    setSettings(prev => {
      const nextWallets = { ...prev.wallets, [currency]: address };
      const nextExtraIds = { ...prev.wallet_extra_ids };
      if (extra) {
        nextExtraIds[currency] = extra;
      } else {
        delete nextExtraIds[currency];
      }

      return {
        ...prev,
        wallets: nextWallets,
        wallet_extra_ids: nextExtraIds,
      };
    });

    setDraftWallets(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    setDraftExtraIds(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    setPendingWallets(prev => {
      const next = { ...prev };
      delete next[currency];
      return next;
    });

    if (validationTimers.current[currency]) {
      clearTimeout(validationTimers.current[currency]);
      delete validationTimers.current[currency];
    }

    setPendingHighlight(null);
    setNewlyAddedWallet(currency);
    setWalletsExpanded(true);
    setHiddenAddresses(prev => ({ ...prev, [currency]: true }));

    onValidationChange?.(currency, true);

    if (options?.addAnother) {
      setSearchTerm('');
      if (isMobileViewport) {
        setIsMobileSearchOpen(true);
      } else {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 120);
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
    if (!isApprovedCurrency(currency.code)) {
      return false;
    }

    const hasExistingWallet = existingWallets.includes(currency.code);
    const hasPendingWallet = !!pendingWallets[currency.code];

    if (hasExistingWallet && !hasPendingWallet) {
      return false;
    }

    if (hasPendingWallet) {
      return true;
    }

    const codeMatch = currency.code.toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = currency.name.toLowerCase().includes(searchTerm.toLowerCase());
    const displayMatch = currency.display_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return codeMatch || nameMatch || displayMatch;
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

  const currencyResults = loadingCurrencies ? (
    <div className="text-center py-12">
      <div className="p-4 bg-gray-50 rounded-lg inline-block">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-600 font-medium">Loading currencies...</p>
      </div>
    </div>
  ) : filteredCurrencies.length === 0 ? (
    <div className="text-center py-8">
      <div className="p-4 bg-gray-50 rounded-lg inline-block">
        <Search className="h-8 w-8 mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-600 font-medium">
          {searchTerm ? 'No cryptocurrencies found' : 'Start typing to search currencies'}
        </p>
      </div>
    </div>
  ) : (
    filteredCurrencies.map((currency) => {
      const isPending = !!pendingWallets[currency.code];
      const addressValue = isPending
        ? draftWallets[currency.code] ?? ''
        : settings.wallets[currency.code] ?? '';
      const extraValue = isPending
        ? draftExtraIds[currency.code] ?? ''
        : settings.wallet_extra_ids?.[currency.code] ?? '';
      const status = validationStatus[currency.code] || 'idle';
      const extraStatus = extraIdValidationStatus[currency.code] || 'idle';
      const canConfirm = isPending && status === 'valid' && (!requiresExtraId(currency.code) || extraStatus === 'valid');
      const confirmDisabled = !canConfirm;

      return (
        <Card
          key={currency.code}
          className={`border border-gray-200 hover:border-purple-300 hover:shadow-medium transition-all duration-200 card-hover ${
            pendingHighlight === currency.code ? 'ring-2 ring-purple-400 ring-offset-2 animate-pulse' : ''
          }`}
        >
          <CardContent className="p-4 space-y-3 max-md:p-4 max-md:space-y-4">
            <div className="flex items-center justify-between mb-3 max-md:flex-col max-md:items-start max-md:gap-3">
              <div className="flex items-center gap-3 max-md:flex-col max-md:items-start max-md:gap-2">
                <CryptoIcon currency={currency.code} className="h-10 w-10" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm uppercase bg-gray-100 px-2 py-0.5 rounded">
                      {currency.code}
                    </span>
                    <span className="font-semibold text-gray-900">{currency.display_name || currency.name}</span>
                  </div>
                  <div className="text-sm text-gray-500 max-md:text-xs">{currency.network}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 max-md:w-full max-md:justify-between max-md:flex-wrap">
                <div className="flex items-center gap-2">
                  {getValidationIcon(currency.code)}
                  {status !== 'idle' && (
                    <span
                      className={`text-sm font-medium ${
                        status === 'valid'
                          ? 'text-green-600'
                          : status === 'invalid'
                          ? 'text-red-600'
                          : 'text-purple-600'
                      }`}
                    >
                      {getValidationMessage(currency.code)}
                    </span>
                  )}
                </div>
                {(isPending || settings.wallets[currency.code]) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (isPending ? handleRemovePendingWallet(currency.code) : removeWallet(currency.code))}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg mobile-touch-button max-md:h-12 max-md:w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder={`Enter ${currency.display_name || currency.name} wallet address`}
                value={addressValue}
                onChange={(e) => handleWalletInputChange(currency.code, e.target.value)}
                className={`font-mono text-sm h-12 border-gray-200 focus:border-[#7f5efd] focus-visible:ring-[#7f5efd]/20 max-md:text-base max-md:h-12 ${
                  requiresExtraId(currency.code) && status === 'invalid'
                    ? 'border-red-300 focus-visible:ring-red-300'
                    : ''
                }`}
              />

              {/* Extra ID input for currencies that require it */}
              {requiresExtraId(currency.code) && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 max-md:text-sm">
                    {getExtraIdLabel(currency.code)} (if required by your wallet)
                  </label>
                  <div className="relative">
                    <Input
                      placeholder={getExtraIdPlaceholder(currency.code)}
                      value={extraValue}
                      onChange={(e) => handleExtraIdInputChange(currency.code, e.target.value)}
                      className={`pr-12 font-mono text-sm h-12 border-gray-200 focus:border-[#7f5efd] focus-visible:ring-[#7f5efd]/20 max-md:text-base max-md:h-12 max-md:pr-4 ${
                        extraStatus === 'idle' || extraStatus === 'checking'
                          ? 'border-[#7f5efd] focus-visible:ring-[#7f5efd]'
                          : ''
                      }`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 max-md:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!extraValue.trim()) return;
                          navigator.clipboard.writeText(extraValue);
                          setCopiedExtraId(currency.code);
                          setTimeout(() => setCopiedExtraId(null), 2000);
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        {copiedExtraId === currency.code ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="hidden max-md:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!extraValue.trim()) return;
                        navigator.clipboard.writeText(extraValue);
                        setCopiedExtraId(currency.code);
                        setTimeout(() => setCopiedExtraId(null), 2000);
                      }}
                      className="mobile-touch-button max-md:h-12 max-md:flex-1 border-gray-200"
                    >
                      {copiedExtraId === currency.code ? 'Copied' : 'Copy Extra ID'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 max-md:text-xs">
                    {getExtraIdDescription(currency.code)}
                  </p>
                  {extraStatus !== 'idle' && (
                    <div className="flex items-center gap-2 text-sm max-md:text-xs">
                      {extraStatus === 'valid' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : extraStatus === 'invalid' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                      )}
                      <span
                        className={`font-medium ${
                          extraStatus === 'valid'
                            ? 'text-green-600'
                            : extraStatus === 'invalid'
                            ? 'text-red-600'
                            : 'text-purple-600'
                        }`}
                      >
                        {extraStatus === 'valid'
                          ? `Valid ${getExtraIdLabel(currency.code).toLowerCase()}`
                          : extraStatus === 'invalid'
                          ? `Invalid ${getExtraIdLabel(currency.code).toLowerCase()} format`
                          : `Checking ${getExtraIdLabel(currency.code).toLowerCase()}...`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {addressValue && (
                <>
                  <div className="hidden max-md:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!addressValue.trim()) return;
                        copyToClipboard(addressValue, currency.code);
                      }}
                      className="mobile-touch-button max-md:h-12 flex-1 border-gray-200"
                    >
                      {copiedAddress === currency.code ? 'Copied' : 'Copy address'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 max-md:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!addressValue.trim()) return;
                        copyToClipboard(addressValue, currency.code);
                      }}
                      className="mobile-touch-button max-md:h-12 border-gray-200"
                    >
                      {copiedAddress === currency.code ? 'Copied' : 'Copy address'}
                    </Button>
                  </div>
                </>
              )}

              {isPending && (
                <div className={`space-y-3 rounded-lg border p-4 ${
                  canConfirm
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <p className={`text-sm font-medium ${canConfirm ? 'text-green-800' : 'text-yellow-800'}`}>
                    {canConfirm
                      ? 'Address validated. Move it to your wallets?'
                      : requiresExtraId(currency.code)
                      ? 'Add the required extra ID to finish validation.'
                      : 'Complete the address validation to continue.'}
                  </p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <Button
                      onClick={() => handleConfirmPendingWallet(currency.code)}
                      className="mobile-touch-button max-md:h-12 bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300 disabled:text-white"
                      disabled={confirmDisabled}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleConfirmPendingWallet(currency.code, { addAnother: true })}
                      className="mobile-touch-button max-md:h-12 border-gray-200 disabled:opacity-60"
                      disabled={confirmDisabled}
                    >
                      Add another wallet
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleRemovePendingWallet(currency.code)}
                      className="mobile-touch-button max-md:h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    })
  );

  return (
    <div className="space-y-8">
      {/* Smart Wallet Setup card removed as requested */}

      {/* Enhanced Configured Wallets Section - Collapsible */}
      {hasExistingWallets && (
        <Card
          className="border-gray-200 shadow-medium hover:shadow-large transition-all duration-200"
          onClick={(e) => {
            // Allow clicks within the header area to expand/collapse
            const target = e.target as HTMLElement;
            const isClickingOnHeader = target.closest('.card-header') || e.target === e.currentTarget;
            const isClickingOnButton = target.closest('button');

            if (isClickingOnHeader && !isClickingOnButton) {
              setWalletsExpanded(!walletsExpanded);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <CardHeader
            className="pb-6 card-header max-md:p-4 max-md:pb-4"
          >
            <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-4">
              <div className="flex items-center gap-4 max-md:flex-col max-md:items-start max-md:gap-3">
                <div className="p-3 bg-gradient-to-br from-[#7f5efd]/10 to-[#7c3aed]/10 rounded-lg shadow-soft">
                  <Wallet className="h-6 w-6 text-[#7f5efd]" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2 max-md:flex-wrap">
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
              <div className="flex items-center gap-3 max-md:w-full max-md:justify-between max-md:pt-2">
                <div className="flex items-center gap-2 max-md:w-full max-md:justify-start">
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
                    <CardContent className="p-6 max-md:p-4 max-md:space-y-4">
                      <div className="flex items-center justify-between mb-4 max-md:flex-col max-md:items-start max-md:gap-4">
                        <div className="flex items-center gap-4 max-md:flex-col max-md:items-start max-md:gap-3">
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
                        <div className="flex items-center gap-2 max-md:w-full max-md:justify-start max-md:flex-wrap">
                          {hasStableCoins(currency) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStableCoins(currency);
                              }}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg mobile-touch-button max-md:h-12 max-md:flex-1 max-md:w-full"
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg mobile-touch-button max-md:h-12 max-md:flex-1 max-md:w-full"
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
                            className={`border-gray-300 bg-white pr-20 font-mono text-sm h-12 focus:border-[#7f5efd] focus-visible:ring-[#7f5efd]/20 max-md:text-base max-md:h-12 max-md:pr-4 ${
                              requiresExtraId(currency) && validationStatus[currency] === 'invalid' ? 'border-red-300 focus-visible:ring-red-300' : ''
                            }`}
                            type={hiddenAddresses[currency] ? "password" : "text"}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 max-md:hidden">
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
                        <div className="hidden max-md:flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAddressVisibility(currency);
                            }}
                            className="mobile-touch-button max-md:h-12 flex-1 border-gray-200"
                          >
                            {hiddenAddresses[currency] ? 'Show address' : 'Hide address'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(settings.wallets[currency] || '', currency);
                            }}
                            className="mobile-touch-button max-md:h-12 flex-1 border-gray-200"
                          >
                            {copiedAddress === currency ? 'Copied' : 'Copy address'}
                          </Button>
                        </div>
                        
                        {/* Extra ID input for currencies that require it */}
                        {requiresExtraId(currency) && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 max-md:text-sm">
                              {getExtraIdLabel(currency)} (if required by your wallet)
                            </label>
                            <div className="relative">
                              <Input
                                placeholder={getExtraIdPlaceholder(currency)}
                                value={settings.wallet_extra_ids?.[currency] || ''}
                                onChange={(e) => handleExtraIdInputChange(currency, e.target.value)}
                                className={`border-gray-300 bg-white pr-12 font-mono text-sm h-12 focus:border-[#7f5efd] focus-visible:ring-[#7f5efd]/20 max-md:text-base max-md:h-12 max-md:pr-4 ${
                                  extraIdValidationStatus[currency] === 'idle' || extraIdValidationStatus[currency] === 'checking' ? 'border-[#7f5efd] focus-visible:ring-[#7f5efd]' : ''
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 max-md:hidden">
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
                            <div className="hidden max-md:flex items-center gap-2">
                              <Button
                                variant="outline"
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
                                className="mobile-touch-button max-md:h-12 max-md:flex-1 border-gray-200"
                              >
                                {copiedExtraId === currency ? 'Copied' : 'Copy Extra ID'}
                              </Button>
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
                        
                        <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-2">
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
        <CardHeader className="pb-6 max-md:p-4 max-md:pb-4">
          <div className="flex items-center gap-4 max-md:flex-col max-md:items-start max-md:gap-3">
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
        <CardContent className="space-y-6 max-md:p-4 max-md:space-y-5">
          <div className="md:hidden">
            <Button
              variant="outline"
              onClick={() => setIsMobileSearchOpen(true)}
              className="w-full justify-center gap-2 border-gray-200 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/40 mobile-touch-button max-md:h-12"
            >
              <Search className="h-4 w-4" />
              Search cryptocurrencies
            </Button>
          </div>
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              ref={searchInputRef}
              placeholder="Search cryptocurrencies (e.g., Bitcoin, Ethereum, Solana...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-base border-gray-200 focus:border-purple-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-purple-500 rounded-lg"
            />
          </div>

          <div className="hidden md:block">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {currencyResults}
            </div>
          </div>
        </CardContent>
      </Card>

      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-900">Search wallets</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                ref={mobileSearchInputRef}
                placeholder="Search cryptocurrencies"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 focus:border-purple-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-purple-500 rounded-lg"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
            {currencyResults}
          </div>
        </div>
      )}

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
