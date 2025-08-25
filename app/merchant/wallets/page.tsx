"use client"

import React, { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import {
  Save,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import WalletsManager from '@/app/components/settings/WalletsManager';
import { BackToDashboard } from '@/app/components/ui/back-to-dashboard';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide';

interface MerchantSettings {
  // Wallet settings
  wallets: Record<string, string>;
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

export default function WalletsPage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState<MerchantSettings | null>(null);
  const [settings, setSettings] = useState<MerchantSettings>({
    // Wallet settings
    wallets: {},
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
      toast.success('Saved');
      
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
      toast.success('Saved');

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

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
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
          <div className="flex items-center gap-4">
            <BackToDashboard />
          </div>
          <div>
            <h1 className="heading-lg text-gray-900">Wallet Addresses</h1>
            <p className="text-body text-gray-600">Manage your cryptocurrency wallet addresses for receiving payments</p>
          </div>
        </div>

        {/* Auto-save indicator */}
        {saving && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your wallet settings have been updated successfully.
            </AlertDescription>
          </Alert>
        )}

        {/* Wallets Manager */}
        <WalletsManager
          settings={settings}
          setSettings={setSettings}
          setShowTrustWalletGuide={setShowTrustWalletGuide}
        />

        {/* Trust Wallet Guide Modal */}
        {showTrustWalletGuide && (
          <TrustWalletGuide 
            onComplete={() => setShowTrustWalletGuide(false)} 
            onSkip={() => setShowTrustWalletGuide(false)} 
          />
        )}
      </div>
    </DashboardLayout>
  );
}
