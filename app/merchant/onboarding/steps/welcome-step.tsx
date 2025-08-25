"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { ArrowRight, Shield, Zap, Globe, DollarSign, Users } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: Shield,
      title: 'Non-Custodial Security',
      description: 'You hold your keys - we never touch your funds'
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Accept Bitcoin, Ethereum, and more cryptocurrencies'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Accept payments from customers worldwide'
    },
    {
      icon: DollarSign,
      title: 'Transparent Fees',
      description: 'Cryptrac Gateway Fee: 0.5% (no conversion), 1% (auto-convert enabled)'
    }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-medium border-0 bg-white">
        <CardHeader className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <CardTitle className="heading-lg text-gray-900">
              Welcome to Cryptrac
            </CardTitle>
            <p className="text-body text-gray-600 max-w-md mx-auto">
              Let&apos;s get you set up to accept cryptocurrency payments in just 5 easy steps. 
              You&apos;ll be accepting crypto in no time!
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="flex items-start gap-6 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[#7f5efd]/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#7f5efd]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* What to Expect */}
          <div className="bg-gradient-to-r from-[#7f5efd]/5 to-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">What to expect:</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-6 h-6 bg-[#7f5efd] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span className="text-sm text-gray-700">Tell us about your business</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-6 h-6 bg-[#7f5efd] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <span className="text-sm text-gray-700">Set up your crypto wallets</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-6 h-6 bg-[#7f5efd] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <span className="text-sm text-gray-700">Configure payment preferences</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-6 h-6 bg-[#7f5efd] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">4</span>
                </div>
                <span className="text-sm text-gray-700">Start accepting crypto payments!</span>
              </div>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              ⏱️ This should take about 5-10 minutes to complete
            </p>
          </div>

          {/* Get Started Button */}
          <Button 
            onClick={onNext}
            className="w-full bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white py-3 text-base font-semibold"
            size="lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@cryptrac.com" className="text-[#7f5efd] hover:underline">
                support@cryptrac.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

