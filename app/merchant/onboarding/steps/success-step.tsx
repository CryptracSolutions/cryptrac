"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { CheckCircle, ArrowRight, Share2, Twitter, Facebook, Linkedin, Instagram } from 'lucide-react'
import { LoadingSpinner } from '@/app/components/ui/loading-spinner'

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
    autoForward: boolean
  }
}

interface SuccessStepProps {
  onboardingData: OnboardingData
  onFinish: () => void
  isLoading: boolean
}

export default function SuccessStep({ onboardingData, onFinish, isLoading }: SuccessStepProps) {
  const { businessInfo } = onboardingData

  const shareMessage = `🚀 ${businessInfo.businessName} is now accepting crypto payments via Cryptrac!`

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}%20${encodeURIComponent('https://cryptrac.com')}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cryptrac.com')}&quote=${encodeURIComponent(shareMessage)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cryptrac.com')}&summary=${encodeURIComponent(shareMessage)}`,
    instagram: `https://www.instagram.com/?url=${encodeURIComponent('https://cryptrac.com')}`
  }

  const handleShare = (platform: string) => {
    const url = shareLinks[platform as keyof typeof shareLinks]
    window.open(url, '_blank', 'width=600,height=400')
  }


  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-medium border-0 bg-white relative overflow-hidden">

        <CardHeader className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-3xl font-bold text-gray-900 leading-tight">
              Congratulations!
            </CardTitle>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
              Your Cryptrac account is ready to accept cryptocurrency payments!
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Go To Dashboard Button */}
          <div className="pt-2">
            <Button
              onClick={onFinish}
              disabled={isLoading}
              className="w-full bg-[#7f5efd] hover:bg-[#7f5efd]/90 text-white py-3 text-base font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-5 h-5 mr-2" />
                  Setting up your account...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* What's Next */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <ArrowRight className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-4">
                  <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                    What&apos;s next?
                  </CardTitle>
                  <div className="space-y-3 text-sm text-gray-700 max-w-md mx-auto">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-[#7f5efd] rounded-full flex-shrink-0"></div>
                      <span>Create your first payment link</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-[#7f5efd] rounded-full flex-shrink-0"></div>
                      <span>Generate QR codes for in-person payments</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-[#7f5efd] rounded-full flex-shrink-0"></div>
                      <span>Monitor your payments in real-time</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-[#7f5efd] rounded-full flex-shrink-0"></div>
                      <span>Track your earnings and analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Share Your Achievement */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-4">
                  <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                    Share Your Achievement!
                  </CardTitle>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                    Let the world know that {businessInfo.businessName} is now accepting cryptocurrency payments
                  </p>

                  <div className="flex flex-wrap justify-center gap-3 pt-4">
                    <Button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="hidden sm:inline">Twitter</span>
                    </Button>

                    <Button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 bg-[#4267B2] hover:bg-[#4267B2]/90 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      <Facebook className="w-4 h-4" />
                      <span className="hidden sm:inline">Facebook</span>
                    </Button>

                    <Button
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-2 bg-[#2867B2] hover:bg-[#2867B2]/90 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="hidden sm:inline">LinkedIn</span>
                    </Button>

                    <Button
                      onClick={() => handleShare('instagram')}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      <Instagram className="w-4 h-4" />
                      <span className="hidden sm:inline">Instagram</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  )
}

