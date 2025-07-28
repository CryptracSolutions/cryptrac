'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stepper } from '@/app/components/ui/stepper'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Logo } from '@/app/components/ui/logo'

// Import step components
import WelcomeStep from './steps/welcome-step'
import BusinessInfoStep from './steps/business-info-step'
import WalletSetupStep from './steps/wallet-setup-step'
import PaymentConfigStep from './steps/payment-config-step'
import SuccessStep from './steps/success-step'

const ONBOARDING_STEPS = [
  { id: 1, title: 'Welcome', description: 'Get started with Cryptrac' },
  { id: 2, title: 'Business Info', description: 'Tell us about your business' },
  { id: 3, title: 'Wallet Setup', description: 'Configure your crypto wallets' },
  { id: 4, title: 'Payment Config', description: 'Set up payment preferences' },
  { id: 5, title: 'Complete', description: 'You\'re ready to go!' }
]

interface OnboardingData {
  businessInfo: {
    businessName: string
    website: string
    industry: string
    description: string
  }
  walletConfig: {
    wallets: Record<string, string>
    wallet_generation_method: string
    walletType: 'generate' | 'existing'
    mnemonic?: string
    selectedCurrencies?: string[]
  }
  paymentConfig: {
    acceptedCryptos: string[]
    feePercentage: number
    autoForward: boolean
    autoConvert: boolean
    preferredPayoutCurrency: string | null
    chargeCustomerFee: boolean
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessInfo: {
      businessName: '',
      website: '',
      industry: '',
      description: ''
    },
    walletConfig: {
      wallets: {},
      wallet_generation_method: 'trust_wallet',
      walletType: 'existing',
      selectedCurrencies: []
    },
    paymentConfig: {
      acceptedCryptos: [],
      feePercentage: 2.5,
      autoForward: false,
      autoConvert: false,
      preferredPayoutCurrency: null,
      chargeCustomerFee: false
    }
  })

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepComplete = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }))
  }

  const handleFinishOnboarding = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Submit onboarding data to API
      const response = await fetch('/api/merchants/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to complete onboarding')
      }

      // Redirect to dashboard
      router.push('/merchant/dashboard')

    } catch (error) {
      console.error('Onboarding error:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <BusinessInfoStep
            data={onboardingData.businessInfo}
            onComplete={(data) => {
              handleStepComplete({ businessInfo: data })
              handleNext()
            }}
            onPrevious={handlePrevious}
          />
        )
      case 3:
        return (
          <WalletSetupStep
            data={onboardingData.walletConfig}
            onComplete={(data) => {
              handleStepComplete({ walletConfig: data })
              handleNext()
            }}
            onPrevious={handlePrevious}
          />
        )
      case 4:
        return (
          <PaymentConfigStep
            data={onboardingData.paymentConfig}
            onComplete={(data) => {
              handleStepComplete({ paymentConfig: data })
              handleNext()
            }}
            onPrevious={handlePrevious}
          />
        )
      case 5:
        return (
          <SuccessStep
            onboardingData={onboardingData}
            onFinish={handleFinishOnboarding}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7f5efd]/5 to-[#9f7aea]/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Cryptrac
          </h1>
          <p className="text-gray-600">
            Let's get your crypto payment system set up in just a few steps
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="max-w-4xl mx-auto mb-8">
          <Stepper
            steps={ONBOARDING_STEPS}
            currentStep={currentStep}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Current Step Content */}
        <div className="max-w-2xl mx-auto">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}

