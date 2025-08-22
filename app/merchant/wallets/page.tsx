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
  tax_rates: any[];
  tax_strategy: 'origin' | 'destination' | 'custom';
  sales_type: 'local' | 'online' | 'both';
}

export default function WalletsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false);
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
        setUser(user);

        // Fetch settings from API
        const response = await fetch('/api/merchants/settings');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setSettings(prev => ({ ...prev, ...data }));
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
      toast.success('Wallet settings updated successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <BackToDashboard />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet Addresses</h1>
            <p className="text-gray-600">Manage your cryptocurrency wallet addresses for receiving payments</p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

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
