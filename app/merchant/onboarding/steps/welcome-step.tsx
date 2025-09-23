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
    <div className="max-w-2xl mx-auto max-md:px-1">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm max-md:rounded-2xl max-md:border max-md:border-[#7f5efd]/10 max-md:bg-white">
        <CardHeader className="text-center space-y-6 max-md:space-y-5 max-md:p-6 max-md:text-left">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg max-md:mx-0 max-md:w-16 max-md:h-16">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-3xl font-bold text-gray-900 leading-tight bg-gradient-to-r from-[#7f5efd] to-[#9f7aea] bg-clip-text text-transparent max-md:text-2xl">
              Welcome to Cryptrac
            </CardTitle>
            <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed max-md:text-base max-md:mx-0">
              Let&apos;s get you set up to accept cryptocurrency payments in just 5 easy steps.
              You&apos;ll be accepting crypto in no time!
            </p>
          </div>

          {/* Get Started Button */}
          <div className="pt-2">
            <Button
              onClick={onNext}
              className="bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white py-3 text-base font-semibold px-8 max-md:w-full max-md:justify-center"
              size="lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 max-md:p-6 max-md:space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="flex items-start gap-6 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 hover:from-[#7f5efd]/5 hover:to-[#9f7aea]/5 transition-all duration-300 hover:shadow-lg border border-gray-100 hover:border-[#7f5efd]/20 max-md:flex-col max-md:gap-4 max-md:p-4"
                  style={{
                    animationDelay: `${index * 150}ms`
                  }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd]/10 to-[#9f7aea]/10 rounded-xl flex items-center justify-center border border-[#7f5efd]/20 shadow-sm max-md:w-10 max-md:h-10">
                      <Icon className="w-6 h-6 text-[#7f5efd] max-md:w-5 max-md:h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-snug max-md:text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed max-md:text-xs">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500 max-md:text-[11px]">
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
