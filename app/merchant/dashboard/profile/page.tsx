"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTimezone } from '@/lib/contexts/TimezoneContext';

export const dynamic = 'force-dynamic';
import {
  Save,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';

import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import ProfileForm from '@/app/components/settings/ProfileForm';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';

interface MerchantSettings {
  // Profile information
  business_name: string;
  business_type: string;
  industry: string;
  business_description: string;
  website: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  timezone: string;
  email: string;
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
  tax_rates: Array<{ id: string; label: string; percentage: string }>;
  tax_strategy: 'origin' | 'destination' | 'custom';
  sales_type: 'local' | 'online' | 'both';
}

export default function ProfilePage() {
  const { timezone: currentTimezone, updateTimezone } = useTimezone();
  const [, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSettingsRef = useRef<string>('');
  const [settings, setSettings] = useState<MerchantSettings>({
    // Profile
    business_name: '',
    business_type: '',
    industry: '',
    business_description: '',
    website: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    timezone: 'America/New_York',
    email: '',
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

  // Auto-save function with debouncing
  const autoSaveSettings = useCallback(async (newSettings: MerchantSettings) => {
    // Check if settings have changed
    const currentSettingsStr = JSON.stringify(newSettings);
    if (currentSettingsStr === lastSavedSettingsRef.current) {
      return; // No changes, skip save
    }

    try {
      setAutoSaving(true);

      const response = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-save settings');
      }

      lastSavedSettingsRef.current = currentSettingsStr;
      
      // Update the timezone context if it changed
      if (newSettings.timezone !== currentTimezone) {
        await updateTimezone(newSettings.timezone);
      }
      
      // Show brief success indicator
      toast.success('Changes saved', { duration: 1500 });
    } catch (error) {
      console.error('Failed to auto-save settings:', error);
      toast.error('Failed to save changes');
    } finally {
      setAutoSaving(false);
    }
  }, [currentTimezone, updateTimezone]);

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback((newSettings: MerchantSettings) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveSettings(newSettings);
    }, 1500);
  }, [autoSaveSettings]);

  // Update settings with auto-save
  const updateSettings = useCallback((updater: (prev: MerchantSettings) => MerchantSettings) => {
    setSettings((prev) => {
      const newSettings = updater(prev);
      triggerAutoSave(newSettings);
      return newSettings;
    });
  }, [triggerAutoSave]);

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
            const loadedSettings = {
              ...settings,
              ...data.settings,
              email: data.settings.email || user.email || ''
            };
            setSettings(loadedSettings);
            lastSavedSettingsRef.current = JSON.stringify(loadedSettings);
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
              toast.success('Saved');
      
      // Update the timezone context if it changed
      if (settings.timezone !== currentTimezone) {
        await updateTimezone(settings.timezone);
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Phone number formatting with auto-save
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    
    updateSettings(prev => ({ ...prev, phone_number: formatted }));
  };

  // ZIP code formatting with auto-save
  const handleZipChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
    }
    
    updateSettings(prev => ({
      ...prev,
      business_address: { ...prev.business_address, zip_code: formatted }
    }));
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
      <div className="px-6 py-8 space-y-8 max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Profile', href: '/merchant/dashboard/profile' }
          ]} 
        />
        
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="space-y-1">
            <h1 className="font-phonic text-2xl font-semibold tracking-tight text-gray-900">
              Business Profile
            </h1>
            <p className="font-capsule text-sm text-gray-600">
              Manage your business information and contact details
            </p>
          </div>
          <div className="flex items-center gap-3">
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="font-capsule">Auto-saving...</span>
              </div>
            )}
            <Button
              onClick={saveSettings}
              disabled={saving || autoSaving}
              className="flex items-center gap-2 bg-[#7f5efd] hover:bg-[#7c3aed] text-white transition-colors duration-200"
              size="default"
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
        </div>

        {/* Enhanced Success Alert */}
        {success && (
          <Alert className="border border-green-200 bg-green-50 shadow-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="font-capsule text-sm text-green-800">
              <strong>Profile Updated!</strong> Your business information has been saved successfully.
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Profile Form */}
        <ProfileForm
          settings={settings}
          setSettings={updateSettings}
          handlePhoneChange={handlePhoneChange}
          handleZipChange={handleZipChange}
          onEmailChange={(newEmail) => {
            console.log('Email change requested:', newEmail);
            // Email changes are handled separately with confirmation
          }}
        />
        </div>
    );
  }
