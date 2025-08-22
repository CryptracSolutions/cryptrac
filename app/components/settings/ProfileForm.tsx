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

// Business types
const BUSINESS_TYPES = [
  'Individual/Sole Proprietor',
  'Corporation',
  'Partnership',
  'Non-Profit',
  'LLC',
  'Other'
];

// Industry options
const INDUSTRIES = [
  'Retail',
  'E-commerce',
  'Food & Beverage',
  'Technology',
  'Services',
  'Healthcare',
  'Education',
  'Entertainment',
  'Real Estate',
  'Manufacturing',
  'Construction',
  'Transportation',
  'Finance',
  'Agriculture',
  'Corporation',
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

interface ProfileFormProps {
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  handlePhoneChange: (value: string) => void;
  handleZipChange: (value: string) => void;
}

export default function ProfileForm({ settings, setSettings, handlePhoneChange, handleZipChange }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Basic information about your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name *</label>
              <Input
                value={settings.business_name}
                onChange={(e) => setSettings((prev: any) => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter your business name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Type</label>
              <Select 
                value={settings.business_type} 
                onValueChange={(value) => setSettings((prev: any) => ({ ...prev, business_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry *</label>
              <Select 
                value={settings.industry} 
                onValueChange={(value) => setSettings((prev: any) => ({ ...prev, industry: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                value={settings.website}
                onChange={(e) => setSettings((prev: any) => ({ ...prev, website: e.target.value }))}
                placeholder="https://your-website.com"
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business Description</label>
            <Input
              value={settings.business_description}
              onChange={(e) => setSettings((prev: any) => ({ ...prev, business_description: e.target.value }))}
              placeholder="Brief description of your business"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Contact details for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                value={settings.phone_number}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => setSettings((prev: any) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {US_TIMEZONES.map(timezone => (
                    <SelectItem key={timezone.code} value={timezone.code}>
                      {timezone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Address
          </CardTitle>
          <CardDescription>
            Your business address for tax and compliance purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Street Address *</label>
              <Input
                value={settings.business_address?.street || ''}
                onChange={(e) => setSettings((prev: any) => ({
                  ...prev,
                  business_address: { ...prev.business_address, street: e.target.value }
                }))}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City *</label>
                <Input
                  value={settings.business_address?.city || ''}
                  onChange={(e) => setSettings((prev: any) => ({
                    ...prev,
                    business_address: { ...prev.business_address, city: e.target.value }
                  }))}
                  placeholder="San Francisco"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">State *</label>
                <Select 
                  value={settings.business_address?.state || ''} 
                  onValueChange={(value) => setSettings((prev: any) => ({
                    ...prev,
                    business_address: { ...prev.business_address, state: value }
                  }))}
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium">ZIP Code *</label>
                <Input
                  value={settings.business_address?.zip_code || ''}
                  onChange={(e) => handleZipChange(e.target.value)}
                  placeholder="94105"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
