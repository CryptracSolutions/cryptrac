"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import {
  Save,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import ProfileForm from '@/app/components/settings/ProfileForm';

interface MerchantSettings {
  // Profile information
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
  // Other settings (kept for compatibility)
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
  tax_enabled: boolean;
  tax_rates: any[];
  tax_strategy: 'origin' | 'destination' | 'custom';
  sales_type: 'local' | 'online' | 'both';
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<MerchantSettings>({
    // Profile
    business_name: '',
    business_type: '',
    industry: '',
    business_description: '',
    website: '',
    phone_number: '',
    timezone: 'America/New_York',
    business_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US'
    },
    // Other settings (defaults)
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
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
          if (data && data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
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
      toast.success('Profile updated successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Phone number formatting
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    
    setSettings(prev => ({ ...prev, phone_number: formatted }));
  };

  // ZIP code formatting
  const handleZipChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
    }
    
    setSettings(prev => ({
      ...prev,
      business_address: { ...prev.business_address, zip_code: formatted }
    }));
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
              <Button 
                variant="outline" 
                onClick={() => router.push('/merchant/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your business information and contact details</p>
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
              Your profile has been updated successfully.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Form */}
        <ProfileForm
          settings={settings}
          setSettings={setSettings}
          handlePhoneChange={handlePhoneChange}
          handleZipChange={handleZipChange}
        />
      </div>
    </DashboardLayout>
  );
}
