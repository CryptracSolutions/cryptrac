'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { QRCode } from '@/app/components/ui/qr-code'
import { supabase } from '@/lib/supabase-browser'
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Users, 
  ExternalLink, 
  Copy, 
  Link2, 
  QrCode, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface FormData {
  title: string
  description: string
  amount: string
  currency: string
  acceptedCryptos: string[]
  expiresAt: string
  maxUses: string
  redirectUrl: string
}

interface FormErrors {
  [key: string]: string
}

interface CreatedPaymentLink {
  id: string
  link_id: string
  title: string
  description: string
  amount: number
  currency: string
  payment_url: string
  qr_code_data: string
  metadata?: {
    fee_amount?: number
    fee_percentage?: number
    total_amount?: number
  }
}

const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł' },
  { code: 'USDT', name: 'Tether', symbol: '₮' },
  { code: 'USDC', name: 'USD Coin', symbol: '$' }
]

export default function CreatePaymentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    acceptedCryptos: ['BTC', 'ETH'],
    expiresAt: '',
    maxUses: '',
    redirectUrl: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [createdPaymentLink, setCreatedPaymentLink] = useState<CreatedPaymentLink | null>(null)
  const [copied, setCopied] = useState(false)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCryptoToggle = (crypto: string) => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptos: prev.acceptedCryptos.includes(crypto)
        ? prev.acceptedCryptos.filter(c => c !== crypto)
        : [...prev.acceptedCryptos, crypto]
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number'
    }

    if (formData.acceptedCryptos.length === 0) {
      newErrors.acceptedCryptos = 'At least one cryptocurrency must be selected'
    }

    if (formData.redirectUrl && !isValidUrl(formData.redirectUrl)) {
      newErrors.redirectUrl = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
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
      console.log('Creating payment link...')
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('No valid session')
      }

      const requestData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        accepted_cryptos: formData.acceptedCryptos,
        expires_at: formData.expiresAt || null,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
        redirect_url: formData.redirectUrl || null
      }

      console.log('Sending request data:', requestData)

      // Submit to API
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to create payment link')
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('Payment link created successfully:', result.payment_link.id)
        
        // Construct the proper payment URL
        const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${result.payment_link.link_id}`
        
        setCreatedPaymentLink({
          ...result.payment_link,
          payment_url: paymentUrl
        })
      } else {
        throw new Error(result.error || 'Failed to create payment link')
      }
    } catch (error) {
      console.error('Failed to create payment link:', error)
      setErrors({ submit: 'Failed to create payment link. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  // If payment link was created successfully, show success page
  if (createdPaymentLink) {
    const feeAmount = createdPaymentLink.metadata?.fee_amount || 0
    const feePercentage = createdPaymentLink.metadata?.fee_percentage || 2.5
    const totalAmount = createdPaymentLink.metadata?.total_amount || createdPaymentLink.amount

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Link Created!</h1>
          <p className="text-gray-600">Your payment link is ready to share with customers</p>
        </div>

        {/* Payment Link Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link2 className="h-5 w-5" />
              <span>{createdPaymentLink.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount and Description */}
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(createdPaymentLink.amount, createdPaymentLink.currency)}
              </div>
              {createdPaymentLink.description && (
                <p className="text-gray-600">{createdPaymentLink.description}</p>
              )}
              
              {/* Fee Breakdown */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fee Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span>{formatCurrency(createdPaymentLink.amount, createdPaymentLink.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee ({feePercentage.toFixed(1)}%):</span>
                    <span>{formatCurrency(feeAmount, createdPaymentLink.currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(totalAmount, createdPaymentLink.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment URL
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
                  {createdPaymentLink.payment_url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdPaymentLink.payment_url)}
                >
                  {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(createdPaymentLink.payment_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                QR Code
              </label>
              <div className="flex justify-center">
                <QRCode 
                  value={createdPaymentLink.payment_url} 
                  size={200}
                  className="border border-gray-200"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Customers can scan this QR code to access the payment link
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.push('/merchant/dashboard/payments')}
            className="flex-1"
          >
            View All Payment Links
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setCreatedPaymentLink(null)
              setFormData({
                title: '',
                description: '',
                amount: '',
                currency: 'USD',
                acceptedCryptos: ['BTC', 'ETH'],
                expiresAt: '',
                maxUses: '',
                redirectUrl: ''
              })
            }}
            className="flex-1"
          >
            Create Another Link
          </Button>
        </div>
      </div>
    )
  }

  const generatePreviewUrl = () => {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/pl_preview`
  }

  const previewUrl = generatePreviewUrl()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/merchant/dashboard/payments')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Payment Link</h1>
          <p className="text-gray-600 mt-1">
            Create a secure payment link to accept cryptocurrency payments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Link Details</CardTitle>
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
                      placeholder="e.g., Product Purchase, Service Payment"
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
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          value={formData.maxUses}
                          onChange={(e) => handleInputChange('maxUses', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum number of payments allowed
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redirect URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://yoursite.com/success"
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
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#7f5efd] hover:bg-[#6d4fd8]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Payment Link'
                    )}
                  </Button>
                </div>

                {/* Error Display */}
                {errors.submit && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {errors.submit}
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {showPreview && formData.title && formData.amount ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{formData.title}</h3>
                      {formData.description && (
                        <p className="text-gray-600 mt-1">{formData.description}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(parseFloat(formData.amount || '0'), formData.currency)}
                      </span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment URL</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                          {previewUrl}
                        </code>
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

                    {/* QR Code Preview */}
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
                  </div>
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
  )
}

