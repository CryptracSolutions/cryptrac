"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { 
  ArrowLeft, 
  Link2, 
  DollarSign, 
  Calendar, 
  Infinity,
  QrCode,
  Eye,
  Copy,
  AlertTriangle
} from 'lucide-react'

interface PaymentLinkData {
  title: string
  description: string
  amount: string
  currency: string
  expiresAt: string
  maxUses: string
  acceptedCryptos: string[]
  requireCustomerInfo: boolean
  redirectUrl: string
}

const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł' },
  { code: 'USDT', name: 'Tether', symbol: '₮' },
  { code: 'USDC', name: 'USD Coin', symbol: '$' }
]

export default function CreatePaymentLinkPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<PaymentLinkData>({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    expiresAt: '',
    maxUses: '',
    acceptedCryptos: ['BTC', 'ETH', 'LTC'],
    requireCustomerInfo: false,
    redirectUrl: ''
  })

  const handleInputChange = (field: keyof PaymentLinkData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handleCryptoToggle = (crypto: string) => {
    const newCryptos = formData.acceptedCryptos.includes(crypto)
      ? formData.acceptedCryptos.filter(c => c !== crypto)
      : [...formData.acceptedCryptos, crypto]
    
    handleInputChange('acceptedCryptos', newCryptos)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a valid positive number'
    }

    if (formData.acceptedCryptos.length === 0) {
      newErrors.acceptedCryptos = 'Please select at least one cryptocurrency'
    }

    if (formData.maxUses && (isNaN(Number(formData.maxUses)) || Number(formData.maxUses) <= 0)) {
      newErrors.maxUses = 'Max uses must be a valid positive number'
    }

    if (formData.redirectUrl && !isValidUrl(formData.redirectUrl)) {
      newErrors.redirectUrl = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
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

    try {
      // TODO: Submit to API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock success - redirect to payments page
      router.push('/merchant/dashboard/payments')
    } catch (error) {
      console.error('Failed to create payment link:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePreviewUrl = () => {
    return `https://pay.cryptrac.com/pl_${Math.random().toString(36).substr(2, 9)}`
  }

  const previewUrl = generatePreviewUrl()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Payment Link</h1>
          <p className="text-gray-600 mt-1">
            Create a secure payment link to accept cryptocurrency payments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link2 className="w-5 h-5 mr-2 text-[#7f5efd]" />
                Payment Link Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Website Development Service"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={errors.title ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe what the customer is paying for..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => handleInputChange('amount', e.target.value)}
                          className={`pl-10 ${errors.amount ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Accepted Cryptocurrencies */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Accepted Cryptocurrencies</h3>
                  <p className="text-sm text-gray-600">
                    Select which cryptocurrencies customers can use to pay
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SUPPORTED_CRYPTOS.map((crypto) => {
                      const isSelected = formData.acceptedCryptos.includes(crypto.code)
                      return (
                        <div
                          key={crypto.code}
                          onClick={() => handleCryptoToggle(crypto.code)}
                          className={`
                            p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'border-[#7f5efd] bg-[#7f5efd]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                ${isSelected ? 'bg-[#7f5efd] text-white' : 'bg-gray-100 text-gray-600'}
                              `}>
                                {crypto.symbol}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{crypto.name}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {crypto.code}
                                </Badge>
                              </div>
                            </div>
                            <div className={`
                              w-4 h-4 rounded-full border-2 flex items-center justify-center
                              ${isSelected ? 'border-[#7f5efd] bg-[#7f5efd]' : 'border-gray-300'}
                            `}>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {errors.acceptedCryptos && (
                    <p className="text-sm text-red-600">{errors.acceptedCryptos}</p>
                  )}
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires At
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="datetime-local"
                          value={formData.expiresAt}
                          onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty for no expiration
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Uses
                      </label>
                      <div className="relative">
                        <Infinity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          value={formData.maxUses}
                          onChange={(e) => handleInputChange('maxUses', e.target.value)}
                          className={`pl-10 ${errors.maxUses ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      </div>
                      {errors.maxUses && (
                        <p className="text-sm text-red-600 mt-1">{errors.maxUses}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redirect URL (Optional)
                    </label>
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com/thank-you"
                      value={formData.redirectUrl}
                      onChange={(e) => handleInputChange('redirectUrl', e.target.value)}
                      className={errors.redirectUrl ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {errors.redirectUrl && (
                      <p className="text-sm text-red-600 mt-1">{errors.redirectUrl}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Where to redirect customers after successful payment
                    </p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Hide Preview' : 'Preview'}
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Payment Link'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="w-5 h-5 mr-2 text-[#7f5efd]" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.title ? (
                  <>
                    {/* Payment Link Preview */}
                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{formData.title}</h3>
                      {formData.description && (
                        <p className="text-sm text-gray-600 mb-3">{formData.description}</p>
                      )}
                      {formData.amount && (
                        <div className="text-2xl font-bold text-[#7f5efd] mb-3">
                          ${Number(formData.amount).toLocaleString()} {formData.currency}
                        </div>
                      )}
                      {formData.acceptedCryptos.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {formData.acceptedCryptos.map(crypto => (
                            <Badge key={crypto} variant="secondary" className="text-xs">
                              {crypto}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Link URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Link URL
                      </label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={previewUrl}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(previewUrl)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500">QR Code will be generated</p>
                    </div>

                    {/* Validation Alerts */}
                    {Object.keys(errors).length > 0 && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Please fix the errors above to create your payment link.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Fill out the form to see a preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

