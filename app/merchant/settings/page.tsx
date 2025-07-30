import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Wallet, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Plus,
  Trash2,
  DollarSign,
  HelpCircle,
  Star,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide';

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

interface MerchantSettings {
  charge_customer_fee: boolean;
  auto_convert_enabled: boolean;
  preferred_payout_currency: string | null;
  wallets: Record<string, string>;
  payment_config: {
    // auto_forward removed - always enabled for non-custodial compliance
    fee_percentage: number;
    auto_convert_fee: number;
  };
}

interface UserType {
  id: string;
  email?: string;
  user_metadata?: {
    business_name?: string;
  };
}

// Top 10 + Major Stablecoins (Required for onboarding)
const TOP_10_CURRENCIES = [
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    network: 'Bitcoin',
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: 'Bitcoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Ethereum',
    enabled: true,
    is_required: true
  },
  {
    code: 'BNB',
    name: 'BNB',
    symbol: 'BNB',
    network: 'BSC',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'BNB',
    enabled: true,
    is_required: true
  },
  {
    code: 'SOL',
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Solana',
    enabled: true,
    is_required: true
  },
  {
    code: 'TRX',
    name: 'TRON',
    symbol: 'TRX',
    network: 'TRON',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'TRON',
    enabled: true,
    is_required: true
  },
  {
    code: 'TON',
    name: 'TON',
    symbol: 'TON',
    network: 'TON',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'TON',
    enabled: true,
    is_required: true
  },
  {
    code: 'AVAX',
    name: 'Avalanche',
    symbol: 'AVAX',
    network: 'Avalanche',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Avalanche',
    enabled: true,
    is_required: true
  },
  {
    code: 'DOGE',
    name: 'Dogecoin',
    symbol: 'DOGE',
    network: 'Dogecoin',
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: 'Dogecoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'XRP',
    name: 'XRP',
    symbol: 'XRP',
    network: 'XRP Ledger',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'XRP',
    enabled: true,
    is_required: true
  },
  {
    code: 'SUI',
    name: 'Sui',
    symbol: 'SUI',
    network: 'Sui',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Sui',
    enabled: true,
    is_required: true
  },
  // Major Stablecoins
  {
    code: 'USDT_ERC20',
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDT (ERC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_ERC20',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDC (ERC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_BEP20',
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'BSC',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'USDT (BEP-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_BEP20',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'BSC',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'USDC (BEP-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_SOL',
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDT (Solana)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_SOL',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDC (Solana)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_TRC20',
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'TRON',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDT (TRC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_TRC20',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'TRON',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDC (TRC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_TON',
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'TON',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDT (TON)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_AVAX',
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'Avalanche',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDT (Avalanche)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_AVAX',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Avalanche',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USDC (Avalanche)',
    enabled: true,
    is_required: true
  }
];

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
];

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export default function MerchantSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<MerchantSettings>({
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
    payment_config: {
      fee_percentage: 2.5,
      auto_convert_fee: 1.0
    }
  });
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([]);
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  useEffect(() => {
    loadMerchantData();
    loadAdditionalCurrencies();
  }, []);

  const loadMerchantData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading merchant data...');

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        router.push('/auth/login');
        return;
      }

      setUser(user);
      console.log('✅ User loaded:', user.email);

      // Load merchant settings
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (merchantError) {
        console.error('Error loading merchant:', merchantError);
        toast.error('Failed to load merchant settings');
        return;
      }

      console.log('✅ Merchant loaded:', merchant);

      setSettings({
        charge_customer_fee: merchant.charge_customer_fee || false,
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        preferred_payout_currency: merchant.preferred_payout_currency,
        wallets: merchant.wallets || {},
        payment_config: {
          fee_percentage: merchant.fee_percentage || 2.5,
          auto_convert_fee: merchant.auto_convert_fee || 1.0
        }
      });

      // Initialize validation status for existing wallets
      const initialValidation: Record<string, ValidationStatus> = {};
      Object.keys(merchant.wallets || {}).forEach(currency => {
        initialValidation[currency] = 'valid'; // Assume existing wallets are valid
      });
      setValidationStatus(initialValidation);

    } catch (error) {
      console.error('Error loading merchant data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  const loadAdditionalCurrencies = async () => {
    try {
      setLoadingCurrencies(true);
      console.log('📡 Loading additional currencies from dynamic API...');
      
      // Use the new dynamic currency API with popular=false to get all currencies
      const response = await fetch('/api/currencies?popular=false');
      const data = await response.json();

      if (data.success) {
        // Filter out currencies that are already in TOP_10_CURRENCIES
        const topCurrencyCodes = TOP_10_CURRENCIES.map(c => c.code);
        const additional = data.currencies.filter((currency: CurrencyInfo) => 
          !topCurrencyCodes.includes(currency.code) && currency.enabled
        );
        
        console.log(`📊 Loaded ${additional.length} additional currencies from NOWPayments:`, additional.map((c: CurrencyInfo) => c.code));
        setAdditionalCurrencies(additional);
      } else {
        console.error('Failed to load currencies:', data.error);
        toast.error('Failed to load additional currencies');
      }
    } catch (error) {
      console.error('Error loading additional currencies:', error);
      toast.error('Failed to load additional currencies');
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const validateAddress = async (currency: string, address: string) => {
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      return false;
    }

    try {
      setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }));

      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: currency.toUpperCase(),
          address: address.trim()
        })
      });

      const result = await response.json();
      const isValid = result.success && result.validation?.valid;
      
      setValidationStatus(prev => ({ 
        ...prev, 
        [currency]: isValid ? 'valid' : 'invalid' 
      }));
      
      return isValid;

    } catch (error) {
      console.error(`Validation error for ${currency}:`, error);
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      return false;
    }
  };

  const handleWalletChange = async (currency: string, address: string) => {
    setSettings(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [currency]: address
      }
    }));

    if (address.trim()) {
      await validateAddress(currency, address);
    } else {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
    }
  };

  const removeWallet = (currency: string) => {
    setSettings(prev => {
      const newWallets = { ...prev.wallets };
      delete newWallets[currency];
      return {
        ...prev,
        wallets: newWallets
      };
    });
    
    setValidationStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[currency];
      return newStatus;
    });
  };

  const getValidationIcon = (currency: string) => {
    const status = validationStatus[currency] || 'idle';
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = (currency: string) => {
    const status = validationStatus[currency] || 'idle';
    switch (status) {
      case 'checking':
        return 'Validating address...';
      case 'valid':
        return 'Valid address';
      case 'invalid':
        return 'Invalid address format';
      default:
        return '';
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving merchant settings...');

      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Validate all wallet addresses before saving
      const invalidWallets = Object.entries(settings.wallets).filter(([currency, address]) => {
        return address && validationStatus[currency] !== 'valid';
      });

      if (invalidWallets.length > 0) {
        toast.error(`Please fix invalid wallet addresses: ${invalidWallets.map(([currency]) => currency).join(', ')}`);
        return;
      }

      // Update merchant settings
      const { error: updateError } = await supabase
        .from('merchants')
        .update({
          charge_customer_fee: settings.charge_customer_fee,
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          wallets: settings.wallets,
          fee_percentage: settings.payment_config.fee_percentage,
          auto_convert_fee: settings.payment_config.auto_convert_fee,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating merchant:', updateError);
        toast.error('Failed to save settings');
        return;
      }

      console.log('✅ Settings saved successfully');
      toast.success('Settings saved successfully!');

    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const filteredAdditionalCurrencies = additionalCurrencies.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Merchant Settings</h1>
            <p className="text-gray-600">Configure your payment processing and wallet settings</p>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="min-w-[120px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Trust Wallet Guide Modal */}
        {showTrustWalletGuide && (
          <TrustWalletGuide 
            onComplete={() => setShowTrustWalletGuide(false)} 
            onSkip={() => setShowTrustWalletGuide(false)} 
          />
        )}

        <Tabs defaultValue="wallets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallets">
              <Wallet className="h-4 w-4 mr-2" />
              Wallet Addresses
            </TabsTrigger>
            <TabsTrigger value="payment">
              <DollarSign className="h-4 w-4 mr-2" />
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Wallet Addresses Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Cryptocurrency Wallet Addresses
                    </CardTitle>
                    <CardDescription>
                      Configure wallet addresses for cryptocurrencies you want to accept. 
                      All payments are automatically forwarded to these addresses.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowTrustWalletGuide(true)}
                    className="flex items-center gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Trust Wallet Guide
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Non-Custodial Notice */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Non-Custodial:</strong> Cryptrac never holds your funds. All payments are automatically 
                    forwarded directly to your wallet addresses. You maintain full control of your cryptocurrency.
                  </AlertDescription>
                </Alert>

                {/* Top Cryptocurrencies */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Top Cryptocurrencies + Major Stablecoins</span>
                    <Badge variant="secondary">Recommended</Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    {TOP_10_CURRENCIES.map((currency) => (
                      <div key={currency.code} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{currency.code}</span>
                              <Badge variant="outline" className="text-xs">
                                {currency.network}
                              </Badge>
                              {currency.is_required && (
                                <Badge variant="secondary" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{currency.display_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {settings.wallets[currency.code] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWallet(currency.code)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {getValidationIcon(currency.code)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Input
                            placeholder={`Enter your ${currency.code} wallet address`}
                            value={settings.wallets[currency.code] || ''}
                            onChange={(e) => handleWalletChange(currency.code, e.target.value)}
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
                  </div>
                </div>

                {/* Additional Cryptocurrencies */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Additional Cryptocurrencies</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add support for more cryptocurrencies (loaded from NOWPayments - {additionalCurrencies.length} available)
                  </p>
                  
                  <div className="space-y-4">
                    <Input
                      placeholder="Search for additional cryptocurrencies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {loadingCurrencies ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading additional currencies from NOWPayments...</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {filteredAdditionalCurrencies.map((currency) => (
                          <div key={currency.code} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{currency.code}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {currency.network}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{currency.display_name || currency.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {settings.wallets[currency.code] && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeWallet(currency.code)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {getValidationIcon(currency.code)}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Input
                                placeholder={`Enter your ${currency.code} wallet address`}
                                value={settings.wallets[currency.code] || ''}
                                onChange={(e) => handleWalletChange(currency.code, e.target.value)}
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
                          <div className="text-center py-8">
                            <p>No cryptocurrencies found matching "{searchTerm}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Configuration
                </CardTitle>
                <CardDescription>
                  Configure how payments are processed and fees are handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Fee Setting */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charge_customer_fee"
                      checked={settings.charge_customer_fee}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, charge_customer_fee: checked === true }))
                      }
                    />
                    <label htmlFor="charge_customer_fee" className="text-sm font-medium">
                      Charge processing fee to customers
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    When enabled, customers pay an additional {settings.payment_config.fee_percentage}% processing fee. 
                    When disabled, you absorb the processing costs.
                  </p>
                </div>

                {/* Auto Convert Setting */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto_convert_enabled"
                      checked={settings.auto_convert_enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, auto_convert_enabled: checked === true }))
                      }
                    />
                    <label htmlFor="auto_convert_enabled" className="text-sm font-medium">
                      Enable automatic conversion to preferred currency
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Automatically convert received payments to your preferred payout currency. 
                    Additional {settings.payment_config.auto_convert_fee}% conversion fee applies.
                  </p>
                </div>

                {/* Preferred Payout Currency */}
                {settings.auto_convert_enabled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Payout Currency</label>
                    <Select
                      value={settings.preferred_payout_currency || ''}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, preferred_payout_currency: value || null }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIAT_CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))}
                        {Object.keys(settings.wallets).map(crypto => (
                          <SelectItem key={crypto} value={crypto}>
                            {crypto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Fee Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Processing Fee (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={settings.payment_config.fee_percentage}
                      onChange={(e) => 
                        setSettings(prev => ({
                          ...prev,
                          payment_config: {
                            ...prev.payment_config,
                            fee_percentage: parseFloat(e.target.value) || 0
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Auto-Convert Fee (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={settings.payment_config.auto_convert_fee}
                      onChange={(e) => 
                        setSettings(prev => ({
                          ...prev,
                          payment_config: {
                            ...prev.payment_config,
                            auto_convert_fee: parseFloat(e.target.value) || 0
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Compliance
                </CardTitle>
                <CardDescription>
                  Security features and compliance information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Non-Custodial Security:</strong> Cryptrac operates as a non-custodial payment processor. 
                    We never hold, store, or have access to your cryptocurrency funds. All payments are automatically 
                    forwarded directly to your configured wallet addresses.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">End-to-end encryption for all transactions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Real-time payment notifications and webhooks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Automatic payment forwarding (no fund custody)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Multi-network cryptocurrency support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

