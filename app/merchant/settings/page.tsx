"use client"

import React, { useState, useEffect } from 'react';
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
  Bell
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

  const handleWalletInputChange = async (currency: string, address: string) => {
    handleWalletChange(currency, address);

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



  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
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
            <div className="flex items-center gap-4 mb-2">
              <BackToDashboard />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your merchant account settings and preferences
            </p>
          </div>
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Tax Management
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab removed - moved to /merchant/dashboard/profile */}
          {/* Wallet Addresses Tab removed - moved to /merchant/wallets */}

          {/* Payment Settings Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Gateway Fee Settings
                </CardTitle>
                <CardDescription>
                  Configure how gateway fees are handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-convert"
                      checked={settings.auto_convert_enabled}
                      onCheckedChange={(checked) => {
                        setSettings(prev => ({
                          ...prev,
                          auto_convert_enabled: checked as boolean,
                          payment_config: {
                            ...prev.payment_config,
                            fee_percentage: checked ? 1.0 : 0.5,
                            ...(checked ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
                          }
                        }));
                      }}
                    />
                    <label htmlFor="auto-convert" className="text-sm font-medium">
                      Enable auto-convert
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Automatically convert cryptocurrency payments to your preferred currency
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charge-customer-fee"
                      checked={settings.charge_customer_fee}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, charge_customer_fee: checked as boolean }))}
                    />
                    <label htmlFor="charge-customer-fee" className="text-sm font-medium">
                      Charge gateway fee to customers
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Pass the {settings.auto_convert_enabled ? '1%' : '0.5%'} gateway fee to your customers instead of absorbing it
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Gateway Fees:</strong> NOWPayments charges {settings.auto_convert_enabled ? '1%' : '0.5%'} for payment processing. 
                    {settings.auto_convert_enabled ? ' Higher fee applies when auto-convert is enabled.' : ' Lower fee applies when auto-convert is disabled.'}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferred Payout Currency</CardTitle>
                <CardDescription>
                  Choose your preferred cryptocurrency for payouts (when auto-convert is enabled)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={settings.preferred_payout_currency || ''} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, preferred_payout_currency: value }))}
                  disabled={!settings.auto_convert_enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred payout currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                  </SelectContent>
                </Select>
                {!settings.auto_convert_enabled && (
                  <p className="text-sm text-gray-500 mt-2">
                    Enable auto-convert to select a preferred payout currency
                  </p>
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
                  Tax Collection Settings
                </CardTitle>
                <CardDescription>
                  Configure tax collection for your payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax-enabled"
                    checked={settings.tax_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_enabled: checked as boolean }))}
                  />
                  <label htmlFor="tax-enabled" className="text-sm font-medium">
                    Enable tax collection
                  </label>
                </div>

                {settings.tax_enabled && (
                  <>
                    {/* Business Address Display */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <h3 className="font-medium">Business Address</h3>
                      </div>
                      
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Your business address is automatically used from your <strong>Profile</strong> information. 
                          To update your address, please go to the Profile tab.
                        </AlertDescription>
                      </Alert>

                      <div className="p-4 bg-gray-50 rounded-lg border">
                        {settings.business_address.street && (
                          <div>{settings.business_address.street}</div>
                        )}
                        {(settings.business_address.city || settings.business_address.state || settings.business_address.zip_code) && (
                          <div>
                            {settings.business_address.city && `${settings.business_address.city}, `}
                            {settings.business_address.state && `${settings.business_address.state} `}
                            {settings.business_address.zip_code}
                          </div>
                        )}
                        {(!settings.business_address.street && !settings.business_address.city) && (
                          <div className="text-gray-500 italic">
                            No address configured. Please update your profile information.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sales Type */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <h3 className="font-medium">Sales Type</h3>
                      </div>
                      <Select 
                        value={settings.sales_type} 
                        onValueChange={(value: 'local' | 'online' | 'both') => setSettings(prev => ({ ...prev, sales_type: value }))}
                      >
                        <SelectTrigger>
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
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        <h3 className="font-medium">Tax Strategy</h3>
                      </div>
                      <Select 
                        value={settings.tax_strategy} 
                        onValueChange={(value: 'origin' | 'destination' | 'custom') => setSettings(prev => ({ ...prev, tax_strategy: value }))}
                      >
                        <SelectTrigger>
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
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <h3 className="font-medium">Default Tax Rates</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTaxRate}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Rate
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {settings.tax_rates.map((rate) => (
                          <div key={rate.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Input
                              placeholder="Tax label (e.g., Sales Tax)"
                              value={rate.label}
                              onChange={(e) => updateTaxRate(rate.id, 'label', e.target.value)}
                              className="flex-1"
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                inputMode="decimal"
                                step="any"
                                placeholder="0.0"
                                value={rate.percentage}
                                onChange={(e) => updateTaxRate(rate.id, 'percentage', e.target.value)}
                                className="w-20"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                            {settings.tax_rates.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTaxRate(rate.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <strong>Total Default Tax Rate:</strong> {settings.tax_rates.reduce((sum, rate) => sum + (parseFloat(rate.percentage) || 0), 0).toFixed(1)}%
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
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Manage email alerts and public receipts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email me when I receive a payment</span>
                  <Checkbox
                    checked={notificationSettings.email_payment_notifications_enabled}
                    onCheckedChange={(checked) =>
                      updateNotificationSetting('email_payment_notifications_enabled', !!checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Make public receipts available</span>
                  <Checkbox
                    checked={notificationSettings.public_receipts_enabled}
                    onCheckedChange={(checked) =>
                      updateNotificationSetting('public_receipts_enabled', !!checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


      </div>
    </DashboardLayout>
  );
}

