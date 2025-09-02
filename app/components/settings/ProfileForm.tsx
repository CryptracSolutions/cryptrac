"use client"

import React from 'react';
import {
  Building,
  Phone,
  MapPin,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

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

  const handleEmailChange = (newEmail: string) => {
    if (newEmail !== settings.email) {
      setPendingEmailChange(newEmail);
      setShowEmailConfirmDialog(true);
    } else {
      setSettings((prev: MerchantSettings) => ({ ...prev, email: newEmail }));
    }
  };

  const confirmEmailChange = () => {
    setSettings((prev: MerchantSettings) => ({ ...prev, email: pendingEmailChange }));
    onEmailChange?.(pendingEmailChange);
    setShowEmailConfirmDialog(false);
    setPendingEmailChange('');
  };

  const cancelEmailChange = () => {
    setShowEmailConfirmDialog(false);
    setPendingEmailChange('');
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
        <CardHeader>
          <CardTitle className="font-phonic text-2xl font-normal flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
              <Building className="h-6 w-6 text-white" />
            </div>
            Business Information
          </CardTitle>
          <CardDescription className="font-capsule text-base font-normal">
            Basic information about your business and operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-phonic text-base font-normal text-gray-700">Business Name *</label>
              <Input
                value={settings.business_name}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter your business name"
                className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-phonic text-base font-normal text-gray-700">Business Type</label>
              <Select 
                value={settings.business_type} 
                onValueChange={(value) => setSettings((prev: MerchantSettings) => ({ ...prev, business_type: value }))}
              >
                <SelectTrigger className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors">
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
              <label className="font-phonic text-base font-normal text-gray-700">Industry *</label>
              <Select 
                value={settings.industry} 
                onValueChange={(value) => setSettings((prev: MerchantSettings) => ({ ...prev, industry: value }))}
              >
                <SelectTrigger className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors">
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
              <label className="font-phonic text-base font-normal text-gray-700">Website</label>
              <Input
                value={settings.website}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, website: e.target.value }))}
                placeholder="https://your-website.com"
                type="url"
                className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-phonic text-base font-normal text-gray-700">Business Description</label>
            <Input
              value={settings.business_description}
              onChange={(e) => setSettings((prev: MerchantSettings) => ({ ...prev, business_description: e.target.value }))}
              placeholder="Brief description of your business"
              className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
        <CardHeader>
          <CardTitle className="font-phonic text-2xl font-normal flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
              <Phone className="h-6 w-6 text-white" />
            </div>
            Contact Information
          </CardTitle>
          <CardDescription className="font-capsule text-base font-normal">
            Contact details and business preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-phonic text-base font-normal text-gray-700">Phone Number *</label>
              <Input
                value={settings.phone_number}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
                maxLength={14}
                className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="font-phonic text-base font-normal text-gray-700">Timezone</label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings((prev: MerchantSettings) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors">
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
            <label className="font-phonic text-base font-normal text-gray-700">Email Address *</label>
            <Input
              value={settings.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="your.email@example.com"
              type="email"
              className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
        <CardHeader>
          <CardTitle className="font-phonic text-2xl font-normal flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            Business Address
          </CardTitle>
          <CardDescription className="font-capsule text-base font-normal">
            Your business address for tax and compliance purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-phonic text-base font-normal text-gray-700">Street Address *</label>
              <Input
                value={settings.business_address.street || ''}
                onChange={(e) => setSettings((prev: MerchantSettings) => ({
                  ...prev,
                  business_address: { ...prev.business_address, street: e.target.value }
                }))}
                placeholder="123 Main Street"
                className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="font-phonic text-base font-normal text-gray-700">City *</label>
                <Input
                  value={settings.business_address.city || ''}
                  onChange={(e) => setSettings((prev: MerchantSettings) => ({
                    ...prev,
                    business_address: { ...prev.business_address, city: e.target.value }
                  }))}
                  placeholder="San Francisco"
                  className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-phonic text-base font-normal text-gray-700">State *</label>
                <Select 
                  value={settings.business_address.state || ''} 
                  onValueChange={(value) => setSettings((prev: MerchantSettings) => ({
                    ...prev,
                    business_address: { ...prev.business_address, state: value }
                  }))}
                >
                  <SelectTrigger className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors">
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
                <label className="font-phonic text-base font-normal text-gray-700">ZIP Code *</label>
                <Input
                  value={settings.business_address.zip_code || ''}
                  onChange={(e) => handleZipChange(e.target.value)}
                  placeholder="94105"
                  maxLength={10}
                  className="h-12 font-capsule text-base font-normal border-gray-200 focus:border-[#7f5efd] focus:ring-[#7f5efd] transition-colors"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Change Confirmation Dialog */}
      <Dialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-phonic text-xl font-normal">Confirm Email Change</DialogTitle>
            <DialogDescription className="font-capsule text-base font-normal">
              You are about to change your email address from <strong>{settings.email}</strong> to <strong>{pendingEmailChange}</strong>.
              <br /><br />
              This will update your login credentials and you will need to verify the new email address. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelEmailChange}
              className="font-capsule text-base font-normal"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEmailChange}
              className="font-capsule text-base font-normal bg-[#7f5efd] hover:bg-[#7c3aed]"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
