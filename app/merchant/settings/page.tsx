'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Wallet, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

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
}

interface MerchantSettings {
  auto_convert_enabled: boolean;
  preferred_payout_currency: string | null;
  wallets: Record<string, string>;
  payment_config: {
    auto_forward: boolean;
    fee_percentage: number;
    auto_convert_fee: number;
  };
}

interface GeneratedWallet {
  address: string;
  currency: string;
  network: string;
  derivation_path?: string;
  public_key?: string;
}

interface UserType {
  id: string;
  email?: string;
  user_metadata?: {
    business_name?: string;
  };
}

export default function MerchantSettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MerchantSettings>({
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
    payment_config: {
      auto_forward: false,
      fee_percentage: 2.5,
      auto_convert_fee: 1.0
    }
  });
  
  // Dynamic currency support
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationStates, setValidationStates] = useState<Record<string, 'validating' | 'valid' | 'invalid' | null>>({});
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string>('');
  const [showMnemonic, setShowMnemonic] = useState(false);

  const router = useRouter();

  const loadUserAndSettings = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user as UserType);

      // Load merchant settings
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select(`
          *,
          merchant_wallets (
            currency,
            wallet_address,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (merchantError) {
        console.error('Error loading merchant:', merchantError);
        toast.error('Failed to load merchant settings');
        return;
      }

      if (merchant) {
        // Convert wallet data to our format
        const wallets: Record<string, string> = {};
        if (merchant.merchant_wallets) {
          merchant.merchant_wallets.forEach((wallet: { currency: string; wallet_address: string; is_active: boolean }) => {
            if (wallet.is_active) {
              wallets[wallet.currency] = wallet.wallet_address;
            }
          });
        }

        setSettings({
          auto_convert_enabled: merchant.auto_convert_enabled || false,
          preferred_payout_currency: merchant.preferred_payout_currency,
          wallets,
          payment_config: {
            auto_forward: merchant.auto_forward_enabled || false,
            fee_percentage: merchant.fee_percentage || 2.5,
            auto_convert_fee: merchant.auto_convert_fee || 1.0
          }
        });
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCurrencies = async () => {
    try {
      setLoadingCurrencies(true);
      
      const response = await fetch('/api/currencies');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableCurrencies(data.currencies);
        }
      }
      
    } catch (error) {
      console.error('Failed to load currencies:', error);
      toast.error('Failed to load available currencies');
      
      // Fallback to basic currencies
      setAvailableCurrencies([
        { code: 'BTC', name: 'Bitcoin', symbol: '₿', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', enabled: true, min_amount: 0.000000001, decimals: 18, trust_wallet_compatible: true },
        { code: 'USDT', name: 'Tether', symbol: '₮', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true },
        { code: 'USDC', name: 'USD Coin', symbol: '$', enabled: true, min_amount: 0.000001, decimals: 6, trust_wallet_compatible: true },
        { code: 'LTC', name: 'Litecoin', symbol: 'Ł', enabled: true, min_amount: 0.00000001, decimals: 8, trust_wallet_compatible: true }
      ]);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  useEffect(() => {
    loadUserAndSettings();
    loadAvailableCurrencies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateWalletAddress = async (crypto: string, address: string): Promise<boolean> => {
    if (!address.trim()) return false;
    
    try {
      setValidationStates(prev => ({ ...prev, [crypto]: 'validating' }));
      
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), currency: crypto })
      });
      
      if (response.ok) {
        const data = await response.json();
        const isValid = data.validation?.valid || false;
        setValidationStates(prev => ({ ...prev, [crypto]: isValid ? 'valid' : 'invalid' }));
        return isValid;
      }
      
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }));
      return false;
    } catch (error) {
      console.error('Address validation failed:', error);
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }));
      return false;
    }
  };

  const handleGenerateWallets = async () => {
    try {
      setIsGenerating(true);
      
      // Get popular currencies for generation
      const popularCurrencies = ['BTC', 'ETH', 'LTC', 'SOL', 'BNB', 'MATIC', 'TRX', 'USDT', 'USDC'];
      
      const response = await fetch('/api/wallets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencies: popularCurrencies,
          generation_method: 'trust_wallet'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate wallets');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Wallet generation failed');
      }
      
      // Convert generated wallets to our format
      const generatedWallets: Record<string, string> = {};
      result.data.wallets.forEach((wallet: GeneratedWallet) => {
        generatedWallets[wallet.currency] = wallet.address;
      });
      
      setSettings(prev => ({
        ...prev,
        wallets: { ...prev.wallets, ...generatedWallets }
      }));
      
      setGeneratedMnemonic(result.mnemonic);
      
      toast.success(`Generated ${result.data.wallets.length} wallet addresses!`);
      
    } catch (error) {
      console.error('Wallet generation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate wallets');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddWallet = () => {
    const availableCryptos = availableCurrencies.filter(
      crypto => !settings.wallets[crypto.code] && crypto.trust_wallet_compatible
    );
    
    if (availableCryptos.length > 0) {
      const firstAvailable = availableCryptos[0].code;
      setSettings(prev => ({
        ...prev,
        wallets: { ...prev.wallets, [firstAvailable]: '' }
      }));
    }
  };

  const handleRemoveWallet = (crypto: string) => {
    const newWallets = { ...settings.wallets };
    delete newWallets[crypto];
    setSettings(prev => ({ ...prev, wallets: newWallets }));
    
    // Clear validation state
    const newValidationStates = { ...validationStates };
    delete newValidationStates[crypto];
    setValidationStates(newValidationStates);
  };

  const handleWalletChange = (crypto: string, address: string) => {
    setSettings(prev => ({
      ...prev,
      wallets: { ...prev.wallets, [crypto]: address }
    }));
    
    // Reset validation state
    setValidationStates(prev => ({ ...prev, [crypto]: null }));
    
    // Validate address after a short delay
    if (address.trim()) {
      setTimeout(() => validateWalletAddress(crypto, address), 500);
    }
  };

  const handleCurrencyChange = (oldCrypto: string, newCrypto: string) => {
    const newWallets = { ...settings.wallets };
    const address = newWallets[oldCrypto];
    delete newWallets[oldCrypto];
    newWallets[newCrypto] = address;
    
    setSettings(prev => ({ ...prev, wallets: newWallets }));
    
    // Update validation states
    const newValidationStates = { ...validationStates };
    delete newValidationStates[oldCrypto];
    setValidationStates(newValidationStates);
    
    // Validate new currency if address exists
    if (address.trim()) {
      validateWalletAddress(newCrypto, address);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Validate all wallet addresses
      const validationPromises = Object.entries(settings.wallets).map(async ([crypto, address]) => {
        if (address.trim()) {
          const isValid = await validateWalletAddress(crypto, address);
          if (!isValid) {
            throw new Error(`Invalid ${crypto} address format`);
          }
        }
      });

      await Promise.all(validationPromises);

      // Update merchant settings
      const { error: merchantError } = await supabase
        .from('merchants')
        .update({
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          auto_forward_enabled: settings.payment_config.auto_forward,
          fee_percentage: settings.payment_config.fee_percentage,
          auto_convert_fee: settings.payment_config.auto_convert_fee,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (merchantError) {
        throw merchantError;
      }

      // Get merchant ID
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (merchant) {
        // Delete existing wallets
        await supabase
          .from('merchant_wallets')
          .delete()
          .eq('merchant_id', merchant.id);

        // Insert new wallets
        const walletInserts = Object.entries(settings.wallets)
          .filter(([, address]) => address.trim())
          .map(([currency, address]) => ({
            merchant_id: merchant.id,
            currency,
            wallet_address: address.trim(),
            is_active: true
          }));

        if (walletInserts.length > 0) {
          const { error: walletError } = await supabase
            .from('merchant_wallets')
            .insert(walletInserts);

          if (walletError) {
            throw walletError;
          }
        }
      }

      toast.success('Settings saved successfully!');

    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getCurrencyInfo = (code: string) => {
    return availableCurrencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      trust_wallet_compatible: true
    };
  };

  const getValidationIcon = (crypto: string) => {
    const state = validationStates[crypto];
    switch (state) {
      case 'validating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const copyMnemonic = async () => {
    if (generatedMnemonic) {
      await navigator.clipboard.writeText(generatedMnemonic);
      toast.success('Mnemonic copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-[#7f5efd]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your payment settings and wallet addresses</p>
          </div>
        </div>

        <Tabs defaultValue="wallets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallets">Wallet Management</TabsTrigger>
            <TabsTrigger value="payment">Payment Settings</TabsTrigger>
            <TabsTrigger value="conversion">Auto-Conversion</TabsTrigger>
          </TabsList>

          {/* Wallet Management Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Crypto Wallets</span>
                </CardTitle>
                <CardDescription>
                  Configure where you want to receive cryptocurrency payments. 
                  We support {availableCurrencies.length}+ cryptocurrencies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generate Wallets Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Quick Setup</h3>
                    <Button
                      onClick={handleGenerateWallets}
                      disabled={isGenerating || loadingCurrencies}
                      className="bg-[#7f5efd] hover:bg-[#7f5efd]/90"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Generate New Wallets
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Generate Trust Wallet compatible addresses for popular cryptocurrencies. 
                      You&apos;ll receive a recovery phrase to import into any compatible wallet.
                    </AlertDescription>
                  </Alert>

                  {generatedMnemonic && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <strong>Your Recovery Phrase (Save Securely):</strong>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMnemonic(!showMnemonic)}
                              >
                                {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyMnemonic}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-2 bg-white rounded font-mono text-sm">
                            {showMnemonic ? generatedMnemonic : '••• ••• ••• ••• ••• ••• ••• ••• ••• ••• ••• •••'}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Wallet Inputs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Wallet Addresses</h3>
                  
                  {Object.entries(settings.wallets).map(([crypto, address]) => {
                    const currencyInfo = getCurrencyInfo(crypto);
                    const availableForChange = availableCurrencies.filter(
                      c => c.code !== crypto && !settings.wallets[c.code] && c.trust_wallet_compatible
                    );
                    
                    return (
                      <div key={crypto} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Select
                              value={crypto}
                              onValueChange={(newCrypto) => handleCurrencyChange(crypto, newCrypto)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={crypto}>
                                  {currencyInfo.symbol} {crypto}
                                </SelectItem>
                                {availableForChange.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-600">
                              {currencyInfo.name}
                            </span>
                            {currencyInfo.network && (
                              <Badge variant="outline" className="text-xs">
                                {currencyInfo.network}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWallet(crypto)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder={`Enter your ${crypto} wallet address`}
                            value={address}
                            onChange={(e) => handleWalletChange(crypto, e.target.value)}
                            className={`font-mono text-sm pr-10 ${
                              validationStates[crypto] === 'valid' ? 'border-green-300 focus:border-green-500' :
                              validationStates[crypto] === 'invalid' ? 'border-red-300 focus:border-red-500' : ''
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {getValidationIcon(crypto)}
                          </div>
                        </div>
                        {validationStates[crypto] === 'valid' && (
                          <p className="text-sm text-green-600">✓ Valid {crypto} address</p>
                        )}
                        {validationStates[crypto] === 'invalid' && (
                          <p className="text-sm text-red-600">✗ Invalid {crypto} address format</p>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Wallet Button */}
                  {Object.keys(settings.wallets).length < availableCurrencies.filter(c => c.trust_wallet_compatible).length && (
                    <Button
                      variant="outline"
                      onClick={handleAddWallet}
                      className="w-full border-dashed"
                      disabled={loadingCurrencies}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Wallet
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
                <CardDescription>
                  Configure how payments are processed and forwarded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-Forward Payments</h3>
                    <p className="text-sm text-gray-600">
                      Automatically forward payments to your wallets
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      payment_config: {
                        ...prev.payment_config,
                        auto_forward: !prev.payment_config.auto_forward
                      }
                    }))}
                  >
                    {settings.payment_config.auto_forward ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Fee (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={settings.payment_config.fee_percentage}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payment_config: {
                        ...prev.payment_config,
                        fee_percentage: parseFloat(e.target.value) || 0
                      }
                    }))}
                  />
                  <p className="text-xs text-gray-500">
                    Fee charged on each transaction (0-10%)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto-Conversion Tab */}
          <TabsContent value="conversion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Conversion Settings</CardTitle>
                <CardDescription>
                  Automatically convert received payments to your preferred currency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Auto-Conversion</h3>
                    <p className="text-sm text-gray-600">
                      Convert all payments to a single currency
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      auto_convert_enabled: !prev.auto_convert_enabled
                    }))}
                  >
                    {settings.auto_convert_enabled ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </Button>
                </div>

                {settings.auto_convert_enabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preferred Payout Currency</label>
                      <Select
                        value={settings.preferred_payout_currency || ''}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          preferred_payout_currency: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCurrencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Conversion Fee (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={settings.payment_config.auto_convert_fee}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment_config: {
                            ...prev.payment_config,
                            auto_convert_fee: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                      <p className="text-xs text-gray-500">
                        Additional fee for currency conversion (0-5%)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

