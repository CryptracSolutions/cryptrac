"use client"

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
    walletType: 'generate' | 'existing'
    wallets: Record<string, string>
    mnemonic?: string
  }
  paymentConfig: {
    acceptedCryptos: string[]
    feePercentage: number
    autoForward: boolean
    autoConvert: boolean
    preferredPayoutCurrency: string | null
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
      walletType: 'generate',
      wallets: {}
    },
    paymentConfig: {
      acceptedCryptos: ['BTC', 'ETH', 'LTC'],
      feePercentage: 2.9,
      autoForward: true,
      autoConvert: false,
      preferredPayoutCurrency: null
    }
  })

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('cryptrac_onboarding_progress')
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        setCurrentStep(parsed.step || 1)
        setOnboardingData(parsed.data || {
          businessInfo: {
            businessName: '',
            website: '',
            industry: '',
            description: ''
          },
          walletConfig: {
            walletType: 'generate',
            wallets: {}
          },
          paymentConfig: {
            acceptedCryptos: ['BTC', 'ETH', 'LTC'],
            feePercentage: 2.9,
            autoForward: true
          }
        })
      } catch (error) {
        console.error('Failed to load onboarding progress:', error)
      }
    }
  }, [])

  // Save progress to localStorage
  const saveProgress = (step: number, data: OnboardingData) => {
    localStorage.setItem('cryptrac_onboarding_progress', JSON.stringify({
      step,
      data
    }))
  }

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      saveProgress(nextStep, onboardingData)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      saveProgress(prevStep, onboardingData)
    }
  }

  const handleStepComplete = (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...onboardingData, ...stepData }
    setOnboardingData(updatedData)
    saveProgress(currentStep, updatedData)
  }

  const handleFinishOnboarding = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Save onboarding data to Supabase
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear saved progress
      localStorage.removeItem('cryptrac_onboarding_progress')
      
      // Redirect to dashboard
      router.push('/merchant/dashboard')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setError('Failed to complete onboarding. Please try again.')
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Logo className="h-8" />
            <div className="text-sm text-gray-500">
              Step {currentStep} of {ONBOARDING_STEPS.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-8">
          <Stepper 
            steps={ONBOARDING_STEPS}
            currentStep={currentStep}
            orientation="horizontal"
            className="hidden md:flex"
          />
          
          {/* Mobile Progress Bar */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {ONBOARDING_STEPS[currentStep - 1]?.title}
              </h2>
              <span className="text-sm text-gray-500">
                {currentStep}/{ONBOARDING_STEPS.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#7f5efd] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="relative">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}

