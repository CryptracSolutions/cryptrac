"use client"

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
  Shield,
  Calculator,
  MapPin,
  Building,
  User,
  Phone,
  Globe,
  Clock
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

interface TaxRate {
  id: string;
  label: string;
  percentage: number;
}

interface MerchantSettings {
  // Profile information
  business_name: string;
  business_type: string;
  industry: string;
  business_description: string;
  website: string;
  phone_number: string;
  timezone: string;
  // Payment settings
  charge_customer_fee: boolean;
  auto_convert_enabled: boolean;
  preferred_payout_currency: string | null;
  wallets: Record<string, string>;
  payment_config: {
    auto_forward?: boolean;
    fee_percentage: number;
    auto_convert_fee?: number;
    no_convert_fee?: number;
  };
  // Tax configuration
  tax_enabled: boolean;
  tax_rates: TaxRate[];
  business_address: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  tax_strategy: 'origin' | 'destination' | 'custom';
  sales_type: 'local' | 'online' | 'both';
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
  const [user, setUser] = useState<UserType | null>(null);  const [settings, setSettings] = useState<MerchantSettings>({
    // Profile information defaults
    business_name: '',
    business_type: '',
    industry: '',
    business_description: '',
    website: '',
    phone_number: '',
    timezone: 'America/New_York',
    // Payment settings defaults
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
    payment_config: {
      fee_percentage: 2.5,
      auto_convert_fee: 1.0
    },
    // Tax configuration defaults
    tax_enabled: false,
    tax_rates: [
      { id: '1', label: 'Sales Tax', percentage: 8.5 }
    ],
    business_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US'
    },
    tax_strategy: 'origin',
    sales_type: 'local'
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
        // Profile information from database
        business_name: merchant.business_name || '',
        business_type: merchant.business_type || '',
        industry: merchant.industry || '',
        business_description: merchant.business_description || '',
        website: merchant.website || '',
        phone_number: merchant.phone_number || '',
        timezone: merchant.timezone || 'America/New_York',
        // Payment settings from database
        charge_customer_fee: merchant.charge_customer_fee || false,
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        preferred_payout_currency: merchant.preferred_payout_currency,
        wallets: merchant.wallets || {},
        payment_config: {
          auto_forward: merchant.payment_config?.auto_forward ?? true,
          fee_percentage: merchant.auto_convert_enabled ? 1.0 : 0.5,
          ...(merchant.auto_convert_enabled ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
        },
        // Tax configuration from database or defaults
        tax_enabled: merchant.tax_enabled || false,
        tax_rates: merchant.tax_rates || [
          { id: '1', label: 'Sales Tax', percentage: 8.5 }
        ],
        business_address: merchant.business_address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'US'
        },
        tax_strategy: merchant.tax_strategy || 'origin',
        sales_type: merchant.sales_type || 'local'
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

    const handleWalletChange = (currency: string, address: string) => {
    setSettings(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [currency]: address
      }
    }));
  };

  // Tax rate management functions
  const addTaxRate = () => {
    const newId = (settings.tax_rates.length + 1).toString();
    setSettings(prev => ({
      ...prev,
      tax_rates: [...prev.tax_rates, { id: newId, label: '', percentage: 0 }]
    }));
  };

  const removeTaxRate = (id: string) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.filter(rate => rate.id !== id)
    }));
  };

  const updateTaxRate = (id: string, field: 'label' | 'percentage', value: string | number) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.map(rate => 
        rate.id === id ? { 
          ...rate, 
          [field]: field === 'percentage' ? parseFloat(value.toString()) || 0 : value 
        } : rate
      )
    }));
  };

  // Auto-detect tax rates by ZIP code (placeholder for future implementation)
  const autoDetectTaxRates = async (zipCode: string) => {
    // TODO: Integrate with tax rate API (TaxJar, Avalara, etc.)
    console.log('Auto-detecting tax rates for ZIP:', zipCode);
    // For now, just show a placeholder message
    toast.success('Auto-detection feature coming soon! Please enter tax rates manually.');
  };

  const handleWalletInputChange = async (currency: string, address: string) => {
    handleWalletChange(currency, address);
    
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
          // Profile information
          business_name: settings.business_name,
          business_type: settings.business_type,
          industry: settings.industry,
          business_description: settings.business_description,
          website: settings.website,
          phone_number: settings.phone_number,
          timezone: settings.timezone,
          // Payment settings
          charge_customer_fee: settings.charge_customer_fee,
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          wallets: settings.wallets,
          payment_config: settings.payment_config,
          // Tax configuration
          tax_enabled: settings.tax_enabled,
          tax_rates: settings.tax_rates,
          business_address: settings.business_address,
          tax_strategy: settings.tax_strategy,
          sales_type: settings.sales_type,
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="wallets">
              <Wallet className="h-4 w-4 mr-2" />
              Wallet Addresses
            </TabsTrigger>
            <TabsTrigger value="payment">
              <DollarSign className="h-4 w-4 mr-2" />
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="tax">
              <Calculator className="h-4 w-4 mr-2" />
              Tax Management
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Business Profile
                </CardTitle>
                <CardDescription>
                  Manage your business information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Name *</label>
                      <Input
                        value={settings.business_name}
                        onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                        placeholder="Enter your business name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Type</label>
                      <Select
                        value={settings.business_type}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, business_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llc">LLC</SelectItem>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Industry *</label>
                      <Select
                        value={settings.industry}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, industry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="saas">Software/SaaS</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="real_estate">Real Estate</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Website</label>
                      <Input
                        value={settings.website}
                        onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Description</label>
                    <Input
                      value={settings.business_description}
                      onChange={(e) => setSettings(prev => ({ ...prev, business_description: e.target.value }))}
                      placeholder="Brief description of your business"
                    />
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number *</label>
                      <Input
                        value={settings.phone_number}
                        onChange={(e) => {
                          // Format phone number as user types
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                          setSettings(prev => ({ ...prev, phone_number: formatted }));
                        }}
                        placeholder="(555) 123-4567"
                        maxLength={14}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                          <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Business Address Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Business Address
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Street Address *</label>
                      <Input
                        value={settings.business_address.street || ''}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          business_address: { ...prev.business_address, street: e.target.value }
                        }))}
                        placeholder="123 Main Street"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">City *</label>
                        <Input
                          value={settings.business_address.city || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            business_address: { ...prev.business_address, city: e.target.value }
                          }))}
                          placeholder="San Francisco"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">State *</label>
                        <Select
                          value={settings.business_address.state || ''}
                          onValueChange={(value) => setSettings(prev => ({
                            ...prev,
                            business_address: { ...prev.business_address, state: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AL">Alabama</SelectItem>
                            <SelectItem value="AK">Alaska</SelectItem>
                            <SelectItem value="AZ">Arizona</SelectItem>
                            <SelectItem value="AR">Arkansas</SelectItem>
                            <SelectItem value="CA">California</SelectItem>
                            <SelectItem value="CO">Colorado</SelectItem>
                            <SelectItem value="CT">Connecticut</SelectItem>
                            <SelectItem value="DE">Delaware</SelectItem>
                            <SelectItem value="FL">Florida</SelectItem>
                            <SelectItem value="GA">Georgia</SelectItem>
                            <SelectItem value="HI">Hawaii</SelectItem>
                            <SelectItem value="ID">Idaho</SelectItem>
                            <SelectItem value="IL">Illinois</SelectItem>
                            <SelectItem value="IN">Indiana</SelectItem>
                            <SelectItem value="IA">Iowa</SelectItem>
                            <SelectItem value="KS">Kansas</SelectItem>
                            <SelectItem value="KY">Kentucky</SelectItem>
                            <SelectItem value="LA">Louisiana</SelectItem>
                            <SelectItem value="ME">Maine</SelectItem>
                            <SelectItem value="MD">Maryland</SelectItem>
                            <SelectItem value="MA">Massachusetts</SelectItem>
                            <SelectItem value="MI">Michigan</SelectItem>
                            <SelectItem value="MN">Minnesota</SelectItem>
                            <SelectItem value="MS">Mississippi</SelectItem>
                            <SelectItem value="MO">Missouri</SelectItem>
                            <SelectItem value="MT">Montana</SelectItem>
                            <SelectItem value="NE">Nebraska</SelectItem>
                            <SelectItem value="NV">Nevada</SelectItem>
                            <SelectItem value="NH">New Hampshire</SelectItem>
                            <SelectItem value="NJ">New Jersey</SelectItem>
                            <SelectItem value="NM">New Mexico</SelectItem>
                            <SelectItem value="NY">New York</SelectItem>
                            <SelectItem value="NC">North Carolina</SelectItem>
                            <SelectItem value="ND">North Dakota</SelectItem>
                            <SelectItem value="OH">Ohio</SelectItem>
                            <SelectItem value="OK">Oklahoma</SelectItem>
                            <SelectItem value="OR">Oregon</SelectItem>
                            <SelectItem value="PA">Pennsylvania</SelectItem>
                            <SelectItem value="RI">Rhode Island</SelectItem>
                            <SelectItem value="SC">South Carolina</SelectItem>
                            <SelectItem value="SD">South Dakota</SelectItem>
                            <SelectItem value="TN">Tennessee</SelectItem>
                            <SelectItem value="TX">Texas</SelectItem>
                            <SelectItem value="UT">Utah</SelectItem>
                            <SelectItem value="VT">Vermont</SelectItem>
                            <SelectItem value="VA">Virginia</SelectItem>
                            <SelectItem value="WA">Washington</SelectItem>
                            <SelectItem value="WV">West Virginia</SelectItem>
                            <SelectItem value="WI">Wisconsin</SelectItem>
                            <SelectItem value="WY">Wyoming</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ZIP Code *</label>
                        <Input
                          value={settings.business_address.zip_code || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setSettings(prev => ({
                              ...prev,
                              business_address: { ...prev.business_address, zip_code: value }
                            }));
                          }}
                          placeholder="12345"
                          maxLength={5}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                      Charge gateway fee to customers
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    When enabled, customers pay the gateway fee ({settings.auto_convert_enabled ? '1%' : '0.5%'}). 
                    When disabled, you absorb the gateway costs.
                  </p>
                </div>

                {/* Auto Convert Setting */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto_convert_enabled"
                      checked={settings.auto_convert_enabled}
                      onCheckedChange={(checked) => {
                        const isAutoConvert = checked === true;
                        setSettings(prev => ({ 
                          ...prev, 
                          auto_convert_enabled: isAutoConvert,
                          payment_config: {
                            auto_forward: prev.payment_config.auto_forward,
                            fee_percentage: isAutoConvert ? 1.0 : 0.5,
                            ...(isAutoConvert 
                              ? { auto_convert_fee: 1.0 }
                              : { no_convert_fee: 0.5 }
                            )
                          }
                        }))
                      }}
                    />
                    <label htmlFor="auto_convert_enabled" className="text-sm font-medium">
                      Enable automatic conversion to preferred currency
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Automatically convert received payments to your preferred payout currency. 
                    Gateway fee increases to 1% when auto-convert is enabled (vs 0.5% when disabled).
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

              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Management Tab */}
          <TabsContent value="tax" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Tax Configuration
                </CardTitle>
                <CardDescription>
                  Configure tax settings for your payment links. Cryptrac helps you charge and report taxes accurately but does not file or remit taxes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tax Enable/Disable */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax_enabled"
                    checked={settings.tax_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_enabled: checked === true }))}
                  />
                  <label htmlFor="tax_enabled" className="text-sm font-medium">
                    Enable tax collection on payment links
                  </label>
                </div>

                {settings.tax_enabled && (
                  <>
                    {/* Business Address */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <h3 className="text-lg font-medium">Business Address</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Street Address</label>
                          <Input
                            placeholder="123 Main St"
                            value={settings.business_address.street || ''}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              business_address: { ...prev.business_address, street: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">City</label>
                          <Input
                            placeholder="San Francisco"
                            value={settings.business_address.city || ''}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              business_address: { ...prev.business_address, city: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">State</label>
                          <Input
                            placeholder="CA"
                            value={settings.business_address.state || ''}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              business_address: { ...prev.business_address, state: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">ZIP Code</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="94102"
                              value={settings.business_address.zip_code || ''}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                business_address: { ...prev.business_address, zip_code: e.target.value }
                              }))}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => autoDetectTaxRates(settings.business_address.zip_code || '')}
                              disabled={!settings.business_address.zip_code}
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Auto-Detect
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales Type */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Sales Type</h3>
                      <Select
                        value={settings.sales_type}
                        onValueChange={(value: 'local' | 'online' | 'both') => 
                          setSettings(prev => ({ ...prev, sales_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local/In-Person Sales Only</SelectItem>
                          <SelectItem value="online">Online/Remote Sales Only</SelectItem>
                          <SelectItem value="both">Both Local and Online Sales</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600">
                        {settings.sales_type === 'local' && 'Tax based on your business location (origin-based).'}
                        {settings.sales_type === 'online' && 'Tax may vary by customer location (destination-based).'}
                        {settings.sales_type === 'both' && 'Flexible tax calculation based on sale type.'}
                      </p>
                    </div>

                    {/* Tax Strategy */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Tax Strategy</h3>
                      <Select
                        value={settings.tax_strategy}
                        onValueChange={(value: 'origin' | 'destination' | 'custom') => 
                          setSettings(prev => ({ ...prev, tax_strategy: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="origin">Origin-Based (Business Location)</SelectItem>
                          <SelectItem value="destination">Destination-Based (Customer Location)</SelectItem>
                          <SelectItem value="custom">Custom Configuration</SelectItem>
                        </SelectContent>
                      </Select>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          {settings.tax_strategy === 'origin' && 'All sales taxed at your business location rates. Simplest approach.'}
                          {settings.tax_strategy === 'destination' && 'Sales taxed based on customer location. More complex but may be required for online sales.'}
                          {settings.tax_strategy === 'custom' && 'Manual tax configuration for each payment link.'}
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* Default Tax Rates */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Default Tax Rates</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTaxRate}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Tax Rate
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {settings.tax_rates.map((taxRate, index) => (
                          <div key={taxRate.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <Input
                                placeholder="Tax Label (e.g., State Tax, Local Tax)"
                                value={taxRate.label}
                                onChange={(e) => updateTaxRate(taxRate.id, 'label', e.target.value)}
                              />
                            </div>
                            
                            <div className="w-24">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="50"
                                placeholder="8.5"
                                value={taxRate.percentage}
                                onChange={(e) => updateTaxRate(taxRate.id, 'percentage', e.target.value)}
                              />
                            </div>
                            
                            <span className="text-sm text-gray-500">%</span>
                            
                            {settings.tax_rates.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTaxRate(taxRate.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <strong>Total Default Tax Rate:</strong> {settings.tax_rates.reduce((sum, rate) => sum + rate.percentage, 0).toFixed(1)}%
                      </div>
                    </div>

                    {/* Tax Information */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> Cryptrac helps you charge and report taxes accurately but does not file or remit taxes. 
                        Consult with a tax professional for compliance requirements in your jurisdiction.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
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

