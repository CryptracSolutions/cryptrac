"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { ArrowRight, ArrowLeft, Building2, Globe, Tag, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface BusinessInfoData {
  businessName: string
  website: string
  industry: string
  description: string
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

export default function BusinessInfoStep({ data, onComplete, onPrevious }: BusinessInfoStepProps) {
  const [formData, setFormData] = useState<BusinessInfoData>(data)
  const [errors, setErrors] = useState<Partial<BusinessInfoData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<BusinessInfoData> = {}

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select an industry'
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
    
    // Clean up website URL
    let cleanWebsite = formData.website.trim()
    if (cleanWebsite && !cleanWebsite.startsWith('http')) {
      cleanWebsite = `https://${cleanWebsite}`
    }

    const cleanedData = {
      ...formData,
      website: cleanWebsite,
      businessName: formData.businessName.trim(),
      description: formData.description.trim()
    }

    onComplete(cleanedData)
    setIsSubmitting(false)
  }

  const handleInputChange = (field: keyof BusinessInfoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Tell us about your business
          </CardTitle>
          <p className="text-gray-600">
            This information helps us customize your payment experience and ensure compliance.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Building2 className="w-4 h-4 mr-2 text-[#7f5efd]" />
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

            {/* Website */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Globe className="w-4 h-4 mr-2 text-[#7f5efd]" />
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
              <p className="text-xs text-gray-500">
                This helps customers recognize your business
              </p>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Tag className="w-4 h-4 mr-2 text-[#7f5efd]" />
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

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 mr-2 text-[#7f5efd]" />
                Business Description (Optional)
              </label>
              <Textarea
                placeholder="Briefly describe what your business does..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Help customers understand your business better
              </p>
            </div>

            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                💡 <strong>Tip:</strong> Accurate business information helps build trust with your customers 
                and may be required for compliance purposes.
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

