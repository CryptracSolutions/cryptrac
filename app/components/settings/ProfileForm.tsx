"use client"

import React from 'react';
import {
  Building,
  Phone,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { supabase } from '@/lib/supabase-browser';
import { useSwipeToClose } from '@/lib/hooks/use-swipe-to-close';

// Business types
const BUSINESS_TYPES = [
  'Individual/Sole Proprietor',
  'Corporation',
  'Partnership',
  'Non-Profit',
  'LLC',
  'Other'
];

// Industry options (aligned with onboarding)
const INDUSTRIES = [
  'E-commerce',
  'Freelance',
  'Retail',
  'Consulting',
  'Software/SaaS',
  'Digital Services',
  'Content Creation',
  'Education',
  'Healthcare',
  'Real Estate',
  'Food & Beverage',
  'Travel & Tourism',
  'Finance',
  'Non-profit',
  'Other'
];

// US States
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

// US Timezones
const US_TIMEZONES = [
  { code: 'America/New_York', name: 'Eastern Time (ET)' },
  { code: 'America/Chicago', name: 'Central Time (CT)' },
  { code: 'America/Denver', name: 'Mountain Time (MT)' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
  { code: 'America/Anchorage', name: 'Alaska Time (AKT)' },
  { code: 'Pacific/Honolulu', name: 'Hawaii Time (HT)' }
];

interface MerchantSettings {
  business_name: string;
  business_type: string;
  industry: string;
  website: string;
  business_description: string;
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

interface ProfileFormProps {
  settings: MerchantSettings;
  setSettings: React.Dispatch<React.SetStateAction<MerchantSettings>>;
  handlePhoneChange: (value: string) => void;
  handleZipChange: (value: string) => void;
  onEmailChange?: (newEmail: string) => void;
}

export default function ProfileForm({ settings, setSettings, handlePhoneChange, handleZipChange, onEmailChange }: ProfileFormProps) {
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = React.useState(false);
  const [pendingEmailChange, setPendingEmailChange] = React.useState<string>('');
  const [savingEmail, setSavingEmail] = React.useState(false);
  const emailModalRef = React.useRef<HTMLDivElement>(null);

  const openEmailChangeModal = () => {
    setPendingEmailChange(settings.email || '');
    setShowEmailConfirmDialog(true);
  };

  const confirmEmailChange = async () => {
    const trimmed = pendingEmailChange.trim();
    if (!trimmed || trimmed === settings.email) {
      setShowEmailConfirmDialog(false);
      return;
    }
    try {
      setSavingEmail(true);
      const payload = { ...settings, email: trimmed };
      const res = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save email');
      setSettings((prev: MerchantSettings) => ({ ...prev, email: trimmed }));
      onEmailChange?.(trimmed);
      // Refresh auth session so header/nav reflects new email
      try { await supabase.auth.refreshSession(); } catch {}
      setShowEmailConfirmDialog(false);
      setPendingEmailChange('');
    } catch (err) {
      console.error(err);
      // Silent failure - no toast notification
    } finally {
      setSavingEmail(false);
    }
  };

  const cancelEmailChange = () => {
    setShowEmailConfirmDialog(false);
    setPendingEmailChange('');
  };

  useSwipeToClose(emailModalRef, {
    onClose: cancelEmailChange,
    directions: ['down'],
    threshold: 60,
    restraint: 100,
    enabled: showEmailConfirmDialog,
  });

  // Close on Escape
  React.useEffect(() => {
    if (!showEmailConfirmDialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEmailChange();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showEmailConfirmDialog]);

  return (
    <div className="space-y-8 max-md:space-y-6 max-md:px-3">
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
        <CardHeader className="p-6 max-md:p-4">
          <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-4">
            <div className="space-y-2 max-md:space-y-3">
              <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-[#7f5efd] rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
                Business Information
              </CardTitle>
              <CardDescription className="font-capsule text-sm text-gray-600">
                Basic information about your business and operations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-8 max-md:p-4 max-md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4">
            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Business Name *</label>
              <Input
                value={settings.business_name}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter your business name"
                className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Business Type</label>
              <Select
                value={settings.business_type}
                onValueChange={(value) => setSettings((prev: MerchantSettings) => ({ ...prev, business_type: value }))}
              >
                <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="font-capsule text-base font-normal">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Industry *</label>
              <Select
                value={settings.industry}
                onValueChange={(value) => setSettings((prev: MerchantSettings) => ({ ...prev, industry: value }))}
              >
                <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(industry => (
                    <SelectItem key={industry} value={industry} className="font-capsule text-base font-normal">{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Website</label>
              <Input
                value={settings.website}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, website: e.target.value }))}
                placeholder="https://your-website.com"
                type="url"
                className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-phonic text-sm font-normal text-gray-700">Business Description</label>
            <Input
              value={settings.business_description}
              onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, business_description: e.target.value }))}
              placeholder="Brief description of your business"
              className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
        <CardHeader className="p-6 max-md:p-4">
          <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-4">
            <div className="space-y-2 max-md:space-y-3">
              <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-[#7f5efd] rounded-lg">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                Contact Information
              </CardTitle>
              <CardDescription className="font-capsule text-sm text-gray-600">
                Contact details and business preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-8 max-md:p-4 max-md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4">
            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">First Name *</label>
              <Input
                value={settings.first_name}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter your first name"
                className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Last Name *</label>
              <Input
                value={settings.last_name}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter your last name"
                className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Phone Number *</label>
              <Input
                value={settings.phone_number}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
                maxLength={14}
                className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Timezone</label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings((prev: MerchantSettings) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {US_TIMEZONES.map(timezone => (
                    <SelectItem key={timezone.code} value={timezone.code} className="font-capsule text-base font-normal">
                      {timezone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-phonic text-sm font-normal text-gray-700">Email Address *</label>
            <div className="flex flex-wrap items-start gap-3 max-md:flex-col max-md:items-stretch">
              <div className="flex-1 min-w-[220px]">
                <Input
                  value={settings.email}
                  readOnly
                  placeholder="your.email@example.com"
                  type="email"
                  className="w-full h-11 bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                  required
                />
              </div>
              <Button
                type="button"
                onClick={openEmailChangeModal}
                className="shrink-0 h-11 bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
              >
                Change Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
        <CardHeader className="p-6 max-md:p-4">
          <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-4">
            <div className="space-y-2 max-md:space-y-3">
              <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-[#7f5efd] rounded-lg">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                Business Address
              </CardTitle>
              <CardDescription className="font-capsule text-sm text-gray-600">
                Your business address for tax and compliance purposes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-8 max-md:p-4 max-md:space-y-6">
          <div className="space-y-6 max-md:space-y-4">
            <div className="space-y-2">
              <label className="font-phonic text-sm font-normal text-gray-700">Street Address *</label>
              <Input
                value={settings.business_address.street || ''}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({
                  ...prev,
                  business_address: { ...prev.business_address, street: e.target.value }
                }))}
                placeholder="123 Main Street"
                className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-md:gap-4">
              <div className="space-y-2">
                <label className="font-phonic text-sm font-normal text-gray-700">City *</label>
                <Input
                  value={settings.business_address.city || ''}
                  onChange={(e) => setSettings((prev: MerchantSettings) => ({
                    ...prev,
                    business_address: { ...prev.business_address, city: e.target.value }
                  }))}
                  placeholder="San Francisco"
                  className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-phonic text-sm font-normal text-gray-700">State *</label>
                <Select
                  value={settings.business_address.state || ''}
                  onValueChange={(value) => setSettings((prev: MerchantSettings) => ({
                    ...prev,
                    business_address: { ...prev.business_address, state: value }
                  }))}
                >
                  <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code} className="font-capsule text-base font-normal">
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-phonic text-sm font-normal text-gray-700">ZIP Code *</label>
                <Input
                  value={settings.business_address.zip_code || ''}
                  onChange={(e) => handleZipChange(e.target.value)}
                  placeholder="94105"
                  maxLength={10}
                  className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Change Modal (custom implementation) */}
      {showEmailConfirmDialog && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 z-40"
            onClick={cancelEmailChange}
            aria-hidden="true"
          />
          <div
            ref={emailModalRef}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-gray-200 bg-white p-6 shadow-2xl max-md:left-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:translate-y-0 max-md:max-w-none max-md:rounded-t-2xl max-md:border-gray-100 max-md:p-5"
          >
            <div className="flex items-start justify-between max-md:flex-col max-md:items-stretch max-md:gap-4">
              <div>
                <h2 className="font-phonic text-xl font-normal text-gray-900">Confirm Email Change</h2>
                <p className="mt-2 font-capsule text-base font-normal text-gray-700">
                  Enter your new email address. This updates your login and may require verification.
                </p>
              </div>
              <button
                onClick={cancelEmailChange}
                aria-label="Close"
                className="ml-4 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 max-md:ml-auto"
              >
                ✕
              </button>
            </div>
            <form
              className="mt-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!pendingEmailChange.trim() || pendingEmailChange.trim() === settings.email) return;
                confirmEmailChange();
              }}
            >
              <label className="font-phonic text-sm font-normal text-gray-700">New Email</label>
              <Input
                autoFocus
                value={pendingEmailChange}
                onChange={(e) => setPendingEmailChange(e.target.value)}
                placeholder="new.email@example.com"
                type="email"
                className="mt-2 w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                required
              />
              <div className="mt-6 flex justify-end gap-3 max-md:flex-col max-md:w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEmailChange}
                  size="sm"
                  className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200 max-md:w-full max-md:h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingEmail || !pendingEmailChange.trim() || pendingEmailChange.trim() === settings.email}
                  size="sm"
                  className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white max-md:w-full max-md:h-11"
                >
                  {savingEmail ? 'Saving…' : 'Confirm Change'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
