"use client"

import React, { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import {
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
  Shield,
  Calculator,
  MapPin,
  Building,
  User,
  Phone,
  Globe,
  Bell,
  Sparkles,
  ArrowRight,
  Settings,
  CreditCard,
  Zap
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import { BackToDashboard } from '@/app/components/ui/back-to-dashboard';



interface TaxRate {
  id: string;
  label: string;
  percentage: string;
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

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';



const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

const US_TIMEZONES = [
  { code: 'America/New_York', name: 'Eastern Time (ET)' },
  { code: 'America/Chicago', name: 'Central Time (CT)' },
  { code: 'America/Denver', name: 'Mountain Time (MT)' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
  { code: 'America/Anchorage', name: 'Alaska Time (AKT)' },
  { code: 'Pacific/Honolulu', name: 'Hawaii Time (HT)' }
];

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'LLC',
  'Corporation',
  'Partnership',
  'Non-Profit',
  'Other'
];

const INDUSTRIES = [
  'Retail',
  'E-commerce',
  'SaaS',
  'Consulting',
  'Professional Services',
  'Healthcare',
  'Education',
  'Technology',
  'Manufacturing',
  'Real Estate',
  'Food & Beverage',
  'Entertainment',
  'Other'
];

// Currency display names mapping
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

const getCurrencyDisplayName = (code: string) => {
  return CURRENCY_NAMES[code] || code;
};



export default function MerchantSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<MerchantSettings>({
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
      { id: '1', label: 'Sales Tax', percentage: '8.5' }
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_payment_notifications_enabled: true,
    public_receipts_enabled: true,
  });
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});
  const [newWalletCurrency, setNewWalletCurrency] = useState<string | undefined>(undefined);


  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const res = await fetch('/api/merchant/settings');
        if (res.ok) {
          const data = await res.json();
          setNotificationSettings({
            email_payment_notifications_enabled: data.email_payment_notifications_enabled !== false,
            public_receipts_enabled: data.public_receipts_enabled !== false,
          });
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      }
    };
    fetchNotificationSettings();
  }, []);

  const updateNotificationSetting = async (
    field: 'email_payment_notifications_enabled' | 'public_receipts_enabled',
    value: boolean
  ) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    try {
      await fetch('/api/merchant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      toast.success('Settings updated');
    } catch (err) {
      console.error('Failed to update notification setting:', err);
      toast.error('Failed to update settings');
    }
  };



    useEffect(() => {
      loadMerchantData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      const wallets = { ...(merchant.wallets || {}) };
      if (wallets.ETH && !wallets.ETHBASE) {
        wallets.ETHBASE = wallets.ETH;
      }

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
        wallets,
        payment_config: {
          auto_forward: merchant.payment_config?.auto_forward ?? true,
          fee_percentage: merchant.auto_convert_enabled ? 1.0 : 0.5,
          ...(merchant.auto_convert_enabled ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
        },
        // Tax configuration from database or defaults
        tax_enabled: merchant.tax_enabled || false,
        tax_rates: (merchant.tax_rates || [
          { id: '1', label: 'Sales Tax', percentage: 8.5 }
        ]).map(
          (rate: { id: string; label: string; percentage: number | string }) => ({
            ...rate,
            percentage: String(rate.percentage)
          })
        ),
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
      Object.keys(wallets).forEach(currency => {
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



  // Tax rate management functions
  const addTaxRate = () => {
    const newId = (settings.tax_rates.length + 1).toString();
    setSettings(prev => ({
      ...prev,
      tax_rates: [...prev.tax_rates, { id: newId, label: '', percentage: '0' }]
    }));
  };

  const removeTaxRate = (id: string) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.filter(rate => rate.id !== id)
    }));
  };

  const updateTaxRate = (id: string, field: 'label' | 'percentage', value: string) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.map(rate =>
        rate.id === id
          ? {
              ...rate,
              [field]: value
            }
          : rate
      )
    }));
  };

  const validateAddress = async (currency: string, address: string) => {
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid', ...(currency === 'ETH' ? { ETHBASE: 'invalid' } : {}) }));
      return;
    }

    setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }));

    try {
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency,
          address: address.trim()
        }),
      });

      const result = await response.json();

      if (result.validation && result.validation.valid) {
        setValidationStatus(prev => ({
          ...prev,
          [currency]: 'valid',
          ...(currency === 'ETH' ? { ETHBASE: 'valid' } : {})
        }));
      } else {
        setValidationStatus(prev => ({ ...prev, [currency]: 'invalid', ...(currency === 'ETH' ? { ETHBASE: 'invalid' } : {}) }));
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid', ...(currency === 'ETH' ? { ETHBASE: 'invalid' } : {}) }));
    }
  };

  const handleWalletInputChange = async (currency: string, address: string) => {
    setSettings(prev => ({ ...prev, wallets: { ...prev.wallets, [currency]: address } }));

    if (address.trim()) {
      await validateAddress(currency, address);
    } else {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle', ...(currency === 'ETH' ? { ETHBASE: 'idle' } : {}) }));
    }
  };

  const removeWallet = (currency: string) => {
    setSettings(prev => {
      const newWallets = { ...prev.wallets };
      delete newWallets[currency];
      if (currency === 'ETH') {
        delete newWallets['ETHBASE'];
      }
      return {
        ...prev,
        wallets: newWallets
      };
    });

    setValidationStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[currency];
      if (currency === 'ETH') {
        delete newStatus['ETHBASE'];
      }
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

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const formatZipCode = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXXXX or XXXXX-XXXX
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
    }
    return digits;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setSettings(prev => ({
      ...prev,
      phone_number: formatted
    }));
  };

  const handleZipChange = (value: string) => {
    const formatted = formatZipCode(value);
    setSettings(prev => ({
      ...prev,
      business_address: {
        ...prev.business_address,
        zip_code: formatted
      }
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving merchant settings...');

      if (!user) {
        toast.error('User not authenticated');
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
          business_address: settings.business_address,
          // Payment settings
          charge_customer_fee: settings.charge_customer_fee,
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          wallets: settings.wallets,
          payment_config: settings.payment_config,
          // Tax configuration
          tax_enabled: settings.tax_enabled,
          tax_rates: settings.tax_rates.map(rate => ({ ...rate, percentage: parseFloat(rate.percentage) || 0 })),
          tax_strategy: settings.tax_strategy,
          sales_type: settings.sales_type
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating merchant:', updateError);
        toast.error('Failed to save settings');
        return;
      }

      console.log('✅ Settings saved successfully');
      toast.success('Settings saved successfully');

    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addWallet = () => {
    if (!newWalletCurrency) return;
    setSettings(prev => ({
      ...prev,
      wallets: { ...prev.wallets, [newWalletCurrency]: '' }
    }));
    setNewWalletCurrency(undefined); // Clear selected currency
  };

  const updateWalletAddress = (currency: string, address: string) => {
    setSettings(prev => ({ ...prev, wallets: { ...prev.wallets, [currency]: address } }));
    if (address.trim()) {
      validateAddress(currency, address);
    } else {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle', ...(currency === 'ETH' ? { ETHBASE: 'idle' } : {}) }));
    }
  };

  const validateWallet = async (currency: string, address: string) => {
    await validateAddress(currency, address);
  };


  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-4 mb-2">
            <BackToDashboard />
          </div>
          <h1 className="heading-xl text-gray-900">
            Account Settings <Sparkles className="inline-block h-8 w-8 text-[#7f5efd] ml-2" />
          </h1>
          <p className="text-body-lg text-gray-600 font-medium">
            Manage your business profile, payment preferences, and account settings
          </p>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-2 rounded-xl">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="wallets" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <Wallet className="h-4 w-4" />
              Wallets
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <Calculator className="h-4 w-4" />
              Tax
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-8">
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  Business Profile
                </CardTitle>
                <CardDescription className="text-body">
                  Update your business information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Business Name</label>
                    <Input
                      value={settings.business_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                      placeholder="Your Business Name"
                      className="form-input-enhanced"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Business Type</label>
                    <Select value={settings.business_type} onValueChange={(value) => setSettings(prev => ({ ...prev, business_type: value }))}>
                      <SelectTrigger className="form-input-enhanced">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Industry</label>
                    <Select value={settings.industry} onValueChange={(value) => setSettings(prev => ({ ...prev, industry: value }))}>
                      <SelectTrigger className="form-input-enhanced">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Phone Number</label>
                    <Input
                      value={settings.phone_number}
                      onChange={(e) => setSettings(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      className="form-input-enhanced"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Website</label>
                    <Input
                      value={settings.website}
                      onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourbusiness.com"
                      className="form-input-enhanced"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Timezone</label>
                    <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger className="form-input-enhanced">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
                        <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Business Description</label>
                  <textarea
                    value={settings.business_description}
                    onChange={(e) => setSettings(prev => ({ ...prev, business_description: e.target.value }))}
                    placeholder="Describe your business..."
                    className="form-input-enhanced min-h-[100px] resize-none"
                  />
                </div>

                {/* Business Address Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Business Address</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Street Address</label>
                      <Input
                        value={settings.business_address.street}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          business_address: { ...prev.business_address, street: e.target.value }
                        }))}
                        placeholder="123 Business St"
                        className="form-input-enhanced"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">City</label>
                      <Input
                        value={settings.business_address.city}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          business_address: { ...prev.business_address, city: e.target.value }
                        }))}
                        placeholder="City"
                        className="form-input-enhanced"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">State</label>
                      <Select 
                        value={settings.business_address.state} 
                        onValueChange={(value) => setSettings(prev => ({ 
                          ...prev, 
                          business_address: { ...prev.business_address, state: value }
                        }))}
                      >
                        <SelectTrigger className="form-input-enhanced">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">ZIP Code</label>
                      <Input
                        value={settings.business_address.zip_code}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          business_address: { ...prev.business_address, zip_code: e.target.value }
                        }))}
                        placeholder="12345"
                        className="form-input-enhanced"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={saveSettings} 
                    disabled={saving}
                    size="lg"
                    variant="premium"
                    className="flex items-center gap-3"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-8">
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  Cryptocurrency Wallets
                </CardTitle>
                <CardDescription className="text-body">
                  Configure your cryptocurrency wallet addresses for receiving payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-body">
                    <strong>Important:</strong> Cryptrac automatically forwards all payments to your configured wallet addresses. 
                    We never hold your funds - they are sent directly to your wallets.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(settings.wallets).map(([currency, address]) => (
                    <div key={currency} className="space-y-3 p-6 border border-gray-200 rounded-xl hover:border-[#7f5efd] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-[#7f5efd] to-[#a78bfa] rounded-lg">
                            <Wallet className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{currency}</h3>
                            <p className="text-sm text-gray-500">{getCurrencyDisplayName(currency)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {validationStatus[currency] === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          )}
                          {validationStatus[currency] === 'valid' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {validationStatus[currency] === 'invalid' && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Wallet Address</label>
                        <Input
                          value={address}
                          onChange={(e) => updateWalletAddress(currency, e.target.value)}
                          placeholder={`Enter ${currency} wallet address`}
                          className="form-input-enhanced"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => validateWallet(currency, address)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Validate
                        </Button>
                        <Button
                          onClick={() => removeWallet(currency)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Plus className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Add New Wallet</h3>
                  </div>
                  
                  <div className="flex gap-4">
                    <Select value={newWalletCurrency} onValueChange={setNewWalletCurrency}>
                      <SelectTrigger className="form-input-enhanced w-48">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(CURRENCY_NAMES).map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency} - {CURRENCY_NAMES[currency]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={addWallet}
                      disabled={!newWalletCurrency}
                      size="lg"
                      className="flex items-center gap-3"
                    >
                      <Plus className="h-5 w-5" />
                      Add Wallet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-8">
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  Payment Configuration
                </CardTitle>
                <CardDescription className="text-body">
                  Configure your payment processing preferences and fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-body">
                    <strong>Auto-Forward Enabled:</strong> All payments are automatically forwarded to your configured wallet addresses. 
                    No funds are held by Cryptrac.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Fee Structure</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-bold text-gray-900">Processing Fee</p>
                            <p className="text-sm text-gray-600">Applied to all transactions</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-[#7f5efd]">2.5%</p>
                            <p className="text-xs text-gray-500">Standard rate</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-bold text-gray-900">Auto-Convert Fee</p>
                            <p className="text-sm text-gray-600">When converting to USD</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-[#7f5efd]">1.0%</p>
                            <p className="text-xs text-gray-500">Additional</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Auto-Convert Settings</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="auto-convert"
                            checked={settings.auto_convert_enabled}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_convert_enabled: checked as boolean }))}
                          />
                          <label htmlFor="auto-convert" className="text-body font-medium">
                            Enable automatic conversion to USD
                          </label>
                        </div>
                        
                        {settings.auto_convert_enabled && (
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Preferred Payout Currency</label>
                            <Select 
                              value={settings.preferred_payout_currency || ''} 
                              onValueChange={(value) => setSettings(prev => ({ ...prev, preferred_payout_currency: value }))}
                            >
                              <SelectTrigger className="form-input-enhanced">
                                <SelectValue placeholder="Select payout currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const baseCurrencies = Object.keys(settings.wallets);
                                  const stableCoinAssociations: Record<string, string[]> = {
                                    'SOL': ['USDCSOL', 'USDTSOL'],
                                    'ETH': ['USDT', 'USDC', 'DAI', 'PYUSD', 'ETHBASE', 'USDCBASE'],
                                    'BNB': ['USDTBSC', 'USDCBSC'],
                                    'MATIC': ['USDTMATIC', 'USDCMATIC'],
                                    'TRX': ['USDTTRC20'],
                                    'TON': ['USDTTON'],
                                    'ARB': ['USDTARB', 'USDCARB'],
                                    'OP': ['USDTOP', 'USDCOP'],
                                    'ETHBASE': ['USDCBASE'],
                                    'ALGO': ['USDCALGO']
                                  };
                                  
                                  const expandedCurrencies = [...baseCurrencies];
                                  baseCurrencies.forEach(currency => {
                                    const associatedStableCoins = stableCoinAssociations[currency] || [];
                                    expandedCurrencies.push(...associatedStableCoins);
                                  });
                                  
                                  return expandedCurrencies.map((currency) => (
                                    <SelectItem key={currency} value={currency}>
                                      {currency} - {getCurrencyDisplayName(currency)}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500">
                              Enable auto-convert to select a preferred payout currency
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Management Tab */}
          <TabsContent value="tax" className="space-y-8">
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  Tax Collection Settings
                </CardTitle>
                <CardDescription className="text-body">
                  Configure tax collection for your payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="tax-enabled"
                    checked={settings.tax_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_enabled: checked as boolean }))}
                  />
                  <label htmlFor="tax-enabled" className="text-body font-bold">
                    Enable tax collection
                  </label>
                </div>

                {settings.tax_enabled && (
                  <div className="space-y-8">
                    {/* Business Address Display */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Business Address</h3>
                      </div>
                      
                      <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-5 w-5 text-blue-600" />
                        <AlertDescription className="text-body">
                          Your business address is automatically used from your <strong>Profile</strong> information. 
                          To update your address, please go to the Profile tab.
                        </AlertDescription>
                      </Alert>

                      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        {settings.business_address.street && (
                          <div className="text-body font-medium">{settings.business_address.street}</div>
                        )}
                        {(settings.business_address.city || settings.business_address.state || settings.business_address.zip_code) && (
                          <div className="text-body text-gray-600">
                            {settings.business_address.city && `${settings.business_address.city}, `}
                            {settings.business_address.state && `${settings.business_address.state} `}
                            {settings.business_address.zip_code}
                          </div>
                        )}
                        {(!settings.business_address.street && !settings.business_address.city) && (
                          <div className="text-body text-gray-500 italic">
                            No address configured. Please update your profile information.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sales Type */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Globe className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Sales Type</h3>
                      </div>
                      <Select 
                        value={settings.sales_type} 
                        onValueChange={(value: 'local' | 'online' | 'both') => setSettings(prev => ({ ...prev, sales_type: value }))}
                      >
                        <SelectTrigger className="form-input-enhanced">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Sales Only</SelectItem>
                          <SelectItem value="online">Online Sales Only</SelectItem>
                          <SelectItem value="both">Both Local and Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tax Strategy */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calculator className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Tax Strategy</h3>
                      </div>
                      <Select 
                        value={settings.tax_strategy} 
                        onValueChange={(value: 'origin' | 'destination' | 'custom') => setSettings(prev => ({ ...prev, tax_strategy: value }))}
                      >
                        <SelectTrigger className="form-input-enhanced">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="origin">Origin-based (charge tax based on business location)</SelectItem>
                          <SelectItem value="destination">Destination-based (charge tax based on customer location)</SelectItem>
                          <SelectItem value="custom">Custom rates per transaction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Default Tax Rates */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-red-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Default Tax Rates</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={addTaxRate}
                          className="flex items-center gap-3"
                        >
                          <Plus className="h-5 w-5" />
                          Add Rate
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {settings.tax_rates.map((rate) => (
                          <div key={rate.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#7f5efd] transition-colors">
                            <Input
                              placeholder="Tax label (e.g., Sales Tax)"
                              value={rate.label}
                              onChange={(e) => updateTaxRate(rate.id, 'label', e.target.value)}
                              className="flex-1 form-input-enhanced"
                            />
                            <div className="flex items-center gap-3">
                              <Input
                                type="text"
                                inputMode="decimal"
                                step="any"
                                placeholder="0.0"
                                value={rate.percentage}
                                onChange={(e) => updateTaxRate(rate.id, 'percentage', e.target.value)}
                                className="w-24 form-input-enhanced"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm font-bold text-gray-600">%</span>
                            </div>
                            {settings.tax_rates.length > 1 && (
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => removeTaxRate(rate.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-body font-bold text-blue-900">
                          Total Default Tax Rate: {settings.tax_rates.reduce((sum, rate) => sum + (parseFloat(rate.percentage) || 0), 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Tax Information */}
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <AlertDescription className="text-body">
                        <strong>Important:</strong> Cryptrac helps you charge and report taxes accurately but does not file or remit taxes. 
                        Consult with a tax professional for compliance requirements in your jurisdiction.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-8">
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-body">
                  Manage email alerts and public receipts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-[#7f5efd] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Bell className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Payment Notifications</h3>
                        <p className="text-body text-gray-600">Receive email alerts when payments are received</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={notificationSettings.email_payment_notifications_enabled}
                      onCheckedChange={(checked) =>
                        updateNotificationSetting('email_payment_notifications_enabled', !!checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-[#7f5efd] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Public Receipts</h3>
                        <p className="text-body text-gray-600">Make payment receipts publicly accessible</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={notificationSettings.public_receipts_enabled}
                      onCheckedChange={(checked) =>
                        updateNotificationSetting('public_receipts_enabled', !!checked)
                      }
                    />
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

