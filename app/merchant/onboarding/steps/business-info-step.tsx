"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { ArrowRight, ArrowLeft, Building2, MapPin, Phone } from 'lucide-react'

interface BusinessAddress {
  street: string
  city: string
  state: string
  zip_code: string
  country: string
}

interface BusinessInfoData {
  businessName: string
  website: string
  industry: string
  description: string
  businessType: string
  phoneNumber: string
  businessAddress: BusinessAddress
  timezone: string
}

interface BusinessInfoStepProps {
  data: BusinessInfoData
  onComplete: (data: BusinessInfoData) => void
  onPrevious: () => void
}

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
]

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'LLC',
  'Corporation',
  'Partnership',
  'Non-profit',
  'Other'
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
]

export default function BusinessInfoStep({ data, onComplete, onPrevious }: BusinessInfoStepProps) {
  const [formData, setFormData] = useState<BusinessInfoData>({
    businessName: data.businessName || '',
    website: data.website || '',
    industry: data.industry || '',
    description: data.description || '',
    businessType: data.businessType || '',
    phoneNumber: data.phoneNumber || '',
    businessAddress: data.businessAddress || {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US'
    },
    timezone: data.timezone || 'America/New_York'
  })
  
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const phoneNumber = value.replace(/[^\d]/g, '')
    const phoneNumberLength = phoneNumber.length
    
    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  // Validate phone number
  const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[^\d]/g, '')
    return cleaned.length === 10
  }

  // Validate ZIP code
  const isValidZipCode = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip)
  }

  // Address validation removed; accepting input without external verification

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number'
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select an industry'
    }

    // Address validation
    if (!formData.businessAddress.street.trim()) {
      newErrors['businessAddress.street'] = 'Street address is required'
    }

    if (!formData.businessAddress.city.trim()) {
      newErrors['businessAddress.city'] = 'City is required'
    }

    if (!formData.businessAddress.state) {
      newErrors['businessAddress.state'] = 'State is required'
    }

    if (!formData.businessAddress.zip_code.trim()) {
      newErrors['businessAddress.zip_code'] = 'ZIP code is required'
    } else if (!isValidZipCode(formData.businessAddress.zip_code)) {
      newErrors['businessAddress.zip_code'] = 'Please enter a valid ZIP code'
    }

    // Optional field validation
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Clean up data
    let cleanWebsite = formData.website.trim()
    if (cleanWebsite && !cleanWebsite.startsWith('http')) {
      cleanWebsite = `https://${cleanWebsite}`
    }

    const cleanedData = {
      ...formData,
      website: cleanWebsite,
      businessName: formData.businessName.trim(),
      description: formData.description.trim(),
      phoneNumber: formData.phoneNumber.replace(/[^\d]/g, ''), // Store as digits only
      businessAddress: {
        ...formData.businessAddress,
        street: formData.businessAddress.street.trim(),
        city: formData.businessAddress.city.trim(),
        zip_code: formData.businessAddress.zip_code.trim()
      }
    }

    onComplete(cleanedData)
    setIsSubmitting(false)
  }

  const handleInputChange = (field: string, value: string) => {
      if (field.includes('.')) {
        const [, child] = field.split('.')
        setFormData(prev => ({
          ...prev,
          businessAddress: {
            ...prev.businessAddress,
            [child]: value
          }
        }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleInputChange('phoneNumber', formatted)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-2xl font-bold text-gray-900 leading-tight">
              Complete your business profile
            </CardTitle>
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
              This information helps us customize your experience and ensure compliance with tax regulations.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Business Information Section */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 leading-snug">
                <Building2 className="w-6 h-6 text-[#7f5efd]" />
                Business Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Name */}
                <div className="space-y-2">
                  <label className="text-body font-medium text-gray-700">
                    Business Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className={`form-input-enhanced h-12 ${errors.businessName ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {errors.businessName && (
                    <p className="text-body-sm text-red-600">{errors.businessName}</p>
                  )}
                </div>

                {/* Business Type */}
                <div className="space-y-2">
                  <label className="text-body font-medium text-gray-700">
                    Business Type (Optional)
                  </label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleInputChange('businessType', value)}
                  >
                    <SelectTrigger className="form-input-enhanced h-12">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label className="text-body font-medium text-gray-700">
                    Industry *
                  </label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger className={`form-input-enhanced h-12 ${errors.industry ? 'border-red-300 focus:border-red-500' : ''}`}>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-red-600">{errors.industry}</p>
                  )}
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label className="text-body font-medium text-gray-700">
                    Website (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="www.yourwebsite.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className={`form-input-enhanced h-12 ${errors.website ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {errors.website && (
                    <p className="text-body-sm text-red-600">{errors.website}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-body font-medium text-gray-700">
                  Business Description (Optional)
                </label>
                <Textarea
                  placeholder="Briefly describe what your business does..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="form-input-enhanced resize-none"
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 leading-snug">
                <Phone className="w-6 h-6 text-[#7f5efd]" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-body font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`form-input-enhanced h-12 ${errors.phoneNumber ? 'border-red-300 focus:border-red-500' : ''}`}
                    maxLength={14}
                  />
                  {errors.phoneNumber && (
                    <p className="text-body-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    US phone number for support and verification
                  </p>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <label className="text-body font-medium text-gray-700">
                    Timezone
                  </label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => handleInputChange('timezone', value)}
                  >
                    <SelectTrigger className="form-input-enhanced h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {US_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Business Address Section */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 leading-snug">
                <MapPin className="w-6 h-6 text-[#7f5efd]" />
                Business Address
              </h3>
              
              <div className="space-y-6">
                {/* Street Address */}
                <div className="space-y-2">
                  <label className="text-body font-medium text-gray-700">
                    Street Address *
                  </label>
                  <Input
                    type="text"
                    placeholder="123 Main Street"
                    value={formData.businessAddress.street}
                    onChange={(e) => handleInputChange('businessAddress.street', e.target.value)}
                    className={`form-input-enhanced h-12 ${errors['businessAddress.street'] ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {errors['businessAddress.street'] && (
                    <p className="text-body-sm text-red-600">{errors['businessAddress.street']}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* City */}
                  <div className="space-y-2">
                                      <label className="text-body font-medium text-gray-700">
                    City *
                  </label>
                  <Input
                    type="text"
                    placeholder="San Francisco"
                    value={formData.businessAddress.city}
                    onChange={(e) => handleInputChange('businessAddress.city', e.target.value)}
                    className={`form-input-enhanced h-12 ${errors['businessAddress.city'] ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {errors['businessAddress.city'] && (
                    <p className="text-body-sm text-red-600">{errors['businessAddress.city']}</p>
                  )}
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                                      <label className="text-body font-medium text-gray-700">
                    State *
                  </label>
                    <Select 
                      value={formData.businessAddress.state} 
                      onValueChange={(value) => handleInputChange('businessAddress.state', value)}
                    >
                      <SelectTrigger className={`form-input-enhanced h-12 ${errors['businessAddress.state'] ? 'border-red-300 focus:border-red-500' : ''}`}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors['businessAddress.state'] && (
                      <p className="text-body-sm text-red-600">{errors['businessAddress.state']}</p>
                    )}
                  </div>

                  {/* ZIP Code */}
                  <div className="space-y-2">
                                      <label className="text-body font-medium text-gray-700">
                    ZIP Code *
                  </label>
                  <Input
                    type="text"
                    placeholder="94105"
                    value={formData.businessAddress.zip_code}
                    onChange={(e) => handleInputChange('businessAddress.zip_code', e.target.value)}
                    className={`form-input-enhanced h-12 ${errors['businessAddress.zip_code'] ? 'border-red-300 focus:border-red-500' : ''}`}
                    maxLength={10}
                  />
                  {errors['businessAddress.zip_code'] && (
                    <p className="text-body-sm text-red-600">{errors['businessAddress.zip_code']}</p>
                  )}
                  </div>
                </div>

              </div>
            </div>


            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white flex items-center"
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

