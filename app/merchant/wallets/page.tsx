"use client"

import React, { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import {
  Save,
  CheckCircle,
  Loader2,
  HelpCircle,
  Star
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';

import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import WalletsManager from '@/app/components/settings/WalletsManager';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';
import Tooltip from '@/app/components/ui/tooltip';
import { RECOMMENDED_CURRENCIES } from '@/lib/recommended-currencies';

interface MerchantSettings {
  // Wallet settings
  wallets: Record<string, string>;
  wallet_extra_ids?: Record<string, string>;
  // Other settings (kept for compatibility)
  business_name: string;
  business_type: string;
  industry: string;
  business_description: string;
  website: string;
  phone_number: string;
  timezone: string;
  business_address: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  charge_customer_fee: boolean;
  auto_convert_enabled: boolean;
  preferred_payout_currency: string | null;
  payment_config: {
    auto_forward?: boolean;
    fee_percentage: number;
    auto_convert_fee?: number;
    no_convert_fee?: number;
  };
  tax_enabled: boolean;
  tax_rates: Array<{ id: string; label: string; percentage: string }>;
  tax_strategy: 'origin' | 'destination' | 'custom';
  sales_type: 'local' | 'online' | 'both';
}

// Recommended currencies (shared with onboarding step 3)
const recommendedCurrencies = RECOMMENDED_CURRENCIES

export default function WalletsPage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState<MerchantSettings | null>(null);
  const [focusCurrency, setFocusCurrency] = useState<string | undefined>();
  const [settings, setSettings] = useState<MerchantSettings>({
    // Wallet settings
    wallets: {},
    wallet_extra_ids: {},
    // Other settings (defaults)
    business_name: '',
    business_type: '',
    industry: '',
    business_description: '',
    website: '',
    phone_number: '',
    timezone: 'US/Eastern',
    business_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US'
    },
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    payment_config: {
      auto_forward: false,
      fee_percentage: 0.5,
      no_convert_fee: 0.5
    },
    tax_enabled: false,
    tax_rates: [{ id: '1', label: 'Sales Tax', percentage: '0' }],
    tax_strategy: 'origin',
    sales_type: 'online'
  });
  const router = useRouter();

  // Fetch user and settings
  useEffect(() => {
    const fetchUserAndSettings = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/login');
          return;
        }
        setUser(user as unknown as Record<string, unknown>);

        // Fetch settings from API
        const response = await fetch('/api/merchants/settings');
        if (response.ok) {
          const data = await response.json();
          if (data && data.settings) {
            const updatedSettings = { ...settings, ...data.settings };
            setSettings(updatedSettings);
            setLastSavedSettings(updatedSettings);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndSettings();
  }, [router]);

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      setSuccess(false);

      const response = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
      setLastSavedSettings(settings);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save functionality
  const autoSave = async (newSettings: MerchantSettings) => {
    if (JSON.stringify(newSettings) === JSON.stringify(lastSavedSettings)) {
      return; // No changes to save
    }
    
    try {
      setSaving(true);

      const response = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setLastSavedSettings(newSettings);

    } catch (error) {
      console.error('Failed to auto-save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (!lastSavedSettings) return; // Don't auto-save on initial load

    const timeoutId = setTimeout(() => {
      autoSave(settings);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [settings, lastSavedSettings]);

  // Handle currency selection from recommended currencies tooltip
  const handleCurrencyClick = (currencyCode: string) => {
    setFocusCurrency(currencyCode);
    // Clear the focus after a short delay to allow re-clicking the same currency
    setTimeout(() => setFocusCurrency(undefined), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Wallets', href: '/merchant/wallets' }
          ]} 
        />
        
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="font-phonic text-3xl font-normal text-gray-900 mb-4">Wallet Addresses</h1>
            <p className="font-phonic text-base font-normal text-gray-600">Manage your cryptocurrency wallet addresses for receiving payments</p>
          </div>
        </div>

        

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="font-phonic text-base font-normal text-green-800">
              Your wallet settings have been updated successfully.
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Guide Modal */}
        <Dialog open={showTrustWalletGuide} onOpenChange={setShowTrustWalletGuide}>
          <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-3xl md:max-w-4xl bg-transparent border-0 shadow-none p-0 max-h-[90vh] overflow-y-auto overscroll-contain">
            <TrustWalletGuide
              onComplete={() => setShowTrustWalletGuide(false)}
              onSkip={() => setShowTrustWalletGuide(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Setup Guide + Recommended (matches onboarding step 3) */}
        <div className="flex justify-center items-center gap-6">
          <Button
            variant="outline"
            onClick={() => setShowTrustWalletGuide(true)}
            className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
          >
            <HelpCircle className="h-4 w-4" />
            Setup Guide
          </Button>

          <Tooltip
            trigger={
              <Button
                variant="outline"
                className="flex items-center gap-2 border-[#7f5efd]/30 text-[#7f5efd] hover:bg-[#7f5efd]/5 hover:border-[#7f5efd]/50 shadow-sm transition-all duration-200"
              >
                <Star className="h-4 w-4" />
                Highly Recommended
              </Button>
            }
            title="Recommended Networks & Wallets"
            description="These are the most popular cryptocurrencies that Cryptrac merchants typically accept for payments"
            recommendedCurrencies={recommendedCurrencies}
            onCurrencyClick={handleCurrencyClick}
          />
        </div>

        {/* Wallets Manager */}
        <WalletsManager
          settings={settings}
          setSettings={setSettings}
          focusCurrency={focusCurrency}
        />
      </div>
  );
}
