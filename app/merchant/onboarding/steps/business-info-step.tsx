"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { ArrowRight, ArrowLeft, Building2, MapPin, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'

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
  const [addressValidation, setAddressValidation] = useState<{
    isValidating: boolean
    isValid: boolean | null
    message: string
  }>({
    isValidating: false,
    isValid: null,
    message: ''
  })

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

  // Real-time address validation (simplified - in production use Google Places API)
  const validateAddress = async (address: BusinessAddress) => {
    if (!address.street || !address.city || !address.state || !address.zip_code) {
      return
    }

    setAddressValidation({ isValidating: true, isValid: null, message: 'Validating address...' })

    // Simulate API call - in production, use Google Places API or similar
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Basic validation logic (in production, use real address validation service)
    const isValid = address.street.length > 5 && 
                   address.city.length > 2 && 
                   US_STATES.includes(address.state) && 
                   isValidZipCode(address.zip_code)

    setAddressValidation({
      isValidating: false,
      isValid,
      message: isValid ? 'Address validated successfully' : 'Address could not be validated. Please check and try again.'
    })
  }

  // Debounced address validation
    useEffect(() => {
      const timer = setTimeout(() => {
        if (formData.businessAddress.street && formData.businessAddress.city &&
            formData.businessAddress.state && formData.businessAddress.zip_code) {
          validateAddress(formData.businessAddress)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }, [formData.businessAddress]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Check if address validation failed
    if (addressValidation.isValid === false) {
      setErrors({ address: 'Please enter a valid address' })
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
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Complete your business profile
          </CardTitle>
          <p className="text-gray-600">
            This information helps us customize your experience and ensure compliance with tax regulations.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Business Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-[#7f5efd]" />
                Business Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Business Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className={errors.businessName ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-600">{errors.businessName}</p>
                  )}
                </div>

                {/* Business Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Business Type (Optional)
                  </label>
                  <Select 
                    value={formData.businessType} 
                    onValueChange={(value) => handleInputChange('businessType', value)}
                  >
                    <SelectTrigger>
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
                  <label className="text-sm font-medium text-gray-700">
                    Industry *
                  </label>
                  <Select 
                    value={formData.industry} 
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger className={errors.industry ? 'border-red-300 focus:border-red-500' : ''}>
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
                  <label className="text-sm font-medium text-gray-700">
                    Website (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="www.yourwebsite.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className={errors.website ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600">{errors.website}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Business Description (Optional)
                </label>
                <Textarea
                  placeholder="Briefly describe what your business does..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-[#7f5efd]" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={errors.phoneNumber ? 'border-red-300 focus:border-red-500' : ''}
                    maxLength={14}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    US phone number for support and verification
                  </p>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Timezone
                  </label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => handleInputChange('timezone', value)}
                  >
                    <SelectTrigger>
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-[#7f5efd]" />
                  Business Address
                </h3>
                {addressValidation.isValid !== null && (
                  <Badge 
                    variant={addressValidation.isValid ? "default" : "destructive"}
                    className="flex items-center"
                  >
                    {addressValidation.isValid ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    )}
                    {addressValidation.isValid ? 'Verified' : 'Invalid'}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Street Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Street Address *
                  </label>
                  <Input
                    type="text"
                    placeholder="123 Main Street"
                    value={formData.businessAddress.street}
                    onChange={(e) => handleInputChange('businessAddress.street', e.target.value)}
                    className={errors['businessAddress.street'] ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errors['businessAddress.street'] && (
                    <p className="text-sm text-red-600">{errors['businessAddress.street']}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      City *
                    </label>
                    <Input
                      type="text"
                      placeholder="San Francisco"
                      value={formData.businessAddress.city}
                      onChange={(e) => handleInputChange('businessAddress.city', e.target.value)}
                      className={errors['businessAddress.city'] ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {errors['businessAddress.city'] && (
                      <p className="text-sm text-red-600">{errors['businessAddress.city']}</p>
                    )}
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      State *
                    </label>
                    <Select 
                      value={formData.businessAddress.state} 
                      onValueChange={(value) => handleInputChange('businessAddress.state', value)}
                    >
                      <SelectTrigger className={errors['businessAddress.state'] ? 'border-red-300 focus:border-red-500' : ''}>
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
                      <p className="text-sm text-red-600">{errors['businessAddress.state']}</p>
                    )}
                  </div>

                  {/* ZIP Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      ZIP Code *
                    </label>
                    <Input
                      type="text"
                      placeholder="94105"
                      value={formData.businessAddress.zip_code}
                      onChange={(e) => handleInputChange('businessAddress.zip_code', e.target.value)}
                      className={errors['businessAddress.zip_code'] ? 'border-red-300 focus:border-red-500' : ''}
                      maxLength={10}
                    />
                    {errors['businessAddress.zip_code'] && (
                      <p className="text-sm text-red-600">{errors['businessAddress.zip_code']}</p>
                    )}
                  </div>
                </div>

                {/* Address Validation Status */}
                {addressValidation.isValidating && (
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Validating address...
                  </div>
                )}
                
                {addressValidation.message && !addressValidation.isValidating && (
                  <p className={`text-sm ${addressValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {addressValidation.message}
                  </p>
                )}
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                💡 <strong>Important:</strong> This information will be used for tax reporting and compliance. 
                You can update it later in your profile settings.
              </AlertDescription>
            </Alert>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
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
                disabled={isSubmitting || addressValidation.isValidating}
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

